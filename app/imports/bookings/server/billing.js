// Billing related code - left for future reference
import moment from 'moment-timezone';

Invoices = new Mongo.Collection('invoices'); 

InvoiceSchema = new SimpleSchema({
  providerId: {
    type: String,
  },
  month: {
	  type: Number,
  },
  year: {
	  type: Number
  },
  appointments: {
    type: Number
  },
  paid: {
    type: Boolean,
    autoValue: function() {
      if (this.isInsert) {
        return false;
      }
    }
  },
  payDate: {
    type: Date,
    optional: true
  },
  payTransaction: {
    type: String,
    optional: true
  },
  createdAt: {
    type: Date,
    autoValue: function() {
      if (this.isInsert) {
        return new Date();
      } else if (this.isUpsert) {
        return {$setOnInsert: new Date()};
      } else {
        this.unset();  // Prevent user from supplying their own value
      }
    }
  },
  updatedAt: {
    type: Date,
    autoValue: function() {
      if (this.isUpdate) {
        return new Date();
      }
    },
    denyInsert: true,
    optional: true
  },
});

//InvoiceSchema.i18n("schemas.contact");
Invoices.attachSchema(InvoiceSchema);
// add index for faster searches
Invoices.createIndex({ "providerId": 1, "month": 1, "year": 1});

// imBilling function object
imBilling = {
  // generate invoices for the given month & year
  generateInvoices(month, year) {
    check(month, Number);
    check(year, Number);
    if (!month || month < 1 || month > 12) {
      throw new Meteor.Error('invalidmonth', "Error: Invalid month!");
    }
    if (!year) {
      throw new Meteor.Error('invalidyear','Error: Invalid year!');
    }
    // check if future date
    let srvTZ = 'Europe/London';
    let askedDate = moment([year, month]).tz(srvTZ);
    if (askedDate > moment()) {
      throw new Meteor.Error('invaliddate','Error: Cannot issue invoices for future date!');
    }
    // determine start and end of given month
    let startDate = moment([year, month]).tz(srvTZ).startOf('month').toDate();
    let endDate = moment([year, month]).tz(srvTZ).endOf('month').toDate();

    // find matching bookings using mongo aggregate
    let filter = {
      start: { $gte: startDate, $lte: endDate },
      status: 'completed'
    }
    let theBookings = Bookings.aggregate([
      { $match: filter },
      { $group: { _id: '$providerId', count: {$sum: 1}} }
    ]);

    // alter array to match collection format
    let monthBookings = theBookings.map(function (v) {
      return {
        providerId: v._id,
        month: month,
        year: year,
        appointments: v.count,
        paid: false,
        payDate: null,
      }
    });
    if (monthBookings.length == 0){
      throw new Meteor.Error('norecords', `Error: No records found for ${month}/${year}!`);
    }
    let inserts = 0;
    if (monthBookings.length > 0){
      // check if invoices are issued. If not, insert them
      // (upsert was not suitable due to the paid:true/false field)
      monthBookings.forEach(function(r){
        try {
          let existing = Invoices.find({
            providerId: r.providerId,
            month: month,
            year: year
          }).count();
          if (!existing){
            let result = Invoices.insert(r);
            if (result) {
              inserts += 1;
            }
          }
        } catch (error) {
          console.log(error); 
        }
      });
      console.log(monthBookings.length + ' records found'); 
      console.log(inserts + ' invoices added'); 
      return inserts;
    }    
  },
  generateAllInvoices() {
    // find all month year pair in booking collection
    let theBookings = Bookings.aggregate([
      { $match: {status: 'completed'} },
      { $group: { 
        _id: {  month: { $month: "$start" }, year: {$year:"$start"} }, count: {$sum: 1} } }
    ]);
    let calls = theBookings.map(function (r) {
      return r._id
    });
    let total = 0;
    // generate invoices for each pair
    calls.forEach(function(r){
      try {
        total += imBilling.generateInvoices(r.month, r.year);  
      } catch (error) {
        console.log(error);
      }
    }); 
    
    return String(total);
  }
}
Meteor.methods({ 
  generateInvoices: function(){
    if (!this.userId){
      throw new Meteor.Error('unauthorized','Guest cannot generate invoices!');
    }
    if (!Roles.userIsInRole(this.userId,['admin'])){
      throw new Meteor.Error('unauthorized','User cannot generate invoices!');
    }
    return imBilling.generateAllInvoices();
  },
  // get invoices based on criteria: month, year, payment status
  getInvoices: function(params) {
    check(params, Object);
    
    if (!this.userId){
      throw new Meteor.Error('unauthorized','Guest cannot get invoices!');
    }
    if (!Roles.userIsInRole(this.userId,['admin'])){
      throw new Meteor.Error('unauthorized','User cannot get invoices!');
    }
    
    // get invoices based on criteria
    let invoices = Invoices.find({
      year: Number(params.year),
      month: Number(params.month),
      paid: params.paid === 'true' ? true : false
    }).fetch();
    
    // add provider name & surname
    let result = invoices.map(function(r){
      let prov = Meteor.users.findOne({_id: r.providerId});
      let fullname = prov.profile.user.name + ' ' + prov.profile.user.surname;
      return {
        fullname: fullname,
        appointments: r.appointments,
        paid: r.paid,
        createdAt: r.createdAt,
        providerId: r.providerId,
        payDate: r.payDate,
        payTransaction: r.payTransaction
      }
    });    
    return result;
  },
  // generate invoice statistics per month
  getInvoiceStats(params = {}){  
    if (!this.userId){
      throw new Meteor.Error('unauthorized','Guest cannot get invoice stats!');
    }
    check(params, Object);
    
    // group invoices by year, month, payment status
    var group = {
      _id: { year: '$year', month: '$month', paid: '$paid' },
      total: {
        $sum: 1
      }
    };
    
    // prepare aggregate match
    let invoiceFilter = {};
    if (params.year) {
      invoiceFilter.year = params.year;
    } else {
      invoiceFilter.year = new Date().getFullYear();
    }
    if (params.month && params.month > 0 && params.month < 13) {
      invoiceFilter.month = params.month;
    }
    
    if ( typeof params.paid !== 'undefined'){
      invoiceFilter.paid = params.paid;
    }
    
    // get results from mongo
    var aggr = Invoices.aggregate([
      { $match: invoiceFilter },
      { $group: group }
    ]);
    // create in-memory collection for proper aggregation
    // e.g year-month-paid-unpaid
    invColl = new Mongo.Collection(null); 
    
    aggr.forEach(function(r){
      let found = invColl.find({
        year: r._id.year, month: r._id.month
      }).count();
      
      if (!found) {
        invColl.insert({
          year: r._id.year, 
          month: r._id.month,
          paid: r._id.paid ? r.total : 0,
          unpaid: r._id.paid === false ? r.total : 0
        });
      } else {
        let modifier = {};
        if (r._id.paid) {
          modifier = { paid: r.total }
        } else {
          modifier = { unpaid: r.total }
        }
        invColl.update({year: r._id.year, month: r._id.month}, {$set: modifier});
      }
    });
    let retData = invColl.find({},{fields: {'_id': 0}, sort: {year: -1, month: -1}}).fetch();
    
    // find distinct years for select element
    let distinctYears = _.uniq(Invoices.find({}, {
        sort: {year: 1}, fields: {year: 1}
    }).fetch().map(function(x) {
      return x.year;
    }), true);
       
    return {
      data: retData,
      years: distinctYears
    };
  }
});
// publish invoices as array 
// a) own invoices if provider
// b) other's invoices if admin
Meteor.publish('invoices', function(uId = null) {
  let sort = {
    sort: {
      'year': -1,
      'month': -1
    }
  }
  if (!this.userId){
    throw new Meteor.Error('unauthorized','Guest cannot get invoices!');
  }
  if (!Roles.userIsInRole(this.userId,['admin','provider'])){
    throw new Meteor.Error('unauthorized','User cannot get invoices!');
  }
  if (uId) {
    if (uId !== this.userId && Roles.userIsInRole(this.userId,'admin')) {
      return Invoices.find({
        providerId: uId
      }, sort);
    } else {
      throw new Meteor.Error('unauthorized',"Cannot get other user's invoices!");
    }
  } 
  return Invoices.find({ providerId: this.userId }, sort);
});