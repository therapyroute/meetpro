import braintree from 'braintree';

// Braintree payments methods
// based on https://blog.michaltakac.com/processing-payments-in-meteor-apps-using-braintree-part-1-transactions-bb2f4811dd63#.rq54xko1e
Meteor.methods({
  getClientToken: function (clientId, creds = null) {
    // Braintree initialization
    // Define btGateway variable
    btGateway ='';
    if (!creds) {
      creds = {
        publicKey: appCommon.getParam('BT_PUBLIC_KEY', null, this.userId),
        privateKey: appCommon.getParam('BT_PRIVATE_KEY', null, this.userId),
        merchantId: appCommon.getParam('BT_MERCHANT_ID', null, this.userId)
      }
    }
    // Pick Braintree environment based on environment defined in Meteor settings.
    if (Meteor.settings.public.APP_MODE === 'production') {
      creds.environment = braintree.Environment.Production;
    } else {
      creds.environment = braintree.Environment.Sandbox;
    }
    // Initialize Braintree connection:
    btGateway = braintree.connect(creds);
    // end of BT init
    if (this.userId){
      var generateToken = Meteor.wrapAsync(btGateway.clientToken.generate, btGateway.clientToken);
      var options = {};

      if (clientId) {
        options.clientId = clientId;
      }
      try {
        var response = generateToken(options);
      }
      catch (error) {
        console.log(error);
        throw new Meteor.Error('unauthorized','Invalid BT credentials');
      }
      return response.clientToken;
    }
    else
      throw new Meteor.Error('unauthorized','Guest cannot get BT token');
  },
  btCreateCustomer: function(){
    if (this.userId){
      var user = Meteor.user();

      var customerData = {
        email: user.emails[0].address
      };

      // Calling the Braintree API to create our customer!
      btGateway.customer.create(customerData, function(error, response){
        if (error){
          console.log(error);
          appCommon.appLog({level: 'error', content: error});
        } else {
          // For future use, e.g. subscribers
          // If customer is successfuly created on Braintree servers,
          // we will now add customer ID to our User
          //Meteor.users.update(user._id, {
          //  $set: { customerId: response.customer.id }
          //});
        }
      });
    }
    else
      throw new Meteor.Error('unauthorized','Guest cannot create BT customer');
  },
  // creates a transaction @ Braintree and proceeds with bookings, transactions & confirmations if it's approved
  createTransaction: function(nonceFromTheClient, amount, bookingId, lang) {
    if (this.userId) {
      check(nonceFromTheClient, String);
      check(amount, Number);
      check(lang, String);

      var user = null;
      
      // before creating transaction, ensure booking is not aborted
      var booking = Bookings.findOne({_id: bookingId});
      if (this.userId){
        user = Meteor.user()
      } else {
        user = Meteor.users.findOne({_id: booking.userId});
      }
      if (booking && user._id === booking.userId && booking.status === 'aborted'){
        appCommon.appLog({uid: user._id, level: 'error', content: 'Failed to confirm aborted booking: ' + bookingId});
        console.log('failed to confirm booking: ' + bookingId);
        Meteor.call('cancelBooking', bookingId, function(error, result){
            if(error){
              appCommon.appLog({uid: user._id, level: 'error', content: 'Error while cancelling booking ' + bookingId});
              console.log("error while cancelling booking", error);
            }
            if(result){
              appCommon.appLog({uid: user._id, content: 'Cancelled booking ' + bookingId});
              console.log(bookingId + ' was cancelled');
            }
          });
        throw new Meteor.Error('fail','Cannot proceed with an aborted booking!');
      }
      
      // Let's create transaction.
      var transaction = Meteor.wrapAsync(btGateway.transaction.sale, btGateway.transaction);

      var response = transaction({
        amount: amount,
        paymentMethodNonce: nonceFromTheClient, // Generated nonce passed from client
        /*customer: {
          id: user.customerId
        },*/
        options: {
          submitForSettlement: true, // Payment is submitted for settlement immediatelly
          //storeInVaultOnSuccess: true // Store customer in Braintree's Vault
        }
      });
      //console.log(response);
      // if transaction unsuccessful
      if (response.success === false){
        appCommon.appLog({level: 'error', content: 'BT transaction error @ ' + bookingId});
        console.log('transaction error');
        throw new Meteor.Error('error',response.message);
      }
      // if transaction ok @ Braintree, proceed to the rest...
      else if (response.success == true || response.transaction.status === 'authorized'){
        appCommon.appLog({uid: user._id, content: 'Payment received'});
        console.log('Payment received from '+ user._id);
        
        // confirm pending booking @ collection
        //var booking = Bookings.findOne({_id: bookingId});
        if (booking && this.userId === booking.userId) {
          appCommon.appLog({uid: this.userId, content: 'Booking @ collection was confirmed ' + bookingId});
          console.log('Booking @ collection was confirmed');
          Bookings.update({_id: bookingId}, {$set:{
            status: 'confirmed'
          }});
        }
        else {
          Meteor.call('cancelBooking', bookingId);
          appCommon.appLog({uid: user._id, level: 'error', content: 'Error while confirming booking'});
          console.log("error", response.message);
          throw new Meteor.Error('unauthorized','Cannot confirm a booking that is not yours!');
        }
        
        // add transaction to booking record (we do it here, because we have transaction id available)
        var transaction = {
          trans_type: "braintree",
          trans_orderid: response.transaction.id,
          trans_data: "",
          trans_amount: amount,
          trans_status: 'confirmed'
        };
        Meteor.call('addBookingTransaction', bookingId, transaction, function(error, result){
          if(error){
            appCommon.appLog({uid: user._id, level: 'error', content: 'Error while adding booking transaction @ ' + bookingId});
            console.log("error while adding booking transaction", error);
          }
          if(result){
            appCommon.appLog({uid: user._id, content: 'Transaction added @ ' + bookingId});
            console.log('transaction added!');
          }
        });
        // send notifications
        var opts = {
          lang: lang,
          payment: 'braintree',
          action: 'confirm',
          data: bookingId,
          paramsId: appCommon.getParam('_id', null, this.userId)
        };
        // using Meteor.defer() to send notifications behind the scenes and unblock the method
        // see: https://themeteorchef.com/snippets/using-unblock-and-defer-in-methods/
        Meteor.defer(function() {
          // add event to gCalendar
          appNotifications.addBookingToGCal(bookingId);
          // send notifications
          appNotifications.sendAllBookingNotifications(opts, function(error, result){
            if(error){
              appCommon.appLog({uid: user._id, level: 'error', content: 'Error while sending booking notifications @ ' + opts.bookingId});
              console.log("error while sending booking notifications", error);
            }
            if(result){
              appCommon.appLog({uid: user._id, content: 'confirmations sent @ ' + opts.bookingId});
              console.log('confirmations sent');
            }
          });
        });
        //return true;
      }
      return response;
    }
    else
      throw new Meteor.Error('unauthorized','Guest cannot create BT transaction');
  }
});
