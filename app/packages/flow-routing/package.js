Package.describe({
  name: 'mealsunite:flow-routing-extra',
  summary: 'UserAccounts package providing routes configuration capability via ostrio/flow-router-extra.',
  version: '2.0.1',
  git: 'https://github.com/MealsUnite/flow-routing.git',
});

Package.onUse(function(api) {
  api.versionsFrom(['1.3', '2.3']);

  api.use([
    'check',
    'ostrio:flow-router-extra',
    'underscore',
    'ecmascript',
    'useraccounts:core',
    'modules'
  ], ['client', 'server']);

  api.imply([
    'ostrio:flow-router-extra@3.4.0',
    'useraccounts:core',
  ], ['client', 'server']);

  api.use([
     'react@15.0.1',
     'kadira:blaze-layout@2.3.0',
     'gadicc:blaze-react-component@1.4.0'
  ], ['client', 'server'], { weak: true });

  api.addFiles([
    'lib/core.js',
  ], ['client', 'server']);

  api.addFiles([
    'lib/client/client.js',
    'lib/client/templates_helpers/at_input.js',
  ], ['client']);
});
