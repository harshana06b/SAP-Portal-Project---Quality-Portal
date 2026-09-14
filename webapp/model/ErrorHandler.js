sap.ui.define([
  "sap/m/MessageBox"
], function (MessageBox) {
  "use strict";

  return function ErrorHandler(oComponent) {
    function readGatewayMessage(oError) {
      var sResponseText = oError && (oError.responseText || oError.response && oError.response.responseText);
      var oPayload;

      if (!sResponseText) {
        return "";
      }

      try {
        oPayload = JSON.parse(sResponseText);
        return oPayload && oPayload.error && oPayload.error.message && (oPayload.error.message.value || oPayload.error.message) || "";
      } catch (e) {
        return "";
      }
    }

    this.handle = function (oError) {
      var iStatus = Number(oError && (oError.statusCode || oError.status || oError.response && oError.response.statusCode));
      var sGatewayMessage = readGatewayMessage(oError);
      var sMessage = sGatewayMessage || "SAP backend error. Please contact support with the timestamp.";

      // FRS: Frontend maps enterprise HTTP errors to business-readable SAPUI5 MessageBox messages.
      if (iStatus === 401) {
        sMessage = "Session expired. Please log in again.";
        oComponent.logout();
      } else if (iStatus === 403) {
        sMessage = "You are not authorized to perform this action.";
      } else if (iStatus === 404) {
        sMessage = "Requested SAP quality data was not found.";
      } else if (iStatus === 503 || iStatus === 0) {
        sMessage = "Unable to connect to SAP backend";
      }

      MessageBox.error(sMessage);
    };
  };
});
