sap.ui.define([
  "com/quality/portal/qualitylogin/controller/BaseController",
  "sap/ui/model/json/JSONModel",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/m/MessageBox"
], function (BaseController, JSONModel, Filter, FilterOperator, MessageBox) {
  "use strict";

  function isTrue(vValue) {
    return vValue === true || vValue === "true" || vValue === "TRUE" || vValue === "X" || vValue === "1";
  }

  function firstAvailable(oObject, aNames) {
    var sKey;
    for (var i = 0; i < aNames.length; i += 1) {
      sKey = aNames[i];
      if (Object.prototype.hasOwnProperty.call(oObject || {}, sKey) && oObject[sKey] !== undefined && oObject[sKey] !== null) {
        return oObject[sKey];
      }
    }
    return "";
  }

  return BaseController.extend("com.quality.portal.qualitylogin.controller.Login", {
    onInit: function () {
      this.getView().setModel(new JSONModel({
        userId: "",
        password: "",
        passwordType: "Password",
        passwordIcon: "sap-icon://show",
        passwordToggleText: "Show Password",
        busy: false
      }), "loginForm");
    },

    onTogglePassword: function () {
      var oModel = this.getView().getModel("loginForm");
      var bPassword = oModel.getProperty("/passwordType") === "Password";
      oModel.setProperty("/passwordType", bPassword ? "Text" : "Password");
      oModel.setProperty("/passwordIcon", bPassword ? "sap-icon://hide" : "sap-icon://show");
      oModel.setProperty("/passwordToggleText", bPassword ? "Hide Password" : "Show Password");
    },

    onLogin: function () {
      var oFormModel = this.getView().getModel("loginForm");
      var sUserId = String(oFormModel.getProperty("/userId") || "").trim().toUpperCase();
      var sPassword = String(oFormModel.getProperty("/password") || "");

      if (!sUserId || !sPassword) {
        MessageBox.error("Invalid User ID or Password");
        return;
      }

      oFormModel.setProperty("/busy", true);

      // FRS: The frontend sends credentials only to the real SAP login OData service.
      this._validateLoginWithSap(sUserId, sPassword)
        .then(function (oSessionData) {
          this.getOwnerComponent().login(oSessionData);
          this.navTo("dashboard", {}, true);
        }.bind(this))
        .catch(function (oError) {
          if (oError && oError.invalidCredentials) {
            MessageBox.error("Invalid User ID or Password");
          } else {
            this.handleError(oError);
          }
        }.bind(this))
        .finally(function () {
          oFormModel.setProperty("/busy", false);
        });
    },

    _validateLoginWithSap: function (sUserId, sPassword) {
      var oModel = this.getComponentModel("login");

      // FRS: ZCDS_QM_LOGIN64_CDS is implemented as a parameterized CDS entity:
      // /ZCDS_QM_LOGIN64(p_bname='QE001',p_password='123456')/Set
      return this._readParameterizedLogin(oModel, sUserId, sPassword)
        .catch(function (oError) {
          if (oError && oError.invalidCredentials) {
            return Promise.reject(oError);
          }
          return this._whenMetadataLoaded(oModel)
        .then(function () {
          var oMetadata = this._readLoginMetadata(oModel);

          if (oMetadata.functionImport) {
            return this._callLoginFunction(oModel, oMetadata.functionImport, sUserId, sPassword);
          }

          if (oMetadata.entitySet) {
            return this._createLoginEntity(oModel, oMetadata.entitySet, sUserId, sPassword)
              .catch(function () {
                return this._readLoginEntity(oModel, oMetadata.entitySet, oMetadata.properties, sUserId, sPassword);
              }.bind(this));
          }

          return Promise.reject({ invalidCredentials: true });
        }.bind(this));
        }.bind(this));
    },

    _readParameterizedLogin: function (oModel, sUserId, sPassword) {
      var sPath = "/ZCDS_QM_LOGIN64(p_bname='" + this._toODataString(sUserId) + "',p_password='" + this._toODataString(sPassword) + "')/Set";

      return new Promise(function (resolve, reject) {
        // FRS: Login validation is executed by the real SAP parameterized CDS service using BNAME and PASSWORD.
        oModel.read(sPath, {
          success: function (oData) {
            var aRows = oData && oData.results || [];
            if (!aRows.length) {
              reject({ invalidCredentials: true });
              return;
            }
            this._resolveLoginResult(aRows[0], sUserId, resolve, reject);
          }.bind(this),
          error: function (oError) {
            var iStatus = Number(oError && oError.statusCode);
            if (iStatus === 400 || iStatus === 401 || iStatus === 403 || iStatus === 404) {
              reject({ invalidCredentials: true, originalError: oError });
              return;
            }
            reject(oError);
          }
        });
      }.bind(this));
    },

    _toODataString: function (sValue) {
      // FRS: Credentials are sent only to SAP Gateway; quotes are escaped according to OData string literal rules.
      return encodeURIComponent(String(sValue || "").replace(/'/g, "''"));
    },

    _whenMetadataLoaded: function (oModel) {
      return new Promise(function (resolve, reject) {
        if (oModel.getServiceMetadata()) {
          resolve();
          return;
        }

        oModel.attachMetadataLoaded(resolve);
        oModel.attachMetadataFailed(reject);
      });
    },

    _readLoginMetadata: function (oModel) {
      var oMetadata = oModel.getServiceMetadata() || {};
      var aSchemas = oMetadata.dataServices && oMetadata.dataServices.schema || [];
      var oResult = {
        functionImport: null,
        entitySet: "",
        properties: []
      };

      aSchemas.forEach(function (oSchema) {
        (oSchema.entityContainer || []).forEach(function (oContainer) {
          (oContainer.functionImport || []).forEach(function (oFunction) {
            var sName = String(oFunction.name || "").toUpperCase();
            if (!oResult.functionImport && (sName.indexOf("VALIDATE") >= 0 || sName.indexOf("LOGIN") >= 0)) {
              oResult.functionImport = oFunction;
            }
          });

          (oContainer.entitySet || []).forEach(function (oEntitySet) {
            var sName = String(oEntitySet.name || "").toUpperCase();
            if (!oResult.entitySet && sName.indexOf("LOGIN") >= 0) {
              oResult.entitySet = oEntitySet.name;
              oResult.entityType = oEntitySet.entityType;
            }
          });
        });

        if (oResult.entityType) {
          (oSchema.entityType || []).forEach(function (oEntityType) {
            var sEntityType = String(oResult.entityType).split(".").pop();
            if (oEntityType.name === sEntityType) {
              oResult.properties = (oEntityType.property || []).map(function (oProperty) {
                return oProperty.name;
              });
            }
          });
        }
      });

      return oResult;
    },

    _callLoginFunction: function (oModel, oFunction, sUserId, sPassword) {
      var mParameters = {};

      (oFunction.parameter || []).forEach(function (oParameter) {
        var sName = oParameter.name;
        var sUpperName = String(sName).toUpperCase();
        if (sUpperName.indexOf("USER") >= 0 || sUpperName === "BNAME") {
          mParameters[sName] = sUserId;
        }
        if (sUpperName.indexOf("PASS") >= 0 || sUpperName.indexOf("PWD") >= 0) {
          mParameters[sName] = sPassword;
        }
      });

      return new Promise(function (resolve, reject) {
        // FRS: Function import validation is preferred when SAP Gateway metadata exposes it.
        oModel.callFunction("/" + oFunction.name, {
          method: oFunction["m:HttpMethod"] || oFunction.httpMethod || "POST",
          urlParameters: mParameters,
          success: function (oData) {
            this._resolveLoginResult(oData && (oData[oFunction.name] || oData), sUserId, resolve, reject);
          }.bind(this),
          error: reject
        });
      }.bind(this));
    },

    _createLoginEntity: function (oModel, sEntitySet, sUserId, sPassword) {
      return new Promise(function (resolve, reject) {
        // FRS: Some Gateway services implement credential validation in CREATE_ENTITY instead of a function import.
        oModel.create("/" + sEntitySet, {
          UserId: sUserId,
          Password: sPassword
        }, {
          success: function (oData) {
            this._resolveLoginResult(oData, sUserId, resolve, reject);
          }.bind(this),
          error: reject
        });
      }.bind(this));
    },

    _readLoginEntity: function (oModel, sEntitySet, aProperties, sUserId, sPassword) {
      var aFilters = [new Filter(this._findProperty(aProperties, ["UserId", "USER_ID", "Bname", "BNAME"]), FilterOperator.EQ, sUserId)];
      var sPasswordProperty = this._findProperty(aProperties, ["Password", "PASSWORD", "Pass", "PASS"]);

      if (sPasswordProperty) {
        // FRS: Password is included in read filters only when the SAP service metadata explicitly exposes a credential-validation field.
        aFilters.push(new Filter(sPasswordProperty, FilterOperator.EQ, sPassword));
      }

      return new Promise(function (resolve, reject) {
        oModel.read("/" + sEntitySet, {
          filters: aFilters,
          success: function (oData) {
            var aRows = oData && oData.results || [];
            if (!aRows.length) {
              reject({ invalidCredentials: true });
              return;
            }
            this._resolveLoginResult(aRows[0], sUserId, resolve, reject);
          }.bind(this),
          error: reject
        });
      }.bind(this));
    },

    _findProperty: function (aProperties, aCandidates) {
      var aUpperProperties = (aProperties || []).map(function (sName) {
        return String(sName).toUpperCase();
      });

      for (var i = 0; i < aCandidates.length; i += 1) {
        var iIndex = aUpperProperties.indexOf(String(aCandidates[i]).toUpperCase());
        if (iIndex >= 0) {
          return aProperties[iIndex];
        }
      }

      return aCandidates[0];
    },

    _resolveLoginResult: function (oResult, sUserId, resolve, reject) {
      var vLoginSuccess = firstAvailable(oResult, ["LoginSuccess", "LOGIN_SUCCESS", "login_success"]);
      var sUser = firstAvailable(oResult, ["UserId", "USER_ID", "Bname", "BNAME", "bname"]) || sUserId;
      var sEngineerName = firstAvailable(oResult, ["EngineerName", "ENGINEER_NAME", "Engineer", "Name", "Bname", "BNAME", "bname"]) || sUser;
      var sPlant = firstAvailable(oResult, ["Plant", "PLANT", "Werks", "WERKS", "werks"]);

      // FRS: Navigation is allowed only when SAP returns an explicit successful login result or a validated identity row.
      if (vLoginSuccess !== "" && !isTrue(vLoginSuccess)) {
        reject({ invalidCredentials: true });
        return;
      }

      if (!sEngineerName || !sPlant) {
        reject({ invalidCredentials: true });
        return;
      }

      resolve({
        userId: sUser,
        engineerName: sEngineerName,
        plant: sPlant
      });
    }
  });
});
