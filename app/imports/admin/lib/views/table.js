
Template.tmplAdminTable.onCreated(function() { 
   curDoc = new ReactiveVar(null);
   //selectedTable = new ReactiveVar(null);
   selectedTable = new ReactiveVar('Specialities');
   let self = this;
   self.autorun(function() { 
    self.subscribe('adminTable', selectedTable.get());
   });
   DocHead.setTitle(appParams.APP_NAME + ': '+TAPi18n.__('appdata'));
});

Template.tmplAdminTable.helpers({
  displayedFields: function(){
    if (selectedTable.get() === 'Specialities'){
      var fieldArray = [
        {key:'id',label: '#'},
        {key:'name',label: TAPi18n.__('name')},
        {key:'abbreviation',label: TAPi18n.__('tbl_abbr')}
      ];
    } else if (selectedTable.get() == 'NotificationTemplates'){
      var fieldArray = [
        {key:'type',label: TAPi18n.__('fl_type')},
        {key:'action',label: TAPi18n.__('notaction')},
        {key:'lang',label: TAPi18n.__('notlang')}
      ];
    } else {
      var fieldArray = [
        {key:'name',label: TAPi18n.__('name')},
        {key:'itemCode',label: TAPi18n.__('tbl_code')}
      ];
    }
    fieldArray.push({
      key: 'action',label: TAPi18n.__('ap_action'),
      fn: function (value, object) {
        let retStr = `<a href="#" title="${TAPi18n.__('msg_delete')}" class="deleteRow"><i class="fa fa-trash deleteRow"></i></a>`;
        return new Spacebars.SafeString(retStr);
      },
      sortable: false
    });
    return fieldArray;
  },
  tblOptions: function() {
    return [
      {label: TAPi18n.__('specialities'), value: 'Specialities'},
      // {label: TAPi18n.__('expertise'), value: 'Expertise'},
      {label: TAPi18n.__('ap_notifications'), value: 'NotificationTemplates'},
      //{label: 'Templates', value: 'Templates'}
    ];
  },
  selectedTable: function () {
    return selectedTable.get();
  },
  selectedTransTable: function () {
    return TAPi18n.__(selectedTable.get().toLowerCase());
  },
  sTable: function(){
    if (selectedTable.get() ==='Specialities')
      return Specialities.find();
    else if (selectedTable.get() ==='Expertise')
      return Expertise.find();
    else if (selectedTable.get() ==='NotificationTemplates')
      return NotificationTemplates.find();
  },
  theMethod: function(){
    if (selectedTable.get() ==='Specialities')
      return 'updateSpeciality';
    else if (selectedTable.get() ==='Expertise')
      return 'updateExpertise';
    else if (selectedTable.get() ==='NotificationTemplates')
      return 'updateNotifications';
  },
  curDoc: function(){
    if (!curDoc.get())
      return;
    if (selectedTable.get() === 'Specialities')
      return Specialities.findOne({_id: curDoc.get()});
    else if (selectedTable.get() ==='Expertise')
      return Expertise.findOne({_id: curDoc.get()});
    else if (selectedTable.get() ==='NotificationTemplates')
      return NotificationTemplates.findOne({_id: curDoc.get()});
  },
  btnText: function() {
    return TAPi18n.__('save');
  }  
});

AutoForm.addHooks("editTableRow", {
  onError: function (type,error) {
    sAlert.error(TAPi18n.__('fl_error') + ': ' + error);
    console.log(error);
  },
  onSuccess: function () {
    sAlert.success(TAPi18n.__("profile_success"));
  }
});

Template.tmplAdminTable.events({ 
  'change .table-filter': function (event,t) {
    selectedTable.set(event.target.value);
  },
  'click .reactive-table tbody tr': function (event) {
    if (event.target.className.indexOf("deleteRow") > -1) {
      let deleteData = {
        id: this._id,
        table: selectedTable.get()
      };
      sweetAlert({
        title: TAPi18n.__("tbl_sure"),
        //text: TAPi18n.__("row_sure_txt"),
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: TAPi18n.__("fl_accept"),
        cancelButtonText: TAPi18n.__("fl_deny"),
        closeOnConfirm: true,
        closeOnCancel: true
        },
        function(isConfirm){
          if (isConfirm) {
            Meteor.call("deleteRow", deleteData, function(error, result){
              if(error){
                console.log("error", error);
              }
            });
          }
        }
      );
    } else {
      curDoc.set(this._id);
    }
  },
  'click #add-row': function (event) {
    event.preventDefault();
    Modal.show('tmplAdminAddTable');
  }
});

Template.tmplAdminAddTable.helpers({
  btnText: function() {
    return TAPi18n.__('q_add');
  },
  selectedTable: function() {
    return selectedTable.get();
  },
  theMethod: function(){
    if (selectedTable.get() ==='Specialities')
      return 'addSpeciality';
    else if (selectedTable.get() ==='Expertise')
      return 'addExpertise';
  },
});

AutoForm.addHooks("addTableRow", {
  onError: function (type,error) {
    if (error.error === 'duplicate')
      sAlert.error(TAPi18n.__('fl_error') + ': ' + TAPi18n.__('tbl_duplicate'));
    else
      sAlert.error(TAPi18n.__('fl_error') + ': ' + error);
    console.log(error);
  },
  onSuccess: function () {
    sAlert.success(TAPi18n.__("profile_success"));
    Modal.hide();
  }
});