import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

Template.tmplEditAppointment.onCreated(function(){
  let bookingId = FlowRouter.getParam('bookingId');
  this.subscribe('adminOneBooking', bookingId); 
  this.subscribe('allUsernames');
  DocHead.setTitle(appParams.APP_NAME + ': '+TAPi18n.__('edit_appointment'));
});

Template.tmplEditAppointment.helpers({
  current_doc: function() {
    return Bookings.findOne({});
  },
  allProviders: function() {
    return _.map(Meteor.users.find({"roles":'provider'}).fetch(), function(p){
      return {
        label: p.profile.user.name + ' ' + p.profile.user.surname,
        value: p._id
      };
    });
  },
  allUsers: function() {
    return _.map(Meteor.users.find({"roles":'user'}).fetch(), function(p){
      return {
        label: p.profile.user.name + ' ' + p.profile.user.surname,
        value: p._id
      };
    });
  },
  appttypeOptions: function(){
    return [
      {label: TAPi18n.__('ap_appttype1'), value: 'videocall'},
      {label: TAPi18n.__('ap_appttype2'), value: 'f2f'}
    ];
  },
  statusOptions: function(){
    return [
      {label: TAPi18n.__('cancelled'), value: 'cancelled'},
      {label: TAPi18n.__('pending'), value: 'pending'},
      {label: TAPi18n.__('confirmed'), value: 'confirmed'},
      {label: TAPi18n.__('completed'), value: 'completed'}
    ];
  },
  paymentOptions: function(){
    return [
      {label: TAPi18n.__('paypal'), value: 'paypal'},
      {label: 'Braintree', value: 'braintree'},
      // omit Viva Wallet for now...
      // {label: TAPi18n.__('viva'), value: 'viva'},
      {label: TAPi18n.__('stripe'), value: 'stripe'},
      {label: 'None', value: 'none'},
    ];
  },
  transactions: function() {
    return Bookings.findOne({}).transactions;
  },
  notifications: function() {
    return Bookings.findOne({}).notifications;
  },
  call: function() {
    return Bookings.findOne({}).call;
  },
  dpOptions: function() {
    return {
      format: "DD-MM-YYYY, HH:mm",
      sideBySide: true
    }
  },
  createdAt: function() {
   return Bookings.findOne({}).createdAt; 
  },
  updatedAt: function() {
    const cDoc = Bookings.findOne({}); 
    return cDoc.updatedAt ? cDoc.updatedAt : cDoc.createdAt;
  }
});

AutoForm.addHooks("bookingUpdate", {
  onError: function (type,error) {
    sAlert.error(TAPi18n.__('edit_appointment_fail') + ': ' + error);
    console.log(error);
  },
  onSuccess: function () {
    sAlert.success(TAPi18n.__("edit_appointment_success"));
  }
});

//////////////////////////////////
Template.tmplAddAppointment.onRendered(function(){
  Meteor.setTimeout(function(){
    $(function(){
      $("#userId").select2({
        placeholder: TAPi18n.__("ap_select_placeholder"),
        allowClear: true
      });
      $("#providerId").select2({
        placeholder: TAPi18n.__("ap_select_placeholder"),
        allowClear: true
      });
    });
  }, 800);
});

Template.tmplAddAppointment.onCreated(function() { 
  userId = new ReactiveVar(null);
  provId = new ReactiveVar(null);
  this.subscribe('allUsernames');
});

Template.tmplAddAppointment.helpers({
  allProviders: function() {
    return _.map(Meteor.users.find({"roles":'provider'}).fetch(), function(p){
      return {
        label: p.profile.user.name + ' ' + p.profile.user.surname,
        value: p._id
      };
    });
  },
  allUsers: function() {
    return _.map(Meteor.users.find({"roles":'user'}).fetch(), function(p){
      return {
        label: p.profile.user.name + ' ' + p.profile.user.surname,
        value: p._id
      };
    });
  },
  bothSelected: function() {
    return !!provId.get() && !!userId.get();
  }
});
Template.tmplAddAppointment.events({ 
  'change .user-filter': function (event,t) {
    userId.set(document.getElementById('userId').value);
  },
  'change .provider-filter': function (event,t) {
    provId.set(document.getElementById('providerId').value);
  },
});