import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import sweetAlert from 'sweetalert';
import moment from 'moment-timezone';

messagesPagination = new Paginator(Messages);

Template.tmplMessages.onCreated(function(){
    DocHead.setTitle(appParams.APP_NAME + ': '+TAPi18n.__('msg_title'));
    selectedMessage = new ReactiveVar(null);
    selectedMessageDOM = new ReactiveVar(null);
    senderId = new ReactiveVar(null);
    receiverId = new ReactiveVar(null);
    replyingTo = new ReactiveVar(null);

    // check if user has specified msgId, mark it as read & display it
    var msgId = FlowRouter.getParam("msgId");
    if (msgId) {
      selectedMessage.set(msgId);
      //senderId will be set later
      receiverId.set(null);
      var msg = {_id: msgId, read: true, icon: 'envelope-open-o'};
      Meteor.call("updateMessage", msg, function(error, result){
        if(error){
          console.log("error", error);
        }
      });
    }

    var self = this;
    this.autorun(function(){
      self.subscribe('getNotifications');
    });
    // add greek translations for Paginator
    TAPi18n.loadTranslations(
      {
        "el": {
            "previous": "<<",
            "next": ">>",
            "page_x_of_y": "Σελ. __currentPage__ από __totalPages__"
        },
        "en": {
            "previous": "<<",
            "next": ">>",
            "page_x_of_y": "Pg. __currentPage__ of __totalPages__"
        },
      },
      "hitchcott:paginator"
    )
});

Template.tmplMessages.onRendered(function(){
  $('#infoTooltip').tooltip();
});

//////////////////////////
// Notifications List
//////////////////////////
Template.notificationsList.helpers({
  getNotifications: function() {
    //return Messages.find({'owner': Meteor.userId()});
    return messagesPagination.find({owner: Meteor.userId()},{itemsPerPage: 5, sort:{read: 1, date: -1}});
  },
  getSentNotifications: function() {
    //return Messages.find({'from': Meteor.userId()});
    return messagesPagination.find({from: Meteor.userId()},{itemsPerPage: 5, sort:{read: 1, date: -1}});

  },
  notificationClass: function() {
    if (!this.read) {
      return 'unread-notification';
    } else if (selectedMessage.get() && selectedMessage.get() === this._id){
      return 'selected-notification';
    } else {
      return '';
    }
  },
  ago: function() {
    return moment(this.date).fromNow();
  }
});

Template.notificationsList.events({
  'click .notification': function(e, t) {
    e.preventDefault();
    if (selectedMessageDOM.get()){
      $(selectedMessageDOM.get()).removeClass('selected-notification');
    }
    $(e.target).addClass('selected-notification');
    selectedMessage.set(this._id);
    selectedMessageDOM.set(e.target);
    senderId.set(this.from);
    receiverId.set(null);
    var msg = {
      _id: this._id,
      read: true,
      icon: 'envelope-open-o'
    };
    Meteor.call("updateMessage", msg, function(error, result){
      if(error){
        console.log("error", error);
      }
      if(result){

      }
    });
  },
  'click .sent-notification': function(e, t) {
    e.preventDefault();
    selectedMessage.set(this._id);
    receiverId.set(this.owner);
    senderId.set(null);
  },
  'click .compose': function() {
    replyingTo.set(null);
    receiverId.set(null);
    Modal.show('tmplComposeDialog');
  }
});

Template.notificationsDetail.onCreated(function(){
  var self = this;
  assocUrl = new ReactiveVar(null);
  this.autorun(function(){
    if (senderId.get())
      self.subscribe('getProfile', senderId.get());
    else
      self.subscribe('getProfile', receiverId.get());

  });
});

// Notifications Detailed view
Template.notificationsDetail.helpers({
  selectedMessageContent: function() {
    return Messages.findOne({_id: selectedMessage.get()});
  },
  isReceived: function() {
    // if system message, do not reply
    if (this.from === 'system')
      return null;
    // if msgId from url
    if (!senderId.get() && !receiverId.get()) {
      senderId.set(this.from);
    }
    else
      return senderId.get();
  },
  associate: function() {
    // check if system message
    if (this.from === 'system')
      return TAPi18n.__('msg_sys');
    if (senderId.get()){
      var assocId = senderId.get();
      var u = Meteor.users.findOne({_id: senderId.get()});
    } else {
      var assocId = receiverId.get();
      var u = Meteor.users.findOne({_id: receiverId.get()});
    }
    if (typeof(u) !== 'undefined'){
      replyingTo.set({id: assocId, fullname: u.fullName()});
      assocUrl.set(FlowRouter.path("commonAssociate",{assocId: u.profile.user.slug}));
      return `<a href="${assocUrl.get()}">${u.fullName()}</a>`;
    }
  },
  assocUrl: function() {
    return assocUrl.get();
  },
  imageUrl: function() {
    let usr = senderId.get() ? Meteor.users.findOne({_id: senderId.get()}) : Meteor.users.findOne({_id: receiverId.get()});
    let photo = usr ? usr.profile.user.photo : null;
    return photo ? photo :
      Roles.userIsInRole(Meteor.user(),['provider']) ?
        '/images/temp-images/user-avatar.png' :
        '/images/temp-images/expert-avatar.jpg';
  }
});

Template.notificationsDetail.events({
  "click .delete": function(event, template){
    var msgId = this._id;
    sweetAlert({
      title: TAPi18n.__("fl_sure"),
      text: TAPi18n.__("msg_norecover"),
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: TAPi18n.__("fl_accept"),
      cancelButtonText: TAPi18n.__("fl_deny"),
      closeOnConfirm: false,
      closeOnCancel: false
      },
      function(isConfirm){
        if (isConfirm) {
          //Messages.remove({_id: msgId});
          Meteor.call("deleteMessage", msgId, function(error, result){
            if(error){
              console.log("error", error);
            }
            if(result){
              sweetAlert(TAPi18n.__("fl_deleted"), TAPi18n.__("msg_deleted"), "success");
            }
          });
        } else {
          sweetAlert(TAPi18n.__("fl_cancelled"), TAPi18n.__("msg_safe"), "error");
        }
      }
    );
  },
  "click .reply": function(event, template) {
    Modal.show('tmplComposeDialog');
  }
});

// Compose dialog template
Template.tmplComposeDialog.onRendered(function(){
  this.$('#Counter').textCounter({
    target: '#messageText', // required: string
    count: 200, // optional: if string, specifies attribute of target to use as value
               //           if integer, specifies value. [defaults 140]
    alertAt: 20, // optional: integer [defaults 20]
    warnAt: 10, // optional: integer [defaults 0]
    stopAtLimit: true // optional: defaults to false
  });
  this.$('#subjCounter').textCounter({
    target: '.messageSubject',
    count: 70,
    alertAt: 20,
    warnAt: 10,
    stopAtLimit: true
  });
  // load select2
  Meteor.setTimeout(function(){
    $(function(){
      $("#recipientSelect2").select2();
    });
  }, 600);
});

Template.tmplComposeDialog.onCreated(function(){
  if (! replyingTo.get()) {
    this.subscribe("allAssocs");
  }
});

Template.tmplComposeDialog.helpers({
  receiver: function(){
    if (replyingTo.get())
      return replyingTo.get().fullname;
  },
  receiverId: function() {
    return replyingTo.get().id;
  },
  getUsers: function(){
    return Meteor.users.find({_id: {$ne: Meteor.userId()}});//, roles: {$in: ['provider']}});
  }
});
Template.tmplComposeDialog.events({
  "click .sendMessage": function(event, template){
    var messageSubject = template.$('.messageSubject').val();
    var messageText = template.$('.messageText').val();
    if (!messageText || !messageSubject) {
      sweetAlert(TAPi18n.__("fl_error"), TAPi18n.__("msg_required"), "error");
      return;
    }
    var receiverId = template.$('.receiverId').val();
    var message = {
      from: Meteor.userId(),
      to: receiverId,
      subject: messageSubject,
      message: messageText,
      icon: 'envelope-o'
    };
    Meteor.call("sendPersonalMessage", message, function(error, result){
      if(error){
        sweetAlert(TAPi18n.__("fl_error"), TAPi18n.__("fl_error_txt"), "error");
        console.log("error", error);
      }
      if(result){
        sweetAlert({
          title: TAPi18n.__("msg_sent1"),
          text: TAPi18n.__("msg_sent1_txt"),
          type: "success"
        });
      }
    });
    replyingTo.set(null);
    Modal.hide();
  }
});
