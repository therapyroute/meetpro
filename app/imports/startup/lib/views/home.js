import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

// tmplSignIn Template
Template.tmplSignIn.helpers({
  appLogo: function() {
    //let logo = Session.get('appLogo');
    //return logo ? logo : '/images/logo.png';
    return '/images/logo.png';
  },
  appBkg: function() {
    //let bkg = Session.get('appBkg');
    //return bkg ? `"background-image: url("${bkg}"); background-attachment: fixed;` :
    //`"background-image: url(/images/video_call.png); background-attachment: fixed;`;
    return `"background-image: url(/images/calendar.jpg); background-attachment: fixed;`;
  },
  appDescription: function() {
    return appParams && appParams.APP_DESCRIPTION ? 
      appParams.APP_DESCRIPTION : 
      TAPi18n.__('services_text');
  },
  appLink: function() {
    return Meteor.settings.public.APP_URL;
  },
  is_multi_client: function() {
    return Meteor.settings.public.APP_MULTI_CLIENT;
  }
});
Template.tmplSignIn.onRendered(function() {
  let self = this;
  self.autorun(function(){
    if (AccountsTemplates.getState() == 'signUp' && Session.get('clients')){
      // dynamically add tenant app names to signup form select on delay
      setTimeout(function() {
        let items = Session.get('clients');
        $.each(items, function (i, item) {
          $('#at-field-group').append($('<option>', { 
              value: item.value,
              text : item.text 
          }));
        });
      }, 500);
    }
  });
});

Template.tmplSignIn.onCreated(function(){
  //DocHead.setTitle(appParams.APP_NAME);
});

// Resend verification email
Template.tmplNotVerified.events({
  'click .resend-verification-link' ( event, template ) {
    Meteor.call( 'sendVerificationLink', TAPi18n.getLanguage(), ( error, response ) => {
      if ( error ) {
        sAlert.error( TAPi18n.__('fl_error_txt') + ': ' + error.reason);
      } else {
        let email = Meteor.user().emails[ 0 ].address;
        sAlert.info(TAPi18n.__('verification_sent') + email);
      }
    });
  }
});

// register global helper here, to also use in startup
Template.registerHelper("appName", function() {
  // return appParams ? appParams.APP_NAME : Meteor.settings.public.APP_NAME;
  return Meteor.settings.public.APP_NAME;
});

Template.tmplWordpress.onCreated(function(){
  // add timeout for browser compatibility
  setTimeout(function() {
    Meteor.loginWithWordpress();
  }, 1500);
  this.autorun(function(){
    if (Meteor.user()) {
      FlowRouter.go('Home');   
    }
  });
});

Template.tmplWordpress.events({
  'click .wp-login' (event, template) {
    Meteor.loginWithWordpress();
  }
});