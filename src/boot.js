import Modernizr from "./modernizr";
import App from "./app";

// test features
[{
	test: Modernizr.customelements,
	nope: function () {
		require("@webcomponents/custom-elements");
	}
}].forEach(function (feature) {
	let action = feature[feature.test ? "yep" : "nope"];
	return action && action();
});

// start the application
App.init("configuration.json").then(function (app) {
	app.run();
}).catch(function (error) {
	console.error(`Initializing failed: ${error.message}.`);
});
