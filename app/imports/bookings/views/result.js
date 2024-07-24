import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

Template.tmplPaymentResult.onCreated(function(){
  DocHead.setTitle(appParams.APP_NAME);
  paymentType = new ReactiveVar(null);
  orderSuccess = new ReactiveVar(false);
  paymentReady = new ReactiveVar(false);
  errorMsg = new ReactiveVar(null);
  isf2f = new ReactiveVar(false);
  let self = this;
  let bookingId = FlowRouter.getQueryParam('bookingId');

  // if face2face
  if (FlowRouter.getQueryParam('f2f') === 'true') {
    isf2f.set(true);
  }
  //if Braintree
  if (FlowRouter.getQueryParam('success') === 'true') {
    paymentType.set('bt');
    orderSuccess.set(true); 
  }
  // if PayPal
  else if (FlowRouter.getQueryParam('orderId')) {
    paymentType.set('paypal');
    let orderId = FlowRouter.getQueryParam('orderId');
    
    Meteor.call('checkPaypalTransaction', orderId, bookingId, function(error, success) { 
      if (error) { 
        console.log('error', error); 
        paymentReady.set(true);
        orderSuccess.set(false);
        errorMsg.set(error.reason);
      } 
      if (success) { 
        paymentReady.set(true);
        orderSuccess.set(true);
      } 
    });
  }
  // if Viva
  else if (FlowRouter.getQueryParam('s')){
    paymentType.set('viva');
    var paymentOrder = FlowRouter.getQueryParam('s');
    var transactionId = FlowRouter.getQueryParam('t');
    var curLang = FlowRouter.getQueryParam('lang').substring(0,2);
    // check with Viva if transaction is OK
    Meteor.call('checkVivaTransaction', transactionId, paymentOrder, curLang, function(error, result){
      if(error){
        console.log("error", error);
        paymentReady.set(true);
        orderSuccess.set(false);
        errorMsg.set(error.reason);
      }
      if(result){
        paymentReady.set(true);
        orderSuccess.set(true);
        // log to analytics
        // analytics.track("User completed Viva booking", {
        //   eventName: "User completed Viva booking",
        //   uId: Meteor.userId()
        // });
        //console.log('confirmed with Viva!');
      }
    });
  }
  // if stripe
  else if (FlowRouter.getQueryParam('session_id')){
    paymentType.set('stripe');
    var sessionId = FlowRouter.getQueryParam('session_id');
    // check with Viva if transaction is OK
    Meteor.call('checkStripeTransaction', sessionId, function(error, result){
      if(error){
        console.log("error", error);
        paymentReady.set(true);
        orderSuccess.set(false);
        errorMsg.set(error.reason);
      }
      if(result){
        paymentReady.set(true);
        orderSuccess.set(true);
        // log to analytics
        // analytics.track("User completed Stripe booking", {
        //   eventName: "User completed Stripe booking",
        //   uId: Meteor.userId()
        // });
        //console.log('confirmed with Stripe!');
      }
    });
  }
  // else go Home
  else {
    FlowRouter.go("/");
  }
  // get booking data for calendar button
  calendarData = new ReactiveVar(null);
  if (!bookingId){
    return;
  }
  Meteor.call('getCalendarData', bookingId, function(error, result){
    if (error) {
      console.log(error);
    }
    if (result) {
      calendarData.set(result);
      //console.log(result);
    }
  });
  self.autorun(function() { 
     if (paymentReady.get() || errorMsg.get() || orderSuccess.get()){
      // if booking was made from guest user, log them out after the payment result
      if (Session.get('guest') === true) {
        Session.set('guest', false);
        Meteor.logout();
      }
     }
  });
});

Template.tmplPaymentResult.helpers({
  isVivaStripePaypal: function(){
    return (paymentType.get() === 'viva' || paymentType.get() === 'stripe' || paymentType.get() === 'paypal');
  },
  isf2f: function(){
    return isf2f.get();
  },
  success: function(){
      return orderSuccess.get();
  },
  assocsUrl: function(){
    return FlowRouter.path("commonAssociates");
  },
  paymentReady: function(){
    return paymentReady.get();
  },
  errorMsg: function(){
    return errorMsg.get();
  },
  gCalBtn: function() {
    return calendarData.get() ? 
      `<a href="${calendarData.get().btn}" target="_blank" class="btn btn-info">
      <span class="fa"><i class="fa fa-calendar"></i></span> Add to Google Calendar</a>` : '';
  },
  bookingLink: function() {
    return calendarData.get() ? calendarData.get().link : ''
  }
});

Template.tmplPaymentResult.events({ 
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