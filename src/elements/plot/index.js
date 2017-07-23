/**
 * Plot element
 */
export default class PlotElement extends HTMLElement {

	/**
	 * Construct the element
	 *
	 * @param {Object} configuration The configuration for the element
	 */
	constructor() {
		// call parent constructor
		super();
		// the relation to plot
		this._relation = null;
		// create the canvas
		this._canvas = document.createElement("canvas");
		this._context = this._canvas.getContext("2d");
		// the ranges of the plot
		this._ranges = {
			x: [0, 1],
			y: [0, 1]
		};
		//
		this._origin = {
			x: 0,
			y: 0
		};
		// default resolution
		this._resolution = 1;
		//
		this.appendChild(this._canvas);
	}

	/**
	 * Get the origin
	 */
	get origin() {
		return this._origin;
	}

	/**
	 * Set the origin
	 */
	set origin(origin) {
		// set the value
		this._origin = origin;
		// update the element
		this._update();
	}

	/**
	 * Get the origin
	 */
	get resolution() {
		return this._resolution;
	}

	/**
	 * Set the origin
	 */
	set resolution(resolution) {
		// set the value
		this._resolution = resolution;
		// update the element
		this._update();
	}

	/**
	 * Get the ranges
	 */
	get ranges() {
		return this._ranges;
	}

	/**
	 * Set the ranges
	 */
	set ranges(ranges) {
		// assign the relation
		this._ranges = ranges;
		// update the element
		this._update();
	}

	/**
	 * Get the relation
	 */
	get relation() {
		return this._relation;
	}

	/**
	 * Set the relation
	 */
	set relation(relation) {
		// check the argument type
		if (typeof relation === "function") {
			// assign the relation
			this._relation = relation;
			// update the element
			this._update();
		}
	}

	/**
	 * Attach element
	 */
	connectedCallback() {
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
	 * Event handler when the element is resized
	 */
	_onResize() {
		window.requestAnimationFrame((function () {
			this._update();
		}).bind(this));
	}

	/**
	 * Update the element
	 */
	_update() {
		if (this._relation === null) {
			return;
		}

		let iteration = 1 / this._resolution;
		let context = this._context;
		let range = {
			x: Math.abs(this._ranges.x[1] - this._ranges.x[0]),
			y: Math.abs(this._ranges.y[1] - this._ranges.y[0])
		};
		let origin = {
			x: Math.round(Math.abs(this._ranges.x[0] / range.x) * this._canvas.width),
			y: Math.round(Math.abs(this._ranges.y[0] / range.y) * this._canvas.height)
		};

		context.clearRect(0, 0, this._canvas.width, this._canvas.height);
		context.setTransform(1, 0, 0, -1, 0, this._canvas.height);
		context.save();

		context.translate(origin.x, -origin.y);
		context.scale(this._canvas.width / range.x, this._canvas.height / range.y);

		context.beginPath();
		context.fillStyle = "#fff";
		context.moveTo(this._ranges.x[0], this._relation(this._ranges.x[0]));

		for (let x = this._ranges.x[0] + iteration; x <= this._ranges.x[1]; x += iteration) {
			context.lineTo(x, this._relation(x));
		}

		context.closePath();
		context.fill();
		context.restore();
	}
}