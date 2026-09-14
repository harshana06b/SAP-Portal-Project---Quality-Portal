# SAP Gateway OData V2 Services

Only these production CDS OData services are consumed by the Quality Portal:

All URLs in this file target SAP Gateway. They are not mock server URLs and are not local JSON resources.

| Module | CDS View | Service |
|---|---|---|
| Login | `ZCDS_QM_LOGIN64` | `ZCDS_QM_LOGIN64_CDS` |
| Inspection Lot | `ZCDS_QM_LOTNEW64` | `ZCDS_QM_LOTNEW64_CDS` |
| Result Recording | `ZCDS_QM_RESULTOR64` | `ZCDS_QM_RESULTOR64_CDS` |
| Usage Decision | `ZCDS_QM_DECISIONNEW64` | `ZCDS_QM_DECISIONNEW64_CDS` |

## Service Registration

Activate each CDS view in ADT, then register the generated OData services in `/IWFND/MAINT_SERVICE`.

1. Add Service.
2. Select the system alias for the NetWeaver backend.
3. Search by service technical name.
4. Register each service in the production package/transport.
5. Verify SICF node activation under `/sap/opu/odata/sap`.

Do not register alternate services for the portal frontend.

## Metadata URLs

`/sap/opu/odata/sap/ZCDS_QM_LOGIN64_CDS/$metadata`

`/sap/opu/odata/sap/ZCDS_QM_LOTNEW64_CDS/$metadata`

`/sap/opu/odata/sap/ZCDS_QM_RESULTOR64_CDS/$metadata`

`/sap/opu/odata/sap/ZCDS_QM_DECISIONNEW64_CDS/$metadata`

## JSON URLs

`/sap/opu/odata/sap/ZCDS_QM_LOGIN64_CDS/ZCDS_QM_LOGIN64?$format=json`

`/sap/opu/odata/sap/ZCDS_QM_LOTNEW64_CDS/ZCDS_QM_LOTNEW64?$format=json`

`/sap/opu/odata/sap/ZCDS_QM_RESULTOR64_CDS/ZCDS_QM_RESULTOR64?$format=json`

`/sap/opu/odata/sap/ZCDS_QM_DECISIONNEW64_CDS/ZCDS_QM_DECISIONNEW64?$format=json`

## Testing URLs

Filter lots by plant:

`/sap/opu/odata/sap/ZCDS_QM_LOTNEW64_CDS/ZCDS_QM_LOTNEW64?$filter=Plant eq '1000'&$format=json`

Load one inspection lot:

`/sap/opu/odata/sap/ZCDS_QM_LOTNEW64_CDS/ZCDS_QM_LOTNEW64('000000000001')?$format=json`

Load previous saved results:

`/sap/opu/odata/sap/ZCDS_QM_RESULTOR64_CDS/ZCDS_QM_RESULTOR64?$filter=InspectionLot eq '000000000001'&$orderby=EntryDate desc&$format=json`

Load usage decision state:

`/sap/opu/odata/sap/ZCDS_QM_DECISIONNEW64_CDS/ZCDS_QM_DECISIONNEW64?$filter=InspectionLot eq '000000000001'&$format=json`

## Error Handling URLs

Unauthorized:

`/sap/opu/odata/sap/ZCDS_QM_LOTNEW64_CDS/ZCDS_QM_LOTNEW64?$format=json`

Forbidden authorization test:

`/sap/opu/odata/sap/ZCDS_QM_DECISIONNEW64_CDS/ZCDS_QM_DECISIONNEW64?$format=json`

Missing entity:

`/sap/opu/odata/sap/ZCDS_QM_LOTNEW64_CDS/ZCDS_QM_LOTNEW64('999999999999')?$format=json`

Backend unavailable:

Stop or isolate the SAP system alias destination and call:

`/sap/opu/odata/sap/ZCDS_QM_LOGIN64_CDS/$metadata`

Expected frontend mappings:

| HTTP Status | Portal Message |
|---:|---|
| 401 | Session expired. Please log in again. |
| 403 | You are not authorized to perform this action. |
| 404 | Requested SAP quality data was not found. |
| 500 | SAP backend error. Please contact support with the timestamp. |
| 503 | Unable to connect to SAP backend. |
