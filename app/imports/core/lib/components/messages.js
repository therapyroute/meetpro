// Notifications (messages) component
// heavily based on the not anymore functioning package yogiben:notifications
// https://github.com/yogiben/meteor-notifications
//
//
// Register global notification (message) helpers
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import moment from 'moment-timezone';

Template.registerHelper('notificationCount', function() {
    return Messages.find({
      read: false,
      owner: Meteor.userId()
    }).count();
});

// Notifications (messages) template helpers and event handlers

var notificationClass, readNotification;

notificationClass = function() {
  if (!this.read) {
    return 'unread-notification';
  } else {
    return '';
  }
};

readNotification = function() {
  FlowRouter.go('/messages/' + this._id);
};

Template.notificationsDropdown.helpers({
  notificationClass: notificationClass,
  dropdownIcon: function() {
    if (this.icon) {
      return this.icon;
    } else {
      return 'bell';
    }
  },
  dropdownIconEmpty: function() {
    if (this.iconEmpty) {
      return this.iconEmpty;
    } else {
      return 'bell-o';
    }
  }
});

Template.notificationsDropdown.events({
  'click .notification': readNotification
});

// Notifications Panel
Template.notificationsPanel.onCreated(function(){
  this.subscribe('dashNotifications');
});

Template.notificationsPanel.helpers({
  notificationClass: notificationClass,
  ago: function() {
    return moment(this.date).fromNow();
  },
  isNew: function() {
    return this.read ?
    '<span title=""<i class="fa fa-envelope-open-o" aria-hidden="true"></i>&nbsp;&nbsp;' : 
    '<span title="' + TAPi18n.__('msg_new') + '"<i class="fa fa-envelope-o" aria-hidden="true"></i>&nbsp;&nbsp;';
  },
  userPhoto: function() {
    let user = Meteor.users.findOne({_id: this.from});
    return user && user.profile.user.photo;
  },
  userFullName: function() {
    let user = Meteor.users.findOne({_id: this.from});
    return user && user.profile.user.name + ' ' + user.profile.user.surname;
  },
  allNotifications: function(options) {
    var limit, order;
    if (options instanceof Spacebars.kw && options.hash) {
      if (options.hash.limit != null) {
        limit = options.hash.limit;
      }
      if (options.hash.unreadFirst != null) {
        order = {
          read: 1,
          date: -1
        };
      }
    } else {
      limit = 0;
      order = {
        date: -1
      };
    }
    return Messages.find({owner: Meteor.userId()}, {
      limit: limit,
      sort: order
    });
  }
});

Template.notificationsPanel.events({
  'click .notification': readNotification
});
