# Login Service Test URLs

Service technical name: `ZCDS_QM_LOGIN64_CDS`

Gateway client base:

`/sap/opu/odata/sap/ZCDS_QM_LOGIN64_CDS/`

Metadata:

`/sap/opu/odata/sap/ZCDS_QM_LOGIN64_CDS/$metadata`

Read active SAP-backed portal user:

`/sap/opu/odata/sap/ZCDS_QM_LOGIN64_CDS/ZCDS_QM_LOGIN64?$filter=UserId eq 'QENG001'&$format=json`

Validate user existence without exposing password:

`/sap/opu/odata/sap/ZCDS_QM_LOGIN64_CDS/ZCDS_QM_LOGIN64('QENG001')?$format=json`

Expected invalid credential response from validation class:

HTTP `200` with `LoginSuccess = false` when the user/password combination fails functional validation.

Expected SAP unavailable response:

HTTP `503` from SAP Gateway or reverse proxy when NetWeaver is unreachable.
