// Server only collections

// Collection containing log info
Logs = new Mongo.Collection("logs");

// set collection as capped http://stackoverflow.com/a/36766685
//Logs._createCappedCollection(5242880, 10000);

logSchema = new SimpleSchema({
  datetime: {
    type: Date
  },
  uid: {
    type: String,
    optional: true
  },
  fname: {
    type: String,
    optional: true
  },
  level: {
    type: String,
    defaultValue: 'info'
  },
  content: {
    type: String
  },
  groupId: {
    type: String,
    optional: true
  }
});

Logs.attachSchema(logSchema);

// server only collection for provider pre-registrations
Preregs = new Meteor.Collection("preregs");

// server only collection for subscriptions
Subscriptions = new Meteor.Collection("subscriptions");