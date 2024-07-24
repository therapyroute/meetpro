import { Random } from 'meteor/random';
import { fetch } from "meteor/fetch";
import Stripe from 'stripe';


Meteor.methods({
  // return the requested user (only to admins)
  adminGetUser: function(uId) { 
    if (this.userId) {
        if (Roles.userIsInRole(this.userId,['admin'])) {
          let theUser = Meteor.users.findOne({_id: uId},{
              fields: { password: 0 }
          });
          // if superadmin, return user's group
          if (Meteor.user().admin) {
            theUser.group = Partitioner.getUserGroup(uId);
          }
          return theUser;
        }
        throw new Meteor.Error('not-allowed', 'Cannot get user');
    }
    throw new Meteor.Error('not-allowed', 'Unauthorized access');
  },
  // updateRole
  // only for admins
  updateRole: function(obj) {
    if (this.userId && Roles.userIsInRole(this.userId,'admin')){
        check(obj, Object);
        check(obj.id, String);
        check(obj.newRole, String);
        // if confirming provider, initialize some profile data...        
        // if multi client, check plan & usage before updating role
        if (obj.newRole === 'provider') {
          if (Meteor.settings.public.APP_MULTI_CLIENT) {
            if (appUsage.checkProviderNumber(this.userId) == -1) {
              throw new Meteor.Error('notAllowed','Could not create provider due to plan usage limit');
              return false;
            }
          }
          let providerData = {
            featured: false,
            short_bio: '',
            specialities: [],
            price: 0,
            "schedule" : {
                    "day" : [
                        [],[],[],[],[],[],[]
                    ],
                    'duration': 30
                }
          };
          Meteor.users.update({_id: obj.id}, {$set: {
            "profile.provider": providerData
          }});
        }
        Roles.setUserRoles(obj.id, obj.newRole);
        return true;
    }
    else {
        throw new Meteor.Error('noRoleChange','Could not change role');
    }
    throw new Meteor.Error('unauthorized','Cannot change role');
  },
  addRole: function(obj) {
    if (this.userId && Roles.userIsInRole(this.userId,'admin')){
        check(obj, Object);
        check(obj.id, String);
        check(obj.newRole, String);
        Roles.addUsersToRoles(obj.id, obj.newRole);
        return true;
    }
    throw new Meteor.Error('noRoleChange','Could not add role');
  },
  insertUser: function(obj, returnUser = false) {
    if (this.userId && Roles.userIsInRole(this.userId,'admin')){
        check(obj, Object);
        check(obj.name, String);
        check(obj.surname, String);
        check(obj.email, String);
        // check(obj.password, String);
        check(obj.role, String);
        var userObj = { 
          email: obj.email,
          // password: obj.password,
          name: obj.name,
          surname: obj.surname,
          role: obj.role
        }; 
        // if multi client and not SuperAdmin, check plan & usage before inserting provider
        if (Meteor.settings.public.APP_MULTI_CLIENT && !appCommon.isSuperAdmin()) {
          if (appUsage.checkProviderNumber(this.userId) == -1 && obj.role == 'provider') {
            throw new Meteor.Error('notAllowed','Could not create provider due to plan usage limit');
          }
        }
        let theId = Accounts.createUser(userObj);
        // send enrollment email
        Accounts.sendEnrollmentEmail(theId);
        
        Roles.setUserRoles(theId, obj.role);
        // if multiclient, set usergroup
        if (Meteor.settings.public.APP_MULTI_CLIENT) {
          let theGroup = obj.group ? 
            obj.group : Partitioner.group();
          Partitioner.setUserGroup(theId, theGroup);
        }
        return returnUser ? Meteor.users.findOne({_id: theId}) : theId;
    }
    else {
        throw new Meteor.Error('noCreateUser','Could not create user');
    }
    throw new Meteor.Error('unauthorized','Cannot create user');
  },
  updateParams: function(modifier, theId) {
    if (this.userId && Roles.userIsInRole(this.userId, ['admin'])) {
      // check modifier
      //var schema = Params.simpleSchema();
      //var match = Match.OneOf({$set: schema}, {$unset: Object}, {$set: schema, $unset: Object});
      //check(modifier, match);
      let result = Params.update({_id: theId}, modifier);
      // re-load params to server
      // appParams = Params.findOne({});
      return result;
    }
    throw new Meteor.Error('unauthorized','Not allowed to edit params');
  },
  updateBooking: function(modifier, theId) {
    if (this.userId && Roles.userIsInRole(this.userId, ['admin'])) {
      // check modifier
      //var schema = Bookings.simpleSchema();
      //var match = Match.OneOf({$set: schema}, {$unset: Object}, {$set: schema, $unset: Object});
      //check(modifier, match);
      return Bookings.update({_id: theId}, modifier);
    }
    throw new Meteor.Error('unauthorized','Not allowed to edit booking');
  },
  // table methods
  updateSpeciality: function(modifier, theId) {
    if (this.userId && Roles.userIsInRole(this.userId, ['admin'])) {
      return Specialities.update({_id: theId}, modifier);
    }
    throw new Meteor.Error('unauthorized','Not allowed to edit collection');
  },
  updateExpertise: function(modifier, theId) {
    if (this.userId && Roles.userIsInRole(this.userId, ['admin'])) {
      return Expertise.update({_id: theId}, modifier);
    }
    throw new Meteor.Error('unauthorized','Not allowed to edit collection');
  },
  updateNotifications: function(modifier, theId) {
    if (this.userId && Roles.userIsInRole(this.userId, ['admin'])) {
      return NotificationTemplates.update({_id: theId}, modifier);
    }
    throw new Meteor.Error('unauthorized','Not allowed to edit collection');
  },
  addSpeciality: function(doc){
    if (this.userId && Roles.userIsInRole(this.userId, ['admin'])) {
      // if (Specialities.findOne({_id: doc.id}))
      //   throw new Meteor.Error('duplicate','Duplicate speciality id');    
      return Specialities.insert(doc);
    }
    throw new Meteor.Error('unauthorized','Not allowed to add to collection');
  },
  addExpertise: function(doc){
    if (this.userId && Roles.userIsInRole(this.userId, ['admin'])) {
      return Expertise.insert(doc);
    }
    throw new Meteor.Error('unauthorized','Not allowed to add to collection');
  },
  deleteRow: function(data){
    if (this.userId && Roles.userIsInRole(this.userId, ['admin'])) {
      if (data.table === 'Specialities'){
        return Specialities.remove({_id: data.id});        
      } else {
        return Expertise.remove({_id: data.id});
      }
    }
    throw new Meteor.Error('unauthorized','Not allowed to add to collection');
  },
  verifyUserEmail: function(id) {
    if (this.userId && Roles.userIsInRole(this.userId, ['admin'])) {
      return Meteor.users.update({_id: id}, {$set:{
        'emails.0.verified': true
      }});
    }
    throw new Meteor.Error('unauthorized','Not allowed to verify email');
  },
  uploadLogo: function(b64){
    if (this.userId && Roles.userIsInRole(this.userId, ['admin'])) {
      return Params.update({}, {$set:{
        'APP_LOGO': b64
      }});
    }
    throw new Meteor.Error('unauthorized','Not allowed to upload logo');
  },
  updateToken: function(){
    if (this.userId && Roles.userIsInRole(this.userId, ['admin'])) {
      return Params.update({}, {$set:{
        bearerToken: Random.secret()
      }});
    }
    throw new Meteor.Error('unauthorized','Not allowed to update token');
  },
  addBackground: function(fileUrl) {
    if (this.userId && Roles.userIsInRole(this.userId, ['admin'])) {
      return Params.update({}, {$set:{
        APP_BKG: fileUrl
      }});
    }
    throw new Meteor.Error('unauthorized','Not allowed to upload background');
  },
  removeBackground: function() {
    if (this.userId && Roles.userIsInRole(this.userId, ['admin'])) {
      return Params.update({}, {$set:{
        APP_BKG: null
      }});
    }
    throw new Meteor.Error('unauthorized','Not allowed to upload background');
  },
  getTenantsExtended: function() {
    let params = Params.direct.find().fetch();
    if (!params) {
      throw new Meteor.Error('error','No tenants in database');
    }
    let theData = [];
    params.forEach(app => {
      theData.push({
        "name": app.APP_NAME, 
        "description": app.APP_DESCRIPTION,
        "email": app.ADMIN_EMAIL,
        "lang": app.PRIMARY_LANG,
        "subscription": app.subscriptionId,
        "status": app.subscriptionStatus,
        "plan": app.plan,
        "id": app._id
      });
    });
    return theData;
  },
  // check to see if the admin should run the app onboarding process
  adminShouldOnboard: function() {
    if (!this.userId) {
      throw new Meteor.Error('unauthorized','Guest not allowed to onboard');
    }
    // check if payments are set
    let params = Meteor.settings.public.APP_MULTI_CLIENT ? Params.findOne({'_groupId': Partitioner.getUserGroup(this.userId)}) :  Params.findOne({});
    let paymentsSet = null;
    paymentsSet = params && Array.isArray(params.enabledPayments) && 
                  params.enabledPayments.length > 0 ?
                  true : false;
    // check if experts exist (including admin-expert)
    let hasExperts = null;
    let experts = Meteor.users.find({'roles': {$in: ['provider']}}).fetch();
    hasExperts = experts.length > 0 ? true : false;
    return paymentsSet && hasExperts ? 'no' : 'yes';
  },
  onboardingGeneral: function(data) {
    if (!this.userId) {
      throw new Meteor.Error('unauthorized','Guest not allowed to onboard');
    }
    let obj = {
      APP_NAME: data.name,
      APP_DESCRIPTION: data.description,
      SITE_URL: data.site_url
    };
    let params = Meteor.settings.public.APP_MULTI_CLIENT ? Params.findOne({'_groupId': Partitioner.getUserGroup(this.userId)}) :  Params.findOne({}); 
    return Params.update({_id: params._id}, {$set: obj});
  },
  onboardingPayments: function(data) {
    if (!this.userId) {
      throw new Meteor.Error('unauthorized','Guest not allowed to onboard');
    }
    data.enabledPayments = [data.paymentMethod];
    delete data.paymentMethod;
    let params = Meteor.settings.public.APP_MULTI_CLIENT ? Params.findOne({'_groupId': Partitioner.getUserGroup(this.userId)}) :  Params.findOne({});
    return Params.update({_id: params._id}, {$set: data});
  },
  onboardingSelfExpert: function(data) {
    if (!this.userId) {
      throw new Meteor.Error('unauthorized','Guest not allowed to onboard');
    }
    let theUser = Meteor.users.findOne({_id: this.userId});
    let days = theUser?.profile?.provider?.schedule?.day;
    if ( !days || (days[0].length + days[1].length + days[2].length + days[3].length + days[4].length + days[5].length + days[6].length <= 0) ) {
      throw new Meteor.Error('no-schedule','Expert must set their schedule');
    }
    let theSlug = data.myname[0] + data.mysurname;
    let specObj = {
      name: data.specialty
    };
    let specialtyId = Specialities.insert(specObj);
    // update user
    let userUpdate = Meteor.users.update({_id: this.userId}, {$set:{
      'profile.provider.price': data.price,
      'profile.provider.specialities': [specialtyId],
      'profile.user.slug': theSlug,
      'profile.user.name': data.myname,
      'profile.user.surname': data.mysurname,
    }});
    // update params
    let obj = {
      
    };
    let params = Meteor.settings.public.APP_MULTI_CLIENT ? Params.findOne({'_groupId': Partitioner.getUserGroup(this.userId)}) :  Params.findOne({});
    let paramUpdate = Params.update({_id: params._id}, {$set: {currency: data.currency}});
    return userUpdate && paramUpdate;
  },
  onboardingExpert: function(data) {
    if (!this.userId) {
      throw new Meteor.Error('unauthorized','Guest not allowed to onboard');
    }
    return Meteor.users.update({_id: this.userId}, {$set:{
      'profile.provider.price': data.price,
    }});
  },
  downloadAppointments: function() {
    // TODO format data for export
    return CSV.unparse(Bookings.find().fetch());
  },
  checkPaypalCredentials: function(b64 = null) {
    let theAuth = b64 ? b64 : 
    Base64.encode(appCommon.getParam('PAYPAL_CLIENT_ID', null, this.userId) + ":" + appCommon.getParam('PAYPAL_SECRET', null, this.userId));
    let getHeaders = {
      "Authorization": `Basic ${theAuth}`,
      'Accept': 'application/json',
      'Accept-Language': 'en_US',
      'Content-Type': 'application/json'
    };

    let url = 'https://api-m.sandbox.paypal.com/v1/oauth2/token'
    
    let response = fetch(url, {
      method: 'POST',
      headers: getHeaders,
      body: 'grant_type=client_credentials'
    })
      .then(response => {
          // handle the response
          const theStatus = response.status;
          return theStatus == 200 ? 'success' : 'failure';
      })
      .catch(error => {
          // handle the error
          console.log(error);
          throw new Meteor.Error('paypal-error','Error checking paypal credentials');
      });
      return response;
  },
  // checks if Stripe's API key is valid
  checkStripeCredentials: function(apiKey = null) {
    if (!apiKey) {
      apiKey = appCommon.getParam('STRIPE_API_KEY', null, this.userId);
    }
    // check API key
    let stripe = Stripe( apiKey );
    let response = stripe.tokens.create({'pii': {id_number: 'test'}})
      .then( result =>{
        // console.log(result);
        return result;
      })
      .catch(error => {
        // console.log(error);
        throw new Meteor.Error('stripe-error','Error checking stripe credentials');
      })
    return response;
  },
  addClient: function(obj) {
    if (appCommon.isSuperAdmin()) {
      // check if data is valid
      // email validation code
      let ValidEmailRegex = /^[A-Z0-9\._%+-]+@[A-Z0-9\.-]+\.[A-Z]{2,}$/i;
      let ValidEmail = Match.Where(function(x) {
        check(x, String);
        return x.length <= 254 && ValidEmailRegex.test(x);
      });
      
      check(obj, {
        appname: String,
        appadminemail: ValidEmail,
      });
      let groupId = obj.appname.toLowerCase();

      // check if app name exists
      if (Params.direct.findOne({'APP_NAME': obj.appname})){
        throw new Meteor.Error('app-exists','An app with this name already exists');
      }

      // create admin
      // get name surname from email because a slug must be created
      let temp = obj.appadminemail.split('@')[0];
      let name = temp.substring(0,1);
      let surname = temp.substring(1);
      // create user
      let newId = Accounts.createUser({email: obj.appadminemail, name: name, surname: surname, role: 'admin'});
      // assign them to app
      Partitioner.setUserGroup(newId, groupId);

      // send enrollment email
      Accounts.sendEnrollmentEmail(newId);
      
      // create client params
      let param = {
        APP_NAME: obj.appname,
        APP_EMAIL: obj.appadminemail,
        ADMIN_EMAIL: obj.appadminemail,
        ADMIN_ID: newId,
        ADMIN_SUMMARIES: true,
        SITE_URL: '',
        PRIMARY_LANG: Meteor.settings.public.DEFAULT_LANG,
        BT_MERCHANT_ID: "",
        BT_PUBLIC_KEY: "",
        BT_PRIVATE_KEY: "",
        VP_PUBLIC_KEY: "",
        VP_MERCHANT_ID: "",
        VP_API_KEY: "",
        VP_SOURCE: "",
        providersPerPage: 12,
        daysCanCancel: 2,
        enterInterval: 5,
        bookingAllowedHours: 4,
        bookingCharge: 0,
        CLICKATELL_FROM: groupId,
        workhours_from: "09:00",
        workhours_to: "17:00",
        workhours_tz: "Europe/London",
        bearerToken: Random.secret(),
        subscriptionId: 'premium',
        subscriptionStatus: 'active',
        plan: 'premium'
      };
      let paramResult = null;
      Partitioner.bindGroup(groupId, function(){
        paramResult = Params.insert(param);
        console.log("New client's params were successfully added");
      })
      let retObj = {
        appId: paramResult,
        userId: newId
      }
      return retObj;
    } 
    throw new Meteor.Error('not-authorized','Not authorized to add new app');    
  }
});