@EndUserText.label: 'Quality Portal CDS Authorization'
define role ZR_QM_PORTAL64 {
  /* FRS: Production CDS views use authorization checks and plant-level SAP authorizations. */
  grant select on ZCDS_QM_LOGIN64
    where Plant = aspect pfcg_auth( M_MATE_WRK, WERKS, ACTVT = '03' );

  grant select on ZCDS_QM_LOTNEW64
    where Plant = aspect pfcg_auth( M_MATE_WRK, WERKS, ACTVT = '03' );

  grant select on ZCDS_QM_RESULTOR64
    where Plant = aspect pfcg_auth( M_MATE_WRK, WERKS, ACTVT = '03' );

  grant select on ZCDS_QM_DECISIONNEW64
    where Plant = aspect pfcg_auth( M_MATE_WRK, WERKS, ACTVT = '03' );
}
