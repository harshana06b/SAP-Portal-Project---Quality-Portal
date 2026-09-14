sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/model/json/JSONModel",
  "sap/ui/model/Sorter",
  "sap/m/MessageBox",
  "sap/m/MessageToast"
], function (Controller, Filter, FilterOperator, JSONModel, Sorter, MessageBox, MessageToast) {
  "use strict";

  return Controller.extend("com.quality.portal.qualitylogin.controller.BaseController", {
    getRouter: function () {
      return this.getOwnerComponent().getRouter();
    },

    getComponentModel: function (sName) {
      return this.getOwnerComponent().getModel(sName);
    },

    setBusy: function (bBusy) {
      this.getComponentModel("ui").setProperty("/busy", bBusy);
    },

    handleError: function (oError) {
      this.getOwnerComponent().getErrorHandler().handle(oError);
    },

    navTo: function (sRouteName, oParameters, bReplace) {
      // FRS: Navigation uses router replacement for auth transitions to prevent back-button access.
      this.getRouter().navTo(sRouteName, oParameters || {}, bReplace === true);
    },

    initSmartTablePage: function (oConfig) {
      this._oSmartTableConfig = oConfig;
      this._mSmartTableSortState = {};
      this._mSmartTableRouteFilters = {};
    },

    setSmartTableRouteFilters: function (mFilters) {
      this._mSmartTableRouteFilters = mFilters || {};
      this.applySmartTableState();
    },

    attachSmartTableBindingEvents: function () {
      var oTable = this.byId(this._oSmartTableConfig && this._oSmartTableConfig.tableId);
      var oBinding = oTable && oTable.getBinding("items");

      if (!oTable || !oBinding || oBinding._qpEventsAttached) {
        return;
      }

      oBinding._qpEventsAttached = true;
      oBinding.attachDataRequested(function () {
        oTable.setBusy(true);
        this.setBusy(true);
      }, this);
      oBinding.attachDataReceived(function (oEvent) {
        oTable.setBusy(false);
        this.setBusy(false);
        if (oEvent.getParameter("error")) {
          MessageToast.show("Unable to load records");
          MessageBox.error("Unable to load quality records from SAP. Please try again or contact support.");
        }
        this._hideDuplicateSmartTableItems();
      }, this);

      if (!oTable._qpUpdateFinishedAttached) {
        oTable._qpUpdateFinishedAttached = true;
        oTable.attachUpdateFinished(this._hideDuplicateSmartTableItems, this);
      }
    },

    loadPlantOptions: function (sModelName, sEntitySetPath, sOptionsModelName) {
      var oModel = this.getComponentModel(sModelName);

      if (!oModel || !sEntitySetPath) {
        return;
      }

      oModel.read(sEntitySetPath, {
        urlParameters: {
          "$select": "Plant"
        },
        success: function (oData) {
          var mPlants = {};
          var aPlants = [];

          (oData && oData.results || []).forEach(function (oRecord) {
            var sPlant = String(oRecord.Plant || "").trim();

            if (sPlant && !mPlants[sPlant]) {
              mPlants[sPlant] = true;
              aPlants.push({
                key: sPlant,
                text: sPlant
              });
            }
          });

          aPlants.sort(function (oLeft, oRight) {
            return oLeft.text.localeCompare(oRight.text);
          });

          this.getView().setModel(new JSONModel({
            plants: aPlants
          }), sOptionsModelName || "plantOptions");
        }.bind(this),
        error: this.handleError.bind(this)
      });
    },

    onTableSearch: function () {
      this.applySmartTableState();
    },

    onTableFilterChange: function () {
      this.applySmartTableState();
    },

    onClearTableFilters: function () {
      var oConfig = this._oSmartTableConfig || {};
      var aFilterIds = Object.keys(oConfig.filters || {});

      aFilterIds.forEach(function (sKey) {
        var oControl = this.byId(oConfig.filters[sKey].id);
        if (oControl && oControl.setValue) {
          oControl.setValue("");
        }
        if (oControl && oControl.setSelectedKey) {
          oControl.setSelectedKey("");
        }
      }, this);

      if (oConfig.dateRangeId) {
        var oDateRange = this.byId(oConfig.dateRangeId);
        if (oDateRange) {
          oDateRange.setDateValue(null);
          oDateRange.setSecondDateValue(null);
          oDateRange.setValue("");
        }
      }

      this.applySmartTableState();
      MessageToast.show("Filters cleared");
    },

    onRefreshTable: function () {
      var oConfig = this._oSmartTableConfig || {};
      var oTable = this.byId(oConfig.tableId);
      var oBinding = oTable && oTable.getBinding("items");
      var oModel = oConfig.modelName && this.getComponentModel(oConfig.modelName);

      this.attachSmartTableBindingEvents();
      if (oBinding) {
        oBinding.refresh(true);
      } else if (oModel) {
        oModel.refresh(true);
      }
      MessageToast.show("Refreshing records");
    },

    onSortColumn: function (oEvent) {
      var oButton = oEvent.getSource();
      var sPath = oButton.data("sortPath");
      var oConfig = this._oSmartTableConfig || {};
      var oTable = this.byId(oConfig.tableId);
      var oBinding = oTable && oTable.getBinding("items");
      var bDescending;

      if (!sPath || !oBinding) {
        return;
      }

      bDescending = !this._mSmartTableSortState[sPath];
      this._mSmartTableSortState = {};
      this._mSmartTableSortState[sPath] = bDescending;
      oBinding.sort(new Sorter(sPath, bDescending));
      MessageToast.show((bDescending ? "Descending: " : "Ascending: ") + oButton.getText());
    },

    applySmartTableState: function () {
      var oConfig = this._oSmartTableConfig || {};
      var oTable = this.byId(oConfig.tableId);
      var oBinding = oTable && oTable.getBinding("items");
      var aFilters = [];
      var sQuery = "";

      if (!oBinding) {
        return;
      }

      if (oConfig.searchId && this.byId(oConfig.searchId)) {
        sQuery = (this.byId(oConfig.searchId).getValue() || "").trim();
      }

      if (sQuery && oConfig.searchFields && oConfig.searchFields.length) {
        aFilters.push(new Filter({
          filters: oConfig.searchFields.map(function (sField) {
            return new Filter(sField, FilterOperator.Contains, sQuery);
          }),
          and: false
        }));
      }

      Object.keys(oConfig.filters || {}).forEach(function (sKey) {
        var oFilterConfig = oConfig.filters[sKey];
        var oControl = this.byId(oFilterConfig.id);
        var sValue = "";

        if (!oControl) {
          return;
        }

        sValue = oControl.getSelectedKey ? oControl.getSelectedKey() : oControl.getValue();
        sValue = (sValue || "").trim();
        if (sValue) {
          aFilters.push(new Filter(oFilterConfig.path, oFilterConfig.operator || FilterOperator.EQ, sValue));
        }
      }, this);

      Object.keys(this._mSmartTableRouteFilters || {}).forEach(function (sPath) {
        var sValue = String(this._mSmartTableRouteFilters[sPath] || "").trim();

        if (sValue) {
          aFilters.push(new Filter(sPath, FilterOperator.EQ, sValue));
        }
      }, this);

      this._addDateRangeFilter(aFilters);
      oBinding.filter(aFilters, "Application");
    },

    _hideDuplicateSmartTableItems: function () {
      var oConfig = this._oSmartTableConfig || {};
      var aUniqueFields = oConfig.uniqueBy || [];
      var oTable = this.byId(oConfig.tableId);
      var mSeen = {};

      if (!oTable || !aUniqueFields.length) {
        return;
      }

      oTable.getItems().forEach(function (oItem) {
        var oContext = oItem.getBindingContext(oConfig.modelName);
        var oRecord = oContext && oContext.getObject();
        var sKey;

        if (!oRecord) {
          oItem.setVisible(true);
          return;
        }

        sKey = aUniqueFields.map(function (sField) {
          var vValue = oRecord[sField];

          if (vValue instanceof Date) {
            return vValue.getTime();
          }

          return vValue === null || vValue === undefined ? "" : String(vValue).trim();
        }).join("|");

        oItem.setVisible(!mSeen[sKey]);
        mSeen[sKey] = true;
      });
    },

    _addDateRangeFilter: function (aFilters) {
      var oConfig = this._oSmartTableConfig || {};
      var oDateRange = oConfig.dateRangeId && this.byId(oConfig.dateRangeId);
      var dFrom = oDateRange && oDateRange.getDateValue();
      var dTo = oDateRange && oDateRange.getSecondDateValue();
      var sPath = oConfig.dateRangePath;

      if (!sPath || !oDateRange || (!dFrom && !dTo)) {
        return;
      }

      if (dFrom) {
        dFrom = new Date(dFrom.getFullYear(), dFrom.getMonth(), dFrom.getDate(), 0, 0, 0, 0);
      }
      if (dTo) {
        dTo = new Date(dTo.getFullYear(), dTo.getMonth(), dTo.getDate(), 23, 59, 59, 999);
      }

      if (dFrom && dTo) {
        aFilters.push(new Filter(sPath, FilterOperator.BT, dFrom, dTo));
      } else if (dFrom) {
        aFilters.push(new Filter(sPath, FilterOperator.GE, dFrom));
      } else {
        aFilters.push(new Filter(sPath, FilterOperator.LE, dTo));
      }
    }
  });
});
