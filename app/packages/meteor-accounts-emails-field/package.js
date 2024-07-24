'use strict';


Package.describe({
	summary: "Adds to the user obj a `registered_emails` field " +
		"containing 3rd-party account service emails.",
	name: "splendido:accounts-emails-field",
	version: "1.2.0",
	git: "https://github.com/splendido/meteor-accounts-emails-field.git",
});

Package.onUse(function(api) {
	api.versionsFrom(['1.1', '2.3']);

	api.use([
		'accounts-base',
		'underscore'
	], ['server']);

	api.imply([
		'accounts-base',
	], ['server']);

	api.addFiles([
		'lib/_globals.js',
		'lib/accounts-emails-field.js',
		'lib/accounts-emails-field-on-login.js'
	], ['server']);

	api.export([
		'AccountsEmailsField'
	], ['server']);
});

Package.onTest(function(api) {
	api.use('splendido:accounts-emails-field');

	api.use([
		'tinytest',
		'test-helpers',
		'underscore'
	], ['server']);

	api.addFiles([
		'tests/accounts-emails-field_tests.js'
	], ['server']);
});
