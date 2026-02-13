import { error } from "@sveltejs/kit";
import fs from "fs";
import { DOMParser, XMLSerializer, Node, Element } from '@xmldom/xmldom'
import dedent from "dedent-js";
import hljs from 'highlight.js';
import path from "path";
import IconImg from '$lib/assets/icons/link.svg';

const filterChildElementNodeName = (node: Node, name: string) => {
	return node.childNodes.filter(n => n.nodeName === name && n.nodeType == Node.ELEMENT_NODE) as Element[];
}

const rootDoc = new DOMParser().parseFromString('<root></root>', 'text/xml');

const recreateElementAs = async (element: Element, newName: string, processor?: (node: Node) => Promise<Node>) => {
	const ele = rootDoc.createElement(newName);
	Array.from(element.attributes).forEach(attr => {
		ele.setAttributeNode(attr);
	});
	for (const child of Array.from(element.childNodes)) {
		ele.appendChild(processor === undefined ? child : await processor(child));
	}
	return ele;
}

function getTextNodes(node: Node) {
  let textNodes: Node[] = [];
  if (node.nodeType === Node.TEXT_NODE) {
    textNodes.push(node);
  } else {
    Array.from(node.childNodes).forEach(child => {
      textNodes.push(...getTextNodes(child));
    });
  }
  return textNodes;
}

function dedentElementText(element: Element) {
	// Assume only one line per node.
  const textNodes = getTextNodes(element);
  const commonIndent = textNodes.reduce<number | null>((p, n) => {
		if (n.nodeValue !== null && n.nodeValue.startsWith("\n")) {
			const nn = n.nodeValue.substring(1).match(/^(\s*)/)![0].length;
			return (p === null || nn < p) ? nn : p;
		} else {
			return p;
		}
	}, null);
	if (commonIndent === null) return;
  textNodes.forEach(node => {
		if (node.nodeValue?.startsWith("\n")) {
			node.nodeValue = "\n" + node.nodeValue.substring(1 + commonIndent);
		}
  });
}

const convertHtml = async (resolver: EfpPathResolver, element: Element) => {
	// Simple renaming
	const renameMap: Record<string, string> = {
		"code-block": "pre"
	}
	let ele = element;
	if (Object.keys(renameMap).includes(element.nodeName)) {
		ele = await recreateElementAs(element, renameMap[element.nodeName]);
	}

	switch (element.nodeName) {
		// Special treatment for codeblock
		case "code-block":
			dedentElementText(ele);
			if (ele.hasAttribute("lang")) {
				ele = new DOMParser().parseFromString(dedent(`<pre><code>
					${ hljs.highlight(ele.textContent!, { language: ele.getAttribute("lang")! }).value }
				</code></pre>`), 'text/xml').firstChild as Element;
			}
			break;
		// Description list conversion
		case "dl":
			for (const n of filterChildElementNodeName(ele, "li")) {
				const dt = rootDoc.createElement("dt");
					dt.textContent = n.getAttribute("title")!;
					ele.insertBefore(n, dt);
					const dd = rootDoc.createElement("dd");
					for (const child of Array.from(element.childNodes)) {
						dd.appendChild(child.nodeType === Node.ELEMENT_NODE ? await convertHtml(resolver, child as Element) : child);
					}
					ele.insertBefore(n, dd);
					ele.removeChild(n);
			}
			break;
		// (Un)ordered List conversion
		case "list":
			let listType: string;
			switch (ele.getAttribute("type")) {
				case "decimal":
				case "lower-alpha":
					listType = "ol";
					break;
				default: // bullet or none
					listType = "ul"
					break;
			}

			const ls = rootDoc.createElement(listType);
			switch (ele.getAttribute("type")) {
				case "decimal":
					ls.setAttribute("class", "list-decimal");
					break;
				case "none":
					ls.setAttribute("class", "list-none");
					break;
				case "lower-alpha":
					ls.setAttribute("class", "list-[lower-alpha]");
					break;
				default: // bullet
					ls.setAttribute("class", "list-disc");
					break;
			}

			for (const child of Array.from(element.childNodes)) {
				ls.appendChild(child.nodeType === Node.ELEMENT_NODE ? await convertHtml(resolver, child as Element) : child);
			}

			ele = ls;
			break;
		case "embed":
			const container = rootDoc.createElement("div");
			container.setAttribute("class", "embed-container");
			element.setAttribute("src", await resolver.resolveAsset(element.getAttribute("src")!))
			container.appendChild(element);
			ele = container;
			break;
		// Default behavior of links
		case "a":
			const href = ele.getAttribute("href")!;
			if (href.startsWith(".")) element.setAttribute("href", resolver.resolveLink(href));
			if (!ele.hasAttribute("target")) {
				// in a new window or tab
				ele.setAttribute("target", href.startsWith(".") ? "_self" : "_blank");
			}
		default:
			if (!Object.keys(renameMap).includes(element.nodeName)) {
				for (const child of Array.from(ele.childNodes)) {
					if (child.nodeType === Node.ELEMENT_NODE) {
						const n = await convertHtml(resolver, child as Element);
						if (n !== child)
							ele.replaceChild(n, child);
					}
				}
			}
			break;
	}

	return ele;
};

/** Ugly though */
const linkLogoSvg = decodeURI(IconImg.substring(IconImg.indexOf(",") + 1));

const compileSection = async (resolver: EfpPathResolver, element: Element, levels: number[], table: Partial<TableOfContentElement>) => {
	const title = element.attributes.getNamedItem("title")!.value;
	table.header = title;
	table.id = `section-${ levels.join("-") }`;
	const ctn: Element | undefined = filterChildElementNodeName(element, "content")[0];
	let ctnOut: string = "";
	if (ctn !== undefined) {
		ctnOut = new XMLSerializer().serializeToString(await recreateElementAs(ctn, "div", async n => (
			n.nodeType === Node.ELEMENT_NODE ? await convertHtml(resolver, n as Element) : n
		)));
	}

	let sectionsOut: string = "";
	let i = 0;
	for (const section of filterChildElementNodeName(element, "section")) {
		if (table.tree == undefined) table.tree = [];
		const element = {};
		sectionsOut += await compileSection(resolver, section, levels.concat(i++), element);
		table.tree.push(element as TableOfContentElement);
	}

	return dedent(`
		<div class="section-header" id="${table.id}">
			<h${ levels.length + 1 }>${title}</h${ levels.length + 1 }>
			<a class="hover-link" href="#${table.id}">
				${ linkLogoSvg.replace("class={$$props.class}", "") }
			</a>
		</div>
		<div>
			${ctnOut}
			${sectionsOut}
		</div>
	`)
};

type TableOfContentElement = Omit<App.TableOfContents["tree"][0], "tree"> & { tree?: TableOfContentElement[] };

const compileBody = async (resolver: EfpPathResolver, element: Element, table: TableOfContentElement[]) => {
	let out = "";
	const l = filterChildElementNodeName(element, "section");
	for (let i = 0; i < l.length; ++i) {
		const element = {};
		out += await compileSection(resolver, l[i], [i], element);
		table.push(element as TableOfContentElement);
	}
	return out;
};

interface EfpPathResolver {
	/** Resolves EFP assets. */
	resolveAsset(path: string): Promise<string>;
	/** Resolves relative links. */
	resolveLink(path: string): string;
}

export class BookEfpPathResolver implements EfpPathResolver {
	private key: string;
	constructor(key: string) { this.key = key; }
	resolveAsset(p: string) {
		return Promise.resolve(path.posix.join(this.key, p));
	}
	resolveLink(p: string): string {
		return path.posix.join(this.key, p);
	}
}

export interface PreviewEfpAssetFetcher {
	/** Fetches an asset to return Base64-encoded data URL. */
	fetchAsset(path: string): Promise<string>;
}

export class PreviewEfpPathResolver implements EfpPathResolver {
	private fetcher: PreviewEfpAssetFetcher;
	constructor(fetcher: PreviewEfpAssetFetcher) { this.fetcher = fetcher; }
	async resolveAsset(p: string) {
		// data scheme URL is to be returned
		return await this.fetcher.fetchAsset(p);
	}
	resolveLink(p: string): string { // Yet, those links are expected to be starting with ../
		return concatAndResolveUrl("placeholder", p);
	}
}

// Source: https://stackoverflow.com/a/2676231
export function concatAndResolveUrl(url: string, concat: string) {
  var url1 = url.split('/');
  var url2 = concat.split('/');
  var url3 = [ ];
  for (var i = 0, l = url1.length; i < l; i ++) {
    if (url1[i] == '..') {
      url3.pop();
    } else if (url1[i] == '.') {
      continue;
    } else {
      url3.push(url1[i]);
    }
  }
  for (var i = 0, l = url2.length; i < l; i ++) {
    if (url2[i] == '..') {
      url3.pop();
    } else if (url2[i] == '.') {
      continue;
    } else {
      url3.push(url2[i]);
    }
  }
  return url3.join('/');
}

export const parseEfp = async (resolver: EfpPathResolver, src: string) => {
	const doc = filterChildElementNodeName(new DOMParser().parseFromString(src.replaceAll(`\\(\r\n|\r|\n)[ \t]*`, ""), "text/xml"), "efp")[0] as Element;
	const table: TableOfContentElement[] = [];
	const metadata = filterChildElementNodeName(doc, "metadata")[0];
	return {
		id: parseInt(doc.attributes.getNamedItem("efp")!.value),
		created: new Date(doc.attributes.getNamedItem("created")!.value),
		category: doc.attributes.getNamedItem("category")!.value as App.EfpData["category"],
		status: doc.attributes.getNamedItem("status")!.value as App.EfpData["status"],
		title: doc.attributes.getNamedItem("title")!.value,
		obsoletedBy: filterChildElementNodeName(metadata, "obsoletedBy")
			.flatMap(n => filterChildElementNodeName(n, "efp").map(n => n.nodeValue as string)),
		updatedBy: filterChildElementNodeName(metadata, "updatedBy")
			.flatMap(n => filterChildElementNodeName(n, "efp").map(n => n.nodeValue as string)),
		obsoletes: filterChildElementNodeName(metadata, "obsoletes")
			.flatMap(n => filterChildElementNodeName(n, "efp").map(n => n.nodeValue as string)),
		updates: filterChildElementNodeName(metadata, "updates")
			.flatMap(n => filterChildElementNodeName(n, "efp").map(n => n.nodeValue as string)),
		pullRequests: filterChildElementNodeName(filterChildElementNodeName(metadata, "pullRequests")[0], "pullRequest")
			.map(n => n.attributes.getNamedItem("id")!.value) as App.EfpData["pullRequests"],
		body: await compileBody(resolver, filterChildElementNodeName(doc, "body")[0], table),
		tableOfContents: { tree: table as App.TableOfContents["tree"] },
	} as App.EfpData;
};
