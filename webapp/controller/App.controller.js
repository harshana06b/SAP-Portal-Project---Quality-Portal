sap.ui.define([
  "com/quality/portal/qualitylogin/controller/BaseController"
], function (BaseController) {
  "use strict";

  return BaseController.extend("com.quality.portal.qualitylogin.controller.App", {
    onLogout: function () {
      // FRS: Shell logout delegates centralized session/model/cache clearing to Component.js.
      this.getOwnerComponent().logout();
    },

    onNavHome: function () {
      this.navTo("dashboard");
    }
  });
});
