sap.ui.define([], function () {
  "use strict";

  var STORAGE_KEY = "quality.portal.session";
  var SESSION_TTL_MS = 8 * 60 * 60 * 1000;

  function now() {
    return Date.now();
  }

  function emptySession() {
    return {
      authenticated: false,
      userId: "",
      engineerName: "",
      plant: "",
      expiresAt: 0
    };
  }

  function parseSession(sValue) {
    try {
      return sValue ? JSON.parse(sValue) : emptySession();
    } catch (e) {
      return emptySession();
    }
  }

  return {
    save: function (oData) {
      // FRS: Browser storage contains only non-secret SAP identity fields required for refresh continuity.
      var oSession = {
        authenticated: true,
        userId: oData.userId,
        engineerName: oData.engineerName,
        plant: oData.plant,
        expiresAt: now() + SESSION_TTL_MS
      };
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(oSession));
      return oSession;
    },

    restore: function () {
      var oSession = parseSession(window.sessionStorage.getItem(STORAGE_KEY));
      if (!oSession.authenticated || oSession.expiresAt <= now()) {
        this.clear();
        return emptySession();
      }
      return oSession;
    },

    isAuthenticated: function () {
      return this.restore().authenticated === true;
    },

    clear: function () {
      // FRS: Logout removes both session and local storage to prevent browser-back unauthorized access.
      window.sessionStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };
});
