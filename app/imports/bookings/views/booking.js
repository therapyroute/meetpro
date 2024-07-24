import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import moment from 'moment-timezone';
import sweetAlert from 'sweetalert';

Template.tmplBooking.onCreated(function() {
  params = new ReactiveVar({APP_NAME:''});
  // if guest, load params based on provider slug
  if (Meteor.userId()) {
    params.set(appParams);
  } else {
    Session.set('guest', true);
    let slug = FlowRouter.getParam("providerId")
    Meteor.call('getParamsBySlug', slug, function(error, result) { 
      if (error) { 
        console.log('error', error); 
      } 
      if (result) { 
         params.set(result);
         // if subscription is inactive, block guest from booking
         if (result.subscriptionStatus === 'inactive'){
          Meteor.logout();
          FlowRouter.go('notActive');
          return;
        }
      } 
    });
  }
  // if timezone not set, guess it
  if (!Session.get('timezone')) {
    Session.set('timezone', moment.tz.guess());
  }
  DocHead.setTitle(params.get().APP_NAME);
  var self = this;

  // check if called by admin or not
  if (!appClient.isAdmin()) {
    provId = new ReactiveVar(FlowRouter.getParam("providerId"));
    userId = new ReactiveVar(Meteor.userId());
  }
  
  clicked_booking = new ReactiveVar(false);
  start = new ReactiveVar(null);
  paymentBraintree = new ReactiveVar(null);
  paymentViva = new ReactiveVar(null);
  paymentStripe = new ReactiveVar(null);
  paymentPaypal = new ReactiveVar(null);
  bookingDataVar = new ReactiveVar(null);
  dateFrom = new ReactiveVar(null);
  dateTo = new ReactiveVar(null);
  priceRv = new ReactiveVar(null);
  durationRV = new ReactiveVar(null);
  provImage = new ReactiveVar(null);
  workFrom = new ReactiveVar(null);
  workTo = new ReactiveVar(null);

  self.autorun(function(){
    // call method to check if param is id or slug
    Meteor.call('checkProviderParam', provId.get(), function(error, result){
      if (error){
          console.log('error',error);
          sweetAlert({title:TAPi18n.__("fl_error"),text: TAPi18n.__("not_found"),type: "error"});
          FlowRouter.go('/');
          return;
      }
      provId.set(result);
      Meteor.call('getProviderImage', result, function(error, res){
        if (error) { console.log(error); }
        if (res) {
          provImage.set(res);
        }
      });
    });
    // subscribe to provider profile, image & schedule
    self.subscribe('providerProfileBooking', provId.get());
    self.subscribe('providerSpecs', provId.get());
    self.subscribe('providerSchedule', provId.get());
    // Reactively subscribe to provider's bookings on the given dates
    if (dateFrom.get() && dateTo.get() && provId.get()) {
      self.subscribe('providerBookings', provId.get(), dateFrom.get(), dateTo.get());
      // subscribe to user appointments on the given dates
      self.subscribe('allUserAppts', userId.get(), dateFrom.get(), dateTo.get());
    }
    // get appointment duration
    if (provId.get()) {
      Meteor.call('getProviderDuration', provId.get(), function(error, success) { 
        if (error) { 
          console.log('error', error); 
        } 
        if (success) { 
          durationRV.set(success);
          // refresh calendar's slot duration (only if needed)
          const fc = $('.fc');
          const duration = fc.fullCalendar('option', 'slotDuration');
          if (typeof duration === 'string' && duration !== `00:${success}:00`) {
            fc.fullCalendar('option', {
              'slotDuration': `00:${success}:00`,
              'slotLabelInterval': `00:${success}:00`,
            });
          }
        } 
      });
    }
    // get from -> to times (depending on business working hours' & user's timezones)
    if (params.get() && params.get().workhours_from && params.get().workhours_to){
      let wFrom = moment(params.get().workhours_from,'HH:mm').tz(params.get().workhours_tz).tz(Session.get('timezone')).format('HH:mm');
      let wTo = moment(params.get().workhours_to,'HH:mm').tz(params.get().workhours_tz).tz(Session.get('timezone')).format('HH:mm');
      // workaround: if different day, show 24 hours' slots
      if (parseInt(wFrom) > parseInt(wTo)){
        workFrom.set('00:00');
        workTo.set('24:00');
      } else {
        workFrom.set(wFrom);
        workTo.set(wTo);
      }
    } else {
      workFrom.set('08:00');
      workTo.set('17:00');
    }
  });
  //
  
});

// fetchSchedule
// a helper to read provider schedule from user collection and return it in a fullCalendar format
// Schedule slots are returned as green, background events with id='available'
// Exceptions are also checked & returned as red cells (unclickable)
// Times are dependent on the user & provider timezone offset
var fetchSchedule = function(provId, start, end) {
    var colSched = Meteor.users.findOne({_id: provId, "profile.provider.schedule": {$exists: true}});
    if (typeof colSched == 'undefined'){
      // no schedule found
      return [];
    }
    // proceed...
    // calculate time offset between timezones of user & provider
    var prTZ = colSched.profile.user.timezone ? colSched.profile.user.timezone : 'Europe/London';
    var uTZ = Session.get('timezone') ? Session.get('timezone') : 'Europe/London';
    var offset = moment().tz(uTZ).format('HH') - moment().tz(prTZ).format('HH');
    var days = colSched.profile.provider.schedule.day;
    if (colSched.profile.provider.schedule && colSched.profile.provider.schedule.duration) {
      var duration = colSched.profile.provider.schedule.duration;
    }
    else {
      var duration = 30;
    }
    // get exceptions from schedule & apply to current week
    var allExceptions = colSched.profile.provider.schedule.exceptions;
    var weekExceptions = [];
    if (start) {
      // check which exceptions apply to current week & append to weekExceptions array
      _.each(allExceptions, function(ex){
        if (moment(ex).tz(prTZ).startOf('day') >= start.tz(uTZ).startOf('day') && moment(ex).tz(prTZ).startOf('day') < end.tz(uTZ).startOf('day')){
          weekExceptions.push(moment(ex).day());
        }
      });
    }

    //durationRV.set(duration);
    var schedule = [];

    var dayCnt = 0;

    // loop through schedule days (0 to 6)
    _.each(days, function(day){
      // check if current day is an exception
      var isException = false;
      if (weekExceptions.indexOf(dayCnt) > -1){
        isException = true;
      }
      // loop through day slots
      _.each(day, function(slot){
        var newSlot = {};
        // display times using timezone offset
        newSlot.start = moment(slot,["HH:mm"]).add(offset,'hours').format("HH:mm");
        var tmpDate = moment(newSlot.start,["HH:mm"]).add(duration,'minutes').format("HH:mm");
        newSlot.end = tmpDate;
        newSlot.title = isException ? TAPi18n.__('unavailable') : newSlot.start + ' (' + TAPi18n.__('available') + ')';
        newSlot.tooltip = newSlot.title;
        newSlot.color = isException ? 'red' : 'green';
        if (!isException){
          newSlot.rendering = 'background';
          newSlot.id = 'available';
        }
        newSlot.allDay = 'false';
        var tmp = [];
        tmp.push(dayCnt);
        newSlot.dow = tmp;
        schedule.push(newSlot);
      });
      dayCnt += 1;
    });
    return schedule;
}

var fetchGcalEvents = function(providerId, dateFrom, dateTo){
  // get gCalendar events
  Meteor.call('getGCalEvents', providerId, dateFrom.toDate(), dateTo.toDate(), function(error, success) { 
    if (error) { 
      console.log('error', error); 
    } 
    if (success) { 
      var fc = $('.fc');
      success.forEach(function(event){
        // convert all times according to the user timezone.
        event.start = Session.get('timezone') ? moment(event.start).tz(Session.get('timezone')) : moment(event.start);
        event.end = Session.get('timezone') ? moment(event.end).tz(Session.get('timezone')) : moment(event.end);
        event.title = TAPi18n.__("ap_booked_gcal");
        event.color = 'red';
        // render gCal events @ booking calendar
        fc.fullCalendar('renderEvent', event);
      });
    } 
  });
}

Template.tmplBooking.helpers({
  showBreadcrumb: function() {
    return (Meteor.userId() && !Roles.userIsInRole(Meteor.userId,['admin']));
  },
  currentProvider: function() {
    var curId = provId.get();
    var usr = Meteor.users.findOne({_id: curId});
    var uSpecs = usr ? usr.specs().join() : null;
    let theSlug = usr && usr.profile.user.slug ? usr.profile.user.slug : curId;
    return usr && {
      uslug : theSlug,
      uname: usr.profile.user.name,
      usurname: usr.profile.user.surname,
      ulink: Meteor.user() ? FlowRouter.path("providerRoute",{providerId: theSlug}) : '#',
      specs: uSpecs
    };
  },
  providerImageUrl: function() {
    return provImage.get();
  },
  clickedBooking: function() {
    return clicked_booking.get();
  },
  payWithBraintree: function(){
    return paymentBraintree.get();
  },
  payWithViva: function(){
    return paymentViva.get();
  },
  payWithStripe: function(){
    return paymentStripe.get();
  },
  payWithPaypal: function(){
    return paymentPaypal.get();
  },
  headerOpts: function() {
    return {center:'agendaWeek,agendaDay,agendaFourDay'};
  },
  customView: function(){
    var fDay = {
      agendaFourDay: {
        type: 'agenda',
        duration: { days: 4 },
        buttonText: TAPi18n.__('four_day')
      }
    }
    return fDay;
  },
  // a helper to return an array of schedule slots & bookings for rendering @ fullCalendar
  fetchAll: function(){
    var fc = $('.fc');
    return function(start, end, tz, callback) {
      // send start & end date to publication for a shorter result set, using ReactiveVars
      dateFrom.set(start.toDate());
      dateTo.set(end.toDate());

      var pId = provId.get();
      var sched = fetchSchedule(pId, start, end);
      //trigger event rendering when collection is downloaded
      //    fc.fullCalendar('refetchEvents');
      //find all, because we've already subscribed to a specific range
      var events = Bookings.find({status: {$in: ['pending','confirmed','completed']}}).fetch();
      // mark own or others' bookings (others' red, own with provider name)
      events.forEach(function(book){
        // convert all times according to the user timezone.
        book.start = Session.get('timezone') ? moment(book.start).tz(Session.get('timezone')) : moment(book.start);
        book.end = Session.get('timezone') ? moment(book.end).tz(Session.get('timezone')) : moment(book.end);

        if (Meteor.userId() && book.userId == Meteor.userId()){
          var user = Meteor.users.findOne({_id: book.providerId});
          var uname = user ? user.profile.user.name.charAt(0) + '. ' + user.profile.user.surname : TAPi18n.__('unknown');
          // mark pending appointments
          if (book.status === 'pending') {
            book.tooltip = TAPi18n.__('pending');
            book.color = 'yellow';
            // set it as background to make it available for rebooking
            book.rendering = 'background';
          }
          else {
            book.title = TAPi18n.__("ap_mybooking") + ' ' + uname;
            book.tooltip = TAPi18n.__('appt_with', {assoc: uname, datetime: moment(book.start).format('LLLL')})
          }
        }
        else {
          book.title = TAPi18n.__("ap_booked");
          book.tooltip = book.title;
          book.color = 'red';
        }
      });
      var all = sched ? sched.concat(events) : null;

      // fetch & render gCal events 
      fetchGcalEvents(pId, start, end);

      if (all && all.length > 0) {
        callback(all);
      }
    }
  },
  // a helper to identify clicks on available slots and act accordingly
  onDayClicked: function() {
    return function(date, jsEvent, view){
      var userTZ = Session.get('timezone') ? Session.get('timezone') : 'Europe/London';
      // if user clicked on available slot in the future
      var allowedDate = moment().tz(userTZ).add(params.get().bookingAllowedHours,'hours');
      if (jsEvent.target.classList.contains('fc-bgevent') && date > allowedDate) {
        clicked_booking.set(true);
        start.set(date.tz(userTZ));
      }
    }
  },
  startDate: function() {
    return dateFrom.get();
  },
  disablePrevBtn: function(){
    return function(currentView){
  		var minDate = moment()
  		// Past
  		if (minDate >= currentView.start && minDate <= currentView.end) {
  			$(".fc-prev-button").prop('disabled', true);
  			$(".fc-prev-button").addClass('fc-state-disabled');
  		}
  		else {
  			$(".fc-prev-button").removeClass('fc-state-disabled');
  			$(".fc-prev-button").prop('disabled', false);
  		}
    }
  },
  providerDuration: function(){
    return durationRV.get() ? '00:'+durationRV.get()+':00' : null;
  },
  providerDurationShort: function(){
    return durationRV.get();
  },
  providerInterval: function(){
    return durationRV.get() ? durationRV.get() : 30;
  },
  curLang: function(){
    return TAPi18n.getLanguage();
  },

  // function to set background-color of past slots to white (using eventRender)
  emptyPastSlots: function(){
    return function( event, element, view ) {
      var allowedDate = moment().local().add(params.get().bookingAllowedHours,'hours');
      if (allowedDate > event.start.local() && event.id === 'available') {
        element.css("background-color", "white");
      }
      element.prop('title', event.tooltip);
    }
  },
  userTZ: function() {
    return Session.get('timezone') ? Session.get('timezone') : 'Europe/London';
  },
  workFrom: function(){
    return workFrom.get();
  },
  workTo: function(){
    return workTo.get();
  },
  timeZones: function(){
    const timeZone = Session.get('timezone');
    return _.map(moment.tz.names(), function(t){
      let selected = t === timeZone ? 'selected' : '';
      return {label: t, value: t, selected: selected};
    });
  },
  timezone: function(){
    return Session.get('timezone');
  }
});
Template.tmplBooking.rendered = function() {
    var pId = provId.get();
    // set time zone abbreviation @ axis label (top-left corner)
    let abbr = Session.get('timezone') ? moment().tz(Session.get('timezone')).zoneAbbr() : '';
    let span = '<span title="'+TAPi18n.__('pr_timezone')+': '+abbr+'">'+abbr+'</span>';
    //console.log(abbr);
    // enable reactivity: update calendar when schedule changes or booking is added
    this.autorun(function(){
      $('.fc-axis.fc-widget-header').html(span);
      var fc = $('.fc');
      fetchSchedule(pId);
      Bookings.find().fetch();
      fc.fullCalendar('refetchEvents');
    });
    Meteor.setTimeout(function(){
      $(function(){
        $("#timeZone").select2({
          placeholder: TAPi18n.__("ap_select_placeholder"),
          allowClear: true
        });
      });
    }, 800);
}
Template.tmplBooking.events({
  "click #agreeLink": function(event, template){
    Modal.show('tmplTermsModal');
  },
  "click #tzToggle": function(e,t) {
    $('#tzSelect').toggle();
  },
  'change #timeZone': function (event,t) {
    Session.set('timezone',event.target.value);
    // refresh calendar with new timezone
    let fc = $('.fc');
    let pId = provId.get();

    fetchSchedule(pId);
    Bookings.find().fetch();
    fc.fullCalendar('refetchEvents');
  },
});
