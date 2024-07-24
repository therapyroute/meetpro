import moment from 'moment-timezone';

// Create and handle Reminders
// taken from http://richsilv.github.io/meteor/scheduling-events-in-the-future-with-meteor/

Reminders = new Mongo.Collection("reminders");

// details:
// type: email, sms, summary
// lang, to, subject, text
appReminders = {
  // send a reminder (ordered by SyncedCron @ scheduled time)
  sendReminder(details) {
    if (details.type == 'email') {
      var emObj = {
        lang: details.lang,
        to: details.to,
        subject: details.subject,
        text: details.text,
        paramsId: details.paramsId
      };
      appCommon.appSendMail (emObj);
    }
    else if (details.type == 'sms') {
      appCommon.sendSMS(details.text, details.to, details.lang);
    }
    else
      throw new Meteor.Error('unknown reminder','Unknown reminder type!');
  },
  // add a reminder to SyncedCron
  addReminder(id, details) {
  	SyncedCron.add({
  		name: id,
  		schedule: function(parser) {
  			return parser.recur().on(details.date).fullDate();
  		},
  		job: function() {
  			appReminders.sendReminder(details);
  			Reminders.remove(id);
  			SyncedCron.remove(id);
  	    return id;
  		}
  	});
  },
  scheduleReminder(details) {
    var txt = 'Added reminder ' + details.type + ' to ' + details.to;
    console.log(txt);
    appCommon.appLog({content: txt});
    //console.log(details);
  	if (details.date < moment().tz(details.tz)) {
  		this.sendReminder(details);
  	} else {
  		var thisId = Reminders.insert(details);
  		this.addReminder(thisId, details);
  	}
  	return true;
  }
}
