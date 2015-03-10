Package.describe({
	name: 'particle4dev:famous-flex',
	summary: 'Animatable layouts, FlexScrollView & widgets for famo.us.',
	version: "0.2.0",
	git: 'https://github.com/particle4dev/meteor-flex-scrollview'
});

var server = 'server';
var client = 'client';
var both = [client, server];

Package.onUse(function (api) {
	api.add_files('lib/flex-scrollview.js', client);

	api.export('ijzerenhein');
});

Package.onTest(function (api) {
});
