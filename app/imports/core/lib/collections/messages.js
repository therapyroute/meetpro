// Messages/Notifications Collection
Messages = new Mongo.Collection("messages");

Messages.attachSchema(new SimpleSchema({
  owner: {
    type: String,
    regEx: SimpleSchema.RegEx.Id
  },
  from: {
    type: String,
    optional: true
  },
  title: {
    type: String,
    optional: true,
    max: 70
  },
  message: {
	  type: String,
	  label: 'Message',
	  max: 1000
  },
  link: {
    type: String,
    optional: true
  },
  read: {
    type: Boolean,
    defaultValue: false
  },
  date: {
    type: Date,
    autoValue: function() {
      if (this.isInsert) {
        return new Date();
      }
    }
  },
  icon: {
    type: String,
    defaultValue: 'envelope-o'
  },
  class: {
    type: String,
    defaultValue: 'default'
  }
}));
