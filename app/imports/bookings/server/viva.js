// Transaction collection
// server-only, to keep track of created Viva orders & their booking id
Orders = new Mongo.Collection('orders'); 

Meteor.methods({
  ////////////////////////
  // Viva Wallet methods
  ////////////////////////
  // https://github.com/VivaPayments/API/wiki
  // Create a new order BEFORE redirecting to the secure Viva Wallet environment
  createVivaOrder: function(bookingPrice, bookingId, curLang) {
    if (this.userId) {
      check(bookingPrice, Number);
      check(bookingId, String);
      check(curLang, String);
      
      // before creating order, ensure booking is not aborted
      var booking = Bookings.findOne({_id: bookingId});
      if (booking && this.userId === booking.userId && booking.status === 'aborted'){
        appCommon.appLog({uid: this.userId, level: 'error', content: 'Failed to confirm aborted booking: ' + bookingId});
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
      
      var lang = curLang === 'en' ? 'en-US' : 'el-GR';

      // Billing related code - left for future reference
      // get user & their credentials
      // let usr = Meteor.users.findOne({_id: booking.providerId});
      // let viva = usr && usr.profile && usr.profile.provider ? usr.profile.provider.viva : null;
      // if (!viva) {
      //   throw new Meteor.Error('failed','Provider has not set their viva credentials!');
      // }
      var postAuth = appCommon.getParam('VP_MERCHANT_ID', null, this.userId) + ":" + appCommon.getParam('VP_API_KEY', null, Partitioner.group());
      //var postAuth = viva.VP_MERCHANT_ID + ":" + viva.VP_API_KEY;
      var postData = {
        Amount: bookingPrice * 100,
        SourceCode: appCommon.getParam('VP_SOURCE', null, this.userId),
        RequestLang: lang
      };
      // call viva to create order...
      // (http call runs synchronously on server, no need for a callback)
      var postUrl = appCommon.vpUrl() + '/api/orders';
      var responseData = HTTP.call( 'POST', postUrl, {auth: postAuth, data: postData});
      //console.log(responseData.content);
      if (responseData){
        let response = EJSON.parse(responseData.content);
        // insert to temp collection
        Orders.insert({
          "bookingId": bookingId, 
          "orderId": String(response.OrderCode),
          "providerId": booking.providerId
        });
        return response;
      }
      else
        throw new Meteor.Error('error','Cannot create viva order');
    }
    else
      throw new Meteor.Error('unauthorized','Guest cannot create viva order');
  },
  // Ensure the Viva Wallet transaction exists and was valid
  // and proceed to confirmations & notifications
  checkVivaTransaction: function(transactionId, paymentOrder, lang) {
    if (this.userId) {
      check(transactionId, String);
      check(paymentOrder, String);
      check(lang, String);

      // find previously created order from the collection
      let orderRec = Orders.findOne({
        'orderId': paymentOrder
      });
      // Billing related code - left for future reference
      // get user & their viva credentials
      // let usr = Meteor.users.findOne({
      //   _id: orderRec.providerId
      // });
      // let viva = usr && usr.profile && usr.profile.provider ? usr.profile.provider.viva : null;
      // if (!viva) {
      //   throw new Meteor.Error('failed','Provider has not set their viva credentials!');
      // }
      
      //var getAuth = viva.VP_MERCHANT_ID + ":" + viva.VP_API_KEY;
      var getAuth = appCommon.getParam('VP_MERCHANT_ID', null, this.userId) + ":" + appCommon.getParam('VP_API_KEY', null, Partitioner.group());
      var getUrl = appCommon.vpUrl() + '/api/transactions/' + transactionId;
      var responseData = HTTP.call( 'GET', getUrl, {auth: getAuth});
      var transaction = EJSON.parse(responseData.content);
      // check if transaction valid (ErrorCode = 0 & StatusId = F & correct OrderCode)
      // https://github.com/VivaPayments/API/wiki/GetTransactions
      if (transaction.ErrorCode === 0 && 
          transaction.Transactions[0].StatusId === 'F' && 
          transaction.Transactions[0].Order.OrderCode == paymentOrder &&
          orderRec.transactionId == transaction.id) {
        
        // confirm booking & transaction @ Collection
        //var booking = Bookings.findOne({transactions: {$elemMatch: {trans_orderid: paymentOrder}}});
        var booking = Bookings.findOne({
          _id: orderRec.bookingId
        });
        
        if (booking && booking.userId === this.userId) {
          Bookings.update({_id: booking._id, "transactions.trans_orderid": paymentOrder}, {
            $set:{
              status: 'confirmed',
              "transactions.$.trans_status": 'confirmed'
            }
          });
          appCommon.appLog({uid: this.userId, content: 'Confirmed Viva transaction for booking ' + booking._id + ' / transaction id: ' + transactionId});
          console.log('viva booking & transaction update OK: ' + transactionId);
        }
        else {
          appCommon.appLog({level: 'error', content: 'Error confirming Viva transaction ' + transactionId});
            console.log("error", error);
          throw new Meteor.Error('not_found','No booking found with this transaction id');
        }
        
        // send notifications (email to provider, sms&email to user)
        var opts = {
          lang: lang,
          payment: 'viva',
          action: 'confirm',
          data: booking._id,
          paramsId: appCommon.getParam('_id', null, this.userId)
        };
        this.unblock();
        // add event to gCalendar
        appNotifications.addBookingToGCal(booking._id);
        // send notifications
        appNotifications.sendAllBookingNotifications(opts, function(error, result){
          if(error){
            appCommon.appLog({
              uid: user._id,
              level: 'error',
              content: 'Error while sending booking notifications for viva ' + transactionId
            });
            console.log("error while sending booking notifications for viva", error);
          }
          if(result){
            appCommon.appLog({uid: user._id, content: 'confirmations sent for viva ' + transactionId});
            console.log('confirmations sent for viva ' + transactionId);
          }
        });
        return true;
      }
      else {
        appCommon.appLog({level: 'error', content: 'Viva transaction error: ' + transactionId});
        throw new Meteor.Error('transaction','Viva transaction error',transaction);
      }
    }
    else
      throw new Meteor.Error('unauthorized','Guest cannot check viva order');
  }
  // Billing related code - left for future reference
  // },
  // createVivaTransaction: function(invoiceId, vivaToken) {
  //   if (this.userId) {
  //     check(invoiceId, String);
  //     check(vivaToken, String);
      
  //     var getAuth = appCommon.getParam('VP_MERCHANT_ID') + ":" + appCommon.getParam(VP_API_KEY);
  //     var postUrl = appCommon.vpUrl() + '/api/transactions/';
            
  //     var response = HTTP.call( 'POST', postUrl, {
  //       auth: getAuth,
  //       params: { PaymentToken: vivaToken }
  //     });
  //     var responseData = EJSON.parse(response.content);
  //     // check if transaction valid (ErrorCode = 0 & StatusId = F)
  //     // https://github.com/VivaPayments/API/wiki/GetTransactions
  //     if (responseData.ErrorCode === 0 && responseData.StatusId === 'F') {
  //       let transactionId = responseData.TransactionId;
  //       // update invoice @ Collection
  //       Invoices.update({_id: invoiceId}, { $set:{
  //         paid: true,
  //         payDate: new Date(),
  //         payTransaction: responseData.TransactionId
  //       }});
  //       // get provider name
  //       let invoice = Invoices.findOne({_id: invoiceId});
  //       let provider = Meteor.users.findOne({_id: invoice.providerId});
  //       let fullname = provider.profile.user.name + ' ' + provider.profile.user.surname;
        
  //       let resText = `Invoice ${invoiceId} was paid by ${fullname} with transaction ${transactionId}`;
  //       appCommon.appLog({uid: this.userId, content: resText});
  //       console.log(resText);
        
  //       // send email to admin
  //       emObj = {
  //         lang: 'en',
  //         to: appCommon.getParam('ADMIN_EMAIL'),
  //         subject: 'Invoice payment',
  //         text: resText,
  //       };
  //       // using Meteor.defer() to send notifications behind the scenes and unblock the method
  //       // see: https://themeteorchef.com/snippets/using-unblock-and-defer-in-methods/
  //       Meteor.defer(function() {
  //         appCommon.appSendMail(emObj);
  //       });
        
  //       return true;
  //     }
  //     else {
  //       appCommon.appLog({level: 'error', content: 'Viva transaction error: ' + transactionId});
  //       throw new Meteor.Error('transaction','Viva transaction error',responseData);
  //     }
  //   }
  //   else
  //     throw new Meteor.Error('unauthorized','Guest cannot check viva order');
  // }
});
