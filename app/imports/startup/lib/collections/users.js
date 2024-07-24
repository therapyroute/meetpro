// Collection containing all user and provider info which is attached to Meteor.users built-in collection
Schema = {};

// User Schema
Schema.userSchema = new SimpleSchema({
  name: {
    type: String,
  },
  surname: {
    type: String,
  },
  gender: {
    type: String,
    optional: true
  },
  mobile: {
    type: String,
    autoform: {
      type: 'masked-input',
      mask: '+0000000000000000'
    },
    optional: true
  },
  // filename
  photo: {
    type: String,
    label: "Photo",
    optional: true
  },
  allowed_notifications: {
    type: [String],
    // allowed values: later
    optional: true
  },
  email_notifications: {
    type: Boolean,
    optional: true
  },
  lang: {
    type: String,
    optional: true,
    defaultValue: 'en'
  },
  timezone: {
    type: String,
    optional: true
  },
  slug: {
    type: String,
    optional: true
  }
});

// Provider-specific Schemas

// Sub-Schemas
Schema.scheduleSchema = new SimpleSchema({
  // an array of arrays. Format: ['day': [start,start2,start3]]
  // e.g. [0: ['09:00','09:30','11:30'], 1: ['08:00']]
  day: {
    type: Array,
    optional: true
  },
  'day.$': {
    type: Array,
    optional: true
  },
  'day.$.$': {
    type: String,
    optional: true
  },
  // Use different duration per provider
  duration: {
    type: Number,
    label: 'Duration (in minutes)',
    optional: true,
    defaultValue: 30
  },
  comments: {
    type: String,
    optional: true
  },
  exceptions: {
    type: [Date],
    optional: true
  }
});
Schema.bioSchema = new SimpleSchema({
  personal: {
    type: String,
    max: 1000,
    autoform: {
      afFieldInput: {
        type: 'summernote',
        // implement character count @ summernote editor
        settings: {
          callbacks: {
            onKeydown: function(e) {
              var characterLimit = 800;
              var characters = $(".note-editable").text();
              var totalCharacters = characters.length;
      
              //Update value
              $("#Counter").text(characterLimit-totalCharacters);
      
              //Check and Limit Characters
              if(totalCharacters >= characterLimit){
                return false;
              }		      
            }
          }
        }
      }
    },
    optional: true
  },
  category1: {
    type: String,
    max: 700,
    autoform: {
      afFieldInput: {
        type: 'summernote',
      }
    },
    optional: true
  },
  category2: {
    type: String,
    max: 700,
    autoform: {
      afFieldInput: {
        type: 'summernote',
      }
    },
    optional: true
  }
});
// Billing related code - left for future reference
// Schema.providerVPSchema = new SimpleSchema({
//   "VP_PUBLIC_KEY": {
//     type: String,
//     optional: true,
//     autoform: {
//       group: 'Viva Wallet'
//     }
//   },
//   "VP_MERCHANT_ID": {
//     type: String,
//     optional: true,
//     autoform: {
//       group: 'Viva Wallet'
//     }
//   },
//   "VP_API_KEY": {
//     type: String,
//     optional: true,
//     autoform: {
//       type: 'password',
//       group: 'Viva Wallet'
//     }
//   },
//   "VP_SOURCE": {
//     type: String,
//     optional: true,
//     autoform: {
//       group: 'Viva Wallet'
//     }
//   },
// });

// Main Schema
Schema.providerSchema = new SimpleSchema({
  short_bio: {
    type: Schema.bioSchema,
    label: "C.V.",
    optional: true
  },
  price: {
    type: Number,
    decimal: true,
    optional: true
  },
  specialities: {
    type: [String],
    label: "Specialities",
    optional: true
  },
  expertise: {
    type: [String],
    label: "Speciality details",
    optional: true
  },
  schedule: {
    type: Schema.scheduleSchema,
    label: "Schedule",
    optional: true
  },
  // featured: be shown first (premium feature, should be enabled by admins)
  featured: {
    type: Boolean,
    label: 'Featured',
    optional: true
  },
  customUrl: {
	  type: String,
	  optional: true
  },
  address: {
    type: String,
    optional: true,
    autoform: {
      afFieldInput: {
          type: "textarea",
          rows: 4,
      }
    },
  },
  allowf2f: {
    type: Boolean,
    optional: true
  },
  // displayRating: whether the rating is displayed on the profile or not
  displayRating: {
    type: Boolean,
    optional: true,
    defaultValue: false
  },
  ratings: {
    type: [Object],
    optional: true
  },
  "ratings.$.bookingId": {type: String},
  "ratings.$.rating": {type: Number},
  // Billing related code - left for future reference
  // viva: {
  //   type: Schema.providerVPSchema,
  //   optional: true
  // }
});

// Schema to be attached to users collection
Schema.imProfile = new SimpleSchema({
  user: {
    type: Schema.userSchema,
    optional: true
  },
  provider: {
    type: Schema.providerSchema,
    optional: true
  }
});

// New user schema
SchemaUser = new SimpleSchema({
    username: {
        type: String,
        // For accounts-password, either emails or username is required, but not both. It is OK to make this
        // optional here because the accounts-password package does its own validation.
        // Third-party login packages may not require either. Adjust this schema as necessary for your usage.
        optional: true
    },
    emails: {
        type: Array,
        // For accounts-password, either emails or username is required, but not both. It is OK to make this
        // optional here because the accounts-password package does its own validation.
        // Third-party login packages may not require either. Adjust this schema as necessary for your usage.
        optional: true
    },
    "emails.$": {
        type: Object
    },
    "emails.$.address": {
        type: String,
        regEx: SimpleSchema.RegEx.Email,
        label: 'e-mail'
    },
    "emails.$.verified": {
        type: Boolean
    },
    registered_emails: { type: [Object], blackbox: true, optional: true },
    createdAt: {
        type: Date,
        optional: true
    },
    profile: {
        type: Schema.imProfile,
        optional: true
    },
    // Make sure this services field is in your schema if you're using any of the accounts packages
    services: {
        type: Object,
        optional: true,
        blackbox: true
    },
    // Add `roles` to your schema if you use the meteor-roles package.
    // Option 1: Object type
    // If you specify that type as Object, you must also specify the
    // `Roles.GLOBAL_GROUP` group whenever you add a user to a role.
    // Example:
    // Roles.addUsersToRoles(userId, ["admin"], Roles.GLOBAL_GROUP);
    // You can't mix and match adding with and without a group since
    // you will fail validation in some cases.
    //roles: {
    //    type: Object,
    //    optional: true,
    //    blackbox: true
    //},
    // Option 2: [String] type
    // If you are sure you will never need to use role groups, then
    // you can specify [String] as the type
    roles: {
        type: [String],
        allowedValues: ['user','provider','admin','unconfirmed','inactive'],
        optional: true
    },
    group: {
      type: String,
      optional: true
    },
    admin: {
      type: Boolean,
      optional: true
    }
});

// Attach to Meteor.users array. Use by calling 'Meteor.users'
SchemaUser.i18n("schemas.users");
Meteor.users.attachSchema(SchemaUser);
