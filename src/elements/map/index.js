import Leaflet from "leaflet";

/**
 * Map element
 */
export default class MapElement extends HTMLElement {
	/**
	 * Construct element
	 */
	constructor() {
		// call parent constructor
		super();
		// default options
		this._defaults = {
			layers: {
				tiles: {
					url: null
				}
			}
		};
		// init members
		this._map = null;
		this._path = [];
		this._options = Object.assign({}, this._defaults);
		this._polyline = Leaflet.polyline(this._path);
		this._layer = Leaflet.tileLayer(
			this._options.layers.tiles.url,
			this._options.layers.tiles.options
		);
		this._center = { lat: 0, lng: -180 };
		this._zoom = 3;
		// create map container
		this._view = document.createElement("div");
		// default mapping just pass through
		this._mapping = function (coordinate) { return coordinate; };
	}
	/**
	 * Attach element
	 */
	connectedCallback() {
		// append view element
		this.appendChild(this._view);
		// create map
		this._map = Leaflet.map(
			this._view,
			{ attributionControl: false }
		);
		// append layer and polyline to map
		this._layer.addTo(this._map);
		this._polyline.addTo(this._map);
		// init map
		this._map.setZoom(this._zoom);
		this._map.on("moveend", this._onMoveEnd.bind(this));
		// set map options
		this.options = this._options;
	}
	/**
	 * Get options
	 *
	 * @return {Object}
	 */
	get options() {
		return this._options;
	}
	/**
	 * Set options
	 *
	 * @param {Object} options The options
	 */
	set options(options) {
		this._options = Object.assign(this._defaults, options);
		this._layer.setUrl(this._options.layers.tiles.url);
		Leaflet.setOptions(this._layer, this._options.layers.tiles.options);
	}
	/**
	 * Get mapping function for coordinates
	 *
	 * @return {Function}
	 */
	get mapping() {
		return this._mapping;
	}
	/**
	 * Set mapping function for a coordinates
	 *
	 * @param {Function} mapping The function which maps a single coordinate
	 */
	set mapping(mapping) {
		this._mapping = mapping;
	}
	/**
	 * Get center
	 *
	 * @return {{lat: Number, lng: Number}}
	 */
	get center() {
		return this._center;
	}
	/**
	 * Set center
	 *
	 * @param {{lat: Number, lng: Number}} center The center of the map
	 */
	set center(center) {
		this._center = this._mapping(center);
		this._map.panTo(this._center);
	}
	/**
	 * Get zoom
	 *
	 * @return {Number}
	 */
	get zoom() {
		return this._zoom;
	}
	/**
	 * Set zoom
	 *
	 * @param {Number} zoom The zoom for the map
	 */
	set zoom(zoom) {
		this._zoom = Number(zoom) || 3;
		this._map.setZoom(this._zoom);
	}
	/**
	 * Get path
	 *
	 * @return {{lat: Number, lng: Number}[]}
	 */
	get path() {
		return this._path;
	}
	/**
	 * Set path
	 *
	 * @param {{lat: Number, lng: Number}[]} path The path as a list of coordinates
	 */
	set path(path) {
		// check path is iterable
		if (path !== null && path[Symbol.iterator] instanceof Function) {
			// map path elements
			this._path = Array.from(path).map(this._mapping);
			// update polyline
			this._polyline.getElement().style.visibility = "hidden";
			this._polyline.setLatLngs(this._path);
			// fit bounds
			this._map.fitBounds(this._polyline.getBounds());
		}
		else {
			this._path = null;
		}
		// remove previous path if set
		this._polyline.getElement().classList.toggle("disabled", this._path === null);
	}
	/**
	 * Update polyline after move end
	 */
	_onMoveEnd() {
		if (this._polyline !== null && this._polyline.getElement() !== undefined && this._path !== null) {
			this._polyline.getElement().style.visibility = "";
			this._polyline.getElement().classList.remove("disabled");
		}
	}
}
