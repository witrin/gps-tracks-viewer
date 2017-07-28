/**
 * Service for configuration
 */
export default class Configuration {
	/**
	 * Load configuration
	 *
	 * @param {String} url The URL for the configuration in JSON format
	 * @return {Promise}
	 */
	static load(url) {
		return new Promise(function (resolve, reject) {
			let request = new XMLHttpRequest();
			request.overrideMimeType("application/json");
			request.open("GET", url, true);
			request.onload = function () {
				if (request.status === 200) {
					resolve(JSON.parse(request.responseText));
				}
				else {
					reject(request);
				}
			};
			request.send(null);
		});
	}
}
