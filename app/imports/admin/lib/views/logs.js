Template.tmplAdminLogs.onCreated(function() { 
  DocHead.setTitle(appParams.APP_NAME + ': '+TAPi18n.__('sb_logs'));
});
Template.tmplAdminLogs.helpers({
  displayedFields : function() {
     let fieldArray = [
        {
          key: 'datetime',
          label: TAPi18n.__('date'),
          fn: function(value,object){
            return appClient.dateShort(value);
          }
        },
        {key: 'fname',label: TAPi18n.__('ap_user')},
        {key: 'content',label: TAPi18n.__('msg_message')},
        {key: 'level',label: TAPi18n.__('fl_type')}
     ];
     if (appClient.isSuperAdmin()){
      fieldArray.push({
        key: 'groupId',label: 'App',
        sortable: false
      });
    }
    return fieldArray;
  }
});