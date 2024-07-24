// Collection containing private info (to be used @ associate view and maybe @ chat)

Private = new Mongo.Collection("private");

Private.attachSchema(new SimpleSchema({
  owner: {
    type: String,
  },
  associate: {
    type: String
  },
  // 'note' for notes, the rest later...
  dataType: {
    type: String
  },
  content: {
    type: String
  }
}));
