import Leaflet from "leaflet";

export default class MapElement extends HTMLElement {

	constructor() {
		super();

		this._defaults = {
			layers: {
				tiles: {
					url: null
				},
				path: {
				}
			}
		};

		this._map = null;
		this._path = null;
		this._polyline = null;
		this._styles = null;
		this._options = Object.assign({}, this._defaults);
		this._view = document.createElement("div");
		this._mapping = function (coordinate) { return coordinate; };
	}

	connectedCallback() {
		this.appendChild(this._view);

		this._map = Leaflet.map(
			this._view,
			{ attributionControl: false }
		);

		this.options = this._options;
	}

	get options() {
		return this._options;
	}

	set options(options) {
		this._options = Object.assign(this._defaults, options);

		if (this._layer) {
			this._layer.remove();
		}

		this._layer = Leaflet.tileLayer(
			this._options.layers.tiles.url,
			this._options.layers.tiles.options
		);

		this._layer.addTo(this._map);
	}

	get mapping() {
		return this._mapping;
	}

	set mapping(mapping) {
		this._mapping = mapping;
	}

	get center() {
		return this._center;
	}

	set center(center) {
		this._center = this._mapping(center) || { lat: 0, lng: -180 };
		this._map.panTo(this._center);
	}

	get zoom() {
		return this._zoom;
	}

	set zoom(zoom) {
		this._zoom = Number(zoom) || 3;
		this._map.setZoom(this._zoom);
	}

	get path() {
		return this._path;
	}

	set path(path) {
		this._path = Array.from(path).map(this._mapping);

		if (this._polyline) {
			this._polyline.remove();
		}

		this._polyline = Leaflet.polyline(this._path, this._options.layers.path);

		this._polyline.addTo(this._map);
		this._map.fitBounds(this._polyline.getBounds());
	}

	get styles() {
		return this._styles;
	}

	set styles(styles) {
		this._styles = styles;
	}
}
