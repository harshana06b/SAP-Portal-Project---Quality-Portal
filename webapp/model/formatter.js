sap.ui.define([
  "sap/ui/core/format/NumberFormat"
], function (NumberFormat) {
  "use strict";

  var oQuantityFormat = NumberFormat.getFloatInstance({
    minFractionDigits: 0,
    maxFractionDigits: 3,
    groupingEnabled: true
  });

  return {
    dateText: function (vValue) {
      var oDate;
      var sDay;
      var sMonth;

      if (!vValue) {
        return "";
      }

      oDate = vValue instanceof Date ? vValue : new Date(vValue);
      if (Number.isNaN(oDate.getTime())) {
        return "";
      }

      sDay = String(oDate.getDate()).padStart(2, "0");
      sMonth = String(oDate.getMonth() + 1).padStart(2, "0");
      return sDay + "-" + sMonth + "-" + oDate.getFullYear();
    },

    quantityText: function (vValue) {
      // Numeric CDS values are formatted consistently for read-only Fiori result display.
      var nValue = Number(vValue);
      return Number.isFinite(nValue) ? oQuantityFormat.format(nValue) : "";
    },

    resultStatusText: function (sResultStatusCode) {
      var mStatusText = {
        "1": "Must be Processed",
        "2": "Processed",
        "3": "Requires Correction",
        "5": "Processing Complete"
      };
      return mStatusText[String(sResultStatusCode || "")] || "Not Processed";
    },

    resultStatusState: function (sResultStatusCode) {
      var sValue = String(sResultStatusCode || "").toUpperCase();
      if (sValue === "5" || sValue === "PROCESSING COMPLETE") {
        return "Success";
      }
      if (sValue === "2" || sValue === "PROCESSED") {
        return "Information";
      }
      if (sValue === "1" || sValue === "MUST BE PROCESSED") {
        return "Warning";
      }
      if (sValue === "3" || sValue === "REQUIRES CORRECTION") {
        return "Error";
      }
      return "Information";
    },

    valuationText: function (sValuationCode) {
      var mValuationText = {
        "A": "Accepted",
        "R": "Rejected",
        "R2": "Rework"
      };
      return mValuationText[String(sValuationCode || "").toUpperCase()] || sValuationCode || "";
    },

    valuationState: function (sValuationCode) {
      var sValue = String(sValuationCode || "").toUpperCase();
      if (sValue === "A") {
        return "Success";
      }
      if (sValue === "R") {
        return "Error";
      }
      if (sValue === "R2") {
        return "Warning";
      }
      return "None";
    },

    decisionState: function (sDecisionStatus, sDecisionValuation) {
      // FRS: Decision state is derived from real QAVE-backed OData values.
      var sValue = String(sDecisionStatus || sDecisionValuation || "").toUpperCase();
      if (sValue === "APPROVED" || sValue === "A") {
        return "Success";
      }
      if (sValue === "REJECTED" || sValue === "R") {
        return "Error";
      }
      return "Warning";
    },

    decisionText: function (sDecisionStatus, sDecisionValuation) {
      var sValue = String(sDecisionStatus || sDecisionValuation || "").toUpperCase();
      if (sValue === "APPROVED" || sValue === "A") {
        return "Approved";
      }
      if (sValue === "REJECTED" || sValue === "R") {
        return "Rejected";
      }
      return "Pending";
    },

    editableFromReadOnly: function (sReadOnly, sDecisionExists) {
      // FRS: Result entry controls become non-editable when SAP indicates a usage decision exists.
      return !(sReadOnly === "X" || sDecisionExists === "X" || sReadOnly === true || sDecisionExists === true);
    }
  };
});
