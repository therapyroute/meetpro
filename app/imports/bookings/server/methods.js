import { Random } from 'meteor/random';

Meteor.methods({
  // updates provider's schedule
  'updateSchedule': function(id,data){
    if (this.userId && (this.userId === id || Roles.userIsInRole(this.userId,'admin'))) {
      appCommon.appLog({uid: id, content: 'Provider saved their schedule'});
      return Meteor.users.update({_id:id}, {$set: {
        "profile.provider.schedule.day": data
      }});
    }
    else {
      throw new Meteor.Error('unauthorized','Cannot update a schedule that is not yours!');
    }
  },
  // updates provider's exceptions (specific dates (whole days))
  'updateExceptions': function(id, data){
    if (this.userId && this.userId === id || Roles.userIsInRole(this.userId,'admin')) {
      appCommon.appLog({uid: id, content: 'Provider saved their exceptions'});
      return Meteor.users.update({_id: id}, {$set: {
        "profile.provider.schedule.exceptions": data
      }});
    }
    else {
      throw new Meteor.Error('unauthorized','Cannot update exceptions for a schedule that is not yours!');
    }
  },
  // updates provider's appointment duration
  'updateDuration': function(id, data){
    check(data, Number);
    if (this.userId && this.userId === id || Roles.userIsInRole(this.userId,'admin')) {
      appCommon.appLog({uid: id, content: 'Provider updated their duration'});
      return Meteor.users.update({_id: id}, {$set: {
        "profile.provider.schedule.duration": data
      }});
    }
    else {
      throw new Meteor.Error('unauthorized','Cannot update duration for a schedule that is not yours!');
    }
  },
  // Adds a new booking with status='pending'
  'addBooking': function(bookingData) {
    // if (this.userId) {
      check(bookingData, {
        userId: String,
        providerId: String,
        start: String,
        end: String,
        status: String,
        payment: String,
        price: Number,
        duration: Number,
        apptType: String,
        newUser: Object
      });
      var theGroup = null;
      var thePass = Random.id(12);
      let oldUser = null;

      // if guest, create user
      if (!this.userId){
        if (Meteor.settings.public.APP_MULTI_CLIENT){
          theGroup = Partitioner.getUserGroup(bookingData.providerId);
          // check if user is already in the DB (has booked before)
          oldUser = Partitioner.bindGroup(theGroup, function(){
            return Meteor.users.findOne({'emails.0.address': bookingData.newUser.uemail});
          });
        } else {
          oldUser = Meteor.users.findOne({'emails.0.address': bookingData.newUser.uemail});
        }
        
        if (oldUser){
          console.log('Returning user...');
          bookingData.userId = oldUser._id;
          delete bookingData.newUser;
          // set a new password in order to login from client...
          Accounts.setPassword(oldUser._id, thePass);
        } else {
          let data = bookingData.newUser;
          let userObject = { 
            email: data.uemail, 
            password: thePass,
            name: data.uname,
            surname: data.usurname
          }; 
          
          let theId = Accounts.createUser(userObject);
          if (Meteor.settings.public.APP_MULTI_CLIENT){
            Partitioner.setUserGroup(theId, theGroup);
          }
          bookingData.userId = theId;
          console.log('Added guest user '+theId);
          delete bookingData.newUser;
          // add name, surname, slug to profile
          let rnd = Math.floor(Math.random() * 1000)
          let slug = data.uname[0] + data.usurname + rnd;

          Meteor.users.update({_id: theId}, {$set:{
            'profile.user.name': data.uname,
            'profile.user.surname': data.usurname,
            'profile.user.allowed_notifications': ['email'],
            'profile.user.slug': slug
          }});
        }   
      }

      var bDate = new Date(bookingData.start);
      // re-check if provider slot is available, just before entering, just in case...
      // ensure the specific slot of the specific provider is not pending, confirmed or completed
      let hasBookings = Bookings.direct.findOne({
        start: bDate,
        userId: {$ne: bookingData.userId},
        providerId: bookingData.providerId,
        status: {$in: ['pending','confirmed','completed']}
      });
      if (!hasBookings) {
        // ensure status = pending
        bookingData.status = 'pending';
        if (Meteor.settings.public.APP_MULTI_CLIENT) {
          // ensure limit is not reached
          let usageResult = appUsage.addAppointment(bookingData.userId);
          if (usageResult == -1) {
            throw new Meteor.Error('appointment-limit', 'You have reached the monthly appointment usage limit!');
          }
        }
        // insert to collection
        if (this.userId){
          return Bookings.insert(bookingData);
        } else {
          let bookingId = null;
          // if guest, return booking id with credentials to login the user from the client
          if (Meteor.settings.public.APP_MULTI_CLIENT){
            bookingId = Partitioner.bindGroup(theGroup, function(){
              return Bookings.insert(bookingData);
            });
          } else {
            bookingId = Bookings.insert(bookingData);
          }
          let returnData = {
            userId: bookingData.userId,
            userPass: thePass,
            bookingId: bookingId,
            oldUser: !!oldUser
          }
          return returnData;
        }
      } else {
        throw new Meteor.Error('taken','Cannot add a new booking! Slot was taken...');
      }
    //}
    // else {
    //   throw new Meteor.Error('unauthorized','Cannot add a new booking!');
    // }
  },
  // when user cancels or payment has failed
  'cancelBooking': function(bookingId) {
    // if (this.userId) {
      check(bookingId, String);
      // find the booking and check if it's made by the current user
      var booking = Bookings.find({_id: bookingId}).fetch();
      var bookingUser = booking[0].userId;
      if (booking && this.userId === bookingUser) {
        appCommon.appLog({uid: this.userId, content: 'Cancelled pending booking ' + bookingId});
        if (Meteor.settings.public.APP_MULTI_CLIENT) {
          // ensure limit is not reached
          let usageResult = appUsage.removeAppointment(this.userId);
        }
        return Bookings.remove({_id: bookingId});
      }
      // else {
      //   throw new Meteor.Error('unauthorized','Cannot remove a booking that is not yours!');
      // }
    // }
  },
  // confirm booking - used when no payment is set
  'confirmBooking': function(bookingId) {
    if (this.userId) {
      check(bookingId, String);
      // find the booking and check if it's made by the current user
      var booking = Bookings.findOne({_id: bookingId});
      var bookingUser = booking.userId;
      if (booking && this.userId === bookingUser) {
        appCommon.appLog({uid: this.userId, content: 'Cancelled pending booking ' + bookingId});
        let res = Bookings.update({_id: bookingId}, {$set:{
          status: 'confirmed'
        }});
        // send notifications (email to provider, sms&email to user)
        Meteor.defer(function() {
          // add event to gCalendar
          appNotifications.addBookingToGCal(bookingId);
          // send notifications
          var opts = {
            payment: 'none',
            action: 'confirm',
            data: bookingId,
            bookingid: bookingId,
            paramsId: appCommon.getParam('_id', null, this.userId)
          };
          appNotifications.sendAllBookingNotifications(opts, function(error, result){
            if(error){
              appCommon.appLog({
                uid: user._id,
                level: 'error',
                content: 'Error while sending booking notifications for no payment '
              });
              console.log("error while sending booking notifications for no payment", error);
            }
            if(result){
              appCommon.appLog({uid: user._id, content: 'confirmations sent for no payment'});
              console.log('confirmations sent for no payment ');
            }
          });
        });
        return res;
      }
    }
    throw new Meteor.Error('unauthorized','Cannot confirm booking!');
  },  
  
  // when user or provider cancels a confirmed (and paid) appointment
  'cancelAppointment': function(apptData) {
	  if (this.userId){
  		check (apptData,{
  			apptId: String,
  			user: String,
  			role: String,
        lang: String
  		});
      apptData.paramsId = appCommon.getParam('_id', null, this.userId);
      // find the booking
  		var booking = Bookings.find({_id: apptData.apptId}).fetch();
      var bookingUser = booking[0].userId;
  	  var bookingProvider = booking[0].providerId;
  	  // cancellation policy is applied here (daysCanCancel)
      // TODO: re-check cancellation check with timezones
  	  var canCancel = moment(booking[0].start).diff(moment(),'days') > appCommon.getParam('daysCanCancel', null, this.userId);
  	  // check if it's made by the current user & cancellation can happen
      if (booking && canCancel && (this.userId === bookingUser || this.userId === bookingProvider || Roles.userIsInRole(this.userId, 'admin'))) {
  			// notify other party (user or provider) (&admin) asynchronously
        Meteor.defer(function() {
          appNotifications.cancellationNotifications(apptData);
        });
        if (Meteor.settings.public.APP_MULTI_CLIENT) {
          // ensure limit is not reached
          let usageResult = appUsage.removeAppointment();
        }
        // return update result
  			return Bookings.update({_id: apptData.apptId}, {$set:{
  				status: 'cancelled',
  				note: 'Cancelled by ' + apptData.user + ' (' + apptData.role + ')'
  			}});
  		 }
  		 else {
          throw new Meteor.Error('unauthorized','Cannot cancel an appointment that is not yours!');
  		 }
	  }
	  else {
        throw new Meteor.Error('unauthorized','Cannot cancel appointments');
    }
  },
  // Add transaction to Booking
  addBookingTransaction: function(bookingId, transaction) {
    if (this.userId) {
      check(bookingId, String);
      check(transaction, {
          trans_type: String,
          trans_orderid: String,
          trans_data: String,
          trans_amount: Number,
          trans_status: String
      });
      appCommon.appLog({uid: this.userId, content: 'Added transaction @ booking ' + bookingId});
      return Bookings.update({_id: bookingId}, { $push: { transactions: transaction } });
    }
    else
      throw new Meteor.Error('unauthorized','Guest cannot add transaction');
  },
  // Return provider's appointment duration (used to properly render fullcalendar)
  getProviderDuration: function(provId) {
    // if (this.userId){
      let theUser = Meteor.users.findOne({_id: provId}, {fields: {
        'profile.provider.schedule': 1,
      }});
      return theUser && theUser.profile.provider.schedule.duration ? 
        theUser.profile.provider.schedule.duration : 
        null;
    //}
    // throw new Meteor.Error('unauthorized','Guest cannot get provider duration');
  },
  getParamsBySlug: function(slug) { 
    check(slug, String);

    let user = Meteor.users.findOne({
      'profile.user.slug': slug
    });
    if (!user) {
      throw new Meteor.Error('error','User not found');
    }
    //let theGroup = user ? Partitioner.getUserGroup(user._id) : null;
    
    let pFields = {
      'BT_PRIVATE_KEY': 0,
      'VP_MERCHANT_ID': 0,
      'VP_API_KEY': 0,
      'VP_SOURCE': 0,
      'PAYPAL_SECRET': 0,
      'bearerToken': 0,
      'subscriptionId': 0
    }
    
    let theParams = null;
    theParams = Meteor.settings.public.APP_MULTI_CLIENT ? Params.findOne({_groupId: Partitioner.getUserGroup(user._id)}, { fields: pFields }) : Params.findOne({}, { fields: pFields });
    return theParams;
    
  },
  getProviderServices: function() {
    let services = Meteor.users.findOne({_id: this.userId}).services;
    //
    // let user = Meteor.users.findOne({_id: this.userId});
    // let a = GoogleApi.get('calendar/v3/calendars/primary/events', {
    //   user: user,
    //   params: {
    //     'calendarId': 'primary',
    //     'timeMin': new Date().toISOString(),
    //     // 'timeMax': new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
    //     'showDeleted': false,
    //     'singleEvents': true,
    //     'orderBy': 'startTime',
    //     'access_type': 'offline'
    //   }
    // });
    // console.log(a);
    // // find primary id
    // let b = GoogleApi.get('calendar/v3/users/me/calendarList/', {
    //   user: user
    // });
    // const items = b.items;
    // const foundIt = items.find( element => element.primary === true );
    // const primaryId = foundIt.id;
    // let primaryId = items.forEach(element => {
    //   //console.log(element.id);
    //   if (element.primary === true) {
    //     return element.id;
    //   }
    // });
    //console.log(primaryId);
    //
    //
    return Object.keys(services);
  },
  unlinkService: function(serviceName) {
    if (!this.userId){
      throw new Meteor.Error('unauthorized','Guest cannot unlink service');
    }
    Accounts.unlinkService(this.userId, serviceName);
    return true;
  },
  // fetch events from provider's linked google calendar (if any)
  // and return them as {start,end} object
  getGCalEvents: function(providerId, dateFrom, dateTo) {
    let provider = Meteor.users.findOne({_id: providerId});
    // check if provider has gCal
    const servicesTemp = Meteor.users.findOne({_id: providerId}).services;
    const services = Object.keys(servicesTemp);
    if (!services.includes('google')) {
      return false;
    }
    // call google api
    let res = GoogleApi.get('calendar/v3/calendars/primary/events', {
      user: provider,
      params: {
        'calendarId': 'primary',
        'timeMin': dateFrom.toISOString(),
        'timeMax': dateTo.toISOString(),
        //'timeMin': new Date().toISOString(),
        // 'timeMax': new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        // 'showDeleted': false,
        // 'singleEvents': true,
        // 'orderBy': 'startTime',
        // 'access_type': 'offline'
      }
    });
    if (res && res.items && res.items.length > 0) {
      let allEvents = [];
      res.items.forEach(item => {
        allEvents.push({'start': item.start.dateTime, 'end': item.end.dateTime});
      });
      //console.log('events: ' + allEvents.length);
      return allEvents;
    } else {
      //console.log(res);
    }
  },
  // get booking data for add to calendar button
  getCalendarData: function(bookingId) {
    let booking = Bookings.findOne({_id: bookingId});
    if (!booking) {
      throw new Meteor.Error('not found','Booking not found');
    }
    let start = moment.utc(booking.start).format('YYYYMMDDTHHmmss') + 'Z';
    let end = moment.utc(booking.end).format('YYYYMMDDTHHmmss') + 'Z';
    let title = TAPi18n.__('appt_gcal', {appName: appParams.APP_NAME});
    let fName = booking.providerfullName();
    let text = TAPi18n.__('appt_with_gcal', {assoc: fName, datetime: moment(booking.start).format('LLLL')});
    let thePath = 'meet/' + booking._id + '/' + booking.userId;
    let theLink = Meteor.absoluteUrl(thePath);
    text += "<br>Meeting link: <a href='"+theLink+"'>"+theLink+"</a>";
    
    let theButton = 'http://www.google.com/calendar/event?action=TEMPLATE&dates=' +start+
    '%2F'+ end + '&text=' + title + '&details=' + text;
    return {
      btn: theButton,
      link: theLink
    }
  }
});
