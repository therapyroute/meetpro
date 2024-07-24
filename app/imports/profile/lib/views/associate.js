import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

Template.tmplAssociate.onCreated(function () {
  var self = this;
  questionFill = new ReactiveVar(null);
  selectedAppt = new ReactiveVar(null);
  curAssocSlug = new ReactiveVar(FlowRouter.getParam('assocId'));
  curAssocId = new ReactiveVar(null);
  provExp = new ReactiveVar(null);
  replyingTo = new ReactiveVar(curAssocId.get());
  self.subscribe('specialities');
  // call method to check if param is id or slug
  Meteor.call('checkProviderParam', curAssocSlug.get(), function(error, result){
     if (error){
         console.log('error',error);
         return;
     }
     // if result (id) subscribe...
     curAssocId.set(result);
     self.subscribe('associateViewModel', result, {
       onReady: function(){
         let user = Meteor.users.findOne({_id: result});
         if (user){ DocHead.setTitle(appParams.APP_NAME + ': '+ user.fullName()); }
       }
     });
     // get expertise
    //  Meteor.call('getExpertiseNames', result, function(error, success) { 
    //   if (error) { 
    //     console.log('error', error); 
    //   } 
    //   if (success) { 
    //      provExp.set(success);
    //   } 
    //  });
  });
});

Template.tmplAssociate.helpers({
  assocTxt: function(){
    return Roles.userIsInRole(Meteor.user(),['provider']) ? TAPi18n.__('sb_users') : TAPi18n.__('sb_experts');
  },
  assocFullname: function() {
    let usr = Meteor.users.findOne({_id: curAssocId.get()});
    return usr && usr.fullName();
  },
  assocUser: function () {
    return Meteor.users.find({_id: curAssocId.get()});
  },
  isProvider: function() {
    return Roles.userIsInRole(Meteor.user(),['provider']);
  },
  imageUrl: function(profile) {
    return profile ? profile :
      Roles.userIsInRole(Meteor.user(),['provider']) ?
        '/images/temp-images/user-avatar.png' :
        '/images/temp-images/expert-avatar.jpg';
  },
  filesUrl: function () {
    return FlowRouter.path("userFiles");
  },
  apptsUrl: function () {
    var queryParams = Roles.userIsInRole(Meteor.user(),['provider']) ?
      {'user': curAssocId.get()} :
      {'provider': curAssocId.get()};
    return FlowRouter.path("commonAppointments", null, queryParams);
  },
  specialities: function() {
    let usr = Meteor.users.findOne({_id: curAssocId.get()});
    return usr && usr.specs();
  },
  provExpertise: function() {
    return provExp.get();
  },
  privateNotes: function() {
    var ret = Private.findOne({owner: Meteor.userId(), associate: curAssocId.get(), dataType: 'note'});
    return ret ? ret.content : false;
  },
  dataSplit: function(data) {
    return data ? data.join() : null;
  },
  publicProfile: function() {
    return FlowRouter.path("providerRoute", {providerId: curAssocSlug.get()});
  },
  bookingLink: function() {
    return FlowRouter.path("bookingRoute", {providerId: curAssocSlug.get()});
  },
  userGender: function(gender){
    let obj = {
      male: TAPi18n.__('male'),
      female: TAPi18n.__('female'),
      other: TAPi18n.__('other')
    }
    return obj[gender];
  },
  row2cols: function() {
    return Meteor.settings.public.filesEnabled=='true' ?
      'col-md-6 col-sm-6' :
      'col-md-12 col-sm-12';
  }
});

Template.tmplAssociate.events({
  "click .questionBtn": function(event, template){
    var isProvider = Roles.userIsInRole(Meteor.user(),['provider']);
    if (isProvider){
      var qInfo = {
        userId: curAssocId.get(),
        providerId: Meteor.userId()
      };
    }
    else {
      var qInfo = {
        providerId: curAssocId.get(),
        userId: Meteor.userId()
      };
    }
    questionFill.set(qInfo);
    Modal.show('tmplQuestionnaireAnswer');
  },
  "click .messageBtn": function(event, template){
    Modal.show('tmplComposeDialog');
  },
  "submit .private-notes": function(event, template){
    event.preventDefault();
    var privateNote = event.target.textarea.value;
    // if no value is entered, return
    if (privateNote === '')
      return;
    var note = {
      associate: curAssocId.get(),
      dataType: 'note',
      content: privateNote
    };
    Meteor.call("upsertPrivate", note, function(error, result){
      if(error){
        console.log("error", error);
      }
      if(result){
        sAlert.success(TAPi18n.__('chat_notes'));
      }
    });
  }
})

Template.tmplAssocAppointments.helpers({
  rowClass: function() {
    switch (this.status) {
      case 'cancelled':
        return 'danger';
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'success';
      case 'completed':
        return 'info';
      default:
        return '';
    }
  },
  assocBookings: function () {
    var isProvider = Roles.userIsInRole(Meteor.user(),['provider']);
    var assocId = curAssocId.get();
    if (isProvider)
      return Bookings.find({userId: assocId, status: {$nin: ['aborted','pending']}},{sort: {start:-1}, limit:3});
    else
      return Bookings.find({providerId: assocId, status: {$nin: ['aborted','pending']}},{sort: {start:-1}, limit:3});
  },
  apptBtn: function() {
    return FlowRouter.path("commonAppointmentsWithId", {}, {assoc: this._id});
  },
  startTime: function() {
    return appClient.dateLong(this.start);
  },
  actionIcon: function() {
    if (this.status === 'completed'){
      if (this.rating) {
        return Roles.userIsInRole(Meteor.user(),['provider']) ?
        '&nbsp;<span title="' + TAPi18n.__('user_has_rated') + '"<i class="fa fa-star-half-o" aria-hidden="true"></i></span>' :
        '&nbsp;<span title="' + TAPi18n.__('you_have_rated') + '"<i class="fa fa-check-circle-o" aria-hidden="true"></i></span>' ;
      }
      else {
        return Roles.userIsInRole(Meteor.user(),['provider']) ? '' :
        '&nbsp;<span title="' + TAPi18n.__('you_need_rate') + '"<i class="fa fa-warning" aria-hidden="true"></i></span>' ;
      }
    }
  }
});

Template.tmplAssocAppointments.events({
  "click .list-item-appointment": function(event, template){
    event.preventDefault();
    selectedAppt.set(this._id);
    Modal.show('apptDialog');
  }
});

Template.tmplAssocFiles.helpers({
  assocFiles: function () {
    var isProvider = Roles.userIsInRole(Meteor.user(),['provider']);
    var fileRec = UserFiles.find().fetch();
    if (!fileRec.length)
      return;
    // filter only shared (with provider) files
    if (isProvider) {
      var sharedFiles = _.where(fileRec[0].uploads, {assignedTo: Meteor.userId()});
    }
    else {
      var sharedFiles = _.where(fileRec[0].uploads, {assignedTo: curAssocId.get()});
    }
    if (sharedFiles.length > 0) {
      // sort (ascending) & return 5 last uploaded
      return _.last(_.sortBy(sharedFiles, 'uploadedOn'),5);
    } else {
      return [];
    }
  },
  uplDate: function(uploadedOn) {
    return appClient.dateShort(uploadedOn);
  }
});
