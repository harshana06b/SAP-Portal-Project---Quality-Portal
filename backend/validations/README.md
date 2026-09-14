# Backend Validation Contract

The portal must enforce validations in SAP backend code before any state-changing operation.

No frontend-only validation is sufficient for save or usage decision logic. UI validation may improve user experience, but ABAP validation remains authoritative.

Login:

1. Confirm the user exists in `USR02`.
2. Confirm the SAP user is not locked and is inside the validity period.
3. Validate credentials against `ZQM_LOGIN64`.
4. Return engineer name and plant only after successful validation.

Result recording:

1. Reject negative quantities.
2. Reject saves after usage decision exists in `QAVE`.
3. Persist day-wise quantities in `ZQM_RESULT64`.
4. Load previous saved quantities by inspection lot.

Usage decision:

1. Accept only approved/rejected valuations.
2. Verify `QALS-LOSMENGE = unrestricted + blocked + production`.
3. Throw `Lot quantity should match inspected quantity` on mismatch.
4. Lock all `ZQM_RESULT64` rows for the lot after decision save.

FRS exact error:

`Lot quantity should match inspected quantity`

This message must be raised by backend validation when inspected quantity totals do not match `QALS-LOSMENGE`.
