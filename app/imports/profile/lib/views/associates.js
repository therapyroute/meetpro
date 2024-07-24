// pagination based on hitchcott:paginator : To be tested...
// inline search based on https://github.com/awatson1978/dictionary
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

assocsPagination = new Paginator(Meteor.users);

Template.tmplAssociates.onCreated(function(){
  let title = Roles.userIsInRole(Meteor.user(),['provider']) ? TAPi18n.__('sb_users') : TAPi18n.__('sb_experts');
  DocHead.setTitle(appParams.APP_NAME + ': ' + title);
  searchTerm = new ReactiveVar('');

  this.subscribe('allAssocs');
  // add greek translations for Paginator
  TAPi18n.loadTranslations(
    {
      "el": {
          "previous": "Προηγ.",
          "next": "Επόμ.",
          "page_x_of_y": "Σελ. __currentPage__ από __totalPages__"
      }
    },
    "hitchcott:paginator"
  );
});

Template.tmplAssociates.onRendered(function(){
  $('#infoTooltip').tooltip();
});

Template.tmplAssociates.helpers({
  assocTxt: function(){
     return Roles.userIsInRole(Meteor.user(),['provider','unconfirmed']) ? TAPi18n.__('sb_users') : TAPi18n.__('sb_experts');
  },
  assocHover: function(){
     return Roles.userIsInRole(Meteor.user(),['provider','unconfirmed']) ? TAPi18n.__('sb_users_hover') : TAPi18n.__('sb_experts_hover');
  },
  hasAssocs: function() {
    return Meteor.users.find({_id: {$ne: Meteor.userId()}},{fields: {'profile':1}}).fetch();
  },
  assocs: function() {
    return assocsPagination.find(
      {
        _id: {$ne: Meteor.userId()},
        'profile.user.surname': { $regex: searchTerm.get(), $options: 'i' }
      },
      {
        sort: { 'profile.user.surname': 1 },
        itemsPerPage: appParams.providersPerPage
      }
    );
  },
  isProvider: function(){
    return Roles.userIsInRole(Meteor.user(),['provider', 'unconfirmed']);
  },
  hasSearch: function() {
    return searchTerm.get().length > 0 ? '' : 'disabled';
  },
  noneTitle: function(){
    return Roles.userIsInRole(Meteor.user(),['provider','unconfirmed']) ? TAPi18n.__('as_nonept') : TAPi18n.__('as_noneut');
  },
  noneText: function(){
    return Roles.userIsInRole(Meteor.user(),['provider','unconfirmed']) ? TAPi18n.__('as_nonep') : TAPi18n.__('as_noneu');
  }
});

Template.tmplAssociates.events({
  'keyup #associateSearchInput': function (evt, tmpl) {
    searchTerm.set($('#associateSearchInput').val());
  },
  'click #clearBtn': function(evt, tmpl) {
    searchTerm.set('');
    $('#associateSearchInput').val('');
  },
  'submit #searchForm': function(e,t){
    e.preventDefault();
  }
});

/////////////////////////
// Associate card
/////////////////////////
Template.tmplAssociateCard.helpers({
  userPhoto: function(profile) {
    return profile ? profile :
      Roles.userIsInRole(Meteor.user(),['provider']) ?
        '/images/temp-images/user-avatar.png' :
        '/images/temp-images/expert-avatar.jpg';
  },
  associateLink: function() {
    return FlowRouter.path("commonAssociate",{assocId: this.profile.user.slug});
  },
  specialities: function() {
    if (Roles.userIsInRole(Meteor.user(),['user']))
      return Meteor.users.findOne({_id: this._id}).specs().join(', ');
  }
});
