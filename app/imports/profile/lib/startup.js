Meteor.startup(function(){
  document.title = appParams.APP_NAME;
  // if logged-in, subscribe to Notifications (messages)
  Meteor.subscribe('getNotifications');
});
