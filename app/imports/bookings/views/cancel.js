import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

Template.tmplPaymentResult.onCreated(function(){
  DocHead.setTitle(appParams.APP_NAME);
});
