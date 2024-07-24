// Collection Helpers (dburles:collection-helpers)

// Users helpers
// sample usage: Meteor.users.findOne({roles: {$in: ['provider']}}).specs();
// specs() returns an array of strings

Meteor.users.helpers({
   specs: function() {
      if (!Array.isArray(this.profile.provider.specialities))
         return [];
      let specs = null;
      if (Meteor.isClient){
         specs = Specialities.find({_id: {$in: this.profile.provider.specialities}},{fields: {name:1}}).fetch();
         return !!specs && specs.map((sp) => sp.name);
      } else {
         if (Meteor.settings.public.APP_MULTI_CLIENT) {
            let groupId = Partitioner.getUserGroup(this._id);
            let specs = Specialities.direct.find({_id: {$in: this.profile.provider.specialities}, _groupId: groupId},{fields: {name:1}}).fetch();
            return !!specs && specs.map((sp) => sp.name);
         } else {
            let specs = Specialities.direct.find({_id: {$in: this.profile.provider.specialities}},{fields: {name:1}}).fetch();
            return !!specs && specs.map((sp) => sp.name);
         }
      }
   },
   // getExpertise: function() {
   //  if (!Array.isArray(this.profile.provider.diseases))
   //     return [];
   //  let expertise = Expertise.direct.find({_id: {$in: this.profile.provider.diseases}},{fields: {name:1}}).fetch();
   //  return expertise.map((exp) => exp.name);
   // },
   fullName: function () {
      return this.profile.user && this.profile.user.name + ' ' + this.profile.user.surname;
   }
});
