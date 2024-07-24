import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

var afterLogin = function(error, state){
  if (error){
    console.log(error);
    return;
  }
  // log to analytics
  if (state === "signUp") {
    let usr = Meteor.user();
    if (!usr.emails[0].verified) {
      Meteor.logout();
      Meteor.setTimeout(function() { 
        FlowRouter.go('publicWelcome');   
      }, 1000);
    } else {
      FlowRouter.go('adminDashboard');
    }
    
    return;
    // analytics.track("New user registration", {
    //   eventName: "New user registration",
    //   uId: Meteor.userId()
    // });
  }
  // if sign-in, load client params
  if (Meteor.settings.public.APP_MULTI_CLIENT && state === "signIn" && !Meteor.user().admin){
    Meteor.call('getParams', function(error, result) { 
      if (error) { 
        console.log('error', error); 
        Meteor.logout();
        FlowRouter.go('notActive');
        return;
      } 
      if (result) { 
        Session.set('appLogo', result.APP_LOGO);
        Session.set('appBkg', result.APP_BKG);
        window.appParams = result;
        // set app & login & moment default language (from settings.json)
        let defaultLang = result.PRIMARY_LANG;
        if (defaultLang == 'el') {
          i18n.setLanguage('gr');
        } else {
          i18n.setLanguage('en');
        }
        TAPi18n.setLanguage(defaultLang)
        T9n.setLanguage(defaultLang);
        moment.locale(defaultLang);
        // Map useraccounts language custom field tags
        T9n.map('el',{
          'Name': 'Όνομα',
          'Surname': 'Επώνυμο',
          'I am an expert': 'Είμαι ειδικός',
          'Choose app name': 'Επιλογή εφαρμογής εγγραφής',
          'terms': 'Όρους Χρήσης',
          'clickAgree': 'Πατώντας Εγγραφή, συμφωνείτε με τους',
          'and': 'και τους',
          'Verification email lost?': 'Χάσατε το email επιβεβαίωσης;',
          'Send again': 'Αποστολή ξανά',
          'Send email again': 'Επαναποστολή email',
          'Send the verification email again': 'Επαναποστολή του email επιβεβαίωσης',
          'Internal server error': 'Εσωτερικό σφάλμα διακομιστή',
          'undefined': 'Άγνωστο σφάλμα',
          'Minimum required length: 6': 'Ελάχιστο απαιτούμενο μήκος: 6',
          'passwordValidation': 'Εισάγετε τουλάχιστον 1 ψηφίο, 1 μικρό & 1 κεφαλαίο γράμμα.',
          'Invalid email': 'Μη έγκυρο email',
          'requiredField': 'Απαιτούμενο πεδίο'
        });
        T9n.map('en',{
          'requiredField': 'Required field',
          'passwordValidation': 'Insert at least 1 digit, 1 lower-case and 1 upper-case character.'
        });
      } 
    });
  }
  // if redirectTo session variable is set, redirect to that path
  if (Session.get('redirectTo')) {
     var rdTo = Session.get('redirectTo');
     Meteor.setTimeout(function() {
       FlowRouter.go(rdTo.path, rdTo.params);
       Session.set('redirectTo', null);
     }, 1000);
  }
}

var logoutRedirect = function(){
  FlowRouter.go('atSignIn');
}

// before sign up hook: send current language as user language
var preSignUp = function(password, info){
  info.profile.lang = TAPi18n.getLanguage();
  if (Meteor.settings.public.APP_MULTI_CLIENT){
    info.new_app_admin = true;
    info.profile.name = 'admin';
    info.profile.surname = 'admin';
    info.name = 'admin';
    info.surname = 'admin';
  }
}

// useraccounts:flow-router config
AccountsTemplates.configure({
    // flow-router
    defaultLayout: 'mainLayout',
    defaultLayoutRegions: {
        menu: 'mpNavbar',
        footer: 'imFooter'
    },
    defaultContentRegion: 'content',
    // Appearance
    showForgotPasswordLink: true,
	  enablePasswordChange: true,
    //sendVerificationEmail: true,
    showResendVerificationEmailLink: true,
    termsUrl: 'terms-of-use',
    // redirects
    homeRoutePath: '/dashboard',
    // hooks
    onSubmitHook: afterLogin,
    onLogoutHook: logoutRedirect,
    preSignUpHook: preSignUp,
    hideSignUpLink: true,
    showReCaptcha: Meteor.settings.public.reCaptcha.showRecaptcha
});

AccountsTemplates.configure({
    texts: {
      'requiredField': 'requiredField'
    }
});
// remove password field to re-add (override) it
AccountsTemplates.removeField('password');

AccountsTemplates.addFields([
  {
    _id: 'password',
    type: 'password',
    placeholder: 'password',
    required: true,
    displayName: 'password',
    minLength: 6,
    // At least 1 digit, 1 lowercase and 1 uppercase
    re: /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/,
    errStr: 'passwordValidation',
  },
  {
    _id: 'business',
    type: 'text',
    placeholder: 'Business name',
    displayName: 'Business name',
    errStr: 'businessRequired',
    required: true
  },
  // {
  //   _id: 'name',
  //   type: 'text',
  //   placeholder: 'Name',
  //   displayName: 'Name',
  //   errStr: 'nameRequired',
  //   required: true
  // },
  // {
  //   _id: 'surname',
  //   type: 'text',
  //   placeholder: 'Surname',
  //   displayName: 'Surname',
  //   errStr: 'surnameRequired',
  //   required: true
  // }
]);
// add group select if multi client
// if (Meteor.settings.public.APP_MULTI_CLIENT){
//   AccountsTemplates.addField(
//     {
//       _id: 'group',
//       type: 'select',
//       required: true,
//       displayName: 'Choose app name',
//       select: []
//     }
//   );
//   Meteor.call('getTenants', function(error, items) { 
//     if (error) { 
//       console.log('error', error); 
//     } 
//     if (items) { 
//       Session.set('clients', items);
//     } 
//   });
  
// }
// AccountsTemplates.addField(
//   {
//     _id: "provider",
//     type: "checkbox",
//     displayName: 'I am an expert',
//   }
// )
// useraccounts routes config
AccountsTemplates.configureRoute('changePwd');
AccountsTemplates.configureRoute('resetPwd');
AccountsTemplates.configureRoute('enrollAccount', {
  template: 'tmplSignIn'
});
AccountsTemplates.configureRoute('verifyEmail');
AccountsTemplates.configureRoute('signIn',{
  template: 'tmplSignIn'
});
AccountsTemplates.configureRoute('signUp',{
  template: 'tmplSignIn'
});

// redirect from /#/enroll-account to the working /enroll-account
Accounts.onEnrollmentLink(function(token,done){
  FlowRouter.go('/enroll-account'+'/'+token);
})