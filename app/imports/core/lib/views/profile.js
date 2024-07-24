import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

Template.tmplProfile.onCreated(function() {
  var curId = FlowRouter.getParam("providerId");
  curProvId = new ReactiveVar(null);
  provExp = new ReactiveVar(null);
  providerRating = new ReactiveVar(null);

  var self = this;
  // call method to check if param is id or slug
  Meteor.call('checkProviderParam', curId, function(error, result){
     if (error){
         console.log('error',error);
         return;
     }
     // if result (id) subscribe...
     curProvId.set(result);
     self.subscribe('providerProfile', result, {
       onReady: function(){
         let user = Meteor.users.findOne({_id: result});
         if (user){ DocHead.setTitle(appParams.APP_NAME + ': '+ user.fullName()); }
       }
     });
     // get provider's ratings average
     Meteor.call('getRatingAverage', result, function(error,result){
       if (result){
         providerRating.set(result);
       }
     });
     // get expertise
    //  Meteor.call('getExpertiseNames', curProvId.get(), function(error, success) { 
    //   if (error) { 
    //     console.log('error', error); 
    //   } 
    //   if (success) { 
    //      provExp.set(success);
    //   } 
    //  });
  });
});

Template.tmplProfile.onRendered(function() {
   Meteor.setTimeout(function(){
     $('.readmore').readmore({
       collapsedHeight: 45,
       speed: 100,
       lessLink: '<a href="#"><em>'+TAPi18n.__('readless')+'</em></a>',
       moreLink: '<a href="#"><em>'+TAPi18n.__('readmore')+'</em></a>'
     });
  }, 1000);

});

Template.tmplProfile.helpers({
  isProvider: function(){
    return Roles.userIsInRole(Meteor.user(),['provider']);
  },
  prProfile: function(){
    var curId = curProvId.get();
    return Meteor.users.findOne({_id: curId});
  },
  specs: function() {
    var curId = curProvId.get();
    spIds = Meteor.users.findOne({_id: curId}).profile.provider.specialities;
    return spIds && spIds[0] !== null ? 
      _.map(Specialities.find({_id: {$in: spIds}},{fields: {name: 1}}).fetch(), function(sp){
        return sp.name;
      }) : TAPi18n.__('no_speciality');
  },
  showExpertise: function() {
    return provExp.get();
  },
  bookingLink: function() {
    let usr = Meteor.users.findOne({_id: curProvId.get()});
    let slug = usr.profile.user.slug ? usr.profile.user.slug : usr._id;
    return FlowRouter.path("publicBookingRoute")+'/'+slug;
  },
  currentProvider: function() {
     return curProvId.get();
  },
  providerRating: function() {
    return providerRating.get() ? providerRating.get().avg : null;
  },
  displayRating: function() {
    let curProv = Meteor.users.findOne({_id: curProvId.get()});
    return curProv.profile.provider.displayRating && providerRating.get();
  },
  providerRatingsText: function() {
    if (providerRating.get()) {
      let prov = providerRating.get();
      return TAPi18n.__('pr_ratings_text', { postProcess: 'sprintf', sprintf: [prov.avg, prov.num] });
    }
  },
  userPhoto: function(profile) {
    return profile ? profile : '/images/temp-images/expert-avatar.jpg';
  },
  category1: function() {
    return appParams.profileCategory1;
  },
  category2: function() {
    return appParams.profileCategory2;
  }
});
// Template.tmplProfile.events({
  //  "click #bookingLink": function(e,t){
  //     /*if (!Meteor.user()){
  //        AccountsTemplates.setState('signUp');
  //        // set session var to redirect to booking after login
  //        Session.set('redirectTo',{
  //           path: 'bookingRoute',
  //           params: {'providerId': this.user.slug}
  //        });
  //        FlowRouter.go('/sign-in');
  //    }
  //    else {*/
      
  //       FlowRouter.go("bookingRoute",{providerId: slug});
  //    //}
  //  }
// });
