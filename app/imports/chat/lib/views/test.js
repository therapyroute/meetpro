import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import sweetAlert from 'sweetalert';

function disableInputButtons() {
    document.getElementById('open-or-join-room').disabled = true;
    //document.getElementById('open-room').disabled = true;
    //document.getElementById('join-room').disabled = true;
    document.getElementById('room-id').disabled = true;
}

function showRoomURL(roomid) {
  var roomHashURL = '#' + roomid;
  var roomQueryStringURL = '?roomid=' + roomid;

  var html = '<h2>'+ TAPi18n.__('chat_test_txt') + '</h2><br>';

//  html += 'Hash URL: <a href="' + roomHashURL + '" target="_blank">' + roomHashURL + '</a>';
//  html += '<br>';
  html += TAPi18n.__('chat_test_url') + ': <a href="' + roomQueryStringURL + '" target="_blank">' + roomQueryStringURL + '</a>';

  var roomURLsDiv = document.getElementById('room-urls');
  roomURLsDiv.innerHTML = html;

  roomURLsDiv.style.display = 'block';
}

Template.tmplTestChat.onCreated(function(){
  window.myConnection = new RTCMultiConnection();

  // by default, socket.io server is assumed to be deployed on your own URL
  myConnection.socketURL = Meteor.settings.public.PEER_SERVER_URL;

  myConnection.socketMessageEvent = 'video-conference-demo';

  myConnection.session = {
      audio: true,
      video: true
  };

  myConnection.sdpConstraints.mandatory = {
      OfferToReceiveAudio: true,
      OfferToReceiveVideo: true
  };

  myConnection.iceServers = [
    {urls:'stun:stun.l.google.com:19302'},
    {urls: 'turn:webrtcweb.com:80', username: 'muazkh', credential: 'muazkh'}
  ];

  // check for camera, speakers (output) and microphone
  let myRTC = myConnection.DetectRTC;

  if (myRTC.browser.isChrome) {
    if (myRTC.hasWebcam && myRTC.hasMicrophone && myRTC.hasSpeakers) { }
    else {
      sweetAlert({
        title: TAPi18n.__("chat_error"),
        text: TAPi18n.__('chat_getMedia'),
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
  }

  // event fired if getUserMedia request has failed
  myConnection.onMediaError = function(error) {
    sweetAlert({
      title: TAPi18n.__("chat_error"),
      text: TAPi18n.__('chat_getMedia'),
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

  myConnection.videosContainer = document.getElementById('videos-container');
  myConnection.onstream = function(e) {
    if (e.type == 'remote') {
        //Stream of partner
        var video = document.getElementById("remotev");
        video.src = URL.createObjectURL(e.stream);
    } else {
        //Own stream
        var video = document.getElementById("localv");
        video.src = URL.createObjectURL(e.stream);
    }
  };

  myConnection.onstreamended = myConnection.onleave = myConnection.onclose = function(event) {
      var mediaElement = document.getElementById(event.streamid);
      if(mediaElement) {
          mediaElement.parentNode.removeChild(mediaElement);
      }
  };
  // to make it one-to-one
  myConnection.maxParticipantsAllowed = 1;
  myConnection.onRoomFull = function(roomid) {
    myConnection.closeSocket();
    myConnection.attachStreams.forEach(function(stream) {
      stream.stop();
    });

    document.getElementById('open-or-join-room').disabled = false;
    //document.getElementById('open-room').disabled = false;
    //document.getElementById('join-room').disabled = false;
    document.getElementById('room-id').disabled = false;

    alert('Room is full.');
  };


});


  // ......................................................
  // ......................Handling Room-ID................
  // ......................................................
Template.tmplTestChat.onRendered(function(){

  (function() {
      var params = {},
          r = /([^&=]+)=?([^&]*)/g;

      function d(s) {
          return decodeURIComponent(s.replace(/\+/g, ' '));
      }
      var match, search = window.location.search;
      while (match = r.exec(search.substring(1)))
          params[d(match[1])] = d(match[2]);
      window.params = params;
  })();

  var roomid = '';
  if (localStorage.getItem(myConnection.socketMessageEvent)) {
      roomid = localStorage.getItem(window.myConnection.socketMessageEvent);
  } else {
      roomid = myConnection.token();
  }
  document.getElementById('room-id').value = roomid;
  document.getElementById('room-id').onkeyup = function() {
      localStorage.setItem(window.myConnection.socketMessageEvent, this.value);
  };

  var hashString = location.hash.replace('#', '');
  if(hashString.length && hashString.indexOf('comment-') == 0) {
    hashString = '';
  }

  var roomid = params.roomid;
  if(!roomid && hashString.length) {
      roomid = hashString;
  }

  if(roomid && roomid.length) {
      document.getElementById('room-id').value = roomid;
      localStorage.setItem(window.myConnection.socketMessageEvent, roomid);
      Meteor.setTimeout(function(){
        window.myConnection.checkPresence(roomid, function(isRoomExists) {
            if(isRoomExists) {
                myConnection.join(roomid);
                return;
            }
          });
      }, 5000);

      disableInputButtons();
  }
});

Template.tmplTestChat.events({
  /*
  "click #open-room": function(event, template){
    disableInputButtons();
    myConnection.open(document.getElementById('room-id').value, function() {
        showRoomURL(myConnection.sessionid);
    });
  },
  "click #join-room": function(event, template){
    disableInputButtons();
    myConnection.join(document.getElementById('room-id').value);
  },
  */
  "click #open-or-join-room": function(event, template){
    disableInputButtons();
    myConnection.openOrJoin(document.getElementById('room-id').value, function(isRoomExists, roomid) {
        if(!isRoomExists) {
            showRoomURL(roomid);
        }
    });
  },
  "click #exitCall": function() {
    sweetAlert({
      title: TAPi18n.__("chat_exit"),
      text: TAPi18n.__("chat_confirmexit"),
      type: "warning",
      showCancelButton: true,
      //confirmButtonColor: "green",
      confirmButtonText: TAPi18n.__("chat_exit"),
      cancelButtonText: TAPi18n.__("cancel"),
      closeOnConfirm: true,
      closeOnCancel: true
      },
      function(isConfirm){
        if (isConfirm) {
          FlowRouter.go("commonDashboard");
        }
      }
    );
  }
});
