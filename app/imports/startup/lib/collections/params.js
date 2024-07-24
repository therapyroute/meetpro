// Collection containing app params
Params = new Mongo.Collection("params");
if (Meteor.settings.public.APP_MULTI_CLIENT){
  Partitioner.partitionCollection(Params, {});
}

ParamSchema = new SimpleSchema({
  APP_NAME: {
    type: String,
    max: 80,
    optional: true
  },
  APP_DESCRIPTION: {
    type: String,
    max: 300,
    optional: true
  },
  APP_EMAIL: {
	  type: String,
    regEx: SimpleSchema.RegEx.Email,
    optional: true
  },
  APP_LOGO: {
    type: String,
    optional: true,
    autoform: {
        omit: true
    }
  },
  APP_BKG: {
    type: String,
    optional: true,
    autoform: {
        omit: true
    }
  },
  ADMIN_EMAIL: {
	  type: String,
    regEx: SimpleSchema.RegEx.Email,
    optional: true
  },
  ADMIN_ID: {
	  type: String,
    optional: true
  },
  ADMIN_SUMMARIES: {
    type: Boolean,
    optional: true
  },
  SITE_URL: { type: String, regEx: SimpleSchema.RegEx.Domain, optional: true },
  PRIMARY_LANG: {
    type: String,
    allowedValues: ['el','en'],
    autoform: {
      type: 'select',
      options: function (){return[{label:"EL",value:'el'},{label:"EN",value:'en'}]}
    }
  },
  "enabledPayments": {
    type: [String],
    allowedValues: ['paypal','braintree','viva','stripe','none'],
    optional: true
  },
  "BT_MERCHANT_ID": {
      type: String,
      optional: true,
      autoform: {
        group: 'Braintree'
      }
  },
  "BT_PUBLIC_KEY": {
      type: String,
      optional: true,
      autoform: {
        group: 'Braintree'
      }
  },
  "BT_PRIVATE_KEY": {
    type: String,
    optional: true,
    autoform: {
      type: 'password',
      group: 'Braintree'
    }
  },
  "VP_PUBLIC_KEY": {
      type: String,
      optional: true,
      autoform: {
        group: 'Viva Wallet'
      }
  },
  "VP_MERCHANT_ID": {
    type: String,
    optional: true,
    autoform: {
      group: 'Viva Wallet'
    }
  },
  "VP_API_KEY": {
    type: String,
    optional: true,
    autoform: {
      type: 'password',
      group: 'Viva Wallet'
    }
  },
  "VP_SOURCE": {
    type: String,
    optional: true,
    autoform: {
      group: 'Viva Wallet'
    }
  },
  "STRIPE_API_KEY": {
    type: String,
    optional: true,
    autoform: {
      type: 'password',
      group: 'Stripe Payments'
    }
  },
  "STRIPE_PUBLIC_KEY": {
    type: String,
    optional: true,
    autoform: {
      group: 'Stripe Payments'
    }
  },
  "PAYPAL_CLIENT_ID": {
    type: String,
    optional: true,
    autoform: {
      group: 'Paypal Payments'
    }
  },
  "PAYPAL_SECRET": {
    type: String,
    optional: true,
    autoform: {
      type: 'password',
      group: 'Paypal Payments'
    }
  },
  "currency": {
    type: String,
    optional: true,
    autoform: {
      type: 'select2'
    }
  },
  profileCategory1Enabled: { type: Boolean, optional: true},
  profileCategory1: { type: String, optional: true },
  profileCategory2Enabled: { type: Boolean, optional: true},
  profileCategory2: { type: String, optional: true },
  providersPerPage: { type: Number, min: 1, max: 24 },
  daysCanCancel: { type: Number, min: 0, max: 100 },
  enterInterval: { type: Number, min: 0, max: 30 },
  bookingAllowedHours: { type: Number, min: 0, max: 1000 },
  bookingCharge: { type: Number },
  CLICKATELL_FROM: { 
    type: String, 
    optional: true,
    autoform: {
      group: 'Clickatell SMS'
    }
  },
  workhours_from: { type: String },
  workhours_to: { type: String },
  workhours_tz: { type: String, optional: true },
  bearerToken: { type: String, optional: true },
  subscriptionId: { type: String, optional: true },
  subscriptionStatus: { type: String, optional: true },
  plan: { type: String, optional: true },
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
  updatedAt: {
    type: Date,
    autoValue: function() {
      if (this.isUpdate) {
        return new Date();
      }
    },
    denyInsert: true,
    optional: true,
    autoform: {
      omit: true
    }
  }
});

ParamSchema.i18n("schemas.params");
Params.attachSchema(ParamSchema);