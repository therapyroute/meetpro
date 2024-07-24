import jstz from 'jstz';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import sweetAlert from 'sweetalert';
import moment from 'moment-timezone';

Meteor.startup(function(){
  // initialize timezone for logged-in users
  if (Meteor.user()){
    if (Meteor.user().profile.user && Meteor.user().profile.user.timezone){
      Session.set('timezone', Meteor.user().profile.user.timezone);
    }
    else {
      let tz = jstz.determine().name();
      Session.set('timezone', tz);
    }
  }
  // for analytics debugging
  // if (Meteor.settings.public.APP_MODE === "dev" && Meteor.settings.public.analyticsSettings){
  //   analytics.debug();
  // }
  // check if in active appointment (in case of app refresh etc.)
  var now = new Date();
  // Subscribe to current (video call) appointment (if any)
  Meteor.subscribe("currentAppointment", now, {
    onReady: function () {
      var currentBooking = Bookings.findOne(
        { 
          $or: [{userId: Meteor.userId()}, {providerId: Meteor.userId()}], 
          start: {$lt: now}, 
          end: {$gt: now}, 
          status: 'confirmed',
          apptType: 'videocall'
        }
      );
      if (currentBooking){
        Session.set('active_chat', currentBooking._id);
      }
      else {
        Session.set('active_chat', null);
      }
    },
    onError: function () { console.log("onError", arguments); }
  });

  // initialize denied_chat session variable
  Session.set('denied_chat', false);

  // Check every 3 minutes & Alert user on the upcoming appointment enterInterval minutes before start
  Meteor.setInterval(function () {
    var curTime = new Date();
    var routeName = FlowRouter.getRouteName();
    // if not in chat, alert user to enter chat
    if (Meteor.user() && routeName !== 'commonChatWithId') {
      var next = Bookings.findOne(
        { 
          $or: [{userId: Meteor.userId()}, {providerId: Meteor.userId()}], 
          start: {$gt: curTime}, 
          status: 'confirmed',
          apptType: 'videocall'
        }
      );
      if (next) {
        var eInterval = appParams.enterInterval;
        // minStartTime = start time - enterInterval
        var minStartTime = moment(next.start).subtract(eInterval,'minutes').toDate();
        // maxStartTime = start time + enterInterval
        //var maxStartTime = moment(next.start).add(eInterval,'minutes').toDate();
        // maxStartTime = end time
        var maxStartTime = moment(next.end).toDate();
        // Check if active appointment
        if (curTime >= next.start && curTime <= next.end) {
          Session.set('active_chat', next._id);
        }
        // if between min & max start time & not denied before...
        if (curTime >= minStartTime && curTime <= maxStartTime && !Session.get('denied_chat')) {
          sweetAlert({
              title: TAPi18n.__("ap_md_title"),
              text: TAPi18n.__("ap_md_text"),
              type: "warning",
              showCancelButton: true,
              confirmButtonColor: "#DD6B55",
              confirmButtonText: TAPi18n.__("ap_md_confirm"),
              cancelButtonText: TAPi18n.__("ap_md_cancel")
            },
            function(isConfirm){
              if (isConfirm) {
                FlowRouter.go("commonChatWithId", {bookingId: next._id});
              } else {
                sweetAlert(TAPi18n.__("ap_md_cancel_title"), TAPi18n.__("ap_md_canceltxt"), "error");
                Session.set('denied_chat', true);
              }
            }
          );
        }
      }
    }
  }, 3 * 60000);

  // Monitor server connection status every 5 seconds
  Meteor.setInterval(function () {
    let status = Meteor.status().status;
    if (!Session.get('appStatus')){
      Session.set('appStatus', status);
    }
    if (Session.get('appStatus') != status){
      appClient.connectionStatusChange(status);
      Session.set('appStatus', status);
    }
  }, 5000);

});
