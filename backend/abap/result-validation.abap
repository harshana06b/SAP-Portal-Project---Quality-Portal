CLASS zcl_qm_result64_validation DEFINITION
  PUBLIC
  FINAL
  CREATE PUBLIC.

  PUBLIC SECTION.
    TYPES:
      BEGIN OF ty_result_save,
        inspection_lot   TYPE qals-prueflos,
        entry_date       TYPE dats,
        unrestricted_qty TYPE zqm_result64-unrestricted_qty,
        blocked_qty      TYPE zqm_result64-blocked_qty,
        production_qty   TYPE zqm_result64-production_qty,
        inspected_by     TYPE xubname,
      END OF ty_result_save.

    CLASS-METHODS save_result
      IMPORTING is_result TYPE ty_result_save
      RAISING
        /iwbep/cx_mgw_busi_exception
        /iwbep/cx_mgw_tech_exception.

    CLASS-METHODS load_previous
      IMPORTING
        iv_inspection_lot TYPE qals-prueflos
      RETURNING
        VALUE(rt_result) TYPE STANDARD TABLE OF zqm_result64
      RAISING /iwbep/cx_mgw_busi_exception.

  PRIVATE SECTION.
    CLASS-METHODS assert_lot_open
      IMPORTING iv_inspection_lot TYPE qals-prueflos
      RAISING /iwbep/cx_mgw_busi_exception.

    CLASS-METHODS assert_quantities
      IMPORTING is_result TYPE ty_result_save
      RAISING /iwbep/cx_mgw_busi_exception.

    CLASS-METHODS raise_business_error
      IMPORTING iv_message TYPE string
      RAISING /iwbep/cx_mgw_busi_exception.
ENDCLASS.

CLASS zcl_qm_result64_validation IMPLEMENTATION.
  METHOD save_result.
    DATA(ls_result) = is_result.

    IF ls_result-entry_date IS INITIAL.
      " FRS: Day-wise save defaults to the current SAP application server date.
      ls_result-entry_date = sy-datum.
    ENDIF.

    IF ls_result-inspection_lot IS INITIAL OR ls_result-inspected_by IS INITIAL.
      " FRS: Result recording must always be tied to a real inspection lot and SAP user.
      raise_business_error( 'Inspection lot and inspected by are mandatory' ).
    ENDIF.

    " FRS: Existing usage decision makes the result screen read-only and blocks save.
    assert_lot_open( ls_result-inspection_lot ).
    " FRS: Quantity business validations run before insert/update.
    assert_quantities( ls_result ).

    " FRS: Inspection lot must exist in QALS; no local or mock lot data is accepted.
    SELECT SINGLE prueflos
      FROM qals
      WHERE prueflos = @ls_result-inspection_lot
      INTO @DATA(lv_lot).

    IF sy-subrc <> 0.
      raise_business_error( 'Inspection lot does not exist' ).
    ENDIF.

    " FRS: One row per inspection lot per calendar day supports day-wise save and reload.
    SELECT SINGLE prueflos
      FROM zqm_result64
      WHERE prueflos = @ls_result-inspection_lot
        AND entry_date = @ls_result-entry_date
      INTO @DATA(lv_existing_lot).

    IF sy-subrc = 0.
      " FRS: Previous same-day quantities are updated while unlocked.
      UPDATE zqm_result64
        SET unrestricted_qty = @ls_result-unrestricted_qty,
            blocked_qty      = @ls_result-blocked_qty,
            production_qty   = @ls_result-production_qty,
            inspected_by     = @ls_result-inspected_by,
            status           = 'SAVED'
        WHERE prueflos = @ls_result-inspection_lot
          AND entry_date = @ls_result-entry_date
          AND status <> 'LOCKED'.
    ELSE.
      " FRS: First save of the day persists unrestricted, blocked, and production quantities.
      INSERT zqm_result64 FROM VALUE #(
        mandt            = sy-mandt
        prueflos         = ls_result-inspection_lot
        entry_date       = ls_result-entry_date
        unrestricted_qty = ls_result-unrestricted_qty
        blocked_qty      = ls_result-blocked_qty
        production_qty   = ls_result-production_qty
        inspected_by     = ls_result-inspected_by
        status           = 'SAVED' ).
    ENDIF.

    IF sy-subrc <> 0.
      raise_business_error( 'Result save failed or result is already locked' ).
    ENDIF.
  ENDMETHOD.

  METHOD load_previous.
    " FRS: Previous saved quantities are loaded from ZQM_RESULT64, newest day first.
    SELECT *
      FROM zqm_result64
      WHERE prueflos = @iv_inspection_lot
      ORDER BY entry_date DESCENDING
      INTO TABLE @rt_result.
  ENDMETHOD.

  METHOD assert_lot_open.
    " FRS: QAVE is the source of truth for usage decision existence.
    SELECT SINGLE prueflos
      FROM qave
      WHERE prueflos = @iv_inspection_lot
      INTO @DATA(lv_decided_lot).

    IF sy-subrc = 0.
      raise_business_error( 'Usage decision already exists. Result recording is read only' ).
    ENDIF.
  ENDMETHOD.

  METHOD assert_quantities.
    " FRS: Negative inspected stock quantities are not valid SAP QM business input.
    IF is_result-unrestricted_qty < 0
       OR is_result-blocked_qty < 0
       OR is_result-production_qty < 0.
      raise_business_error( 'Inspected quantities cannot be negative' ).
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
