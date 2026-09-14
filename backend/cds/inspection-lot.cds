@AbapCatalog.sqlViewName: 'ZVQMLOT64'
@AbapCatalog.compiler.compareFilter: true
@AccessControl.authorizationCheck: #CHECK
@EndUserText.label: 'Quality Portal Inspection Lots'
@OData.publish: true
define view ZCDS_QM_LOTNEW64
  as select from qals as Lot
    left outer join qave as Decision
      on Decision.prueflos = Lot.prueflos
{
      /* FRS: Inspection lots are sourced from QALS only; no local or mock data is permitted. */
  key Lot.prueflos    as InspectionLot,
      Lot.matnr       as Material,
      Lot.werk        as Plant,
      Lot.losmenge    as LotQuantity,
      /* FRS: Usage decision status is derived from QAVE and drives approved/rejected display. */
      Decision.vcode  as DecisionCode,
      case
        when Decision.prueflos is null
        then cast( 'PENDING' as abap.char(10) )
        when Decision.vbewertung = 'A'
        then cast( 'APPROVED' as abap.char(10) )
        when Decision.vbewertung = 'R'
        then cast( 'REJECTED' as abap.char(10) )
        else cast( 'DECIDED' as abap.char(10) )
      end             as DecisionStatus,
      Decision.vname  as DecidedBy,
      Decision.vdatum as DecisionDate
}
