# Quality Portal Backend

This folder contains the backend design-time artifacts for the production Quality Portal. The implementation uses real SAP NetWeaver and SAP QM data only.

No mock data, local JSON, hardcoded test data, UI5 mock server, or fake APIs are part of this backend.

## Approved OData Services

| FRS area | Service | Source tables |
|---|---|---|
| Login | `ZCDS_QM_LOGIN64_CDS` | `USR02`, `ZQM_LOGIN64` |
| Inspection Lot | `ZCDS_QM_LOTNEW64_CDS` | `QALS`, `QAVE` |
| Result Recording | `ZCDS_QM_RESULTOR64_CDS` | `QAMR`, `QALS`, `QAVE`, `ZQM_RESULT64` |
| Usage Decision | `ZCDS_QM_DECISIONNEW64_CDS` | `QALS`, `QAVE`, `ZQM_RESULT64` |

## File-by-File Backend Inventory

| File path | Purpose | FRS mapping |
|---|---|---|
| `backend/cds/login.cds` | Exposes portal-enabled SAP users from `ZQM_LOGIN64` joined with standard SAP user master `USR02`. Password fields are intentionally not exposed. | Login user existence, active SAP user validation, engineer name, plant |
| `backend/abap/login-validation.abap` | Performs server-side login validation in the required order: `USR02` existence first, then `ZQM_LOGIN64` credential validation. | Reject invalid user/password, allow only valid login |
| `backend/cds/inspection-lot.cds` | Exposes inspection lot data from `QALS` and usage decision status from `QAVE`. | Inspection lot screen |
| `backend/cds/result-recording.cds` | Exposes `QAMR` characteristics and saved quantity persistence from `ZQM_RESULT64`; derives read-only state from `QAVE`. | Result recording, previous saved values, read-only after decision |
| `backend/abap/result-validation.abap` | Validates result save, rejects saves after usage decision, supports day-wise insert/update, and loads previous entries. | Unrestricted, blocked, production stock save |
| `backend/cds/usage-decision.cds` | Exposes lot quantity, persisted inspected quantities, and decision state for usage decision processing. | Usage decision screen |
| `backend/abap/usage-decision-validation.abap` | Validates `LotQuantity = Unrestricted + Blocked + Production` and locks results after decision. | Required quantity match error and permanent lock |
| `backend/cds/authorization.dcl` | Defines CDS authorization checks using SAP PFCG plant authorization. | Enterprise security |
| `backend/tables/zqm_login64.md` | Documents portal login authorization table. | `ZQM_LOGIN64` design |
| `backend/tables/zqm_result64.md` | Documents day-wise result persistence table. | `ZQM_RESULT64` design |
| `backend/odata/services.md` | Documents service registration, metadata URLs, JSON URLs, test URLs, and error handling. | SAP Gateway OData V2 |
| `backend/testing/login-urls.md` | Documents login-specific Gateway Client test URLs. | Login test execution |
| `backend/testing/odata-urls.md` | Documents end-to-end OData test URLs for all backend modules. | Backend verification |
| `backend/validations/README.md` | Central validation contract for login, result recording, and usage decision. | Business validations |

## Backend Business Rules

### Login

1. User ID is normalized before validation.
2. `USR02` is checked first to confirm the entered user exists in standard SAP.
3. Locked or expired `USR02` users are rejected.
4. `ZQM_LOGIN64` is checked only after `USR02` succeeds.
5. Password validation is performed in ABAP.
6. OData never exposes password or password hash.
7. Successful login returns only user ID, engineer name, and plant.

### Result Recording

1. Inspection lot must exist in `QALS`.
2. Result characteristics are sourced from `QAMR`.
3. Saved quantities are persisted in `ZQM_RESULT64`.
4. Save is day-wise by `PRUEFLOS` and `ENTRY_DATE`.
5. Previous saved quantities are loaded from `ZQM_RESULT64`.
6. Negative quantities are rejected.
7. If `QAVE` has a usage decision, result recording becomes read-only and save is rejected.

### Usage Decision

1. Inspection lot quantity is sourced from `QALS-LOSMENGE`.
2. Existing usage decision is checked in `QAVE`.
3. Inspected quantities are summed from `ZQM_RESULT64`.
4. Backend validates this exact formula:

   `LotQuantity = Unrestricted + Blocked + Production`

5. If the formula does not match, backend throws:

   `Lot quantity should match inspected quantity`

6. The usage decision must not save when the formula fails.
7. After valid decision save, `ZQM_RESULT64-STATUS` is set to `LOCKED`.

## SAP Activation Sequence

1. Create or validate custom table `ZQM_LOGIN64`.
2. Create custom table `ZQM_RESULT64`.
3. Activate CDS files under `backend/cds`.
4. Activate ABAP validation classes under `backend/abap`.
5. Register services in `/IWFND/MAINT_SERVICE`.
6. Assign PFCG roles for plant authorization.
7. Test metadata URLs.
8. Test JSON URLs.
9. Test backend validation failures in SAP Gateway Client.

## Gateway Registration

Register only these services:

`ZCDS_QM_LOGIN64_CDS`

`ZCDS_QM_LOTNEW64_CDS`

`ZCDS_QM_RESULTOR64_CDS`

`ZCDS_QM_DECISIONNEW64_CDS`

## Error Contract

| HTTP status | Backend meaning | Frontend message |
|---:|---|---|
| 401 | No valid SAP session | Session expired. Please log in again. |
| 403 | Missing SAP authorization | You are not authorized to perform this action. |
| 404 | SAP entity not found | Requested SAP quality data was not found. |
| 500 | ABAP validation or runtime error | SAP backend error. Please contact support with the timestamp. |
| 503 | SAP backend unavailable | Unable to connect to SAP backend. |

## Frontend Boundary

Frontend generation must start only after this backend package is reviewed and activated in SAP. The frontend must consume only the four approved OData V2 services listed in this README.
