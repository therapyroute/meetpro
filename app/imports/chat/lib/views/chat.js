import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import sweetAlert from 'sweetalert';

Template.tmplChatPublic.onCreated(function () {
  DocHead.setTitle(TAPi18n.__('chat_title'));

  bookingReady = new ReactiveVar(false);
  scriptReady = new ReactiveVar(false);
  assocIdRV = new ReactiveVar(false);
  chatData = new ReactiveVar(null);
  isProvider = new ReactiveVar(Roles.userIsInRole(Meteor.user(),['provider']));

  window.bookingId = FlowRouter.getParam("bookingId");
  let theUser = FlowRouter.getParam("userId");

  Meteor.call('getChatData', window.bookingId, theUser, function(error, result) { 
    if (error) { 
      console.log('error', error); 
      bookingReady.set(false);
      sweetAlert({
        title: TAPi18n.__("chat_error"),
        text: TAPi18n.__('chat_access_denied') + ': \n\n' + error.message,
        type: "error",
        confirmButtonText: TAPi18n.__("chat_exit"),
        closeOnConfirm: true,
        },
        function(isConfirm){
          if (isConfirm) {
            FlowRouter.go("commonDashboard");
          }
        }
      );
      return;
    } 
    if (result) { 
      chatData.set(result); 
      bookingReady.set(true);
      //console.log('booking was found');
      //var assocId = isProvider.get() ? booking.userId : booking.providerId;
      //assocIdRV.set(assocId);
    } 
  });
  var jitsiDomain = Meteor.settings.public.JITSI_SERVER ?
        Meteor.settings.public.JITSI_SERVER :
        "meet.jit.si";

  // role var used for logging
  //var role = Roles.userIsInRole(Meteor.user(),['provider']) ? 'provider' : 'user';

  var self = this;

  // for testing only @ dev mode
  // tests chat between user@domain & provider@domain
  // using /chat/vb-testing-2365
  // if (Meteor.settings.public.APP_MODE === 'dev' && bookingId === 'vb-testing-2365'){
  //   bookingReady.set(true);
  //   if (!Meteor.settings.public.APP_MULTI_CLIENT) {
  //    Meteor.call('getTestAssoc', isProvider.get(), function(error, result){
  //      if(error) { console.log("error", error); }
  //      if(result) {
  //        assocIdRV.set(result);
  //        self.subscribe('getProfile', result);
  //      }
  //    });
  //   }
  // }

  // Jitsi Config
  let config = {
    // Enable / disable desktop sharing
    disableDesktopSharing: true,
    enableWelcomePage: true,
    //apiLogLevels: ['warn', 'log', 'error', 'info', 'debug']
    apiLogLevels: ['error']
  };

  // Jitsi UI Config
  let ifConfig = {
    DEFAULT_REMOTE_DISPLAY_NAME: 'Associate',
    DEFAULT_LOCAL_DISPLAY_NAME: 'me',
    SHOW_JITSI_WATERMARK: false,

    // if watermark is disabled by default, it can be shown only for guests
    SHOW_WATERMARK_FOR_GUESTS: false,
    DISPLAY_WELCOME_PAGE_CONTENT: false,
    APP_NAME: appParams.APP_NAME,
    NATIVE_APP_NAME: appParams.APP_NAME,
    //LANG_DETECTION: false, // Allow i18n to detect the system language
    
    /**
     * the toolbar buttons line is intentionally left in one line, to be able
     * to easily override values or remove them using regex
     */
    TOOLBAR_BUTTONS: [
        // main toolbar
        'microphone', 'camera', 'fullscreen', 'fodeviceselection', 'hangup',
        // extended toolbar
        'profile', 'chat', 'etherpad',
        'sharedvideo', 'settings', 'videoquality', 'filmstrip',
        'feedback', 'stats', 'shortcuts'
    ],

    SETTINGS_SECTIONS: [ 'language', 'devices'],

    /**
     * Whether to only show the filmstrip (and hide the toolbar).
     */
    filmStripOnly: false,

    /**
     * Whether to show thumbnails in filmstrip as a column instead of as a row.
     */
    VERTICAL_FILMSTRIP: true,
    /**
     * Whether the ringing sound in the call/ring overlay is disabled. If
     * {@code undefined}, defaults to {@code false}.
     *
     * @type {boolean}
     */
    DISABLE_RINGING: false,
    AUDIO_LEVEL_PRIMARY_COLOR: 'rgba(255,255,255,0.4)',
    AUDIO_LEVEL_SECONDARY_COLOR: 'rgba(255,255,255,0.2)',
    POLICY_LOGO: null,
    LOCAL_THUMBNAIL_RATIO: 16 / 9, // 16:9
    REMOTE_THUMBNAIL_RATIO: 1, // 1:1
    // Documentation reference for the live streaming feature.
    LIVE_STREAMING_HELP_LINK: 'https://jitsi.org/live',
    MOBILE_APP_PROMO: false,
  };



  // Reactive computations (depend on bookingReady & jitsi script)
  self.autorun(function(){
    // When booking is checked and found OK & Jitsi script is loaded...
    if (bookingReady.get() && scriptReady.get() && chatData.get()){
      var options = {
        roomName: bookingId,
        width: '100%',
        height: 700,
        configOverwrite: config,
        interfaceConfigOverwrite: ifConfig,
        parentNode: document.querySelector('#jitsi-meet')
      }
      const myUser = chatData.get().user;
      const myRole = myUser.roles[0];
      const theBooking = chatData.get().booking;
      //const otherUser = chatData.get().otheruser;
      
      // Jitsi API docs: https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe
      var api = new JitsiMeetExternalAPI(jitsiDomain, options);
      
      // execute api commands
      api.executeCommand('displayName', myUser.profile.user.name + ' ' + myUser.profile.user.surname);
      api.executeCommand('avatarUrl', myUser.profile.user.photo);
      
      // add event listeners
      api.addListener('cameraError', function(data){
        Meteor.call("chatLog", bookingId, `${myRole}: Chat: Camera error (${data.type})`);
        //console.log(data);
      });
      api.addListener('micError', function(data){
        Meteor.call("chatLog", bookingId, `${myRole}: Chat: Mic error (${data.type})`);
        //console.log(data);
      });
      // Log when current user joins & leaves room
      api.addListener('videoConferenceJoined', function(data){
        Meteor.call("chatLog", bookingId, `${myRole}: Chat: Joined conference ${data.roomName}`, 'info');
        const dataObject = {
          bookingId: theBooking._id,
          userId: myUser._id,
          role: myRole
        }
        Meteor.call('updatePeer', dataObject, function(error, success) { 
          if (error) { 
            console.log('error', error); 
          } 
          //if (success) { } 
        });
        Meteor.call('completeBooking', theBooking._id, myRole, function(error, success) { 
          if (error) { 
            console.log('error', error); 
          } 
          //if (success) { } 
        });
      });
      api.addListener('videoConferenceLeft', function(data){
        Meteor.call("chatLog", bookingId, `${myRole}: Chat: Left Conference ${data.roomName}`, 'info');
        Meteor.call('disconnectPeer', theBooking._id, myRole, function(error, success) { 
          if (error) { 
            console.log('error', error); 
          } 
          //if (success) { } 
        });
      });
      api.addListener('videoQualityChanged', function(data){
        Meteor.call("chatLog", bookingId, `${myRole}: Chat: Video quality changed to ${data.videoQuality}`, 'info');
        //console.log(data);
      });
      // api.addListener('readyToClose', function(data){
      //   Meteor.call("chatLog", bookingId, `${role}: Chat: Ready to close`, 'info');
      //   //console.log(data);
      // });

    } // of if bookingReady etc.
  }); // of this.autorun

  // load jitsi client script
  $.getScript('https://'+jitsiDomain+'/external_api.js', function(){
    // script has loaded
    scriptReady.set(true);
  });

}); // end of onCreated

// Template.tmplChat.onRendered(function() {
// });

Template.tmplChatPublic.helpers({
  isBookingChecked: function() {
    return bookingReady.get();
  },
  partnerFullName: function() {
    if (chatData.get() && chatData.get().otheruser) {
      const usr = chatData.get().otheruser.profile;
      return usr.user.name + ' ' + usr.user.surname;  
    } 
    return null;
  }
});
