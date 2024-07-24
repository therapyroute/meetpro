import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import moment from 'moment-timezone';
import sweetAlert from 'sweetalert';
import dropin from 'braintree-web-drop-in';
import btGR from './bt_gr.js';

///////////////////////////////////////////
// Braintree modal template initialization
///////////////////////////////////////////
Template.tmplBraintreePayment.onRendered(function() {
   // Generic function to createTransaction, used by Braintree & Hosted Fields
   var createTransaction = function(payload) {
     var lang = TAPi18n.getLanguage();
     var nonce = payload.nonce;
     var bookingData = bookingDataVar.get();
     var bookingId = bookingData.id;
     var bookingAmount = bookingData.price;
 
     Meteor.call('createTransaction', nonce, bookingAmount, bookingId, lang, function(error, result) {
       // error creating transaction
       if (error) {
         let errText = TAPi18n.__("b_pnotcompleted") + ' (' + error.message + ')';
         sweetAlert({title:TAPi18n.__("fl_error"),text: errText,type: "error"});
         // cancel pending booking
         Meteor.call('cancelBooking', bookingDataVar.get().id, function(error, result){
           if(error){
             console.log("Cancellation error", error);
           }
           /*if(result){
              console.log(bookingData.id + ' was cancelled');
           }*/
         });
         // init ReactiveVars
         paymentBraintree.set(false);
         bookingDataVar.set(null);
       }
       // successful transaction
       else {
         //console.log('Braintree success!!!');
         // log to analytics
        //  analytics.track("User completed BT booking", {
        //    eventName: "User completed BT booking",
        //    uId: Meteor.userId()
        //  });
         //redirect to /result page
         var queryParams = {success: 'true', bookingId: bookingId};
         queryParams.f2f = bookingDataVar.get().apptType == 'f2f' ? 'true' : 'false';
         FlowRouter.go("paymentResult", null, queryParams);
         // reset ReactiveVars (useless, but harmless to do)
         paymentBraintree.set(false);
         bookingDataVar.set(null);
       }
     });
   }
   //////////////////////////////////////////
   // first, get client token from braintree
   Meteor.call('getClientToken', function(error, clientToken) {
     if (error) {
       console.log(error);
       sweetAlert({title:TAPi18n.__("fl_error"),text: TAPi18n.__("b_bterror"),type: "error"});
       $('#spinnerTop').empty();
       $('#spinnerTop').append(TAPi18n.__('bt_tk_net'));
     }
     if (clientToken) {
       console.log(params.get());
       // Got client token from Braintree. Proceed...
       var bookingAmount = bookingDataVar.get().price;
       var button = document.querySelector('#submitBtn');
       var translations = TAPi18n.getLanguage() === 'el' ? btGR : {};
       dropin.create({
         authorization: clientToken,
         container: '#dropin-container',
         paypal: {
           flow: 'checkout',
           amount: bookingAmount,
           currency: params.get().currency
         },
         translations: translations
       }, function (createErr, instance) {
         if (createErr){
           console.log(createErr);
           $('#spinnerTop').append(TAPi18n.__('bt_tk_net'));
         }
         $('#spinnerTop').empty();
         button.addEventListener('click', function () {
           instance.requestPaymentMethod(function (requestPaymentMethodErr, payload) {
             // Submit payload.nonce to your server
             // call method for creating a transaction (finally!)
             //$('#spinner').append('<i class="fa fa-spinner fa-spin" style="font-size:28px"></i>&nbsp;'+TAPi18n.__('pleasewait'));
             createTransaction(payload);
           });
         });
       });
     } // of if clientToken
   }); // of meteor call
 }); // of onRendered
 
 Template.tmplBraintreePayment.events({
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
      paymentBraintree.set(false);
      paymentViva.set(false);
      bookingDataVar.set(null);
      // log to analytics
      // analytics.track("User abandoned BT booking", {
      //   eventName: "BT Booking abandoned",
      //   uId: Meteor.userId()
      // });
   }
 });
 Template.tmplBraintreePayment.helpers({
   subTitle: function(){
     let theUser = Meteor.users.findOne({_id: provId.get()});
     let uSpecs = theUser ? theUser.specs().join() : null;
     let profile = theUser ? theUser.profile.user : null;
     let fName = profile ? profile.name + ' ' + profile.surname : '';
     let uTZ = Session.get('timezone') ? Session.get('timezone') : 'Europe/London';
     return TAPi18n.__('appt_with_booking', {assoc: fName, specs: uSpecs, datetime: moment(bookingDataVar.get().start).tz(uTZ).format('LLLL')});
   }
 });