AutoForm.addHooks("contactForm", {
  onSuccess: function () {
    sAlert.success(TAPi18n.__("cf_success"));
  },
  onError: function (type,error) {
    sAlert.error(TAPi18n.__("cf_error") + ': ' + error);
    console.log(error);
  }
});

Template.tmplContact.onCreated(function(){
  DocHead.setTitle(appParams.APP_NAME + ': '+TAPi18n.__('cf_title'));
});
