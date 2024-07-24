import jstz from 'jstz';
import moment from 'moment-timezone';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import sweetAlert from 'sweetalert';

// Flow router template level subscriptions
// https://kadira.io/academy/meteor-routing-guide/content/subscriptions-and-data-management/with-blaze
Template.tmplProfileEdit.onCreated(function() {
  DocHead.setTitle(appParams.APP_NAME + ': '+TAPi18n.__('my_profile'));
  
  // if admin has selected user, set them as current user
  currentUser = new ReactiveVar(null);
  isProvider = new ReactiveVar(null);
  if (!Session.get("timezone")){
    Session.set('timezone',moment.tz.guess());
  }
  if (FlowRouter.getParam('userId') && appClient.isAdmin()) {
    Meteor.call('adminGetUser', FlowRouter.getParam('userId'), function(error, success) { 
      if (error) { 
        console.log('error', error); 
      } 
      if (success) { 
        currentUser.set(success);
        isProvider.set(Roles.userIsInRole(success,['provider']));
      } 
    });
  } else {
    currentUser.set(Meteor.user());
    isProvider.set(Roles.userIsInRole(Meteor.user(),['provider']));
    // Billing related code - left for future reference
    // check if provider's price, schedule & viva wallet details are set
    // if (Roles.userIsInRole(Meteor.user(),['provider'])){
    //   appClient.checkProviderEssentials();
    // }
  }  
  
  providerRating = new ReactiveVar(null);
  // subscribe to all specialities
  this.subscribe('specialities');
  // subscribe to expertise items (TODO: filter by speciality)
  this.subscribe('providerExpertise');
  // get provider's ratings average
  Meteor.call('getRatingAverage', Meteor.userId(), function(error,result){
    if (result){
      providerRating.set(result);
    }
  });
  // check plan
  // isPro = new ReactiveVar(false);
  // Meteor.call('isProPlan', function(error, success) { 
  //   // if (error) { 
  //   //   console.log('error', error); 
  //   // } 
  //   if (success) { 
  //      isPro.set(true);
  //   } 
  // });
});

Template.tmplProfileEdit.onRendered(function(){
  if (Roles.userIsInRole(currentUser.get(),['unconfirmed'])){
    var usr1 = currentUser.get();
    var usr = usr1.profile;
    if (usr.provider && usr.provider.specialities){
      // do nothing
    }
    else {
      sAlert.info(TAPi18n.__("un_msg2"),{html: true, timeout: 10000});
    }
  }
  $('[data-toggle="tooltip"]').tooltip()
});

Template.tmplProfileEdit.helpers({
  theBreadcrumb: function(){
    // check if admin
    if (!appClient.isAdmin()) {
      return `<li class="active">${TAPi18n.__('sb_profile')}</li>`;
    } 
    else {
      let fName = currentUser.get() ? currentUser.get().profile.user.name + ' ' + currentUser.get().profile.user.surname : '';
      return `<li><a href="/admin/users">${TAPi18n.__('sb_users')}</a></li>
      <li class="active">${fName}</li>`;
    }
  },
  checkRole: function (roleStr) {
    roles = roleStr.split(',');
    // if admin & provider
    if (appClient.isAdmin() && Roles.userIsInRole(Meteor.user(),'provider') && currentUser.get() && currentUser.get()._id === Meteor.userId()){
      return roles.includes('provider') ? true : false;
    }
    // if admin 
    if (appClient.isAdmin() && Roles.userIsInRole(currentUser.get(),roles)){
      return true;
    }
    if (Roles.userIsInRole(currentUser.get(),roles)){
      return true;
    }
    return false;
  },
  currentUser: function(){
    return currentUser.get();
  },
  canShowAppointments: function() {
    return (FlowRouter.getRouteName() === 'adminUser');
  },
  // specialities select2 helpers
  specOpts: function() {
      return Specialities.find({},{sort: {name:1}}).map(function (obj) {
        return {label: obj.name, value: obj._id};
      });
  },
  // expertise select2 helper
  expOpts: function() {
    return Expertise.find({},{sort: {name:1}}).map(function (obj) {
      return {label: obj.name, value: obj._id};
    });
  },
  s2Opts: function () {
    return {
      language: TAPi18n.getLanguage(),
      theme: 'bootstrap'
    };
  },
  genderOpts: function(){
    return [
      {label: TAPi18n.__('male'), value: 'male'},
      {label: TAPi18n.__('female'), value: 'female'},
      {label: TAPi18n.__('other'), value: 'other'}
    ];
  },
  roleOpts: function(){
    let curRole = Roles.getRolesForUser(currentUser.get()).toString();
    return [
      {label: TAPi18n.__('ap_user'), value: 'user', isSelected: 'user' === curRole ? 'selected' : ''},
      {label: TAPi18n.__('ap_unconfirmed'), value: 'unconfirmed', isSelected: 'unconfirmed' === curRole ? 'selected' : ''},
      {label: TAPi18n.__('ap_provider'), value: 'provider', isSelected: 'provider' === curRole ? 'selected' : ''},
      {label: TAPi18n.__('ap_admin'), value: 'admin', isSelected: 'admin' === curRole ? 'selected' : ''},
      {label: TAPi18n.__('ap_admin_expert'), value: 'admin,provider', isSelected: 'admin,provider' === curRole ? 'selected' : ''},
      {label: TAPi18n.__('ap_inactive'), value: 'inactive', isSelected: 'inactive' === curRole ? 'selected' : ''}
    ];
  },
  notificationOpts: function(){
    let notificationOptions = [
      {label: 'e-mail', value: 'email'},
      //
    ];
    // if (isPro.get()) {
    //   notificationOptions.push({label: 'SMS', value: 'sms'});
    // }
    return notificationOptions;
  },
  userPhoto: function() {
    if (FlowRouter.getParam('userId') && appClient.isAdmin()) {
      return currentUser.get() && currentUser.get().profile.user.photo;
    } else {
      return Meteor.user() && Meteor.user().profile.user.photo;
    }
  },
  passlink: function(){
	  return FlowRouter.path('atChangePwd');
  },
  profileLink: function(){
     return currentUser.get() && FlowRouter.path('providerRoute',{providerId: currentUser.get()._id});
  },
  isUnconfirmed: function(){
    return Roles.userIsInRole(currentUser.get(),['unconfirmed']) ? 'checked' : '';
  },
  getEmail: function(){
    return currentUser.get() && currentUser.get().emails[0].verified ?
      currentUser.get().emails[0].address + ' (' + TAPi18n.__('verifiedShort') + ')' :
      currentUser.get().emails[0].address + ' (' + TAPi18n.__('verifiedNotShort') + ')';
  },
  timeZones: function(){
    return _.map(moment.tz.names(), function(t){
      return {label: t, value: t};
    });
  },
  providerRating: function(){
    return providerRating.get() ? providerRating.get() : null;
  },
  ratingsText: function(){
    return providerRating.get() ?
      TAPi18n.__('pr_ratings_text2', { postProcess: 'sprintf', sprintf: [providerRating.get().avg, providerRating.get().num] }) : null;
  },
  appUrl: function(){
    return Meteor.absoluteUrl('book/');
  },
  appUrl2: function(){
    let theSlug = currentUser.get().profile.user.slug;
    return Meteor.absoluteUrl('book/'+theSlug);
  },
  canChangePass: function(){
    return appClient.isAdmin() && !_.isEqual(currentUser.get(), Meteor.user()) ? false : true;
  },
  // isProPlan: function() {
  //   return isPro.get();
  // },
  hasCategory1: function() {
    return appParams.profileCategory1Enabled;
  },
  category1: function() {
    return appParams.profileCategory1;
  },
  hasCategory2: function() {
    return appParams.profileCategory2Enabled;
  },
  category2: function() {
    return appParams.profileCategory2;
  },
  group: function() {
    return currentUser.get().group;
  }
});

// AutoForm hooks
AutoForm.addHooks("updateProfileForm", {
  docToForm: function(doc) {
    if (isProvider.get()){
      if (doc.profile.provider && _.isArray(doc.profile.provider.expertise)) {
        doc.profile.provider.expertise = doc.profile.provider.expertise.join(", ");
      }
    }
    return doc;
  },
  formToModifier: function(modifier) {
    if (isProvider.get()){
      var expProp = modifier.$set["profile.provider.expertise"] ? modifier.$set["profile.provider.expertise"][0] : undefined;

      if (typeof expProp === "string") {
        modifier.$set["profile.provider.expertise"] = expProp.split(",");
      }
    }
    if (modifier.$set["profile.user.timezone"])
      Session.set('timezone', modifier.$set["profile.user.timezone"]);
    return modifier;
  },
  onError: function (type,error) {
    if (currentUser.get()){
      sAlert.error('' + error);
      console.log(error);
    }
  },
  onSuccess: function () {
    this.event.preventDefault();
    sAlert.success(TAPi18n.__("profile_success"));
    // log to analytics
    // analytics.track("User saved profile", {
    //   eventName: "User saved profile",
    //   uId: Meteor.userId()
    // });
  }
})

Template.tmplProfileEdit.events({
  'click #verifyBtn': function (event, tmpl) {
    Meteor.call('verifyUserEmail', currentUser.get()._id, function(error, success) { 
      if (error) { 
        console.log('error', error); 
      } 
      if (success) { 
         let curDoc = currentUser.get();
         curDoc.emails[0].verified = true;
         currentUser.set(curDoc);
      } 
    });
  },
   'click .btnRemove': function(event, temp) {
     event.preventDefault();
     Meteor.call("removeUserImage", function(error, result){
       if(error){
         console.log("error", error);
       }
     });
   },
   'click #btnModal': function(e,t) {
     e.preventDefault();
     Modal.show('cropModal');
   },
	'click #checkUrl': function(event,template) {
		event.preventDefault();
		// get value from input
		var userSlug = $('input[name="profile.user.slug"]').val();
		// check if latin characters & dashes
		var onlyLetters = /^[a-z0-9-]+$/.test(userSlug.toLowerCase());
		if (!onlyLetters){
			sAlert.error(TAPi18n.__('urlval'));
			return;
		}

		Meteor.call('checkSlug',userSlug, currentUser.get(), function(error, result){
      if(result){
        sAlert.success(TAPi18n.__('urlsaved'));
        $('#checkUrl').prop("disabled", true);
      }
      if(error){
        sAlert.error(TAPi18n.__('urlerror'));
		    console.log("error", error);
      }
		});
  },
  'click #copyUrl': function(event,template) {
		event.preventDefault();
		// get value from input
		var userSlug = $('input[name="profile.user.slug"]').val();
    let copyText = Meteor.absoluteUrl('book/'+userSlug);
    // create temp element to copy
    let textarea = document.createElement("textarea");
    textarea.textContent = copyText;
    textarea.style.position = "fixed"; // Prevent scrolling to bottom of page in MS Edge.
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy"); 
    document.body.removeChild(textarea);
    $('#copyUrl').html('URL copied!');
  },
  'click #copyUrl2': function(event,template) {
		event.preventDefault();
		// get value from input
		var userSlug = currentUser.get().profile.user.slug;
    let copyText = Meteor.absoluteUrl('expert/'+userSlug);
    // create temp element to copy
    let textarea = document.createElement("textarea");
    textarea.textContent = copyText;
    textarea.style.position = "fixed"; // Prevent scrolling to bottom of page in MS Edge.
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy"); 
    document.body.removeChild(textarea);
    $('#copyUrl2').html('URL copied!');
  },
  "click #deleteAccount": function(event, template){
    var theId = currentUser.get()._id;
    sweetAlert({
      title: TAPi18n.__("delete_account"),
      text: TAPi18n.__("delete_account_confirm"),
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: TAPi18n.__("ap_md_confirm"),
      cancelButtonText: TAPi18n.__("ap_nocancel"),
      closeOnConfirm: false,
      closeOnCancel: true
      },
      function(isConfirm){
        if (isConfirm) {
          Meteor.call("deleteAccount", theId, function(error, result){
            if(error){
              console.log("error", error);
              sweetAlert(TAPi18n.__("fl_error"), TAPi18n.__("fl_error_txt"), "error");
            }
            else {
              // inform user that the admins were notified
              if (result === 'notified'){
                sweetAlert(TAPi18n.__("msg_success"), TAPi18n.__("delete_account_ok"), "success");
              }
              // confirm deletion to admin
              else if (result === 'done'){
                sweetAlert(TAPi18n.__("msg_success"), TAPi18n.__("delete_account_done"), "success");
              }
            }
          });
            
          //log to analytics
          // analytics.track("User deletion", {
          //   eventName: "User account deletion was requested",
          //   uId: theId
          // });
        }
      }
    );
  },
  'change #role': function (e,t) {
    let getNewRole = $(e.target).val();
    let dataObject = {
      id: currentUser.get()._id,
      newRole: getNewRole
    };
    Meteor.call('updateRole', dataObject, function(error, success) { 
      if (error) { 
        console.log(error);
        sweetAlert(TAPi18n.__("fl_error"), TAPi18n.__("role_fail"), "error");
      } 
      if (success) { 
        sAlert.success(TAPi18n.__('role_success'));
        // change currentUser reactive var
        let temp = currentUser.get();
        temp.roles = [getNewRole];
        currentUser.set(temp);
      } 
    });
  },
  'keypress [name="profile.user.slug"]': function(e,t) {
    $('#checkUrl').prop("disabled", false);
  },
  // when user changes 'I am an expert' checkbox, switch roles between 'user' & 'unconfirmed'
  "change #iamexpert": function(e,t) {
    var targetRole = $(e.target).is(':checked') ? 'unconfirmed' : 'user';
    Meteor.call("switchRoles", currentUser.get()._id, targetRole, function(error, result){
      if(error){
        console.log("error", error);
      }
      if(result){
         //console.log('changed 2: '+targetRole);
      }
    });
  }
});
