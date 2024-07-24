import moment from 'moment-timezone';

Template.mpNavbar.helpers({
  appLogo: function() {
    // let logo = Session.get('appLogo');
    // return logo ? logo : '/images/logo.png';
    return '/images/logo.png';
  },
  logoLink: function(){
    // return Meteor.user() ? '/' : '#';
    return '/';
  }
});
Template.mpNavbar.events({
  "click #loginBtn": function(event, template){
	  AccountsTemplates.setState('signIn');
     Session.set('redirectTo',{
            path: 'commonDashboard',
            params: {}
         });
     FlowRouter.go('/sign-in');
  },
  "click #logoutBtn": function(evt, tmpl) {
    AccountsTemplates.logout();
  },
  // fix to toggle collapsing sidebar when user clicks a link
  "click #menu-toggle": function(event, template){
    event.preventDefault();
    $("#wrapper").toggleClass("toggled");
    $('#menu ul').hide();
  },
  // fix to toggle collapsing main menu when user clicks a link
  "click .navLink,.navbar-collapse ul li button": function(e,t){
    $('.menuBtn:visible').click();
  }
});

// custom language changing dropdown (altered to display uppercase language tags)
Template.i18nDropdown.helpers({
  toUpper: function(val) {
    return val.toUpperCase();
  },
  availableLangs: function(){
    return [
      {tag: 'el', selected: TAPi18n.getLanguage() === 'el' ? 'selected' : ''},
      {tag: 'en', selected: TAPi18n.getLanguage() === 'en' ? 'selected' : ''},
    ];
  }
});
Template.i18nDropdown.events({
  'change .tap-i18n-dropdown select': function(e) {
    // Run every time the language changes
    var curLang = $(e.currentTarget).val().toLowerCase();
    TAPi18n.setLanguage(curLang);
    T9n.setLanguage(curLang);
    moment.locale(curLang);
    // workaround for anti:i18n (used by reactive-table)
    var antiLang = curLang === 'el' ? 'gr' : 'en';
    i18n.setLanguage(antiLang);
    // update user language @ collection
    if (Meteor.userId()) {
      let uid = Meteor.userId();
      Meteor.call("setUserLanguage", uid, curLang);
    }
  }
});
