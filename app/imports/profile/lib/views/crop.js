import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import sweetAlert from 'sweetalert';

//////////////////////////
// Cropping modal js code
//////////////////////////
Template.cropModal.onCreated(function(){
  hasImage = new ReactiveVar(false);
  iCropper = new ReactiveVar(null);
});


Template.cropModal.helpers({
  hasImage: function(){
    return hasImage.get();
  },
  'submitData': function() {
    if (this.formData) {
        this.formData['contentType'] = this.contentType;
    } else {
        this.formData = {contentType: this.contentType};
    }
    return typeof this.formData == 'string' ? this.formData : JSON.stringify(this.formData);
  }
});
Template.cropModal.events({
  'change .myFileInput': function(event, template) {
    var oFile = event.currentTarget.files[0];
    var oImage = document.getElementById('cropPreview');

    var oReader = new FileReader()
    oReader.onload = function(e) {
      // e.target.result contains the DataURL which we can use as a source of the image
      oImage.src = e.target.result;
      if (appClient.isAdmin() && FlowRouter.getRouteName() === 'adminParams') {
        var cropperData = {
          data: { x: 1, y: 1, width: 570, height: 160 },
          cropBoxResizable: false,
        };
      } else {
        var cropperData = {
          data: { x: 1, y: 1, width: 200, height: 200 },
          aspectRatio: 1,
          cropBoxResizable: false,
        };
      }
      oImage.onload = function () { // onload event handler
          var cropper = new Cropper(oImage, cropperData);
          iCropper.set(cropper);
      }
    }
    // read selected file as DataURL
    oReader.readAsDataURL(oFile);
    hasImage.set(true);

    //return 'label';
  },
  'click .start': function(event, template) {
    if (!Meteor.settings.GoogleAccessId || Meteor.settings.GoogleAccessId.length == 0){
      sweetAlert(TAPi18n.__("fl_error"), TAPi18n.__("fl_cannotupload"), "error");
      Modal.hide();
      return;
    }
    event.preventDefault();
    // get cropped image from canvas as 200x200 jpeg, convert it to blob & upload it
    // used https://github.com/blueimp/JavaScript-Canvas-to-Blob to support toBlob to Safari
    var cropper = iCropper.get();
    if (appClient.isAdmin() && FlowRouter.getRouteName() === 'adminParams') {
      var canvas = cropper.getCroppedCanvas({width: 570, height: 160});
    } else {
      var canvas = cropper.getCroppedCanvas({width: 200, height: 200});
    }
    canvas.toBlob(function(blob){
      // create new file object
      // Safari does not support new File(). Instead of using it, I converted blob to file
      // using http://stackoverflow.com/questions/27159179/how-to-convert-blob-to-file-in-javascript
      blob.lastModifiedDate = new Date();
      blob.name = 'avatar.jpg';
      fileObj = blob;

      // check if admin & editing App logo
      if (appClient.isAdmin() && FlowRouter.getRouteName() === 'adminParams') {
        var reader = new FileReader();
        reader.readAsDataURL(blob); 
        reader.onloadend = function() {
          base64data = reader.result;                
          Meteor.call('uploadLogo', base64data, function(error, success) { 
            if (error) { 
              console.log('error', error); 
            } 
            if (success) { 
               console.log('logo uploaded');
               Session.set('appLogo', base64data);
            } 
          });
        }  
      } else {
        // start uploading
        var uploader = new Slingshot.Upload("appAvatars");
        uploader.send(fileObj, function (error, downloadUrl) {
          if (error) {
            // Log service detailed response.
            console.error('Error uploading', uploader.xhr.response);
            alert (error);
          }
          else {
            Meteor.users.update(Meteor.userId(), {$set: {"profile.user.photo": downloadUrl}});
          }
        });
      }
    }, 'image/jpeg');
    Modal.hide();
  },
  "click #zoomIn": function(event, template) {
    event.preventDefault();
    iCropper.get().zoom(0.1);
  },
  "click #zoomOut": function(event, template) {
    event.preventDefault();
    iCropper.get().zoom(-0.1);
  }
});
