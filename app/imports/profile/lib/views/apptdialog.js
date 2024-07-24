import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import sweetAlert from 'sweetalert';
import moment from 'moment-timezone';

//////////////////////////////
// appointment dialog code  //
//////////////////////////////
Template.apptDialog.onCreated(function() {
   Modal.allowMultiple = true;
 });
 Template.apptDialog.onRendered(function(){
   this.$('#Counter').textCounter({
     target: '#userComment', // required: string
     count: 400, // optional: if string, specifies attribute of target to use as value
                //           if integer, specifies value. [defaults 140]
     alertAt: 20, // optional: integer [defaults 20]
     warnAt: 10, // optional: integer [defaults 0]
     stopAtLimit: true // optional: defaults to false
   });
   // log to analytics
   /*
   analytics.track("User viewed appointment", {
     eventName: "User viewed appointment",
     uId: Meteor.userId(),
     bId: selectedAppt.get()
   });
   */
 });
 Template.apptDialog.helpers({
   curAppt: function(){
     return Bookings.findOne({_id: selectedAppt.get()});
   },
   isConfirmed: function() {
     return this.status === 'confirmed' ? true : false;
   },
   isCancelled: function() {
     return this.status === 'cancelled' ? true : false;
   },
   cancelledBy: function() {
     if (this.note && this.note.indexOf('user') > -1) {
       return Roles.userIsInRole(Meteor.user(),['user']) ? TAPi18n.__('cancelledyou') : this.userfullName();
     } else {
       return Roles.userIsInRole(Meteor.user(),['user']) ? this.providerfullName() : TAPi18n.__('cancelledyou');
     }
   },
   canCancel: function() {
     // cancellation policy is applied here (daysCanCancel)
     var canCancel = moment(this.start).diff(moment(),'days') > appParams.daysCanCancel;
     return this.status === 'confirmed' && canCancel;
   },
   canHaveF2F: function(){
     let usr = Meteor.users.findOne({_id: this.providerId})
     let allowf2f = usr.profile && usr.profile.provider.allowf2f;
     return Meteor.settings.public.face2face && allowf2f;
   },
   address: function(){
    let theProvider = Meteor.users.findOne({_id: this.providerId}).profile.provider;
    return theProvider.allowf2f && this.apptType === 'f2f' ? 
      theProvider.address : false;
   },
   // if isUser & appointment is completed
   isUserCompleted: function() {
     return Roles.userIsInRole(Meteor.user(),['user']) && this.status === 'completed';
   },
   isProviderCompleted: function(){
     return Roles.userIsInRole(Meteor.user(),['provider']) && this.status === 'completed';
   },
   imageUrl: function () {
     if (Roles.userIsInRole(Meteor.user(),['user','admin'])){
       return this.providerImageUrl() ? this.providerImageUrl() : '/images/temp-images/expert-avatar.jpg';
     }
     else if (Roles.userIsInRole(Meteor.user(),['provider'])){
       return this.userImageUrl() ? this.userImageUrl() : '/images/temp-images/user-avatar.png';
     }
   },
   userImageUrl: function() {
    return this.userImageUrl() ? this.userImageUrl() : '/images/temp-images/user-avatar.png';
   },
   // the link to the associate page
   associateLink: function () {
     if (Roles.userIsInRole(Meteor.user(),['user'])){
       let theUser = Meteor.users.findOne({_id: this.providerId});
       return theUser && theUser.profile ? FlowRouter.path("commonAssociate",{assocId: theUser.profile.user.slug}) : '';
     }
     else if (Roles.userIsInRole(Meteor.user(),['provider'])) {
       let theUser = Meteor.users.findOne({_id: this.userId});
       return theUser && theUser.profile ? FlowRouter.path("commonAssociate",{assocId: theUser.profile.user.slug}) : '';
     }
     // if admin, lead to user page
     else if (Roles.userIsInRole(Meteor.user(),['admin'])) {
       return FlowRouter.path("adminUser",{userId: this.providerId});
     }
   },
   userLink: function () {
    // if admin, lead to user page
    if (Roles.userIsInRole(Meteor.user(),['admin'])) {
      return FlowRouter.path("adminUser",{userId: this.userId});
    }
    let theUser = Meteor.users.findOne({_id: this.userId});
    return theUser && theUser.profile ? FlowRouter.path("commonAssociate",{assocId: theUser.profile.user.slug}) : '';
   },
   // create a google calendar link
   gCalLink: function() {
     let start = moment.utc(this.start).format('YYYYMMDDTHHmmss') + 'Z';
     let end = moment.utc(this.end).format('YYYYMMDDTHHmmss') + 'Z';
     let title = TAPi18n.__('appt_gcal', {appName: appParams.APP_NAME});
     let fName = Roles.userIsInRole(Meteor.user(),['user']) ? this.providerfullName() : this.userfullName();
     let text = TAPi18n.__('appt_with_gcal', {assoc: fName, datetime: moment(this.start).format('LLLL')});
     let domainName = null;
     const pos = appParams.ADMIN_EMAIL ? appParams.ADMIN_EMAIL.search('@') : 0; // get position of domain
     if (pos > 0) {
       domainName = appParams.ADMIN_EMAIL.slice(pos+1);
     }
     return 'http://www.google.com/calendar/event?action=TEMPLATE&dates=' +start+
     '%2F'+ end + '&text=' + title + `&location=${domainName}&details=` + text;
   },
   currency: function() {
     return appParams.currency;
   }
 });
 Template.apptDialog.events({
   "click .closeDialog": function(event, template){
     var status = Bookings.findOne({_id:selectedAppt.get()}).status;
     if (Roles.userIsInRole(Meteor.user(),['user']) && status === 'completed') {
       var rateObj = {
         bookingId: selectedAppt.get(),
         rating: $('#userRating').data('userrating') ? $('#userRating').data('userrating') : $('#userRating').data('rating'),
         comment: $('#userComment').val(),
         lang: TAPi18n.getLanguage()
       };
       if (rateObj.rating){
         Meteor.call("updateRating", rateObj, function(error, result){
           if(error){
             console.log("error", error);
           }
           if(result){
             // log to analytics
            //  analytics.track("User rated provider", {
            //    eventName: "User rated provider",
            //    uId: Meteor.userId(),
            //    bId: rateObj.bookingId
            //  });
           }
         });
       }
     }
     selectedAppt.set(null);
     Modal.hide();
     // modal work in progress: http://experimentsinmeteor.com/modal-dialogs-part-2/index.html
     // & https://github.com/PeppeL-G/bootstrap-3-modal/
   },
   "click .questionBtn": function(event, template){
     var booking = Bookings.findOne({_id: selectedAppt.get()});
     var qInfo = {
       userId: booking.userId,
       providerId: booking.providerId
     };
     selectedAppt.set(null);
     questionFill.set(qInfo);
     Modal.show('tmplQuestionnaireAnswer');
   },
   "click .cancelApptBtn": function(event, template){
     var apptData = {
       apptId: selectedAppt.get(),
       user: Meteor.userId(),
       role: Meteor.user().roles.toString(),
       lang: TAPi18n.getLanguage()
     };
     sweetAlert({
       title: TAPi18n.__("fl_sure"),
       text: TAPi18n.__("ap_cancelmsg"),
       type: "warning",
       showCancelButton: true,
       confirmButtonColor: "#DD6B55",
       confirmButtonText: TAPi18n.__("ap_accept"),
       cancelButtonText: TAPi18n.__("ap_nocancel"),
       closeOnConfirm: false,
       closeOnCancel: true
       },
       function(isConfirm){
         if (isConfirm) {
           Meteor.call("cancelAppointment", apptData, function(error, result){
             if(error){
               console.log("error", error);
                   sweetAlert(TAPi18n.__("fl_error"), TAPi18n.__("fl_error_txt"), "error");
             }
           });
           sweetAlert(TAPi18n.__("ap_cancelled"), TAPi18n.__("ap_cancelled_txt"), "success");
           // log to analytics
          //  analytics.track("User cancelled appointment", {
          //    eventName: "User cancelled appointment",
          //    uId: Meteor.userId(),
          //    bId: apptData.apptId
          //  });
         }
       }
     );
   },
   // when user clicks on associate link @ modal
   "click .associateLink": function(event, template){
     Modal.hide();
   }
 
 });
 