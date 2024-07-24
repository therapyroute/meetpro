import moment from 'moment-timezone';

Template.tmplAgenda.onCreated(function() {
  DocHead.setTitle(appParams.APP_NAME + ': '+TAPi18n.__('my_agenda'));
  Modal.allowMultiple = true;
  questionFill = new ReactiveVar(false);
  selectedAppt = new ReactiveVar(false);

  dateFrom = new ReactiveVar(null);
  dateTo = new ReactiveVar(null);

  var self = this;
  var fc = $('.fc');

  // subscribe reactively to a given range of bookings
  this.autorun(function(){
     if (dateFrom.get()){
      self.subscribe("allUserAppts", Meteor.userId(), dateFrom.get(), dateTo.get(), function(){
        fc.fullCalendar('refetchEvents');
      });
    }
  });
});

Template.tmplAgenda.helpers({
  clickedBooking: function() {
    return selectedAppt.get();
  },
  // a helper to return an array of schedule slots & bookings for rendering @ fullCalendar
  fetchAll: function(){
    return function(start, end, tz, callback) {
      // set start & end datetime ReactiveVars
      dateFrom.set(start.toDate());
      dateTo.set(end.toDate());
      //find all, because we've already subscribed to a specific range
      var bookings = Bookings.find({status: {$ne: 'aborted'}}).fetch();
      // Fetch booking title & set colors
      bookings.forEach(function(book){
        book.start = Session.get('timezone') ? moment(book.start).tz(Session.get('timezone')) : moment(book.start);
        book.end = Session.get('timezone') ? moment(book.end).tz(Session.get('timezone')) : moment(book.end);
        user = Roles.userIsInRole(Meteor.user(),['user','admin']) ?
          Meteor.users.findOne({_id: book.providerId}) :
          Meteor.users.findOne({_id: book.userId});
        if (user) {
          var uname = user.profile.user.name.charAt(0) + '. ' + user.profile.user.surname;
          book.title = uname;
          book.tooltip = TAPi18n.__('appt_with', {assoc: uname, datetime: moment(book.start).format('LLLL')});
          if (book.status === 'pending'){
            book.tooltip += ' (' + TAPi18n.__('pending') + ')';
          }
        }
        let cellColors = {
          cancelled: 'red',
          confirmed: '#32b560',
          completed: '#428bca',
          pending: '#ffa726'
        };
        book.color = cellColors[book.status];
        book.textColor = 'white';
      });
      if (bookings.length > 0) {
        callback(bookings);
      }
    }
  },
  onEventClicked: function() {
    return function(appt, date, jsEvent, view){
        selectedAppt.set(appt._id);
        Modal.show('apptDialog');
    }
  },
  onEventRender: function() {
    return function( event, element, view ) {
      element.prop('title', event.tooltip);
    }
  },
  headerOpts: function() {
    return {center:',agendaDay,agendaWeek,month'};
  },
  fillingQuestions: function() {
    return questionFill.get();
  },
  curLang: function() {
    return TAPi18n.getLanguage();
  },
  userTZ: function() {
    return Session.get('timezone') ? Session.get('timezone') : 'Europe/London';
  },
  workFrom: function(){
    return appParams.workhours_from ? appParams.workhours_from : '08:00:00';
  },
  workTo: function(){
    return appParams.workhours_to ? appParams.workhours_to : '24:00:00';
  }
});
Template.tmplAgenda.rendered = function() {
    // enable reactivity: update calendar when booking is added
    $('#infoTooltip').tooltip();
    var fc = $('.fc');
    this.autorun(function(){
      Bookings.find({status: {$ne: 'aborted'}}).fetch();
      fc.fullCalendar('refetchEvents');
    });
}
