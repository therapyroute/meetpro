import moment from 'moment-timezone';
import ssrService from './ssr.js';

// common server functions (instead of methods)
appCommon = {
  // get param from logged-in user's params document
  getParam (paramName, paramsId = null, uId = null) {
    let params = null;

    let idFilter = paramsId ? {_id : paramsId} : {};
    if (uId && Meteor.settings.public.APP_MULTI_CLIENT){
      idFilter._groupId = Partitioner.getUserGroup(uId);
    }
    params = Params.findOne(idFilter);
    // if (Meteor.settings.public.APP_MODE == 'dev'){
    //   console.log('uId: '+uId);
    //   console.log('getParam: '+ paramName + ' - ' + params._id);
    // }
    return params ? params[paramName] : null;
  },
  // insert message from Contact Form to Collection
  cfInsert (doc) {
    check(doc, {
      name: String,
      email: String,
      message: String
    });
    return Contact.insert(doc);
  },
 sendMessage (msg) {
    check(msg, {
        to: String,
        from: String,
        subject: String,
        message: String,
        icon: String
      });
    var message = {
      owner: msg.to,
      from: msg.from,
      title: msg.subject,
      message: msg.message,
      icon: msg.icon,
      read: false,
      class: 'default'
    }
    // notify for new messages with email (if user allows emails & PM emails)
    var receiver = Meteor.users.findOne({_id: msg.to});
    // if messages are disabled, send email, else get user's preference
    var acceptsEmails = Meteor.settings.public.messagesEnabled !== 'true' ? true : receiver.profile.user.email_notifications;
    if (receiver && acceptsEmails && _.contains(receiver.profile.user.allowed_notifications, 'email')){
      // defer to speedup method execution
      Meteor.defer(function() {
        let receiver = Meteor.users.direct.findOne({_id: msg.to});
        let receiverLang = receiver && receiver.profile.user.lang ? receiver.profile.user.lang : 'en';
        if (!receiver) return;
        let theParams = null;
        if (Meteor.settings.public.APP_MULTI_CLIENT){
          let theGroup = Partitioner.getUserGroup(receiver._id);
          theParams = Params.direct.findOne({_groupId: theGroup});
        } else {
          theParams = Params.findOne({});
        }

        emObj = {
          lang: receiverLang,
          to: receiver.emails[0].address,
          subject: message.title,
          text: message.message,
          paramsId: theParams._id
        }
        appCommon.appSendMail(emObj);
      });
    }
    // check if messages are enabled before sending PM
    if (Meteor.settings.public.messagesEnabled === 'true'){
      let txt = 'New message from ' + msg.from + ' to ' + msg.to;
      console.log(txt);
      appCommon.appLog({content: txt});
      return Messages.insert(message);
    }
    return;
 },
 // Generic email send function
 // based on https://themeteorchef.com/snippets/using-the-email-package/
 appSendMail (emObj) {
     check (emObj, {
       lang: String,
       to: String,
       subject: String,
       text: String,
      //  paramsId: String
     });
     //  console.log(emObj);
     // get generic template from assets
     //  const theTemplate = Meteor.settings.public.APP_MODE == 'dev' ? 
     //     'email/simple.html' : 'email/generic-'+emObj.lang+'.html';
     const theTemplate = 'email/generic-'+emObj.lang+'.html';
     const SSR = new ssrService();
     SSR.compileTemplate( 'emailTemplate', Assets.getText( theTemplate ) );
     let sTZ = Meteor.settings.private.SRV_TZ;
    //  let theLogo = appCommon.getParam('APP_LOGO', emObj.paramsId) ? 
    //     appCommon.getParam('APP_LOGO', emObj.paramsId) :
    //     Meteor.absoluteUrl()+'images/logo.png';
    let theLogo = Meteor.absoluteUrl()+'images/logo.png';
     var emailData = {
       subject: emObj.subject,
       content: emObj.text,
       sendDateTime: moment().tz(sTZ).format("DD-MM-YYYY, HH:mm") + ' ' + moment().tz(sTZ).zoneAbbr(),
       to: emObj.to,
       appLogo: theLogo,
       //  appName: appCommon.getParam('APP_NAME', emObj.paramsId),
       //  appEmail: appCommon.getParam('APP_EMAIL', emObj.paramsId),
       //  siteUrl: appCommon.getParam('SITE_URL', emObj.paramsId),
       appName: Meteor.settings.public.APP_NAME,
       appEmail: 'info@meetpro.live',
       siteUrl: Meteor.settings.public.APP_URL,
       fbUrl: '',
       liUrl: '',
       gpUrl: ''
     };
     // if dev mode, log to console for debugging...
    //  if (Meteor.settings.public.APP_MODE === 'dev'){
    //    console.log(SSR.render('emailTemplate', emailData));
    //    return true;
    //  }
     // send after replacing
     try {
      Email.send({
         to: emObj.to,
         //from: appCommon.getParam('APP_EMAIL', emObj.paramsId),
         from: 'no-reply@meetpro.live',
         subject: emObj.subject,
         html: SSR.render( 'emailTemplate', emailData )
       });
       let txt = 'Sent email to ' + emObj.to;
       txt += ' Subject: ' + emObj.subject;
       console.log(txt);
       appCommon.appLog({content: txt});
     }
     catch (err){
       appCommon.appLog({level: 'error', content: 'Error sending email to: ' + emObj.to + ': ' + err.response});
       console.log(err);
       return false;
     }
 },
 // Contact Click-a-tell to confirm SMS delivery status
 // gets msgId and returns 'success' or 'failure'
  checkSMSstatus(msgId) {
    var getHeaders = {
      'X-Version': 1,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + Meteor.settings.private.CLICKATELL_AUTH_TOKEN
    };
    var getUrl = "https://api.clickatell.com/rest/message/" + msgId;
    var responseData = HTTP.call( 'GET', getUrl, {headers: getHeaders});
    var smsData = EJSON.parse(responseData.content);
    // console.log(smsData);
    // check message status (https://www.clickatell.com/developers/api-docs/message-status-codes/)
    if (_.contains(['002','004','003'], smsData.data.messageStatus) ) {
      let txt = 'Successfully delivered SMS ' + msgId + '. Status: ' + smsData.data.messageStatus;
      console.log(txt);
      appCommon.appLog({content: txt});
      return 'success';
    }
    else {
      let txt = 'Error delivering SMS ' + msgId + '. Status: ' + smsData.data.messageStatus;
      console.log(txt);
      appCommon.appLog({level: 'error', content: txt});
      return 'failed';
    }
  },
  // encode SMS to be properly sent via Click-a-tell
  clickatellEncode (msg) {
    var result = "";
    for(var i = 0; i < msg.length; i++){
        result += ("000" + msg[i].charCodeAt(0).toString(16)).substr(-4);
    }
    return result.toUpperCase();
  },
 // Click-a-tell REST API: https://www.clickatell.com/developers/api-docs/using-the-rest-api-rest/
 // sendSMS: used by methods to do the actual SMS sending via Click-a-tell SMS
  sendSMS (messageText, cellNumber, lang) {
   // if standard plan, SMS are not sent
   if (Meteor.settings.public.APP_MULTI_CLIENT && appCommon.getParam('plan') == 'standard') {
     return false;
   }

   var postHeaders = {
     'X-Version': 1,
     'Content-Type': 'application/json',
     'Accept': 'application/json',
     'Authorization': 'Bearer ' + Meteor.settings.private.CLICKATELL_AUTH_TOKEN
   };
   var isUnicode = "0";
   if (lang === 'el') {
     isUnicode = "1";
     messageText = this.clickatellEncode(messageText);
   }
   var postData = {
     "text": messageText,
     "to": [cellNumber],
     "unicode": isUnicode,
     "from": appCommon.getParam('CLICKATELL_FROM')
   };
   // call clickatell to send sms...
   var postUrl = "https://api.clickatell.com/rest/message/";
   // use try-catch to avoid exceptions
   try {
     var responseData = HTTP.call( 'POST', postUrl, {headers: postHeaders,  data: postData});
     if (responseData){
       let res = EJSON.parse(responseData.content);
       let txt = 'Sent SMS to ' + cellNumber;
       console.log(txt);
       appCommon.appLog({content: txt});
       try {
         appCommon.checkSMSstatus(res.data.message[0].apiMessageId);
         return EJSON.parse(responseData.content);
       }
       catch (err){
         console.log(err);
         appCommon.appLog({level: 'error', content: 'Error sending SMS to ' + cellNumber});
       }
     }
   }
   catch(err){
     appCommon.appLog({level: 'error', content: 'Error sending SMS to: ' + cellNumber});
     console.log(err);
   }
   return false;
 },
 // server side log @ log collection
 // logObj: uid, level, content
 appLog (logObj) {
   var fname = '';
   if (typeof logObj.uid !== 'undefined' && logObj.uid.length > 0){
    let usr = Meteor.users.findOne({_id: logObj.uid});
    if (usr?.profile?.user?.name && usr?.profile?.user?.surname){
      fname = usr.profile.user.surname + ' ' + usr.profile.user.name;
    } else {
      fname = '';
    }
   }
   else {
     logObj.uid = '';
   }

   let now = new Date();
   var entry = {
     datetime: now,
     uid: logObj.uid,
     fname: fname,
     level: logObj.level,
     content: logObj.content
   }
   if (Meteor.settings.public.APP_MULTI_CLIENT) {
     entry.groupId = Partitioner.group();
   }
   return Logs.insert(entry);
 },
 getDomainFromEmail(email) {
  let emailDomain = null;
  const pos = email.search('@'); // get position of domain
  if (pos > 0) {
    emailDomain = email.slice(pos+1); // use the slice method to get domain name, "+1" mean domain does not include "@"
  }
  return emailDomain;
 },
 // Viva Wallet URL
 vpUrl() {
   return Meteor.settings.public.APP_MODE == 'dev' ?
    'https://demo.vivapayments.com' : 
    'https://vivapayments.com';
 },
 // convert string to greeklish
 // based on https://github.com/vbarzokas/greek-utils
 stringToGreeklish(text) {
    function replaceText(text, characterMap, exactMatch) {
      var characters, regexString, regex;
      exactMatch = exactMatch || false;

      if (typeof text === 'string' && text.length > 0) {
        for (characters of characterMap) {
          regexString = exactMatch ? characters.find : '[' + characters.find + ']';
          regex = new RegExp(regexString, 'g');
          text = text.replace(regex, characters.replace);
        }
      }
      return text;
    };
    var greekTogreeklishMap = [
        {find: 'ΓΧ', replace: 'GX'},
        {find: 'γχ', replace: 'gx'},
        {find: 'ΤΘ', replace: 'T8'},
        {find: 'τθ', replace: 't8'},
        {find: '(θη|Θη)', replace: '8h'},
        {find: 'ΘΗ', replace: '8H'},
        {find: 'αυ', replace: 'au'},
        {find: 'Αυ', replace: 'Au'},
        {find: 'ΑΥ', replace: 'AY'},
        {find: 'ευ', replace: 'eu'},
        {find: 'εύ', replace: 'eu'},
        {find: 'εϋ', replace: 'ey'},
        {find: 'εΰ', replace: 'ey'},
        {find: 'Ευ', replace: 'Eu'},
        {find: 'Εύ', replace: 'Eu'},
        {find: 'Εϋ', replace: 'Ey'},
        {find: 'Εΰ', replace: 'Ey'},
        {find: 'ΕΥ', replace: 'EY'},
        {find: 'ου', replace: 'ou'},
        {find: 'ού', replace: 'ou'},
        {find: 'οϋ', replace: 'oy'},
        {find: 'οΰ', replace: 'oy'},
        {find: 'Ου', replace: 'Ou'},
        {find: 'Ού', replace: 'Ou'},
        {find: 'Οϋ', replace: 'Oy'},
        {find: 'Οΰ', replace: 'Oy'},
        {find: 'ΟΥ', replace: 'OY'},
        {find: 'Α', replace: 'A'},
        {find: 'α', replace: 'a'},
        {find: 'ά', replace: 'a'},
        {find: 'Ά', replace: 'A'},
        {find: 'Β', replace: 'B'},
        {find: 'β', replace: 'b'},
        {find: 'Γ', replace: 'G'},
        {find: 'γ', replace: 'g'},
        {find: 'Δ', replace: 'D'},
        {find: 'δ', replace: 'd'},
        {find: 'Ε', replace: 'E'},
        {find: 'ε', replace: 'e'},
        {find: 'έ', replace: 'e'},
        {find: 'Έ', replace: 'E'},
        {find: 'Ζ', replace: 'Z'},
        {find: 'ζ', replace: 'z'},
        {find: 'Η', replace: 'H'},
        {find: 'η', replace: 'h'},
        {find: 'ή', replace: 'h'},
        {find: 'Ή', replace: 'H'},
        {find: 'Θ', replace: 'TH'},
        {find: 'θ', replace: 'th'},
        {find: 'Ι', replace: 'I'},
        {find: 'Ϊ', replace: 'I'},
        {find: 'ι', replace: 'i'},
        {find: 'ί', replace: 'i'},
        {find: 'ΐ', replace: 'i'},
        {find: 'ϊ', replace: 'i'},
        {find: 'Ί', replace: 'I'},
        {find: 'Κ', replace: 'K'},
        {find: 'κ', replace: 'k'},
        {find: 'Λ', replace: 'L'},
        {find: 'λ', replace: 'l'},
        {find: 'Μ', replace: 'M'},
        {find: 'μ', replace: 'm'},
        {find: 'Ν', replace: 'N'},
        {find: 'ν', replace: 'n'},
        {find: 'Ξ', replace: 'KS'},
        {find: 'ξ', replace: 'ks'},
        {find: 'Ο', replace: 'O'},
        {find: 'ο', replace: 'o'},
        {find: 'Ό', replace: 'O'},
        {find: 'ό', replace: 'o'},
        {find: 'Π', replace: 'p'},
        {find: 'π', replace: 'p'},
        {find: 'Ρ', replace: 'R'},
        {find: 'ρ', replace: 'r'},
        {find: 'Σ', replace: 'S'},
        {find: 'σ', replace: 's'},
        {find: 'Τ', replace: 'T'},
        {find: 'τ', replace: 't'},
        {find: 'Υ', replace: 'Y'},
        {find: 'Ύ', replace: 'Y'},
        {find: 'Ϋ', replace: 'Y'},
        {find: 'ΰ', replace: 'y'},
        {find: 'ύ', replace: 'y'},
        {find: 'ϋ', replace: 'y'},
        {find: 'υ', replace: 'y'},
        {find: 'Φ', replace: 'F'},
        {find: 'φ', replace: 'f'},
        {find: 'Χ', replace: 'X'},
        {find: 'χ', replace: 'x'},
        {find: 'Ψ', replace: 'Ps'},
        {find: 'ψ', replace: 'ps'},
        {find: 'Ω', replace: 'w'},
        {find: 'ω', replace: 'w'},
        {find: 'Ώ', replace: 'w'},
        {find: 'ώ', replace: 'w'},
        {find: 'ς', replace: 's'}
    ];
		return replaceText(text, greekTogreeklishMap, true);
  },
  // Bearer token authentication helper function
  // checks in params collection by token & returns params id & group id, if found
  checkBearerToken (token) {
    let params = Params.direct.findOne({bearerToken: token});
    return params ? { id: params._id, group: params._groupId } : false;
  }, 
  isSuperAdmin(){
    let theUser = Meteor.user();
    return Meteor.settings.public.APP_MULTI_CLIENT && Roles.userIsInRole(theUser,['admin']) && theUser.admin;
  },
};
