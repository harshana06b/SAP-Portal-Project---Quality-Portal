CLASS zcl_qm_login64_validation DEFINITION
  PUBLIC
  FINAL
  CREATE PUBLIC.

  PUBLIC SECTION.
    TYPES:
      BEGIN OF ty_login_result,
        login_success TYPE abap_bool,
        user_id       TYPE xubname,
        engineer_name TYPE zqm_login64-engineer_name,
        plant         TYPE werks_d,
        error_message TYPE string,
      END OF ty_login_result.

    CLASS-METHODS validate_login
      IMPORTING
        iv_user_id  TYPE xubname
        iv_password TYPE string
      RETURNING
        VALUE(rs_result) TYPE ty_login_result
      RAISING
        /iwbep/cx_mgw_busi_exception
        /iwbep/cx_mgw_tech_exception.

  PRIVATE SECTION.
    CLASS-METHODS normalize_user
      IMPORTING iv_user_id TYPE xubname
      RETURNING VALUE(rv_user_id) TYPE xubname.

    CLASS-METHODS verify_password
      IMPORTING
        iv_password      TYPE string
        iv_password_hash TYPE zqm_login64-password_hash
      RETURNING VALUE(rv_valid) TYPE abap_bool.

    CLASS-METHODS raise_business_error
      IMPORTING iv_message TYPE string
      RAISING /iwbep/cx_mgw_busi_exception.
ENDCLASS.

CLASS zcl_qm_login64_validation IMPLEMENTATION.
  METHOD validate_login.
    " FRS: Normalize the entered user ID before any SAP table validation.
    DATA(lv_user_id) = normalize_user( iv_user_id ).

    IF lv_user_id IS INITIAL OR iv_password IS INITIAL.
      " FRS: Empty credentials must fail without disclosing which field is invalid.
      rs_result-login_success = abap_false.
      rs_result-error_message = 'Invalid User ID or Password'.
      RETURN.
    ENDIF.

    " FRS: Step 1 checks whether the entered user exists in standard SAP table USR02.
    SELECT SINGLE bname, uflag, gltgv, gltgb
      FROM usr02
      WHERE bname = @lv_user_id
      INTO @DATA(ls_usr02).

    IF sy-subrc <> 0.
      " FRS: Unknown SAP users must be rejected before custom portal validation.
      rs_result-login_success = abap_false.
      rs_result-error_message = 'Invalid User ID or Password'.
      RETURN.
    ENDIF.

    IF ls_usr02-uflag <> 0
       OR ( ls_usr02-gltgv IS NOT INITIAL AND ls_usr02-gltgv <> '00000000' AND ls_usr02-gltgv > sy-datum )
       OR ( ls_usr02-gltgb IS NOT INITIAL AND ls_usr02-gltgb <> '00000000' AND ls_usr02-gltgb < sy-datum ).
      " FRS: Locked or expired SAP users cannot enter the quality portal.
      rs_result-login_success = abap_false.
      rs_result-error_message = 'SAP user is locked or outside validity period'.
      RETURN.
    ENDIF.

    " FRS: Step 2 validates the SAP user against custom table ZQM_LOGIN64.
    SELECT SINGLE user_id, engineer_name, plant, password_hash, is_active
      FROM zqm_login64
      WHERE user_id = @lv_user_id
      INTO @DATA(ls_login).

    IF sy-subrc <> 0 OR ls_login-is_active <> abap_true.
      " FRS: Portal-inactive or unmapped users must not authenticate.
      rs_result-login_success = abap_false.
      rs_result-error_message = 'Invalid User ID or Password'.
      RETURN.
    ENDIF.

    IF verify_password(
         iv_password      = iv_password
         iv_password_hash = ls_login-password_hash ) <> abap_true.
      " FRS: Invalid passwords must use the same response as invalid users.
      rs_result-login_success = abap_false.
      rs_result-error_message = 'Invalid User ID or Password'.
      RETURN.
    ENDIF.

    " FRS: Successful validation returns only required session identity fields.
    rs_result-login_success = abap_true.
    rs_result-user_id       = ls_login-user_id.
    rs_result-engineer_name = ls_login-engineer_name.
    rs_result-plant         = ls_login-plant.
  ENDMETHOD.

  METHOD normalize_user.
    rv_user_id = iv_user_id.
    CONDENSE rv_user_id NO-GAPS.
    TRANSLATE rv_user_id TO UPPER CASE.
  ENDMETHOD.

  METHOD verify_password.
    DATA lv_digest TYPE string.

    " FRS: Password comparison is performed in ABAP and password hashes are never exposed in CDS/OData.
    cl_abap_message_digest=>calculate_hash_for_char(
      EXPORTING
        if_algorithm  = 'SHA-256'
        if_data       = iv_password
      IMPORTING
        ef_hashstring = lv_digest ).

    rv_valid = xsdbool( lv_digest = to_upper( CONV string( iv_password_hash ) ) ).
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
