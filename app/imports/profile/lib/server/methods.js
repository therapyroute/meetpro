import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

Meteor.methods({
  sendPersonalMessage: function(msg){
    check(msg, {
        to: String,
        from: String,
        subject: String,
        message: String,
        icon: String
    });
    // TODO: check if associate before sending
    // ensure that the caller does not impersonate system
    if (msg.from !== 'system'){
      return appCommon.sendMessage(msg);
    }
  },
  // Messaging methods
  readAllNotifications: function(){
    if (this.userId) {
     return Messages.update({read: false}, {$set:{
       read: true
     }});
   }
   return this.ready();
  },
  // Method to update messages (mark as read)
  updateMessage: function(msg) {
    if (this.userId) {
      check(msg, {
        _id: String,
        read: Boolean,
        icon: String
      });
      return Messages.update({_id:msg._id}, {$set:{read: msg.read,icon: msg.icon}});
    }
    else
      throw new Meteor.Error('unauthorized','Cannot delete a message that is not yours');
  },
  // Method to delete received or sent messages (user is owner or sender)
  deleteMessage: function(msgId) {
    check(msgId, String);
    if (this.userId) {
      return Messages.remove({_id:msgId, $or: [{'owner': this.userId},{'from': this.userId}]});
    }
    else
      throw new Meteor.Error('unauthorized','Cannot delete a message that is not yours');
  },
  // UserFiles methods
  addFile: function(fileInfo) {
    if (this.userId) {
      fileInfo.uploadedOn = new Date();
      return UserFiles.upsert({_id: this.userId}, {$push: {uploads: fileInfo}});
    }
    throw new Meteor.Error('unauthorized', 'Guest cannot add a file');
  },
  // File assignment: call with provider='' to un-assign
  assignFile: function(fileObj) {
    if (this.userId && this.userId === fileObj.owner) {
      check(fileObj, {
        name: String,
        owner: String,
        provider: String,
        lang: String
      });
      var updateResult = UserFiles.update({'_id': fileObj.owner, 'uploads.name': fileObj.name}, {$set:{
          'uploads.$.assignedTo': fileObj.provider
      }});
      // Notify provider by sending a system message, when an assignment is made
      if (fileObj.provider.length > 0){
        var path = FlowRouter.path("commonAssociate") + '/' + this.userId;
        var msgSubject = TAPi18n.__('fl_msg_subj', {}, fileObj.lang);
        var msgText = TAPi18n.__('fl_msg_txt',{ postProcess: 'sprintf', sprintf: [path] },fileObj.lang);
        var msg = {
          from: 'system',
          to: fileObj.provider,
          subject: msgSubject,
          message: msgText,
          icon: 'folder-open-o'
        };
        var messageSent = appCommon.sendMessage(msg);
        return messageSent && updateResult;
      }
      else return updateResult;
    }
    throw new Meteor.Error('unauthorized','Cannot assign a file');
  },
  // delete file from collection & file system
  deleteFile: function(fileObj) {
    check(fileObj, {
      fileName: String,
      owner: String,
    });
    if (this.userId && this.userId === fileObj.owner) {
      // instead of getting path from user, find it
      var targetRec = UserFiles.find({_id: fileObj.owner, 'uploads.name': fileObj.fileName}).fetch();
      var uploads = targetRec[0].uploads;
      var obj = uploads.filter(function ( obj ) {
        return obj.name === fileObj.fileName;
      })[0];
      var thePath = obj.path;
      // TODO: delete from cloud storage
      // delete from collection ($pull: remove item from uploads array)
      return UserFiles.update({_id:fileObj.owner}, { $pull: {'uploads': {name: fileObj.fileName}}});
    }
    else
      throw new Meteor.Error('unauthorized','Cannot delete a file that is not yours');
  },
  // Questionnaire methods
  // insert/update anwers in questionnaire
  // gets providerId & answers{userId, userAnswers}
  insertAnswers: function(providerId, answers, lang) {
    check(providerId, String);
    check(answers, {
      userId: String,
      userAnswers: Array
    });
    if (this.userId) {
      // check if user has already submitted. If yes, modify answers
      var hasAnswers = Questions.find({providerId: providerId, answers: {$elemMatch: {userId: this.userId}}}).count();
      if (hasAnswers){
        var updateResult = Questions.update({providerId: providerId, answers: {$elemMatch: {userId: this.userId}}},
          { $set: { "answers.$.userAnswers": answers.userAnswers } });
      }
      // else just add the new answers
      else {
        var updateResult = Questions.update({providerId: providerId}, { $push: { answers: answers } });
      }
      // Notify provider by sending a system message, when an assignment is made
      var path = Meteor.absoluteUrl() + FlowRouter.path("commonAssociate") + '/' + this.userId;
      var msgSubject = TAPi18n.__('q_msg_subj', {}, lang);
      var msgText = TAPi18n.__('q_msg_txt',{ postProcess: 'sprintf', sprintf: [path] }, lang);
      var msg = {
        from: 'system',
        to: providerId,
        subject: msgSubject,
        message: msgText,
        icon: 'question-circle'
      };
      var messageSent = appCommon.sendMessage(msg);
      return updateResult;
    }
    else
      throw new Meteor.Error('unauthorized','Cannot update a questionnaire that is not yours');
  },
  // insert & update private data
  // gets object{associate, dataType, content}
  upsertPrivate: function(priv) {
    if (this.userId) {
      check(priv, {
        associate: String,
        dataType: String,
        content: String
      });
      return Private.upsert({owner: this.userId, associate: priv.associate, dataType: priv.dataType}, {$set:{
        owner: this.userId,
        associate: priv.associate,
        dataType: priv.dataType,
        content: priv.content
      }});
    }
    else
      throw new Meteor.Error('unauthorized','Cannot insert/update private data');
  },
  // updateRating
  // updates the user rating on the requested appointment
  // gets object(bookingId, rating, comment)
  updateRating: function(rateObj){
    if (this.userId) {
      check(rateObj, {
        bookingId: String,
        rating: Number,
        comment: String,
        lang: String
      });
      // update after ensuring this.userId is the user of the appointment
      var book = Bookings.update({_id: rateObj.bookingId, userId: this.userId}, {$set:{
        'rating.rating': rateObj.rating,
        'rating.comment': rateObj.comment
      }});
      // find provider & update their profile as well
      var prov = Bookings.findOne({_id: rateObj.bookingId}).providerId;
      // remove existing rating
      Meteor.users.update({_id: prov}, {$pull: {
        'profile.provider.ratings': {'bookingId': rateObj.bookingId}
      }});
      // push new
      var provUpdate = Meteor.users.update({_id: prov}, {$push: {
        'profile.provider.ratings': {'bookingId': rateObj.bookingId, 'rating': rateObj.rating}
      }});
      // take a moment to notify provider
      let msgObj = {
        from: 'system',
        to: prov,
        subject: TAPi18n.__('ap_rating_msg_title', {}, rateObj.lang),
        message: TAPi18n.__('ap_rating_msg_text', { postProcess: 'sprintf', sprintf: [Meteor.absoluteUrl(),this.userId] }, rateObj.lang),
        icon: 'star'
      };
      appCommon.sendMessage(msgObj);
      // return...
      return provUpdate & prov;
    }
    else
      throw new Meteor.Error('unauthorized','Cannot update appointment rating');
  },
  // checkSlug
  // check if slug exists. If yes, save it.
  checkSlug: function(userSlug, user) {
	  if (this.userId) {
      const theId = user._id;
      var exists = Meteor.users.findOne({_id: {$ne: theId}, 'profile.user.slug': userSlug});
			if (!exists){
				return Meteor.users.update({_id: theId}, {
					$set: {'profile.user.slug': userSlug}
				});
		  }
		  else {
			  throw new Meteor.Error('invalidUrl','Slug already exists');
		  }
	  }
	  else
      throw new Meteor.Error('unauthorized','Cannot check for slug');
  },
  // switchRoles
  // switch from user to unconfirmed and vice versa, when user checks box
  switchRoles: function(uId, targetRole) {
    if (this.userId){
      check(uId, String);
      check(targetRole, String);
      if (targetRole === 'unconfirmed' || targetRole === 'user'){
        Roles.setUserRoles(uId, targetRole);
        return true;
      }
      else {
        throw new Meteor.Error('invalidRole','Invalid Role casting was attempted');
      }
    }
    throw new Meteor.Error('unauthorized','Cannot change role');
  },
  // method to allow user remove their photo
  removeUserImage: function() {
    if (this.userId) {
      // remove from collection
      return Meteor.users.update({_id: this.userId}, {$set:{
        'profile.user.photo': null
      }});
    }
  },
  setUserTimezone(timezone) {
    if (this.userId) {
      check(timezone, String);
      return Meteor.users.update({_id: this.userId},{$set:{
        'profile.user.timezone': timezone
      }});
    }
    throw new Meteor.Error('not-allowed', 'Cannot change user time zone');
  },
  // method to update user profile
  updateUserProfile: function(modifier, theId) {
    if (this.userId) {
      if (this.userId === theId || Roles.userIsInRole(this.userId, ['admin'])) {
        // check modifier
        var schema = Meteor.users.simpleSchema();
        var match = Match.OneOf({$set: schema}, {$unset: Object}, {$set: schema, $unset: Object});
        check(modifier, match);
        return Meteor.users.update({_id: theId}, modifier);
      }
      throw new Meteor.Error('unauthorized','Not allowed to edit profile');
    }
    throw new Meteor.Error('unauthorized','Guest can not edit profile');
  },
  // delete account
  // if user, a request to the admin is sent
  // if admin, the deletion takes place
  deleteAccount: function(uId){
    if (this.userId){
      let theUser = Meteor.users.findOne({_id: uId}).fullName();
      // if user ask to be deleted, notify admin
      if (this.userId === uId) {
        let tmpTxt = `User ${theUser} (id: ${uId}) has asked for their account to be deleted...`;
        console.log(tmpTxt);
        appCommon.appLog({uid: this.userId, content: tmpTxt});
        Meteor.defer(function() {
          Email.send({
            to: appCommon.getParam('ADMIN_EMAIL'),
            from: appCommon.getParam('APP_EMAIL'),
            subject: 'Account deletion request',
            text: tmpTxt
          });
        });
        return 'notified';
        // if admin, proceed to deletion...
      } else if (Roles.userIsInRole(this.userId, ['admin']) ) {
        let result = Meteor.users.remove({_id: uId});
        
        let tmpTxt = `User ${theUser} (id: ${uId}) was deleted by the admin...`;
        console.log(tmpTxt);
        appCommon.appLog({uid: this.userId, content: tmpTxt});
        if (result)
          return 'done';
      }
    throw new Meteor.Error('unauthorized','Not allowed to delete account');
    }
  }
});
