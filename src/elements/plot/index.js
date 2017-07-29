/**
 * Plot element
 */
export default class PlotElement extends HTMLElement {
	/**
	 * Construct element
	 *
	 * @param {Object} configuration The configuration for the element
	 */
	constructor() {
		// call parent constructor
		super();
		// relation to plot
		this._relation = null;
		// create canvas
		this._canvas = document.createElement("canvas");
		this._context = this._canvas.getContext("2d");
		// ranges of the plot
		this._ranges = {
			x: [0, 1],
			y: [0, 1]
		};
		// set default origin
		this._origin = {
			x: 0,
			y: 0
		};
		// default resolution
		this._resolution = 1;
	}
	/**
	 * Get origin
	 */
	get origin() {
		return this._origin;
	}
	/**
	 * Set origin
	 */
	set origin(origin) {
		// set value
		this._origin = origin;
		// update element
		this._update();
	}
	/**
	 * Get origin
	 */
	get resolution() {
		return this._resolution;
	}
	/**
	 * Set origin
	 */
	set resolution(resolution) {
		// set the value
		this._resolution = resolution;
		// update the element
		this._update();
	}
	/**
	 * Get ranges
	 */
	get ranges() {
		return this._ranges;
	}
	/**
	 * Set ranges
	 */
	set ranges(ranges) {
		// assign the relation
		this._ranges = ranges;
		// update the element
		this._update();
	}
	/**
	 * Get relation
	 */
	get relation() {
		return this._relation;
	}
	/**
	 * Set relation
	 */
	set relation(relation) {
		// assign the relation
		this._relation = typeof relation === "function" ? relation : null;
		// update the element
		this._update();
	}
	/**
	 * Attach element
	 */
	connectedCallback() {
		// attach event handler for window resize
		window.addEventListener("resize", this._onResize.bind(this), false);
		// append canvas
		this.appendChild(this._canvas);
		// update element
		this._update();
	}
	/**
	 * Detach element
	 */
	disconnectedCallback() {
		// detach event handler
		window.removeEventListener("resize", this._onResize.bind(this), false);
	}
	/**
	 * Update on resize
	 */
	_onResize() {
		// update element
		window.requestAnimationFrame((function () {
			this._update();
		}).bind(this));
	}
	/**
	 * Update element
	 */
	_update() {
		// get context
		let context = this._context;
		// get steps
		let iteration = 1 / this._resolution;
		// get ranges
		let range = {
			x: Math.abs(this._ranges.x[1] - this._ranges.x[0]),
			y: Math.abs(this._ranges.y[1] - this._ranges.y[0])
		};
		// get origin
		let origin = {
			x: Math.round(Math.abs(this._ranges.x[0] / range.x) * this._canvas.width),
			y: Math.round(Math.abs(this._ranges.y[0] / range.y) * this._canvas.height)
		};
		// clear rendering
		context.clearRect(0, 0, this._canvas.width, this._canvas.height);
		// add transformation, the plot start bottom left
		context.setTransform(1, 0, 0, -1, 0, this._canvas.height);
		context.save();
		// set translation to origin
		context.translate(origin.x, -origin.y);
		// scale the relation
		context.scale(this._canvas.width / range.x, this._canvas.height / range.y);
		// check relation is defined
		if (this._relation === null) {
			return;
		}
		// start path
		context.beginPath();
		context.fillStyle = "#fff";
		context.moveTo(this._ranges.x[0], this._relation(this._ranges.x[0]));
		// render relation
		for (let x = this._ranges.x[0] + iteration; x <= this._ranges.x[1]; x += iteration) {
			context.lineTo(x, this._relation(x));
		}
		// fill path
		context.fill();
		context.restore();
	}
}
