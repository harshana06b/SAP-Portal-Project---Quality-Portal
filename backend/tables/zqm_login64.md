# Custom Table: ZQM_LOGIN64

Purpose: portal-specific quality engineer authorization and plant assignment after standard SAP user existence is confirmed in `USR02`.

This table must not replace SAP user administration. It is a portal authorization extension used only after `USR02` confirms that the user exists and is active.

Primary key:

| Field | Key | Data Element | Description |
|---|---:|---|---|
| MANDT | Yes | MANDT | SAP client |
| USER_ID | Yes | XUBNAME | SAP user ID mapped to `USR02-BNAME` |

Fields:

| Field | Key | Data Element | Domain/Type | Description |
|---|---:|---|---|---|
| MANDT | Yes | MANDT | CLNT(3) | SAP client |
| USER_ID | Yes | XUBNAME | CHAR(12) | SAP user ID |
| PASSWORD_HASH | No | CHAR64 | CHAR(64) | SHA-256 hash used by backend validation |
| ENGINEER_NAME | No | AD_NAMTEXT | CHAR(80) | Display name for dashboard |
| PLANT | No | WERKS_D | CHAR(4) | Assigned plant |
| IS_ACTIVE | No | XFELD | CHAR(1) | Portal access flag |
| CREATED_BY | No | XUBNAME | CHAR(12) | Audit field |
| CREATED_ON | No | ERDAT | DATS(8) | Audit field |
| CHANGED_BY | No | XUBNAME | CHAR(12) | Audit field |
| CHANGED_ON | No | AEDAT | DATS(8) | Audit field |

Mandatory validations:

1. `USER_ID` must exist in `USR02-BNAME`.
2. `IS_ACTIVE` must be `X` before login is allowed.
3. `PASSWORD_HASH` must never be exposed through CDS or OData metadata used by the frontend.
4. `PLANT` must be a valid plant authorized for the engineer.

FRS mapping:

| FRS rule | Implementation |
|---|---|
| Check user exists in standard SAP | `USR02` lookup in `zcl_qm_login64_validation` |
| Validate against `ZQM_LOGIN64` | `USER_ID`, `PASSWORD_HASH`, `IS_ACTIVE`, and `PLANT` checks |
| Return engineer name and plant | `ZCDS_QM_LOGIN64` exposes only non-secret identity fields |
