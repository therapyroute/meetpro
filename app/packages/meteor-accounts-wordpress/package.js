Package.describe({
    name: 'mindsharelabs:accounts-wordpress',
    version: '0.2.2',
    summary: 'Login service for self-hosted WordPress accounts',
    git: 'https://github.com/mindsharestudios/meteor-accounts-wordpress.git',
    documentation: 'README.md'
});

Package.onUse(function(api) {
    api.versionsFrom(['1.0.3', '2.3']);

    api.use('accounts-base', [ 'client', 'server' ]);
    api.imply('accounts-base', [ 'client', 'server' ]);
    api.use('accounts-oauth', [ 'client', 'server' ]);
    api.imply('accounts-oauth', [ 'client', 'server' ]);

    api.use('oauth', [ 'client', 'server' ]);
    api.use('oauth2', [ 'client', 'server' ]);
    api.use('http', [ 'server' ]);
    api.use('templating', 'client');
    api.use('underscore', 'server');
    api.use('random', 'client');
    api.use('service-configuration', [ 'client', 'server' ]);

    api.addFiles('wordpress_client.js', 'client');
    api.addFiles('wordpress_server.js', 'server');
    api.addFiles("wordpress.js");

    api.export('WordPress');

    api.addFiles([
        'wordpress_configuration.html',
        'wordpress_configuration.js'
    ], 'client');
});
