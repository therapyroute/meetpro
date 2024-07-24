if (Meteor.settings.public.APP_MULTI_CLIENT) {
    // limits for standard & pro plan
    const appointmentMonthlyLimit = {
        standard: 50,
        pro: 300
    };
    // standard has one provider (the admin), pro has 9 plus admin-provider
    const expertLimit = {
        standard: 2,
        pro: 10
    };

    // server-only, to keep track of client appointment usage
    Usage = new Mongo.Collection('usage');

    UsageSchema = new SimpleSchema({
        clientId: {
        type: String
        },
        month: {
        type: Number
        },
        year: {
            type: Number
        },
        appointments: {
            type: Number
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
        }
    });
  
    Usage.attachSchema(UsageSchema);

    appUsage = {
        // add appointment to monthly usage & check if quota is exceeded
        // returns -1 when appointment limit is reached
        addAppointment (uId = null) { 
            let thePlan = appCommon.getParam('plan', null, uId);
            if (thePlan == 'premium'){
                return 0;
            }
            let d = new Date();
            let theClient = appCommon.getParam('_id', null, uId);
            let month = d.getMonth() + 1;
            let year = d.getFullYear();
            let hasRecord = Usage.findOne({
                clientId: theClient,
                month: month,
                year: year
            });
            if (hasRecord) {
                if (hasRecord.appointments >= appointmentMonthlyLimit[thePlan] - 1) {
                    return -1;
                }
                return Usage.update({_id: hasRecord._id}, { $inc: { appointments: 1 } });
            } else {
                let newRec = {
                    clientId: theClient,
                    month: month,
                    year: year,
                    appointments: 1
                }
                return Usage.insert(newRec);
            }
        },
        // remove appointment from usage when cancelled or aborted
        // returns -1 if appointment decrease (update) fails
        removeAppointment (uId = null) { 
            if (appCommon.getParam('plan', null, uId) === 'premium'){
                return 0;
            }
            let d = new Date();
            let theClient = appCommon.getParam('_id', null, uId);
            let month = d.getMonth() + 1;
            let year = d.getFullYear();
            let hasRecord = Usage.findOne({
                clientId: theClient,
                month: month,
                year: year
            });
            if (hasRecord) {
                return Usage.update({_id: hasRecord._id}, { $inc: { appointments: -1 } });                
            }
            return -1;
        },
        // check if provider can be added
        // return -1 if limit is reached
        checkProviderNumber(uId = null) {
            let thePlan = appCommon.getParam('plan', null, uId);
            if (thePlan === 'premium'){
                return 0;
            }
            let theGroup = Partitioner.group();
            let filter = {
                roles : { $in: ['provider'] },
                group: theGroup 
            };
            let group = {
                _id: null,
                num: {
                    $sum: 1
                }
            };
            let theResult = Meteor.users.aggregate([
                { $match: filter },
                { $group: group }  
            ]);
            if (theResult && theResult[0].num >= expertLimit[thePlan]) {
                return -1;
            } else {
                return 0;
            }
        }
    };  
    Meteor.methods({ 
        getUsage: function(uId = null) { 
            let thePlan = appCommon.getParam('plan', null, uId)
            if (thePlan === 'premium') {
                return false;
            }
            let d = new Date();
            let theClient = appCommon.getParam('_id', null, uId);
            let month = d.getMonth() + 1;
            let year = d.getFullYear();
            let usageRecord = Usage.findOne({
                clientId: theClient,
                month: month,
                year: year
            });
            let theResult = {};
            // find experts
            let theGroup = Partitioner.group();
            let filter = {
                roles : { $in: ['provider'] },
                group: theGroup 
            };
            let group = {
                _id: null,
                num: {
                    $sum: 1
                }
            };
            let expResult = Meteor.users.aggregate([
                { $match: filter },
                { $group: group }  
            ]);
            let experts = null;
            if (!!expResult && expResult[0] && expResult[0].num)
            {
                experts = expResult[0].num
            } else {
                experts = 0
            }
            if (!usageRecord) {
                theResult.appointments = 0;
            } else {
                theResult.appointments = usageRecord.appointments;
            }
            theResult.experts = experts;
            theResult.appointmentLimit = appointmentMonthlyLimit[thePlan];
            theResult.expertLimit = expertLimit[thePlan];
            return theResult;
        } 
    });
}
