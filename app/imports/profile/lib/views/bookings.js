Template.tmplBookings.onCreated(function() {
  bookingsView = new ReactiveVar('table');
});

Template.tmplBookings.helpers({
  isAgenda: function() {
    return bookingsView.get() == 'agenda';
  }
});

Template.tmplBookings.events({
  "click .segmented label input": function(event, template){
     bookingsView.set(event.target.value)
  }
});
