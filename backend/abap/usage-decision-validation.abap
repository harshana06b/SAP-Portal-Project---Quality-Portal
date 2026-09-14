CLASS zcl_qm_decision64_validation DEFINITION
  PUBLIC
  FINAL
  CREATE PUBLIC.

  PUBLIC SECTION.
    TYPES:
      BEGIN OF ty_decision,
        inspection_lot TYPE qals-prueflos,
        decision_code  TYPE qave-vcode,
        valuation      TYPE qave-vbewertung,
        decided_by     TYPE xubname,
      END OF ty_decision.

    CONSTANTS:
      gc_approved TYPE qave-vbewertung VALUE 'A',
      gc_rejected TYPE qave-vbewertung VALUE 'R'.

    CLASS-METHODS validate_before_save
      IMPORTING is_decision TYPE ty_decision
      RAISING /iwbep/cx_mgw_busi_exception.

    CLASS-METHODS lock_result_editing
      IMPORTING iv_inspection_lot TYPE qals-prueflos
      RAISING /iwbep/cx_mgw_busi_exception.

  PRIVATE SECTION.
    CLASS-METHODS raise_business_error
      IMPORTING iv_message TYPE string
      RAISING /iwbep/cx_mgw_busi_exception.
ENDCLASS.

CLASS zcl_qm_decision64_validation IMPLEMENTATION.
  METHOD validate_before_save.
    IF is_decision-inspection_lot IS INITIAL
       OR is_decision-decision_code IS INITIAL
       OR is_decision-decided_by IS INITIAL.
      " FRS: Usage decision save must be tied to a real lot, decision code, and SAP user.
      raise_business_error( 'Inspection lot, decision code, and decided by are mandatory' ).
    ENDIF.

    IF is_decision-valuation <> gc_approved AND is_decision-valuation <> gc_rejected.
      " FRS: Portal allows only approved or rejected decisions.
      raise_business_error( 'Usage decision must be Approved or Rejected' ).
    ENDIF.

    " FRS: Lot quantity is read from QALS only.
    SELECT SINGLE losmenge
      FROM qals
      WHERE prueflos = @is_decision-inspection_lot
      INTO @DATA(lv_lot_quantity).

    IF sy-subrc <> 0.
      raise_business_error( 'Inspection lot does not exist' ).
    ENDIF.

    " FRS: QAVE prevents duplicate usage decisions.
    SELECT SINGLE prueflos
      FROM qave
      WHERE prueflos = @is_decision-inspection_lot
      INTO @DATA(lv_existing_decision).

    IF sy-subrc = 0.
      raise_business_error( 'Usage decision already exists' ).
    ENDIF.

    " FRS: Inspected quantity total is read from day-wise ZQM_RESULT64 persistence.
    SELECT SUM( unrestricted_qty ) AS unrestricted_qty,
           SUM( blocked_qty )      AS blocked_qty,
           SUM( production_qty )   AS production_qty
      FROM zqm_result64
      WHERE prueflos = @is_decision-inspection_lot
      INTO @DATA(ls_totals).

    DATA(lv_total_inspected) =
      ls_totals-unrestricted_qty + ls_totals-blocked_qty + ls_totals-production_qty.

    " FRS: Exact required error message; decision must not save when quantities mismatch.
    IF lv_lot_quantity <> lv_total_inspected.
      raise_business_error( 'Lot quantity should match inspected quantity' ).
    ENDIF.
  ENDMETHOD.

  METHOD lock_result_editing.
    " FRS: After usage decision save, result editing is permanently locked for the lot.
    UPDATE zqm_result64
      SET status = 'LOCKED'
      WHERE prueflos = @iv_inspection_lot.

    IF sy-subrc <> 0.
      raise_business_error( 'Unable to lock result editing after usage decision' ).
    ENDIF.
  ENDMETHOD.

  METHOD raise_business_error.
    DATA(lo_message_container) = /iwbep/cl_mgw_msg_container=>get_mgw_msg_container( ).
    lo_message_container->add_message_text_only(
      iv_msg_type = /iwbep/cl_cos_logger=>error
      iv_msg_text = iv_message ).
    RAISE EXCEPTION TYPE /iwbep/cx_mgw_busi_exception
      EXPORTING
        message_container = lo_message_container.
  ENDMETHOD.
ENDCLASS.
