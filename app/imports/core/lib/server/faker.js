// Add some sample data for the server using faker, if in dev mode...
// add some specialities
if (Meteor.settings.public.APP_MODE === "dev"){
  console.log('Dev mode on...');
  let specIds = [];
  let specIds1 = [];
  let specIds2 = [];
  let specIds3 = [];
  let specId = null;
  if (Specialities.direct.find().count() === 0) {
    var specialities = [
      {name: 'Specialty 1',abbreviation: 'SPEC1'},
      {name: 'Specialty 2',abbreviation: 'SPEC2'},
      {name: 'Specialty 3',abbreviation: 'SPEC3'},
      {name: 'Specialty 4',abbreviation: 'SPEC4'},
      {name: 'Specialty 5',abbreviation: 'SPEC5'},
      {name: 'Specialty 6',abbreviation: 'SPEC6'},
      {name: 'Specialty 7',abbreviation: 'SPEC7'},
      {name: 'Specialty 8',abbreviation: 'SPEC8'},
      {name: 'Specialty 9',abbreviation: 'SPEC9'},
      {name: 'Specialty 10',abbreviation: 'SPEC10'}
    ];
    _.each(specialities, function (speciality) {
      if (Meteor.settings.public.APP_MULTI_CLIENT){
        specId = Partitioner.bindGroup('app1', function(){
          return Specialities.insert(speciality);
        });
        specIds1.push(specId);
        specId = Partitioner.bindGroup('app2', function(){
          return Specialities.insert(speciality);
        });
        specIds2.push(specId);
        specId = Partitioner.bindGroup('app3', function(){
          Specialities.insert(speciality);
        });
        specIds3.push(specId);
      }
      else {
        specId = Specialities.insert(speciality);
        specIds.push(specId);
      }
    });
    console.log('Added 10 specialities');
  };

  // add users etc only in empty DB (only with admin)
  if (Meteor.users.find().count() === 0){
    var domainName = appCommon.getDomainFromEmail(Meteor.settings.private.ADMIN_EMAIL);
    // create 150 users
    _.each(_.range(150), function(){
      var rName = faker.name.firstName();
      var rSurname = faker.name.lastName();
      var rEmail1 = rName + '.' + rSurname + '@' + domainName;
      var rEmail = rEmail1.toLowerCase();
      var rPhone = String(faker.phone.phoneNumber());
      var rTitle = faker.name.prefix();
      var photoId = faker.random.number({min:1, max:100});
      var photoGender = faker.random.arrayElement(['men','women']);
      var rPhoto = 'https://randomuser.me/api/portraits/' + photoGender + '/' + photoId + '.jpg';
      var rSlug = (rName[0] + rSurname).toLowerCase();

      var id = Accounts.createUser({
        name: rEmail,
        profile: {
          user: {
            title: [rTitle],
            name: rName,
            surname: rSurname,
            gender: 'male',
            mobile: rPhone,
            photo: rPhoto,
            allowed_notifications: ['email'],
            lang: 'en',
            slug: rSlug
          }
        },
        email: rEmail,
        password: 'mypass@321'
      });
      if (Meteor.settings.public.APP_MULTI_CLIENT){
        Partitioner.setUserGroup(id, faker.random.arrayElement(['app1','app2','app3']))
      }
      Roles.addUsersToRoles(id, ['user']);
      Meteor.users.update({_id:id}, {$set:{
        'emails.0.verified': true
      }});
    });
    console.log('Added 150 users');

    // create 50 experts
    _.each(_.range(50), function(){
      var expertApp = Meteor.settings.public.APP_MULTI_CLIENT ? 
        faker.random.arrayElement(['app1','app2','app3']) :
        'app0';
      
      var rName = faker.name.firstName();
      var rSurname = faker.name.lastName();
      var rEmail1 = rName + '.' + rSurname + '@' + domainName;
      var rEmail = rEmail1.toLowerCase();
      var rPhone = String(faker.phone.phoneNumber());
      var rSpec = null;
      let specIdObj = {
        'app1': specIds1[Math.floor(Math.random() * specIds1.length)],
        'app2': specIds2[Math.floor(Math.random() * specIds2.length)],
        'app3': specIds3[Math.floor(Math.random() * specIds3.length)],
        'app0': specIds[Math.floor(Math.random() * specIds.length)],
      }
      rSpec = specIdObj[expertApp];
      var rPrice = faker.commerce.price(10,200,2,'');
      var rMsg = faker.lorem.paragraphs(3);
      var photoId = faker.random.number({min:1, max:100});
      var photoGender = faker.random.arrayElement(['men','women']);
      var rPhoto = 'https://randomuser.me/api/portraits/' + photoGender + '/' + photoId + '.jpg';
      var rSlug = (rName[0] + rSurname).toLowerCase();
      
      var bio = {
            personal: rMsg
      };

      var id = Accounts.createUser({
        name: rEmail,
        profile: {
          user: {
            name: rName,
            surname: rSurname,
            gender: 'male',
            mobile: rPhone,
            photo: rPhoto,
            allowed_notifications: ['email'],
            lang: 'en',
            slug: rSlug
          },
          provider: {
            featured: false,
            short_bio: bio,
            specialities: [rSpec],
            price: rPrice,
            "schedule" : {
                    "day" : [
                        [],
                        ["08:30","09:00","09:30","10:00","10:30"],
                        ["08:30","09:00","09:30","10:00","10:30"],
                        ["09:00","09:30"],
                        ["08:30","09:00","09:30","10:00","10:30"],
                        ["11:30","12:00","12:30"],
                        []
                    ],
                    'duration': 30
                }
          }
        },
        email: rEmail,
        password: 'mypass@321'
      });
      if (Meteor.settings.public.APP_MULTI_CLIENT){
        Partitioner.setUserGroup(id, expertApp)
      }
      Roles.addUsersToRoles(id, ['provider']);
      Meteor.users.update({_id:id}, {$set:{
        'emails.0.verified': true
      }});
    });
    console.log('Added 50 experts');

    //create user@domain, provider@domain & admin@domain if they don't exist
    if (!Meteor.settings.public.APP_MULTI_CLIENT){
      if (!Meteor.users.findOne({'emails.0.address': `user@${domainName}`}) &&
          !Meteor.users.findOne({'emails.0.address': `expert@${domainName}`})
        ){
        var uId = Meteor.users.findOne({'roles': {$in: ['user']}})._id;
        var pId = Meteor.users.findOne({'roles': {$in: ['provider']}})._id;
        Meteor.users.update({_id:uId}, {$set:{
            'emails.0.address': `user@${domainName}`,
            'emails.0.verified': true
        }});
        Meteor.users.update({_id:pId}, {$set:{
            'emails.0.address': `expert@${domainName}`,
            'emails.0.verified': true
        }});
        // assign admin to random user
        var uId2 = Meteor.users.findOne({'_id': {$ne: uId}, 'roles': {$in: ['user']}})._id;
        Meteor.users.update({_id:uId2}, {$set:{
            'emails.0.address': `admin@${domainName}`,
            'emails.0.verified': true
        }});
        Roles.setUserRoles(uId2, []);
        Roles.addUsersToRoles(uId2, ['admin']);
        console.log('Added user,expert, admin');
      }
    }
    
    // create superadmin if not exists
    let adminEmail = Meteor.settings.private.ADMIN_EMAIL
    if (!Meteor.users.findOne({'emails.0.address': adminEmail})){
      var id = Accounts.createUser({
        profile: {
          user: {
            name: 'admin',
            surname: 'admin',
            allowed_notifications: ['email'],
            lang: Meteor.settings.public.DEFAULT_LANG
          }
        },
        email: adminEmail,
        password: 'mypass@321'
      });
      Roles.addUsersToRoles(id, ['admin']);
      Meteor.users.update({_id: id}, {$set:{
        admin: true
      }});
      
      console.log('Added admin: ' + adminEmail);
    }

    // create admins for 3 apps (tenants)
    if (Meteor.settings.public.APP_MULTI_CLIENT){
      var id = Accounts.createUser({
        profile: {
          user: {
            name: 'admin',
            surname: 'admin',
            allowed_notifications: ['email'],
            lang: Meteor.settings.public.DEFAULT_LANG,
            slug: 'admin1'
          }
        },
        email: 'admin-app1@meetpro.live',
        password: 'mypass@321'
      });
      Partitioner.setUserGroup(id, 'app1');
      Roles.addUsersToRoles(id, ['admin']);
      console.log('Added admin @ app1');
      var id = Accounts.createUser({
        profile: {
          user: {
            name: 'admin',
            surname: 'admin',
            allowed_notifications: ['email'],
            lang: Meteor.settings.public.DEFAULT_LANG,
            slug: 'admin2'
          }
        },
        email: 'admin-app2@meetpro.live',
        password: 'mypass@321'
      });
      Partitioner.setUserGroup(id, 'app2');
      Roles.addUsersToRoles(id, ['admin']);
      console.log('Added admin @ app2');
      var id = Accounts.createUser({
        profile: {
          user: {
            name: 'admin',
            surname: 'admin',
            allowed_notifications: ['email'],
            lang: Meteor.settings.public.DEFAULT_LANG,
            slug: 'admin3'
          }
        },
        email: 'admin-app3@meetpro.live',
        password: 'mypass@321'
      });
      Partitioner.setUserGroup(id, 'app3');
      Roles.addUsersToRoles(id, ['admin']);
      console.log('Added admin @ app3');
    }

    if (!Meteor.settings.public.APP_MULTI_CLIENT){
      // add 500 future bookings
      _.each(_.range(500), function(){
        var uIds = _.map(Meteor.users.find({'roles': {$in: ['user']}}, {fields: {'_id': 1}}).fetch(), function(a){ return a._id;});
        var pIds = _.map(Meteor.users.find({'roles': {$in: ['provider']}}, {fields: {'_id': 1}}).fetch(), function(a){ return a._id;});
        var user = faker.random.arrayElement(uIds);
        var provider = faker.random.arrayElement(pIds);
        var sDate = faker.date.future();
        var eDate = new Date(sDate.getTime() + 30*60000);
        var rStatus = faker.random.arrayElement(['confirmed','cancelled']);
        var rPay = faker.random.arrayElement(['paypal','braintree','stripe']);
        var rPrice = faker.commerce.price(10.00,200.00,2,'');

        Bookings.insert(
          {
            userId: user,
            providerId: provider,
            start: sDate,
            end: eDate,
            status: rStatus,
            payment: rPay,
            price: rPrice,
            apptType: 'videocall',
            duration: 30
          }
        );
      });
      console.log('Added 500 future bookings');

      // add 500 past bookings
      _.each(_.range(500), function(){
        var uIds = _.map(Meteor.users.find({'roles': {$in: ['user']}}, {fields: {'_id': 1}}).fetch(), function(a){ return a._id;});
        var pIds = _.map(Meteor.users.find({'roles': {$in: ['provider']}}, {fields: {'_id': 1}}).fetch(), function(a){ return a._id;});
        var user = faker.random.arrayElement(uIds);
        var provider = faker.random.arrayElement(pIds);
        var sDate = faker.date.past();
        var eDate = new Date(sDate.getTime() + 30*60000);
        var rStatus = faker.random.arrayElement(['completed','cancelled']);
        var rPay = faker.random.arrayElement(['paypal','viva','braintree','stripe']);
        var rPrice = faker.commerce.price(10,200,2,'');

        Bookings.insert(
          {
            userId: user,
            providerId: provider,
            start: sDate,
            end: eDate,
            status: rStatus,
            payment: rPay,
            price: rPrice,
            duration: 30
          }
        );
      });
      console.log('Added 500 past bookings');
    

      // add 1000 messages
      if (Meteor.settings.public.messagesEnabled){
        _.each(_.range(1000), function(){
          var uIds = _.map(Meteor.users.find({'roles': {$in: ['user']}}, {fields: {'_id': 1}}).fetch(), function(a){ return a._id;});
          var pIds = _.map(Meteor.users.find({'roles': {$in: ['provider']}}, {fields: {'_id': 1}}).fetch(), function(a){ return a._id;});
          var user = faker.random.arrayElement(uIds);
          var provider = faker.random.arrayElement(pIds);
          var rTitle = faker.lorem.words(3).join(' ');
          var rMsg = faker.lorem.paragraph();
          var sDate = faker.date.past();

          Messages.insert(
            {
              owner: user,
              from: provider,
              title: rTitle,
              message: rMsg,
              link: '/messages/',
              date: sDate
            }
          );
        });
      }
    } else {
      // add 900 future bookings
      _.each(_.range(300), function(){
        var uIds = _.map(Meteor.users.find({'roles': {$in: ['user']}, group: 'app1'}, {fields: {'_id': 1}}).fetch(), function(a){ return a._id;});
        var pIds = _.map(Meteor.users.find({'roles': {$in: ['provider']}, group: 'app1'}, {fields: {'_id': 1}}).fetch(), function(a){ return a._id;});
        var user = faker.random.arrayElement(uIds);
        var provider = faker.random.arrayElement(pIds);
        var sDate = faker.date.future();
        var eDate = new Date(sDate.getTime() + 30*60000);
        var rStatus = faker.random.arrayElement(['confirmed','cancelled']);
        var rPay = faker.random.arrayElement(['paypal','viva','braintree','stripe']);
        var rPrice = faker.commerce.price(10.00,200.00,2,'');

        Partitioner.bindGroup('app1', function(){
          Bookings.insert({
              userId: user,
              providerId: provider,
              start: sDate,
              end: eDate,
              status: rStatus,
              payment: rPay,
              price: rPrice,
              apptType: 'videocall',
              duration: 30
            });
        });
      });
      _.each(_.range(300), function(){
        var uIds = _.map(Meteor.users.find({'roles': {$in: ['user']}, group: 'app2'}, {fields: {'_id': 1}}).fetch(), function(a){ return a._id;});
        var pIds = _.map(Meteor.users.find({'roles': {$in: ['provider']}, group: 'app2'}, {fields: {'_id': 1}}).fetch(), function(a){ return a._id;});
        var user = faker.random.arrayElement(uIds);
        var provider = faker.random.arrayElement(pIds);
        var sDate = faker.date.future();
        var eDate = new Date(sDate.getTime() + 30*60000);
        var rStatus = faker.random.arrayElement(['confirmed','cancelled']);
        var rPay = faker.random.arrayElement(['paypal','viva','braintree','stripe']);
        var rPrice = faker.commerce.price(10.00,200.00,2,'');

        Partitioner.bindGroup('app2', function(){
          Bookings.insert({
              userId: user,
              providerId: provider,
              start: sDate,
              end: eDate,
              status: rStatus,
              payment: rPay,
              price: rPrice,
              apptType: 'videocall',
              duration: 30
            });
        });
      });
      _.each(_.range(300), function(){
        var uIds = _.map(Meteor.users.find({'roles': {$in: ['user']}, group: 'app3'}, {fields: {'_id': 1}}).fetch(), function(a){ return a._id;});
        var pIds = _.map(Meteor.users.find({'roles': {$in: ['provider']}, group: 'app3'}, {fields: {'_id': 1}}).fetch(), function(a){ return a._id;});
        var user = faker.random.arrayElement(uIds);
        var provider = faker.random.arrayElement(pIds);
        var sDate = faker.date.future();
        var eDate = new Date(sDate.getTime() + 30*60000);
        var rStatus = faker.random.arrayElement(['confirmed','cancelled']);
        var rPay = faker.random.arrayElement(['paypal','viva','braintree','stripe']);
        var rPrice = faker.commerce.price(10.00,200.00,2,'');

        Partitioner.bindGroup('app3', function(){
          Bookings.insert({
              userId: user,
              providerId: provider,
              start: sDate,
              end: eDate,
              status: rStatus,
              payment: rPay,
              price: rPrice,
              apptType: 'videocall',
              duration: 30
            });
        });
      });      
      console.log('Added 900 future bookings');

      // add 600 past bookings
      _.each(_.range(200), function(){
        var uIds = _.map(Meteor.users.find({'roles': {$in: ['user']}, group: 'app1'}, {fields: {'_id': 1}}).fetch(), function(a){ return a._id;});
        var pIds = _.map(Meteor.users.find({'roles': {$in: ['provider']}, group: 'app1'}, {fields: {'_id': 1}}).fetch(), function(a){ return a._id;});
        var user = faker.random.arrayElement(uIds);
        var provider = faker.random.arrayElement(pIds);
        var sDate = faker.date.past();
        var eDate = new Date(sDate.getTime() + 30*60000);
        var rStatus = faker.random.arrayElement(['confirmed','cancelled']);
        var rPay = faker.random.arrayElement(['paypal','viva','braintree','stripe']);
        var rPrice = faker.commerce.price(10.00,200.00,2,'');

        Partitioner.bindGroup('app1', function(){
          Bookings.insert({
              userId: user,
              providerId: provider,
              start: sDate,
              end: eDate,
              status: rStatus,
              payment: rPay,
              price: rPrice,
              apptType: 'videocall',
              duration: 30
            });
        });
      });
      _.each(_.range(200), function(){
        var uIds = _.map(Meteor.users.find({'roles': {$in: ['user']}, group: 'app2'}, {fields: {'_id': 1}}).fetch(), function(a){ return a._id;});
        var pIds = _.map(Meteor.users.find({'roles': {$in: ['provider']}, group: 'app2'}, {fields: {'_id': 1}}).fetch(), function(a){ return a._id;});
        var user = faker.random.arrayElement(uIds);
        var provider = faker.random.arrayElement(pIds);
        var sDate = faker.date.past();
        var eDate = new Date(sDate.getTime() + 30*60000);
        var rStatus = faker.random.arrayElement(['confirmed','cancelled']);
        var rPay = faker.random.arrayElement(['paypal','viva','braintree','stripe']);
        var rPrice = faker.commerce.price(10.00,200.00,2,'');

        Partitioner.bindGroup('app2', function(){
          Bookings.insert({
              userId: user,
              providerId: provider,
              start: sDate,
              end: eDate,
              status: rStatus,
              payment: rPay,
              price: rPrice,
              apptType: 'videocall',
              duration: 30
            });
        });
      });
      _.each(_.range(200), function(){
        var uIds = _.map(Meteor.users.find({'roles': {$in: ['user']}, group: 'app3'}, {fields: {'_id': 1}}).fetch(), function(a){ return a._id;});
        var pIds = _.map(Meteor.users.find({'roles': {$in: ['provider']}, group: 'app3'}, {fields: {'_id': 1}}).fetch(), function(a){ return a._id;});
        var user = faker.random.arrayElement(uIds);
        var provider = faker.random.arrayElement(pIds);
        var sDate = faker.date.past();
        var eDate = new Date(sDate.getTime() + 30*60000);
        var rStatus = faker.random.arrayElement(['confirmed','cancelled']);
        var rPay = faker.random.arrayElement(['paypal','viva','braintree','stripe']);
        var rPrice = faker.commerce.price(10.00,200.00,2,'');

        Partitioner.bindGroup('app3', function(){
          Bookings.insert({
              userId: user,
              providerId: provider,
              start: sDate,
              end: eDate,
              status: rStatus,
              payment: rPay,
              price: rPrice,
              apptType: 'videocall',
              duration: 30
            });
        });
      });
      console.log('Added 600 past bookings');
    }
    console.log('Done generating random data...');
  }
} else {
  // if production mode, create just admin user
  let adminEmail = Meteor.settings.private.ADMIN_EMAIL
  if (!Meteor.users.findOne({'emails.0.address': adminEmail})){
    var id = Accounts.createUser({
      profile: {
        user: {
          name: 'admin',
          surname: 'admin',
          allowed_notifications: ['email'],
          lang: Meteor.settings.public.DEFAULT_LANG
        }
      },
      email: adminEmail,
      password: 'mypass@321'
    });
    Roles.addUsersToRoles(id, ['admin']);
    if (Meteor.settings.public.APP_MULTI_CLIENT){
      Meteor.users.update({_id:id}, {$set:{
        'admin': true
      }});
    }
    console.log('Added super-admin: ' + adminEmail);
    if (Params.find().count() === 0) {
      let param = {
        APP_EMAIL: Meteor.settings.private.ADMIN_EMAIL,
        ADMIN_EMAIL: Meteor.settings.private.ADMIN_EMAIL,
        ADMIN_SUMMARIES: true,
        SITE_URL: Meteor.settings.private.APP_URL,
        PRIMARY_LANG: Meteor.settings.public.DEFAULT_LANG,
        BT_MERCHANT_ID: "id",
        BT_PUBLIC_KEY: "key",
        BT_PRIVATE_KEY: "key",
        VP_PUBLIC_KEY: "key",
        VP_MERCHANT_ID: "id",
        VP_API_KEY: "key",
        VP_SOURCE: "0",
        providersPerPage: 12,
        daysCanCancel: 2,
        enterInterval: 5,
        bookingAllowedHours: 4,
        bookingCharge: 0,
        CLICKATELL_FROM: "",
        workhours_from: "07:00",
        workhours_to: "17:00",
        workhours_tz: "Europe/London",
        bearerToken: '',
        subscriptionId: 'none',
        subscriptionStatus: 'active',
        plan: 'pro'
      };
      Params.insert(param);
      console.log('Params inserted');
    }
  }  
}
