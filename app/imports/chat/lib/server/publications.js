// Chat package publications

Meteor.publishComposite("chatPublication", function(bookingId){
	return {
		find: function() {
      // initially, calculate the datetime rule to ensure the current datetime is:
      // i minutes before the start time & not after the end time
      // Helper: N (now), S (start), i (interval)
      // N > S-i => N+i > S => 
      // S < N+i
      if (Meteor.settings.public.APP_MODE === 'dev'){
        // for dev set imaginary datetimes to override the above rule
        var allowedStartTime = moment('2050-01-01').toDate();
        var curTime = moment('2000-01-01').toDate();
      }
      else {
        var allowedStartTime = moment().add(appCommon.getParam('enterInterval', null, this.userId),'minutes').toDate();
        var curTime = moment().toDate();
      }
      // return the booking with the given Id, if & only if:
      // a) the currently logged-in user is the booking user or provider AND
      // b) the above datetime rule applies
      return Bookings.find({
        _id: bookingId,
        $or: [ {userId: this.userId}, {providerId: this.userId} ],
        $or: [ {status: 'confirmed'}, {status: 'completed'} ],
        start: {$lte: allowedStartTime},
        end: {$gte: curTime}
      });
    },
		children: [
      {
       find: function(booking){
         var user = Meteor.users.findOne({_id:this.userId});
         // return associate, publishing fields instead of whole profile
         if (Roles.userIsInRole(user,['user'])) {
           return Meteor.users.find({_id: booking.providerId},{fields: {
            'profile.user.name': 1,
            'profile.user.surname': 1,
            'profile.user.photo': 1,
            'profile.user.slug': 1,
            'profile.provider.specialities': 1,
            'profile.provider.schedule.duration': 1,
            'roles': 1
          }});
         }
         else if (Roles.userIsInRole(user,['provider'])) {
           return Meteor.users.find({_id: booking.userId},{fields: {
            'profile.user.name': 1,
            'profile.user.surname': 1,
            'profile.user.photo': 1,
            'profile.user.slug': 1,
            'roles': 1
          }});
         }
       }
      },
      {
       find: function(booking){
         var user = Meteor.users.findOne({_id:this.userId});
         if (Roles.userIsInRole(user,['user'])){
           var assoc = booking.providerId;
           // should see that again. It returns an array of all shared files - $filter does not work
             return UserFiles.find({_id: this.userId, uploads: {$elemMatch: {assignedTo: assoc}}});
           //return UserFiles.find({_id: assocUser._id, 'uploads.assignedTo': this.userId}, {'uploads': {$elemMatch: {'assignedTo': this.userId}}});
         }
         else{
           var assoc = booking.userId;
           return UserFiles.find({_id: assoc, uploads: {$elemMatch: {assignedTo: this.userId}}});
         }
       }
      },
      {
       find: function(booking){
         var user = Meteor.users.findOne({_id:this.userId});
         if (Roles.userIsInRole(user,['user'])) {
           return Private.find({owner: this.userId, associate: booking.providerId});
         }
         else if (Roles.userIsInRole(user,['provider'])) {
           return Private.find({owner: this.userId, associate: booking.userId});
         }
       }
      }
		]
	}
});
