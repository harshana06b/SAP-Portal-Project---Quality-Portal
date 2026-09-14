sap.ui.define([
  "com/quality/portal/qualitylogin/controller/BaseController",
  "sap/ui/model/FilterOperator",
  "com/quality/portal/qualitylogin/model/formatter"
], function (BaseController, FilterOperator, formatter) {
  "use strict";

  return BaseController.extend("com.quality.portal.qualitylogin.controller.ResultRecording", {
    formatter: formatter,

    onInit: function () {
      this.initSmartTablePage({
        tableId: "resultTable",
        searchId: "resultSearch",
        modelName: "result",
        dateRangeId: "resultDateRange",
        dateRangePath: "StartDate",
        searchFields: [
          "InspectionLot",
          "CharacteristicNo",
          "Material",
          "Plant",
          "InspectionType",
          "ResultStatusCode",
          "Inspector",
          "ValuationCode",
          "StorageLocation",
          "Batch",
          "MovementType",
          "DebitCreditIndicator",
          "Unit"
        ],
        uniqueBy: [
          "InspectionLot",
          "CharacteristicNo",
          "Material",
          "Plant",
          "StartDate",
          "EndDate",
          "InspectionType",
          "InspectedQty",
          "ResultStatusCode",
          "Inspector",
          "CreatedOn",
          "InspectionCompletedOn",
          "ResultValue",
          "DefectsFound",
          "ValuationCode",
          "MovedQuantity",
          "Unit",
          "MovementType",
          "DebitCreditIndicator",
          "StorageLocation",
          "PostingDate"
        ],
        filters: {
          plant: { id: "resultPlantFilter", path: "Plant", operator: FilterOperator.EQ },
          material: { id: "resultMaterialFilter", path: "Material", operator: FilterOperator.EQ },
          status: { id: "resultStatusFilter", path: "ResultStatusCode", operator: FilterOperator.EQ }
        }
      });
      this.loadPlantOptions("result", "/ZCDS_QM_RESULTNEW64");
      this.getRouter().getRoute("resultRecording").attachPatternMatched(this._onRouteMatched, this);
    },

    onAfterRendering: function () {
      this.attachSmartTableBindingEvents();
    },

    onBack: function () {
      this.navTo("dashboard");
    },

    onSearch: function () {
      this.onTableSearch();
    },

    onFilterChange: function () {
      this.onTableFilterChange();
    },

    onClearFilters: function () {
      this.onClearTableFilters();
    },

    onRefresh: function () {
      this.onRefreshTable();
    },

    _onRouteMatched: function (oEvent) {
      var oQuery = oEvent.getParameter("arguments").query || {};

      this.attachSmartTableBindingEvents();
      this.setSmartTableRouteFilters({
        InspectionLot: oQuery.inspectionLot
      });
      this.onRefreshTable();
    }
  });
});
