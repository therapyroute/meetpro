Meteor.startup(function () {
  if (!Meteor.settings.GoogleAccessId || Meteor.settings.GoogleAccessId.length == 0){
    console.log('Google cloud not set...');
    return;
  }
  // the key file to Google Cloud
  Slingshot.GoogleCloud.directiveDefault.GoogleSecretKey = Assets.getText('google-cloud-service-key.pem');

  // app avatars directive
  Slingshot.createDirective("appAvatars", Slingshot.GoogleCloud, {
    bucket: "meteor", // This may be a String or a function
    maxSize: 10 * 1024 * 1024,
    allowedFileTypes: ["image/png", "image/jpeg", "image/gif"],

    authorize: function () {
      //Deny uploads if user is not logged in.
      if (!this.userId) {
        var message = "Please login before posting files";
        throw new Meteor.Error("Login Required", message);
      }
      return true;
    },

    key: function (file) {
      //Store file into a directory by the user's username.
      return 'avatars/' + this.userId + "/" + file.name;
    }
  });

  Slingshot.fileRestrictions("appAvatars", {
    allowedFileTypes: ["image/png", "image/jpeg", "image/gif"],
    maxSize: 10 * 1024 * 1024 // 10 MB (use null for unlimited).
  });

  // app files directive
  Slingshot.createDirective("appFiles", Slingshot.GoogleCloud, {
    bucket: "meteor", // This may be a String or a function
    maxSize: 10 * 1024 * 1024, // 10 Mbytes
    allowedFileTypes: ["image/png", "image/jpeg", "image/gif", "application/pdf"],

    authorize: function () {
      //Deny uploads if user is not logged in.
      if (!this.userId) {
        var message = "Please login before posting files";
        throw new Meteor.Error("Login Required", message);
      }
      return true;
    },

    key: function (file) {
      //Store file into a directory by the user's username.
      return 'files/' + this.userId + "/" + file.name;
    }
  });

  Slingshot.fileRestrictions("appFiles", {
    maxSize: 15 * 1024 * 1024 // 15 MB (use null for unlimited).
  });

  // app backgrounds directive
  Slingshot.createDirective("appBackgrounds", Slingshot.GoogleCloud, {
    bucket: "meteor", // This may be a String or a function
    maxSize: 1 * 1024 * 1024,
    allowedFileTypes: ["image/png", "image/jpeg", "image/gif"],

    authorize: function () {
      //Deny uploads if user is not logged in.
      if (!this.userId) {
        var message = "Please login before posting files";
        throw new Meteor.Error("Login Required", message);
      }
      return true;
    },

    key: function (file) {
      //Store file into a directory by the user's username.
      return 'backgrounds/' + appCommon.getParam('APP_NAME') + "/" + file.name;
    }
  });

  Slingshot.fileRestrictions("appBackgrounds", {
    allowedFileTypes: ["image/png", "image/jpeg", "image/gif"],
    maxSize: 1 * 1024 * 1024 // 10 MB (use null for unlimited).
  });
});
