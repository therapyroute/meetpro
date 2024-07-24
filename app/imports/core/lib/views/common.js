import moment from 'moment-timezone';

// common client functions
appClient = {
  dateShort(value) {
    let tzn = Session.get('timezone');
    let frmt = "DD-MM-YYYY, HH:mm";
    return tzn ? moment(value).tz(tzn).format(frmt) : moment(value).format(frmt);
  },
  dateLong(value) {
    let tzn = Session.get('timezone');
    let frmt = "ddd DD-MM-YYYY, HH:mm";
    return tzn ? moment(value).tz(tzn).format(frmt) : moment(value).format(frmt);
  },
  dateVLong(value) {
    let tzn = Session.get('timezone');
    let frmt = "LLLL";
    return tzn ? moment(value).tz(tzn).format(frmt) : moment(value).format(frmt);
  },
  dateCustom(value, frmt) {
    let tzn = Session.get('timezone');
    return tzn ? moment(value).tz(tzn).format(frmt) : moment(value).format(frmt);
  },
  minutesToString( minutes ) {
    let days = minutes / (60*24);
    let hours = (minutes % (60*24)) / 60;
    let mins = (minutes % (60*24)) % 60;
    return parseInt(days) + ' ' + TAPi18n.__('st_days') + ', ' + parseInt(hours) + ' ' + TAPi18n.__('st_hours') + ', ' +parseInt(mins) + ' ' + TAPi18n.__('st_minutes');
  },
  isAdmin(){
    return Roles.userIsInRole(Meteor.user(),['admin']);
  },
  isAdminExpert(){
    return Roles.userIsInRole(Meteor.user(),'admin') && Roles.userIsInRole(Meteor.user(),'provider');
  },
  isSuperAdmin(){
    let theUser = Meteor.user();
    return Meteor.settings.public.APP_MULTI_CLIENT && Roles.userIsInRole(theUser,['admin']) && theUser.admin;
  },
  hasf2f(){
    return Meteor.settings.public.face2face === 'true';
  },
  // Viva Wallet URL
  vpUrl() {
    return Meteor.settings.public.APP_MODE == 'dev' ?
     'https://demo.vivapayments.com' : 
     'https://vivapayments.com';
  },
  // Alert when server connection status changes
  connectionStatusChange(status) {
    switch (status) {
      case 'connected':
        sAlert.closeAll();
        sAlert.success(TAPi18n.__('status_connected'));
        break;
      case 'waiting':
        sAlert.closeAll();
        sAlert.warning(TAPi18n.__('status_waiting'), {timeout: 'none'});
        break;
      case 'offline':
        sAlert.closeAll();
        sAlert.error(TAPi18n.__('status_offline'), {timeout: 'none'});
        break;
      case 'connecting':
        sAlert.closeAll();
        sAlert.error(TAPi18n.__('status_connecting'), {timeout: 'none'});
        break;
      case 'failed':
        sAlert.closeAll();
        sAlert.error(TAPi18n.__('status_failed'), {timeout: 'none'});
        break;
      default:
        break;
    }
  },
  currencyList() {
    return [
      {label: 'United States Dollar', value: 'USD'},
      {label: 'Euro', value: 'EUR'},
      {label: 'British Pound', value: 'GBP'},
      {label: 'Afghan Afghani', value: 'AFN'},
      {label: 'Albanian Lek', value: 'ALL'},
      {label: 'Algerian Dinar', value: 'DZD'},
      {label: 'Angolan Kwanza', value: 'AOA'},
      {label: 'Argentine Peso', value: 'ARS'},
      {label: 'Armenian Dram', value: 'AMD'},
      {label: 'Aruban Florin', value: 'AWG'},
      {label: 'Australian Dollar', value: 'AUD'},
      {label: 'Azerbaijani Manat', value: 'AZN'},
      {label: 'Bahamian Dollar', value: 'BSD'},
      {label: 'Bangladeshi Taka', value: 'BDT'},
      {label: 'Barbadian Dollar', value: 'BBD'},
      {label: 'Belize Dollar', value: 'BZD'},
      {label: 'Bermudian Dollar', value: 'BMD'},
      {label: 'Bolivian Boliviano', value: 'BOB'},
      {label: 'Bosnia & Herzegovina Convertible Mark', value: 'BAM'},
      {label: 'Botswana Pula', value: 'BWP'},
      {label: 'Brazilian Real', value: 'BRL'},
      {label: 'Brunei Dollar', value: 'BND'},
      {label: 'Bulgarian Lev', value: 'BGN'},
      {label: 'Burundian Franc', value: 'BIF'},
      {label: 'Cambodian Riel', value: 'KHR'},
      {label: 'Canadian Dollar', value: 'CAD'},
      {label: 'Cape Verdean Escudo', value: 'CVE'},
      {label: 'Cayman Islands Dollar', value: 'KYD'},
      {label: 'Central African Cfa Franc', value: 'XAF'},
      {label: 'Cfp Franc', value: 'XPF'},
      {label: 'Chilean Peso', value: 'CLP'},
      {label: 'Chinese Renminbi Yuan', value: 'CNY'},
      {label: 'Colombian Peso', value: 'COP'},
      {label: 'Comorian Franc', value: 'KMF'},
      {label: 'Congolese Franc', value: 'CDF'},
      {label: 'Costa Rican Colón', value: 'CRC'},
      {label: 'Croatian Kuna', value: 'HRK'},
      {label: 'Czech Koruna', value: 'CZK'},
      {label: 'Danish Krone', value: 'DKK'},
      {label: 'Djiboutian Franc', value: 'DJF'},
      {label: 'Dominican Peso', value: 'DOP'},
      {label: 'East Caribbean Dollar', value: 'XCD'},
      {label: 'Egyptian Pound', value: 'EGP'},
      {label: 'Ethiopian Birr', value: 'ETB'},
      {label: 'Falkland Islands Pound', value: 'FKP'},
      {label: 'Fijian Dollar', value: 'FJD'},
      {label: 'Gambian Dalasi', value: 'GMD'},
      {label: 'Georgian Lari', value: 'GEL'},
      {label: 'Gibraltar Pound', value: 'GIP'},
      {label: 'Guatemalan Quetzal', value: 'GTQ'},
      {label: 'Guinean Franc', value: 'GNF'},
      {label: 'Guyanese Dollar', value: 'GYD'},
      {label: 'Haitian Gourde', value: 'HTG'},
      {label: 'Honduran Lempira', value: 'HNL'},
      {label: 'Hong Kong Dollar', value: 'HKD'},
      {label: 'Hungarian Forint', value: 'HUF'},
      {label: 'Icelandic Króna', value: 'ISK'},
      {label: 'Indian Rupee', value: 'INR'},
      {label: 'Indonesian Rupiah', value: 'IDR'},
      {label: 'Israeli New Sheqel', value: 'ILS'},
      {label: 'Jamaican Dollar', value: 'JMD'},
      {label: 'Japanese Yen', value: 'JPY'},
      {label: 'Kazakhstani Tenge', value: 'KZT'},
      {label: 'Kenyan Shilling', value: 'KES'},
      {label: 'Kyrgyzstani Som', value: 'KGS'},
      {label: 'Lao Kip', value: 'LAK'},
      {label: 'Lebanese Pound', value: 'LBP'},
      {label: 'Lesotho Loti', value: 'LSL'},
      {label: 'Liberian Dollar', value: 'LRD'},
      {label: 'Macanese Pataca', value: 'MOP'},
      {label: 'Macedonian Denar', value: 'MKD'},
      {label: 'Malagasy Ariary', value: 'MGA'},
      {label: 'Malawian Kwacha', value: 'MWK'},
      {label: 'Malaysian Ringgit', value: 'MYR'},
      {label: 'Maldivian Rufiyaa', value: 'MVR'},
      {label: 'Mauritanian Ouguiya', value: 'MRO'},
      {label: 'Mauritian Rupee', value: 'MUR'},
      {label: 'Mexican Peso', value: 'MXN'},
      {label: 'Moldovan Leu', value: 'MDL'},
      {label: 'Mongolian Tögrög', value: 'MNT'},
      {label: 'Moroccan Dirham', value: 'MAD'},
      {label: 'Mozambican Metical', value: 'MZN'},
      {label: 'Myanmar Kyat', value: 'MMK'},
      {label: 'Namibian Dollar', value: 'NAD'},
      {label: 'Nepalese Rupee', value: 'NPR'},
      {label: 'Netherlands Antillean Gulden', value: 'ANG'},
      {label: 'New Taiwan Dollar', value: 'TWD'},
      {label: 'New Zealand Dollar', value: 'NZD'},
      {label: 'Nicaraguan Córdoba', value: 'NIO'},
      {label: 'Nigerian Naira', value: 'NGN'},
      {label: 'Norwegian Krone', value: 'NOK'},
      {label: 'Pakistani Rupee', value: 'PKR'},
      {label: 'Panamanian Balboa', value: 'PAB'},
      {label: 'Papua New Guinean Kina', value: 'PGK'},
      {label: 'Paraguayan Guaraní', value: 'PYG'},
      {label: 'Peruvian Nuevo Sol', value: 'PEN'},
      {label: 'Philippine Peso', value: 'PHP'},
      {label: 'Polish Złoty', value: 'PLN'},
      {label: 'Qatari Riyal', value: 'QAR'},
      {label: 'Romanian Leu', value: 'RON'},
      {label: 'Russian Ruble', value: 'RUB'},
      {label: 'Rwandan Franc', value: 'RWF'},
      {label: 'São Tomé and Príncipe Dobra', value: 'STD'},
      {label: 'Saint Helenian Pound', value: 'SHP'},
      {label: 'Salvadoran Colón', value: 'SVC'},
      {label: 'Samoan Tala', value: 'WST'},
      {label: 'Saudi Riyal', value: 'SAR'},
      {label: 'Serbian Dinar', value: 'RSD'},
      {label: 'Seychellois Rupee', value: 'SCR'},
      {label: 'Sierra Leonean Leone', value: 'SLL'},
      {label: 'Singapore Dollar', value: 'SGD'},
      {label: 'Solomon Islands Dollar', value: 'SBD'},
      {label: 'Somali Shilling', value: 'SOS'},
      {label: 'South African Rand', value: 'ZAR'},
      {label: 'South Korean Won', value: 'KRW'},
      {label: 'Sri Lankan Rupee', value: 'LKR'},
      {label: 'Surinamese Dollar', value: 'SRD'},
      {label: 'Swazi Lilangeni', value: 'SZL'},
      {label: 'Swedish Krona', value: 'SEK'},
      {label: 'Swiss Franc', value: 'CHF'},
      {label: 'Tajikistani Somoni', value: 'TJS'},
      {label: 'Tanzanian Shilling', value: 'TZS'},
      {label: 'Thai Baht', value: 'THB'},
      {label: 'Tongan Paʻanga', value: 'TOP'},
      {label: 'Trinidad and Tobago Dollar', value: 'TTD'},
      {label: 'Turkish Lira', value: 'TRY'},
      {label: 'Ugandan Shilling', value: 'UGX'},
      {label: 'Ukrainian Hryvnia', value: 'UAH'},
      {label: 'United Arab Emirates Dirham', value: 'AED'},
      {label: 'Uruguayan Peso', value: 'UYU'},
      {label: 'Uzbekistani Som', value: 'UZS'},
      {label: 'Vanuatu Vatu', value: 'VUV'},
      {label: 'Vietnamese Đồng', value: 'VND'},
      {label: 'West African Cfa Franc', value: 'XOF'},
      {label: 'Yemeni Rial', value: 'YER'},
      {label: 'Zambian Kwacha', value: 'ZMW'},
    ];
  }
  // Billing related code - left for future reference
  // checkProviderEssentials(){
  //   let usr = Meteor.user();
  //   let price = usr.profile.provider.price ? usr.profile.provider.price : 0;
  //   // check schedule
  //   let schedule = usr.profile.provider.schedule.day;
  //   let days = 0;
  //   schedule.forEach(function(ar){
  //     days += ar.length;
  //   });
  //   let hasEmptySchedule = days > 0 ? false : true;
  //   // check viva
  //   let viva = usr.profile.provider.viva;
  //   let missingViva = !viva || (!viva.VP_PUBLIC_KEY || !viva.VP_MERCHANT_ID || !viva.VP_API_KEY || !viva.VP_SOURCE);
  //   // display alerts
  //   if (price == 0 || hasEmptySchedule) {
  //     sAlert.error(TAPi18n.__('missing_info'));
  //   }
  //   if (missingViva) {
  //     sAlert.error(TAPi18n.__('missing_payment_info'));
  //   }
  // }
}
