import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

/* Sidebar code from http://seegatesite.com/create-simple-cool-sidebar-menu-with-bootstrap-3/ */
Template.tmplSidebar.onRendered(function(){
  //$("#wrapper").toggleClass("toggled-2");
});

Template.tmplSidebar.onCreated(function() { 
  selectedRole = new ReactiveVar('expert');
});

Template.tmplSidebar.events({
  // "click #menu-toggle": function(event, template){
  //   event.preventDefault();
  //   $("#wrapper").toggleClass("toggled");
  // },
  // "click #menu-toggle-2": function (event, template){
  //   event.preventDefault();
  //   $("#wrapper").toggleClass("toggled-2");
  //   $('#menu ul').hide();
  // },
  "click #menu li a": function (event, template) {
    if (window.innerWidth <= 768)
      $("#wrapper").toggleClass("toggled");
    // deactivate active link @ sidebar
    var activeLink = template.find('.active')
    if (activeLink){
        activeLink.classList.remove('active')
    }
    // determine if the user clicked li or span
    var parent = event.target.parentNode;
    if (parent.tagName === 'SPAN'){
      parent = event.target.parentNode.parentNode.parentNode;
    }
    // Add the class 'active' to the clicked link.
    parent.classList.add('active')
  },
  "click #logoutButton": function(evt, tmpl) {
    AccountsTemplates.logout();
  },
  "change #currentRole": function(e,t) {
    var targetRole = $(e.target).find(":selected").text().toLowerCase();
    selectedRole.set(targetRole);
    
    if (targetRole == 'expert'){
      FlowRouter.go('commonDashboard');
    } else {
      FlowRouter.go('adminDashboard')
    }
    Meteor.call("updateCurrentRole", targetRole, function(error, result){
    });
  }
});

Template.tmplSidebar.helpers({
  isAdminExpert: function() {
    return Roles.userIsInRole(Meteor.user(), 'admin') && Roles.userIsInRole(Meteor.user(), 'provider');
  },
  isNotAdmin: function() {
    // if admin expert
    if (Roles.userIsInRole(Meteor.user(), 'admin') && Roles.userIsInRole(Meteor.user(), 'provider')){
      return selectedRole.get() == 'expert';
    }
    return Roles.userIsInRole(Meteor.user(), ['user','provider','unconfirmed']);
  },
  links: function(){
    return {
      dashboard: FlowRouter.path("commonDashboard"),
      adminDashboard: FlowRouter.path("adminDashboard"),
      agenda: FlowRouter.path("commonAgenda"),
      appointments: FlowRouter.path("commonBookings"),
      associates: FlowRouter.path("commonAssociates"),
      files: FlowRouter.path("userFiles"),
      profile: FlowRouter.path("commonProfile"),
      messages: FlowRouter.path("commonMessages"),
      statistics: FlowRouter.path("commonStatistics"),
      schedule: FlowRouter.path("commonSchedule"),
      dashboard_hover: TAPi18n.__('sb_dashboard_hover'),
      agenda_hover: TAPi18n.__('sb_agenda_hover'),
      appointments_hover: TAPi18n.__('sb_appointments_hover'),
      files_hover: TAPi18n.__('sb_files_hover'),
      profile_hover: TAPi18n.__('sb_profile_hover'),
      stats_hover: TAPi18n.__('sb_stats_hover'),
      msg_hover: TAPi18n.__('sb_msg_hover'),
      pin_hover: TAPi18n.__('sb_pin_hover'),
      schedule_hover: TAPi18n.__('sb_schedule_hover'),
      admin_dashboard: FlowRouter.path('adminDashboard'),
      admin_bookings: FlowRouter.path('adminAppointments'),
      admin_params: FlowRouter.path('adminParams'),
      admin_users: FlowRouter.path('adminUsers'),
      admin_stats: FlowRouter.path("adminStats"),
    }
  },
  adminLinks: function() {
    return {
      admin_dashboard: FlowRouter.path('adminDashboard'),
      admin_bookings: FlowRouter.path('adminAppointments'),
      admin_users: FlowRouter.path('adminUsers'),
      admin_stats: FlowRouter.path("adminStats"),
      stats_hover: TAPi18n.__('sb_stats_hover'),
      admin_params: FlowRouter.path('adminParams'),
      params_hover:TAPi18n.__('sb_params_hover'), 
      users_hover: TAPi18n.__('sb_users_hover'),
      profile: FlowRouter.path("commonProfile"),
      profile_hover: TAPi18n.__('sb_profile_hover'),
      // Billing related code - left for future reference
      // financial: FlowRouter.path("adminFinancial"),
      // financial_hover: TAPi18n.__('inv_financial_hover'),
    }
  },
  assocTxt: function(){
     return Roles.userIsInRole(Meteor.user(),['provider','unconfirmed']) ? TAPi18n.__('sb_users') : TAPi18n.__('sb_experts');
  },
  assocHover: function(){
     return Roles.userIsInRole(Meteor.user(),['provider','unconfirmed']) ? TAPi18n.__('sb_users_hover') : TAPi18n.__('sb_experts_hover');
  },
  activeChat: function(){
    return Session.get('active_chat');
  },
  chatUrl: function() {
    return FlowRouter.path("commonChatWithId", {bookingId: Session.get('active_chat')});
  },
  fullName: function() {
    return Meteor.user().fullName();
  },
  profileUrl: function() {
    return FlowRouter.path("commonProfile");
  },
  allowFiles: function() {
    return Roles.userIsInRole(Meteor.user(),['user']) && Meteor.settings.public.filesEnabled === 'true';
  },
  ownProfileImage: function() {
    let usr = Meteor.user();
    let photo = usr && usr.profile.user ? usr.profile.user.photo : null;
    return photo ? photo :
        Roles.userIsInRole(Meteor.user(),['provider','unconfirmed']) ?
          '/images/temp-images/expert-avatar.jpg':
          '/images/temp-images/user-avatar.png' ;
  }
});
