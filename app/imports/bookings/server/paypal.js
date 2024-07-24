
Meteor.methods({
  checkPaypalTransaction: function(orderID, bookingId) {
    // if (this.userId) {
      // console.log(orderID);
      // console.log('userid: ' + this.userId);
      // console.log(bookingId);
      const paypal = require('@paypal/checkout-server-sdk');

      let clientId = appCommon.getParam('PAYPAL_CLIENT_ID', null, this.userId);
      let clientSecret = appCommon.getParam('PAYPAL_SECRET', null, this.userId);
      let environment = Meteor.settings.public.APP_MODE === 'production' ? 
        new paypal.core.LiveEnvironment(clientId, clientSecret) :
        new paypal.core.SandboxEnvironment(clientId, clientSecret) ;
      let client = new paypal.core.PayPalHttpClient(environment);

      let getOrder = async function(orderId) {
        request = new paypal.orders.OrdersGetRequest(orderId);
        let response = await client.execute(request);
        // console.log(`Capture: ${JSON.stringify(response.result)}`);
        let status = response.result.status;
        console.log(status);
        if (status === 'COMPLETED') {
          var booking = Bookings.findOne({ _id: bookingId });
          console.log(booking);
          if (booking) {
            var transaction = {
              trans_type: "paypal",
              trans_orderid: orderID,
              trans_data: "",
              trans_amount: booking.price,
              trans_status: 'confirmed'
            };
            Bookings.update({_id: bookingId}, {
              $set:{
                status: 'confirmed'
              },
              $push: { transactions: transaction }

            });
            appCommon.appLog({uid: this.userId, content: 'Confirmed paypal transaction for booking ' + booking._id + ' / order id: ' + orderID});
            console.log('paypal booking & transaction update OK: ' + orderID);
          }
          else {
            appCommon.appLog({level: 'error', content: 'Error confirming paypal transaction ' + orderID});
            //console.log("error", error);
            throw new Meteor.Error('not_found','No booking found with this transaction id');
          }
          
          // send notifications (email to provider, sms&email to user)
          var opts = {
            lang: appCommon.getParam('PRIMARY_LANG', null, this.userId),
            payment: 'paypal',
            action: 'confirm',
            data: bookingId,
            paramsId: appCommon.getParam('_id', null, this.userId)
          };
          Meteor.defer(function() {
            // add event to gCalendar
            appNotifications.addBookingToGCal(bookingId);
            // send notifications
            appNotifications.sendAllBookingNotifications(opts, function(error, result){
              if(error){
                appCommon.appLog({
                  uid: user._id,
                  level: 'error',
                  content: 'Error while sending booking notifications for paypal ' + orderID
                });
                console.log("error while sending booking notifications for paypal", error);
              }
              if(result){
                appCommon.appLog({uid: user._id, content: 'confirmations sent for paypal ' + orderID});
                console.log('confirmations sent for paypal ' + orderID);
              }
            });
          });
          return true;
        } else {
          // if order not completed
          appCommon.appLog({level: 'error', content: 'Paypal transaction error: ' + orderID});
          throw new Meteor.Error('not_completed','Paypal order was not completed');
        }
      }
      let theOrder = getOrder(orderID); 
      return theOrder;
    // } else {
    // throw new Meteor.Error('error','Guest cannot create paypal order');
    // }
  }
});
