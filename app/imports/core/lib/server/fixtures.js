// Notification templates
// Add sms & email templates
if (NotificationTemplates.find().count() === 0) {
  var notifications = [
    {
      type: 'sms',
      action: 'confirm',
      receiver: 'user',
      topic: '',
      lang: 'en',
      content: '%SITE_NAME%: APPOINTMENT CONFIRMATION WITH %EXPERT%. DATE/TIME: %DATE_TIME%'
    },
    {
      type: 'sms',
      action: 'confirm',
      receiver: 'user',
      topic: '',
      lang: 'el',
      content: '%SITE_NAME%: ΕΠΙΒΕΒΑΙΩΣΗ ΡΑΝΤΕΒΟΥ ΜΕ %EXPERT%. ΗΜ-ΝΙΑ/ΩΡΑ: %DATE_TIME%'
    },
    {
      type: 'sms',
      action: 'remind',
      receiver: 'user',
      topic: '',
      lang: 'en',
      content: '%SITE_NAME%: REMINDER FOR APPOINTMENT WITH %EXPERT%. DATE/TIME: %DATE_TIME%'
    },
    {
      type: 'sms',
      action: 'remind',
      receiver: 'user',
      topic: '',
      lang: 'el',
      content: '%SITE_NAME%: ΥΠΕΝΘΥΜΙΣΗ ΤΟΥ ΡΑΝΤΕΒΟΥ ΜΕ %EXPERT%. ΗΜ-ΝΙΑ/ΩΡΑ: %DATE_TIME%'
    },
    {
      type: 'email',
      action: 'confirm',
      receiver: 'user',
      topic: 'Booking confirmation',
      lang: 'en',
      content: `Dear %CLIENT%,
<br><br>
We are in the pleasant position to confirm your expert appointment via %SITE_NAME%.
<br><br>
<u>The appointment's details are the following:</u><br>
Specialty(ies) requested: <strong>%SERVICE%</strong><br>
Date and time: <strong>%DATE_TIME%</strong><br>
Cost: € <strong>%PRICE%</strong>
<br><br>
<strong>%EXPERT%</strong> will be your expert in this appointment.
<br><br>
When the appointment time approaches, visit the following link and begin chatting:<br>
%CHAT_URL%
<br><br>
Sincerely,
%SITE_NAME%`
    },
    {
      type: 'email',
      action: 'confirm',
      receiver: 'user',
      topic: 'Επιβεβαίωση ραντεβού',
      lang: 'el',
      content: `Αγαπητέ %CLIENT%,
<br><br>
Είμαστε στην ευχάριστη θέση να επιβεβαιώσουμε το ραντεβού σας στο %SITE_NAME%.
<br><br>
<u>Λεπτομέρειες ραντεβού:</u><br>
Ειδικότητα/-ες που ζητήθηκάν: <strong>%SERVICE%</strong><br>
Ημερομηνία και ώρα: <strong>%DATE_TIME%</strong><br>
Κόστος: € <strong>%PRICE%</strong>
<br><br>
Ο/Η <strong>%EXPERT%</strong> θα είναι ο/η ειδικός σας σε αυτό το ραντεβού.
<br><br>
Όταν η ώρα του ραντεβού πλησιάζει, επισκεφθείτε τον παρακάτω σύνδεσμο:<br>
%CHAT_URL%
<br><br>
Με εκτίμηση,
%SITE_NAME%`
    },
    {
      type: 'email',
      action: 'remind',
      receiver: 'user',
      topic: 'Booking reminder',
      lang: 'en',
      content: `Dear %CLIENT%,
<br><br>
We would like to remind you about your expert appointment booked via %SITE_NAME%.
<br><br>
<u>The appointment's details are the following:</u><br>
Specialty(ies) requested: <strong>%SERVICE%</strong><br>
Date and time: <strong>%DATE_TIME%</strong><br>
<br>
<strong>%EXPERT%</strong> will be your Expert in this appointment.
<br>
We would like to remind you that when the appointment time approaches, you need to visit the following link and begin chatting:<br>
%CHAT_URL%
<br><br>
Sincerely,
%SITE_NAME%`
    },
    {
      type: 'email',
      action: 'remind',
      receiver: 'user',
      topic: 'Υπενθύμιση ραντεβού',
      lang: 'el',
      content: `Αγαπητέ %CLIENT%,
<br><br>
Θα θέλαμε να σας υπενθυμίσουμε το ραντεβού σας στο %SITE_NAME%.
<br><br>
<u>Λεπτομέρειες ραντεβού:</u><br>
Ειδικότητα/-ες που ζητήθηκαν: <strong>%SERVICE%</strong><br>
Ημερομηνία και ώρα: <strong>%DATE_TIME%</strong><br>
<br>
Ο/Η <strong>%EXPERT%</strong> θα είναι ο/η ειδικός σας σε αυτό το ραντεβού.
<br>
Όταν η ώρα του ραντεβού πλησιάζει, επισκεφθείτε τον παρακάτω σύνδεσμο:<br>
%CHAT_URL%
<br><br>
Με εκτίμηση,
%SITE_NAME%`
    },
    {
      type: 'email',
      action: 'cancel',
      receiver: 'user',
      topic: 'Booking cancellation',
      lang: 'en',
      content: `Dear %CLIENT%,
<br><br>
We would like to inform you that your expert appointment booked via %SITE_NAME% has been cancelled.
<br><br>
<u>The appointment's details are the following:</u><br>
Specialty(ies) requested: <strong>%SERVICE%</strong><br>
Date and time: <strong>%DATE_TIME%</strong><br>
<br>
Expert <strong>%EXPERT%</strong> has ordered the cancellation.
<br>
Please contact us to re-arrange the appointment, or book a new one.

<br><br>
Sincerely,
%SITE_NAME%`
    },
    {
      type: 'email',
      action: 'cancel',
      receiver: 'user',
      topic: 'Ακύρωση ραντεβού',
      lang: 'el',
      content: `Αγαπητέ %CLIENT%,
<br><br>
Θα θέλαμε να σας ενημερώσουμε ότι το ραντεβού σας στο %SITE_NAME% ακυρώθηκε.
<br><br>
<u>Λεπτομέρειες ραντεβού:</u><br>
Ειδικότητα/-ες που ζητήθηκαν: <strong>%SERVICE%</strong><br>
Ημερομηνία και ώρα: <strong>%DATE_TIME%</strong><br>
<br>
Ο/Η ειδικός <strong>%EXPERT%</strong> πραγματοποίησε την ακύρωση.
<br>
Παρακαλώ επικοινωνήστε μαζί μας για επαναπρογραμματισμό ή κλείστε ένα νέο ραντεβού.<br>
<br><br>
Με εκτίμηση,
%SITE_NAME%`
    },
    {
      type: 'email',
      action: 'confirmationProvider',
      receiver: 'provider',
      topic: 'Expert Confirmation',
      lang: 'en',
      content: `Dear %EXPERT%,
<br><br>
We are happy to notify you that your credentials were confirmed.<br>
You can now login to %SITE_NAME% to fill in your personal info as well as your working schedule, in order to be able to be booked for a video call.
<br>
In %SITE_NAME% you will find all relative help to proceed.
<br><br>
<strong>Warning: </strong> This confirmation does not mean that you are ready to accept bookings.<br>
If you don't complete your profile and working schedule, %SITE_NAME%'s client will not be able to book a video call with you.
<br><br>
We are glad to welcome you to %SITE_NAME% and we hope we will have a pleasant cooperation!
<br><br>
Sincerely,
%SITE_NAME%`
    },
    {
      type: 'email',
      action: 'confirmationProvider',
      receiver: 'provider',
      topic: 'Επιβεβαίωση εγγραφής ειδικού',
      lang: 'el',
      content: `Dear %EXPERT%,
<br><br>
Είμαστε στην ευχάριστη θέση να σας ενημερώσουμε ότι τα στοιχεία σας επιβεβαιώθηκαν.<br>
Μπορείτε τώρα να πραγματοποιήσετε είσοδο στο %SITE_NAME% για να συμπληρώσετε τα επαγγελματικά στοιχεία σας, το βιογραφικό και το πρόγραμμά σας, προκειμένου οι χρήστες μας να μπορούν να κλείσουν ραντεβού μαζί σας.
<br>
Στο %SITE_NAME% θα βρείτε όλες τις σχετικές πληροφορίες και βοήθεια.
<br><br>
<strong>Προσοχή: </strong> Αυτή το μήνυμα επιβεβαίωσης δε σημαίνει ότι μπορείτε άμεσα να δέχεστε ραντεβού.<br>
Αν δεν συμπληρώσετε το προφίλ και το πρόγραμμά σας, οι πελάτες του %SITE_NAME% δε θα μπορούν να κλείσουν ραντεβού μαζί σας.
<br><br>
Σας καλοσωρίζουμε με χαρά στο %SITE_NAME% και ευχόμαστε να έχουμε μια ευχάριστη συνεργασία!
<br><br>
Με εκτίμηση,
%SITE_NAME%
`
    },
    {
      type: 'email',
      action: 'nextday',
      receiver: 'provider',
      topic: 'Tomorrow\'s appointments',
      lang: 'en',
      content: `
<p>
    Dear associate,<br>
    You would like to remind you about the appointments the customers of %SITE_NAME% have booked with you for tomorrow,
    <strong>%DAY%</strong>.<br><br>

    <table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="bodyTable">
      <tr>
        <td align="center" valign="top">
            <table border="1" cellpadding="10" cellspacing="0" width="90%" id="emailContainer">
                <thead>
                  <th style="padding: 10px; text-align: left;">Created At</th><th>Starts At</th><th>User</th>
                </thead>
                <tbody>
                  %TABLE%
                </tbody>
            </table>
        </td>
      </tr>
    </table>
</p>`
    },
    {
      type: 'email',
      action: 'nextday',
      receiver: 'provider',
      topic: 'Ραντεβού Επόμενης Ημέρας',
      lang: 'el',
      content: `
<p>
    Αγαπητέ συνεργάτη,<br>
    Θα θέλαμε να σας υπενθυμίσουμε τα ραντεβού τα οποία έχουν κλείσει οι πελάτες του %SITE_NAME% μαζί σας, αύριο,
    <strong>%DAY%</strong>.<br><br>

    <table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="bodyTable">
      <tr>
        <td align="center" valign="top">
            <table border="1" cellpadding="10" cellspacing="0" width="90%" id="emailContainer">
                <thead>
                  <th style="padding: 10px; text-align: left;">Κλείστηκε στις</th><th>Ξεκινά στις</th><th>Χρήστης</th>
                </thead>
                <tbody>
                  %TABLE%
                </tbody>
            </table>
        </td>
      </tr>
    </table>
</p>`
    },
    {
      type: 'email',
      action: 'summary',
      receiver: 'provider',
      topic: 'Daily Appointment Summary',
      lang: 'en',
      content: `
<p>
    Dear associate,<br>
    We would like to inform you that today, <strong>%DAY%</strong>, the %SITE_NAME% customers have arranged with you the following appointments:
    <br><br>

    <table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="bodyTable">
      <tr>
        <td align="center" valign="top">
            <table border="1" cellpadding="10" cellspacing="0" width="90%" id="emailContainer">
                <thead>
                  <th style="padding: 10px; text-align: left;">Created At</th><th>Starts At</th><th>User</th>
                </thead>
                <tbody>
                  %TABLE%
                </tbody>
            </table>
        </td>
      </tr>
    </table>
</p>`
    },
    {
      type: 'email',
      action: 'summary',
      receiver: 'provider',
      topic: 'Περίληψη ραντεβού ημέρας',
      lang: 'el',
      content: `
<p>
    Αγαπητέ συνεργάτη,<br>
    Θα θέλαμε να σας ενημερώσουμε ότι σήμερα, <strong>%DAY%</strong>, οι πελάτες του %SITE_NAME% έκλεισαν με εσάς τα ακόλουθα ραντεβού:
    <br><br>

    <table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="bodyTable">
      <tr>
        <td align="center" valign="top">
            <table border="1" cellpadding="10" cellspacing="0" width="90%" id="emailContainer">
                <thead>
                  <th style="padding: 10px; text-align: left;">Κλείστηκε στις</th><th>Ξεκινά στις</th><th>Χρήστης</th>
                </thead>
                <tbody>
                  %TABLE%
                </tbody>
            </table>
        </td>
      </tr>
    </table>

</p>`
    },
    {
      type: 'email',
      action: 'adminsummary',
      receiver: 'admin',
      topic: 'Daily Summary',
      lang: 'en',
      content: `
<p>
    Dear admin,<br>
    We would like to inform you that today, <strong>%DAY%</strong>, the %SITE_NAME% customers have booked & completed the following appointments:
    <br><br>
    <h2>Booked Appointments</h2>
    <table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="bodyTable">
      <tr>
        <td align="center" valign="top">
            <table border="1" cellpadding="10" cellspacing="0" width="90%" id="emailContainer">
                <thead>
                  <th>ID</th><th style="padding: 10px; text-align: left;">Created At</th><th>Starts At</th><th>User</th><th>Expert</th><th>Cost</th>
                </thead>
                <tbody>
                  %TABLE1%
                </tbody>
            </table>
        </td>
      </tr>
    </table>
    <br><br>
    <h2>Completed Appointments</h2>
    <table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="bodyTable">
      <tr>
        <td align="center" valign="top">
            <table border="1" cellpadding="10" cellspacing="0" width="90%" id="emailContainer">
                <thead>
                  <th>ID</th><th style="padding: 10px; text-align: left;">Started At</th><th>User</th><th>Expert</th><th>Status</th><th>User joined</th><th>Provider joined</th>
                </thead>
                <tbody>
                  %TABLE2%
                </tbody>
            </table>
        </td>
      </tr>
    </table>
</p>`
    },
    {
      type: 'email',
      action: 'adminsummary',
      receiver: 'admin',
      topic: 'Περίληψη ημέρας',
      lang: 'el',
      content: `
<p>
    Αγαπητέ διαχειριστή,<br>
    Θα θέλαμε να σας ενημερώσουμε ότι σήμερα, <strong>%DAY%</strong>, οι πελάτες του %SITE_NAME% έκλεισαν & πραγματοποίησαν τα ακόλουθα ραντεβού:
    <br><br>
    <h2>Νέα ραντεβού</h2>
    <table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="bodyTable">
      <tr>
        <td align="center" valign="top">
            <table border="1" cellpadding="10" cellspacing="0" width="90%" id="emailContainer">
                <thead>
                  <th>ID</th><th style="padding: 10px; text-align: left;">Κλείστηκε στις</th><th>Ξεκινά στις</th><th>Χρήστης</th><th>ειδικός</th><th>Κόστος</th>
                </thead>
                <tbody>
                  %TABLE1%
                </tbody>
            </table>
        </td>
      </tr>
    </table>
    <br>
    <h2>Ολοκληρωμένα ραντεβού</h2>
    <table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="bodyTable">
      <tr>
        <td align="center" valign="top">
            <table border="1" cellpadding="10" cellspacing="0" width="90%" id="emailContainer">
                <thead>
                  <th>ID</th><th style="padding: 10px; text-align: left;">Έναρξη</th><th>Χρήστης</th><th>ειδικός</th><th>Κατάσταση</th><th>Είσοδος χρήστη</th><th>Είσοδος ειδικού</th>
                </thead>
                <tbody>
                  %TABLE2%
                </tbody>
            </table>
        </td>
      </tr>
    </table>
</p>`
    },
    {
    "type" : "email",
    "action" : "confirmation",
    "receiver" : "user",
    "topic" : "Welcome to %APP_NAME%",
    "lang": "en",
    "content" : `
    <p>
        Dear %NAME% %SURNAME%,<br>
        We would like to welcome you to our service.<br>
        You can now start using %APP_NAME%.<br>
        To book an appointment:<br>
          <ul>
            <li>Log in to the app,</li>
            <li>navigate to the Experts page,</li>
            <li>choose the expert by name, specialty, expertise,</li>
            <li>click the 'Book' button to proceed...</li>
          </ul>
    </p>`
    },
    {
    "type" : "email",
    "action" : "confirmation",
    "receiver" : "user",
    "topic" : "Καλωσήρθατε στο %APP_NAME%",
    "lang": "el",
    "content" : `
    <p>
        Αγαπητέ %NAME% %SURNAME%,<br>
        Θα θέλαμε να σας καλωσορίσουμε στην υπηρεσία μας.<br>
        Μπορείτε ευθύς αμέσως να αρχίσετε να χρησιμοποιείτε το %APP_NAME%.<br>
        Για να κλείσετε ραντεβού:<br>
          <ul>
            <li>Κάντε είσοδο στην εφαρμογή,</li>
            <li>επισκεφθείτε τη σελίδα των ειδικών,</li>
            <li>επιλέξτε τον ειδικό που επιθυμείτε βάσει επωνύμου, ειδικότητας,</li>
            <li>κάντε κλίκ στο κουμπί 'Ραντεβού' για να προχωρήσετε...</li>
          </ul>
    </p>`
    }
  ];
  _.each(notifications, function (notification) {
    id = NotificationTemplates.insert(notification);
  });
};
