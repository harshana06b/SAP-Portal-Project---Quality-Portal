# OData V2 Backend Test URLs

All URLs use real SAP Gateway services under `/sap/opu/odata/sap`. No mock server, local JSON, or static payload is part of this backend.

## Login

Metadata:

`/sap/opu/odata/sap/ZCDS_QM_LOGIN64_CDS/$metadata`

Read one portal-enabled SAP user:

`/sap/opu/odata/sap/ZCDS_QM_LOGIN64_CDS/ZCDS_QM_LOGIN64('QENG001')?$format=json`

Filter by active SAP user state:

`/sap/opu/odata/sap/ZCDS_QM_LOGIN64_CDS/ZCDS_QM_LOGIN64?$filter=UserId eq 'QENG001' and SapUserActive eq 'X'&$format=json`

## Inspection Lot

Metadata:

`/sap/opu/odata/sap/ZCDS_QM_LOTNEW64_CDS/$metadata`

List inspection lots by plant:

`/sap/opu/odata/sap/ZCDS_QM_LOTNEW64_CDS/ZCDS_QM_LOTNEW64?$filter=Plant eq '1000'&$format=json`

Read one inspection lot:

`/sap/opu/odata/sap/ZCDS_QM_LOTNEW64_CDS/ZCDS_QM_LOTNEW64('000000000001')?$format=json`

## Result Recording

Metadata:

`/sap/opu/odata/sap/ZCDS_QM_RESULTOR64_CDS/$metadata`

Load previous saved quantities:

`/sap/opu/odata/sap/ZCDS_QM_RESULTOR64_CDS/ZCDS_QM_RESULTOR64?$filter=InspectionLot eq '000000000001'&$orderby=EntryDate desc&$format=json`

Load read-only decision state:

`/sap/opu/odata/sap/ZCDS_QM_RESULTOR64_CDS/ZCDS_QM_RESULTOR64?$filter=InspectionLot eq '000000000001' and ReadOnly eq 'X'&$format=json`

## Usage Decision

Metadata:

`/sap/opu/odata/sap/ZCDS_QM_DECISIONNEW64_CDS/$metadata`

Load decision readiness:

`/sap/opu/odata/sap/ZCDS_QM_DECISIONNEW64_CDS/ZCDS_QM_DECISIONNEW64?$filter=InspectionLot eq '000000000001'&$format=json`

## Error Handling

401 unauthorized:

Call any service without a valid SAP session.

403 forbidden:

Call a service with a user that has no plant authorization.

404 not found:

`/sap/opu/odata/sap/ZCDS_QM_LOTNEW64_CDS/ZCDS_QM_LOTNEW64('999999999999')?$format=json`

500 backend validation error:

Attempt usage decision save with mismatched inspected quantities. Expected backend message:

`Lot quantity should match inspected quantity`

503 unavailable:

Call service metadata when the SAP backend alias or ICF node is unavailable.
