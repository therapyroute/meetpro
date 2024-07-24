import { FlowRouter } from 'meteor/ostrio:flow-router-extra';


// instead of including forwarder:autoform-wizard-flow-router plugin, use this code:
Wizard.registerRouter('ostrio:flow-router-extra', {
  go: function(name, stepId) {
    FlowRouter.go(name, this.getParams(stepId));
  },
  getParams: function(stepId) {
    var route = FlowRouter.current()
      , params = route.params || {};

    return _.extend(params, {step: stepId});
  },
  getStep: function() {
    return FlowRouter.getParam('step');
  },
  path: function(name, stepId) {
    return FlowRouter.path(name, this.getParams(stepId));
  }
});


Wizard.useRouter('ostrio:flow-router-extra');

FlowRouter.route('/admin/onboarding/:step', {
  name: 'tmplOnboardingBasic',
  // action: function () {
  //   BlazeLayout.render("noSidebarLayout", { content: "tmplOnboardingBasic", menu: "mpNavbar" });
  // }
  action: function(params, queryParams) {
    if (!params.step) {
      FlowRouter.go('tmplOnboardingBasic', {step: 'general-information'})
    } else {
      BlazeLayout.render('noSidebarLayout', { content: "tmplOnboardingBasic", menu: "mpNavbar" });
    }
  }
});