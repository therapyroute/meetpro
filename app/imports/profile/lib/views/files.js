import sweetAlert from 'sweetalert';

Template.tmplFiles.onCreated(function(){
  DocHead.setTitle(appParams.APP_NAME + ': '+TAPi18n.__('fl_title'));
  assigningFile = new ReactiveVar(null);
  assignedTo = new ReactiveVar(null);
  var self = this;
  // subscriptions: only providers should be reactive - files are handled only here
  self.subscribe('getUserFiles');
  self.autorun(function(){
    self.subscribe('allAssocs');
  });
});

Template.tmplFiles.onRendered(function(){
  Meteor.setTimeout(function(){
    $('#infoTooltip').tooltip();
  }, 200);
});

Template.tmplFiles.helpers({
  // helper for reactiveTable
  userOwnFiles: function() {
    var ret = UserFiles.find({_id: Meteor.userId()}).fetch();
    return ret.length > 0 ? ret[0].uploads : [];
  },
  tblSettings: function() {
    return {
      //showColumnToggles: true,
      showFilter: false,
    };
  },
  displayedFields: function() {
    return [{
        key:'name',
        label: TAPi18n.__("fl_fname"),
        sortOrder: 0,
        sortDirection: 'descending'
      },
      {key:'type', label: TAPi18n.__("fl_type")},
      {
        key:'uploadedOn',
        label: TAPi18n.__("fl_uploaded"),
        fn: function(value,object){
          return appClient.dateShort(value);
        }
      },
      {
        key:'assignedTo',
        label: TAPi18n.__("fl_shared"),
        fn: function(value) {
          if (!value || value.length == 0)
            return TAPi18n.__("fl_notassigned");
          return Meteor.users.findOne({_id:value}).fullName(); }
      },
      {
        key: 'url',
        label: TAPi18n.__("ap_action"),
        fn: function (value) {
          return new Spacebars.SafeString('<a href="'+value+'" target="_blank"><i class="fa fa-eye viewBtn"></i></a>&nbsp;<a href="#" class="shareBtn"><i class="fa fa-share-square-o"></i></a>&nbsp;<a href="#" class="deleteBtn"><i class="fa fa-trash deleteBtn"></i></a>');
        }
      }
    ];
  }
});

Template.tmplFiles.events({
  // all reactiveTable events need the following class. Separate events are handled by an if...
  "click .reactive-table tbody tr": function(event) {
    // if user clicks delete button
    if (event.target.className.indexOf("deleteBtn") > -1) {
      var fileObj = {};
      fileObj.fileName = this.name;
      fileObj.owner = Meteor.userId();
      sweetAlert({
        title: TAPi18n.__("fl_sure"),
        text: TAPi18n.__("fl_sure_txt"),
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: TAPi18n.__("fl_accept"),
        cancelButtonText: TAPi18n.__("fl_deny"),
        closeOnConfirm: false,
        closeOnCancel: false
        },
        function(isConfirm){
          if (isConfirm) {
            Meteor.call("deleteFile", fileObj, function(error, result){
              if(error){
                console.log("error", error);
              }
              if(result){
                sweetAlert(TAPi18n.__("fl_deleted"), TAPi18n.__("fl_deleted_txt"), "success");
              }
            });
          } else {
            sweetAlert(TAPi18n.__("fl_cancelled"), TAPi18n.__("fl_cancelled_txt"), "error");
          }
        }
      );
    }
    // user clicks view button
    else if (event.target.className.indexOf("viewBtn") > -1) {
      return true;
    }
    // if user clicks @ share button or anywhere else
    else {
      assigningFile.set(this.name);
      assignedTo.set(this.assignedTo);
      Modal.show('tmplAssignModal');
    }
  },
  'change .myFileInput': function(event, template) {
    if (!Meteor.settings.GoogleAccessId || Meteor.settings.GoogleAccessId.length == 0){
      sweetAlert(TAPi18n.__("fl_error"), TAPi18n.__("fl_cannotupload"), "error");
    }
    var oFile = event.currentTarget.files[0];
    // console.log(oFile);
    //event.preventDefault();
    // start uploading
    var uploader = new Slingshot.Upload("appFiles");
    var fileInfo = {
      name: oFile.name,
      size: oFile.size,
      type: oFile.type
    }
    uploader.send(oFile, function (error, downloadUrl) {
      if (error) {
        // Log service detailed response.
        console.log(error);
        if (error.error === "Upload denied"){
          sweetAlert(TAPi18n.__("fl_error"), TAPi18n.__("fl_file_type"), "error");
        }
      }
      else {
        fileInfo.url = downloadUrl;
        Meteor.call('addFile', fileInfo, function(error, success) { 
          if (error) { 
            console.log('error', error); 
          } 
          if (success) { 
            sweetAlert({
              title: TAPi18n.__("fl_success"),
              //text: TAPi18n.__("fl_shared1_txt"),
              type: "success"
            });
          } 
        });
      }
    });
    event.currentTarget.value='';  
  }
});

// File sharing (assignment) modal
Template.tmplAssignModal.onCreated(function(){
  var self = this;
  this.autorun(function(){
    self.subscribe('allAssocs');
  });
});

Template.tmplAssignModal.onRendered(function(){
  // load select2 with a timeout (to ensure loading)
  Meteor.setTimeout(function(){
    $(function(){
      $("#providerSelect2").select2();
    });
  }, 500);
});
Template.tmplAssignModal.helpers({
  noProviders: function() {
    return Meteor.users.find({_id: {$ne: Meteor.userId()}}).fetch().length == 0;
  },
  getProviders: function() {
    return Meteor.users.find({_id: {$ne: Meteor.userId()}});
  },
  // return 'selected' to select2 option, if file is shared
  isSelected: function(id) {
    if (id === assignedTo.get())
      return 'selected';
  },
  // check if file is shared with a provider
  isShared: function() {
    return assignedTo.get();
  }
});

Template.tmplAssignModal.events({
  "click .closeDialog": function(event, template){
    assigningFile.set(null);
    assignedTo.set(null);
  },
  "click .stopSharing": function(event, template){
    var fileName = assigningFile.get();
    var providerId = "";
    var fileObj = {
      name: fileName,
      owner: Meteor.userId(),
      provider: providerId,
      lang: ''
    };
    Meteor.call("assignFile", fileObj, function(error, result){
      if(error){
        sweetAlert(TAPi18n.__("fl_error"), TAPi18n.__("fl_error_txt"), "error");
        console.log("error", error);
      }
      if(result){
        sweetAlert({
          title: TAPi18n.__("fl_stopped"),
          text: TAPi18n.__("fl_stopped_txt"),
          type: "success"
        });
      }
    });
    assigningFile.set(null);
    assignedTo.set(null);
  },
  "click .shareButton": function(event, template){
    var providerId = template.$('.providerId').val();
    var fileName = assigningFile.get();
    var fileObj = {
      name: fileName,
      owner: Meteor.userId(),
      provider: providerId,
      lang: TAPi18n.getLanguage()
    };
    Meteor.call("assignFile", fileObj, function(error, result){
      if(error){
        sweetAlert(TAPi18n.__("fl_error"), TAPi18n.__("fl_error_txt"), "error");
        console.log("error", error);
      }
      if(result){
        sweetAlert({
          title: TAPi18n.__("fl_shared1"),
          text: TAPi18n.__("fl_shared1_txt"),
          type: "success"
        });
      }
    });
    // init vars
    assigningFile.set(null);
    assignedTo.set(null);
  }
});
