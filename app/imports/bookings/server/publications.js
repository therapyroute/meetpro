// Private Publications
// Publish provider schedule & price
Meteor.publish('providerSchedule', function(provId){
  //if (this.userId){
    return Meteor.users.find({_id: provId}, {fields: {
      'profile.provider.schedule': 1,
      'profile.provider.price': 1,
      'profile.user.timezone': 1
    }});
  //}
});
// Publish bookings
// Only for logged-in users, return asked provider's bookings,
// only for the client displayed dates, to minimize traffic
Meteor.publish('providerBookings', function (provId, reqStart, reqEnd) {
  let context = {
    providerId: provId,
    start: {$gte: reqStart},
    end: {$lte: reqEnd},
    status: {$in: ['pending','confirmed','completed']}
  };
  let fields = {fields: {'start':1, 'end':1, 'status':1}};
  if (this.userId){  
    return Bookings.find(context,fields);
  } else {
    return Bookings.direct.find(context,fields);
  }
});
// Publish all user's appointment within a given range
// For use @ booking to reduce data exchange
Meteor.publishComposite("allUserAppts", function(uId, reqStart, reqEnd){
  return {
    find: function() {
      // publish only to participating user or admin
      if (this.userId && (this.userId === uId || Roles.userIsInRole(this.userId, 'admin'))){
        // if user
        if (Roles.userIsInRole(uId,['user'])) {
          return Bookings.find({
            userId: uId,
            status: {$nin: ['aborted']},
            start: {$gte: reqStart},
            end: {$lte: reqEnd}
          });
        }
        // if provider
        else if (Roles.userIsInRole(uId,['provider'])) {
          return Bookings.find({
            providerId: uId,
            status: {$ne: 'aborted'},
            start: {$gte: reqStart},
            end: {$lte: reqEnd}
          });
        }
        else if (Roles.userIsInRole(uId,['admin'])) {
          if (Meteor.user() && Meteor.user().admin){
            return Bookings.direct.find({
              status: {$ne: 'aborted'},
              start: {$gte: reqStart},
              end: {$lte: reqEnd}
            });
          }
          return Bookings.find({
            status: {$ne: 'aborted'},
            start: {$gte: reqStart},
            end: {$lte: reqEnd}
          });
        }
        else {
          return;
        }
      }
      else {
        return;
      }
    },
    children: [
      {
        find: function(booking) {
          if (this.userId){
            var user = Meteor.users.findOne({_id:uId});
            let userFields = {
              'profile.user.name':1,
              'profile.user.surname':1,
              'profile.user.photo':1,
              'profile.user.slug': 1,
              'profile.provider.specialities':1,
              'profile.provider.allowf2f': 1,
              'profile.provider.address': 1
            };
            if (Roles.userIsInRole(user,['user'])) {
              return Meteor.users.find({_id: booking.providerId},{fields: userFields});
            }
            else if (Roles.userIsInRole(user,['provider'])) {
              return Meteor.users.find({_id: booking.userId},{fields: userFields});
            }
            else if (Roles.userIsInRole(user,['admin'])) {
              return Meteor.users.find({ $or: [ {_id: booking.providerId}, {_id: booking.userId} ] },{fields: userFields});
            }
          }
        },
        children: [
          {
            find: function(user) {
              if (Roles.userIsInRole(uId,['user'])) {
                var sps = user.profile.provider.specialities;
                return Specialities.find({_id: {$in: sps}});
              }
            }
          }
        ]
      }
    ]
  }
});
// publish provider data for the booking page
Meteor.publish("providerProfileBooking", function(id){
  return Meteor.users.find({_id: id}, {fields: {
      'profile.user.name': 1,
      'profile.user.surname': 1,
      'profile.user.photo': 1,
      'profile.user.slug': 1,
      'profile.user.timezone': 1,
      'profile.provider.specialities': 1,
      'profile.provider.schedule': 1,
      'profile.provider.price': 1,
      'profile.provider.address': 1,
      'profile.provider.allowf2f': 1,
      'emails': 1,
      // Billing related code - left for future reference
      //'profile.provider.viva.VP_PUBLIC_KEY': 1,
      'roles': 1
    }});
});

Meteor.publish("providerSpecs", function(id){
  if (Meteor.settings.public.APP_MULTI_CLIENT) {
    const theGroup = Partitioner.getUserGroup(id)
    return theGroup && Specialities.find({_groupId: theGroup});
  } else {
    return Specialities.find({});
  }
})
