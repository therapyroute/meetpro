// All publications should be declared here
// subscriptions can be made on templates

// ********************************
// **** Public (for all users) ****
// ********************************
//
// Specialities
// publish all specialities
Meteor.publish('specialities', function(){
  return Specialities.find({});
});

// publish public (non-sensitive) provider info
Meteor.publish('ProviderPublic', function(){
    return [
      Meteor.users.find({'roles': 'provider'}, {fields: {
         'profile.user.name': 1,
         'profile.user.surname': 1,
         'profile.provider.specialities': 1,
         'profile.provider.short_bio.personal': 1,
         'roles': 1
      }}),
      // publish can return an array of cursors, so we also return specialities cursor
      Specialities.find()
    ];
});
// publish public (non-sensitive) provider info based on search term
// search in: surnames, specialities, expertise
Meteor.publish('ProviderPublicFiltered', function(search, skipCount){
  var positiveIntegerCheck = Match.Where(function(x) {
    check(x, Match.Integer);
    return x >= 0;
  });
  check(skipCount, positiveIntegerCheck);
  check(search, String);
  // publish count
  Counts.publish(this, 'providerCount', Meteor.users.find({'roles': {$in: ['provider']}}), {
    noReady: true
  });
  // initialize query & projection
  let query      = {'roles': {$in: ['provider']}},
      projection = {
        fields: {
           'profile.user.name': 1,
           'profile.user.surname': 1,
           'profile.user.photo': 1,
           'profile.user.slug': 1,
           'profile.provider.specialities': 1,
           'profile.provider.featured': 1,
           'profile.provider.short_bio.personal': 1,
           'roles': 1
         },
        limit: parseInt(appCommon.getParam('providersPerPage', null, this.userId)),
        skip: search ? 0 : skipCount,
        // first display featured, then alphabetically
        sort: { 'profile.provider.featured': -1,
                'profile.user.surname': 1
        }
      }
  // if search input
  if (search) {
    let regex = new RegExp( search, 'i' );
    // first search in specialities
    specsIds = _.map(Specialities.find({name: {$in: [regex]}},{fields: {_id: 1}}).fetch(), function(sp){
        return sp._id;
    });
    expIds = _.map(Expertise.find({name: {$in: [regex]}},{fields: {_id: 1}}).fetch(), function(exp){
      return exp._id;
    });
    // set query params
    query = {
      'roles': {$in: ['provider']},
      $or: [
        { 'profile.user.surname': regex },
        { 'profile.provider.specialities': { $in: specsIds} },
        { 'profile.provider.expertise': { $in: [regex] } }
      ]
    };
    projection.limit = 50;
  }
  return [
    Meteor.users.find( query, projection ),
    Specialities.find()
  ];
});

// publish provider data for their profile page
Meteor.publish("providerProfile", function(id){
  return [
    Meteor.users.find({_id: id}, {fields: {
      'profile.user.name': 1,
      'profile.user.surname': 1,
      'profile.user.photo': 1,
      'profile.user.slug': 1,
      'profile.provider.specialities': 1,
      'profile.provider.expertise': 1,
      'profile.provider.featured': 1,
      'profile.provider.price': 1,
      'profile.provider.schedule.duration': 1,
      'profile.provider.displayRating': 1,
      'profile.provider.short_bio': 1,
      'roles': 1
    }}),
    Specialities.find()
  ];
});

// ***************************************
// **** Private (for logged-in users) ****
// ***************************************

// Users
// publish specific user/provider info (only profile) to logged-in providers/users
Meteor.publish('getProfile', function(usrId){
  // if loggedIn & not asking own info
  if (this.userId && this.userId !== usrId){
    return Meteor.users.find({_id: usrId}, {
      fields: {
           'profile.user.name': 1,
           'profile.user.surname': 1,
           'profile.user.photo': 1,
           'profile.user.slug': 1,
           'profile.provider.specialities': 1
      }
      });
  }
});

// publish current appointment (for startup)
Meteor.publish("currentAppointment", function(now){
  if (this.userId){
    return Bookings.find({ $or: [{userId: this.userId}, {providerId: this.userId}], start: {$lt: now}, end: {$gt: now}, status: {$in:['confirmed','completed']}});
  }
});
