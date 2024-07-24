import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import moment from 'moment-timezone';

// Contains Notificaton (SMS/email) sending methods
//
// Replace array of strings in string
// taken from http://stackoverflow.com/questions/5069464/replace-multiple-strings-at-once
String.prototype.replaceArray = function(find, replace) {
  var replaceString = this;
  var regex;
  for (var i = 0; i < find.length; i++) {
    regex = new RegExp(find[i], "g");
    replaceString = replaceString.replace(regex, replace[i]);
  }
  return replaceString;
};

// A server object containing all the necessary notification (SMS, email) functions
appNotifications = {
  ///////////////////////////////////////////
  // handles all notificaftion sending to user
  sendAllBookingNotifications(options) {
    // find booking
    // viva, paypal and braintree provides bookingId, so no prob...
    if (options.payment === 'viva' || 
        options.payment === 'paypal' || 
        options.payment === 'braintree' || 
        options.payment === 'none') {
      var booking = Bookings.find({_id: options.data}).fetch();
    }
    // stripe
    else if (options.payment == 'stripe') {
      var booking = Bookings.find({ _id: options.bookingid }).fetch();
    }
    // if no booking is found, throw error...
    if (!booking) {
      appCommon.appLog({level: 'error', content: 'Booking not found while sending all notifications'});
      console.log('Booking not found');
      return;
    }
    // initialize
    var sendOpts = {
      lang: options.lang,
      type: 'email',
      action: options.action,
      receiver: 'user',
      bookingId: booking[0]._id,
      receiverId: booking[0].userId,
      paramsId: options.paramsId
    };
    // start sending...
    // email to user
    appNotifications.sendBookingNotification(sendOpts);
    // sms to user
    sendOpts.type = 'sms';
    appNotifications.sendBookingNotification(sendOpts);
    // if not confirmation, send sms to provider
    if (options.action !== 'confirm') {
      sendOpts.receiver = 'provider';
      sendOpts.receiverId = booking[0].providerId;
      appNotifications.sendBookingNotification(sendOpts);
    }
    // email to provider deprecated: Provider will get a daily email summary at the end of the day

    // schedule reminders (addReminders), only if booking start is after 24hours or more
    let usr = Meteor.users.findOne({_id: booking[0].userId});
    var userTZ = usr && usr.profile.user.timezone ? usr.profile.user.timezone : Meteor.settings.private.SRV_TZ;
    var remTime = moment(booking[0].start).tz(userTZ).subtract(1,'days').toDate();
    var curTime = moment().tz(userTZ).toDate();

    if (curTime < remTime){
      // SMS to user
      sendOpts.type = 'sms';
      sendOpts.receiver = 'user';
      sendOpts.receiverId = booking[0].userId;
      sendOpts.action = 'remind';
      appNotifications.sendBookingNotification(sendOpts);
      // email to user
      sendOpts.type = 'email';
      sendOpts.receiver = 'user';
      sendOpts.action = 'remind';
      appNotifications.sendBookingNotification(sendOpts);
      // SMS to provider
      sendOpts.type = 'sms';
      sendOpts.receiver = 'provider';
      sendOpts.receiverId = booking[0].providerId;
      sendOpts.action = 'remind';
      appNotifications.sendBookingNotification(sendOpts);
    }
    return true;
  },

  // sendBookingNotification
  // Generic method to send booking related smses or emails
  // Gets options object: type: sms/email, action: confirm, remind, cancel etc. / bookingId / receiverId
  sendBookingNotification(options){
     // find booking & verify receiver is user or provider
     var booking = Bookings.findOne({_id: options.bookingId});
     if (booking && (booking.userId === options.receiverId || booking.providerId === options.receiverId)) {
       // get user data
       var theUser = Meteor.users.find({_id: options.receiverId}).fetch();
       var usrLang = theUser[0].profile.user.lang ? theUser[0].profile.user.lang : 'en';
       // if sms
       if (options.type === 'sms') {
         // check if they accept sms
         if (_.contains(theUser[0].profile.user.allowed_notifications, 'sms')){
           // find mobile no.
           var mobile = theUser[0].profile.user.mobile;
           if (typeof mobile === 'undefined'){
             appCommon.appLog({uid: theUser[0]._id, level: 'error', content: 'Mobile not found @ booking ' + options.bookingId});
             console.log('Mobile number not found');
             return;
           }
           else {
             // TO DO: check mobile no. format (could also be checked @ user profile edit)
             // get SMS template
             var tmplOptions = {
               lang: usrLang,
               type: options.type,
               action: options.action,
               receiver: options.receiver
             };

             var messageTextTemplate = this.getNotificationTemplate(tmplOptions);
             // Substitute booking data @ template
             var replacementOpts = { bookingId: options.bookingId, paramsId: options.paramsId };
             var messageText = this.replaceInTemplate(messageTextTemplate, replacementOpts);
             // send or schedule SMS
             if (options.action === 'remind') {
               var curBooking = Bookings.find({_id: options.bookingId}).fetch();
               var userTZ = theUser[0].profile.user.timezone ? theUser[0].profile.user.timezone : 'Europe/London';
               var bookingDateTime = curBooking ? moment(curBooking[0].start).tz(userTZ) : '';
               var details = {
                 to: mobile,
                 text: messageText,
                 type: 'sms',
                 date: bookingDateTime.subtract(1,'days').toDate(),
                 tz: userTZ
               }
               appReminders.scheduleReminder(details);
             }
             else {
               //console.log('Sent SMS to '+ options.receiver);
               appNotifications.bookingNotification(options.bookingId, 'sms', mobile);
               appCommon.sendSMS(messageText, mobile, usrLang);
               // TO DO: check SMS status
             }

           }
         }
         // not accepting SMS
         else {
           appCommon.appLog({
             uid: theUser[0]._id,
             level: 'error',
             content: 'User not accepting SMS: ' + options.receiverId + '-' + options.action
           });
           console.log('User does not accept SMS ' + options.receiverId + '-' + options.action);
           return;
         }
       }
       // if email
       else {
         if (_.contains(theUser[0].profile.user.allowed_notifications, 'email')){
           // find email
           var emailAddress = theUser[0].emails[0].address;
           if (typeof emailAddress === 'undefined'){
             appCommon.appLog({uid: theUser[0]._id, level: 'error', content: 'Email not found @ booking ' + options.bookingId});
             console.log('Email not found');
             return;
           }
           else {
             // get email template
             var tmplOptions = {
               lang: usrLang,
               type: options.type,
               action: options.action,
               receiver: options.receiver
             };
             var messageTextTemplate = this.getNotificationTemplate(tmplOptions);
             // Substitute booking data to template (email template is object {topic:, content:})
             var replacementOpts = { bookingId: options.bookingId, paramsId: options.paramsId };
             var messageData = this.replaceInTemplate(messageTextTemplate.content, replacementOpts);
             // send or schedule email
             if (options.action === 'remind') {
               // add a reminder 1 day before the appointment
               var curBooking = Bookings.find({_id: options.bookingId}).fetch();
               var userTZ = theUser[0].profile.user.timezone ? theUser[0].profile.user.timezone : 'Europe/London';
               var bookingDateTime = curBooking ? moment(curBooking[0].start).tz(userTZ) : '';
               var details = {
                 to: emailAddress,
                 subject: messageTextTemplate.topic,
                 text: messageData,
                 type: 'email',
                 date: bookingDateTime.subtract(1,'days').toDate(),
                 lang: options.lang,
                 tz: userTZ,
                 paramsId: options.paramsId
               }
               appReminders.scheduleReminder(details);
               // add another email reminder 1 hour before the appointment
               bookingDateTime = curBooking ? moment(curBooking[0].start).tz(userTZ) : '';
               details.date = bookingDateTime.subtract(1,'hours').toDate();
               appReminders.scheduleReminder(details);
             }
             // else booking confirmation
             else {
               appNotifications.bookingNotification(options.bookingId, 'email', emailAddress);
               emObj = {
                 lang: usrLang,
                 to: emailAddress,
                 subject: messageTextTemplate.topic,
                 text: messageData,
                 paramsId: options.paramsId
               };
               appCommon.appSendMail(emObj);
             }
           }
         }
         // not accepting email
         else {
           appCommon.appLog({uid: theUser[0]._id, level: 'error', content: 'User not accepting emails'});
           console.log('User does not accept emails');
           return;
         }
       }
     } // of if (booking)
     // no booking found
     else {
       appCommon.appLog({level: 'error', content: 'Booking not found ' + options.bookingId});
       console.log('Booking not found');
       return;
     }
  },

  // update booking collection with sent notifications (email / sms)
  // TODO: update notification status
  bookingNotification(bookingId, type, receiver, status = 'unknown'){
    var now = new Date();
    var nObj = {
      nType: type,
      nCreated: now,
      nReceiver: receiver,
      nStatus: status
    };
    return Bookings.direct.update({_id: bookingId}, { $push: { 'notifications': nObj } });
  },

  // Get notification template from collection
  getNotificationTemplate(options) {
    var tmplRec = NotificationTemplates.find({type: options.type, action: options.action, lang: options.lang}).fetch();
    if (tmplRec && options.type === 'sms')
      return tmplRec[0].content;
    else if (tmplRec && options.type === 'email') {
      return {
        topic: tmplRec[0].topic,
        content: tmplRec[0].content
      }
    }
  },
  // Replace app vars in notification text
  // rStrings: bookingId, cancelReason
  replaceInTemplate(text, rStrings) {
    // get booking info
    var curBooking = rStrings.bookingId ? Bookings.find({_id: rStrings.bookingId}).fetch() : null;
    if (!curBooking) return;
    var providerId = curBooking ? curBooking[0].providerId : null;
    var userId = curBooking ? curBooking[0].userId : null;
    // get provider data
    var curProvider = Meteor.users.findOne({_id: providerId});
    var providerName = providerId ? curProvider.fullName() : '';
    var providerSpecs = providerId ? curProvider.specs().toString() : '';
    // get user data
    var curUser = Meteor.users.findOne({_id: userId});
    var userName = userId ? curUser.fullName() : '';
    var userTZ = curUser.profile.user.timezone ? curUser.profile.user.timezone : 'Europe/London';
    // booking data
    var bookingPrice = curBooking ? curBooking[0].price : '';
    var bookingDateTime = curBooking ? moment(curBooking[0].start).tz(userTZ).format("DD-MM-YYYY, HH:mm z") : '';

    var cancelReason = rStrings.cancelReason ? rStrings.cancelReason : '';
    //var appName = appCommon.getParam('APP_NAME', rStrings.paramsId);
    var appName = Meteor.settings.public.APP_NAME;
    let thePath = 'meet/' + curBooking[0]._id + '/' + curBooking[0].userId;
    let chatUrl = Meteor.absoluteUrl(thePath);
    // do the replacement
    var findStrings = ['%SITE_NAME%','%EXPERT%','%SERVICE%','%PRICE%','%CLIENT%','%DATE_TIME%','%REASON%','%CHAT_URL%'];
    var replaceStrings = [ appName, providerName, providerSpecs, bookingPrice, userName, bookingDateTime, cancelReason, chatUrl];
    return text.replaceArray(findStrings, replaceStrings);
  },

  // send bookings' summary (nextday for next day reminder / summary for daily summary) to providers (by email)
  sendBookingSummary(type) {
    // get bookings (depending on summary type requested)
    var srvTZ = 'Europe/London';
    if (type === 'nextday'){
      var nextDay = moment().tz(srvTZ).startOf('day').add(1,'days').toDate();
      var nextOfNextDay = moment(nextDay).add(1,'days').toDate();
      // get confirmed nextday bookings
      //var bookingsArray = Bookings.find({'start': {$lte: nextDay}}).fetch(); // for testing
      var bookingsArray = Bookings.direct.find({
        'start': {$gte: nextDay, $lt: nextOfNextDay},
        'status': 'confirmed'
      }).fetch();
    } else if (type === 'summary') {
      var curDay = moment().tz(srvTZ).startOf('day').toDate();
      var nextDay = moment(curDay).add(1,'days').toDate();
      // get current day's confirmed bookings
      //var bookingsArray = Bookings.find({'createdAt': {$lte: nextDay}}).fetch(); // for testing
      var bookingsArray = Bookings.direct.find({
        'createdAt': {$gte: curDay, $lt: nextDay},
        'status': 'confirmed'
      }).fetch();
    }
    // if no bookings, return
    if (bookingsArray.length == 0){
      //appCommon.appLog({content: type + ': No Bookings found!'});
      console.log(type + ': No bookings found!');
      return;
    }
    // get provider array (unique values)
    var tempProviders = [];
    _.each(bookingsArray, function(booking){
      tempProviders.push(booking.providerId);
    });
    var providers = _.uniq(tempProviders);

    // get bookings per provider
    var books = [];
    _.each(providers, function(provider){
       var rec = {
          id: provider,
          bookings: []
       };

       _.each(bookingsArray, function(booking){
          if (booking.providerId === provider){
             rec.bookings.push({ start: booking.start, userId: booking.userId, providerId: booking.providerId, createdAt: booking.createdAt});
          }
       });
       books.push(rec);
    });
    //console.log(books);
    ////////////////
    // start sending
    ////////////////
    // Note: return in each proceeds to next iteration
    _.each(books, function(rec){
      // find user & check if they allow emails
      var theUser = Meteor.users.direct.findOne({_id: rec.id});
      // if user not found proceed to next
      if (!theUser) return;
      var userTZ = theUser.profile.user.timezone ? theUser.profile.user.timezone : 'Europe/London';
      // if no email allowed, return
      if (!_.contains(theUser.profile.user.allowed_notifications, 'email')){
        appCommon.appLog({uid: theUser._id, level: 'error', content: type + ': User not accepting emails'});
        console.log('Emails not allowed');
        return;
      }
      // find email address
      var emailAddress = theUser.emails[0].address;
      if (typeof emailAddress === 'undefined'){
        appCommon.appLog({uid: theUser._id, level: 'error', content: type + ': Email not found'});
        console.log('Email not found');
        return;
      }
      // get user language
      var usrLang = theUser.profile.user.lang ? theUser.profile.user.lang : 'en';
      // prepare template options
      var tmplOptions = {
         lang: usrLang,
         type: 'email',
         action: type,
         receiver: 'provider'
      };
      // prepare data for substitution
      if (Meteor.settings.public.APP_MULTI_CLIENT){
        let theGroup = Partitioner.getUserGroup(rec.bookings[0].providerId);
        let theParams = Params.direct.findOne({_groupId: theGroup});
        var appName = theParams ? appCommon.getParam('APP_NAME', theParams._id) : '';
      } else {
        var appName = appCommon.getParam('APP_NAME');
      }
      var tbl = '';

      _.each(rec.bookings, function(book){
        var user = Meteor.users.direct.findOne({_id: book.userId});
        if (user) {
          usr = user.profile.user;
          tbl = tbl + '<tr><td align="left" valign="top">' + moment(book.createdAt).tz(userTZ).format('DD/MM/YYYY, HH:mm') + '</td><td align="left" valign="top">' + moment(book.start).tz(userTZ).format('DD/MM/YYYY, HH:mm') + '</td><td align="left" valign="top">' + usr.name + ' ' + usr.surname +'</td></tr>';
        }
      });
      // prepare template
      var messageTextTemplate = appNotifications.getNotificationTemplate(tmplOptions);
      // Substitute booking data to template (email template is object {topic:, content:})
      var findStrings = ['%SITE_NAME%','%DAY%','%TABLE%'];
      // find date to replace in template
      let specificDay = (type === 'nextday') ?
        moment().add(1,'days').format('DD/MM/YYYY') :
        moment().format('DD/MM/YYYY');
      var replaceStrings = [ appName, specificDay, tbl ];
      var body = messageTextTemplate.content.replaceArray(findStrings, replaceStrings);

      emObj = {
         lang: usrLang,
         to: emailAddress,
         subject: messageTextTemplate.topic,
         text: body,
      };
      //console.log(emObj);
      appCommon.appSendMail(emObj);
    });
  },
  // send current day's bookings' & appointments' summary to admin (by email)
  sendAdminSummary() {
    // check if admin allows sending summaries
    if (!appCommon.getParam('ADMIN_SUMMARIES')){
      console.log('adminsummary: Summaries disabled!');
      return;
    }
    // get current day
    var srvTZ = 'Europe/London';
    var curDay = moment().tz(srvTZ).startOf('day').toDate();
    var nextDay = moment(curDay).add(1,'days').toDate();
    // get current day's confirmed bookings & completed appointments
    var bookingsArray = Bookings.find({
      'createdAt': {$gte: curDay, $lt: nextDay},
      'status': 'confirmed'
    }).fetch();
    var appointmentsArray = Bookings.direct.find({
      'start': {$gte: curDay, $lt: nextDay},
      'status': 'confirmed'
    }).fetch();
    // if no bookings & appointments, return
    if (bookingsArray.length == 0 && appointmentsArray.length == 0){
      appCommon.appLog({content: 'adminsummary: Nothing found!'});
      console.log('adminsummary: Nothing found!');
      return;
    }
    // proceed to sending
    // get admin email address
    var emailAddress = appCommon.getParam('ADMIN_EMAIL');
    // get primary language
    var usrLang = appCommon.getParam('PRIMARY_LANG') ? appCommon.getParam('PRIMARY_LANG') : 'en';
    // prepare template options
    var tmplOptions = {
       lang: usrLang,
       type: 'email',
       action: 'adminsummary',
       receiver: 'admin'
    };
    // prepare data for substitution
    var appName = appCommon.getParam('APP_NAME');
    var tblBookings = tblAppointments = '';

    _.each(bookingsArray, function(book){
      var user = Meteor.users.findOne({_id: book.userId});
      var provider = Meteor.users.findOne({_id: book.providerId});
      if (user && provider) {
        var usrFullname = user.profile.user.name + ' ' + user.profile.user.surname;
        var provFullname = provider.profile.user.name + ' ' + provider.profile.user.surname;
        // <th>ID</th><th>Created At</th><th>Starts At</th><th>User</th><th>expert</th><th>Cost</th>
        tblBookings = tblBookings + '<tr><td>' + book._id + '</td><td align="left" valign="top">' +
        moment(book.createdAt).tz(srvTZ).format('DD/MM/YYYY, HH:mm') +
        '</td><td align="left" valign="top">' + moment(book.start).tz(srvTZ).format('DD/MM/YYYY, HH:mm') +
        '</td><td align="left" valign="top">' + usrFullname +'</td><td align="left" valign="top">' +
        provFullname +'</td><td align="right" valign="top">' + book.price +'</td></tr>';
      }
    });

    _.each(appointmentsArray, function(book){
      var user = Meteor.users.findOne({_id: book.userId});
      var provider = Meteor.users.findOne({_id: book.providerId});
      if (user && provider) {
        var usrFullname = user.profile.user.name + ' ' + user.profile.user.surname;
        var provFullname = provider.profile.user.name + ' ' + provider.profile.user.surname;
        var uJoin = book.call && book.call.userJoinedAt ?
          moment(book.call.userJoinedAt).tz(srvTZ).format('HH:mm:ss') : '-';
        var pJoin = book.call && book.call.providerJoinedAt ?
          moment(book.call.providerJoinedAt).tz(srvTZ).format('HH:mm:ss') : '-';
        // <th>ID</th><th>Started At</th><th>User</th><th>expert</th><th>Status</th><th>User joined</th><th>Provider joined</th>
        tblAppointments = tblAppointments + '<tr><td>' + book._id + '</td><td align="left" valign="top">' +
          moment(book.start).tz(srvTZ).format('DD/MM/YYYY, HH:mm') + '</td><td align="left" valign="top">' +
          usrFullname + '</td><td align="left" valign="top">' +
          provFullname + '</td><td align="left" valign="top">' + book.status + '</td><td align="right" valign="top">' +
          uJoin + '</td><td align="right" valign="top">' + pJoin + '</td></tr>';
      }
    });
    // prepare template
    var messageTextTemplate = appNotifications.getNotificationTemplate(tmplOptions);
    // Substitute booking data to template (email template is object {topic:, content:})
    var findStrings = ['%SITE_NAME%','%DAY%','%TABLE1%','%TABLE2%'];
    // find date to replace in template
    let specificDay = moment().format('DD/MM/YYYY');
    var replaceStrings = [ appName, specificDay, tblBookings, tblAppointments ];
    var body = messageTextTemplate.content.replaceArray(findStrings, replaceStrings);
    // send email
    var emObj = {
       lang: usrLang,
       to: emailAddress,
       subject: messageTextTemplate.topic,
       text: body,
    };
    appCommon.appSendMail(emObj);
  },
  // send current day's bookings' & appointments' summary to admin (by email)
  // for multi client app
  sendAdminSummaryMulti() {
    if (!Meteor.settings.public.APP_MULTI_CLIENT) {
      return;
    }
    // find all clients with enabled admin summaries
    let allParams = Params.direct.find({'ADMIN_SUMMARIES': true});
    allParams.forEach(params => {
      let paramsId = params._id;

      // get current day
      var srvTZ = 'Europe/London';
      var curDay = moment().tz(srvTZ).startOf('day').toDate();
      var nextDay = moment(curDay).add(1,'days').toDate();
      // get current day's confirmed bookings & completed appointments
      var bookingsArray = Bookings.direct.find({
        'createdAt': {$gte: curDay, $lt: nextDay},
        'status': 'confirmed',
        '_groupId': params._groupId
      }).fetch();
      var appointmentsArray = Bookings.direct.find({
        'start': {$gte: curDay, $lt: nextDay},
        'status': 'confirmed',
        '_groupId': params._groupId
      }).fetch();
      // if no bookings & appointments, return
      if (bookingsArray.length == 0 && appointmentsArray.length == 0){
        appCommon.appLog({content: 'adminsummary: Nothing found for ' + params._groupId});
        console.log('adminsummary: Nothing found for ' + params._groupId);
        return;
      }
      // proceed to sending
      // get admin email address
      var emailAddress = appCommon.getParam('ADMIN_EMAIL', paramsId);
      // get primary language
      var usrLang = appCommon.getParam('PRIMARY_LANG', paramsId) ? appCommon.getParam('PRIMARY_LANG', paramsId) : 'en';
      // prepare template options
      var tmplOptions = {
        lang: usrLang,
        type: 'email',
        action: 'adminsummary',
        receiver: 'admin'
      };
      // prepare data for substitution
      var appName = appCommon.getParam('APP_NAME', paramsId);
      var tblBookings = tblAppointments = '';

      _.each(bookingsArray, function(book){
        var user = Meteor.users.direct.findOne({_id: book.userId});
        var provider = Meteor.users.direct.findOne({_id: book.providerId});
        if (user && provider) {
          var usrFullname = user.profile.user.name + ' ' + user.profile.user.surname;
          var provFullname = provider.profile.user.name + ' ' + provider.profile.user.surname;
          // <th>ID</th><th>Created At</th><th>Starts At</th><th>User</th><th>expert</th><th>Cost</th>
          tblBookings = tblBookings + '<tr><td>' + book._id + '</td><td align="left" valign="top">' +
          moment(book.createdAt).tz(srvTZ).format('DD/MM/YYYY, HH:mm') +
          '</td><td align="left" valign="top">' + moment(book.start).tz(srvTZ).format('DD/MM/YYYY, HH:mm') +
          '</td><td align="left" valign="top">' + usrFullname +'</td><td align="left" valign="top">' +
          provFullname +'</td><td align="right" valign="top">' + book.price +'</td></tr>';
        }
      });

      _.each(appointmentsArray, function(book){
        var user = Meteor.users.direct.findOne({_id: book.userId});
        var provider = Meteor.users.direct.findOne({_id: book.providerId});
        if (user && provider) {
          var usrFullname = user.profile.user.name + ' ' + user.profile.user.surname;
          var provFullname = provider.profile.user.name + ' ' + provider.profile.user.surname;
          var uJoin = book.call && book.call.userJoinedAt ?
            moment(book.call.userJoinedAt).tz(srvTZ).format('HH:mm:ss') : '-';
          var pJoin = book.call && book.call.providerJoinedAt ?
            moment(book.call.providerJoinedAt).tz(srvTZ).format('HH:mm:ss') : '-';
          // <th>ID</th><th>Started At</th><th>User</th><th>expert</th><th>Status</th><th>User joined</th><th>Provider joined</th>
          tblAppointments = tblAppointments + '<tr><td>' + book._id + '</td><td align="left" valign="top">' +
            moment(book.start).tz(srvTZ).format('DD/MM/YYYY, HH:mm') + '</td><td align="left" valign="top">' +
            usrFullname + '</td><td align="left" valign="top">' +
            provFullname + '</td><td align="left" valign="top">' + book.status + '</td><td align="right" valign="top">' +
            uJoin + '</td><td align="right" valign="top">' + pJoin + '</td></tr>';
        }
      });
      // prepare template
      var messageTextTemplate = appNotifications.getNotificationTemplate(tmplOptions);
      // Substitute booking data to template (email template is object {topic:, content:})
      var findStrings = ['%SITE_NAME%','%DAY%','%TABLE1%','%TABLE2%'];
      // find date to replace in template
      let specificDay = moment().format('DD/MM/YYYY');
      var replaceStrings = [ params.APP_NAME, specificDay, tblBookings, tblAppointments ];
      var body = messageTextTemplate.content.replaceArray(findStrings, replaceStrings);
      // send email
      var emObj = {
        lang: usrLang,
        to: emailAddress,
        subject: messageTextTemplate.topic,
        text: body,
        paramsId: paramsId
      };
      appCommon.appSendMail(emObj);
    });
    
  },
  
  // notify other party (&admin) on appointment cancellation
  cancellationNotifications(apptData) {
    var booking = Bookings.findOne({_id: apptData.apptId});
    // notify associate via system message
    var assocId = apptData.role === 'user' ? booking.providerId : booking.userId;
    var assocFullName = apptData.role === 'user' ? booking.providerfullName() : booking.userfullName();
    var initiatorFullName = apptData.role === 'provider' ? booking.providerfullName() : booking.userfullName();
    var initiator = Meteor.users.findOne({_id: apptData.user});
    var userTZ = initiator.profile.user.timezone ? initiator.profile.user.timezone : Meteor.settings.private.SRV_TZ;
    var apptStart = moment(booking.start).tz(userTZ).format("DD-MM-YYYY, HH:mm");
    var path = Meteor.absoluteUrl() + FlowRouter.path("commonAssociate") + '/' + apptData.user;
    var msg = {
      from: 'system',
      to: assocId,
      subject: TAPi18n.__('ap_cancel_subj', {}, apptData.lang),
      message: TAPi18n.__('ap_cancel_txt',{ postProcess: 'sprintf', sprintf: [assocFullName, apptStart, path] }, apptData.lang),
      icon: 'exclamation-triangle'
    };
    //var messageSent = appCommon.sendMessage(msg);
    // notify admin (by email)
    let tmpTxt = apptData.role + ' ' + initiatorFullName + ' has just cancelled the appointment with ' + assocFullName + ' on ' + apptStart;
    console.log(tmpTxt);
    appCommon.appLog({uid: this.userId, content: tmpTxt});
    
    let theParams = Meteor.settings.public.APP_MULTI_CLIENT ?
      Params.direct.findOne({_groupId: Partitioner.getUserGroup(booking.providerId)}) : Params.findOne({});
    Email.send({
      to: appCommon.getParam('ADMIN_EMAIL', theParams._id),
      from: appCommon.getParam('APP_EMAIL', theParams._id),
      subject: 'Appointment ' + apptData.apptId + ' Cancellation',
      text: tmpTxt
    });
    // notify user
    var sendOpts = {
      lang: apptData.lang,
      type: 'email',
      action: 'cancel',
      receiver: 'user',
      bookingId: apptData.apptId,
      receiverId: booking.userId,
      paramsId: apptData.paramsId
    };
    // start sending...
    // email to user
    appNotifications.sendBookingNotification(sendOpts);
  },
  // add booking as event @ provider's linked google calendar
  addBookingToGCal(bookingId){
    let booking = Bookings.direct.findOne({_id: bookingId})
    if (!booking) {
      return false;
    }
    
    // check if provider has gCal
    const servicesTemp = Meteor.users.findOne({_id: booking.providerId}).services;
    const services = Object.keys(servicesTemp);
    if (!services.includes('google')) {
      return false;
    } 
    // insert event to gCal
    let user = Meteor.users.findOne({_id: booking.userId});
    let userFname = null;
    if (user && user.profile && user.profile.user && user.profile.user.name && user.profile.user.surname){
      userFname = user.profile.user.name + ' ' + user.profile.user.surname;
    } else {
      userFname = 'unknown';
    }
    let event = {
      'summary': 'Video call appointment',
      'description': 'Video call appointment with ' + userFname,
      'start': {
        'dateTime': booking.start,
        //'timeZone': 'Europe/London',
      },
      'end': {
        'dateTime': booking.end,
        //'timeZone': 'Europe/London',
      },
      // 'attendees': [
      //   {'email': 'lpage@example.com'},
      //   {'email': 'sbrin@example.com'},
      // ],
      // 'reminders': {
      //   'useDefault': false,
      //   'overrides': [
      //     {'method': 'email', 'minutes': 24 * 60},
      //     {'method': 'popup', 'minutes': 10},
      //   ],
      // },
    };

    let provider = Meteor.users.findOne({_id: booking.providerId});
    GoogleApi.post('calendar/v3/calendars/primary/events', {
      user: provider,
      data : event,
    }, function(err, res){
      if (err) {
        console.log(err);
      }
      if (res) {
        console.log('Added calendar event for booking ' + bookingId);
        //console.log(res);
      }
    });
  }
} // of appNotifications object
