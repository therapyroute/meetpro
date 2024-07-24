import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

/*
All app routes are defined here...
*/

// Define public and private (logged-in) route groups
publicRoutes = FlowRouter.group({
  waitOn() {
    return [
      import('/imports/core'),
      import('/imports/profile'),
      import('/imports/bookings'),
      import('/imports/chat'),
    ];
  }
});

// @bookings package
// called with /booking/id
publicRoutes.route('/book/:providerId', {
  name: "publicBookingRoute",
  action: function () {
    BlazeLayout.render("noSidebarLayout", { content: "tmplBooking", menu: "mpNavbar", footer: "imFooter" });
  }
});

publicRoutes.route('/meet/:bookingId/:userId', {
  name: "publicChatRoute",
  action: function () {
    BlazeLayout.render("noSidebarLayout", { content: "tmplChatPublic", menu: "mpNavbar", footer: "imFooter" });
  }
});

publicRoutes.route('/oauth', {
  name: "publicWordpress",
  action: function () {
    BlazeLayout.render("noSidebarLayout", { content: "tmplWordpress", menu: "mpNavbar", footer: "imFooter" });
  }
});

publicRoutes.route('/welcome', {
  name: "publicWelcome",
  action: function () {
    BlazeLayout.render("noSidebarLayout", { content: "tmplWelcome", menu: "mpNavbar", footer: "imFooter" });
  }
});

// @profile package
// called with /expert/id
publicRoutes.route('/expert/:providerId', {
  name: "providerRoute",
  action: function () {
    BlazeLayout.render("mainLayout", { content: "tmplProfile", menu: "mpNavbar", footer: "imFooter" });
  }
});

// access by /user/<route>
// if not logged-in redirect to '/'
privateRoutes = FlowRouter.group({
  triggersEnter: [function (context, redirect, stop) {
    if (!Meteor.userId()) {
      console.log('Error: Not logged-in');
      redirect('notPermitted');
    }
  }],
  waitOn() {
    return [
      import('/imports/core'),
      import('/imports/profile'),
      import('/imports/bookings'),
    ];
  }
});
adminRoutes = FlowRouter.group({
  triggersEnter: [function (context, redirect, stop) {
    if (!Meteor.userId() || !Roles.userIsInRole(Meteor.user(), ['admin'])) {
      console.log('Error: Not logged-in or not admin');
      redirect('notPermitted');
    }
  }],
  waitOn() {
    return [
      import('/imports/core'),
      import('/imports/profile'),
      import('/imports/bookings'),
      import('/imports/admin')
    ];
  }
})
// nested route group: access by /user/p/<route>
providerRoutes = privateRoutes.group({
  prefix: '/p',
});

// Define routes per package
//////////////////
// public routes
//////////////////
publicRoutes.route('/', {
  name: "Home",
  action: function (params, queryParams) {
    // check if booking is requested
    if (queryParams.book) {
      //if logged-in, set 'redirectTo' session var
      Session.set('redirectTo', {
        path: 'bookingRoute',
        params: { 'providerId': queryParams.book }
      });
    }
    if (Meteor.userId()) {
      if (Roles.userIsInRole(Meteor.user(), ['admin']) && !Roles.userIsInRole(Meteor.user(), ['provider'])) {
        FlowRouter.go('adminDashboard');
      } else {
        FlowRouter.go('commonDashboard');
      }
    }
    else {
      BlazeLayout.render("mainLayout", { content: "tmplSignIn", menu: "mpNavbar", footer: "imFooter" });
    }
  }
});

publicRoutes.route('/forbidden', {
  name: "notPermitted",
  action: function () {
    BlazeLayout.render("mainLayout", { content: "tmplNotPermitted", menu: "mpNavbar" });
  }
});

publicRoutes.route('/expired', {
  name: "notActive",
  action: function () {
    BlazeLayout.render("mainLayout", { content: "tmplNotActive", menu: "mpNavbar" });
  }
});

publicRoutes.route('/terms-of-use', {
  name: "termsRoute",
  action: function () {
    BlazeLayout.render("mainLayout", { content: "tmplTerms", menu: "mpNavbar" });
  }
});

/////////////////
// private routes
/////////////////
// admin routes
adminRoutes.route('/admin', {
  name: "adminDashboard",
  action: function () {
    BlazeLayout.render("mainLayout", { content: "tmplAdminDashboard", menu: "mpNavbar", footer: "imFooter" });
  }
});
adminRoutes.route('/admin/appointments', {
  name: "adminAppointments",
  action: function () {
    BlazeLayout.render("mainLayout", { content: "tmplAdminAppointments", menu: "mpNavbar", footer: "imFooter" });
  }
});
adminRoutes.route('/admin/appointment/:bookingId', {
  name: "adminEditAppointment",
  action: function () {
    BlazeLayout.render("mainLayout", { content: "tmplEditAppointment", menu: "mpNavbar", footer: "imFooter" });
  }
});
adminRoutes.route('/admin/addappointment', {
  name: "adminAddAppointment",
  action: function () {
    BlazeLayout.render("mainLayout", { content: "tmplAddAppointment", menu: "mpNavbar", footer: "imFooter" });
  }
});
adminRoutes.route('/admin/users', {
  name: "adminUsers",
  action: function () {
    BlazeLayout.render("mainLayout", { content: "tmplAdminUsers", menu: "mpNavbar", footer: "imFooter" });
  }
});
adminRoutes.route('/admin/user/:userId', {
  name: "adminUser",
  action: function () {
    BlazeLayout.render("mainLayout", { content: "tmplProfileEdit", menu: "mpNavbar", footer: "imFooter" });
  }
});
adminRoutes.route('/admin/adduser', {
  name: "adminAddUser",
  action: function () {
    BlazeLayout.render("mainLayout", { content: "tmplAdminAddUser", menu: "mpNavbar", footer: "imFooter" });
  }
});
adminRoutes.route('/admin/params', {
  name: "adminParams",
  action: function () {
    BlazeLayout.render("mainLayout", { content: "tmplAdminParams", menu: "mpNavbar", footer: "imFooter" });
  }
});
adminRoutes.route('/admin/stats', {
  name: "adminStats",
  action: function () {
    BlazeLayout.render("mainLayout", { content: "tmplStatistics", menu: "mpNavbar", footer: "imFooter" });
  }
});
adminRoutes.route('/admin/logs', {
  name: "adminLogs",
  action: function () {
    BlazeLayout.render("mainLayout", { content: "tmplAdminLogs", menu: "mpNavbar", footer: "imFooter" });
  }
});
adminRoutes.route('/admin/tables', {
  name: "adminTables",
  action: function () {
    BlazeLayout.render("mainLayout", { content: "tmplAdminTable", menu: "mpNavbar", footer: "imFooter" });
  }
});
adminRoutes.route('/admin/apps', {
  name: "adminApps",
  action: function () {
    BlazeLayout.render("mainLayout", { content: "tmplAdminApps", menu: "mpNavbar", footer: "imFooter" });
  }
});
// Billing related code - left for future reference
// adminRoutes.route('/admin/financial', {
//   name: "adminFinancial",
//   action: function () {
//     BlazeLayout.render("mainLayout", { content: "tmplInvoicesAdmin", menu: "mpNavbar", footer: "imFooter" });
//   }
// });

privateRoutes.route('/experts', {
  name: "providersRoute",
  action: function () {
    BlazeLayout.render("mainLayout", { content: "tmplProviders", menu: "mpNavbar" });
  }
});

privateRoutes.route('/experts/:page', {
  name: "providersRoutePage",
  action: function () {
    BlazeLayout.render("mainLayout", { content: "tmplProviders", menu: "mpNavbar" });
  }
});

privateRoutes.route('/dashboard', {
  name: "commonDashboard",
  action: function () {
    if (Roles.userIsInRole(Meteor.user(), ['admin']) && !Roles.userIsInRole(Meteor.user(), ['provider'])) {
      FlowRouter.go('adminDashboard');
    }
    BlazeLayout.render("mainLayout", { content: "tmplDashboard", menu: "mpNavbar" });
  }
});
privateRoutes.route('/profile', {
  name: "commonProfile",
  action: function () {
    BlazeLayout.render("mainLayout", { content: "tmplProfileEdit", menu: "mpNavbar" });
  }
});
privateRoutes.route('/agenda', {
  name: "commonAgenda",
  action: function () {
    BlazeLayout.render("mainLayout", { content: "tmplAgenda", menu: "mpNavbar" });
  }
});
privateRoutes.route('/bookings', {
  name: "commonBookings",
  action: function () {
    BlazeLayout.render("mainLayout", { content: "tmplBookings", menu: "mpNavbar" });
  }
});
privateRoutes.route('/appointments/:apptId', {
  name: "commonAppointmentsWithId",
  action: function () {
    BlazeLayout.render("mainLayout", { content: "tmplAppointments", menu: "mpNavbar" });
  }
});
privateRoutes.route('/appointments/', {
  name: "commonAppointments",
  action: function () {
    BlazeLayout.render("mainLayout", { content: "tmplAppointments", menu: "mpNavbar" });
  }
});
privateRoutes.route('/messages', {
  name: "commonMessages",
  action: function () {
    BlazeLayout.render("mainLayout", { content: "tmplMessages", menu: "mpNavbar" });
  }
});
privateRoutes.route('/messages/:msgId', {
  name: "commonMessagesWithId",
  action: function () {
    BlazeLayout.render("mainLayout", { content: "tmplMessages", menu: "mpNavbar" });
  }
});
privateRoutes.route('/associates/', {
  name: "commonAssociates",
  action: function () {
    BlazeLayout.render("mainLayout", { content: "tmplAssociates", menu: "mpNavbar" });
  }
});
privateRoutes.route('/checkrtc', {
  name: "commonCheck",
  action: function () {
    BlazeLayout.render("mainLayout", { content: "tmplWebRTC", menu: "mpNavbar" });
  }
});
// privateRoutes.route('/testchat', {
//   name: "testChat",
//   action: function () {
//     BlazeLayout.render("mainLayout", { content: "tmplTestChat", menu: "mpNavbar" });
//   },
//   triggersExit: [chatClose]
// });
privateRoutes.route('/assoc/:assocId', {
  name: "commonAssociate",
  action: function () {
    BlazeLayout.render("mainLayout", { content: "tmplAssociate", menu: "mpNavbar" });
  }
});
privateRoutes.route('/chat/:bookingId', {
  name: "commonChatWithId",
  waitOn() {
    return import('/imports/chat');
  },
  action: function () {
    BlazeLayout.render("mainLayout", { content: "tmplChat", menu: "mpNavbar" });
  },
  triggersExit: [chatClose]
});
// user-only routes
// should check if 'user' @ onRendered
privateRoutes.route('/files', {
  name: "userFiles",
  action: function () {
    BlazeLayout.render("mainLayout", { content: "tmplFiles", menu: "mpNavbar" });
  }
});

// provider-only routes
// should check if 'provider' @ onRendered
providerRoutes.route('/statistics', {
  name: "commonStatistics",
  action: function () {
    BlazeLayout.render("mainLayout", { content: "tmplStatistics", menu: "mpNavbar" });
  }
});

providerRoutes.route('/schedule', {
  name: "commonSchedule",
  action: function () {
    BlazeLayout.render("mainLayout", { content: "tmplSchedule", menu: "mpNavbar" });
  }
});

// @bookings package
// called with /booking/id
privateRoutes.route('/booking/:providerId', {
  name: "bookingRoute",
  action: function () {
    BlazeLayout.render("mainLayout", { content: "tmplBooking", menu: "mpNavbar", footer: "imFooter" });
  }
});
// Payment landing page
privateRoutes.route('/result', {
  name: "paymentResult",
  action: function () {
    let theLayout = Session.get('guest') ? 'noSidebarLayout' : 'mainLayout';
    BlazeLayout.render(theLayout, { content: "tmplPaymentResult", menu: "mpNavbar" });
  }
});
// Payment cancel page
privateRoutes.route('/cancel', {
  name: "paymentCancel",
  action: function () {
    BlazeLayout.render("mainLayout", { content: "tmplPaymentCancel", menu: "mpNavbar" });
  }
});
privateRoutes.route('/contact', {
  name: "commonContact",
  action: function () {
    BlazeLayout.render("mainLayout", { content: "tmplContact", menu: "mpNavbar" });
  }
});
// Catch-all route
FlowRouter.route('*', {
  action() {
    // If not logged-in, search if path is a client app
    if (!Meteor.userId()) {
      let theApp = FlowRouter.current().path.slice(1);
      //console.log(theApp);
      Meteor.call('getTenant', theApp, function(error, result) { 
        // if not found, show a 404 page
        if (error) { 
          //console.log('error', error); 
          BlazeLayout.render('mainLayout', { content: 'tmpl404Page', menu: "mpNavbar" });
        } 
        // if found, load params, logo & login background
        if (result) { 
          Session.set('appLogo', result.APP_LOGO);
          Session.set('appBkg', result.APP_BKG);
          window.appParams = result;
          // set app & login & moment default language (from settings.json)
          let defaultLang = result.PRIMARY_LANG;
          if (defaultLang == 'el') {
            i18n.setLanguage('gr');
          } else {
            i18n.setLanguage('en');
          }
          TAPi18n.setLanguage(defaultLang)
          T9n.setLanguage(defaultLang);
          moment.locale(defaultLang);
          // Map useraccounts language custom field tags
          T9n.map('el',{
            'Name': 'Όνομα',
            'Surname': 'Επώνυμο',
            'I am an expert': 'Είμαι ειδικός',
            'terms': 'Όρους Χρήσης',
            'clickAgree': 'Πατώντας Εγγραφή, συμφωνείτε με τους',
            'and': 'και τους',
            'Verification email lost?': 'Χάσατε το email επιβεβαίωσης;',
            'Send again': 'Αποστολή ξανά',
            'Send email again': 'Επαναποστολή email',
            'Send the verification email again': 'Επαναποστολή του email επιβεβαίωσης',
            'Internal server error': 'Εσωτερικό σφάλμα διακομιστή',
            'undefined': 'Άγνωστο σφάλμα',
            'Minimum required length: 6': 'Ελάχιστο απαιτούμενο μήκος: 6',
            'passwordValidation': 'Εισάγετε τουλάχιστον 1 ψηφίο, 1 μικρό & 1 κεφαλαίο γράμμα.',
            'Invalid email': 'Μη έγκυρο email',
            'requiredField': 'Απαιτούμενο πεδίο'
          });
          T9n.map('en',{
            'requiredField': 'Required field',
            'passwordValidation': 'Insert at least 1 digit, 1 lower-case and 1 upper-case character.'
          });
          BlazeLayout.render("mainLayout", { content: "tmplSignIn", menu: "mpNavbar", footer: "imFooter" });
        } 
      });
    }
  }
});


// called when user leaves the chat route
function chatClose(context) {
  console.log('Clicked another route. Exiting chat...');
  if (window.myConnection) {
    // ensure all streams are stopped before exiting...
    window.myConnection.attachStreams.forEach(function (stream) {
      stream.stop();
    });
    // disconnect @ collection
    if (typeof bookingId != 'undefined') {
      Meteor.call("disconnectPeer", bookingId, function (error, result) {
        if (error) {
          console.log("error", error);
        }
        if (result) {
          console.log('offline @ collection');
        }
      });
      window.bookingId = null;
    }
    // cleanup room
    if (window.myConnection.isInitiator) {
      window.myConnection.closeEntireSession(function () {
        console.log('Initiator closed the session...');
      });
    }
    else {
      window.myConnection.leave();
      console.log('left the session...');
    }
    window.myConnection = null;
  }
}
