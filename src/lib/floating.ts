
import { computePosition, autoUpdate, offset, flip, shift, arrow, type ComputePositionConfig, type Placement } from "@floating-ui/dom";

export interface FloatingHelperParams<E extends HTMLElement> {
	selectAnchor(host: E): HTMLElement;
	placement?: Placement;
	offset?: number;
	shift?: number;
	flip?: true;
	arrow?: { selectElement(host: E): HTMLElement, padding?: number };
}

export class FloatingHelper<E extends HTMLElement> {
	private state: (() => void) | null = null;

	constructor(
		public readonly host: E,
		private readonly params: FloatingHelperParams<E>
	) {}

	start() {
		if (this.state !== null) throw new Error("Illegal State: FloatingHelper has already started.");
		const anchor = this.params.selectAnchor(this.host);
		const middleware: ComputePositionConfig["middleware"] = [];
		if (this.params.offset !== undefined) middleware.push(offset(this.params.offset));
		if (this.params.flip !== undefined) middleware.push(flip());
		if (this.params.shift !== undefined) middleware.push(shift({
			mainAxis: true,
			crossAxis: true,
			padding: this.params.shift,
		}));
		let arrowElement: HTMLElement | undefined = undefined;
		if (this.params.arrow !== undefined) {
			arrowElement = this.params.arrow.selectElement(this.host);
			middleware.push(arrow({
				element: arrowElement,
				padding: this.params.arrow.padding,
			}));
		}

		this.state = autoUpdate(anchor, this.host, () => {
			computePosition(anchor, this.host, {
				placement: this.params.placement,
				middleware,
			}).then(({ x, y, placement, middlewareData }) => {
				this.host.style.top = `${y}px`;
				this.host.style.left = `${x}px`;
				if (middlewareData.arrow !== undefined) {
					const { x, y } = middlewareData.arrow;
					arrowElement!.style.top = y != null ? `${y}px` : "";
					arrowElement!.style.left = x != null ? `${x}px` : "";
					switch (placement.split('-')[0]) {
						case "top": arrowElement!.style.bottom = `${-arrowElement!.offsetWidth * Math.sqrt(2) / 2}px`; break;
						case "right": arrowElement!.style.left = `${-arrowElement!.offsetWidth * Math.sqrt(2) / 2}px`; break;
						case "bottom": arrowElement!.style.top = `${-arrowElement!.offsetWidth * Math.sqrt(2) / 2}px`; break;
						case "left": arrowElement!.style.right = `${-arrowElement!.offsetWidth * Math.sqrt(2) / 2}px`; break;
					}
				}
			});
		});
	}

	close() {
		if (this.state === null) throw new Error("Illegal State: FloatingHelper has not started.");
		this.state();
		this.state = null;
	}
}
