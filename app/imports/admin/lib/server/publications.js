ReactiveTable.publish(
  "allAdminUsers", 
  Meteor.users, {}, {
    fields: {
        'profile.user.name': 1,
        'profile.user.surname': 1,
        //'profile.user.photo':1,
        //'profile.user.slug': 1,
        //'profile.provider.specialities': 1,
        'emails': 1,
        'roles': 1,
        'group': 1
    }
});

Meteor.publish("allParams", function(){
  if (this.userId && Roles.userIsInRole(this.userId,'admin')) {
    return Params.find({});
  }
  throw new Meteor.Error('unauthorized','Non-admin cannot get params!');
});

Meteor.publish("allUsernames", function(){
  if (this.userId && Roles.userIsInRole(this.userId,['admin'])) {
    return Meteor.users.find({},{fields: {
      'profile.user.name': 1,
      'profile.user.surname': 1,
      'profile.user.photo':1,
      'profile.user.slug': 1,
      'profile.provider.specialities': 1,
      'roles': 1,
      'profile.provider.schedule': 1,
      'profile.provider.price': 1,
      'profile.user.timezone': 1
    }});
  }
  throw new Meteor.Error('unauthorized','Non-admin cannot get usernames!');
});
Meteor.publish("allProviders", function(){
  if (this.userId && Roles.userIsInRole(this.userId,['admin'])) {
    return Meteor.users.find({roles: ['provider']},{fields: {
      'profile.user.name': 1,
      'profile.user.surname': 1,
    }});
  }
  throw new Meteor.Error('unauthorized','Non-admin cannot get usernames!');
});

// used to publish logs to the reactive table
ReactiveTable.publish('allAdminLogs', Logs, function(){
  if (this.userId && Roles.userIsInRole(this.userId,['admin'])){
    let theGroup = Partitioner.getUserGroup(this.userId);
    return {groupId: theGroup}
  }
  throw new Meteor.Error('unauthorized','Non-admin cannot get logs!');
  },
  {
    disablePageCountReactivity: true,
    disableRowReactivity: true
  }
);

Meteor.publish("adminTable", function(tblName){
  if (this.userId && Roles.userIsInRole(this.userId,['admin']) && tblName) {
    if (tblName === 'Specialities')
      return Specialities.find({});
    else if (tblName === 'Expertise')
      return Expertise.find({});
    else if (tblName === 'NotificationTemplates')
      return NotificationTemplates.find({});
  }
  throw new Meteor.Error('unauthorized','Non-admin cannot get data!');
});

Meteor.publish('adminOneBooking', function(id) {
  if (this.userId && Roles.userIsInRole(this.userId,['admin']) && id) {
    return Bookings.find({_id: id});
  }
  throw new Meteor.Error('unauthorized','Non-admin cannot get booking data!');
});