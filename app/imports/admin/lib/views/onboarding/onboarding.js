import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

Template.steps_bootstrap3.helpers({
  stepClass: function(id) {
    var activeStep = this.wizard.activeStep();
    var step  = this.wizard.getStep(id);
    if (activeStep && activeStep.id === id) {
      return 'active';
    }
    if (step.data()) {
      return 'completed';
    }
    return 'disabled';
  }
});

Template.steps_template.events({
  'click a': function(e, tpl) {
    if (!this.wizard.route) {
      e.preventDefault();
      this.wizard.show(this.id);
    }
  }
});

Template.steps_template.helpers({
  activeStepClass: function(id) {
    var activeStep = this.wizard.activeStep();
    return (activeStep && activeStep.id == id) && 'active' || '';
  }
});

Template.onboardingGeneral.onRendered(function(){
  this.$('#Counter').textCounter({
    target: '#description', // required: string
    count: 300, // optional: if string, specifies attribute of target to use as value
               //           if integer, specifies value. [defaults 140]
    alertAt: 20, // optional: integer [defaults 20]
    warnAt: 10, // optional: integer [defaults 0]
    stopAtLimit: true // optional: defaults to false
  });
});

Template.onboardingGeneral.events({
  'click #logout': function(e, template) {
    e.preventDefault();
    Meteor.logout();
    Meteor.setTimeout(function() { 
      FlowRouter.go('Home');   
    }, 500);
  }
});

Template.onboardingPayments.events({
  'click .wizard-back-button': function(e, template) {
    e.preventDefault();
    this.previous();
  },
  // 'click .wizard-next-button': function(e, template) {
  //   e.preventDefault();
  //   this.next();
  // }
});

Template.onboardingExpert.events({
  'click .wizard-back-button': function(e, template) {
    e.preventDefault();
    this.previous();
  },
  // 'click .wizard-next-button': function(e, template) {
  //   e.preventDefault();
  //   this.next();
  // }
});

Template.onboardingComplete.helpers({
  who: function() {
    const isExpert = this.wizard.mergedData().isExpert;
    return isExpert == 'self' ? 'You' : 'Your expert'
  },
  nextSteps: function() {
    const isExpert = this.wizard.mergedData().isExpert;
    let theText = '';
    if (isExpert == 'self') {
      theText = `<ul><li>Configure more options at the <a href='/admin'>admin interface</a></li>
      <li>Learn how to <a href='https://meetpro.live/faqs/' target='_blank'>embed the bookings to your website</a></li><ul>`;
    } else {
      theText = `<ul><li>Configure more options at the <a href='/admin'>admin interface</a></li>
      <li><a href='/admin/adduser'>add more experts</a></li>
      <li>Learn how to <a href='https://meetpro.live/faqs/' target='_blank'>embed the bookings to your website</a></li><ul>`;
    }
    return theText;
  },
  linkDescription: function(){
    const isExpert = this.wizard.mergedData().isExpert;
    if (isExpert == 'self'){
      let theProfileSlug = Meteor.user().profile.user.slug;
      let theSlug = null;
      if (theProfileSlug) {
        theSlug = theProfileSlug;
      } else {
        const theUser = Meteor.user();
        theSlug = theUser.profile.user.name[0] + theUser.profile.user.surname;
      }
      return Meteor.absoluteUrl('book/'+theSlug);
    } else {
      const theUser = this.wizard.mergedData();
      let theSlug = theUser.profile.user.slug;
      return Meteor.absoluteUrl('book/'+theSlug);
    }
  }
});

Template.onboardingComplete.events({ 
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

Template.tmplOnboardingBasic.onCreated(function() { 
  currentUser = new ReactiveVar(null);
});

Template.tmplOnboardingBasic.helpers({
  steps: function() {
    return [
    {
      id: 'general-information',
      title: 'General information',
      template: 'onboardingGeneral',
      formId: 'onboarding-general-form',
      data: {
        name: appParams.APP_NAME,
        site_url: appParams.SITE_URL
      },
      schema: Schemas.generalInformation,
      onSubmit: function(data, wizard) {
        // console.log(data);
        Meteor.call('onboardingGeneral', data, function(error, success) { 
          if (error) { 
            console.log('error', error); 
          } 
          if (success) { 
             wizard.next()
          } 
        });
      }
    },
    {
      id: 'expert-insert',
      title: 'Expert / Availability',
      schema: Schemas.expertInformation,
      template: 'onboardingExpert',
      formId: 'expertinformation',
      data: {
        myname: Meteor.user().profile.user.name,
        mysurname: Meteor.user().profile.user.surname
      },
      onSubmit: function(data, wizard) { 
        if (data.isExpert == 'self'){
          const roleObj = {
            id: Meteor.userId(),
            newRole: 'provider'
          };
          Meteor.call('addRole', roleObj, function(error, success) { 
            if (error) { 
              console.log('error', error); 
            } 
            if (success) { 
               
            } 
          });
          Meteor.call('onboardingSelfExpert', data, function(error, success) { 
            if (error) { 
              console.log('error', error); 
              if (error.error == 'no-schedule') {
                sweetAlert(TAPi18n.__("fl_error"), TAPi18n.__("schedule_blank"), "error");
                $(".wizard-next-button").removeAttr("disabled");
                return;    
              }
            } 
            if (success) { 
               wizard.next({isExpert: 'self'});
               currentUser.set(Meteor.user());
            } 
          });
          
        } else {
          // Get value from form element
          data.role = 'provider';
          // if (data.password !== data.password_conf) {
          //   sweetAlert(TAPi18n.__("fl_error"), TAPi18n.__("signup_password_match"), "error");
          //   return;
          // }
          // console.log('submit');
          Meteor.call('insertUser', data, true, function(error, success) { 
            if (error) { 
              console.log('error', error); 
              if (error.error == 'notAllowed'){
                sweetAlert(TAPi18n.__("fl_error"), TAPi18n.__("fl_error_provider_limit"), "error");
              } else if (error.reason == "Email already exists.") {
                sweetAlert(TAPi18n.__("fl_error"), TAPi18n.__("signup_email_exists"), "error");
              } else {
                sAlert.error(TAPi18n.__('fl_error') + ': ' + error);
              }        
            } 
            if (success) { 
              // console.log(success);
              wizard.next(success);
            } 
          });
          //wizard.next();
        }
      }
    },
    {
      id: 'payment-information',
      title: 'Accept payments',
      template: 'onboardingPayments',
      formId: 'paymentinformation',
      schema: Schemas.paymentInformation,
      onSubmit: function(data, wizard) {
        let self = this;
        // if paypal, check credentials before proceeding
        if (data.paymentMethod == 'paypal'){
          let b64 = Base64.encode($('#PAYPAL_CLIENT_ID').val()+':'+$('#PAYPAL_SECRET').val());
    
          Meteor.call('checkPaypalCredentials', b64, function(error, result) { 
            if (error || (!!result && result !== 'success') ) { 
              if (!!error) { console.log('error', error); }
              sweetAlert(TAPi18n.__("fl_error"), 'Error validating Paypal credentials', "error");
              self.done();
            } else {
              Meteor.call('onboardingPayments', data, function(error, success) { 
                if (error) { 
                  console.log('error', error); 
                } 
                if (success) { 
                   wizard.next()
                } 
              });      
            }
          });
        } else if (data.paymentMethod == 'stripe'){
          let creds = {
            publicKey: $('#STRIPE_PUBLIC_KEY').val(),
            apiKey: $('#STRIPE_API_KEY').val()
          }
          // First check public key
          let stripe = Stripe( creds.publicKey, {
            betas: ['payment_intent_beta_3']
          });
      
          //Trying to retrieve a customer who don't exist
          //You have to pass only the prefix
          stripe.retrieveSource({
              id: 'src_',
              client_secret: 'src_client_secret_',
          })
          .then(function(result) {
            let res = result.error.message;
            // check if key is invalid
            let test = res.search( 'Invalid API Key' );
            if( test === 0 ){
                //Key invalid
                console.log('error', result.error); 
                sAlert.error('Error: Your Stripe API credentials are NOT valid (Public Key)!');
                $(".wizard-next-button").removeAttr("disabled");
            } else {
                //Now you can validate secret key server side
                Meteor.call('checkStripeCredentials', creds.apiKey, function(error, success) { 
                  if (error) { 
                    console.log('error', error); 
                    sAlert.error('Error: Your Stripe API credentials are NOT valid (API key)!');
                    $(".wizard-next-button").removeAttr("disabled");
                  } 
                  if (success) { 
                    //console.log(success);
                    Meteor.call('onboardingPayments', data, function(error, success) { 
                      if (error) { 
                        console.log('error', error); 
                      } 
                      if (success) { 
                         wizard.next()
                      } 
                    });     
                  } 
                });
            }
          });
        } else if (data.paymentMethod == 'braintree'){
          let creds = {
            merchantId: $('#BT_MERCHANT_ID').val(),
            publicKey: $('#BT_PUBLIC_KEY').val(),
            privateKey: $('#BT_PRIVATE_KEY').val()
          }
          Meteor.call('getClientToken', null, creds, function(error, success) { 
            if (error) { 
              console.log('error', error); 
              sAlert.error('Error: Your Braintree API credentials are NOT valid (API key)!');
              $(".wizard-next-button").removeAttr("disabled");
            } 
            if (success) { 
              Meteor.call('onboardingPayments', data, function(error, success) { 
                if (error) { 
                  console.log('error', error); 
                } 
                if (success) { 
                  wizard.next()
                } 
              });
            } 
          });
        } else if (data.paymentMethod == 'none') {
          Meteor.call('onboardingPayments', data, function(error, success) { 
            if (error) { 
              console.log('error', error); 
            } 
            if (success) { 
              wizard.next()
            } 
          });
        }
      }
    },
    {
      id: 'confirm',
      title: 'Complete',
      template: 'onboardingComplete'
    }
  ];
  }
});
