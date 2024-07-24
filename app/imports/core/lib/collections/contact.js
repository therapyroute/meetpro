// Collection containing contact form info
Contact = new Mongo.Collection("contact");

ContactSchema = new SimpleSchema({
  name: {
    type: String,
    max: 100
  },
  email: {
	type: String,
	regEx: SimpleSchema.RegEx.Email,
  },
  message: {
	type: String,
	max: 500
  },
  createdAt: {
    type: Date,
    autoValue: function() {
      if (this.isInsert) {
        return new Date();
      } else if (this.isUpsert) {
        return {$setOnInsert: new Date()};
      } else {
        this.unset();  // Prevent user from supplying their own value
      }
    }
  }
});

ContactSchema.i18n("schemas.contact");
Contact.attachSchema(ContactSchema);
