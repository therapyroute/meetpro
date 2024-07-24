import moment from 'moment-timezone';

// Common reusable template helpers
// use @ any template by {{helperName parameter}}
Template.registerHelper("dateFormatLong", function(date){
  if (typeof date === 'undefined')
    return;
  let tzn = Session.get('timezone');
  let frmt = "ddd DD-MM-YYYY, HH:mm";
  return tzn ? moment(date).tz(tzn).format(frmt) : moment(date).format(frmt);
});

Template.registerHelper("dateFormatShort", function(date){
  if (typeof date === 'undefined')
    return;
  let tzn = Session.get('timezone');
  let frmt = "DD-MM-YYYY, HH:mm";
  return tzn ? moment(date).tz(tzn).format(frmt) : moment(date).format(frmt);
});

Template.registerHelper("textExcerpt", function(text){
  if (text.length > 155)
    return text.substr(0,152) + '...';
  else {
    return text;
  }
});

Template.registerHelper("i18nStatus", function(status){
    return TAPi18n.__(status);
});

Template.registerHelper("i18nAppttype", function(type){
  return type === 'videocall' || type == null ? 
    TAPi18n.__('ap_appttype1') :
    TAPi18n.__('ap_appttype2');
});

Template.registerHelper("getSetting", function(setting){
  return Meteor.settings.public[setting];
});

Template.registerHelper("isDevelopment", function() {
  return Meteor.settings.public.APP_MODE === 'dev';
});


Template.registerHelper("hasMessages", function() {
  return Meteor.settings.public.messagesEnabled === 'true';
});

Template.registerHelper("hasFiles", function() {
  return Meteor.settings.public.filesEnabled === 'true';
});

Template.registerHelper("hasf2f", function() {
  return Meteor.settings.public.face2face === 'true';
});

Template.registerHelper("app_multi_client", function() {
  return Meteor.settings.public.APP_MULTI_CLIENT === 'true';
});

// UnderscoreJS template helper to be used for checking if an item is the last one inside an array.
// It can be used inside a Spacebars each to do such a thing.
Template.registerHelper('last',
    function(list, elem) {
        return _.last(list) === elem;
    }
);
// Check if user's email is verified (essential to proceed to booking)
Template.registerHelper("isUserVerified", function() {
  let curUser = Meteor.user();
  return !appClient.isAdmin() ? curUser && curUser.emails[0].verified : true;
});

Template.registerHelper("isSuperAdmin", function() {
  let theUser = Meteor.user();
  return Meteor.settings.public.APP_MULTI_CLIENT && Roles.userIsInRole(theUser,['admin']) && theUser.admin;
});
