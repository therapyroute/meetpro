import moment from 'moment-timezone';
import sweetAlert from 'sweetalert';

// Reused functions
// Weekly schedule is based on day-schedule-selector (https://github.com/artsy/day-schedule-selector)
// included in package's lib folder
//
// Transforms schedule from day-schedule-selector format to a more readable format
// from format {'day': [[start,end],[start,end]]}
// e.g. {'0': [['09:30', '11:00'], ['13:00', '16:30']]}
// to format: ['day': [start,start2,start3]]
// e.g. [0: ['09:00','09:30','11:30']]
var sched2myFormat = function (hours, duration = 30) {
    var mySched = [];
    _.each(hours, function(day){
      var myDay = [];
      _.each(day, function(arr){
        myDay.push(arr[0]);
        var start = moment(arr[0],"HH:mm");
        var end = moment(arr[1],"HH:mm");
        var diff = end.diff(start,'minutes');
        if (diff > duration){
          for(var i=1; i < (diff/duration); i++){
            var newArr = start.add(duration,'minutes');
            var tmp = newArr.format("HH:mm");
            myDay.push(tmp);
          }
        }
      });
      mySched.push(myDay);
    });
    return mySched;
}
// the reverse procedure of sched2myFormat
var myFormat2Sched = function(sched, duration = 30) {
  var newSched = [];
  _.each(sched, function(day){
    var newDay = [];
    for (var i=0; i< day.length; i++){
      newDay.push([day[i],moment(day[i],"HH:mm").add(duration,'minutes').format("HH:mm")]);
    }
    newSched.push(newDay);
  });
  // convert array to object
  var newSched = _.extend({}, newSched);
  return newSched;
}
// function to save schedule (declared here because it is reused)
let saveSchedule = () => {
  // get data from day-schedule
  var hours = $("#day-schedule").data('artsy.dayScheduleSelector').serialize();
  // convert it to out app format
  var mySched = sched2myFormat(hours, durationRV.get());
  // save it to the user's collection
  let usrId = typeof currentUser !== 'undefined' && currentUser.get() ? 
    currentUser.get()._id :  Meteor.userId();
  Meteor.call("updateSchedule", usrId, mySched, function(error, result){
    if(error){
      console.log("error", error);
    }
    if(result){
      sAlert.success(TAPi18n.__('sched_upd'));
      // log to analytics
      // analytics.track("Provider updated schedule", {
      //   eventName: "Provider updated schedule",
      //   uId: Meteor.userId()
      // });
    }
  });
}

// Template related code
Template.tmplSchedule.onCreated(function(){
    // init ReactiveVars
    colSched = new ReactiveVar(null);
    colExceptions = new ReactiveVar(null);
    inWizard = new ReactiveVar(false);
    // check to see if template is displayed in the onboarding wizard
    if ( $('#onboarding-wizard').length > 0 ) { 
      inWizard.set(true);
    }
    if (!Session.get("timezone")){
      Session.set('timezone',moment.tz.guess());
    }
    // get profile from currentUser reactive var if it exists
    let usrProf = typeof currentUser !== 'undefined' && currentUser.get() ? 
      currentUser.get() : Meteor.user();
    if (typeof usrProf == 'undefined') {
      colSched.set(null);
      colExceptions.set(null);
    }
    else {
      colSched.set(usrProf.profile.provider.schedule.day);
      colExceptions.set(usrProf.profile.provider.schedule.exceptions);
    }

    // if duration found, use it else use 30mins (default)
    if (typeof usrProf !== 'undefined' && usrProf.profile && usrProf.profile.provider.schedule && usrProf.profile.provider.schedule.duration) {
      var duration = usrProf.profile.provider.schedule.duration;
    }
    else {
      var duration = 30;
    }
    durationRV = new ReactiveVar(duration);
    linkedGoogle = new ReactiveVar(null);
    Meteor.call('getProviderServices', function(error, result) { 
      if (error) { 
        console.log('error', error); 
      } 
      if (result) { 
          if (result.includes('google'))
            linkedGoogle.set(true);
          else
            linkedGoogle.set(false);
      }
    });
});

Template.tmplSchedule.onRendered(function(){
    // if not in wizard, show hidden sections
    if (inWizard.get() === false) {
      $('.schedule-week').show();
      $('.calendar-link').show();
    }
    if (TAPi18n.getLanguage() === 'el'){
      var dayStr = (window.innerWidth <= 480) ?
        ['Δ', 'Τ', 'Τ', 'Π', 'Π', 'Σ', 'Κ'] :
        ['Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ', 'Κυρ'];
    }
    else {
      var dayStr = (window.innerWidth <= 480) ?
        ['M', 'T', 'W', 'T', 'F', 'S', 'S'] :
        ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    }
    // calculate start & end time bearing timezones in mind (business & provider's)
    let sTime = appParams.workhours_from ?
      moment(appParams.workhours_from,'HH:mm').tz(appParams.workhours_tz).tz(Session.get('timezone')).format('HH:mm') :
      '08:00';
    let eTime = appParams.workhours_to ? 
      moment(appParams.workhours_to,'HH:mm').tz(appParams.workhours_tz).tz(Session.get('timezone')).format('HH:mm') :
      '24:00';
    // create day-schedule. Use autorun to rerender when duration changes
    let self = this;
    self.autorun(function() { 
      // JQuery workaround: empty container & append empty div which is then assigned a dayScheduleSelector
      $("#schedule-container").empty().append("<div id='day-schedule'></div>");
      $("#day-schedule").dayScheduleSelector({
        days: [1, 2, 3, 4, 5, 6, 0],
        stringDays: dayStr,
        interval: durationRV.get(),
        startTime: sTime,
        endTime: eTime
      });
      // if provider has saved a schedule, convert it to a day-schedule friendly format and display it
      if (colSched.get()){
        providerSchedule = myFormat2Sched(colSched.get(), durationRV.get());
        // deserialize it and feed it to day-schedule
        $("#day-schedule").data('artsy.dayScheduleSelector').deserialize(providerSchedule);
      }   
    });
    
    // initialize datepicker
    Meteor.setTimeout(function () {
      $('#exceptionDates').datepicker({
        format: "dd/mm/yyyy",
        startDate: "0d",
        clearBtn: true,
        language: TAPi18n.getLanguage(),
        multidate: true,
        multidateSeparator: ", ",
        container: '#pickerContainer',
        orientation: 'auto top',
        weekStart: 1
      });
    }, 300);
    Meteor.setTimeout(function () {
      if (colExceptions.get()){
        var tmp = [];
        // format to UTC to properly display @ datepicker
        // see http://blog.skylight.io/bringing-sanity-to-javascript-utc-dates-with-moment-js-and-ember-data/
        _.each(colExceptions.get(), function(dt){
          tmp.push(moment.utc(dt).toDate());
        });
        $("#exceptionDates").datepicker('setDates',tmp);
      }
    }, 500);
});
Template.tmplSchedule.helpers({
  curTZ: function(){
    return Session.get("timezone") ? Session.get('timezone') : moment.tz.guess();
  },
  duration: function(){
    return durationRV.get();
  },
  linkBtnText: function() {
    return linkedGoogle.get() ? TAPi18n.__('unlink-btn') : TAPi18n.__('link-btn');
  },
  linkBtnClass: function() {
    return linkedGoogle.get() ? 'btn-danger' : 'btn-success';
  },
  inWizard: function() {
    return inWizard.get();
  }
});

Template.tmplSchedule.events({
  // save schedule button clicked
  "click #saveSched": function(ev, tmpl){
    ev.preventDefault();
    saveSchedule();
    if (inWizard.get()) {
      $('.calendar-link').show();
    }
  },
  "hide #exceptionDates": function(ev, tmpl){
    //var dts = [];
    // workaround time zones @ mongo
    //_.each(ev.dates, function(dt){
    //  dts.push(moment(dt).hour(12).toDate());
    //});
    let usrId = typeof currentUser !== 'undefined' && currentUser.get() ? 
      currentUser.get()._id : Meteor.userId();
    Meteor.call("updateExceptions", usrId, ev.dates, function(error, result){
      if (error){ console.log("error", error); }
      if (result) {
        sAlert.success(TAPi18n.__('exceptions_upd'));
      }
    });
  },
  'click #save-duration': function(event,template) {
    event.preventDefault();
    var duration = Number($('#duration').val());
    durationRV.set(duration);
    let usrId = typeof currentUser !== 'undefined' && currentUser.get() ? 
      currentUser.get()._id : Meteor.userId();
    Meteor.call('updateDuration', usrId, duration, function(error, success) { 
      if (error) { 
        console.log('error', error); 
      } 
      if (success) { 
        sAlert.success(TAPi18n.__('duration_upd'));
        saveSchedule();
        if (inWizard.get()) {
          $('.schedule-week').show();
        }
      } 
    });
  },
  'click #link-account': function(event,template) {
    event.preventDefault();
    if (linkedGoogle.get() === true) {
      Meteor.call('unlinkService', 'google', function(error, success) { 
        if (error) { 
          console.log('error', error);
          sweetAlert(TAPi18n.__("fl_error"), TAPi18n.__("fl_error_txt")+': '+error.message, "error"); 
        } 
        if (success) { 
           linkedGoogle.set(false);
        } 
      });
    } else {
      // options found at: https://github.com/percolatestudio/meteor-google-api/issues/38#issuecomment-295315855
      let options = { 
        loginStyle: 'popup', 
        requestPermissions: ['https://www.googleapis.com/auth/calendar'], 
        forceApprovalPrompt: true, 
        requestOfflineToken: true
      };
      // permission to Google calendar offline
      //Meteor.loginWithGoogle({);
      //Accounts.ui.config({requestPermissions:{google:['https://www.googleapis.com/auth/calendar']}, forceApprovalPrompt: {google: true}, requestOfflineToken: {google: true}});

      Meteor.linkWithGoogle(options, function(error,result){
        if (error) {
          console.log(error);
          sweetAlert(TAPi18n.__("fl_error"), TAPi18n.__("fl_error_txt")+': '+error.message, "error"); 
        }
        if (result){
          linkedGoogle.set(true);
        }
      });
    }
  }
});
