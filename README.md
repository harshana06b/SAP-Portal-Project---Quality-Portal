# SAP-Portal-Project---Quality-Portal
The Quality Portal enables Quality Engineers to manage inspection lots, record inspection results, and make usage decisions. It provides access to quality-related supply and goods transactions and supports material inspection for the respective lots within the plant.

# 🧪 Quality Portal

> **A SAP-based Quality Management Portal for managing Inspection Lots, recording inspection results, and making Usage Decisions through SAP UI5, CDS Views, OData, and SAP BTP.**

## 📌 Overview

The **Quality Portal** is a web-based application developed to understand and implement the workflow of the **SAP Quality Management (QM) module**.

The portal enables **Quality Engineers** to manage inspection lots, record inspection results, and make usage decisions for materials within a plant. It also provides visibility into the complete transaction of supplies and goods associated with the inspection process.

## 🎯 Key Features

- 🔐 **Quality Engineer Login**
  - Login using Quality Engineer User ID and Password.
  - Validate the User ID against standard SAP data.
  - Verify credentials using a custom Z-table.
  - Provide access to the respective Quality Engineer profile after successful authentication.

- 🔍 **Inspection Lot Management**
  - Display inspection lots on the Quality Engineer dashboard.
  - View inspection lot and material information.
  - Display the Usage Decision status for each lot as **Approved** or **Rejected**.

- 📋 **Result Recording**
  - Record inspection results for inspection lots.
  - Categorize inspected quantities into:
    - **Unrestricted Stock** – Can be delivered to the customer.
    - **Block Stock** – Defective or scrap material.
    - **Production Stock** – Material requiring rework before delivery.
  - Save inspection results progressively.
  - Display previously saved results when revisiting an inspection lot.
  - Allow viewing of results after a Usage Decision has been completed.

- ✅ **Usage Decision**
  - Make a Usage Decision as **Approved** or **Rejected**.
  - Validate that the total lot quantity matches the inspected quantity.
  - Prevent the Usage Decision when quantities do not match.
  - Allow the decision only after the complete lot has been inspected.
  - Prevent changes to result recording after the Usage Decision is completed.

## 🔄 Quality Management Workflow

```text
Quality Engineer Login
        ↓
Inspection Lot
        ↓
Result Recording
        ↓
Unrestricted / Block / Production Stock
        ↓
Quantity Validation
        ↓
Usage Decision
        ↓
Approved / Rejected


## 🛠️ Technology Stack

| Technology | Purpose |
|------------|---------|
| **SAP UI5** | Frontend application development |
| **SAP BTP – Business Application Studio (BAS)** | Application development platform |
| **CDS Views** | Data modeling and backend data exposure |
| **OData / CDS Services** | Communication between UI5 application and SAP backend |
| **SAP ABAP / ABAP on HANA** | Backend implementation and business logic |
| **SAP S/4HANA / SAP HANA** | Backend system and database |
