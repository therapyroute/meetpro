import DetectRTC from 'detectrtc';

Template.tmplWebRTC.onCreated(function(){
  DocHead.setTitle(appParams.APP_NAME + ': '+TAPi18n.__('rtc_title'));
  testsReady = new ReactiveVar(false);
  chatReady = new ReactiveVar(false);
});

Template.tmplWebRTC.onRendered(function(){
  var reload = function(){
    DetectRTC.load();
  }
  DetectRTC.load(function(){
    if(DetectRTC.MediaDevices[0] && DetectRTC.MediaDevices[0].label === 'Please invoke getUserMedia once.') {
      if (DetectRTC.browser.isChrome){
        navigator.getUserMedia({audio: true, video: true}, function(stream){},function(err){});
        testsReady.set(true);
      }
      else {
        navigator.mediaDevices.getUserMedia({audio: true, video: true}).then(function(mediaStream){testsReady.set(true);reload()}).catch(function(err){});
      }
    }
    else
      testsReady.set(true);
  });
});

Template.tmplWebRTC.helpers({
  testsReady: function(){
    return testsReady.get();
  },
  chatReady: function(){
    return !chatReady.get();
  },
  rtc: function(){
    return DetectRTC;
  },
  oput: function(prop){
    return prop ? TAPi18n.__('rtc_yes') : TAPi18n.__('rtc_no');
  },
  tdoput: function(prop){
    return prop ? '<td class="success">'+TAPi18n.__('rtc_yes')+'</td>' : '<td class="danger">'+TAPi18n.__('rtc_no')+'</td>';
  },
  cameras: function(prop){
    if (prop) {
      if(DetectRTC.videoInputDevices.length) {
        var output = '<td class="success">'+TAPi18n.__('rtc_yes')+'<br>'+TAPi18n.__('rtc_cameras')+ DetectRTC.videoInputDevices.length;
        var labels = [];
        if (DetectRTC.browser.isChrome){
          DetectRTC.videoInputDevices.forEach(function(device) {
             labels.push(device.label);
          });
        }
        return output + '<br>' + labels.join() + '</td>';
      }
    }
    else {
      return '<td class="danger">'+TAPi18n.__('rtc_no')+'</td>';
    }
  },
  mics: function(prop) {
    if (prop) {
      if(DetectRTC.audioInputDevices.length) {
        var output = '<td class="success">'+TAPi18n.__('rtc_yes')+'<br>'+TAPi18n.__('rtc_mics')+ DetectRTC.audioInputDevices.length;
        var labels = [];
        if (DetectRTC.browser.isChrome){
          DetectRTC.audioInputDevices.forEach(function(device) {
             labels.push(device.label);
          });
        }
        return output + '<br>' + labels.join() + '</td>';
      }
    }
    else {
      return '<td class="danger">'+TAPi18n.__('rtc_no')+'</td>';
    }
  },
  /*speakers: function(prop) {
    if (prop) {
      if(DetectRTC.audioOutputDevices.length) {
        var output = '<td class="success">'+TAPi18n.__('rtc_yes')+'<br>'+TAPi18n.__('rtc_speakers')+ DetectRTC.audioOutputDevices.length;
        var labels = [];
        if (DetectRTC.browser.isChrome){
          DetectRTC.audioOutputDevices.forEach(function(device) {
             labels.push(device.label);
          });
        }
        return output + '<br>' + labels.join() + '</td>';
      }
    }
    else {
      return '<td class="danger">'+TAPi18n.__('rtc_no')+'</td>';
    }
  },*/
  testResult: function(){
    if (DetectRTC.isWebRTCSupported) {
      if (DetectRTC.hasWebcam && DetectRTC.hasMicrophone){ //&& DetectRTC.hasSpeakers){
        chatReady.set(true);
        return "<i class='fa fa-check fa-3x'></i>&nbsp;&nbsp;" + TAPi18n.__('rtc_sup');
      } else {
        chatReady.set(false);
        return "<i class='fa fa-warning fa-3x'></i>&nbsp;&nbsp;" + TAPi18n.__('rtc_sup_err');
      }
    } else {
      chatReady.set(false);
      return "<i class='fa fa-warning fa-3x'></i>&nbsp;&nbsp;" + TAPi18n.__('rtc_not_sup');
    }
  },
  hasCamPermissions: function(){
    return DetectRTC.isWebsiteHasWebcamPermissions ? '<td class="success">'+TAPi18n.__('rtc_yes')+'</td>' : '<td class="danger">'+TAPi18n.__('rtc_no')+'</td>';
  },
  hasMicPermissions: function(){
    return DetectRTC.isWebsiteHasMicrophonePermissions ? '<td class="success">'+TAPi18n.__('rtc_yes')+'</td>' : '<td class="danger">'+TAPi18n.__('rtc_no')+'</td>';
  }
});
