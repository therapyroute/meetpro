// Collection containing all providers specialities
// Should be translatable.
// Can be easily done with https://github.com/TAPevents/tap-i18n-db

Specialities = new Meteor.Collection("specialities");
if (Meteor.settings.public.APP_MULTI_CLIENT){
  Partitioner.partitionCollection(Specialities, {});
}

let specSchema = new SimpleSchema({
  name: {
    type: String,
    max: 50
  },
  abbreviation: {
	  type: String,
    optional: true
  }
});

specSchema.i18n("schemas.specialities");
Specialities.attachSchema(specSchema);
