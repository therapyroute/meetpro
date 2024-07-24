// core package methods
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { Random } from 'meteor/random';

Meteor.methods({
  // check if provider param is id or customUrl and return provider id
  checkProviderParam: function(param) {
   if (Meteor.users.findOne({_id: param}))
		return param;
   else if (Meteor.users.findOne({'profile.user.slug': param})) {
      return Meteor.users.findOne({'profile.user.slug': param})._id;
   }
   else {
      throw new Meteor.Error('notfound','Provider not found');
   }
 },
 // client side logging method
  appLog: function (message, level = 'error') {
    if (this.userId){
      check(message, String);
      check(level, String);
      var logObj = {
        uid: this.userId,
        level: level,
        content: message
      };
      Meteor.defer(function() {
        appCommon.appLog(logObj);
      });
   }
   else {
     throw new Meteor.Error('not-allowed', 'Guest cannot log');
   }
 },
 // update user language @ collection
 setUserLanguage(id, lang) {
    if (this.userId && this.userId === id) {
      return Meteor.users.update({_id: id},{$set:{
        'profile.user.lang': lang
      }});
    }
    throw new Meteor.Error('not-allowed', 'Cannot change user language');
 },
 // send a verification link email to current user
 sendVerificationLink(lang) {
    if ( this.userId ) {
      langGlobal = lang;
      try {
        return Accounts.sendVerificationEmail( this.userId );
      }
      catch (err) {
        throw new Meteor.Error('no-verification-email', 'Cannot send verification email: ' + err);
      }
    }
  },
  getRatingAverage(providerId) {
    if (this.userId && Roles.userIsInRole(this.userId,'provider')) {
      var data = Meteor.users.findOne({_id: providerId}).profile.provider.ratings;
      if (!data) return;
      var ratings = [];
      _.each(data, function(arr){
        ratings.push(arr.rating);
      });

      avg = _.reduce(ratings, function(memo, num){
        return memo+num
      }) / (ratings.length === 0 ? 1 : ratings.length);

      function round(value, precision) {
        var multiplier = Math.pow(10, precision || 0);
        return Math.round(value * multiplier) / multiplier;
      };
      let pAvg = round(avg,1).toFixed(1);
      return {avg: pAvg, num: ratings.length};
    }
    throw new Meteor.Error('not-allowed', 'Guest cannot get provider ratings');
  },
  // method to return featured providers to home screen (replaced a similar publication)
  getFeaturedProviders() {
    var featured = [];
    Meteor.users.find({'profile.provider.featured': true}).map(function (rec) {
      if (rec){
        var imageUrl = rec.profile.user.photo ? rec.profile.user.photo :
          '/images/temp-images/expert-avatar.jpg';

        featured.push({
          specialities: rec.specs(),
          fullname: rec.profile.user.name + " " + rec.profile.user.surname,
          path: FlowRouter.path("providerRoute", {providerId: rec._id}),
          image: imageUrl
        });
      }
    });
    return featured;
  },
  // return expertise names as comma concatenated string
  // getExpertiseNames(uid) {
  //     return Meteor.users.findOne({_id: uid}).getExpertise().join(', ');
  // },
  // search in provider surnames, specialities & expertise
  searchAll(term) {
    if (term == '')
      return [];
    else {
      let search = term;
      let regex = new RegExp(search, 'i' );
      // First search in specialities
      let specs = Specialities.find({name: {$in: [regex]}}).fetch().map(function(sp){
          return {
            type: 'speciality',
            _id: sp._id,
            name: sp.name
          };
      });
      // Then in expertise etc
      var expertise = Expertise.find({name: {$in: [regex]}}).fetch().map(function(expt){
        return {
          type:  'expertise',
          id: expt._id,
          code: expt.itemCode,
          name: expt.name
        };
      });
      // Finally, search in expert surnames & specialities
      var specsIds = specs.map(function(sp){
        return sp.id;
      });

      var providers = Meteor.users.find(
        {
          'roles': {$in: ['provider']},
          $or: [
            { 'profile.user.surname': regex },
            { 'profile.provider.specialities': { $in: specsIds} },
            { 'profile.provider.expertise': { $in: [regex] } },
          ]
        },
        {
          //limit: parseInt(Meteor.settings.public.REST_RESULT_LIMIT),
          // first display featured, then sort alphabetically
          sort: {
            //'profile.provider.featured': -1,
            'profile.user.surname': 1
          }
        }
      ).fetch();

      var providerData = providers.map(function(p){
        return {
          type: 'provider',
          id: p._id,
          slug: p.profile.user.slug,
          name: p.profile.user.name,
          surname: p.profile.user.surname,
          specialities: Meteor.users.findOne({_id: p._id}).specs(),
          //featured: p.profile.provider.featured
        }
      });

      var returnData = specs.concat(providerData).concat(expertise);
      //console.log(returnData);
      return returnData;
    }
  },
  // insert to contact form collection & send email to admin
  cfInsert (doc) {
    check(doc, {
      name: String,
      email: String,
      message: String
    });
    let insResult = Contact.insert(doc);
    // send email to admin
    Meteor.defer(function() {
      let emText = `Fullname: ${doc.name}<br>
      email: ${doc.email}<br>
      Message: ${doc.message}`;
      let emObj = {
        lang: 'el',
        to: appCommon.getParam('ADMIN_EMAIL', null, this.userId),
        subject: 'New message from contact form',
        text: emText,
      }
      appCommon.appSendMail(emObj);
    });
    return insResult;
  },
  initiateClient(reqData){
    // create admin with random password (useless because they will login with Wordpress)
    let newId = Accounts.createUser({
      email: reqData.email, 
      password: Random.id(),
      name: reqData.fname,
      surname: reqData.lname
    });
    console.log('Successfully added new client with id: ' + newId + ' and name: ' + reqData.name);
    Partitioner.setUserGroup(newId, reqData.groupId)
    
    // TODO: Fix enrollment email link redirection
    //let newId = Accounts.createUser({email: reqData.email});
    //Accounts.sendEnrollmentEmail(newId);
    // create client params
    let param = {
      APP_NAME: reqData.name,
      APP_EMAIL: reqData.email,
      ADMIN_EMAIL: reqData.email,
      ADMIN_ID: newId,
      ADMIN_SUMMARIES: true,
      SITE_URL: reqData.url,
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
      CLICKATELL_FROM: reqData.groupId,
      workhours_from: "09:00",
      workhours_to: "17:00",
      workhours_tz: "Europe/London",
      bearerToken: Random.secret(),
      subscriptionId: reqData.subscription,
      subscriptionStatus: 'active',
      plan: reqData.plan
    };
    let paramResult = null;
    Partitioner.bindGroup(reqData.groupId, function(){
      paramResult = Params.insert(param);
      console.log("New client's params were added");
    })
    
    // update user: add wordpress to services
    const wpObj = {
      user_login: reqData.name,
      user_nicename: reqData.name,
      user_email: reqData.email,
      user_registered: reqData.registered,
      user_status: '0',
      display_name: reqData.name,
      id: reqData.userid
    };
    
    // make admin, add new client id, add wordpress service & first,last name
    let updateResult = Meteor.users.update({_id: newId}, {$set:{
      'roles': ['admin'],
      "services.wordpress": wpObj,
      'profile.user.name': reqData.fname,
      'profile.user.surname': reqData.lname
    }});
    //Roles.setUserRoles(newId, 'admin')
    if (paramResult && updateResult){
      return {
        "success" : {
          "status" : 200,
          "message" : "Successful client & administrator creation",
          "paramId" : paramResult,
          "userId" : newId
        }
      }
    } else {
      return {
        "error" : {
          "status" : 502,
          "message" : "Bad gateway."
        }
      }
    }
  },
  isProPlan: function() {
    if (this.userId && appCommon.getParam('plan', null, this.userId) == 'pro'){
      return true;
    }
    throw new Meteor.Error('no-pro','Not a pro plan');
  }
});
