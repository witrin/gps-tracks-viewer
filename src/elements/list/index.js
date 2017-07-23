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
		// template tags
		this._templates = {};
		// current offsets
		this._offsets = {
			items: 0,
			children: this.children.length,
			pages: [0]
		};
		// current length
		this._length = 0;
		// current item
		this._selected = null;
		// current page
		this._page = 0;
		// current data
		this._items = [];
	}

	/**
	 * Get the number of pages
	 */
	get pages() {
		return this._offsets.pages.length;
	}

	/**
	 * Get the current page
	 */
	get page() {
		return this._offsets.pages.indexOf(this._offsets.items);
	}

	/**
	 * Get the selected data
	 */
	get selected() {
		return this._selected;
	}

	/**
	 * Set the selected data
	 */
	set selected(item) {
		// create the key
		let key = JSON.stringify(item);
		// find the key
		if (this.items.find(function (data) {
			return JSON.stringify(data) === key;
		})) {
			// set the selected
			this._selected = item;
			// update the element
			this._update();
		}
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
		// assign the data
		this._items = Array.from(items);
		// update the element
		this._reset();
	}

	/**
	 * Attach element
	 */
	connectedCallback() {
		this._templates.item = this.querySelector("[data-template=item]");

		window.addEventListener("resize", this._onResize.bind(this), false);
		this._reset();
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
		this.jump(this._page + 1);
	}

	/**
	 * Scroll previous page
	 */
	previous() {
		this.jump(this._page - 1);
	}

	/**
	 * Jump to the given page
	 *
	 * @param {number} page The page index
	 */
	jump(page) {
		console.log("Jump to", page);
		this._page = this._limit(page, "pages");

		if (this._offsets.items !== this._offsets.pages.indexOf(this._page)) {
			this._offsets.items = this._offsets.pages[this._page];
			this._update();
		}
	}

	/**
	 * Limit the given position of a section
	 *
	 * @param {number} position The position to limit
	 * @param {string} section The section of the given position
	 */
	_limit(position, section) {
		return Math.max(0, Math.min(position, this._offsets[section].length - 1));
	}

	/**
	 * Event handler when the element is resized
	 */
	_onResize() {
		window.requestAnimationFrame((function () {
			this._reset();
		}).bind(this));
	}

	/**
	 * Update the list
	 */
	_update() {
		// render the list from top, as long as there is still enough space for it
		for (let i = 0; this._offset(i, "items") < this._items.length; this._length = ++i) {
			// create new element if list is too short
			if (this._offset(i, "children") === this.children.length) {
				let template = document.importNode(this._templates.item.content, true);
				this.appendChild(template.children[0]);
			}
			// bind data to current element
			this._bind(
				this._items[this._offset(i, "items")],
				this.children[this._offset(i, "children")]
			);
			// check if current element is visible
			if (!this._isVisible(this._offset(i, "children"))) {
				break;
			}
		}
		// update children classes
		Array.from(this.children)
			.slice(this._offset(0, "children"), this.children.length)
			.forEach(function (child, i) {
				child.classList.toggle("inactive", i >= this._length);
			}.bind(this));
	}

	/**
	 * Reset the list
	 */
	_reset() {
		// reset the offsets
		this._offsets.items = 0;
		this._offsets.pages = [0];
		this._page = 0;
		// pre-calculate offsets for pages by rendering all pages,
		// this is a nasty bottleneck but gives us much flexibility
		// regarding the CSS layout
		for (let i = 0; i <= this._offsets.pages.length; i++) {
			// pre-render the next page
			this._update();
			// update offset of next page
			if (this._offset(this._length, "items") < this._items.length) {
				this._offsets.pages.push(this._offset(this._length, "items"));
				this._offsets.pages = this._offsets.pages.sort(function (a, b) {
					return a - b;
				});
				this._offsets.items = this._offsets.pages.slice(-1).pop();
			}
		}
		// reset the data offset
		this._offsets.items = 0;
		// render the page
		this._update();
	}

	/**
	 * Bind data to an element
	 *
	 * @param {Object} data The data to bind
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
		// toggle selected
		element.classList.toggle("selected", element.dataset.source === JSON.stringify(this._selected));
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

	/**
	 * Wether the item is at the given position visible or not
	 *
	 * @param {number} position The position of a child
	 * @returns {boolean}
	 */
	_isVisible(position) {
		if (position >= this.children.length || position <= -1) {
			return undefined;
		}

		let bounding = this.children[position].getBoundingClientRect();
		return bounding.top >= 0 && bounding.bottom < window.innerHeight;
	}
}
