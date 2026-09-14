@AbapCatalog.sqlViewName: 'ZVQMUD64'
@AbapCatalog.compiler.compareFilter: true
@AccessControl.authorizationCheck: #CHECK
@EndUserText.label: 'Quality Portal Usage Decision'
@OData.publish: true
define view ZCDS_QM_DECISIONNEW64
  as select from qals as Lot
    left outer join qave as Decision
      on Decision.prueflos = Lot.prueflos
    left outer join zqm_result64 as Result
      on Result.prueflos = Lot.prueflos
{
      /* FRS: Usage decision validation compares QALS lot quantity with persisted inspected quantities. */
  key Lot.prueflos           as InspectionLot,
      Lot.matnr              as Material,
      Lot.werk               as Plant,
      Lot.losmenge           as LotQuantity,
      Result.entry_date      as EntryDate,
      Result.unrestricted_qty as UnrestrictedQty,
      Result.blocked_qty     as BlockedQty,
      Result.production_qty  as ProductionQty,
      Decision.vcode         as DecisionCode,
      Decision.vbewertung    as DecisionValuation,
      Decision.vname         as DecidedBy,
      Decision.vdatum        as DecisionDate,
      /* FRS: Existing QAVE rows prevent duplicate usage decisions and lock result editing. */
      case
        when Decision.prueflos is null
        then cast( '' as abap.char(1) )
        else cast( 'X' as abap.char(1) )
      end                    as DecisionExists
}
