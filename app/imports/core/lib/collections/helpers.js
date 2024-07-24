// Collection Helpers (dburles:collection-helpers)

// Users helpers
// sample usage: Meteor.users.findOne({roles: {$in: ['provider']}}).specs();
// specs() returns an array of strings



// functions used @ reactive table
// hack @ https://github.com/aslagle/reactive-table/issues/220
Bookings.getUFName = function(booking){
  var user = Meteor.users.findOne({_id: booking.userId});
  //return user && user.profile.user.name.charAt(0) + '. ' + user.profile.user.surname;
  return user ? user.profile.user.name.charAt(0) + '. ' + user.profile.user.surname : TAPi18n.__('unknown');
}
Bookings.getPFName = function(booking){
  var user = Meteor.users.findOne({_id: booking.providerId});
  return user ? user.profile.user.name.charAt(0) + '. ' + user.profile.user.surname : TAPi18n.__('unknown');
}
Bookings.getPSpecs = function(booking){
  var user = Meteor.users.findOne({_id: booking.providerId});
  return user ? user.specs() : TAPi18n.__('no_speciality');
}

// Booking helpers
// userInfo() & providerInfo() return profile object
Bookings.helpers({
    userfullName: function () {
      let user = Meteor.users.findOne({_id: this.userId});
      return user ? user.profile.user.name + ' ' + user.profile.user.surname : TAPi18n.__('unknown');
    },
    userFName: function () {
      let user = Meteor.users.findOne({_id: this.userId});
      return user ? user.profile.user.name.charAt(0) + '. ' + user.profile.user.surname : TAPi18n.__('unknown');
    },
    providerfullName: function () {
      let user = Meteor.users.findOne({_id: this.providerId});
      return user ? user.profile.user.name + ' ' + user.profile.user.surname : TAPi18n.__('unknown');
    },
    providerFName: function () {
      let user = Meteor.users.findOne({_id: this.providerId});
      return user ? user.profile.user.name.charAt(0) + '. ' + user.profile.user.surname : TAPi18n.__('unknown');
    },
    providerSpecs: function () {
      let user = Meteor.users.findOne({_id: this.providerId});
      return user ? user.specs() : TAPi18n.__('no_speciality');
    },
    providerImageUrl: function() {
      let theUser = Meteor.users.findOne({_id: this.providerId});
      return theUser && theUser.profile ? theUser.profile.user.photo : '/images/temp-images/expert-avatar.jpg';
    },
    userImageUrl: function() {
      let theUser = Meteor.users.findOne({_id: this.userId});
      return theUser && theUser.profile ? theUser.profile.user.photo : '/images/temp-images/user-avatar.png';
    }
});
