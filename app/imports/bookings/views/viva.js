import moment from 'moment-timezone';
import sweetAlert from 'sweetalert';
////////////////////////////////////
// Viva payment modal initialization
////////////////////////////////////
Template.tmplVivaPayment.onRendered(function(){
   var bookingPrice = bookingDataVar.get().price;
   var bookingId = bookingDataVar.get().id;
   var curLang = TAPi18n.getLanguage();
   Meteor.call('createVivaOrder', bookingPrice, bookingId, curLang, function(error, result){
     // if error cancel order to free slot
     if(error){
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
           paymentViva.set(false);
         }
       });
     }
     // viva order was created. Redirect to viva website...
     if(result){
       //console.log(result);
       var vivaOrderId = result.OrderCode;
       //console.log('successful order creation ' + vivaOrderId);
       // save orderId to Booking Collection for use after redirection
       var bookingId = bookingDataVar.get().id;
       var transaction = {
         trans_type: "viva",
         trans_orderid: String(vivaOrderId),
         trans_data: "",
         trans_amount: bookingDataVar.get().price,
         trans_status: 'pending'
       };
       //console.log(transaction);
       Meteor.call('addBookingTransaction', bookingId, transaction, function(error, result){
         if(error){
           console.log("error", error);
         }
         if(result){
            // redirect to viva wallet after 4 seconds
            Meteor.setTimeout(function(){
              var redirectTo = appClient.vpUrl() + '/web/checkout?ref=' + vivaOrderId;
              // redirect to viva /web/checkout?ref={OrderCode}
              paymentViva.set(false);
              window.location = redirectTo;
            }, 4000);
         }
       });
     }
   });
 });
 
 Template.tmplVivaPayment.events({
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
      paymentViva.set(false);
      bookingDataVar.set(null);
   }
 });
 Template.tmplVivaPayment.helpers({
   subTitle: function(){
     let theUser = Meteor.users.findOne({_id: provId.get()});
     let uSpecs = theUser ? theUser.specs().join() : null;
     let profile = theUser ? theUser.profile.user : null;
     let fName = profile ? profile.name + ' ' + profile.surname : '';
     let uTZ = Session.get('timezone') ? Session.get('timezone') : 'Europe/London';
     return TAPi18n.__('appt_with_booking', {assoc: fName, specs: uSpecs, datetime: moment(bookingDataVar.get().start).tz(uTZ).format('LLLL')});
   }
 });
 