/**
 * List element
 */
export default class ListElement extends HTMLElement {
	/**
	 * Construct element
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
		// current data
		this._items = [];
	}
	/**
	 * Get number of pages
	 *
	 * @return {Number}
	 */
	get pages() {
		return this._offsets.pages.length;
	}
	/**
	 * Get current page
	 *
	 * @return {Number}
	 */
	get page() {
		return this._offsets.pages.indexOf(this._offsets.items);
	}
	/**
	 * Set current page
	 *
	 * @param {Number} page The page index
	 */
	set page(page) {
		page = this._limit(page, this._offsets.pages);
		// check something changed
		if (this._offsets.items !== this._offsets.pages.indexOf(page)) {
			// set offset
			this._offsets.items = this._offsets.pages[page];
			// update list
			this._update();
			// fire changed event
			this.dispatchEvent(new CustomEvent("changed", { property: "page" }));
		}
	}
	/**
	 * Get selected data index
	 *
	 * @return {Number}
	 */
	get selected() {
		return this._items.indexOf(this._selected);
	}
	/**
	 * Set selected data index
	 *
	 * @param {Number} selected The item index
	 */
	set selected(selected) {
		// force number if possible
		selected = Number.parseInt(selected);
		// check something has changed
		if (this._selected !== selected) {
			// if selected is passed by index
			this._selected = Number.isInteger(selected) ? this._items[this._limit(selected, this._items)] : null;
			// update items offset if selected
			if (this._selected !== null) {
				this._offsets.items = this._page(selected);
			}
			// update list
			this._update();
			// fire changed event
			if (this._selected !== null) {
				this.dispatchEvent(new CustomEvent("changed", { property: "page" }));
			}
		}
	}
	/**
	 * Get element data
	 *
	 * @return {Object[]}
	 */
	get items() {
		return Array.from(this._items);
	}
	/**
	 * Set element data
	 *
	 * @param {Object[]} items The items
	 */
	set items(items) {
		// assign by value
		this._items = Array.from(items);
		// reset selected item
		this._selected = null;
		// update list
		this._reset();
	}
	/**
	 * Attach element
	 */
	connectedCallback() {
		// fetch item template
		this._templates.item = this.querySelector("[data-template=item]");
		// attach event handler for window resize
		window.addEventListener("resize", this._onResize.bind(this), false);
		// reset list
		this._reset();
	}
	/**
	 * Detach element
	 */
	disconnectedCallback() {
		// detach handler for window resize
		window.removeEventListener("resize", this._onResize.bind(this), false);
	}
	/**
	 * Limit given index for an array
	 *
	 * @param {Number} index The position to limit
	 * @param {Array} array The array for the given position
	 */
	_limit(index, array) {
		return Math.max(0, Math.min(index, array.length - 1));
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
	 * Update element
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
			this._bind(this._offset(i, "items"), this.children[this._offset(i, "children")]);
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
	 * Reset element
	 */
	_reset() {
		// reset offsets
		this._offsets.items = 0;
		this._offsets.pages = [0];
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
		// reset data offset
		this._offsets.items = 0;
		// make sure selected is visible
		if (this._selected !== null) {
			this._offsets.items = this._page(this._items.indexOf(this._selected));
		}
		// render the page
		this._update();
		// fire changed event
		this.dispatchEvent(new CustomEvent("changed", { property: "page" }));
	}
	/**
	 * Find page by items index
	 *
	 * @param {Number} index 
	 * @return {Number}
	 */
	_page(index) {
		// pages are sorted ascending
		return this._offsets.pages.slice().reverse().reduce(function (previous, current) {
			return previous > index ? current : previous;
		}, Infinity);
	}
	/**
	 * Bind data to an item
	 *
	 * @param {Number} item The position of the item to bind
	 * @param {HTMLElement} element The element to bind the data to
	 */
	_bind(item, element) {
		// fetch data to bind
		let data = this._items[this._limit(item, this._items)];
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
		// attach absolute index
		element.dataset.index = this._items.indexOf(data);
		// toggle selected
		element.classList.toggle("selected", data === this._selected);
	}
	/**
	 * Offset position of a section
	 *
	 * @param {Number} position The position value to offset
	 * @param {String} section The section of the position to offset
	 */
	_offset(position, section) {
		return this._offsets[section] + position;
	}
	/**
	 * Wether item is at the given position visible or not
	 *
	 * @param {Number} position The position of a child
	 * @returns {Boolean}
	 */
	_isVisible(position) {
		// we can't tell if it's not a child
		if (position >= this.children.length || position <= -1) {
			return undefined;
		}
		// use bounding client rect
		let bounding = this.children[position].getBoundingClientRect();
		// wether it's not complete within window or not
		return bounding.top >= 0 && bounding.bottom < window.innerHeight;
	}
}
