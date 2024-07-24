import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import sweetAlert from 'sweetalert';

Template.tmplAppointments.onCreated(function() {
  DocHead.setTitle(appParams.APP_NAME + ': '+TAPi18n.__('my_appointments'));
  Modal.allowMultiple = true;
  // a reactive var to house the selected appointment id
  selectedAppt = new ReactiveVar(false);
  // a reactive var with questionnaire info (userId, providerId)
  questionFill = new ReactiveVar(false);
  // filter reactive vars
  filterTime = new ReactiveTable.Filter('fltTime', ['start']);
  filterStatus = new ReactiveTable.Filter('fltStatus', ['status']);
  filterUser = new ReactiveTable.Filter('fltUser', ['userId']);
  filterProvider = new ReactiveTable.Filter('fltProv', ['providerId']);
  filterRange = new ReactiveTable.Filter('fltRange', ['start']);
  // set filters to null (in case they were set previously)
  filterTime.set(null);
  filterStatus.set(null);
  filterUser.set(null);
  filterProvider.set(null);
  filterRange.set(null);

  // if admin is editing profile
  if (FlowRouter.getRouteName() === 'adminUser'){
    const uid = FlowRouter.getParam('userId');
    if (isProvider.get()){
      filterProvider.set(uid);
    } else {
      filterUser.set(uid);
    }
  }

  // sorting reactive var
  startSort = new ReactiveVar('ascending');
  // pagination reactive vars
  currentPage = new ReactiveVar(0);
  rowsPerPage = new ReactiveVar(10);
  this.currentPage = currentPage;
  this.rowsPerPage = rowsPerPage;

  // a reactive var to determine if is mobile
  isMobile = new ReactiveVar(window.innerWidth <= 480 ? true : false);
  // assoc Id query param for showing only their appointments
  assocId = new ReactiveVar(null);
  curTime = new ReactiveVar(new Date());
  if (FlowRouter.getQueryParam('provider')) {
    filterProvider.set(FlowRouter.getQueryParam('provider'));
  }
  else if (FlowRouter.getQueryParam('user')) {
    filterUser.set(FlowRouter.getQueryParam('user'));
  }

  var self = this;
  // subscribe only to current page bookings/users/specialities etc.
  if (Roles.userIsInRole(Meteor.user(),['unconfirmed'])) {
    return;
  }
  self.subscribe('specialities');
  var theSubscription = null;
  if (appClient.isAdminExpert()){
    theSubscription =  $("#currentRole").find(":selected").text() == 'Admin' ? 'adminAppts' : 'apptsFiltered';
  } else if (appClient.isAdmin()){
    theSubscription = 'adminAppts';
  } else {
    theSubscription = 'apptsFiltered';
  }
  self.autorun(function(){
    let skipCount = currentPage.get() * rowsPerPage.get();
    self.subscribe(theSubscription,
      skipCount,
      rowsPerPage.get(),
      filterTime.get(),
      filterRange.get(),
      filterStatus.get(),
      filterUser.get(),
      filterProvider.get(),
      startSort.get()
    );
  });
  // subscribe to allusernames for the admin select2 controls
  if (appClient.isAdmin()){
    self.subscribe('allUsernames');
  }
});

Template.tmplAppointments.onRendered(function(){
  $('#infoTooltip').tooltip();
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
  }, 500);
  // initialize datepickers
  Meteor.setTimeout(function () {
    // daterange picker from: http://www.daterangepicker.com/
    let pickerLocale = null;
    let rangeDefinitions = null;
    if (TAPi18n.getLanguage() == 'el'){
      pickerLocale = {
          "format": "DD/MM/YYYY",
          "separator": " - ",
          "applyLabel": "Εφαρμογή",
          "cancelLabel": "Ακύρωση",
          "fromLabel": "Από",
          "toLabel": "Έως",
          "customRangeLabel": "Άλλο",
          "weekLabel": "E",
          "daysOfWeek": [
              "Κυ",
              "Δε",
              "Τρ",
              "Τε",
              "Πε",
              "Πα",
              "Σα"
          ],
          "monthNames": [
              "Ιανουάριος",
              "Φεβρουάριος",
              "Μάρτιος",
              "Απρίλιος",
              "Μάιος",
              "Ιούνιος",
              "Ιούλιος",
              "Αύγουστος",
              "Σεπτέμβριος",
              "Οκτώβριος",
              "Νοέμβριος",
              "Δεκέμβριος"
          ],
          "firstDay": 1
      },
      rangeDefinitions= {
        'Σήμερα': [moment(), moment()],
        'Χθες': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
        'Τελευταία εβδομάδα': [moment().subtract(6, 'days'), moment()],
        'Τελευταίες 30 ημέρες': [moment().subtract(29, 'days'), moment()],
        'Αυτό τον μήνα': [moment().startOf('month'), moment().endOf('month')],
        'Τον προηγούμενο μήνα': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
      }
    } else {
      pickerLocale = {
        "format": "DD/MM/YYYY"
      };
      rangeDefinitions = {
        'Today': [moment(), moment()],
        'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
        'Last 7 Days': [moment().subtract(6, 'days'), moment()],
        'Last 30 Days': [moment().subtract(29, 'days'), moment()],
        'This Month': [moment().startOf('month'), moment().endOf('month')],
        'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
      }
    }
    $('#datePicker').daterangepicker({
      locale: pickerLocale,
      ranges: rangeDefinitions
    });
  }, 300);
  $('#datePicker').on('apply.daterangepicker', function(ev, picker) {
    filterRange.set({
      "$gt": picker.startDate.toDate(), 
      "$lt": picker.endDate.toDate()
    });
  });
});

Template.tmplAppointments.helpers({
  isAdmin: function() {
    if (appClient.isAdminExpert()){
      return $("#currentRole").find(":selected").text().toLowerCase() == 'admin';
    }
    return Roles.userIsInRole(Meteor.user(),'admin');
  },
  allProviders: function(){
    return Meteor.users.find({"roles":'provider'}).fetch().map(function(p){
      return {
        label: p.profile.user.name + ' ' + p.profile.user.surname,
        value: p._id
      };
    });
  },
  allUsers: function(){
    return Meteor.users.find({"roles":'user'}).fetch().map(function(p){
      return {
        label: p.profile.user.name + ' ' + p.profile.user.surname,
        value: p._id
      };
    });
  },
  hasAssoc: function() {
    return filterUser.get() || filterProvider.get();
  },
  canReset: function() {
    return (FlowRouter.getRouteName() !== 'adminUser');
  },
  canSelect: function() {
    return appClient.isAdmin() && FlowRouter.getRouteName() !== 'adminUser';
  },
  assocFullName: function() {
    var user = filterUser.get() ? 
      Meteor.users.findOne({_id: filterUser.get()}) : 
      Meteor.users.findOne({_id: filterProvider.get()});
    return user&&user.profile ? user.profile.user.name + ' ' + user.profile.user.surname : TAPi18n.__('unknown');
  },
  hasBookings: function() {
    return Bookings.find({status: {$ne: 'aborted'}}).fetch();
  },
  tblPastBookings: function() {
    // if associate Id is passed, return only their appointments
    if (assocId.get()){
      return Bookings.find({$or: [{userId: assocId.get()}, {providerId: assocId.get()}], start: {$lt: curTime.get()}, status: {$ne: 'aborted'}});
    }
    return Bookings.find({start: {$lt: curTime.get()}, status: {$ne: 'aborted'}});
  },
  tblUpcomingBookings: function() {
    // if associate Id is passed, return only their appointments
    if (assocId.get()){
      return Bookings.find({$or: [{userId: assocId.get()}, {providerId: assocId.get()}], start: {$gt: curTime.get()}, status: {$ne: 'aborted'}});
    }
    return Bookings.find({start: {$gt: curTime.get()}, status: {$ne: 'aborted'}});
  },
  tblSettings: function() {
    return {
      showRowCount: true,
      //showColumnToggles: true,
      showFilter: false,
      currentPage: Template.instance().currentPage,
      rowsPerPage: Template.instance().rowsPerPage,
      // color each row depending on the status
      rowClass: function(item) {
        var stat = item.status;
        switch (stat) {
          case 'cancelled':
            return 'danger';
          case 'pending':
            return 'warning';
          case 'confirmed':
            return 'success';
          case 'completed':
            return 'info';
          default:
            return '';
        }
      },
      noDataTmpl: Template.noDataTemplate
    };
  },
  // return different fields for each user role
  // possible hack for collection helpers @ https://github.com/aslagle/reactive-table/issues/220
  displayedFields: function() {
   // if provider
   if (Roles.userIsInRole(Meteor.user(),['provider','admin'])){
      // if mobile, show less columns (start, username, status)
      let fieldArray = [
        {
          key:'start',
          label: TAPi18n.__('ap_start'),
          fn: function(value,object){
            return appClient.dateShort(value);
          },
          sortByValue: true,
          sortOrder: 0,
          sortDirection: startSort.get()
        },
        {
          key: 'userFName',
          label: TAPi18n.__('ap_user'),
          sortable: false,
          cellClass: function(v,o) {
            return 'nameCell user';
          },
          fn: function(value, object){
            return Bookings.getUFName(object);
          }
        },
        {	key: 'status',
            label: TAPi18n.__('ap_status'),
            fn: function(value, object){
               return TAPi18n.__(value);
            }, sortable: false
        }
      ];
      if (isMobile.get()){
         return fieldArray;
      }
      else {
        fieldArray.splice(1, 0, { key: 'duration', label: TAPi18n.__('duration_short'), sortable: false});
        if (Meteor.settings.public.face2face){
          fieldArray.splice(1, 0, 
            { 
              key: 'apptType', 
              label: TAPi18n.__('ap_appttype'), 
              sortable: false,
              fn: function(v,o) {
                return v === 'f2f' ? TAPi18n.__('ap_appttype2') : TAPi18n.__('ap_appttype1');
              }
            }
          );
        }
        fieldArray.push({key: 'price',label: TAPi18n.__('ap_price'), sortable: false});
        if (appClient.isAdmin()) {
          fieldArray.splice(3, 0, {
            key: 'providerFName',
            label: TAPi18n.__('ap_provider'),
            sortable: false,
            cellClass: function(v,o) {
              return 'nameCell provider';
            },
            fn: function(value, object){
              return Bookings.getPFName(object);
            }
          });
          fieldArray.push({
            key: 'action',
            label: TAPi18n.__('ap_action'),
            fn: function (value, object) {
              let retStr = `<a href="#" title="${TAPi18n.__('disp_appt')}" class="viewBtn"><i class="fa fa-eye viewBtn"></i></a>`;
              retStr += `&nbsp;<a href="/admin/appointment/${object._id}" title="${TAPi18n.__('edit_appointment')}"><i class="fa fa-edit editBtn"></i></span>`;
              return new Spacebars.SafeString(retStr);
            },
            sortable: false
          });
        }
        return fieldArray;
      }
    }
    // if user
    else if (Roles.userIsInRole(Meteor.user(),['user'])){
      var fieldArray = [
        {
          key:'start',
          label: TAPi18n.__('ap_start'),
          fn: function(value,object){
            return appClient.dateShort(value);
          },
          sortByValue: true,
          sortOrder: 0,
          sortDirection: startSort.get()
        },
        {
          key: 'providerFName',
          label: TAPi18n.__('ap_provider'),
          sortable: false,
          cellClass: function(v,o) {
            return 'nameCell provider';
          },
          fn: function(value, object){
            return Bookings.getPFName(object);
          }
        },
        {	key: 'status',
            label: TAPi18n.__('ap_status'),
            fn: function(value, object){
               return TAPi18n.__(value);
            }, sortable: false
        }
      ];
       // if mobile, show less columns (start, provider name, status)
       if (isMobile.get()){
         return fieldArray;
       }
       else {
        fieldArray.splice(1, 0, { key: 'duration', label: TAPi18n.__('duration_short'), sortable: false});
        if (Meteor.settings.public.face2face){
          fieldArray.splice(1, 0, 
            { 
              key: 'apptType', 
              label: TAPi18n.__('ap_appttype'), 
              sortable: false,
              fn: function(v,o) {
                return v == 'f2f' ? TAPi18n.__('ap_appttype2') : TAPi18n.__('ap_appttype1');
              }
            }
          );
        }
        fieldArray.splice(3, 0, {
          key: 'providerSpecs',
          label: TAPi18n.__('ap_specialities'),
          sortable: false,
          fn: function(value, object){
            return Bookings.getPSpecs(object);
          }
        });
        fieldArray.push({key: 'price',label: TAPi18n.__('ap_price'), sortable: false});
        fieldArray.push(
           // prompt user to fill in questionnaire if they haven't
           {
             key: 'providerId',
             label: TAPi18n.__('ap_action'),
             fn: function (value, object) {
                var hasQuestions = Questions.find({providerId: value}).count();
                var qCount = Questions.find({providerId: value, answers: {$elemMatch: {userId: Meteor.userId()}}}).count();
                let retStr = '<a href="#" title="' + TAPi18n.__('disp_appt') + '" class="viewBtn"><i class="fa fa-eye viewBtn"></i></a>';
                // if already answered or if Provider has no questionnaire 
                if (qCount > 0 || !hasQuestions) {}
                  else
                    retStr += '&nbsp;<a href="#" title="' + TAPi18n.__('disp_quest') + '"><i class="fa fa-question-circle questionBtn"></i></a>';
                // if user has not left a rating
                if (object.status === 'completed' && !object.rating){
                  retStr += '&nbsp;<a href="#" title="' + TAPi18n.__('you_need_rate') + '"><i class="fa fa-warning viewBtn"></i></span>'
                }
              return new Spacebars.SafeString(retStr);
             },
             sortable: false
           });
         return fieldArray;
       }
    } // if user
  },
  fltrs: function() {
    return ['fltTime', 'fltRange', 'fltStatus', 'fltUser', 'fltProv'];
  },
  isProvider: function(){
    return Roles.userIsInRole(Meteor.user(),['provider','unconfirmed']);
  },
  provLinks: function(){
    return FlowRouter.path("providersRoute");
  }
});

Template.tmplAppointments.events({
  'change .user-filter': function (event,t) {
    filterUser.set(document.getElementById('userId').value);
  },
  'change .provider-filter': function (event,t) {
    filterProvider.set(document.getElementById('providerId').value);
  },
  'click .reactive-table tbody tr': function (event) {
    // if user clicks questionnaire button
    if (event.target.className.indexOf("questionBtn") > -1) {
      var booking = Bookings.findOne({_id: this._id});
      var qInfo = {
        userId: booking.userId,
        providerId: booking.providerId
      };
      //console.log(qInfo);
      selectedAppt.set(null);
      questionFill.set(qInfo);
      Modal.show('tmplQuestionnaireAnswer');
    }
    // if user clicks on name
    else if (event.target.className.indexOf("nameCell") > -1) {
      if (appClient.isAdmin() && FlowRouter.getRouteName() == 'adminUser')
        return;
      if (event.target.className.indexOf("user") > -1){
        filterUser.set(this.userId)
      }
      else if (event.target.className.indexOf("provider") > -1){
        filterProvider.set(this.providerId);
      }
    }
    else if (event.target.className.indexOf("editBtn") > -1){}
    else {
      selectedAppt.set(this._id);
      event.preventDefault();
      Modal.show('apptDialog');
    }
  },
  "click #resetAssocBtn": function(event, template) {
    filterUser.set('');
    filterProvider.set('');
    FlowRouter.setQueryParams({assoc: null});
    event.target.display = false;
    $('#userId').val(null).trigger('change');
    $('#providerId').val(null).trigger('change');
  },
  "change .fltTime": function(event, template) {
    var now = new Date();
    var exps = {
      all: '',
      past: {"$lt": now},
      upcoming: {"$gt": now}
    };
    filterTime.set(exps[event.target.value]);
    // change sort order depending on user choice
    if (event.target.value === 'past')
      startSort.set('descending');
    else
      startSort.set('ascending');
  },
  "change .fltStatus": function(event, template) {
    var exps = {
      all: '',
      confirmed: {"$eq": 'confirmed'},
      completed: {"$eq": 'completed'},
      cancelled: {"$eq": 'cancelled'}
    };
    filterStatus.set(exps[event.target.value]);
  },
  "click #toggleFilters": function(event, template) {
    $('#filters').toggle(200);
    $("i", '#toggleFilters').toggleClass("fa-caret-down fa-caret-up");
  },
  "click .sortable.start": function(ev,tmpl){
    if (startSort.get() === 'ascending')
      startSort.set('descending');
    else
      startSort.set('ascending');
  },
  "click #resetFilters": function(ev,tmpl){
    filterTime.set(null);
    filterStatus.set(null);
    filterUser.set(null);
    filterProvider.set(null);
    filterRange.set(null);
    // reset DOM to initial state
    $('input:radio[name=fltTime]').val(['all']);
    $('input:radio[name=fltStatus]').val(['all']);
    $('#userId').val('').trigger('change');
    $('#providerId').val('').trigger('change');
    $('#datePicker').val('').trigger('change')
  }
});
