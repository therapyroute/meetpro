### startup: The startup package of the app ###

Created to reduce initial client bundle size.
The module is initially loaded by the client to reduce loading time.

If the user is logged in, the rest of the modules are also loaded, as instructed by Flow-Router-extra (lib/routes.js).
