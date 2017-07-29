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
		// set configuration
		this._configuration = data;
		// init tracks service
		this._tracks = new TrackService(this._configuration.tracks);
		// create list observer
		this._observer = new MutationObserver((function (mutations) {
			mutations.forEach((function (mutation) {
				Array.from(mutation.addedNodes).forEach((function (node) {
					node.addEventListener("click", this._onNavigationListItemClick.bind(this));
				}).bind(this));
			}).bind(this));
		}).bind(this));
		// get plot element
		this._plot = document.querySelector(".app track-plot");
		// get map element
		this._map = document.querySelector(".app track-map");
		// setup map element
		this._map.options = this._configuration.map;
		this._map.mapping = this._mapCoordinate;
		this._map.center = this._configuration.map.start;
		this._map.zoom = this._configuration.map.start.zoom;
		this._map.styles = this._configuration.map.styles;
		// get list element
		this._list = document.querySelector(".app track-list");
		// add event listener for list changed event
		this._list.addEventListener("changed", this._onListChanged.bind(this), false);
		// observe list element
		this._observer.observe(this._list, { childList: true });
		// add data to list element
		this._tracks.load().then((function (tracks) {
			// bind tracks
			this._list.items = tracks;
			// bind pager controls
			document.querySelector("[data-pager=next]").addEventListener("click", this._onNavigationPagerNextClick.bind(this));
			document.querySelector("[data-pager=previous]").addEventListener("click", this._onNavigationPagerPreviousClick.bind(this));
			// show track by index if requested
			if (!Number.isNaN(document.location.hash.substr(1))) {
				this._list.selected = document.location.hash.substr(1);
				this._showTrack(this._list.items[this._list.selected]);
				window.history.replaceState({ item: this._list.selected }, null, document.location);
			}
		}).bind(this));
		// add event listener for window popstate event
		window.addEventListener("popstate", this._onPopState.bind(this), false);
	}
	/**
	 * Initialize the application
	 *
	 * @param {String} url The URL for the configuration
	 * @return {Promise}
	 */
	static init(url) {
		return new Promise(function (resolve, reject) {
			// load application configuration
			Configuration.load(url).then(function (data) {
				// init elements
				window.customElements.define("track-map", MapElement);
				window.customElements.define("track-plot", PlotElement);
				window.customElements.define("track-list", ListElement);
				// create application
				try {
					resolve(new App(data));
				}
				catch (error) {
					reject(error);
				}
			}).catch(function (error) {
				// configuration could not loaded
				reject(new Error(`Loading configuration from '${error.responseURL}' failed`));
			});
		});
	}
	/**
	 * Run application
	 */
	run() {
		console.info("Application started...");
	}
	/**
	 * Show given track
	 * @param {Number} track The track id
	 */
	_showTrack(track) {
		if (!track) {
			// unset map path
			this._map.path = null;
			// hide plot
			this._plot.classList.add("disabled");
			// update title
			document.title = document.title.replace(/^.*\|/g, "");
		}
		else {
			// load track data
			this._tracks.load(track.id).then((function (data) {
				// assign path to map
				this._map.path = data;
				// search for minimum and maximum in data
				let boundaries = data.reduce(function (boundaries, coordinate) {
					return [Math.min(boundaries[0], coordinate[2]), Math.max(boundaries[1], coordinate[2])];
				}, [Infinity, -Infinity]);
				// set ranges for plot
				this._plot.ranges = {
					x: [-1, data.length],
					y: [boundaries[0], boundaries[1]]
				};
				// set relation for plot
				this._plot.relation = function (x) {
					x = Math.ceil(x);

					if (x <= 0 || x >= data.length) {
						return boundaries[0] - 1;
					}
					else {
						return data[x][2];
					}
				};
				// update title
				document.title = document.title.replace(/(^.*\||^)(.*)$/g, track.name + " | $2");
				// show plot
				this._plot.classList.remove("disabled");
			}).bind(this));
		}
	}
	/**
	 * Handle pop state event on window history
	 *
	 * @param {Event} event The pop state event object
	 */
	_onPopState(event) {
		// restore selection
		if (event.state && event.state.item) {
			this._list.selected = event.state.item;
			this._showTrack(this._list.items[event.state.item]);
		}
		else {
			this._list.selected = null;
			this._showTrack(null);
			this._map.center = this._configuration.map.start;
		}
	}
	/**
	 * Handle click event on navigation list item
	 *
	 * @param {Event} event The click event object
	 */
	_onNavigationListItemClick(event) {
		// prevent default
		event.preventDefault();
		// remove focus
		event.target.blur();
		// update selected list item
		this._list.selected = Number.parseInt(event.target.dataset.index) === this._list.selected ? null : Number.parseInt(event.target.dataset.index);
		// show selected track
		this._showTrack(this._list.items[this._list.selected]);
		// update history
		if (this._list.selected > -1) {
			window.history.pushState({ item: this._list.selected }, null, "#" + this._list.selected);
		}
	}
	/**
	 * Handle click on navigation pager
	 */
	_onNavigationPagerNextClick(event) {
		// prevent default
		event.preventDefault();
		// change list page
		this._list.page += 1;
	}
	/**
	 * Handle click on navigation pager
	 */
	_onNavigationPagerPreviousClick() {
		// prevent default
		event.preventDefault();
		// change list page
		this._list.page -= 1;
	}
	/**
	 * Map entry from track to coordinate for map element
	 *
	 * @param {Array} coordinate The track entry to map
	 */
	_mapCoordinate(coordinate) {
		// array from track service
		if (Array.isArray(coordinate) && coordinate.length === 3) {
			coordinate = { lat: coordinate[1], lng: coordinate[0] };
		}
		// object from configuration
		else if (coordinate instanceof Object && "latitude" in coordinate && "longitude" in coordinate) {
			coordinate = { lat: coordinate.latitude, lng: coordinate.longitude };
		}
		// return mapped coordinate
		return coordinate;
	}
	/**
	 * Update list page
	 */
	_onListChanged() {
		// update pager
		document.querySelector("[data-pager=page]").innerHTML = this._list.page + 1;
		document.querySelector("[data-pager=pages]").innerHTML = this._list.pages;
	}
}
