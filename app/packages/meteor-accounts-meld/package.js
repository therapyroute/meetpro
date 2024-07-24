'use strict';

Package.describe({
	summary: "Meteor package to link/meld user accounts registered " +
	         "with the same (verified) email address.",
  version: "1.3.2",
  name: "splendido:accounts-meld",
  git: "https://github.com/splendido/meteor-accounts-meld.git",
});

Package.onUse(function(api) {
	api.versionsFrom(['1.0.3', '2.3']);

	api.use([
		'accounts-base',
		'check',
		'underscore',
		'splendido:accounts-emails-field',
	], ['server']);

	api.addFiles([
		'lib/_globals.js',
		'lib/accounts-meld-server.js',
		'lib/accounts-meld-hooks.js',
	], ['server']);

	api.imply([
		'accounts-base',
	], ['server']);

	api.export([
		'AccountsMeld',
		'MeldActions',
	], ['server']);
});


Package.onTest(function(api) {
	api.use('splendido:accounts-meld');

	api.use([
		'accounts-base',
		'accounts-oauth',
		'accounts-password',
		'http',
		'oauth',
		'oauth2',
		'oauth-encryption',
		'random',
		'service-configuration',
		'srp',
		'test-helpers',
		'tinytest',
		'underscore'
	], ['client', 'server']);

	api.addFiles([
		'tests/accounts-meld_tests.js',
	], ['client', 'server']);
});
