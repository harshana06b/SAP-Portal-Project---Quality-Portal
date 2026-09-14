sap.ui.define([
  "sap/ui/core/UIComponent",
  "sap/ui/model/json/JSONModel",
  "com/quality/portal/qualitylogin/model/models",
  "com/quality/portal/qualitylogin/model/Session",
  "com/quality/portal/qualitylogin/model/ErrorHandler"
], function (UIComponent, JSONModel, models, Session, ErrorHandler) {
  "use strict";

  return UIComponent.extend("com.quality.portal.qualitylogin.Component", {
    metadata: {
      manifest: "json",
      interfaces: ["sap.ui.core.IAsyncContentCreation"]
    },

    init: function () {
      UIComponent.prototype.init.apply(this, arguments);

      // FRS: Device model supports responsive behavior without using local business data.
      this.setModel(models.createDeviceModel(), "device");

      // FRS: Session model contains only authenticated runtime identity returned from SAP.
      this.setModel(new JSONModel(Session.restore()), "session");

      // FRS: UI model stores transient screen state only; it is not a business-data source.
      this.setModel(new JSONModel({
        busy: false,
        shellVisible: false,
        pageTitle: "Quality Portal"
      }), "ui");

      this._oErrorHandler = new ErrorHandler(this);
      ["lot", "result", "decision"].forEach(function (sModelName) {
        var oModel = this.getModel(sModelName);
        if (oModel) {
          oModel.setSizeLimit(10000);
        }
      }, this);
      this._registerRouteProtection();
      this.getRouter().initialize();
    },

    _registerRouteProtection: function () {
      var oRouter = this.getRouter();

      // FRS: Manual URL entry to protected routes redirects to login when no valid session exists.
      oRouter.attachBeforeRouteMatched(function (oEvent) {
        var sRouteName = oEvent.getParameter("name");
        var bLoginRoute = sRouteName === "login";
        var bAuthenticated = Session.isAuthenticated();

        this.getModel("ui").setProperty("/shellVisible", bAuthenticated && !bLoginRoute);

        if (!bLoginRoute && !bAuthenticated) {
          oRouter.navTo("login", {}, true);
        }

        if (bLoginRoute && bAuthenticated) {
          oRouter.navTo("dashboard", {}, true);
        }
      }, this);
    },

    getErrorHandler: function () {
      return this._oErrorHandler;
    },

    login: function (oSessionData) {
      // FRS: Only SAP-validated identity fields are persisted for refresh continuity.
      Session.save(oSessionData);
      this.getModel("session").setData(Session.restore());
      this.getModel("ui").setProperty("/shellVisible", true);
    },

    logout: function () {
      // FRS: Logout clears session, identity models, browser storage, and all OData caches.
      Session.clear();
      this.getModel("session").setData(Session.restore());
      this.getModel("ui").setProperty("/shellVisible", false);
      ["login", "lot", "result", "decision"].forEach(function (sModelName) {
        var oModel = this.getModel(sModelName);
        if (oModel) {
          oModel.resetChanges();
          oModel.refresh(true, true);
        }
      }, this);
      this.getRouter().navTo("login", {}, true);
      window.history.replaceState(null, document.title, window.location.pathname + window.location.search + "#/login");
    }
  });
});
