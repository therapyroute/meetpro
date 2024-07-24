// Collection containing all expertise items
// May be translatable using https://github.com/TAPevents/tap-i18n-db

Expertise = new Meteor.Collection("expertise");
if (Meteor.settings.public.APP_MULTI_CLIENT){
  Partitioner.partitionCollection(Expertise, {});
}

let expSchema = new SimpleSchema({
  name: {
    type: String
  },
  shortName: {
    type: String,
    optional: true
  },
  itemCode: {
	  type: String,
    optional: true
  },
  specialities: {
    type: [Number],
    optional: true,
    autoform: {
      omit: true
    }
  }
});

expSchema.i18n("schemas.expertise");
Expertise.attachSchema(expSchema);
