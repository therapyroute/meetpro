// tmplProviders
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

Template.tmplProviders.onCreated(function() {
  DocHead.setTitle(appParams.APP_NAME + ': '+TAPi18n.__('m_providers'));
  searchTerm = new ReactiveVar('');
  searching = new ReactiveVar(false);
  curPage = new ReactiveVar(0);
  totalPages = new ReactiveVar(null);

  // get query var from url (if any)
  var sTerm = FlowRouter.getQueryParam("search");
  if (sTerm && sTerm.length > 0) {
    searchTerm.set(sTerm);
  }

  var self = this;
  // autorun: subscribe to publications. When ReactiveVar changes, re-subscribe...
  self.autorun(function(){
    // pagination
    // based on http://experimentsinmeteor.com/paging-and-sorting-part-1/
    var currentPage = parseInt(FlowRouter.getParam('page')) || 1;
    curPage.set(currentPage);
    var skipCount = (currentPage - 1) * appParams.providersPerPage;

    self.subscribe('ProviderPublicFiltered', searchTerm.get(), skipCount, function(){
      setTimeout(function () {
        searching.set( false );
      }, 300);
    });
    var ids = _.map(Meteor.users.find().fetch(),function(a){return a._id});
  });
});

Template.tmplProviders.events({
  'keyup #search-box': function (evt, tmpl) {
    let searchTerm = evt.currentTarget.value;
    if (searchTerm.length > 3) {
      Meteor.call('searchAll', searchTerm, function(error, result) { 
        if (error) { 
          console.log('error', error); 
        } 
        if (result) { 
          $("#suggestion-box").show();
          $('.clearBtn').prop('disabled', false);
          if (result.length > 0) {
            let hasProviders = hasSpecialties = hasExpertise = false;
            let theHtml = '<ul id="results-list">';
            let theProviders = `<li class='results-category'><strong>${TAPi18n.__('search_providers')}</strong></li>`;
            let theSpecialties = `<li class='results-category'><strong>${TAPi18n.__('specialities')}</strong></li>`;
            let theExpertise = `<li class='results-category'><strong>${TAPi18n.__('expertise')}</strong></li>`;

            result.forEach(function(item, index){
              if (item.type === 'speciality'){
                hasSpecialties = true;
                theSpecialties += `<a href="/experts?search=${item.name}" class="speciality"><li>${item.name}</li></a>`
              }
              else if (item.type === 'provider'){
                hasProviders = true;
                let theSpecs = item.specialities.toString();
                let link = item.slug ? item.slug : item.id;
                theProviders += `<a href="/expert/${link}"><li>${item.name} ${item.surname} (${theSpecs})</li></a>`
              }
              else if (item.type === 'expertise'){
                hasExpertise = true;
                theExpertise += `<a href="/experts?search=${item.name}" class='expertise'><li>${item.name}</li></a>`;
              }
            });

            theHtml += hasSpecialties ? theSpecialties : '';
            theHtml += hasProviders ? theProviders : '';
            theHtml += hasExpertise ? theExpertise : '';
            theHtml += '</ul>';
            $("#suggestion-box").html(theHtml);
            $("#search-box").css("background","#FFF");
          }
          else {
            var theHtml = `<h4>${TAPi18n.__('not_found_search')}</h4>`;
            $("#suggestion-box").html(theHtml);
            $("#search-box").css("background","");
          }
        }
      });
    }
    if (searchTerm.length === 0) {
      $("#suggestion-box").hide();
      $('.clearBtn').prop('disabled', true);
    }
  },
  /*'keyup #providerSearchInput': function (evt, tmpl) {
    $('.clearBtn').prop('disabled', false);
    var value = $('#providerSearchInput').val();
    if (value !== '' && event.keyCode === 13){
      searchTerm.set(value);
      searching.set(true);
      // log to analytics
      // analytics.track("User searched", {
      //   eventName: "User searched",
      //   uId: Meteor.userId(),
      //   term: value
      // });
    }
    if ( value === '' ) {
      searchTerm.set( value );
    }
  },*/
  'click .speciality,.expertise': function(evt, tmpl) {
    searchTerm.set(evt.target.innerText);
    $('#providerSearchInput').val(evt.target.innerText);
  },
  // "click #bookingLink": function(e,t){
  //   e.preventDefault();
  //   /*if (!Meteor.user()){
  //     AccountsTemplates.setState('signUp');
  //     // set session var to redirect to booking after login
  //     Session.set('redirectTo',{
  //         path: 'bookingRoute',
  //         params: {'providerId': this.slug}
  //     });
  //     FlowRouter.go('/sign-in');
  //   }
  //   else {*/
  //   FlowRouter.go("bookingRoute",{providerId: this.slug});
  //   //}

  // },
  'click .clearBtn': function(evt, tmpl) {
    searchTerm.set('');
    $("#search-box").css("background","");
    $("#suggestion-box").hide();
    $('#search-box').val('');
    evt.target.disabled = true;
    FlowRouter.setQueryParams({search: null});
  },
  "click #toggleHelp": function(event, template) {
    $('#searchHelp').toggle(200);
    $("i", '#toggleHelp').toggleClass("fa-caret-down fa-caret-up");
  },
});

/////////////////////////////////////////////
// tmplProvider
// search based on: https://themeteorchef.com/snippets/simple-search/
// if provider, do not display own card
// TODO: pagination @ search results (now 1/1 is displayed)
Template.tmplProvider.helpers({
  ProviderPublic: function() {
    return Meteor.users.find({ _id: {$ne: Meteor.userId()}, roles: {$in: ['provider']}}).map(function (rec) {

      if (rec){
        var imageUrl = rec.profile.user.photo ? rec.profile.user.photo :
          '/images/temp-images/expert-avatar.jpg';

        //console.log(rec);
        let cls = rec.profile.provider.featured ? 'featured-provider' : '';
        let slug = rec.profile.user.slug ? rec.profile.user.slug : rec._id;
        return {
            id: rec._id,
            name: rec.profile.user.name,
            surname: rec.profile.user.surname,
            slug: rec.profile.user.slug,
            specialities: rec.specs(),
            bookingLink: FlowRouter.path("bookingRoute",{providerId: slug}),
            fullname: rec.profile.user.name + " " + rec.profile.user.surname,
            path: FlowRouter.path("providerRoute",{providerId: slug}),
            image: imageUrl,
            cls: cls,
            featured: rec.profile.provider.featured
         };
       }
      });
   },
   sUrl : function (search) {
     return FlowRouter.path('providersRoutePage',{},{search: search});
   },
   searching: function() {
     return searching.get();
   },
   query: function() {
     return searchTerm.get();
   },
   prevPage: function() {
    var currentPage = parseInt(FlowRouter.getParam('page')) || 1;
    var previousPage = currentPage === 1 ? 1 : currentPage - 1;
    return FlowRouter.path('providersRoutePage',{page: previousPage});
  },
  nextPage: function() {
    var currentPage = parseInt(FlowRouter.getParam('page')) || 1;
    var nextPage = currentPage + 1;
    return FlowRouter.path('providersRoutePage',{page: nextPage});
  },
  prevPageCss: function() {
    return (parseInt(FlowRouter.getParam('page')) || 1) <= 1 ? "pointer-events: none;" : "";
  },
  nextPageCss: function() {
    if (searchTerm.get().length > 0)
      return "pointer-events: none;";
    var hasMorePages = function() {
      var totalCustomers = Counts.get('providerCount');
      totalPages.set(Math.ceil(totalCustomers/parseInt(appParams.providersPerPage)));
      return (parseInt(FlowRouter.getParam('page')) || 1) * parseInt(appParams.providersPerPage) < totalCustomers;
    }
    return hasMorePages() ? "" : "pointer-events: none;";
  },
  totalPages: function() {
    if (searchTerm.get().length > 0)
      return "1";
    return totalPages.get();
  },
  curPage: function() {
    if (searchTerm.get().length > 0)
      return "1";
    return curPage.get();
  },
  hasSearch: function() {
    return searchTerm.get().length > 0 ? '' : 'disabled';
  },
  providerCols: function() {
    let cols = {
      1: 12,
      2: 6,
      3: 4,
      4: 6
    }
    if (appParams.providersPerPage < 5){
      let pp = appParams.providersPerPage;
      let col = cols[pp];
      return 'col-sm-'+ col + ' col-md-' + col;
    }
    else {
      return 'col-sm-6 col-md-4'
    } 
  }
});

//////////////////////////
// featured providers code
// deprecated
/*
Template.tmplProvidersHome.onCreated(function(){
  featuredRV = new ReactiveVar(null);
  // call method to get featured providers
  Meteor.call("getFeaturedProviders", function(error, result){
    if(error){
      console.log("error", error);
    }
    if(result){
      featuredRV.set(result);
    }
  });
});

Template.tmplProvidersHome.rendered = function(){
  // use setTimeout to handle loading issue
  let iWidth = window.innerWidth <= 480 ? window.innerWidth-28 : 200;
  let iMargin = window.innerWidth <= 480 ? 0 : 10;
  Meteor.setTimeout(function(){
    $("#featuredSlider").flexslider({
      animation: "slide",
      animationLoop: true,
      itemWidth: iWidth,
      itemMargin: iMargin
    });
  }, 800);

};

Template.tmplProvidersHome.helpers({
  // display up to 4 featured providers (will change)
  featuredProviders: function() {
    return featuredRV.get();
   },
   joinSpecs: function(specs) {
     return specs.join();
   },
   sUrl : function (search) {
     return FlowRouter.path('providersRoutePage',{},{search: search});
   },
});
*/
