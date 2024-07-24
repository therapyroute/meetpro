import moment from 'moment-timezone';
import ssrService from './ssr.js';
import { Random } from 'meteor/random';

langGlobal = '';
var postSignUp = function(userId, info){
  //console.log(userId);
  //console.log(info);
  const businessName = info.profile.business;
  var userName = info.profile.name;
  var userSurname = info.profile.surname;
  // create user slug. If taken, add a random number at its end
  let slug = appCommon.stringToGreeklish(userName[0]+ userSurname).toLowerCase();
  let exists = Meteor.users.findOne({'profile.user.slug': slug});
  if (exists)
    slug += _.random(1,1000);
  
  var userLang = info.profile.lang;
  langGlobal = info.profile.lang;
  // var role = info.profile.provider ? 'unconfirmed' : 'user';
  const role = ['admin'];
  Meteor.users.update({_id: userId}, {$set:{
    'profile.user.name': userName,
    'profile.user.surname': userSurname,
    'profile.user.lang': userLang,
    'profile.user.slug': slug,
    'profile.user.allowed_notifications': ["email"],
    'roles': role
  }});
  let paramResult = null;
  if (Meteor.settings.public.APP_MULTI_CLIENT){
    if (info.new_app_admin){
      // create new app
      let param = {
        APP_NAME: businessName,
        APP_EMAIL: info.email,
        ADMIN_EMAIL: info.email,
        ADMIN_ID: userId,
        ADMIN_SUMMARIES: true,
        SITE_URL: '',
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
        CLICKATELL_FROM: '',
        workhours_from: "09:00",
        workhours_to: "17:00",
        workhours_tz: "Europe/London",
        bearerToken: Random.secret(),
        subscriptionId: 9999,
        subscriptionStatus: 'active',
        plan: 'standard'
      };
      paramResult = Partitioner.bindGroup(info.profile.business, function(){
        return Params.insert(param);
      })
      if (paramResult){
        console.log("New client's params were added: "+paramResult);
      }
      Partitioner.setUserGroup(userId, businessName)
    }
    
  }
  // send verification email
  try {
    Accounts.sendVerificationEmail(userId, info.email);
  }
  catch (err){
    let errStr = 'Could not send verification email: ' + err;
    console.log(errStr);
    appCommon.appLog({uid: userId, content: errStr});
  }
  // send email to admin
  Meteor.defer(function() {
    let emText = `A new app was just registered at MeetPro.<br><br>Business name: ${businessName}<br>
    Admin email: ${info.email}<br>Admin ID: ${userId}<br>App ID: ${paramResult}`;
    Email.send({
      to: appCommon.getParam('ADMIN_EMAIL', null, this.userId),
      from: 'no-reply@meetpro.live',
      subject: 'New app registration',
      html: emText
    });
  });
}

AccountsTemplates.configure({
  postSignUpHook: postSignUp
});

// When a user is created, set his role as 'user'
// Only admin can raise them to 'provider' or 'admin'
Accounts.onCreateUser(function (options,user){
  if (Roles.userIsInRole(Meteor.userId(), 'admin')){
    console.log('admin is adding a user');
    user.roles = [options.role];
  } else {
    user.roles = ['user'];
  }
  // if services found, copy data to user table
  if (_.isEmpty(user.services) || user.services.password) {
    user.profile = {};
    user.profile.user = {};
    user.profile.user.name = options.name;
    user.profile.user.surname = options.surname;
    // create unique slug
    let slug = options.name[0] + options.surname;
    let exists = Meteor.users.findOne({'profile.user.slug': slug});
    if (exists)
      slug += _.random(1,1000);
    user.profile.user.slug = slug;
  } else {
    if (user.services.facebook){
      var fb = user.services.facebook;
      user.profile = {};
      user.profile.user = {};
      user.profile.user.name = fb.first_name;
      user.profile.user.surname = fb.last_name;
      user.profile.user.gender = fb.gender;
      // create unique slug
      let slug = fb.first_name[0] + fb.last_name;
      let exists = Meteor.users.findOne({'profile.user.slug': slug});
      if (exists)
        slug += _.random(1,1000);
      user.profile.user.slug = slug;
      var email = { address: fb.email, verified: true};
      user.emails = [];
      user.emails.push(email);
      // insert profile image into collection
      var imgUrl = 'http://graph.facebook.com/'+ fb.id + '/picture/?type=large';
      user.profile.user.photo = imgUrl;
      }
    if (user.services.google){
      var g = user.services.google;
      user.profile = {};
      user.profile.user = {};
      user.profile.user.name = g.given_name;
      user.profile.user.surname = g.family_name;
      // create unique slug
      let slug = g.given_name[0]+ g.family_name;
      let exists = Meteor.users.findOne({'profile.user.slug': slug});
      if (exists)
        slug += _.random(1,1000);
      user.profile.user.slug = slug;
      user.profile.user.gender = g.gender === 'other' ? 'male' : g.gender;
      var email = { address: g.email, verified: true};
      user.emails = [];
      user.emails.push(email);
      user.profile.user.photo = g.picture;
      if (Meteor.settings.public.APP_MULTI_CLIENT){
        // if user has registered with Google, create app by calling postSignUp
        user.roles = ['admin'];
        const info = {
          profile: user.profile.user,
          new_app_admin: true,
          email: g.email
        }
        info.profile.business = slug;
        postSignUp(user._id, info);
      }
    }
    if (user.services.linkedin){
      var li = user.services.linkedin;
      user.profile = {};
      user.profile.user = {};
      user.profile.user.name = li.firstName;
      user.profile.user.surname = li.lastName;
      // create unique slug
      let slug = li.firstName[0]+ li.lastName;
      let exists = Meteor.users.findOne({'profile.user.slug': slug});
      if (exists)
        slug += _.random(1,1000);
      user.profile.user.slug = slug;
      user.profile.user.gender = 'male';
      var email = { address: li.emailAddress, verified: true};
      user.emails = [];
      user.emails.push(email);
      user.profile.user.photo = li.pictureUrl;
    }
  } 
  //console.log(user);
  return user;
});

// email template configuration
Accounts.emailTemplates.siteName = Meteor.settings.public.APP_NAME;
Accounts.emailTemplates.from = Meteor.settings.private.ADMIN_EMAIL;

Accounts.emailTemplates.verifyEmail = {
  subject() {
    return TAPi18n.__('verifyEmailHeader', {}, langGlobal);
  },
  html( user, url ) {
    let usrLang = user.profile.user.lang ? user.profile.user.lang : 'en';
    const SSR = new ssrService();
    SSR.compileTemplate( 'emailTemplate', Assets.getText( 'email/generic-'+usrLang+'.html' ) );
    let sTZ = Meteor.settings.private.SRV_TZ;
    let emailData = {
      subject: TAPi18n.__('verifyEmailHeader', {}, langGlobal),
      content: TAPi18n.__('verifyEmailText', {}, usrLang) + `<a href="` + url.replace( '#/', '' ) + `">` + TAPi18n.__('verifyEmailBtn', {}, usrLang) +  '</a>',
      sendDateTime: moment().tz(sTZ).format("DD-MM-YYYY, HH:mm") + ' ' + moment().tz(sTZ).zoneAbbr(),
      to: user.emails[0].address
    };
    return SSR.render( 'emailTemplate', emailData )
  }
};

Accounts.emailTemplates.resetPassword = {
  subject() {
    return TAPi18n.__('resetPassHeader', {}, langGlobal);
  },
  html( user, url ) {
    let usrLang = user.profile.user.lang ? user.profile.user.lang : 'en';
    const SSR = new ssrService();
    SSR.compileTemplate( 'emailTemplate', Assets.getText( 'email/generic-'+usrLang+'.html' ) );
    let sTZ = Meteor.settings.private.SRV_TZ;
    let emailData = {
      subject: TAPi18n.__('resetPassHeader', {}, langGlobal),
      content: TAPi18n.__('resetPassText', {}, usrLang) + `<a href="` + url.replace( '#/', '' ) + `">` + TAPi18n.__('resetPassBtn', {}, usrLang) +  '</a>',
      sendDateTime: moment().tz(sTZ).format("DD-MM-YYYY, HH:mm") + ' ' + moment().tz(sTZ).zoneAbbr(),
      to: user.emails[0].address
    };
    return SSR.render( 'emailTemplate', emailData )
  }
};

Accounts.emailTemplates.enrollAccount = {
  subject() {
    return TAPi18n.__('enrollSubject', {}, langGlobal);
  },
  html( user, url ) {
    let usrLang = user.profile.user.lang ? user.profile.user.lang : 'en';
    const SSR = new ssrService();
    SSR.compileTemplate( 'emailTemplate', Assets.getText( 'email/generic-'+usrLang+'.html' ) );
    let sTZ = Meteor.settings.private.SRV_TZ;
    let emailData = {
      subject: TAPi18n.__('enrollSubject', {}, langGlobal),
      content: TAPi18n.__('enrollText', {}, usrLang) + `<br><a href="` + url + `">` + TAPi18n.__('enrollBtn', {}, usrLang) +  '</a>',
      sendDateTime: moment().tz(sTZ).format("DD-MM-YYYY, HH:mm") + ' ' + moment().tz(sTZ).zoneAbbr(),
      to: user.emails[0].address
    };
    return SSR.render( 'emailTemplate', emailData )
  }
};
