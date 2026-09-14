# Custom Table: ZQM_RESULT64

Purpose: day-wise inspected quantity persistence for Quality Portal result recording.

Delivery class: `A`

Data browser/table view maintenance: restricted to technical administrators.

Primary key:

| Field | Key | Data Element | Description |
|---|---:|---|---|
| MANDT | Yes | MANDT | SAP client |
| PRUEFLOS | Yes | QPLOS | Inspection lot |
| ENTRY_DATE | Yes | DATS | Result entry date |

Fields:

| Field | Key | Data Element | Domain/Type | Description |
|---|---:|---|---|---|
| MANDT | Yes | MANDT | CLNT(3) | SAP client |
| PRUEFLOS | Yes | QPLOS | NUMC(12) | Inspection lot |
| ENTRY_DATE | Yes | DATS | DATS(8) | Day-wise save date |
| UNRESTRICTED_QTY | No | MENGE_D | QUAN(13,3) | Quantity moved to unrestricted stock |
| BLOCKED_QTY | No | MENGE_D | QUAN(13,3) | Quantity moved to blocked stock |
| PRODUCTION_QTY | No | MENGE_D | QUAN(13,3) | Quantity assigned to production |
| INSPECTED_BY | No | XUBNAME | CHAR(12) | SAP user who saved the result |
| STATUS | No | CHAR10 | CHAR(10) | `SAVED` or `LOCKED` |

Foreign key/check table:

`PRUEFLOS` references `QALS-PRUEFLOS`.

Mandatory table validations:

1. `UNRESTRICTED_QTY`, `BLOCKED_QTY`, and `PRODUCTION_QTY` must not be negative.
2. Save is rejected when a matching usage decision exists in `QAVE`.
3. One persisted row is allowed per inspection lot per calendar day.
4. `STATUS = LOCKED` after usage decision save and must not be changed back by the portal.

Recommended indexes:

| Index | Fields | Purpose |
|---|---|---|
| Z01 | PRUEFLOS | Fast load of previous saved quantities |
| Z02 | INSPECTED_BY, ENTRY_DATE | Audit/reporting by engineer and day |
