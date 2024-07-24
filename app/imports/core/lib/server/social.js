// Facebook
ServiceConfiguration.configurations.remove({
    service: 'facebook'
});

if (Meteor.settings.private.FB_APPID && Meteor.settings.private.FB_SECRET) {
  ServiceConfiguration.configurations.insert({
      service: 'facebook',
      appId: Meteor.settings.private.FB_APPID,
      secret: Meteor.settings.private.FB_SECRET
  });
}

// Google+
ServiceConfiguration.configurations.remove({
  service: "google"
});

if (Meteor.settings.private.GOOGLE_CID && Meteor.settings.private.GOOGLE_SECRET) {
  ServiceConfiguration.configurations.insert({
    service: "google",
    clientId: Meteor.settings.private.GOOGLE_CID,
    secret: Meteor.settings.private.GOOGLE_SECRET
  });
}

// LinkedIn
// ServiceConfiguration.configurations.remove({
//   service: "linkedin"
// });

// ServiceConfiguration.configurations.insert({
//   service: "linkedin",
//   clientId: Meteor.settings.private.LINKEDIN_CID,
//   secret: Meteor.settings.private.LINKEDIN_SECRET
// });

// ServiceConfiguration.configurations.remove({
//   service: 'wordpress'
// });

// ServiceConfiguration.configurations.insert({
//   service: 'wordpress',
//   clientId: Meteor.settings.private.WP_CID,
//   secret: Meteor.settings.private.WP_SECRET,
//   authServerURL: Meteor.settings.private.WP_URL
// });
