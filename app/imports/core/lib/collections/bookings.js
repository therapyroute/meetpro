// Collection containing all booking info

Bookings = new Meteor.Collection("bookings");
if (Meteor.settings.public.APP_MULTI_CLIENT){
  Partitioner.partitionCollection(Bookings, {});
}

Schema = {};

Schema.transSchema = new SimpleSchema({
  trans_type: {
    type: String
  },
  trans_orderid: {
    type: String
  },
  trans_data: {
    type: String
  },
  trans_amount: {
    type: Number,
    decimal: true
  },
  trans_status: {
    type: String
  },
  updatedAt: {
    type: Date,
    autoValue: function() {
      if (this.isUpdate) {
        return new Date();
      }
    },
    denyInsert: true,
    optional: true
  }
});

Schema.ratingSchema = new SimpleSchema({
  rating: {
    type: Number,
    label: "Rating"
  },
  comment: {
    type: String,
    label: "Comment",
    optional: true,
    max: 400
  }
});

Schema.notificationSchema = new SimpleSchema({
  nType: {
    type: String
  },
  nCreated: {
    type: Date
  },
  nReceiver: {
    type: String
  },
  nStatus: {
    type: String,
    defaultValue: 'unknown'
  }
});
Schema.callMsgSchema = new SimpleSchema({
   datetime: {
     type: Date
   },
   level: {
     type: String
   },
   msg: {
     type: String
   }
});

Schema.callSchema = new SimpleSchema({
  userPeerId: {
    type: String,
    optional: true
  },
  userJoinedAt: {
    type: Date,
    optional: true
  },
  userOnline: {
    type: Boolean,
    optional: true
  },
  providerPeerId: {
    type: String,
    optional: true
  },
  providerJoinedAt: {
    type: Date,
    optional: true
  },
  providerOnline: {
    type: Boolean,
    optional: true
  },
  messages: {
    type: [Schema.callMsgSchema],
    optional: true
  }
});

Schema.bookingSchema = new SimpleSchema({
  // only userids
  userId: {
    type: String,
    label: "User Id",
  },
  providerId: {
    type: String,
    label: "Provider Id",
  },
  start: {
    type: Date,
    label: "Start"
  },
  end: {
    type: Date,
    label: "End"
  },
  status: {
    type: String,
    label: "Booking Status"
  },
  note: {
    type: String,
    label: "Booking note",
    optional: true
  },
  payment: {
    type: String,
    label: 'Payment type'
  },
  price: {
    type: Number,
    label: "Booking price",
    decimal: true
  },
  notifications: {
    type: [Schema.notificationSchema],
    label: "Booking sent notifications",
    optional: true
  },
  transactions: {
    type: [Schema.transSchema],
    optional: true
  },
  rating: {
    type: Schema.ratingSchema,
    optional: true
  },
  call: {
    type: Schema.callSchema,
    optional: true
  },
  apptType: {
    type: String,
    optional: true
  },
  duration: {
    type: Number,
    optional: true
  },
  createdAt: {
    type: Date,
    autoValue: function() {
      if (this.isInsert) {
        return new Date();
      } else if (this.isUpsert) {
        return {$setOnInsert: new Date()};
      } else {
        this.unset();  // Prevent user from supplying their own value
      }
    }
  },
  // Force value to be current date (on server) upon update
  // and don't allow it to be set upon insert.
  updatedAt: {
    type: Date,
    autoValue: function() {
      if (this.isUpdate) {
        return new Date();
      }
    },
    denyInsert: true,
    optional: true
  }
});

Bookings.attachSchema(Schema.bookingSchema);
