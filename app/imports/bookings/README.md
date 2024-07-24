bookings package

**Bookings**
------------

### Notifications & Cron jobs ###
** see notifications.js **
* send SMS, emails after booking
* send reminder emails XX days/hours before


### Booking states:
- aborted (when user aborts the booking)
- cancelled (when user/provider cancels the appointment)
- pending (between choosing datetime & confirming payment)
- confirmed (when payment is confirmed)
- completed (when appointment is completed successfully)

When a user creates a booking, it gets a 'pending' state until the payment is confirmed.

When payment is confirmed, state changes to 'confirmed' & transaction is inserted to booking record (see booking collection).

If they cancel during any step, pending booking is deleted.
