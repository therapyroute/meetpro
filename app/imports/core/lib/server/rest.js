// REST routes for frontend
// implemented with simple:json-routes (https://github.com/stubailo/meteor-rest/tree/master/packages/json-routes)

JsonRoutes.Middleware.use('/', JsonRoutes.Middleware.parseBearerToken);

// GET /getexpertcount
JsonRoutes.add("get", "/getexpertcount", function (req, res, next) {
  // authenticate
  let returnData = null;
  // get params from collection
  let params = typeof req.authToken !== undefined ? 
    appCommon.checkBearerToken(req.authToken) : false;
  if (typeof req.authToken === undefined || !params){
    returnData = {
      "error" : {
        "status" : 502,
        "message" : "Bad gateway."
      }
    }
  } else {
    returnData = Meteor.users.find({'roles': 'provider', group: params.group}).count();
  }
  JsonRoutes.sendResult(res, {
    data: returnData
  });
});

// GET /getexperts/page
JsonRoutes.add("get", "/getexperts/:page", function (req, res, next) {
  // authenticate
  let returnData = null;
  // get params from collection
  let params = typeof req.authToken !== undefined ? 
    appCommon.checkBearerToken(req.authToken) : false;
  if (typeof req.authToken === undefined || !params){
    returnData = {
      "error" : {
        "status" : 502,
        "message" : "Bad gateway."
      }
    }
  } else {  
    if (req.params.page == '0')
      returnData = [];
    else {
      var skipCount = (req.params.page - 1) * appCommon.getParam('providersPerPage',params.id);
      var providers = Meteor.users.find(
        {'roles': 'provider', group: params.group},
        { limit: parseInt(appCommon.getParam('providersPerPage', params.id)),
          skip: skipCount,
          // first display featured, then sort alphabetically
          sort: {
            'profile.provider.featured': -1,
            'profile.user.surname': 1
          }
        }
      ).fetch();

      returnData = _.map(providers, function(p){
        return {
          slug: p.profile.user.slug,
          name: p.profile.user.name,
          surname: p.profile.user.surname,
          photo: p.profile.user.photo,
          specialities: Meteor.users.findOne({_id: p._id}).specs(),
          featured: p.profile.provider.featured
        }
      });
    }
  }
  JsonRoutes.sendResult(res, {
    data: returnData
  });
});

// GET /expert/slug
JsonRoutes.add("get", "/getexpert/:slug", function (req, res, next) {
  // authenticate
  let returnData = null;
  // get params from collection
  let params = typeof req.authToken !== undefined ? 
    appCommon.checkBearerToken(req.authToken) : false;
  if (typeof req.authToken === undefined || !params){
    returnData = {
      "error" : {
        "status" : 502,
        "message" : "Bad gateway."
      }
    }
  } else {
    var slug = req.params.slug;
    var p = Meteor.users.findOne(
      {
        'profile.user.slug': slug, 
        'roles': 'provider',
        'group': params.group
      });
    if (!p)
      returnData = {};
    else {
      returnData = {
        slug: p.profile.user.slug,
        name: p.profile.user.name,
        surname: p.profile.user.surname,
        photo: p.profile.user.photo,
        specialities: Meteor.users.findOne({_id: p._id}).specs(),
        bio: p.profile.provider.short_bio,
        expertise: p.profile.provider.expertise,
        price: p.profile.provider.price
      }
    }
  }
  JsonRoutes.sendResult(res, {
    data: returnData
  });
});

// GET /getfeatured
JsonRoutes.add("get", "/getfeatured", function (req, res, next) {
  // authenticate
  let returnData = null;
  // get params from collection
  let params = typeof req.authToken !== undefined ? 
    appCommon.checkBearerToken(req.authToken) : false;
  if (typeof req.authToken === undefined || !params){
    returnData = {
      "error" : {
        "status" : 502,
        "message" : "Bad gateway."
      }
    }
  } else {
    var providers = Meteor.users.find(
      { 
        'roles': 'provider', 
        'profile.provider.featured': true,
        'group': params.group
      },
      { // sort alphabetically
        sort: {
          'profile.user.surname': 1,
          'profile.user.name': 1,
        }
      }
    ).fetch();

    returnData = _.map(providers, function(p){
      return {
        slug: p.profile.user.slug,
        name: p.profile.user.name,
        surname: p.profile.user.surname,
        photo: p.profile.user.photo,
        specialities: Meteor.users.findOne({_id: p._id}).specs()
      }
    });
  }
  JsonRoutes.sendResult(res, {
    data: returnData
  });
});

// search routes
// GET /search/term/page
JsonRoutes.add("get", "/search/:term/:page", function search(req, res, next) {
  // authenticate
  let returnData = null;
  // get params from collection
  let params = typeof req.authToken !== undefined ? 
    appCommon.checkBearerToken(req.authToken) : false;
  if (typeof req.authToken === undefined || !params){
    returnData = {
      "error" : {
        "status" : 502,
        "message" : "Bad gateway."
      }
    }
  } else {
    if (req.params.term == '')
      returnData = [];
    else {
      var skipCount = req.params.page > 0 ?
        (req.params.page - 1) * appCommon.getParam('providersPerPage',params.id) : 0;

      let search = req.params.term;
      let regex = new RegExp(search, 'i' );
      // first search in specialities
      let specDB = [];
      if (Meteor.settings.public.APP_MULTI_CLIENT){
        specDB = Partitioner.bindGroup(params.group, function() {
          return Specialities.find({name: {$in: [regex]}},{fields: {_id: 1}}).fetch();
        });
      } else {
        specDB = Specialities.find({name: {$in: [regex]}},{fields: {_id: 1}}).fetch();
      }
      var specsIds = specDB.map((sp) => sp._id);

      // Then in expertise etc
      let expDB = [];
      if (Meteor.settings.public.APP_MULTI_CLIENT){
        expDB = Partitioner.bindGroup(params.group, function() {
          return Expertise.find({name: {$in: [regex]}}).fetch();
        });
      } else {
        expDB = Expertise.find({name: {$in: [regex]}}).fetch();
      }
      var expertise = expDB.map((expt) => expt._id);

      var providers = Meteor.users.find(
        {
          'roles': {$in: ['provider']}, group: params.group,
          $or: [
            { 'profile.user.surname': regex },
            { 'profile.provider.specialities': { $in: specsIds} },
            { 'profile.provider.expertise': { $in: [regex] } }
          ]
        },
        {
          limit: parseInt(appCommon.getParam('providersPerPage', params.id)),
          skip: skipCount,
          // first display featured, then sort alphabetically
          sort: {
            'profile.provider.featured': -1,
            'profile.user.surname': 1
          }
        }
      ).fetch();

      returnData = _.map(providers, function(p){
        return {
          slug: p.profile.user.slug,
          name: p.profile.user.name,
          surname: p.profile.user.surname,
          photo: p.profile.user.photo,
          specialities: Meteor.users.findOne({_id: p._id}).specs(),
          featured: p.profile.provider.featured
        }
      });
    }
  }
  JsonRoutes.sendResult(res, {
    data: returnData
  });
});

// GET /searchall/term
// for searching from the front page and the app
JsonRoutes.add("get", "/searchall/:term", function (req, res, next) {
  // authenticate
  let returnData = null;
  // get params from collection
  let params = typeof req.authToken !== undefined ? 
    appCommon.checkBearerToken(req.authToken) : false;
  if (typeof req.authToken === undefined || !params){
    returnData = {
      "error" : {
        "status" : 502,
        "message" : "Bad gateway."
      }
    }
  } else {
    if (req.params.term == '')
      returnData = [];
    else {
      let search = req.params.term;
      var regex = new RegExp(search, 'i' );
      // First search in specialities
      var specs = [];
      if (Meteor.settings.public.APP_MULTI_CLIENT){
        specs = Partitioner.bindGroup(params.group, function() {
          return _.map(Specialities.find({name: {$in: [regex]}}).fetch(), function(sp){
            // console.log(sp);
            return {
              type: 'speciality',
              _id: sp._id,
              name: sp.name
            };
          })
        });
      } else {
        specs = _.map(Specialities.find({name: {$in: [regex]}}).fetch(), function(sp){
            return {
              type: 'speciality',
              _id: sp._id,
              name: sp.name
            };
        });
      }

      // Then in expertise etc
      var expertise = [];
      if (Meteor.settings.public.APP_MULTI_CLIENT){
        expertise = Partitioner.bindGroup(params.group, function() {
          return _.map(Expertise.find({name: {$in: [regex]}}).fetch(), function(expt){
            return {
              type:  'expertise',
              id: expt._id,
              code: expt.itemCode,
              name: expt.name
            };
          });
        });
      } else {
        expertise = _.map(Expertise.find({name: {$in: [regex]}}).fetch(), function(expt){
          return {
            type:  'expertise',
            id: expt._id,
            code: expt.itemCode,
            name: expt.name
          };
        });
      }
      // Finally, search in expert surnames & specialities
      var specsIds = _.map(specs, function(sp){
        return sp.id;
      });

      var providers = Meteor.users.find(
        {
          'roles': {$in: ['provider']}, group: params.group,
          $or: [
            { 'profile.user.surname': regex },
            { 'profile.user.slug': { $in: [regex] } },
            { 'profile.provider.specialities': { $in: specsIds} },
            { 'profile.provider.expertise': { $in: [regex] } },
          ]
        },
        {
          // limit: parseInt(Meteor.settings.public.REST_RESULT_LIMIT),
          // first display featured, then sort alphabetically
          sort: {
            'profile.provider.featured': -1,
            'profile.user.surname': 1
          }
        }
      ).fetch();

      var providerData = _.map(providers, function(p){
        return {
          type: 'provider',
          slug: p.profile.user.slug,
          name: p.profile.user.name,
          surname: p.profile.user.surname,
          specialities: Meteor.users.findOne({_id: p._id}).specs(),
          featured: p.profile.provider.featured
        }
      });
      if (specs.length + providerData.length + expertise.length > 0){
        returnData = specs.concat(providerData).concat(expertise);
      }
      else {
        returnData = {};
      }
    }
  }
  JsonRoutes.sendResult(res, {
    data: returnData
  });
});

// // POST /message
// JsonRoutes.add("post", "/message", function (req, res, next) {
//   // authenticate
//   let returnData = null;
//   if (typeof req.authToken === undefined || req.authToken !== appCommon.getParam('bearerToken')){
//     returnData = {
//       "error" : {
//         "status" : 502,
//         "message" : "Bad gateway."
//       }
//     }
//   } else {
//     let cfData = req.body;
//     // check if email is valid & if other fields are strings
//     let ValidEmailRegex = /^[A-Z0-9\._%+-]+@[A-Z0-9\.-]+\.[A-Z]{2,}$/i;
//     let ValidEmail = Match.Where(function(x) {
//       check(x, String);
//       return x.length <= 254 && ValidEmailRegex.test(x);
//     });
//     check(cfData.email, ValidEmail);
//     check(cfData.name, String);
//     check(cfData.message, String);
//     //
//     var result = appCommon.cfInsert(cfData);

//     if (result) {
//       JsonRoutes.sendResult(res, {
//         data: result
//       });
//       // notify admin via email
//       let emText = `Όνοματεπώνυμο: ${cfData.name}<br>
//       email: ${cfData.email}<br>
//       Μήνυμα: ${cfData.message}`;
//       let emObj = {
//         lang: 'el',
//         to: appCommon.getParam('ADMIN_EMAIL'),
//         subject: 'Νέο μήνυμα',
//         text: emText,
//       }
//       appCommon.appSendMail(emObj);
//     }
//   }
// });


// // POST /subscribe
// // for subscriptions
// JsonRoutes.add("post", "/subscribe", function (req, res, next) {
//   let cfData = req.body;
//   // check if email is valid & if other fields are strings
//   let ValidEmailRegex = /^[A-Z0-9\._%+-]+@[A-Z0-9\.-]+\.[A-Z]{2,}$/i;
//   let ValidEmail = Match.Where(function(x) {
//     check(x, String);
//     return x.length <= 254 && ValidEmailRegex.test(x);
//   });
//   // re-check input
//   check(cfData.email, ValidEmail);
//   check(cfData.name, String);
//   // prepare data for email
//   let emText = `Όνοματεπώνυμο: ${cfData.name}<br>
//   email: ${cfData.email}
//   `;
//   let emObj = {
//     lang: 'el',
//     to: appCommon.getParam('ADMIN_EMAIL'),
//     subject: 'Νέος Συνδρομητής',
//     text: emText,
//   }
//   // insert to DB
//   try {
//     var result = Subscriptions.insert(cfData);
//     JsonRoutes.sendResult(res, {
//       data: result
//     });
//   }
//   catch(err) {
//     console.log(err);
//     JsonRoutes.sendResult(res, {
//       data: err
//     });
//   }
//   // send email to admin
//   appCommon.appSendMail(emObj);
// });


JsonRoutes.setResponseHeaders({
  "Cache-Control": "no-store",
  "Pragma": "no-cache",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With"
});
