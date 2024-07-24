// Notification Template Collection
// stores template which create app SMS / emails
// TO DO: add translations with https://github.com/TAPevents/tap-i18n-db

NotificationTemplates = new Mongo.Collection("ntemplates");

Schema = {};

Schema.templateSchema = new SimpleSchema({
  // sms / email
  type: {
    type: String,
    allowedValues: ['sms','email'],
  },
  // confirm, remind, cancel etc.
  action: {
    type: String,
    allowedValues: ['confirm','remind','cancel','confirmationProvider','nextday','summary','adminsummary','confirmation'],
  },
  // who gets it? (user/provider)
  receiver: {
    type: String,
    allowedValues: ['user','provider','admin']
  },
  topic: {
    type: String,
    optional: true
  },
  content: {
    type: String,
    autoform: {
      rows: 14
    }
  },
  lang: {
    type: String,
    allowedValues: ['el','en'],
  }
});
Schema.templateSchema.i18n("schemas.ntemplates");
NotificationTemplates.attachSchema(Schema.templateSchema);
