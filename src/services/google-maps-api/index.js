/**
 * Service for Google Maps API
 */
export default class GoogleMapsApiService {

	/**
	 * Loads the Google Maps API dynamically
	 *
	 * @param {*} parameters The query parameters
	 * @return Promise
	 *
	 * @todo Implement rejects
	 */
	static load(parameters = {}) {
		const callbackName = "__googleMapsApiOnLoadCallback";
		const apiEndpoint = "https://maps.googleapis.com/maps/api/js";
		const scriptElement = document.createElement("script");

		parameters = Object.assign(parameters, {
			callback: callbackName
		});

		return new Promise(function (resolve) {
			// check if the API is already loaded
			if (window.google && window.google.maps) {
				resolve(window.google.maps);
			}
			else {
				// map the parameters into an URL query
				let query = Object.keys(parameters).map(function (key) {
					return key + "=" + parameters[key];
				}).join("&");
				// hook up the callback
				window[callbackName] = function () {
					delete window[callbackName];
					resolve(window.google.maps);
				};
				// insert the `script` tag
				scriptElement.src = `${apiEndpoint}?${query}`;
				document.body.appendChild(scriptElement);
			}
		});
	}
}
