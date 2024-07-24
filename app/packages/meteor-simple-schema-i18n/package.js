Package.describe({
  name: 'gwendall:simple-schema-i18n',
  summary: 'Internationalization for SimpleSchema',
  version: '0.3.0',
  git: 'https://github.com/gwendall/meteor-simple-schema-i18n.git'
});

var packages = [
  'aldeed:simple-schema',
  'tap:i18n',
  'templating',
  'underscore'
];

Package.onUse(function(api) {
  api.use(packages);
  api.imply(packages);

  api.addFiles([
    'package-tap.i18n',
    'i18n/de.i18n.json',
    'i18n/el.i18n.json',
    'i18n/en.i18n.json',
    'i18n/es.i18n.json',
    'i18n/es-ES.i18n.json',
    'i18n/fr.i18n.json',
    'i18n/it.i18n.json',
    'shared/lib.js'
  ]);

  api.addAssets(['package-tap.i18n'], ['client', 'server']);
});
