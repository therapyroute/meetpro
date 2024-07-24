Meteor.startup(function(){
  // set MAIL_URL to Mailgun
  process.env.MAIL_URL = Meteor.settings.private.EMAIL_URL;
  // add indexes to collections for faster searching
  // see: https://kadira.io/academy/meteor-performance-101/content/make-your-app-faster
  Bookings.createIndex({ "status": 1});
  Bookings.createIndex({ "userId": 1, "status": 1});
  Bookings.createIndex({ "providerId": 1, "status": 1});
  Bookings.createIndex({ "userId": 1, "start": 1, "status": 1});
  Bookings.createIndex({ "providerId": 1, "start": 1, "status": 1});

  Questions.createIndex({ "providerId": 1});

  Meteor.users.createIndex({ "profile.user.slug": 1});
  Meteor.users.createIndex({ "roles": 1});

  Expertise.createIndex({"name": 1});
  
  Specialities.createIndex({"name": 1});
});

// Check for 'orphaned' pending bookings and set them to aborted
// checks every 1 minute for pending bookings created >4 minutes before
// User has 4 minutes to complete transaction
Meteor.setInterval(function(){
   var pending = Bookings.direct.find({status:'pending'}).fetch();
   _.each(pending, function(p){
     if (p.createdAt){
      var pLife = 4;
      if (moment() > moment(p.createdAt).add(pLife,'minutes')){
          Bookings.direct.update({_id: p._id}, {$set:{
            status: 'aborted'
          }});
          let txt = p._id + ' was aborted';
          console.log(txt);
          appCommon.appLog({content: txt});
      }
    }
   });
}, 1 * 60000);
