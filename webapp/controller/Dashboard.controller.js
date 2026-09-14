sap.ui.define([
  "com/quality/portal/qualitylogin/controller/BaseController"
], function (BaseController) {
  "use strict";

  return BaseController.extend("com.quality.portal.qualitylogin.controller.Dashboard", {
    onInspectionLot: function () {
      this.navTo("inspectionLot");
    },

    onResultRecords: function () {
      this.navTo("resultRecording");
    },

    onUsageDecision: function () {
      this.navTo("usageDecision");
    }
  });
});
