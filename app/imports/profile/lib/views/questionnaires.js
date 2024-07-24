import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import sweetAlert from 'sweetalert';

Template.tmplQuestionnaires.onCreated(function() {
  Modal.allowMultiple = true;
  var self = this;
  this.autorun(function(){
      self.subscribe('providerQuestionnaires');
  });
});

Template.tmplQuestionnaires.helpers({
  questionnaires: function() {
    return Questions.find({providerId: Meteor.userId()});
  }
});

Template.tmplQuestionnaires.events({
  "click .editQuest": function (evt,tmpl) {
    Modal.show('tmplQuestionnaireModal');
  },
  "click .addQuest": function (evt,tmpl) {
    Modal.show('tmplQuestionnaireAddModal');
  },
  "click .deleteQuest": function(evt, tmpl) {
    sweetAlert({
      title: TAPi18n.__("fl_sure"),
      text: TAPi18n.__("q_sure_txt"),
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
          var quest = Questions.find({providerId: Meteor.userId()}).fetch();
          var qId = quest[0]._id;
          Questions.remove({_id: qId});
          // log to analytics
          // analytics.track("Provider removed questionnaire", {
          //   eventName: "Provider removed questionnaire",
          //   uId: Meteor.userId()
          // });
        }
      }
    );
  }
});

Template.tmplQuestionnaireModal.helpers({
  currentQuestionnaire: function(){
    return Questions.findOne({providerId: Meteor.userId()});
  }
});

Template.tmplQuestionnaireModal.events({
  "click .closeDialog": function(event, template){
    Modal.hide();
  },
  "click .submitDialog": function(e,t) {
    Modal.hide();
    // log to analytics
    // analytics.track("Provider edited questionnaire", {
    //   eventName: "User edited questionnaire",
    //   uId: Meteor.userId()
    // });
  }
});


Template.tmplQuestionnaireAddModal.events({
  "click .closeDialog": function(event, template){
    Modal.hide();
  },
  "click .submitDialog": function(e,t) {
    Modal.hide();
    // log to analytics
    // analytics.track("Provider submitted questionnaire", {
    //   eventName: "User submitted questionnaire",
    //   uId: Meteor.userId()
    // });
  }
});


// tmplQuestionnaireAnswer (where user answers provider's questions)
Template.tmplQuestionnaireAnswer.onCreated(function() {
  this.subscribe("providerQuestionnairesWithId", questionFill.get().providerId);
});
Template.tmplQuestionnaireAnswer.helpers({
  isProvider: function() {
    return Roles.userIsInRole(Meteor.user(),['provider']);
  },
  hasQuestions: function() {
    return Questions.find({providerId: Meteor.userId()}).fetch();
  },
  hasAnswers: function() {
    return Questions.find({providerId: questionFill.get().providerId, answers: {$elemMatch: {userId: questionFill.get().userId}}}).count();
  },
  canSubmit: function() {
    return (Questions.find({providerId: questionFill.get().providerId}).fetch().length && Meteor.user().roles.indexOf('provider') != 0);
  },
  questions: function() {
    var quest = Questions.find({providerId: questionFill.get().providerId}).fetch();
    var questions = quest[0].questions;
    // check if user has answered
    var hasAnswers = Questions.find({providerId: questionFill.get().providerId, answers: {$elemMatch: {userId: questionFill.get().userId}}}).count();
    if (hasAnswers){
      // return only the selected user's answers
      var ansCur = Questions.find({providerId: questionFill.get().providerId, answers: {$elemMatch: {userId: questionFill.get().userId}}}).fetch();
      let allAnswers = ansCur[0].answers;
      var filteredAnswers = allAnswers.filter(function ( obj ) {
        return obj.userId === questionFill.get().userId;
      })[0];
      var answers = filteredAnswers.userAnswers;
    }
    else {
      var answers = new Array(questions.count);
    }
    // create an array of objects: [{q: ,a: }]
    var pairs = _.zip(questions,answers).map(function(pair) {
      return _.object(["q","a"],pair);
    });
    return pairs;
  }
});
Template.tmplQuestionnaireAnswer.events({
  "click .closeDialog": function(event, template){
    //questionFill.set(null);
    Modal.hide('tmplQuestionnaireAnswer');
  },
  "click .submitDialog": function(evt,tmpl) {
    evt.preventDefault();
    var valArray = $('.userAnswer').map( function(){return $(this).val(); }).get();
    var answers = {
      userId: questionFill.get().userId,
      userAnswers: valArray
    };
    var providerId = questionFill.get().providerId;
    var curLang = TAPi18n.getLanguage();
    Meteor.call("insertAnswers", providerId, answers, curLang, function(error, result){
      if(error){
        console.log("error", error);
        sweetAlert(TAPi18n.__("fl_error"), TAPi18n.__("q_error"), "error");
      }
      if(result){
        sweetAlert(TAPi18n.__("q_success"), TAPi18n.__("q_success_msg"), "success");
        // log to analytics
        // analytics.track("User answered questionnaire", {
        //   eventName: "User answered questionnaire",
        //   uId: Meteor.userId()
        // });
      }
    });
    // close dialog
    Modal.hide(tmpl);
    //questionFill.set(null);
  }
});
