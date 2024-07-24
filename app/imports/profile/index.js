//import 'package-tap.i18n';
if (Meteor.isServer) {
  import './server.js';
}
else {
  import './client.js';
}

