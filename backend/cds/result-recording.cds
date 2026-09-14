@AbapCatalog.sqlViewName: 'ZVQMRESULT64'
@AbapCatalog.compiler.compareFilter: true
@AccessControl.authorizationCheck: #CHECK
@EndUserText.label: 'Quality Portal Result Recording'
@OData.publish: true
define view ZCDS_QM_RESULTOR64
  as select from qamr as Characteristic
    inner join qals as Lot
      on Lot.prueflos = Characteristic.prueflos
    left outer join qave as Decision
      on Decision.prueflos = Characteristic.prueflos
    left outer join zqm_result64 as SavedResult
      on SavedResult.prueflos = Characteristic.prueflos
{
      /* FRS: Characteristics come from QAMR and saved quantities come from ZQM_RESULT64. */
  key Characteristic.prueflos       as InspectionLot,
  key Characteristic.merknr         as Characteristic,
  key SavedResult.entry_date        as EntryDate,
      Lot.matnr                     as Material,
      Lot.werk                      as Plant,
      Lot.losmenge                  as LotQuantity,
      Characteristic.mittelwert     as ExistingValue,
      SavedResult.unrestricted_qty  as UnrestrictedQty,
      SavedResult.blocked_qty       as BlockedQty,
      SavedResult.production_qty    as ProductionQty,
      SavedResult.inspected_by      as InspectedBy,
      SavedResult.status            as Status,
      /* FRS: Once QAVE has a decision, result recording must be read-only permanently. */
      case
        when Decision.prueflos is not null or SavedResult.status = 'LOCKED'
        then cast( 'X' as abap.char(1) )
        else cast( '' as abap.char(1) )
      end                           as ReadOnly
}
