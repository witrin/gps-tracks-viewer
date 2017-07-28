export default class TrackService {
	/**
	 * Create a track service
	 *
	 * @param {Object} configuration
	 */
	constructor(configuration) {
		// assign configuration
		this._configuration = Object.assign(
			{
				endpoint: "http://localhost/api/tracks/"
			},
			configuration || {}
		);
	}
	/**
	 * Load all tracks or a single track
	 *
	 * @param {String} id The track id to load a single track
	 * @return {Object[]|Object}
	 */
	load(id = "") {
		return new Promise((function (resolve, reject) {
			// create request
			let request = new XMLHttpRequest();
			// setup request
			request.overrideMimeType("application/json");
			request.open("GET", this._configuration.endpoint + id, true);
			request.onload = function () {
				if (request.status === 200) {
					resolve(JSON.parse(request.responseText));
				}
				else {
					reject(request);
				}
			};
			// send request
			request.send(null);
		}).bind(this));
	}
}
