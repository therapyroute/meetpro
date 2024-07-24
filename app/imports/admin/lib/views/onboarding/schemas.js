Schemas = {};

Schemas.generalInformation = new SimpleSchema({
  name:{
    type: String,
    label: 'Business Name',
    autoform: {
      afFieldInput: {
          placeholder: "Enter your business name",
      }
    }
  },
  description: {
    type: String,
    label: 'Description (optional)',
    optional: true,
    autoform: {
      afFieldInput: {
          placeholder: "Enter your business description (up to 300 characters)",
      }
    }
  },
  site_url: {
    type: String,
    label: 'Web page',
    regEx: SimpleSchema.RegEx.Domain, 
    autoform: {
      afFieldInput: {
          placeholder: "e.g mybusiness.com",
      }
    }
  }
});

Schemas.paymentInformation = new SimpleSchema({
  'paymentMethod': {
    type: String,
    label: 'Payment method',
    allowedValues: ['paypal', 'stripe', 'braintree', 'none'],
    autoform: {
      options: [{
        label: 'PayPal',
        value: 'paypal'
      }, {
        label: 'Stripe',
        value: 'stripe'
      }, {
        label: 'Braintree',
        value: 'braintree'
      }, {
        label: "I will setup payments later",
        value: "none"
      }]
    }
  },
  "BT_MERCHANT_ID": {
    type: String,
    optional: true,
    label: TAPi18n.__('merchant_id'),
    custom: function() {
      if (this.field('paymentMethod').value === 'braintree') {
        if(!this.isSet || this.value === null || this.value === "") { return 'required' }
      }
    }
  },
  "BT_PUBLIC_KEY": {
    type: String,
    optional: true,
    label: TAPi18n.__('public_key'),
    custom: function() {
      if (this.field('paymentMethod').value === 'braintree') {
        if(!this.isSet || this.value === null || this.value === "") { return 'required' }
      }
    }
  },
  "BT_PRIVATE_KEY": {
    type: String,
    optional: true,
    autoform: {
      type: 'password',
    },
    label: TAPi18n.__('private_key'),
    custom: function() {
      if (this.field('paymentMethod').value === 'braintree') {
        if(!this.isSet || this.value === null || this.value === "") { return 'required' }
      }
    }
  },
  "STRIPE_API_KEY": {
    type: String,
    optional: true,
    autoform: {
      type: 'password',
    },
    label: TAPi18n.__('api_key'),
    custom: function() {
      if (this.field('paymentMethod').value === 'stripe') {
        if(!this.isSet || this.value === null || this.value === "") { return 'required' }
      }
    }
  },
  "STRIPE_PUBLIC_KEY": {
    type: String,
    optional: true,
    label: TAPi18n.__('public_key'),
    custom: function() {
      if (this.field('paymentMethod').value === 'stripe') {
        if(!this.isSet || this.value === null || this.value === "") { return 'required' }
      }
    }
  },
  "PAYPAL_CLIENT_ID": {
    type: String,
    optional: true,
    custom: function() {
      if (this.field('paymentMethod').value === 'paypal') {
        if(!this.isSet || this.value === null || this.value === "") { return 'required' }
      }
    }
  },
  "PAYPAL_SECRET": {
    type: String,
    optional: true,
    autoform: {
      type: 'password',
    },
    custom: function() {
      if (this.field('paymentMethod').value === 'paypal') {
        if(!this.isSet || this.value === null || this.value === "") { return 'required' }
      }
    }
  }
});

Schemas.expertInformation = new SimpleSchema({
  isExpert: {
    type: String,
    label: "Select an option:",
    allowedValues: ['self','insert'],
    autoform: {
      type: 'select',
      options: function (){
        // if (appParams.plan == 'standard'){
        //   return [{label:"Set my availability",value:'self'}]
        // }
        return[{label:"Set my availability",value:'self'},{label:"Add an expert",value:'insert'}]
      }
    }
  },
  price: {
    type: Number,
    label: "Session price",
    decimal: true,
    optional: true,
    custom: function() {
      if (this.field('isExpert').value === 'self') {
        if(!this.isSet || this.value === null || this.value === "") { return 'required' }
      }
    }
  },
  currency: {
    type: String,
    label: "Currency",
    optional: true,
    autoform: {
      type: 'select2',
      options: function (){return appClient.currencyList()}
    },
    custom: function() {
      if (this.field('isExpert').value === 'self') {
        if(!this.isSet || this.value === null || this.value === "") { return 'required' }
      }
    }
  },
  specialty: {
    type: String,
    label: "Specialty",
    optional: true,
    autoform: {
      afFieldInput: {
          placeholder: "specialty, occupation, job title etc, e.g. Surgeon, Psychiatrist etc.",
      }
    },
    custom: function() {
      if (this.field('isExpert').value === 'insert' || this.field('isExpert').value === 'self') {
        if(!this.isSet || this.value === null || this.value === "") { return 'required' }
      }
    }
  },
  myname: {
    type: String,
    label: 'First Name',
    optional: true,
    custom: function() {
      if (this.field('isExpert').value === 'self') {
        if(!this.isSet || this.value === null || this.value === "") { return 'required' }
      }
    }
  },
  mysurname: {
    type: String,
    label: 'Last name',
    optional: true,
    custom: function() {
      if (this.field('isExpert').value === 'self') {
        if(!this.isSet || this.value === null || this.value === "") { return 'required' }
      }
    }
  },
  name: {
    type: String,
    label: 'First Name',
    optional: true,
    custom: function() {
      if (this.field('isExpert').value === 'insert') {
        if(!this.isSet || this.value === null || this.value === "") { return 'required' }
      }
    }
  },
  surname: {
    type: String,
    label: 'Last name',
    optional: true,
    custom: function() {
      if (this.field('isExpert').value === 'insert') {
        if(!this.isSet || this.value === null || this.value === "") { return 'required' }
      }
    }
  },
  email: {
    type: String,
    label: 'e-mail',
    regEx: SimpleSchema.RegEx.Email,
    optional: true,
    custom: function() {
      if (this.field('isExpert').value === 'insert') {
        if(!this.isSet || this.value === null || this.value === "") { return 'required' }
      }
    }
  },
  // password: {
  //   type: String,
  //   autoform: {
  //     type: 'password'
  //   },
  //   label: 'Password',
  //   optional: true,
  //   custom: function() {
  //     if (this.field('isExpert').value === 'insert') {
  //       if(!this.isSet || this.value === null || this.value === "") { return 'required' }
  //     }
  //   }
  // },
  // password_conf: {
  //   type: String,
  //   autoform: {
  //     type: 'password'
  //   },
  //   label: 'Password (confirmation)',
  //   custom: function() {
  //     if (this.value !== this.field('password').value) {
  //       return 'noMatch';
  //     }
  //     if (this.field('isExpert').value === 'insert') {
  //       if(!this.isSet || this.value === null || this.value === "") { return 'required' }
  //     }
  //   },
  //   optional: true,
  // }
});

Schemas.expertInformation.messages({
  noMatch: "Passwords must match",
});
