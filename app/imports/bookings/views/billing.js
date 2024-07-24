import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import moment from 'moment-timezone';
import sweetAlert from 'sweetalert';

Invoices = new Mongo.Collection('invoices'); 

Template.tmplInvoices.onCreated(function() {
  invoiceData = new ReactiveVar(null);
  var self = this;
  let routerParam = FlowRouter.getParam('userId');

	self.autorun(function() {
    if ( ( routerParam || currentUser.get() ) && appClient.isAdmin()) {
      let theId = routerParam ? routerParam : currentUser.get();
      self.subscribe('invoices', theId);
    } else {
      self.subscribe('invoices');
    }
  });
});

Template.tmplInvoices.helpers({
  hasInvoices: function () {
    return Invoices.find({}).count() > 0 ? true : false;
  },
  invoiceData: function () {
    return Invoices.find();
  },
  displayedFields : function() {
    return [
      {key: 'year',label: TAPi18n.__("inv_year")},
      {
        key: 'month',
        label: TAPi18n.__("inv_month"),
        fn: function (value, object) {
          return moment(value,'MM').format('MMMM');
        }
      }, 
      {key: 'appointments',label: TAPi18n.__("inv_appts")}, 
      {
        key: 'createdAt',
        label: TAPi18n.__("inv_issued"),
        fn: function(value, object){
          return appClient.dateShort(value);
        }
      },
      {
        key: 'amount',
        label: TAPi18n.__("inv_amount"),
        fn: function(value, object){
          let charge = appParams.bookingCharge;
          // charge is in cents, so divide by 100
          return '€ ' + ((object.appointments * charge)/100).toFixed(2);
        }
      },
      {
        key: 'paid',
        label: TAPi18n.__("inv_status"),
        fn: function(value, object){          
          let retStr = '';
          if (value) {
            let payDate = object.payDate ? moment(object.payDate).format("DD-MM-YYYY, HH:mm") : '';
            // link to viva wallet receipt
            let link = appClient.vpUrl()+'/web/receipt?tid='+object.payTransaction;
            retStr = `${TAPi18n.__("inv_paid")}&nbsp;<a href='${link}' title='${TAPi18n.__("inv_download")}' target='_blank'><i class="fa fa-download"></a></i><br><small>(${payDate})</small>`;
          } else {
            retStr = `${TAPi18n.__("inv_notpaid")}&nbsp;&nbsp;<a href="#" class="btn-default btn-success btn-sm" title="">${TAPi18n.__("inv_paynow")}</a>`
          }
          return Spacebars.SafeString(retStr);
        }
      }
    ]
 },
});
Template.tmplInvoices.events({ 
  'click .reactive-table tbody tr': function (event) {
    if (!this.paid){
      invoiceData.set(this);
      Modal.show('tmplInvoicePayment');
    }
  }
});


///////////////////////////////////////
// Invoice Payment Template
///////////////////////////////////////
Template.tmplInvoicePayment.onCreated(function() {
  notPaid = new ReactiveVar(true);
  vivaReady = new ReactiveVar(false);
  vivaResult = new ReactiveVar(null);
});

Template.tmplInvoicePayment.helpers({
  vpBaseurl: function() {
    return appClient.vpUrl();
  },
  formData: function() {
    let invData = invoiceData.get();
    let amount = invData ? (invData.appointments * appParams.bookingCharge) : 0;
    let stitle = `Πληρωμή € ${(amount/100).toFixed(2)} για ${invData.month}/${invData.year}`;
    let user = Meteor.user();
    return {
      subTitle: stitle,
      subTitle1: `${appParams.APP_NAME}: ${stitle}`,
      pkey: appParams.VP_PUBLIC_KEY,
      sourceCode: appParams.VP_SOURCE,
      surname: user.profile.user.surname,
      name: user.profile.user.name,
      email: user.emails[0].address,
      lang: appParams.PRIMARY_LANG,
      amount: amount,
      refno: invData._id
    };
  },
  notPaid: function() {
    return notPaid.get();
  },
  vivaReady: function() {
    return vivaReady.get();
  },
  vivaResult: function() {
    return vivaResult.get();
  }
});
Template.tmplInvoicePayment.events({ 
  "click .closeDialog": function(event, template){
    invoiceData.set(null);
    Modal.hide();
  },
  'submit form': function (event, template) {
    event.preventDefault();
    let vivaToken = event.target[1].value;
    if (vivaToken.length > 0){
      notPaid.set(false);
    }
    let invoiceId = invoiceData.get()._id;
    Meteor.call('createVivaTransaction', invoiceId, vivaToken, function(error, success) { 
      if (error) { 
        vivaReady.set(true);
        console.log('error', error); 
        vivaResult.set(TAPi18n.__('viva_error_msg'));
      } 
      if (success) { 
        vivaReady.set(true);
        vivaResult.set(TAPi18n.__('viva_success'));
      } 
    });
  }
});



Template.tmplInvoicesAdmin.onCreated(function(){
  this.subscribe('allProviders');
  currentUser = new ReactiveVar(null);  
});
Template.tmplInvoicesAdmin.onRendered(function(){
  //$('#infoTooltip').tooltip();
  Meteor.setTimeout(function(){
    $(function(){
      $("#userId").select2({
        //placeholder: TAPi18n.__("sb_providers_hover"),
        allowClear: true
      });
    });
  }, 500);
});
Template.tmplInvoicesAdmin.helpers({
  allProviders: function(){
    return Meteor.users.find({}).fetch().map(function(p){
      return {
        label: p.profile.user.name + ' ' + p.profile.user.surname,
        value: p._id
      };
    });
  }
});
Template.tmplInvoicesAdmin.events({ 
  'change .user-filter': function (event,t) {
    currentUser.set(document.getElementById('userId').value);    
  },
  'click .generator': function (e,t) {
    Meteor.call('generateInvoices', function(error, success) { 
      if (error) { 
        sweetAlert(TAPi18n.__("fl_error"), TAPi18n.__("fl_error_txt"), "error");
        console.log('error', error); 
      } 
      if (success) { 
         console.log(success);
         sweetAlert(TAPi18n.__('inv_generated', {number: success}), '', "success")
         
      }       
    });
  }
});




// tmplInvoiceStatistics
Template.tmplInvoiceStatistics.onCreated(function(){
  tableData = new ReactiveVar(null);
  invoiceYears = new ReactiveVar(null);
  searchParams = new ReactiveVar(null);
  selectedTblYear = new ReactiveVar(new Date().getFullYear());
  //selectedTblMonth = new ReactiveVar(new Date().getMonth()-1);
  let params = {};
  this.autorun(function(){
    params.year = selectedTblYear.get();
    //params.month = selectedTblMonth.get();
    Meteor.call('getInvoiceStats', params, function(error, result) { 
      if (error) { 
        console.log('error', error); 
      } 
      if (result) {
        tableData.set(result.data);
        invoiceYears.set(result.years);
      } 
    }); 
  });
});

Template.tmplInvoiceStatistics.helpers({
  tableData: function(){
    let data = tableData.get();
    return data && data.map(function(r){
      return {
        year: r.year,
        month: moment(r.month,'MM').format('MMMM'),
        paid: r.paid > 0 ? `<a href='?month=${r.month}&year=${r.year}&paid=true' class='clickable'>${r.paid}</a>` : r.paid,
        unpaid: r.unpaid > 0 ? `<a href='?month=${r.month}&year=${r.year}&paid=false' class='clickable'>${r.unpaid}</a>` : r.unpaid,
        income: (r.paid * appParams.bookingCharge)/100,
        pending: (r.unpaid * appParams.bookingCharge)/100,
      }
    });
  },
  apptYears: function(){
    if (invoiceYears.get()){
      var ret = [];
      _.each(invoiceYears.get(), function(yr){
        let year = {};
        year.value = yr;
        year.selected = yr === moment().year() ? 'selected' : '';
        ret.push(year);
      });
      return ret;
    }
  }
});
Template.tmplInvoiceStatistics.events({
  'change [name="year"]' ( event, template ) {
    event.preventDefault();
    selectedTblYear.set(Number(event.target.value));
  },
  'click .clickable' (event, template) {
    event.preventDefault();    
    let b = new URL(event.target.href);
    
    
    let searchParameters = {
      month: b.searchParams.get('month'),
      year: b.searchParams.get('year'),
      paid: b.searchParams.get('paid'),
    }
    searchParams.set(searchParameters);
    Modal.show('tmplInvoiceList');
  }
});

////////////////////////
// tmplInvoiceList
////////////////////////
Template.tmplInvoiceList.onCreated(function() {
  invoiceList = new ReactiveVar(null);
  var self = this;

  Meteor.call('getInvoices', searchParams.get(), function(error, result) { 
    if (error) { 
      console.log('error', error); 
    } 
    if (result) { 
       invoiceList.set(result);
    } 
  });
});

Template.tmplInvoiceList.helpers({
  hasInvoices: function () {
    return invoiceList.get();
  },
  subtitle: function(){
    let a = searchParams.get();    
    return a.paid === 'true' ? TAPi18n.__('inv_paidp') + ': ' + a.month+'/'+a.year :
      TAPi18n.__('inv_notpaidp') + ': ' + a.month+'/'+a.year;
  },
  invoiceData: function () {
    return invoiceList.get();
  },
  displayedFields : function() {
    return [
      {
        key: 'fullname', 
        label: TAPi18n.__('ap_provider'),
        fn: function(value, object){
          let retStr = '';
          retStr = `<a href='/admin/user/${object.providerId}' class='userlink'>${value}</small>`;
          return Spacebars.SafeString(retStr);
        }
      },
      {key: 'appointments',label: TAPi18n.__("inv_appts")}, 
      {
        key: 'createdAt',
        label: TAPi18n.__("inv_issued"),
        fn: function(value, object){
          return appClient.dateShort(value);
        }
      },
      {
        key: 'amount',
        label: TAPi18n.__("inv_amount"),
        fn: function(value, object){
          let charge = appParams.bookingCharge;
          // charge is in cents, so divide by 100
          return '€ ' + ((object.appointments * charge)/100).toFixed(2);
        }
      },
      {
        key: 'paid',
        label: TAPi18n.__("inv_status"),
        fn: function(value, object){
          let retStr = '';
          if (value) {
            let payDate = object.payDate ? moment(object.payDate).format("DD-MM-YYYY, HH:mm") : '';
            // link to viva wallet receipt
            let link = appClient.vpUrl()+'/web/receipt?tid='+object.payTransaction;
            retStr = `${TAPi18n.__("inv_paid")}&nbsp;<a href='${link}' target='_blank' title='${TAPi18n.__("inv_download")}'><i class="fa fa-download"></a></i><br><small>(${payDate})</small>`;
          } else {
            retStr = `${TAPi18n.__("inv_notpaid")}`
          }
          return Spacebars.SafeString(retStr);
        }
      }
    ]
 },
});

Template.tmplInvoiceList.events({ 
  'click .userlink': function(event, template) { 
     Modal.hide();
  } 
});