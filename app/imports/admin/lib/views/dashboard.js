import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

Template.tmplAdminDashboard.onCreated(function() { 
  DocHead.setTitle(appParams.APP_NAME + ': '+TAPi18n.__('dashboard'));
  // if logged-in from WP, load appParams from DB
  if (Object.keys(appParams).length == 1) {
    Meteor.call('getParams', function(error, result) { 
      if (error) { 
        console.log('error', error); 
        if (error.error === 'inactive' && !Session.get('inactive')){
          Session.set('inactive', true);
        }
        //FlowRouter.go('notActive');
        //return;
      } 
      if (result) { 
        window.appParams = result;
      }  
    });
  }
  
  // check if admin should start onboarding
  Meteor.call('adminShouldOnboard', function(error, result) { 
    if (error) { 
      console.log('error', error); 
    } 
    if (result === 'yes') { 
       FlowRouter.go('tmplOnboardingBasic', {step: 'general-information'})
    } 
  });
});

Template.tmplAdminDashboard.helpers({ 
  isInactive: function() {
    return Session.get('inactive');
  }
});