// Methods for statistics
// based on recipe https://themeteorchef.com/snippets/aggregations-in-mongodb/
Meteor.methods({
  // get totals using meteorhacks:aggregate package
  getTotals( userId = null ) {
    if (this.userId){
      let theRole = Roles.getRolesForUser(this.userId).toString();
      // prepare aggregate group
      let group = {
        _id: '',
        num: {
          $sum: 1
        },
        total: {
          $sum: '$price'
        },
        assocs: {
          $addToSet: ''
        },
        duration: {
          $sum: '$duration'
        }
      };
      // prepare aggregate match
      let theGroup = null;
      if (Meteor.settings.public.APP_MULTI_CLIENT){
        theGroup = Partitioner.getUserGroup(this.userId);
      }
      let filter = {
        status : { $in: ['confirmed','completed'] },
        _groupId: theGroup
      };
      if ( theRole === 'provider' ) {
        group._id = '$providerId';
        group.assocs.$addToSet = '$userId';
        filter.providerId = this.userId;
      } else if ( theRole === 'user') {
        group._id = '$userId';
        group.assocs.$addToSet = '$providerId';
        filter.userId = this.userId;
      } else if ( theRole === 'admin' || theRole === 'admin,provider' ) {
        if (appParams.currentRole && appParams.currentRole == 'expert'){
          group._id = '$providerId';
          group.assocs.$addToSet = '$userId';
          filter.providerId = this.userId;
        }
        //group.assocs.$addToSet = '$providerId';
        if (userId) {
          if (Roles.userIsInRole(userId, ['provider'])) {
            group._id = '$providerId';
            group.assocs.$addToSet = '$userId';
            filter.providerId = userId;
          } else {
            group._id = '$userId';
            group.assocs.$addToSet = '$providerId';
            filter.userId = userId;
          }
        }
      }
      // get results from mongo
      return Bookings.aggregate([
        { $match: filter },
        { $group: group }
      ]);
    }
  },
  // get total data per month
  getDataPerMonth(type, curYear, userId = null){
    if (this.userId) {
      check(type, String);
      check(curYear, String);

      if (type === 'appointments'){
        var group = {
          _id: { month: { $month: "$start" }, year: { $year: "$start" } },
          total: {
            $sum: 1
          }
        };
      } else if (type === 'money') {
        var group = {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          total: {
            $sum: "$price"
          }
        };
      }
      // prepare aggregate match
      // search only in confirmed/completed provider's bookings
      let theRole = Roles.getRolesForUser(this.userId).toString();
      // if user is provider & admin, prefer admin
      if (theRole === 'admin,provider') {
        if (appParams.currentRole && appParams.currentRole == 'expert'){
          theRole = 'provider';
        } else {
          theRole = 'admin';
        }
      }
      let userFilter = {
        user: { userId: this.userId},
        provider: { providerId: this.userId},
        admin: {}
      };
      if (userId) {
        if (Roles.userIsInRole(userId, ['provider'])) {
          userFilter.admin.providerId = userId;
        } else {
          userFilter.admin.userId = userId;
        }
      }
      let filter = userFilter[theRole];
      filter.status = { $in: ['confirmed','completed'] };
      if (Meteor.settings.public.APP_MULTI_CLIENT){
        let theGroup = Partitioner.getUserGroup(this.userId);
        filter._groupId = theGroup;
      }
      // get results from mongo
      var aggr = Bookings.aggregate([
        { $match: filter },
        { $group: group }
      ]);
      // prepare empty year object
      var year = {};
      for (var i = 0; i < 13; i++) {
        year[i] = 0;
      }
      // populate year object
       _.each(aggr, function(r){
         if (r._id.year === parseInt(curYear)){
           let tot = r.total;
           year[r._id.month] = (type === 'money') ? Number(tot.toFixed(2)) : tot;
        }
       });
       // return as array
       return (_.values(year)).splice(1);
     }
  },
  // get all appointment years
  getYears(userId = null){
    if (this.userId){
      let theRole = Roles.getRolesForUser(this.userId).toString();
      let filter = {
        user: { userId: this.userId},
        provider: { providerId: this.userId},
        admin: {}
      };
      if (userId) {
        if (Roles.userIsInRole(userId, ['provider'])) {
          filter.admin.providerId = userId;
        } else {
          filter.admin.userId = userId;
        }
      }

      return _.uniq(Bookings.direct.find(filter[theRole], {fields: {'start': 1}, sort: {'start':-1}}).fetch().map(function(x){
        return x.start.getFullYear();
      }));
    }
  },
  // get totals for superadmin using meteorhacks:aggregate package
  getTotalsSuperAdmin( userId = null ) {
    if (!this.userId){
      throw new Meteor.Error('unauthorized','Not allowed to retrieve stats');
    }
    let params = Params.direct.find().fetch();
    if (!params) {
      throw new Meteor.Error('error','No tenants in database');
    }
    let apps = [];
    params.forEach(app => {
      apps.push({"name": app.APP_NAME, "groupId": app._groupId});
    });
    let allData = [];
    let totals = {apps:0, users:0, experts:0, appts:0, calls:0, income:0};
    apps.forEach(app => {
      // prepare aggregate group
      let group = {
        _id: 'totals',
        num: {
          $sum: 1
        },
        total: {
          $sum: '$price'
        },
        duration: {
          $sum: '$duration'
        }
      };
      // prepare aggregate match
      let filter = {
        status : { $in: ['confirmed','completed'] },
        _groupId: app.groupId
      };
      
      // get results from mongo
      let bookingData = Partitioner.bindGroup(app.groupId, function(){
        return Bookings.aggregate([
          { $match: filter },
          { $group: group }
        ]);
      });
      let users = Meteor.users.find({roles: ['user'], group: app.groupId}).count();
      let experts = Meteor.users.find({roles: ['provider'], group: app.groupId}).count();
      // only totals shoud be sent
      // let appData = {
      //   name: app.name,
      //   users: users,
      //   experts: experts,
      //   appts: bookingData[0] ? bookingData[0].num : 0,
      //   calls: bookingData[0] ? bookingData[0].duration : 0,
      //   income: bookingData[0] ? bookingData[0].total : 0
      // }
      totals.apps += 1; 
      totals.users += users;
      totals.experts += experts;
      totals.appts += bookingData[0] ? bookingData[0].num : 0;
      totals.calls += bookingData[0] ? bookingData[0].duration : 0;
      totals.income += bookingData[0] ? bookingData[0].total : 0;
      // allData.push(appData);
    });
    totals.income = totals.income.toFixed(2);
    allData.push(totals);
    return allData;
  },
  // get totals for selected app (only for superadmin)
  getAppTotalsSuperAdmin( appId = null ) {
    if (!this.userId || !appId){
      throw new Meteor.Error('unauthorized','Not allowed to retrieve stats or no appId set');
    }
    let params = Params.direct.findOne({_id: appId});
    if (!params) {
      throw new Meteor.Error('error','App not found in database');
    }

    let totals = {users:0, experts:0, appts:0, calls:0, income:0};
    // prepare aggregate group
    let group = {
      _id: 'totals',
      num: {
        $sum: 1
      },
      total: {
        $sum: '$price'
      },
      duration: {
        $sum: '$duration'
      }
    };
    // prepare aggregate match
    let filter = {
      status : { $in: ['confirmed','completed'] },
      _groupId: params._groupId
    };
    
    // get results from mongo
    let bookingData = Partitioner.bindGroup(params._groupId, function(){
      return Bookings.aggregate([
        { $match: filter },
        { $group: group }
      ]);
    });
    let users = Meteor.users.find({roles: ['user'], group: params._groupId}).count();
    let experts = Meteor.users.find({roles: ['provider'], group: params._groupId}).count();

    totals.users = users;
    totals.experts = experts;
    totals.appts = bookingData[0] ? bookingData[0].num : 0;
    totals.calls = bookingData[0] ? bookingData[0].duration : 0;
    totals.income = bookingData[0] ? bookingData[0].total : 0;
    totals.income = totals.income.toFixed(2);
    
    return totals;
  }
});
