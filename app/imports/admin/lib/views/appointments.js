Template.tmplAdminAppointments.events({
  'click #buttonDownload': function(event) {
    var nameFile = 'allAppointments.csv';
    Meteor.call('downloadAppointments', function(err, fileContent) {
      if(fileContent){
        var blob = new Blob([fileContent], {type: "text/plain;charset=utf-8"});
        saveAs(blob, nameFile);
      }
    });
  }
});