import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import sweetAlert from 'sweetalert';

Template.tmplAdminUsers.onCreated(function() {
   DocHead.setTitle(appParams.APP_NAME + ': '+TAPi18n.__('sb_users'));
   let self = this;
   self.subscribe('allAdminUsers');
});
Template.tmplAdminUsers.helpers({
   userCollection: function() {
      return Meteor.users;
   },
   tblSettings: function() {
    return {
      showRowCount: true,
      showColumnToggles: true,
      // color each row depending on the role
      rowClass: function(item) {
        var role = item.roles[0];
        switch (role) {
          case 'admin':
            return 'danger';
          case 'provider':
            return 'warning';
          default:
            return '';
        }
      },
      noDataTmpl: Template.noDataTemplate
    };
  },
  displayedFields : function() {
    let theFields = [
        {key: 'profile.user.name',label: TAPi18n.__('name'), sortable: false},
        {key: 'profile.user.surname',label: TAPi18n.__('surname')},
        {key: 'emails.0.address',label: 'email', sortable: false}, 
        {
          key: 'roles.0',
          label: TAPi18n.__('role'),
          fn: function(value, object){
          return TAPi18n.__('ap_'+value);
          }
        },
        {key: 'emails.0.address',label: 'email', sortable: false}
    ]
    // if superadmin, show user's app to row
    if (appClient.isSuperAdmin()){
      theFields.splice(0, 0, { key: 'group', label: 'App'});
    }
    return theFields;
  },
  addUser: function() {
    return FlowRouter.path('adminAddUser');
  }
});

Template.tmplAdminUsers.events({ 
   'click .reactive-table tbody tr': function (event) {
      FlowRouter.go('adminUser', {userId: this._id});
    }
});


// Add user template
Template.tmplAdminAddUser.onCreated(function() {
  if (appClient.isSuperAdmin()){
    clientSelect = new ReactiveVar(null);
    Meteor.call('getTenants', function(error, items) { 
      if (error) { 
        console.log('error', error); 
      } 
      if (items) {
        clientSelect.set(items);
      } 
    });
  }
});
Template.tmplAdminAddUser.onRendered(function(){
  if (appClient.isSuperAdmin()){
    Meteor.setTimeout(function(){
      $(function(){
        $("#client").select2({
          allowClear: true
        });
      });
    }, 800);
  }
});

Template.tmplAdminAddUser.helpers({
  roleOpts: function() {
    return [
      {label: TAPi18n.__('ap_user'), value: 'user'},
      //{label: TAPi18n.__('ap_unconfirmed'), value: 'unconfirmed'},
      {label: TAPi18n.__('ap_provider'), value: 'provider'},
      //{label: TAPi18n.__('ap_admin'), value: 'admin'},
      //{label: TAPi18n.__('ap_inactive'), value: 'inactive'}
    ];
  },
  allClients: function() {
    return clientSelect.get();
  }
});
Template.tmplAdminAddUser.events({ 
  'submit .add-user': function(event, template) { 
    event.preventDefault();
    // Get value from form element
    const target = event.target;
    const dataObj = {
      name: target.username.value,
      surname: target.usersurname.value,
      email: target.useremail.value,
      //password: target.userpassword.value,
      role: target.role.value
    }
    if (appClient.isSuperAdmin()){
      dataObj.group = target.client.value;
    }
    // if (target.userpassword.value !== target.userpasswordagain.value) {
    //   sweetAlert(TAPi18n.__("fl_error"), TAPi18n.__("signup_password_match"), "error");
    //   return;
    // }
    
    Meteor.call('insertUser', dataObj, function(error, success) { 
      if (error) { 
        console.log('error', error); 
        if (error.error == 'notAllowed'){
          sweetAlert(TAPi18n.__("fl_error"), TAPi18n.__("fl_error_provider_limit"), "error");
        } else if (error.reason == "Email already exists.") {
          sweetAlert(TAPi18n.__("fl_error"), TAPi18n.__("signup_email_exists"), "error");
        } else {
          sAlert.error(TAPi18n.__('fl_error') + ': ' + error);
        }        
      } 
      if (success) { 
        //console.log(success);
        FlowRouter.go('adminUser', {userId: success});
      } 
    });
  },
  "click .closeDialog": function(event, template){
    Modal.hide();
  }
});
