// Subscription specific REST API routes
JsonRoutes.ErrorMiddleware.use('/client',RestMiddleware.handleErrorAsJson);

// POST Route to add client & admin user
// Params: name, url, subscription, plan, email, groupId
JsonRoutes.add("post", "/client", function (req, res, next) {
  // authenticate
  let reqData = req.body;
  //console.log(reqData);
  if (typeof req.authToken === undefined || req.authToken !== Meteor.settings.private.REST_BEARER_TOKEN){
    let returnData = {
      "error" : {
        "status" : 502,
        "message" : "Bad gateway."
      }
    }
    JsonRoutes.sendResult(res, {
      code: 502,
      data: returnData
    });
    console.log('POST /client route: bad gateway');
  } else {
    // check if client or owner exists
    let hasClient = Params.direct.findOne({
      _groupId: reqData.groupId
    });
    let hasUser = Accounts.findUserByEmail(reqData.email);
    
    if (hasClient || hasUser){
      let returnData = {
        "error" : {
          "status" : 503,
          "message" : "Client or owner exists."
        }
      }
      JsonRoutes.sendResult(res, {
        code: 503,
        data: returnData
      });
      console.log('POST /client route: client or owner exists');
    } else {
      // check if email is valid & if other fields are strings
      let ValidEmailRegex = /^[A-Z0-9\._%+-]+@[A-Z0-9\.-]+\.[A-Z]{2,}$/i;
      let ValidEmail = Match.Where(function(x) {
        check(x, String);
        return x.length <= 254 && ValidEmailRegex.test(x);
      });
      check(reqData.email, ValidEmail);
      check(reqData.name, String);
      check(reqData.url, String);
      check(reqData.groupId, String);
      check(reqData.subscription, String);
      check(reqData.plan, String);
      check(reqData.fname, String);
      check(reqData.lname, String);
      
      // call method to create user & client
      Meteor.call('initiateClient', reqData, function(error, result) { 
        if (error) { 
          console.log('error', error); 
        } 
        if (result) { 
          JsonRoutes.sendResult(res, {
            data: result
          });
          console.log('POST /client route: ');
          console.log(result);
        } 
      });
    }
  }
});

// GET Route to retrieve client info
// Params: groupId
JsonRoutes.add("get", "/client/:groupId", function (req, res, next) {
  // authenticate
  if (typeof req.authToken === undefined || 
    req.authToken !== Meteor.settings.private.REST_BEARER_TOKEN ||
    !req.params.groupId){
    let returnData = {
      "error" : {
        "status" : 502,
        "message" : "Bad gateway."
      }
    }
    JsonRoutes.sendResult(res, {
      code: 502,
      data: returnData
    });
    console.log('GET /client route: bad gateway');
  } else {
    let returnData = [];
    // check if client or owner exists
    let theParams = Params.direct.findOne({
      _groupId: req.params.groupId
    });
    
    if (!theParams){
      returnData = {
        "error" : {
          "status" : 503,
          "message" : "Client not found."
        }
      }
      console.log('GET /client route: client not found');
    } else {
      returnData = theParams;
      console.log('GET /client route: client exists');
    }
    JsonRoutes.sendResult(res, {
      code: 503,
      data: returnData
    });
  }
});

// PUT Route to modify client info
// Params: name, url, subscriptionId, ownerId
JsonRoutes.add("post", "/client/update/:groupId", function (req, res, next) {
  // authenticate
  let reqData = req.body;
  if (typeof req.authToken === undefined || req.authToken !== Meteor.settings.private.REST_BEARER_TOKEN){
    let returnData = {
      "error" : {
        "status" : 502,
        "message" : "Bad gateway."
      }
    }
    JsonRoutes.sendResult(res, {
      code: 502,
      data: returnData
    });
    console.log('POST /client/update route: bad gateway');
  } else {
    // check if client or owner exists
    let hasClient = Params.direct.findOne({
      _groupId: req.params.groupId
    });
    
    if (!hasClient){
      let returnData = {
        "error" : {
          "status" : 503,
          "message" : "Client does not exist."
        }
      }
      JsonRoutes.sendResult(res, {
        code: 503,
        data: returnData
      });
      console.log('POST /client/update route: client ' + req.params.clienturl + ' does not exist');
    } else {
      check(reqData, Object);
      
      let result = Params.direct.update({_groupId: req.params.groupId}, {$set: reqData});
      let returnData = '';
      let code = 200;
      if (result > 0){
        returnData = {
          "success" : {
            "status" : 200,
            "message" : "Successful!"
          }
        }
        console.log('POST /client/update route: success');
        console.log(reqData);
      } else {
        code = 503;
        returnData = {
          "error" : {
            "status" : 503,
            "message" : "Client does not exist."
          }
        }
        console.log('POST /client/update route: client does not exist');
      }
      JsonRoutes.sendResult(res, {
        code: code,
        data: returnData
      });
    }
  }
});

// DELETE Route to delete client
// Params: groupId
JsonRoutes.add("delete", "/client/:groupId", function (req, res, next) {
  // authenticate
  if (typeof req.authToken === undefined || 
    req.authToken !== Meteor.settings.private.REST_BEARER_TOKEN ||
    !req.params.groupId){
    let returnData = {
      "error" : {
        "status" : 502,
        "message" : "Bad gateway."
      }
    }
    JsonRoutes.sendResult(res, {
      code: 502,
      data: returnData
    });
    console.log('DELETE /client route: bad gateway');
  } else {
    let returnData = [];
    let code = 200;
    // check if client or owner exists
    let theParams = Params.direct.findOne({
      _groupId: req.params.groupId
    });
    
    if (!theParams){
      code = 503;
      returnData = {
        "error" : {
          "status" : 503,
          "message" : "Client not found."
        }
      }
      console.log('DELETE /client route: client not found');
    } else {
      Params.direct.remove({_groupId: req.params.groupId});
      returnData = {
        "success" : {
          "status" : 200,
          "message" : "Successful!"
        }
      }
      console.log('DELETE /client route: successful');
    }
    JsonRoutes.sendResult(res, {
      code: code,
      data: returnData
    });
  }
});
