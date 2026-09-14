sap.ui.define([
  "com/quality/portal/qualitylogin/controller/BaseController",
  "sap/ui/model/FilterOperator",
  "com/quality/portal/qualitylogin/model/formatter"
], function (BaseController, FilterOperator, formatter) {
  "use strict";

  return BaseController.extend("com.quality.portal.qualitylogin.controller.UsageDecision", {
    formatter: formatter,

    onInit: function () {
      this.initSmartTablePage({
        tableId: "decisionTable",
        searchId: "decisionSearch",
        modelName: "decision",
        dateRangeId: "decisionDateRange",
        dateRangePath: "StartDate",
        searchFields: [
          "InspectionLot",
          "Material",
          "Plant",
          "InspectionType",
          "FollowUpAction",
          "DecisionCode",
          "DecisionStatus",
          "DecidedBy"
        ],
        filters: {
          plant: { id: "decisionPlantFilter", path: "Plant", operator: FilterOperator.EQ },
          material: { id: "decisionMaterialFilter", path: "Material", operator: FilterOperator.EQ },
          status: { id: "decisionStatusFilter", path: "DecisionStatus", operator: FilterOperator.EQ }
        }
      });
      this.loadPlantOptions("decision", "/ZCDS_QM_DECISIONNEW64");
      this.getRouter().getRoute("usageDecision").attachPatternMatched(this._onRouteMatched, this);
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
