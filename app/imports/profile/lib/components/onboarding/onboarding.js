import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

Template.steps_template2.events({
  'click a': function(e, tpl) {
    if (!this.wizard.route) {
      e.preventDefault();
      this.wizard.show(this.id);
    }
  }
});

Template.steps_template2.helpers({
  activeStepClass: function(id) {
    var activeStep = this.wizard.activeStep();
    return (activeStep && activeStep.id == id) && 'active' || '';
  }
});

Template.onboardingCompleteE.helpers({
  linkDescription: function(){
      let theProfileSlug = Meteor.user().profile.user.slug;
      let theSlug = null;
      if (theProfileSlug) {
        theSlug = theProfileSlug;
      } else {
        const theUser = Meteor.user();
        theSlug = theUser.profile.user.name[0] + theUser.profile.user.surname;
      }
      return Meteor.absoluteUrl('book/'+theSlug);
  }
});

Template.onboardingExpertE.events({
  'click #logout': function(e, template) {
    e.preventDefault();
    Meteor.logout();
    Meteor.setTimeout(function() { 
      FlowRouter.go('Home');   
    }, 500);
  }
});

Template.onboardingCompleteE.events({ 
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

Template.tmplOnboardingExpert.helpers({
  steps: function() {
    return [
    {
      id: 'expert-information',
      title: 'Expert / Availability',
      schema: Schemas.expertInformation,
      template: 'onboardingExpertE',
      formId: 'expertinformation1',
      onSubmit: function(data, wizard) { 
          Meteor.call('onboardingExpert', data, function(error, success) { 
            if (error) { 
              console.log('error', error); 
            } 
            if (success) { 
               console.log(success);
            } 
          });
          wizard.next({isExpert: 'self'});
      }
    },
    {
      id: 'confirm',
      title: 'Complete',
      template: 'onboardingCompleteE'
    }
  ];
  }
});
