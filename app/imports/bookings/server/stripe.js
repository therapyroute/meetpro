import Stripe from 'stripe';

stripeOrders = new Mongo.Collection('stripeorders'); 

Meteor.methods({
  createStripeCheckoutSession: function(bookingId, amount) {
    if (this.userId){
      const stripe = Stripe(appCommon.getParam('STRIPE_API_KEY', null, this.userId));
      const sessionid = stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: appCommon.getParam('currency', null, this.userId),
              product_data: {
                name: 'Video Booking',
              },
              unit_amount: parseInt(amount*100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: Meteor.absoluteUrl()+'result?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: Meteor.absoluteUrl()+'cancel',
      })
      .then(function(session) {
        //console.log(session.id);
        stripeOrders.insert({
          "bookingId": bookingId, 
          "sessionId": String(session.id)
        });
        return session.id;
      })
      .catch(function(error){
        console.error(error);
        throw new Meteor.Error('error','Cannot create stripe order');
      } );
      
      return sessionid;
    }
    throw new Meteor.Error('error','Guest cannot create stripe order');
  },
  checkStripeTransaction: function(sessionId) {
    if (this.userId) {
      // find previously created order from the collection
      let orderRec = stripeOrders.findOne({
        'sessionId': sessionId
      });
      var booking = Bookings.findOne({
        _id: orderRec.bookingId
      });
      if (booking && booking.userId === this.userId) {
        const stripe = Stripe(appCommon.getParam('STRIPE_API_KEY', null, this.userId));
        const session = stripe.checkout.sessions.retrieve(sessionId)
        .then(function(result) {
          if (result.payment_status === 'paid'){
            let res = Bookings.update({_id: booking._id, "transactions.trans_orderid": result.id}, {
              $set:{
                status: 'confirmed',
                "transactions.$.trans_status": 'confirmed'
              }
            });
            // send notifications (email to provider, sms&email to user)
            Meteor.defer(function() {
              // add event to gCalendar
              appNotifications.addBookingToGCal(booking._id);
              // send notifications
              var opts = {
                payment: 'stripe',
                action: 'confirm',
                data: result.id,
                bookingid: booking._id,
                paramsId: appCommon.getParam('_id', null, this.userId)
              };
              appNotifications.sendAllBookingNotifications(opts, function(error, result){
                if(error){
                  appCommon.appLog({
                    uid: user._id,
                    level: 'error',
                    content: 'Error while sending booking notifications for stripe ' + transactionId
                  });
                  console.log("error while sending booking notifications for stripe", error);
                }
                if(result){
                  appCommon.appLog({uid: user._id, content: 'confirmations sent for stripe ' + transactionId});
                  console.log('confirmations sent for stripe ' + transactionId);
                }
              });
            });
            return result;
          }
          else {
            throw new Meteor.Error('session','Stripe transaction error',result.id);
          }
        })
        .catch(function(error) {
          console.error(error);
          throw new Meteor.Error('error','Cannot check stripe order');
        });

        return session;
      }
    } else {
    throw new Meteor.Error('error','Guest cannot create stripe order');
    }
  }
});
