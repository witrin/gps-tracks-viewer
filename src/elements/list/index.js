/**
 * List element
 */
export default class ListElement extends HTMLElement {

	/**
	 * Construct the element
	 *
	 * @param {Object} configuration The configuration for the element
	 */
	constructor() {
		// call parent constructor
		super();
		// all template tags
		this._templates = {};
		// all current offsets
		this._offsets = {
			items: 0,
			children: this.children.length,
			pages: new Set([0])
		};
		// all current data
		this._items = [];
		// semaphore for the rendering
		this._rendering = false;
	}

	/**
	 * Get the number of pages
	 */
	get pages() {
		return this._offsets.pages.size;
	}

	/**
	 * Get the current page
	 */
	get page() {
		return Array.from(this._offsets.pages.values()).sort(function (a, b) {
			return a - b;
		}).indexOf(this._offsets.items);
	}

	/**
	 * Get the element data
	 */
	get items() {
		return this._items;
	}

	/**
	 * Set the element data
	 */
	set items(items) {
		// reset offsets
		this._offsets.items = 0;
		// assign the data
		this._items = Array.from(items);
		// update the element
		this._update();
	}

	/**
	 * Attach element
	 */
	connectedCallback() {
		this._templates.item = this.querySelector("[data-template=item]");

		window.addEventListener("resize", this._onResize.bind(this), false);
		this._update();
	}

	/**
	 * Detach element
	 */
	disconnectedCallback() {
		window.removeEventListener("resize", this._onResize.bind(this), false);
	}

	/**
	 * Scroll next page
	 */
	next() {
		let next = Array.from(this._offsets.pages.values())
			.filter((function (offset) {
				return offset > this._offsets.items;
			}).bind(this))
			.reduce(function (a, b) {
				return Math.min(a, b);
			}, this._items.length);

		if (next > this._offsets.items && next < this._items.length && next > -1) {
			this._offsets.items = next;
			this._render();
		}
	}

	/**
	 * Scroll previous page
	 */
	previous() {
		let previous = Array.from(this._offsets.pages.values())
			.filter((function (offset) {
				return offset < this._offsets.items;
			}).bind(this))
			.reduce(function (a, b) {
				return Math.max(a, b);
			}, -1);

		if (previous < this._offsets.items && previous < this._items.length && previous > -1) {
			this._offsets.items = previous;
			this._render();
		}
	}

	/**
	 * Event handler when the element is resized
	 */
	_onResize() {
		if (this._rendering) {
			return;
		}

		window.requestAnimationFrame((function () {
			this._update();
		}).bind(this));
	}

	/**
	 * Render the element
	 *
	 * @param {boolean}
	 */
	_render(prerender = false) {
		// set semaphore for the rendering
		this._rendering = true;
		// render the list from top, as long as there is still enough space for it
		let i = -1;
		do {
			// increment position
			++i;
			// check if there is still data to render
			if (this._offset(i, "items") >= this._items.length) {
				break;
			}
			// create new element if none exist on position
			if (this._offset(i, "children") >= this.children.length) {
				let template = document.importNode(this._templates.item.content, true);
				template.children[0].style.visibility = "hidden";
				this.appendChild(template.children[0]);
			}
			// bind data to element at position
			this._bind(
				this._items[this._offset(i, "items")],
				this.children[this._offset(i, "children")]
			);
		} while (
			this._calculateHeight(
				this._offset(0, "children"),
				this._offset(i, "children")
			) <= this.clientHeight
		);
		// check if the position is fully within the client area
		i -= this._calculateHeight(
			this._offset(0, "children"),
			this._offset(i, "children")
		) > this.clientHeight ? 2 : 1;
		// update the visibility of all items
		if (!prerender) {
			Array.from(this.children)
				.slice(this._offset(0, "children"), this.children.length)
				.forEach(function (child, j) {
					child.style.visibility = i > j - 1 ? "visible" : "hidden";
				});
		}
		// cache start of next page
		if (this._offset(i + 1, "items") < this._items.length) {
			this._offsets.pages.add(this._offset(i + 1, "items"));
		}
		// unset the semaphore for rendering
		this._rendering = false;
	}

	/**
	 * Update the element
	 */
	_update() {
		// preserve the current data offset
		let data = this._offsets.items;
		// reset the current data offset
		this._offsets.items = 0;
		// reset offsets for pages
		this._offsets.pages = new Set([0]);
		// calculate offsets for pages by rendering all pages
		for (let i = 0; i <= this._offsets.pages.size; i++) {
			this._render(true);
			this._offsets.items = Array.from(this._offsets.pages.values())
				.reduce(function (a, b) {
					return Math.max(a, b);
				});
		}
		// restore the current data offset
		this._offsets.items = data;
		// render the current data offset
		this._render();
	}

	/**
	 * Bind data to an element
	 *
	 * @param {Object} data The data 1to bind
	 * @param {HTMLElement} element The element to bind the data to
	 */
	_bind(data, element) {
		// fill in data
		Array.from(element.querySelector("[data-variable]") || [])
			.concat("variable" in element.dataset ? [element] : [])
			.forEach(function (child) {
				child.innerText = child.dataset.variable
					.split(".")
					.reduce(function (object, key) {
						return object[key];
					}, data);
			});
		// attach data
		element.dataset.source = JSON.stringify(data);
	}

	/**
	 * Calculate the height of the elements within a given range
	 *
	 * @param {number} start The start of the range
	 * @param {number} end The end of the range
	 */
	_calculateHeight(start, end) {
		return Array.from(this.children)
			.slice(
				start,
				end
			).reduce(function (height, item) {
				return height + item.offsetHeight;
			}, 0);
	}

	/**
	 * Offset the position of a section
	 *
	 * @param {number} position The position value to offset
	 * @param {string} section The section of the position to offset
	 */
	_offset(position, section) {
		return this._offsets[section] + position;
	}
}
