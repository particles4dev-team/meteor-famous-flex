Package.describe({
	name: 'mjn:global-flex-scrollview',
	summary: 'This is package global-flex-scrollview',
	version: "0.0.9",
	git: 'https://github.com/mj-networks/meteor-flex-scrollview.git'
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
