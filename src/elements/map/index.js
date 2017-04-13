import GoogleMapsApiService from "../../services/google-maps-api";

export default class MapElement extends HTMLElement {

	constructor() {
		super();

		this._map = null;
		this._path = null;
		this._polyline = null;
		this._styles = null;
		this._mapping = function (coordinate) { return coordinate; };
	}

	connectedCallback() {
		GoogleMapsApiService.load().then(this._update.bind(this));
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
		this._update((function () {
			this._map.setZoom(this._zoom);
		}).bind(this));
	}

	get zoom() {
		return this._zoom;
	}

	set zoom(zoom) {
		this._zoom = Number(zoom) || 3;
		this._update((function () {
			this._map.setZoom(this._zoom);
		}).bind(this));
	}

	get path() {
		return this._path;
	}

	set path(path) {
		this._path = Array.from(path).map(this._mapping);
		this._update((function () {
			if (this._polyline) {
				this._polyline.setMap(null);
			}

			this._polyline = new window.google.maps.Polyline({
				path: this._path,
				geodesic: true,
				strokeColor: "#FF0000",
				strokeOpacity: 1.0,
				strokeWeight: 2
			});

			let bounds = new window.google.maps.LatLngBounds();

			this._path.forEach(function (coordinate) {
				bounds.extend(coordinate);
			}, this);

			this._map.fitBounds(bounds);

			this._polyline.setMap(this._map);
		}).bind(this));
	}

	get styles() {
		return this._styles;
	}

	set styles(styles) {
		this._styles = styles;
		this._update((function () {
			this._map.data.setStyle(this._styles);
		}).bind(this));
	}

	_update(callback) {
		if (window.google && window.google.maps) {
			if (this._map === null) {
				this._map = new window.google.maps.Map(this, {
					zoom: this._zoom,
					center: this._center,
					styles: this._styles
				});
			}

			if (typeof callback === "function") {
				callback();
			}
		}
	}
}
