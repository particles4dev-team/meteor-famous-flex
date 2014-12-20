Package.describe({
	name: 'mjn:global-flex-scrollview',
	summary: 'This is package global-flex-scrollview',
	version: "0.0.2"
});

var S = 'server';
var C = 'client';
var CS = [C, S];

Package.onUse(function (api) {
	api.add_files('lib/flex-scrollview.js', C);

	api.export('ijzerenhein');
});

Package.onTest(function (api) {
});
