sap.ui.define([
  "com/quality/portal/qualitylogin/controller/BaseController",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/model/Sorter",
  "sap/m/ViewSettingsDialog",
  "sap/m/ViewSettingsItem",
  "com/quality/portal/qualitylogin/model/formatter"
], function (BaseController, Filter, FilterOperator, Sorter, ViewSettingsDialog, ViewSettingsItem, formatter) {
  "use strict";

  return BaseController.extend("com.quality.portal.qualitylogin.controller.InspectionLot", {
    formatter: formatter,

    onInit: function () {
      this.loadPlantOptions("lot", "/ZCDS_QM_LOTNEW64");
    },

    onBack: function () {
      this.navTo("dashboard");
    },

    onSearch: function () {
      this._applyLotFilters();
    },

    onPlantFilterChange: function () {
      this._applyLotFilters();
    },

    _applyLotFilters: function () {
      var sQuery = (this.byId("lotSearch").getValue() || "").trim();
      var oPlantFilter = this.byId("lotPlantFilter");
      var sPlant = (oPlantFilter.getSelectedKey() || oPlantFilter.getValue() || "").trim();
      var aFilters = [];

      if (sQuery) {
        // FRS: Search filters are applied to the real SAP OData binding; no client-side mock data exists.
        aFilters.push(new Filter({
          filters: [
            new Filter("InspectionLot", FilterOperator.Contains, sQuery),
            new Filter("Material", FilterOperator.Contains, sQuery),
            new Filter("Plant", FilterOperator.Contains, sQuery)
          ],
          and: false
        }));
      }

      if (sPlant) {
        aFilters.push(new Filter("Plant", FilterOperator.EQ, sPlant));
      }

      this.byId("lotTable").getBinding("items").filter(aFilters);
    },

    onSort: function () {
      this._openSortDialog();
    },

    onFilter: function () {
      this._openFilterDialog();
    },

    onRefresh: function () {
      this.getComponentModel("lot").refresh(true);
    },

    onOpenResults: function (oEvent) {
      var sInspectionLot = this._getInspectionLotFromAction(oEvent);

      if (sInspectionLot) {
        this.navTo("resultRecording", {
          query: {
            inspectionLot: sInspectionLot
          }
        });
      }
    },

    onOpenDecision: function (oEvent) {
      var sInspectionLot = this._getInspectionLotFromAction(oEvent);

      if (sInspectionLot) {
        this.navTo("usageDecision", {
          query: {
            inspectionLot: sInspectionLot
          }
        });
      }
    },

    _getInspectionLotFromAction: function (oEvent) {
      var oContext = oEvent.getSource().getBindingContext("lot");
      var oRecord = oContext && oContext.getObject();

      return oRecord && oRecord.InspectionLot;
    },

    _openSortDialog: function () {
      var oDialog = new ViewSettingsDialog({
        confirm: function (oEvent) {
          var sKey = oEvent.getParameter("sortItem").getKey();
          var bDescending = oEvent.getParameter("sortDescending");
          this.byId("lotTable").getBinding("items").sort(new Sorter(sKey, bDescending));
        }.bind(this),
        sortItems: [
          new ViewSettingsItem({ key: "InspectionLot", text: "Inspection Lot" }),
          new ViewSettingsItem({ key: "Material", text: "Material" }),
          new ViewSettingsItem({ key: "Plant", text: "Plant" }),
          new ViewSettingsItem({ key: "LotQuantity", text: "Lot Quantity" })
        ]
      });
      oDialog.open();
    },

    _openFilterDialog: function () {
      var oDialog = new ViewSettingsDialog({
        confirm: function (oEvent) {
          var aFilters = oEvent.getParameter("filterItems").map(function (oItem) {
            return new Filter("DecisionStatus", FilterOperator.EQ, oItem.getKey());
          });
          this.byId("lotTable").getBinding("items").filter(aFilters);
        }.bind(this),
        filterItems: [
          new ViewSettingsItem({ key: "APPROVED", text: "Approved" }),
          new ViewSettingsItem({ key: "REJECTED", text: "Rejected" }),
          new ViewSettingsItem({ key: "PENDING", text: "Pending" })
        ]
      });
      oDialog.open();
    }
  });
});
