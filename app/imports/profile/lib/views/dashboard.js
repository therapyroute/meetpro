import jstz from 'jstz';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import moment from 'moment-timezone';

// Dashboard template based on https://github.com/puikinsh/gentelella
Template.tmplDashboard.onCreated(function() {
  if (Session.get('redirectTo')) {
    var rdTo = Session.get('redirectTo');
    Meteor.setTimeout(function() {
      FlowRouter.go(rdTo.path, rdTo.params);
      Session.set('redirectTo', null);
    }, 1000);
 }
  DocHead.setTitle(appParams.APP_NAME + ': '+TAPi18n.__('dashboard'));
  
  // Determine if expert should onboard
  if (Roles.userIsInRole(Meteor.userId(),'provider')){
    const theUser = Meteor.user().profile.provider;
    // if duration, price or schedule is not set, go to onboarding
    if (!theUser?.schedule?.duration || !theUser?.price || !theUser?.schedule?.day){
      FlowRouter.go('tmplOnboardingExpert', {step: 'expert-information'})
    }
  }
  
  var self = this;
  selectedAppt = new ReactiveVar(null);
  questionFill = new ReactiveVar(null);
  var b = self.subscribe('getNotifications');
});

Template.tmplDashboard.onRendered(function(){
  if (Roles.userIsInRole(Meteor.user(),['unconfirmed'])){
    var usr = Meteor.user().profile;
    if (usr.provider && usr.provider.specialities){
      var txt = TAPi18n.__("un_msg1");
    }
    else {
      var link = FlowRouter.path("commonProfile");
      var txt = TAPi18n.__("un_msg2");
    }
    sAlert.info(txt,{html: true, timeout: 10000});
  }
  // Billing related code - left for future reference
  // else if (Roles.userIsInRole(Meteor.user(),['provider'])){
  //  appClient.checkProviderEssentials();
  // }
  // check if user language is different than current language and change language if needed
  var curUser = Meteor.user();
  var uLang = curUser ? curUser.profile.user.lang : false;
  if (uLang && uLang !== TAPi18n.getLanguage()) {
    //var userLang = Meteor.user().profile.user.lang;
    TAPi18n.setLanguage(uLang);
    T9n.setLanguage(uLang);
    moment.locale(uLang);
    // workaround for anti:i18n (used by reactive-table)
    var antiLang = uLang === 'el' ? 'gr' : 'en';
    i18n.setLanguage(antiLang);
  }
  // recheck for timezone session var
  if (curUser && (typeof Session.get('timezone') === 'undefined' || !Session.get('timezone'))){
    let tz = curUser.profile.user.timezone ? curUser.profile.user.timezone : jstz.determine().name();
    Session.set('timezone', tz);
  }
  // store Time Zone (if not already stored)
  if (curUser && !curUser.profile.user.timezone) {
    Meteor.call('setUserTimezone',Session.get('timezone'));
  }
});

Template.tmplDashboard.helpers({
  isProvider: function() {
    return Roles.userIsInRole(Meteor.user(),['provider']) ? true : false;
  },
  links: function() {
    return {
      agenda: FlowRouter.path("commonBookings"),
      users: FlowRouter.path("commonAssociates"),
      //appointments: FlowRouter.path("commonAppointments"),
      files: FlowRouter.path("userFiles"),
      providers: FlowRouter.path("providersRoute"),
      check: FlowRouter.path("commonCheck")
    }
  },
  isChatActive: function() {
    let now = new Date();
    var cur = Bookings.findOne({ $or: [{userId: Meteor.userId()}, {providerId: Meteor.userId()}], start: {$lt: now}, end: {$gt: now}, status: {$in:['confirmed','completed']}});
    if (cur){
      Session.set("active_chat", cur._id);
      return cur;
    }
    Session.set("active_chat", null);
    return;
  },
  chatUrl: function() {
    return FlowRouter.path("commonChatWithId", {bookingId: Session.get('active_chat')});
  }
});

/////////////////////////////////
// Upcoming appointments template
//////////////////////////////////
Template.tmplUpcomingAppointments.onCreated(function() {
  var self = this;
  this.autorun(function(){
     self.subscribe('upcomingAppts');
  });
});

Template.tmplUpcomingAppointments.helpers({
  hasAppts: function() {
    var now = new Date();
    return Bookings.find({start: {$gt: now}, status: 'confirmed'}).count();
  },
  upcoming: function() {
    var now = new Date();
    return Bookings.find({start: {$gt: now}, status: 'confirmed'}, {limit: 4});
  },
  startTime: function() {
    return appClient.dateCustom(this.start, "dddd, DD-MM-YYYY, HH:mm");
  },
  startMonth: function() {
    return appClient.dateCustom(this.start, "MMMM");
  },
  startDay: function() {
    return appClient.dateCustom(this.start, "D");
  },
  assocName: function() {
    if (Roles.userIsInRole(Meteor.user(),['provider'])){
      return this.userfullName();
    }
    else {
      return this.providerfullName();
    }
  },
  specs: function() {
    if (Roles.userIsInRole(Meteor.user(),['user'])){
      let prov = Meteor.users.findOne({_id: this.providerId});
      return prov && prov.specs();
    }
  },
  isProvider: function() {
    return Roles.userIsInRole(Meteor.user(),['provider']) ? true : false;
  },
});

Template.tmplUpcomingAppointments.events({
  "click .list-item-appointment": function(event, template){
    event.preventDefault();
    selectedAppt.set(this._id);
    Modal.show('apptDialog');
  }
});

Template.tmplDashboardProfile.helpers({
  fullName: function(){
    let usr = Meteor.user();
    return usr && usr.profile.user.name + ' ' + usr.profile.user.surname;
  },
  userImageUrl: function() {
    if (!Meteor.user()) return;
    let uPhoto = Meteor.user().profile.user.photo;
    return uPhoto ? uPhoto :
      Roles.userIsInRole(Meteor.user(),['provider']) ?
        '/images/temp-images/expert-avatar.jpg':
        '/images/temp-images/user-avatar.png';
  }
});

Template.tmplExpertLink.helpers({
  linkDescription: function() {
    let theSlug = Meteor.user().profile.user.slug;
    return Meteor.absoluteUrl('book/'+theSlug);
  }
});

Template.tmplExpertLink.events({ 
  'click #copyUrl': function(event,template) {
		event.preventDefault();
		// get value from input
		var userSlug = $('input[name="bookingLink"]').val();
    // create temp element to copy
    let textarea = document.createElement("textarea");
    textarea.textContent = userSlug;
    textarea.style.position = "fixed"; // Prevent scrolling to bottom of page in MS Edge.
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy"); 
    document.body.removeChild(textarea);
    $(event.target).tooltip('show');
    $('#copyUrl').html('URL copied!');
  },
});