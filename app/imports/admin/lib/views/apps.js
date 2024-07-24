
Template.tmplAdminApps.onCreated(function() { 
   curDoc = new ReactiveVar(null);
   selectedTable = new ReactiveVar(null);
   selectedApp = new ReactiveVar(null);
   apps = new ReactiveVar(null);
   let self = this;
  //  self.autorun(function() { 
  //   self.subscribe('adminTable', selectedTable.get());
  //  });
   DocHead.setTitle(appParams.APP_NAME + ': '+TAPi18n.__('appdata'));
   Meteor.call('getTenantsExtended', function(error, items) { 
    if (error) { 
      console.log('error', error); 
    } 
    if (items) { 
      apps.set(items);
    } 
  });
});

Template.tmplAdminApps.helpers({
  displayedFields: function(){
      var fieldArray = [
        {key:'name',label: 'Name'},
        {key:'description',label: 'Description'},
        {key:'email',label: 'e-mail'},
        {key:'lang', label: 'Language'},
        {key:'subscription', label: 'Subscription ID'},
        {key:'status', label: 'Subcription Status'},
        {key:'plan', label: 'Plan'},
        {key:'id', label: 'id', hidden: true }
      ];
      fieldArray.push({
        key: 'action',label: TAPi18n.__('ap_action'),
        fn: function (value, object) {
          let retStr = `<a href="#" title="${TAPi18n.__('msg_view')}" class="viewRow"><i class="fa fa-eye viewRow"></i></a>`;
          //let retStr = `<a href="#" title="${TAPi18n.__('msg_delete')}" class="deleteRow"><i class="fa fa-trash deleteRow"></i></a>`;
          return new Spacebars.SafeString(retStr);
        },
        sortable: false
      });
    return fieldArray;
  },
  appData: function() {
    return apps.get() ? apps.get() : null;
  } 
});

Template.tmplAdminApps.events({ 
  // 'click .reactive-table tbody tr': function (event) {
  //   if (event.target.className.indexOf("deleteRow") > -1) {
  //     let deleteData = {
  //       id: this._id,
  //       table: selectedTable.get()
  //     };
  //     sweetAlert({
  //       title: TAPi18n.__("tbl_sure"),
  //       //text: TAPi18n.__("row_sure_txt"),
  //       type: "warning",
  //       showCancelButton: true,
  //       confirmButtonColor: "#DD6B55",
  //       confirmButtonText: TAPi18n.__("fl_accept"),
  //       cancelButtonText: TAPi18n.__("fl_deny"),
  //       closeOnConfirm: true,
  //       closeOnCancel: true
  //       },
  //       function(isConfirm){
  //         if (isConfirm) {
  //           Meteor.call("deleteRow", deleteData, function(error, result){
  //             if(error){
  //               console.log("error", error);
  //             }
  //           });
  //         }
  //       }
  //     );
  //   }
  // },
  'click .reactive-table tbody tr': function (event) {
    selectedApp.set(this.id);
    event.preventDefault();
    Meteor.call('getAppTotalsSuperAdmin', selectedApp.get(), function(error, result) { 
      if (error) { 
        console.log('error', error); 
      } 
      if (result) { 
        appStats.set(result);      
      } 
    });
    Modal.show('tmplAdminViewApp');
  },
  'click #add-app': function (event) {
    // selectedApp.set(this.id);
    event.preventDefault();
    Modal.show('tmplAdminAddApp');
  }
});

Template.tmplAdminViewApp.onCreated(function() { 
  selectedParams = new ReactiveVar(null);
  appStats = new ReactiveVar(null);
  let theId = selectedApp.get();
  Meteor.call('getTenantById', theId, function(error, items) { 
   if (error) { 
     console.log('error', error); 
   } 
   if (items) { 
     selectedParams.set(items);
   } 
  });
  // Meteor.call('getAppTotalsSuperAdmin', selectedApp.get(), function(error, result) { 
  //   if (error) { 
  //     console.log('error', error); 
  //   } 
  //   if (result) { 
  //     // console.log(result);
  //     appStats.set(result);      
  //   } 
  // });
});

Template.tmplAdminViewApp.helpers({
  theParams: function() {
    return selectedParams.get();
  },
  theStats: function() {
    return appStats.get();
  },
  duration2str: function(dur){
    return appClient.minutesToString(dur);
  },
});

Template.tmplAdminViewApp.events({ 
  "click .closeDialog": function(event, template){
    selectedApp.set(null);
    Modal.hide();
  } 
});


Template.tmplAdminAddApp.events({ 
  "submit .add-app": function(event, template){
    event.preventDefault();
    // Get value from form element
    const target = event.target;
    const dataObj = {
      appname: target.appname.value,
      appadminemail: target.appadminemail.value,
    }
    Meteor.call('addClient', dataObj, function(error, success) { 
      if (error) { 
        console.log('error', error); 
        if (error.reason == "Email already exists.") {
          sweetAlert(TAPi18n.__("fl_error"), TAPi18n.__("signup_email_exists"), "error");
        } else {
          sweetAlert(TAPi18n.__('fl_error'),error,"error");
        }  
      } 
      if (success) { 
        console.log(success);
        sAlert.success('Successful app creation!');
        Modal.hide();
      } 
    });
  } 
});
