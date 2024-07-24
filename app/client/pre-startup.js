// remove loader on client startup (with a small fade...)
Meteor.startup(function(){
  setTimeout(function() {
    $("#inject-loader-wrapper").fadeOut(500, function() { $(this).remove(); });
  }, 500);
});
