@AbapCatalog.sqlViewName: 'ZVQMLOGIN64'
@AbapCatalog.compiler.compareFilter: true
@AccessControl.authorizationCheck: #CHECK
@EndUserText.label: 'Quality Portal Login Identity'
@OData.publish: true
define view ZCDS_QM_LOGIN64
  as select from zqm_login64 as Login
    inner join usr02 as SapUser
      on SapUser.bname = Login.user_id
{
      /* FRS: The portal reads only SAP-backed identities; password material is never exposed through OData. */
  key Login.user_id       as UserId,
      Login.engineer_name as EngineerName,
      Login.plant         as Plant,
      /* FRS: USR02 validates that the entered user exists in standard SAP before custom portal validation. */
      SapUser.uflag       as SapUserLockStatus,
      SapUser.gltgv       as ValidFrom,
      SapUser.gltgb       as ValidTo,
      /* FRS: Locked or expired SAP users cannot be treated as valid portal users. */
      case
        when SapUser.uflag = 0
         and ( SapUser.gltgv = '00000000' or SapUser.gltgv <= $session.system_date )
         and ( SapUser.gltgb = '00000000' or SapUser.gltgb >= $session.system_date )
        then cast( 'X' as abap.char(1) )
        else cast( '' as abap.char(1) )
      end                 as SapUserActive
}
where Login.is_active = 'X'
