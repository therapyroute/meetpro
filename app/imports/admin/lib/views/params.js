
import moment from 'moment-timezone';

Template.tmplAdminParams.onCreated(function() { 
  DocHead.setTitle(appParams.APP_NAME + ': '+TAPi18n.__('sb_params'));
  workFrom = new ReactiveVar(appParams.workhours_from);
  workTo = new ReactiveVar(appParams.workhours_to);
  this.subscribe('allParams');
});
Template.tmplAdminParams.helpers({
  curDoc: function() {
    return Params.findOne({});
  },
  // appLogo: function() {
  //   let params = Params.findOne({});
  //   return params && params.APP_LOGO;
  // },
  appBkg: function() {
    let params = Params.findOne({clientId: appParams.clientId});
    return params && params.APP_BKG;
  },
  s2Opts: function () {
    return {
      language: TAPi18n.getLanguage(),
      theme: 'bootstrap'
    };
  },
  timeZones: function(){
    return _.map(moment.tz.names(), function(t){
      return {label: t, value: t};
    });
  },
  s2popts: function() {
    return { tags: true, theme: 'bootstrap' };
  },
  s2paymentopts: function(){
    let paymentOptions = [ 
      {label: 'Paypal', value: 'paypal'},
      {label: 'Braintree', value: 'braintree'},
      // omit Viva Wallet for now...
      // {label: 'Viva Wallet', value: 'viva'},
      {label: 'Stripe', value: 'stripe'},
      {label: 'None', value: 'none'}
    ]
    return paymentOptions;
  },
  s2Currencies: function() {
    return appClient.currencyList;
  }
});
Template.tmplAdminParams.events({ 
  // 'click #btnModal': function(e,t) {
  //   e.preventDefault();
  //   Modal.show('cropModal');
  // },
  'click #btnToken': function(e,t) {
    e.preventDefault();
    Meteor.call('updateToken', function(error, success) { 
      if (error) { 
        console.log('error', error); 
      }
    });
  },
  'click .paypal-check': function(e,t) {
    e.preventDefault();
    let b64 = Base64.encode($('#PAYPAL_CLIENT_ID').val()+':'+$('#PAYPAL_SECRET').val());
    
    Meteor.call('checkPaypalCredentials', b64, function(error, result) { 
      if (error) { 
        console.log('error', error); 
        sAlert.error('Error: '+ error);
      }
      if (result) {
        if (result === 'success'){
          sAlert.success('Success: Your Paypal API credentials are valid!');
        } else {
          sAlert.error('Error: Your Paypal API credentials are NOT valid!');
        }
      }
    });
  },
  'click .stripe-check': function (e,t) {
    e.preventDefault();
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
          console.log('error', error); 
          sAlert.error('Error: Your Stripe API credentials are NOT valid (Public Key)!');
      } else {
          //Now you can validate secret key server side
          Meteor.call('checkStripeCredentials', creds.apiKey, function(error, success) { 
            if (error) { 
              console.log('error', error); 
              sAlert.error('Error: Your Stripe API credentials are NOT valid (API key)!');
            } 
            if (success) { 
               //console.log(success);
               sAlert.success('Success: Your Stripe API credentials are valid!');
      
            } 
          });
      }
    });
  },
  'click .bt-check': function (e,t) {
    e.preventDefault();
    let creds = {
      merchantId: $('#BT_MERCHANT_ID').val(),
      publicKey: $('#BT_PUBLIC_KEY').val(),
      privateKey: $('#BT_PRIVATE_KEY').val()
    }
    Meteor.call('getClientToken', null, creds, function(error, success) { 
      if (error) { 
        console.log('error', error); 
        sAlert.error('Error: Your Braintree API credentials are NOT valid (API key)!');
      } 
      if (success) { 
        //  console.log(success);
        sAlert.success('Success: Your Braintree API credentials are valid!');
      } 
    });
  }

  // 'click .btnRemove': function(event, temp) {
  //   event.preventDefault();
  //   appParams.APP_BKG = null;
  //   Session.set('appBkg', null);
  //   $("#app-bkg img:last-child").remove();
  //   Meteor.call("removeBackground", function(error, result){
  //     if(error){
  //       console.log("error", error);
  //     }
  //   });
  // },
  // 'change #bkg-inp': function(e,t) {
  //   if (e.target.files && e.target.files[0]) {
  //     // check file extension
  //     let oFile = e.target.files[0];
  //     let fname = oFile.name;
  //     let allowedExtensions = /(\.jpg|\.jpeg|\.png|\.gif|\.tiff)$/i;
  //     if (!allowedExtensions.exec(fname)){
  //       sAlert.error(TAPi18n.__('params_bkg_filetype'));
  //       return;
  //     }
  //     //check file size (<1MB = 1048576 bytes)
  //     if (oFile.size > 1048576){
  //       sAlert.error(TAPi18n.__('params_bkg_size'));
  //       return
  //     }
  //     var uploader = new Slingshot.Upload("appBackgrounds");
  //     uploader.send(oFile, function (error, downloadUrl) {
  //       if (error) {
  //         // Log service detailed response.
  //         console.log(error);
  //         if (error.error === "Upload denied"){
  //           sweetAlert(TAPi18n.__("fl_error"), TAPi18n.__("fl_file_type"), "error");
  //         }
  //       }
  //       else {
  //         Meteor.call('addBackground', downloadUrl, function(error, success) { 
  //           if (error) { 
  //             console.log('error', error); 
  //           } 
  //           if (success) { 
  //             sweetAlert({
  //               title: TAPi18n.__("fl_success"),
  //               type: "success"
  //             });
  //             console.log('background uploaded');
  //             Session.set('appBkg', downloadUrl);
  //           } 
  //         });
  //       }
  //     });
  //   }
  // }
});

AutoForm.addHooks("editParams", {
  onError: function (type,error) {
    sAlert.error(TAPi18n.__('params_fail') + ': ' + error);
    console.log(error);
  },
  onSuccess: function () {
    sAlert.success(TAPi18n.__("params_success"));
  },
  formToModifier: function(modifier) {
    // add working hours
    modifier.$set.workhours_from = workFrom.get();
    modifier.$set.workhours_to = workTo.get();
    // refresh app params (@window)
    window.appParams = modifier.$set;
    return modifier;
  },
});