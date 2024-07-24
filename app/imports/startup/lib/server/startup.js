// Initialize params on the server
import { HTTP } from 'meteor/http'

Meteor.http = HTTP

if (Meteor.settings.public.APP_MULTI_CLIENT == 'true'){
  console.log('App running in Multi-Client mode...');
}

if (Meteor.settings.public.APP_MULTI_CLIENT && !this.userId){
  appParams = {};
  appParams.APP_NAME = Meteor.settings.public.APP_NAME;
  appParams.APP_EMAIL = 'a@b.com';
  appParams.APP_LOGO = '';
  appParams.CLICKATELL_FROM = '';
  appParams.ADMIN_EMAIL = 'admin@asd.com';
  appParams.currentRole = '';
} else {
  appParams = {
    currentRole: ''
  }
}
