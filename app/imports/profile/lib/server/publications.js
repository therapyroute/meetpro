// profile package publications
//////////////////////////////////


// Upcoming appointments publication
// Publish Composite: https://github.com/englue/meteor-publish-composite
// publishes more than one cursors reactively
Meteor.publishComposite("upcomingAppts", function(numAppts = 4) {
  return {
  find: function() {
    if (this.userId){
      var user = Meteor.users.findOne({_id:this.userId});
      // if user
      if (Roles.userIsInRole(user,['user'])) {
        var now = new Date();
        return Bookings.find({userId: this.userId, start: {$gt: now}, status: 'confirmed'}, {sort: {start: 1}, limit: numAppts});
      }
      // if provider
      else if (Roles.userIsInRole(user,['provider'])) {
        var now = new Date();
        return Bookings.find({providerId: this.userId, start: {$gt: now}, status: 'confirmed'}, {sort: {start: 1}, limit: numAppts});
      }
      else {
        return;
      }
    }
  },
  children: [
    {
      find: function(booking) {
        if (this.userId){
          var user = Meteor.users.findOne({_id:this.userId});
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
        }
      },
      children: [
        {
          find: function(user) {
            var usr = Meteor.users.findOne({_id:this.userId});
            if (Roles.userIsInRole(usr,['user'])) {
              var sps = user.profile.provider.specialities;
              return Specialities.find({_id: {$in: sps}});
            }
          }
        },
        {
          // if provider is logged in, 'user' is user, else 'user' is provider
          find: function(user) {
            // if provider, return the whole Question document
            if (Roles.userIsInRole(user,['user'])){
              return Questions.find({providerId: this.userId});
            }
            // if user, return Question document with own answers ONLY!
  					else if (Roles.userIsInRole(user,['provider'])){
              let questFields = {providerId:1, questions: 1, answers: {$elemMatch: {userId: this.userId}}}
              return Questions.find({providerId: user._id},{fields: questFields});
            }
          }
        }
      ]
    }
  ]
}
});

Meteor.publishComposite("associateViewModel", function(assocId){
	return {
		find: function() {
			return Meteor.users.find({_id: assocId},{fields: {
        'profile.user.name': 1,
        'profile.user.surname': 1,
        'profile.user.photo': 1,
        'profile.user.gender': 1,
        'profile.user.slug': 1,
        'profile.provider.specialities': 1,
        'profile.provider.expertise': 1,
        'profile.provider.featured': 1,
        'profile.provider.price': 1,
        'profile.provider.schedule.duration': 1,
        'profile.provider.displayRating': 1,
        'roles': 1
      }});
		},
		children: [
			{
				find: function(assocUser){
					if (Roles.userIsInRole(this.userId,['provider']))
						return Bookings.find({userId: assocUser._id, providerId: this.userId});
        	else if (Roles.userIsInRole(this.userId,['user']))
            return Bookings.find({userId: this.userId, providerId: assocUser._id});
					else
						return;
				}
			}
			,{
				find: function(assocUser){
					if (Roles.userIsInRole(assocUser,['user']))
						return Questions.find({providerId: this.userId});
					else
						return;
				}
			},
      {
				find: function(assocUser){
					if (Roles.userIsInRole(assocUser,['user'])){
            // should see that again. It returns an array of all shared files - $filter does not work
						return UserFiles.find({_id: assocUser._id, uploads: {$elemMatch: {assignedTo: this.userId}}});
            //return UserFiles.find({_id: assocUser._id, 'uploads.assignedTo': this.userId}, {'uploads': {$elemMatch: {'assignedTo': this.userId}}});
          }
          else
            return UserFiles.find({_id: this.userId, uploads: {$elemMatch: {assignedTo: assocUser._id}}});
				}
			},
      {
        find: function(assocUser){
          return Private.find({owner: this.userId, associate: assocUser._id});
        }
      }
		]
	}
});

// used to publish only a subset to the reactive table
ReactiveTable.publish('allUserAppts', Bookings, function(){
  if (this.userId){
    //var now = new Date();
    var user = Meteor.users.findOne({_id:this.userId});
    // if user
    if (Roles.userIsInRole(user,['user'])) {
      return {userId: this.userId, status: {$ne: 'aborted'}};
    }
    // if provider
    else if (Roles.userIsInRole(user,['provider']) && !Roles.userIsInRole(user,['admin'])) {
      return {providerId: this.userId, status: {$ne: 'aborted'}};
    }
    // if admin & provider, check appParams.currentRole for the currently user selected role
    else if (Roles.userIsInRole(user,['provider']) && Roles.userIsInRole(user,['admin'])) {
      if (appParams.currentRole == 'expert') {
        return {providerId: this.userId, status: {$ne: 'aborted'}};
      } else {
        return {status: {$ne: 'aborted'}};
      }
    }
    else {
      // if admin (or admin-provider)
      return {status: {$ne: 'aborted'}};
    }
  }
});
// publication only for admin's reactive booking table to improve performance
Meteor.publish('adminAppts', function(skipCount, limit, time, dateRange, status, userId, provId, startSort) {
  if (this.userId){
    // sorting by start datetime
    var sortVar = startSort === 'ascending' ? {start: 1} : {start: -1};
    var filter = {skip: skipCount, limit: limit, sort: sortVar};
    // build query
    var query = {};
    if (time !== '')
      query.start = time;
    if (status !== '')
      query.status = status;
    else {
      query.status = {$ne: 'aborted'};
    }
    // if user or provider
    if (userId !== '')
      query.userId = userId;
    if (provId !== '')
      query.providerId = provId;
    // all, past or upcoming
    let now = new Date();
    if (time === 'past') {
      query.start = {$lt: now};
    }
    else if (time === 'future') {
      query.start = {$gt: now};
    }
    if (dateRange){
      query.start = dateRange;
    }
    // console.log('adminAppts');
    // console.log(query);
    // console.log(filter);
    if (Meteor.user() && Meteor.user().admin){
      return Bookings.direct.find(query, filter);  
    }
    return Bookings.find(query, filter);
  }
  else {
    return this.ready();
  }
});
// paginated appointments for reactive table, published only a subset of bookings,
// following the reactivetable.publish above
// limitation: sorting by date (descending) is hard-coded because multiple sorting should be monitored by reactive vars
Meteor.publishComposite('apptsFiltered', function(skipCount, limit, time, dateRange, status, userId, provId, startSort) {
  return {
  find: function() {
    if (this.userId){
      var user = Meteor.users.findOne({_id: this.userId});
      // sorting by start datetime
      var sortVar = startSort === 'ascending' ? {start: 1} : {start: -1};
      var filter = {skip: skipCount, limit: limit, sort: sortVar};
      // build query
      var query = {};
      if (time !== '')
        query.start = time;
      if (status !== '')
        query.status = status;
      else {
        query.status = {$ne: 'aborted'};
      }
      // if current user is user or provider
      if (Roles.userIsInRole(user,['user'])) {
        query.userId = this.userId;
      }
      else if (Roles.userIsInRole(user,['provider'])) {
        query.providerId = this.userId;
      }
      // if user or provider
      if (userId !== '')
        query.userId = userId;
      if (provId !== '')
        query.providerId = provId;
      // all, past or upcoming
      let now = new Date();
      if (time === 'past') {
        query.start = {$lt: now};
      }
      else if (time === 'future') {
        query.start = {$gt: now};
      }
      if (dateRange){
        query.start = dateRange;
      }
      // console.log('apptsFiltered');
      // console.log(query);
      // console.log(filter);
      return Bookings.find(query, filter);
    }
    else {
      return this.ready();
    }
  },
  children: [
    {
      find: function(booking) {
        if (this.userId){
          var user = Meteor.users.findOne({_id:this.userId});
          let userFields = {
            'profile.user.name':1,
            'profile.user.surname':1,
            'profile.user.photo':1,
            'profile.user.slug':1,
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
        }
      },
      children: [
        // removed questionnaire publishing for performance reasons
        {
          // if provider is logged in, 'user' is user, else 'user' is provider
          find: function(user) {
            if (Roles.userIsInRole(user,['user'])){
              return Questions.find({providerId: this.userId});
            }
  					else if (Roles.userIsInRole(user,['provider'])){
              let questFields = {providerId:1, questions: 1, answers: {$elemMatch: {userId: this.userId}}}
              return Questions.find({providerId: user._id},{fields: questFields});
            }
          }
        }
      ]
    }
  ]
}
});
// a more performant version of apptsFiltered (without reactivity)
Meteor.publish('apptsFiltered2', function(skipCount, limit, time, status, userId, provId, startSort) {
  if (this.userId){
    // sorting by start datetime
    var sortVar = startSort === 'ascending' ? {start: 1} : {start: -1};
    var filter = {skip: skipCount, limit: limit, sort: sortVar};
    // build query
    var query = {};
    if (time !== '')
      query.start = time;
    if (status !== '')
      query.status = status;
    else {
      query.status = {$ne: 'aborted'};
    }
    // if current user is user or provider
    if (Roles.userIsInRole(this.userId,['user'])) {
      query.userId = this.userId;
    }
    else {
      query.providerId = this.userId;
    }
    // if user or provider
    if (userId !== '')
      query.userId = userId;
    if (provId !== '')
      query.providerId = provId;
    // all, past or upcoming
    let now = new Date();
    if (time === 'past') {
      query.start = {$lt: now};
    }
    else if (time === 'future') {
      query.start = {$gt: now};
    }
    // console.log('apptsFiltered2');
    // console.log(query);
    // console.log(filter);
    let theBookings = Bookings.find(query, filter);
    let theBookingsArray = Bookings.find(query, filter).fetch();
    let uIds = [];
    theBookingsArray.forEach(function(bk){
      uIds.push(bk.userId);
      uIds.push(bk.providerId);
    });
    let uniqueIds = Array.from(new Set(uIds));
    let theUsers = Meteor.users.find({_id: {$in: uniqueIds}});
    return [
      theBookings,
      theUsers
    ];
  }
  else {
    return this.ready();
  }
});

// Publish all associates
Meteor.publishComposite("allAssocs", {
  find: function() {
    if (this.userId) {
      var user = Meteor.users.findOne({_id:this.userId});
      let userFields = {
        'profile.user.name':1,
        'profile.user.surname':1,
        'profile.user.photo':1,
        'profile.user.slug':1,
        'profile.provider.specialities':1
      };
      if (Roles.userIsInRole(user,['user'])) {
        var assocIds = _.uniq(Bookings.find({userId: this.userId, status: {$in: ['confirmed','completed']}}, {fields: {'providerId': 1}}).fetch().map(function (obj) {
          return obj.providerId;
        }));
        return Meteor.users.find({_id: {$in: assocIds}}, {fields: userFields}, {sort: { 'profile.user.surname': 1 }});
      }
      if (Roles.userIsInRole(user,['provider'])) {
        var assocIds = _.uniq(Bookings.find({providerId: this.userId, status: {$in: ['confirmed','completed']}}, {fields: {'userId': 1}}).fetch().map(function (obj) {
          return obj.userId;
        }));
        return Meteor.users.find({_id: {$in: assocIds}}, {fields: userFields}, {sort: { 'profile.user.surname': 1 }});
      }
    }
    else {
      return;
    }
  },
  children: [
    {
      find: function(usr) {
        var curUsr = Meteor.users.findOne({_id:this.userId});
        if (Roles.userIsInRole(curUsr,['user'])) {
          var sps = usr.profile.provider.specialities;
          return Specialities.find({_id: {$in: sps}});
        }
      }
    }
  ]
});

// Notifications publication
Meteor.publish('getNotifications', function(){
  if (this.userId){
    return Messages.find({ $or: [{'owner': this.userId},{'from': this.userId}] });
  }
});
// Notifications publication for the Dashboard
Meteor.publishComposite("dashNotifications", {
  find: function() {
    if (this.userId) {
      return Messages.find({ $or: [{'owner': this.userId},{'from': this.userId}] });
    }
    else {
      return;
    }
  },
  children: [
    {
      find: function(msg) {
        let userFields = {
          'profile.user.name':1,
          'profile.user.surname':1,
          'profile.user.photo':1,
          'profile.user.slug':1,
          //'profile.provider.specialities':1
        };
        return Meteor.users.find({_id: msg.from},{fields: userFields});
      }
    }
  ]
});

// Publish all user's uploaded files
Meteor.publish("getUserFiles", function(){
  if (this.userId) {
    return UserFiles.find({_id: this.userId});
  }
  return this.ready();
});

// Publish provider's questionnaires
Meteor.publish('providerQuestionnaires', function(){
  if (this.userId) {
    var user = Meteor.users.findOne({_id:this.userId});
    if (Roles.userIsInRole(user,['provider'])) {
      let qFields = {providerId: 1, questions: 1, answers: {$elemMatch: {userId: this.userId}}}
      return Questions.find({providerId: this.userId}, {fields: qFields});
    }
    return this.ready();
  }
  return this.ready();
});
// Publish requested provider's questionnaires
Meteor.publish('providerQuestionnairesWithId', function(providerId){
  if (this.userId) {
    let qFields = {providerId: 1, questions: 1, answers: {$elemMatch: {userId: this.userId}}}
    return Questions.find({providerId: providerId}, {fields: qFields});
  }
  return this.ready();
});

Meteor.publish('providerExpertise', function(speciality = null) {
  if (this.userId) {
    // TODO: filter by speciality
    return Expertise.find({}); 
  }
});

