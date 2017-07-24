import MapElement from "../elements/map";
import PlotElement from "../elements/plot";
import ListElement from "../elements/list";
import TrackService from "../services/track";
import Configuration from "../services/configuration";

/**
 * The application controller
 */
export default class App {

	/**
	 * Create an application
	 *
	 * @param {Object} data The configuration
	 */
	constructor(data) {
		// set the configuration
		this._configuration = data;
		// init the tracks service
		this._tracks = new TrackService(this._configuration.tracks);
		// create list observer
		this._observer = new MutationObserver((function (mutations) {
			mutations.forEach((function (mutation) {
				Array.from(mutation.addedNodes).forEach((function (node) {
					node.addEventListener("click", this._onNavigationListItemClick.bind(this));
				}).bind(this));
			}).bind(this));
		}).bind(this));
		// get the plot element
		this._plot = document.querySelector(".app track-plot");
		// get the map element
		this._map = document.querySelector(".app track-map");
		// setup the map element
		this._map.options = this._configuration.map;
		this._map.mapping = this._mapCoordinate;
		this._map.center = this._configuration.map.start;
		this._map.zoom = this._configuration.map.start.zoom;
		this._map.styles = this._configuration.map.styles;
		// get the list element
		this._list = document.querySelector(".app track-list");
		// observe the list element
		this._observer.observe(this._list, { childList: true });
		// add data to the list element
		this._tracks.load().then((function (data) {
			this._list.items = data;
			document.querySelector("[data-pager=next]").addEventListener("click", this._onNavigationPagerNextClick.bind(this));
			document.querySelector("[data-pager=previous]").addEventListener("click", this._onNavigationPagerPreviousClick.bind(this));
			this._update();
		}).bind(this));
		// add event listener for the window resize event
		window.addEventListener("resize", this._onResize.bind(this), false);
	}

	/**
	 * Initialize the application
	 *
	 * @param {String} url The URL for the configuration
	 * @return {Promise}
	 */
	static init(url) {
		return new Promise(function (resolve, reject) {
			// load the application configuration
			Configuration.load(url).then(function (data) {
				// init the elements
				window.customElements.define("track-map", MapElement);
				window.customElements.define("track-plot", PlotElement);
				window.customElements.define("track-list", ListElement);
				// create the application
				try {
					resolve(new App(data));
				}
				catch (error) {
					reject(error);
				}
			}).catch(function (request) {
				// configuration could not loaded
				reject(new Error(`Loading the application configuration from '${request.responseURL}' failed with '${request.statusText}'.`));
			});
		});
	}

	/**
	 * Run the application
	 */
	run() {
		console.log("Application started...");
	}

	/**
	 * Handle click event on navigation list item
	 *
	 * @param {Event} event The click event object
	 */
	_onNavigationListItemClick(event) {
		if (Number.parseInt(event.target.dataset.index) === this._list.selected) {
			this._map.path = null;
			this._plot.classList.add("disabled");
			this._list.selected = null;
		}
		else {
			let data = this._list.items[event.target.dataset.index];

			this._list.selected = event.target.dataset.index;

			this._tracks.load(data.id).then((function (data) {
				let maximum = data.reduce(function (maximum, coordinate) {
					return Math.max(maximum, coordinate[2]);
				}, -Infinity);
				let minimum = data.reduce(function (minimum, coordinate) {
					return Math.min(minimum, coordinate[2]);
				}, Infinity);

				this._map.path = data;

				this._plot.ranges = {
					x: [-1, data.length],
					y: [minimum, maximum]
				};

				this._plot.relation = function (x) {
					x = Math.ceil(x);

					if (x <= 0 || x >= data.length) {
						return minimum - 1;
					}
					else {
						return data[x][2];
					}
				};

				this._plot.classList.remove("disabled");
			}).bind(this));
		}

		return false;
	}

	/**
	 * Handle click on navigation pager
	 */
	_onNavigationPagerNextClick() {
		this._list.page += 1;
		this._update();
		return false;
	}

	/**
	 * Handle click on navigation pager
	 */
	_onNavigationPagerPreviousClick() {
		this._list.page -= 1;
		this._update();
		return false;
	}

	/**
	 * Handle window resize
	 */
	_onResize() {
		window.requestAnimationFrame((function () {
			this._update();
		}).bind(this));
	}

	/**
	 * Map entry from track to coordinate for map element
	 *
	 * @param {Array} coordinate The track entry to map
	 */
	_mapCoordinate(coordinate) {
		if (Array.isArray(coordinate) && coordinate.length === 3) {
			coordinate = { lat: coordinate[1], lng: coordinate[0] };
		}
		else if (coordinate instanceof Object && "lng" in coordinate && "lat" in coordinate) {
			coordinate = { lat: coordinate.lat, lng: coordinate.lng };
		}
		else if (coordinate instanceof Object && "latitude" in coordinate && "longitude" in coordinate) {
			coordinate = { lat: coordinate.latitude, lng: coordinate.longitude };
		}

		return coordinate;
	}

	/**
	 * Update the application view
	 */
	_update() {
		document.querySelector("[data-pager=page]").innerHTML = this._list.page + 1;
		document.querySelector("[data-pager=pages]").innerHTML = this._list.pages;
	}
}
