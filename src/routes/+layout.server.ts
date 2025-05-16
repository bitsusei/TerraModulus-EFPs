import { error } from "@sveltejs/kit";
import fs from "fs";
import { DOMParser, XMLSerializer, Node, Element } from '@xmldom/xmldom'
import os from "os";
import dedent from "dedent-js";
import hljs from 'highlight.js';

const filterChildElementNodeName = (node: Node, name: string) => {
	return node.childNodes.filter(n => n.nodeName === name && n.nodeType == Node.ELEMENT_NODE) as Element[];
}

const rootDoc = new DOMParser().parseFromString('<root></root>', 'text/xml');

const recreateElementAs = (element: Element, newName: string, processor?: (node: Node) => Node) => {
	const ele = rootDoc.createElement(newName);
	Array.from(element.attributes).forEach(attr => {
		ele.setAttributeNode(attr);
	});
	Array.from(element.childNodes).forEach(child => {
		ele.appendChild(processor === undefined ? child : processor(child));
	});
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

const convertHtml = (element: Element) => {
	// Simple renaming
	const renameMap: Record<string, string> = {
		"code-block": "pre"
	}
	let ele = element;
	if (Object.keys(renameMap).includes(element.nodeName)) {
		ele = recreateElementAs(element, renameMap[element.nodeName]);
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
			filterChildElementNodeName(ele, "li").forEach(n => {
				const dt = rootDoc.createElement("dt");
				dt.textContent = n.getAttribute("title")!;
				ele.insertBefore(n, dt);
				const dd = rootDoc.createElement("dd");
				Array.from(element.childNodes).forEach(child => {
					dd.appendChild(child.nodeType === Node.ELEMENT_NODE ? convertHtml(child as Element) : child);
				});
				ele.insertBefore(n, dd);
				ele.removeChild(n);
			});
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

			Array.from(element.childNodes).forEach(child => {
				ls.appendChild(child.nodeType === Node.ELEMENT_NODE ? convertHtml(child as Element) : child);
			});

			ele = ls;
			break;
		// Default behavior of links
		case "a":
			if (!ele.hasAttribute("target")) {
				// in a new window or tab
				ele.setAttribute("target", "_blank");
			}
		default:
			if (!Object.keys(renameMap).includes(element.nodeName)) {
				Array.from(ele.childNodes).forEach(child => {
					if (child.nodeType === Node.ELEMENT_NODE) {
						const n = convertHtml(child as Element);
						if (n !== child)
							ele.replaceChild(n, child);
					}
				});
			}
			break;
	}

	return ele;
}

/** Ugly though */
const linkLogoSvg = fs.readFileSync("src/lib/assets/icons/link.svelte", "utf-8");

const compileSection = (element: Element, levels: number[], table: Partial<TableOfContentElement>) => {
	const title = element.attributes.getNamedItem("title")!.value;
	table.header = title;
	table.id = `section-${ levels.join("-") }`;
	const ctn: Element | undefined = filterChildElementNodeName(element, "content")[0];
	let ctnOut: string = "";
	if (ctn !== undefined) {
		ctnOut = new XMLSerializer().serializeToString(recreateElementAs(ctn, "div", n => (
			n.nodeType === Node.ELEMENT_NODE ? convertHtml(n as Element) : n
		)));
	}

	let sectionsOut: string = "";
	let i = 0;
	for (const section of filterChildElementNodeName(element, "section")) {
		if (table.tree == undefined) table.tree = [];
		const element = {};
		sectionsOut += compileSection(section, levels.concat(i++), element);
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
}

type TableOfContentElement = Omit<App.TableOfContents["tree"][0], "tree"> & { tree?: TableOfContentElement[] };

const compileBody = (element: Element, table: TableOfContentElement[]) => {
	let out = "";
	filterChildElementNodeName(element, "section").forEach((n, i) => {
		const element = {};
		out += compileSection(n, [i], element);
		table.push(element as TableOfContentElement);
	});
	return out;
}

export async function load(): Promise<App.EfpList> {
	const list: App.EfpList = {
		indexMap: {},
		map: {},
		indices: [],
		searchEntries: [],
	};
	for (const d of fs.readdirSync("efp")) {
		let main: App.EfpData | undefined;
		const subpages: App.EfpEntry["subpages"] = {};
		const assets: App.EfpEntry["assets"] = [];
		for (const dd of fs.readdirSync(`efp/${d}`)) {
			if (dd.endsWith(".xml")) {
				// type sectionType = {
				// 	$: {
				// 		title: string,
				// 	},
				// 	content: any[],
				// 	section?: [sectionType, ...sectionType[]],
				// };
				// type referenceType = {
				// 	title: [{}]
				// };
				// const xmlContent: {
				// 	efp: {
				// 		"$": {
				// 			efp: string,
				// 			created: string,
				// 			category: string,
				// 			status: string,
				// 			title: string,
				// 		},
				// 		metadata: [{
				// 			pullRequests: [{
				// 				pullRequest: [{
				// 					"$": {
				// 						id: string
				// 					}
				// 				}]
				// 			}, ...{
				// 				pullRequest: [{
				// 					"$": {
				// 						id: string
				// 					}
				// 				}]
				// 			}[]],
				// 			obsoletedBy?: [string, ...string[]],
				// 			obsoletes?: [string, ...string[]],
				// 			updatedBy?: [string, ...string[]],
				// 			updates?: [string, ...string[]],
				// 		}],
				// 		body: [{
				// 			section: [sectionType, ...sectionType[]],
				// 			namedReference?: [{
				// 				reference: [{
				// 				}]
				// 			}]
				// 		}],
				// 	}
				// } = await parseStringPromise(fs.readFileSync(`efp/${d}/${dd}`, 'utf-8'));
				/** Due to the inability of finding a usable package for XSD typing analysis, this is done. */
				const doc = filterChildElementNodeName(new DOMParser().parseFromString(fs.readFileSync(`efp/${d}/${dd}`, 'utf-8')
					.replaceAll(`\\${os.EOL}[ \t]*`, ""), "text/xml"), "efp")[0] as Element;
				const table: TableOfContentElement[] = [];
				const metadata = filterChildElementNodeName(doc, "metadata")[0];
				const efp: App.EfpData = {
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
					body: compileBody(filterChildElementNodeName(doc, "body")[0], table),
					tableOfContents: { tree: table as App.TableOfContents["tree"] },
				}
				if (dd === "main.xml") {
					main = efp;
				} else {
					subpages[dd.substring(0, dd.length - 4)] = efp;
				}
			} else {
				assets.push(dd);
			}
		}

		if (main === undefined) {
			error(500, `main.xml not found for \`${d}\``);
		}

		list.indexMap[main.id] = d;
		list.indices.push(main.id);
		list.searchEntries.push({
			id: main.id,
			title: main.title,
			content: main.body.replaceAll(/<[^>]+>/g, "")
				.replaceAll(/[^\S\n]+/g, " ")
				.replaceAll(/[^\S\n]*\n[^\S\n]*/g, "\n")
				.trim(),
			created: main.created,
			category: main.category,
			status: main.status,
			obsoletedBy: main.obsoletedBy,
			updatedBy: main.updatedBy,
			obsoletes: main.obsoletes,
			updates: main.updates,
			pullRequests: main.pullRequests,
		});
		list.map[d] = {
			main,
			subpages,
			assets,
		};
	}

	return list;
}
