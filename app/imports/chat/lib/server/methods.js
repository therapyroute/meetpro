import moment from 'moment-timezone';

// Chat package methods
Meteor.methods({
  // update booking collection with peerId: providerPeerId or userPeerId
  updatePeer: function(peerObj) {
    check(peerObj, {
      bookingId: String,
      userId: String,
      role: String
    });
    // check if loggedin
    const theBooking = Bookings.direct.findOne({
    _id: peerObj.bookingId
    });
    if ( (theBooking && peerObj.role === 'user' && theBooking.call.userOnline) || 
    (theBooking && peerObj.role === 'provider' && theBooking.call.providerOnline) ) {
      throw new Meteor.Error('unauthorized','Cannot log in twice!');
    }

    var now = new Date();
    // check if provider or user and act accordingly
    if (peerObj.role === 'provider') {
      return Bookings.direct.update({_id: peerObj.bookingId}, {$set:{
        'call.providerPeerId': peerObj.userId,
        'call.providerJoinedAt': now,
        'call.providerOnline': true
      }});
    }
    else if (peerObj.role === 'user') {
      return Bookings.direct.update({_id: peerObj.bookingId}, {$set:{
        'call.userPeerId': peerObj.userId,
        'call.userJoinedAt': now,
        'call.userOnline': true
      }});
    }
  },
  // update booking collection when user/provider disconnects
  disconnectPeer: function(bookingId, role) {
    check(bookingId, String);
    check(role, String);
    // check if provider or user and act accordingly
    if (role === 'provider') {
      return Bookings.direct.update({_id: bookingId}, {$set:{
        'call.providerOnline': false
      }});
    }
    else if (role  === 'user' ) {
      return Bookings.direct.update({_id: bookingId}, {$set:{
        'call.userOnline': false
      }});
    }
  },
  // set booking as completed if both user and provider have logged in to chat
  completeBooking: function(bookingId, role) {
      check(bookingId, String);
      check(role, String);
      // check if user & provider have joined. If yes, set booking as completed
      var curBooking = Bookings.direct.findOne({ _id: bookingId, 'call.providerOnline': true, 'call.userOnline': true });
      if (curBooking ) {
        return Bookings.update({_id: bookingId}, { $set: {
          status: 'completed'
        }});
      }
      return false;
  },
  // add log messages to chat @ booking collection
  chatLog: function(bookingId, message, level = 'error') {
      check(bookingId, String);
      check(message, String);
      //check(level, Match.Optional(String));
      var now = new Date();
      var logObj = {
        datetime: now,
        level: level,
        msg: message
      }
      return Bookings.direct.update({_id: bookingId}, { $push: { 'call.messages': logObj } });
  },
  ///////////////////////////////////////////
  // getTestAssoc: For chat testing purposes
  // test user: user@domain
  // test provider: provider@domain
  getTestAssoc: function(isProvider){
    if (this.userId) {
      // ensure vb-testing-2365 booking exists, or create it
      var hasBooking = Bookings.findOne({_id:"vb-testing-2365"});
      var domainName = appCommon.getDomainFromEmail(appCommon.getParam('ADMIN_EMAIL', null, this.userId));
      if (!hasBooking) {
        var user = Meteor.users.findOne({"emails.0.address": `user${domainName}`})._id;
        var provider = Meteor.users.findOne({"emails.0.address": `provider${domainName}`})._id;

        Bookings.insert({
            _id: 'vb-testing-2365',
            userId: user,
            providerId: provider,
            start: "2016-10-26T06:30:00.000Z",
            end: "2016-10-26T07:00:00.000Z",
            status: 'confirmed',
            payment: 'paypal',
            price: 20.00,
            duration: 30
        });
        console.log('Created testing booking');
      }
      // return user/provider id
      if (isProvider){
        return Meteor.users.findOne({"emails.0.address": `user${domainName}`}, {fields: {
           '_id': 1}})._id;
      }
      else {
        return Meteor.users.findOne({"emails.0.address": `provider${domainName}`}, {fields: {
           '_id': 1}})._id;
      }
    }
  },
  getProviderImage: function(pId){
    //if (this.userId){
      let prov = Meteor.users.findOne({_id: pId});
      let pImg = prov.profile.user.photo;
      return pImg ? pImg : null;
    //}
   // throw new Meteor.Error('unauthorized','Guest cannot get a provider photo!');
  },
  getChatData: function(bookingId, uId){
    // initially, calculate the datetime rule to ensure the current datetime is:
    // i minutes before the start time & not after the end time
    // Helper: N (now), S (start), i (interval)
    // N > S-i => N+i > S => 
    // S < N+i
    var theUser = null;
    let theOtherUser = null;
    
    // check if user exists
    theUser = Meteor.users.findOne({_id: uId});
    if (!theUser) {
      throw new Meteor.Error('invalid-user','User not found!');
    }
    const userTZ = theUser.profile.user.timezone ? theUser.profile.user.timezone : 'Europe/London';

    if (Meteor.settings.public.APP_MODE === 'dev'){
      // for dev set imaginary datetimes to override the rule above
      var allowedStartTime = moment('2050-01-01').toDate();
      var curTime = moment('2000-01-01').toDate();
    }
    else {
      let theInterval = appCommon.getParam('enterInterval', null, uId);
      var allowedStartTime = moment().add(theInterval,'minutes').toDate();
      var curTime = moment().toDate();
    }
    // get the booking by Id (should be confirmed or completed) and throw error if:
    // a) the currently logged-in user is not the booking user or provider OR
    // b) the above datetime rule does not apply
    let theBooking = Bookings.direct.findOne({
      _id: bookingId,
      $or: [ {status: 'confirmed'}, {status: 'completed'} ]
      //$or: [ {userId: uId}, {providerId: uId} ],
      // start: {$lte: allowedStartTime},
      // end: {$gte: curTime}
    });
    
    if (!theBooking){
      throw new Meteor.Error('not found','Could not find booking data!');
    }
    if (!theBooking.userId == uId || !theBooking.providerId == uId) {
      throw new Meteor.Error('not allowed','Not allowed to enter this chat!');
    }
    if (theBooking.start > allowedStartTime) {
      const startTime = moment(theBooking.start).tz(userTZ).format("DD-MM-YYYY, HH:mm z");
      throw new Meteor.Error('not allowed','Too early to enter chat! \nAppointment starts at: '+startTime);
    }
    if (curTime > theBooking.end) {
      const endTime = moment(theBooking.end).tz(userTZ).format("DD-MM-YYYY, HH:mm z");
      throw new Meteor.Error('not allowed','Appointment time has passed! \n(End time: '+ endTime + ')');
    }
    // if user
    if (uId == theBooking.userId){ 
      theOtherUser = Meteor.users.findOne({_id: theBooking.providerId},
        { fields: {
            'profile.user.name': 1,
            'profile.user.surname': 1,
            'profile.user.photo': 1,
            'profile.user.slug': 1,
            'profile.provider.specialities': 1,
            'profile.provider.schedule.duration': 1,
            'roles': 1
          }
        }
      );
    } else {  
      theOtherUser = Meteor.users.findOne({_id: theBooking.userId},
        { fields: {
            'profile.user.name': 1,
            'profile.user.surname': 1,
            'profile.user.photo': 1,
            'profile.user.slug': 1,
            'roles': 1
          }
        }
      );
    }
    return {
      'booking': theBooking,
      'user': theUser,
      'otheruser': theOtherUser
    }
  }
});
