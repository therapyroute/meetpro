import { highcharts } from 'highcharts';
import moment from 'moment-timezone';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

Template.highchartsHelper.onRendered(function() {
	var self = this;

	self.autorun(function() {
		var data = Template.currentData();
		$('#' + data.chartId).highcharts(data.chartObject);
	});
});

// tmplStatistics
Template.tmplStatistics.onRendered(function(){
  $('#infoTooltip').tooltip();
  Meteor.setTimeout(function(){
    $(function(){
      $("#userId").select2({
        allowClear: true
      });
    });
  }, 500);
});
// generic function to avoid multiple method calls
let fetchTotals = ( uId ) => {
  Meteor.call( 'getTotals', uId, ( error, response ) => {
    if ( error ) {
      console.log(error);
    } else {
      if (typeof response[0] === 'object'){
        hasStats.set(true);
      } else {
        hasStats.set(false);
      }
      userStats.set( response );
    }
  });
};

Template.tmplStatisticsAdminDashboard.onCreated(function(){
    this.subscribe('allUsernames');
    currentUser = new ReactiveVar(null);  
});

Template.tmplStatistics.onCreated(function(){
  if (appClient.isAdmin()){
    this.subscribe('allUsernames');
  }
  /*if (FlowRouter.getQueryParam('user')) {
    currentUser = new ReactiveVar(FlowRouter.getQueryParam('user'));
  }
  else {*/
    currentUser = new ReactiveVar(null);  
  //}
});
Template.tmplStatistics.helpers({
  allUsers: function(){
    return Meteor.users.find({}).fetch().map(function(p){
      if (!p?.profile?.user?.name || !p?.profile?.user?.surname){
        return;
      }
      return {
        label: p.profile.user.name + ' ' + p.profile.user.surname,
        value: p._id
      };
    });
  },
  isAdmin: function() {
    if (appClient.isAdminExpert()){
      return $("#currentRole").find(":selected").text().toLowerCase() == 'admin';
    }
    return Roles.userIsInRole(Meteor.user(),'admin');
  }
});
Template.tmplStatistics.events({ 
  'change .user-filter': function (event,t) {
    currentUser.set(document.getElementById('userId').value);
  }
});

// totals for superadmin
Template.tmplStatisticsTotalsSuperAdmin.onCreated(function () {
  appStats = new ReactiveVar(null);
  
  // call function to get stats from server
  Meteor.call('getTotalsSuperAdmin', function(error, result) { 
    if (error) { 
      console.log('error', error); 
    } 
    if (result) { 
      appStats.set(result);      
    } 
  });
});

Template.tmplStatisticsTotalsSuperAdmin.helpers({
  appStats: function(){
    return appStats.get();
  },
  duration2str: function(dur){
    return appClient.minutesToString(dur);
  },
});

// totals
Template.tmplStatisticsTotals.onCreated(function () {
  DocHead.setTitle(appParams.APP_NAME + ': '+TAPi18n.__('st_title'));
  isProvider = new ReactiveVar(Roles.userIsInRole(Meteor.user(),['provider']));
  userStats = new ReactiveVar(null);
  hasStats = new ReactiveVar(null);
  hasUsage = new ReactiveVar(null);

  // check if limited plan
  if (Meteor.settings.public.APP_MULTI_CLIENT && (appParams.plan == 'standard' || appParams.plan == 'pro') ) {
    let uId = currentUser.get() ? currentUser.get()._id : null
    Meteor.call('getUsage', uId, function(error, result) { 
      if (error) { 
        console.log('error', error); 
      } 
      if (result) { 
         hasUsage.set(result);
      } 
    });  
  }

  // call function to get stats from server
  this.autorun(function(){
    fetchTotals(currentUser.get());
  });
});



Template.tmplStatisticsTotals.helpers({
  hasStats: function(){
    return hasStats.get();
  },
  apptsNo: function(){
    return userStats.get() ? userStats.get()[0].num : 0;
  },
  assocNo: function(){
    return userStats.get() ? userStats.get()[0].assocs.length : 0;
  },
  strMoney: function(){
    return isProvider.get() ? TAPi18n.__('st_earned') : TAPi18n.__('st_spent');
  },
  sumMoney: function(){
    return userStats.get() ? userStats.get()[0].total.toFixed(2) : 0;
  },
  totalDuration: function(){
    return userStats.get() ? appClient.minutesToString(userStats.get()[0].duration) : 0;
  },
  hasUsage: function() {
    if (appClient.isAdmin() || 
      (appClient.isAdminExpert() && $("#currentRole").find(":selected").text().toLowerCase() == 'admin')) {
      return hasUsage.get();
    };
    return null;
  },
  isAdmin: function() {
    if (appClient.isAdminExpert()){
      return $("#currentRole").find(":selected").text().toLowerCase() == 'admin';
    }
    return Roles.userIsInRole(Meteor.user(),'admin');
  }
});

Template.tmplStatisticsTotalsDashboard.onCreated(function () {
  isProvider = new ReactiveVar(Roles.userIsInRole(Meteor.user(),['provider']));
  userStats = new ReactiveVar(null);
  hasStats = new ReactiveVar(false);

  if (Roles.userIsInRole(Meteor.user(),'unconfirmed')){
    return;
  }
  // call function to get stats from server
  fetchTotals();
});

Template.tmplStatisticsTotalsDashboard.helpers({
  columns: function() {
    return isProvider.get() ? 'col-md-3 col-sm-6 col-xs-6 stats-col' : 'col-md-4 col-sm-4 col-xs-12 stats-col';
  },
  hasStats: function(){
    return hasStats.get();
  },
  apptsNo: function(){
    return userStats.get() ? userStats.get()[0].num : 0;
  },
  assocNo: function(){
    return userStats.get() ? userStats.get()[0].assocs.length : 0;
  },
  strMoney: function(){
    return isProvider.get() ? TAPi18n.__('st_earned') : TAPi18n.__('st_spent');
  },
  sumMoney: function(){
    return userStats.get() ? userStats.get()[0].total.toFixed(2) : 0;
  },
  totalDuration: function(){
    return userStats.get() ? parseInt(userStats.get()[0].duration) : 0;
  },
  isProvider: function() {
    return isProvider.get();
  }
});

// Template tmplStatisticsAppointments
function buildAppointmentChart(){
  if (TAPi18n.getLanguage() === 'el'){
    var months = ['Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μαι', 'Ιουν',
        'Ιουλ', 'Αυγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ']
  } else {
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  }
  $('#appointments-container').highcharts({
    title: {
        text: TAPi18n.__('st_appmon'),
        x: -20 //center
    },
    chart: {
      style: {
        fontFamily: 'Helvetica Neue, Helvetica, Calibri, Roboto, sans-serif'
      }
    },
    xAxis: {
        categories: months
    },
    yAxis: {
        title: {
            text: TAPi18n.__('appointments')
        },
        min: 0,
        allowDecimals: false,
        plotLines: [{
            value: 0,
            width: 1,
            color: '#808080'
        }]
    },
    series: [{
        name: TAPi18n.__('appointments'),
        data: appointmentData.get()
    }]
  });
}

Template.tmplStatisticsAppointments.onCreated(function(){
  appointmentData = new ReactiveVar(null);
  apptYears = new ReactiveVar(null);
  selectedYear = new ReactiveVar(moment().year().toString());
  // get appointment years
  this.autorun(function(){
    Meteor.call("getYears", currentUser.get(), function(error, result){
      if(error){
        console.log("error", error);
      }
      if(result){
        apptYears.set(result);
      }
    });
  });
});
Template.tmplStatisticsAppointments.onRendered(function(){
  var self = this;
  //selectedYear.set(moment().year().toString());

  self.autorun(function(){
    Meteor.call("getDataPerMonth", 'appointments', selectedYear.get(), currentUser.get(), function(error, result){
      if(error){
        console.log("error", error);
      }
      if(result){
         appointmentData.set(result);
         buildAppointmentChart();
      }
    });
  });
});

Template.tmplStatisticsAppointments.helpers({
  apptYears: function(){
    if (apptYears.get()){
      var ret = [];
      _.each(apptYear.get(), function(yr){
        let year = {};
        year.value = yr;
        year.selected = yr === moment().year() ? 'selected' : '';
        ret.push(year);
      });
      return ret;
    }
  },
  hasYears: function(){
    if (apptYears.get()){
      return apptYears.get().length > 1 ? true : false;
    }
  }
});

Template.tmplStatisticsAppointments.events({
  'change [name="year"]' ( event, template ) {
    event.preventDefault();
    let selYear = event.target.value;
    selectedYear.set(selYear);
  }
});

//////////////////////////////////////////////////
// Template tmplStatisticsMoney (income per month)
//////////////////////////////////////////////////
function buildIncomeChart(){
  if (TAPi18n.getLanguage() === 'el'){
    var months = ['Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μαι', 'Ιουν',
        'Ιουλ', 'Αυγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ']
  } else {
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  }
  $('#income-container').highcharts({
      title: {
          text: TAPi18n.__('st_appincome'),
          x: -20 //center
      },
      chart: {
        style: {
          fontFamily: 'Helvetica Neue, Helvetica, Calibri, Roboto, sans-serif'
        }
      },
      subtitle: {
          text: TAPi18n.__('st_income_sub'),
          x: -20
      },
      xAxis: {
          categories: months
      },
      yAxis: {
          title: {
              text: TAPi18n.__('st_income')
          },
          min: 0,
          allowDecimals: false,
          plotLines: [{
              value: 0,
              width: 1,
              color: '#808080'
          }]
      },
      tooltip: {
          valuePrefix: '€ '
      },
      series: [{
          name: TAPi18n.__('st_income'),
          data: appointmentMoney.get()
      }]
    });
};

Template.tmplStatisticsMoney.onCreated(function(){
  appointmentMoney = new ReactiveVar(null);
  apptYear = new ReactiveVar(null);
  selectedYr = new ReactiveVar(null);
  this.autorun(function(){
    Meteor.call("getYears", currentUser.get(), function(error, result){
      if(error){
        console.log("error", error);
      }
      if(result){
        apptYear.set(result);
      }
    });
  });
});

Template.tmplStatisticsMoney.onRendered(function(){
  var self = this;
  selectedYr.set(moment().year().toString());
  self.autorun(function(){
    Meteor.call("getDataPerMonth", 'money', selectedYr.get(), currentUser.get(), function(error, result){
      if(error){
        console.log("error", error);
      }
      if(result){
        appointmentMoney.set(result);
        buildIncomeChart();
      }
    });
  });
});

Template.tmplStatisticsMoney.helpers({
  apptYears: function(){
    if (apptYears.get()){
      var ret = [];
      _.each(apptYear.get(), function(yr){
        let year = {};
        year.value = yr;
        year.selected = yr === moment().year() ? 'selected' : '';
        ret.push(year);
      });
      return ret;
    }
  },
  hasYears: function(){
    if (apptYear.get()){
      return apptYear.get().length > 1 ? true : false;
    }
  }
});
Template.tmplStatisticsMoney.events({
  'change [name="year"]' ( event, template ) {
    event.preventDefault();
    let selYear = event.target.value;
    selectedYr.set(selYear);
  }
});

//////////////////////////
// income per month table
//////////////////////////
Template.tmplStatisticsTable.onCreated(function(){
  appointmentTblMoney = new ReactiveVar(null);
  apptTblYear = new ReactiveVar(null);
  selectedTblYr = new ReactiveVar(null);
  this.autorun(function(){
    Meteor.call("getYears", currentUser.get(), function(error, result){
      if(error){
        console.log("error", error);
      }
      if(result){
        apptTblYear.set(result);
      }
    });
  });
});
Template.tmplStatisticsTable.onRendered(function(){
  var self = this;
  selectedTblYr.set(moment().year().toString());
  self.autorun(function(){
    Meteor.call("getDataPerMonth", 'money', selectedTblYr.get(), currentUser.get(), function(error, result){
      if(error){
        console.log("error", error);
      }
      if(result){
        appointmentTblMoney.set(result);
      }
    });
  });
});
Template.tmplStatisticsTable.helpers({
  tableData: function(){
    if (appointmentTblMoney.get() && appointmentTblMoney.get().length > 0){
      //let charge = appParams.bookingCharge;
      let totals = {
        name: TAPi18n.__('st_totals_title'),
        gross: 0,
        net: 0,
        commision: 0
      };
      
      let tbl =  _.map(appointmentTblMoney.get(), function(m, mon){
        // calculate amounts
        //let commision = (charge / 100).toFixed(2);
        let gross = m.toFixed(2);
        //let net = (m - commision).toFixed(2);
        // add to totals
        totals.gross += Number(gross);
        //totals.net += Number(net);
        //totals.commision += Number(commision);
        return {
          name: moment.months(mon),
          gross: gross,
          //net: net,
          //commision: commision
        }
      });
      // push totals to return array
      totals.gross = totals.gross.toFixed(2);
      //totals.net = totals.net.toFixed(2);
      //totals.commision = totals.commision.toFixed(2);
      tbl.push(totals);
      return tbl;
    }
  },
  apptYears: function(){
    if (apptTblYear.get()){
      var ret = [];
      _.each(apptTblYear.get(), function(yr){
        let year = {};
        year.value = yr;
        year.selected = yr === moment().year() ? 'selected' : '';
        ret.push(year);
      });
      return ret;
    }
  },
  hasYears: function(){
    if (apptTblYear.get()){
      return apptTblYear.get().length > 1 ? true : false;
    }
  }
});
Template.tmplStatisticsTable.events({
  'change [name="year"]' ( event, template ) {
    event.preventDefault();
    let selYear = event.target.value;
    selectedTblYr.set(selYear);
  }
});
