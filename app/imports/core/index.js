if (Meteor.isServer) {
  import './server.js';
}
else {
  import './client.js';
  import './startup.js';
}
