import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

Template.mainLayout.onCreated(function(){
  // add google font
  var linkInfo = {rel: "stylesheet", type: "text/css", href: "https://fonts.googleapis.com/css?family=Roboto:400:700&subset=greek,latin"};
  DocHead.addLink(linkInfo);
  //var linkInfo = {rel: "stylesheet", type: "text/css", href: "https://fonts.googleapis.com/css?family=Droid+Serif:400,700,400italic,700italic"};
  //DocHead.addLink(linkInfo);
});

Template.mainLayout.events({ 
  "click #sidebarCollapse": function(event, template){
    $("#sidebar").toggleClass("active");
    $(event.currentTarget).toggleClass("active");
  } 
});
