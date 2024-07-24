import { Array } from 'core-js';
import { Random } from 'meteor/random';

Meteor.methods({ 
  getParams: function() { 
    // Initialize parameters
    if (Params.find().count() === 0 && Meteor.settings.public.APP_MODE === 'dev') {
      let param = {
        APP_EMAIL: "info@meetpro.live",
        ADMIN_EMAIL: Meteor.settings.private.ADMIN_EMAIL,
        ADMIN_SUMMARIES: true,
        SITE_URL: "meetpro.live",
        PRIMARY_LANG: Meteor.settings.public.DEFAULT_LANG,
        BT_MERCHANT_ID: "id",
        BT_PUBLIC_KEY: "key",
        BT_PRIVATE_KEY: "key",
        VP_PUBLIC_KEY: "key",
        VP_MERCHANT_ID: "id",
        VP_API_KEY: "key",
        VP_SOURCE: "0",
        providersPerPage: 12,
        daysCanCancel: 2,
        enterInterval: 5,
        bookingAllowedHours: 4,
        bookingCharge: 0,
        CLICKATELL_FROM: "meetpro",
        workhours_from: "07:00",
        workhours_to: "17:00",
        workhours_tz: "Europe/London",
        bearerToken: Random.secret(),
        subscriptionId: 'demo',
        subscriptionStatus: 'active',
        plan: 'pro'
      };
      Params.insert(param);
      console.log('Params inserted');
    }

    let pFields = {
      'BT_PRIVATE_KEY': 0,
      'VP_MERCHANT_ID': 0,
      'VP_API_KEY': 0,
      'VP_SOURCE': 0,
      'PAYPAL_SECRET': 0,
      'bearerToken': 0,
      'subscriptionId': 0
    }
    let theParams = Params.findOne({}, { fields: pFields });
    if (theParams.subscriptionStatus !== 'active') {
      throw new Meteor.Error('inactive','Subscription is inactive. Please renew or contact administrator.');
    }
    else {
      return theParams;
    }
  },
  getTenants: function() {
    let params = Params.direct.find().fetch();
    if (!params) {
      throw new Meteor.Error('error','No tenants in database');
    }
    let theData = [{"text":'',"value":''}];
    params.forEach(app => {
      let appName = app.APP_NAME ? app.APP_NAME : app._groupId;
      theData.push({"text": appName, "value": app._groupId});
    });
    return theData;
  },
  getTenant: function(tenant) {
    let pFields = {
      'BT_PRIVATE_KEY': 0,
      'VP_MERCHANT_ID': 0,
      'VP_API_KEY': 0,
      'VP_SOURCE': 0,
      'PAYPAL_SECRET': 0,
      'bearerToken': 0,
    }
    let params = Params.direct.findOne({_groupId: tenant}, { fields: pFields });
    if (!params) {
      throw new Meteor.Error('error','Tenant not found in database');
    } else {
      return params;
    }
  },
  getTenantById: function(id) {
    let pFields = {
      'BT_PRIVATE_KEY': 0,
      'VP_MERCHANT_ID': 0,
      'VP_API_KEY': 0,
      'VP_SOURCE': 0,
      'PAYPAL_SECRET': 0,
      'bearerToken': 0,
    }
    let params = Params.direct.findOne({_id: id}, { fields: pFields });
    if (!params) {
      throw new Meteor.Error('error','Tenant not found in database');
    } else {
      return params;
    }
  },
  // update appParams with the current role, in case user is admin & provider
  updateCurrentRole: function(role) {
    return appParams.currentRole = role;
  }
});