Questions = new Meteor.Collection("questions");

Schema = {};

Schema.answerSchema = new SimpleSchema({
  userId: {
    type: String
  },
  userAnswers: {
    type: [String],
  }
});

Schema.questionSchema = new SimpleSchema({
  providerId: {
    type: String,
    autoValue: function() {
      if (this.isInsert && !Meteor.isServer)
      {
        return Meteor.userId();
      }
    }
  },
  questions: {
    type: [String]
  },
  answers: {
    type: [Schema.answerSchema],
    optional: true
  }
});

Questions.attachSchema(Schema.questionSchema);

// Providers can update & remove their questionnaires
// (will change with methods)
Questions.allow({
  insert: function(){
    return true;
  },
  update: function(userId, doc){
    return doc.providerId === userId;
  },
  remove: function(userId, doc){
    return doc.providerId === userId;
  }
});
