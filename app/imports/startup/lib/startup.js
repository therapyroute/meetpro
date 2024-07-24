import moment from 'moment-timezone';
import { Session } from 'meteor/session';

Meteor.startup(function () {
  if(Meteor.isClient){
    const GR_LOGIN_MAP = {
      'Name': 'Όνομα',
      'Surname': 'Επώνυμο',
      'I am an expert': 'Είμαι ειδικός',
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
    }
    // Load app parameters and assign to global var 'appParams'
    window.appParams = false;
    if (!Meteor.settings.public.APP_MULTI_CLIENT || Meteor.userId() ) {
      Meteor.call('getParams', function(error, result) { 
        if (error) { 
          console.log('error', error);
          if (error.error === 'inactive' && !Session.get('inactive')){
            Session.set('inactive', true);
          }
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
          T9n.map('el',GR_LOGIN_MAP);
          T9n.map('en',{
            'requiredField': 'Required field',
            'passwordValidation': 'Insert at least 1 digit, 1 lower-case and 1 upper-case character.'
          });
        } 
      });
    } else {
      // set app & login & moment default language (from settings.json)
      window.appParams = {};
      appParams.APP_NAME = Meteor.settings.public.APP_NAME;
      let defaultLang = Meteor.settings.public.DEFAULT_LANG;
      if (defaultLang == 'el') {
        i18n.setLanguage('gr');
      } else {
        i18n.setLanguage('en');
      }
      TAPi18n.setLanguage(defaultLang)
      T9n.setLanguage(defaultLang);
      moment.locale(defaultLang);
      // Map useraccounts language custom field tags
      T9n.map('el',GR_LOGIN_MAP);
      T9n.map('en',{
        'requiredField': 'Required field',
        'passwordValidation': 'Insert at least 1 digit, 1 lower-case and 1 upper-case character.'
      });
    }
  }
});
