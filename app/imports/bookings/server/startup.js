import moment from 'moment-timezone';

Meteor.startup(function() {
  // On server startup, look for unscheduled reminders. If found, schedule them...
  if (Reminders){
  	Reminders.find().forEach(function(rem) {
      // if found past reminders, delete them
      if (moment(rem.date).tz(rem.tz) < moment().tz(Meteor.settings.private.SRV_TZ)) {
        Reminders.remove(rem._id);
  		} else {
  			appReminders.addReminder(rem._id, rem);
  		}
  	});
  }
  SyncedCron.config({
    // use UTC to avoid confusion
    // EEST = UTC + 3, EET = UTC + 2 
    utc: true,
  });
  // schedule next day booking job (every day @ 21.00 EEST or 20.00 EET)
  SyncedCron.add({
    name: 'nextDay',
    schedule: function(parser) {
      return parser.recur().on('18:00:00').time();
    },
    job: function() {
      appNotifications.sendBookingSummary('nextday', function(error, result){
        if(error){
          appCommon.appLog({level: 'error', content: 'Error while sending next day summary'});
          console.log("error", error);
          return error;
        }
        if(result){
          return result;
        }
      });
    }
  });

  // schedule daily booking summary job (every day @ 23.30 EEST or 22.30 EET)
  SyncedCron.add({
    name: 'summary',
    schedule: function(parser) {
      return parser.recur().on('20:30:00').time();
    },
    job: function() {
      appNotifications.sendBookingSummary('summary', function(error, result){
        if(error){
          appCommon.appLog({level: 'error', content: 'Error while sending daily booking summary'});
          console.log("error", error);
          return error;
        }
        if(result){
          return result;
        }
      });
    }
  });

  // schedule daily admin summary job (every day @ 23.45 EEST or 22.45 EET)
  SyncedCron.add({
    name: 'adminsummary',
    schedule: function(parser) {
      return parser.recur().on('20:45:00').time();
    },
    job: function() {
      if (Meteor.settings.public.APP_MULTI_CLIENT) {
        appNotifications.sendAdminSummaryMulti(function(error, result) {
          if(error) {
            appCommon.appLog({level: 'error', content: 'Error while sending admin summary'});
            console.log("error", error);
            return error;
          }
          if(result){
            return result;
          }
        });
      } else {
        appNotifications.sendAdminSummary(function(error, result) {
          if(error) {
            appCommon.appLog({level: 'error', content: 'Error while sending admin summary'});
            console.log("error", error);
            return error;
          }
          if(result){
            return result;
          }
        });
      }
    }
  });

	SyncedCron.start();
});
