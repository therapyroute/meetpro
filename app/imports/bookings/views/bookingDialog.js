import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import moment from 'moment-timezone';
import sweetAlert from 'sweetalert';
import './braintree.js';
import './viva.js';

//////////////////
// Booking dialog
//////////////////
Template.tmplBookingDialog.rendered = function(){
  // show address tooltip if face2face is enabled
  if (appClient.hasf2f){
   $('#addressTooltip').tooltip();
 }
};
// Billing related code - left for future reference
Template.tmplBookingDialog.onCreated(function() {
 // check if payment services are set
 if (!params.get().enabledPayments){
   sweetAlert({title:TAPi18n.__("fl_error"),text: TAPi18n.__("b_nopayments"),type: "error"});
   clicked_booking.set(false);
 }
//   // check if price and viva wallet are set
//   var curId = provId.get();
//   let usr = Meteor.users.findOne({_id: curId});
//   let price = usr && usr.profile.provider.price;
//   let viva = usr && usr.profile.provider.viva;
//   // note: checking only viva pkey because we don't want to publish all viva data
//   let missingViva = !viva || !viva.VP_PUBLIC_KEY;
//   if (!price || missingViva) {
//     sweetAlert({title:TAPi18n.__("fl_error"),text: TAPi18n.__("b_nodata"),type: "error"});
//     clicked_booking.set(false);
//   }
});
Template.tmplBookingDialog.events({
 "click .closeDialog": function(event, template){
    clicked_booking.set(false);
    start.set(null);
    // log to analytics
   //  analytics.track("User abandoned booking", {
   //   eventName: "Booking abandoned",
   //   uId: Meteor.userId()
   // });
 },
 "click .createBooking": function(ev, tmpl){
   // first, ensure user has agreed to terms...
   if (!tmpl.find('#agreeTerms').checked) {
     sweetAlert({title:TAPi18n.__("fl_error"),text: TAPi18n.__("ap_mustagree"),type: "error"});
     return;
   }
   // start building booking data
   var bookingData = {};

   // if guest, ensure mandatory fields are filled-in
   if (!Meteor.user()) {
     if (tmpl.find('#uname') && tmpl.find('#usurname') && tmpl.find('#uemail')) {
       let email = tmpl.find('#uemail').value;
       let validEmail = /^[A-Z0-9'.1234z_%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(email);
       if (!validEmail){
         sweetAlert({title:TAPi18n.__("fl_error"),text: TAPi18n.__("ap_invalidemail"),type: "error"});
         return;            
       }

       let newUser = {
         uname: tmpl.find('#uname').value,
         usurname: tmpl.find('#usurname').value,
         uemail: email
       };
       bookingData.newUser = newUser;
       userId.set('111111'); //dummy data
     } else {
       sweetAlert({title:TAPi18n.__("fl_error"),text: TAPi18n.__("ap_mandatory"),type: "error"});
       return;
     }
   } else {
     bookingData.newUser = {};
     userId.set(Meteor.userId());
   }
    
   let userTZ = Session.get('timezone') ? Session.get('timezone') : 'Europe/London';
   bookingData.userId = userId.get();
   bookingData.providerId = provId.get();
   // convert times to utc for DB using time zone offset
   // see http://blog.skylight.io/bringing-sanity-to-javascript-utc-dates-with-moment-js-and-ember-data/
   bStart = moment(start.get());
   bOffset = bStart.utcOffset();
   bookingData.start = bStart.subtract(bOffset, 'minutes').format();
   bookingData.end = moment(bookingData.start).add(durationRV.get(),'minutes').format();
   // add as 'pending', confirm later
   bookingData.status = 'pending';
   if (params.get().enabledPayments.length > 1) {
     bookingData.payment = tmpl.find('#paymentType').value;
   } else {
     bookingData.payment = params.get().enabledPayments.toString();
   }
   // if face2face is an option, read the selected value. Else, save as videocall.
   let allowf2f = Meteor.users.findOne({_id: provId.get()}).profile.provider.allowf2f;
   let canf2f = Meteor.settings.public.face2face && allowf2f;
   if (canf2f){
     bookingData.apptType = tmpl.find('#apptType').value;
   } else {
     bookingData.apptType = 'videocall';
   }
   bookingData.price = priceRv.get();
   bookingData.duration = durationRV.get();
   //console.log(bookingData);

   // create a 'pending' booking for now. Confirm later when payment is received or cancel if not.
   Meteor.call("addBooking", bookingData, function(error, result){
     if(error){
       console.log("error", error);
       clicked_booking.set(false);
       sweetAlert({title:TAPi18n.__("fl_error"),text: TAPi18n.__("b_notadded")+': '+error,type: "error"});
     }
     if (result) {
       // if admin, proceed directly to edit booking page
       if (appClient.isAdmin()) {
         FlowRouter.go("adminEditAppointment",{bookingId: result});
         return;
       }
       if (Meteor.userId()){
         bookingData.id = result;
       } else {
         // if guest, get data from the server and login the user
         bookingData.id = result.bookingId;
         Meteor.loginWithPassword({id: result.userId}, result.userPass, function(e,r){
           if (e) {
             console.log(e);
           }
           if (r) {
             console.log(r);
           }
         });
       }
       // 'load' booking data into ReactiveVar
       bookingDataVar.set(bookingData);
       console.log('pending booking was created (' + result + ')');
       // proceed according to payment method
       if (bookingData.payment === 'braintree') {
         start.set(null);
         clicked_booking.set(false);
         paymentBraintree.set(true);
       }
       else if (bookingData.payment === 'viva') {
         start.set(null);
         clicked_booking.set(false);
         paymentViva.set(true);
       }
       else if (bookingData.payment === 'stripe') {
         start.set(null);
         clicked_booking.set(false);
         paymentStripe.set(true);
       }
       else if (bookingData.payment === 'paypal') {
         start.set(null);
         clicked_booking.set(false);
         paymentPaypal.set(true);
       } else {
        Meteor.call("confirmBooking", bookingData.id, function(error, result){
          if (result){
            var queryParams = {success: 'true', bookingId: bookingData.id, f2f: 'true'};
            queryParams.f2f = bookingData.apptType == 'f2f' ? 'true' : 'false';
            FlowRouter.go("paymentResult", null, queryParams);
          }
        });
       }     
     }
   });
 }
});

Template.tmplBookingDialog.helpers({
 providerFName: function() {
   let theUser = Meteor.users.findOne({_id: provId.get()});
   let uSpecs = theUser ? theUser.specs().join() : null;
   let profile = theUser ? theUser.profile.user : null;
   return profile ? profile.name + ' ' + profile.surname + ' (' + uSpecs + ')' : '';
 },
 start: function(){
   return moment(start.get()).utc().format('DD-MM-YYYY, HH:mm');
 },
 end: function() {
   return moment(start.get()).utc().add(durationRV.get(),'minutes').format('DD-MM-YYYY, HH:mm');
 },
 price: function() {
   var curId = provId.get();
   var price = Meteor.users.findOne({_id: curId}).profile.provider.price;
   priceRv.set(price);
   return price;
 },
 agreeText: function(){
   return TAPi18n.__('ap_agree');
 },
 // return the provider's address (if set)
 providerAddress: function(){
   let address = Meteor.users.findOne({_id: provId.get()}).profile.provider.address;
   return address && address.length > 0 ? 
     TAPi18n.__('address') + ': ' + address :
     TAPi18n.__('no_address');
 },
 canHaveF2F: function(){
  let usr = Meteor.users.findOne({_id: provId.get()})
  let allowf2f = usr.profile && usr.profile.provider.allowf2f;
  return Meteor.settings.public.face2face && allowf2f;
 },
 paymentOptions: function(){
   let opts = '';
   let optObj = {
   'paypal': '<option value="paypal">Paypal</option>',
   'braintree': '<option value="braintree">Braintree</option>',
   'viva': '<option value="viva">Viva Wallet</option>',
   'stripe': '<option value="stripe">Stripe</option>'
   }
   if (!params.get().enabledPayments) {
     return;
   }
   params.get().enabledPayments.forEach(function(item){
     opts += optObj[item];
   });
   return opts;
 },
 multiPayments: function() {
   return params.get().enabledPayments.length > 1 ? true : false;
 },
 currency: function() {
   return params.get().currency;
 }
});

Template.tmplStripePayment.events({ 
 'click #checkout-button': function(event, template) { 
   // Create an instance of the Stripe object with your publishable API key
   try {
     var stripe = Stripe(params.get().STRIPE_PUBLIC_KEY);
   }
   catch (err){
     let errStr = 'Could not send create stripe object: ' + err;
     console.log(errStr);
     sweetAlert({title:TAPi18n.__("fl_error"),text: TAPi18n.__("b_vivaerror"),type: "error"});
     return;
   }
   var bookingData = bookingDataVar.get();
   var bookingId = bookingDataVar.get().id;
   var bookingAmount = bookingData.price;
   // Create a new Checkout Session using the server-side endpoint you
   // created in step 3.
   Meteor.call('createStripeCheckoutSession', bookingId, bookingAmount, function(error, response) { 
     if (error) { 
       console.log("error", error);
       sweetAlert({title:TAPi18n.__("fl_error"),text: TAPi18n.__("b_vivaerror"),type: "error"});
       $('.lead').empty();
       $('.lead').append(TAPi18n.__('b_vivaerror'));
       Meteor.call('cancelBooking', bookingData.id, function(error, result){
         if(error){
           console.log("error", error);
         }
         if(result){
           //console.log(bookingData.id + ' was cancelled');
           paymentStripe.set(false);
         }
       });
     } 
     if (response) { 
         //console.log(response);
         var transaction = {
           trans_type: "stripe",
           trans_orderid: String(response),
           trans_data: "",
           trans_amount: bookingDataVar.get().price,
           trans_status: 'pending'
         };
         Meteor.call('addBookingTransaction', bookingId, transaction, function(error, result){
           if(error){
             console.log("error", error);
           }
           if(result){
             paymentStripe.set(false);
             // proceed to stripe checkout
             let result = stripe.redirectToCheckout({ sessionId: response });
           }
         });
     } 
   });
 },
 "click .closeDialog": function(event, template){
   var bookingData = bookingDataVar.get();
   // if user closes the payment dialog, cancel the pending booking
   Meteor.call('cancelBooking', bookingData.id, function(error, result){
     if(error){
       console.log("error", error);
     }
     /*if(result){
        console.log(bookingData.id + ' was cancelled');
     }*/
   });
    paymentStripe.set(false);
    bookingDataVar.set(null);
 } 
});

Template.tmplStripePayment.helpers({
 subTitle: function(){
   let theUser = Meteor.users.findOne({_id: provId.get()});
   let uSpecs = theUser ? theUser.specs().join() : null;
   let profile = theUser ? theUser.profile.user : null;
   let fName = profile ? profile.name + ' ' + profile.surname : '';
   let uTZ = Session.get('timezone') ? Session.get('timezone') : 'Europe/London';
   return TAPi18n.__('appt_with_booking', {assoc: fName, specs: uSpecs, datetime: moment(bookingDataVar.get().start).tz(uTZ).format('LLLL')});
 }
});

// Paypal payments
Template.tmplPaypalPayment.onCreated(function() {
 $.ajaxSetup({ cache: true });
 let cId = params.get().PAYPAL_CLIENT_ID;
 // display error if client id is undefined
 if (!cId) {
   let bookingData = bookingDataVar.get();
   console.log('Error: Undefined paypal client id');
   sweetAlert({title:TAPi18n.__("fl_error"),text: TAPi18n.__("b_vivaerror"),type: "error"});
   Meteor.call('cancelBooking', bookingData.id, function(error, result){
     if(error){
       console.log("error", error);
     }
   });
   paymentPaypal.set(false);
   bookingDataVar.set(null);
   return;
 }
 $.getScript('https://www.paypal.com/sdk/js?currency='+params.get().currency+'&client-id='+cId, function(){
   paypal.Buttons({
     createOrder: function(data, actions) {
       let bookingData = bookingDataVar.get();
       let provider = Meteor.users.findOne({_id: bookingData.providerId});
       let lang = params.get().PRIMARY_LANG === 'en' ? 'en-US' : 'el-GR';

       // This function sets up the details of the transaction, including the amount and line item details.
       return actions.order.create({
         purchase_units: [{
           amount: {
             value: bookingData.price
           }
         }],
         payer: {
           email_address: provider.emails[0].address,
           name: {
             given_name: provider.profile.user.name,
             surname: provider.profile.user.surname
           }
         },
         application_context: {
           brand_name: params.get().APP_NAME,
           locale: lang,
           shipping_preference: 'NO_SHIPPING'
         }
       });
     },
     onApprove: function(data, actions) {
       // This function captures the funds from the transaction.
       return actions.order.capture().then(function(details) {
         // This function shows a transaction success message to your buyer.
        //  console.log(details);
         let bookingData = bookingDataVar.get();
         if (details.status === 'COMPLETED'){
           // go to result page where an order status check will be run
           let queryParams = {orderId: details.id, bookingId: bookingData.id};
           queryParams.f2f = bookingData.apptType == 'f2f' ? 'true' : 'false';
           FlowRouter.go("paymentResult", {}, queryParams);
         } else {
           FlowRouter.go("paymentResult", {}, {success: false});
         }
       });
     }
   }).render('#paypal-button-container');
 });
});

Template.tmplPaypalPayment.events({ 
 "click .closeDialog": function(event, template){
   var bookingData = bookingDataVar.get();
   // if user closes the payment dialog, cancel the pending booking
   Meteor.call('cancelBooking', bookingData.id, function(error, result){
     if(error){
       console.log("error", error);
     }
     /*if(result){
        console.log(bookingData.id + ' was cancelled');
     }*/
   });
    paymentPaypal.set(false);
    bookingDataVar.set(null);
 }   
});
