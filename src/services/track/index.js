export default class TrackService {

	/**
	 * Create a track service
	 * @param {object} configuration
	 */
	constructor(configuration) {
		this._configuration = Object.assign(
			{
				endpoint: "http://localhost/api/tracks/"
			},
			configuration || {}
		);

		this._request = new XMLHttpRequest();
		this._request.overrideMimeType("application/json");
	}

	load(id = "") {
		return new Promise((function (resolve, reject) {
			let request = new XMLHttpRequest();

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
			request.send(null);
		}).bind(this));
	}
}
