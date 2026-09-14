# Quality Portal Frontend

This folder contains the SAPUI5 MVC frontend for the production Quality Portal.

The application consumes only real SAP Gateway OData V2 services:

| Module | OData model | SAP service |
|---|---|---|
| Login | `login` | `ZCDS_QM_LOGIN64_CDS` |
| Inspection Lot | `lot` | `ZCDS_QM_LOTNEW64_CDS` |
| Result Records | `result` | `ZCDS_QM_RESULTOR64_CDS` |
| Usage Decision | `decision` | `ZCDS_QM_DECISIONNEW64_CDS` |

No mock server, local JSON business data, hardcoded business rows, or fake APIs are used by the runtime application.

## File-by-File Inventory

| File path | Purpose | FRS mapping |
|---|---|---|
| `webapp/Component.js` | Initializes UI5 component, models, routing, route protection, session restore, and logout clearing. | Session management, route protection, logout |
| `webapp/manifest.json` | Defines real SAP OData V2 data sources and routes. | Approved services only |
| `webapp/model/Session.js` | Stores authenticated session identity in browser session storage with expiry. | Refresh continuity and session expiry |
| `webapp/model/ErrorHandler.js` | Maps SAP Gateway HTTP errors to SAPUI5 MessageBox messages. | 401, 403, 404, 500, 503 handling |
| `webapp/model/formatter.js` | Formats decision and editability states from SAP values. | Approved/rejected display and result lock |
| `webapp/controller/BaseController.js` | Shared routing, busy, and error helper methods. | UI5 MVC consistency |
| `webapp/view/App.view.xml` | Enterprise shell with authenticated logout button. | Logout and shell header |
| `webapp/controller/App.controller.js` | Handles shell navigation and logout. | Clear session and redirect |
| `webapp/view/Login.view.xml` | Login screen with user ID, password, show/hide password, loading state. | Login FRS |
| `webapp/controller/Login.controller.js` | Calls real SAP login OData function import `ValidateLogin`. | Navigate only after valid SAP login |
| `webapp/view/Dashboard.view.xml` | Shows engineer name, plant, welcome message, and three FRS tiles. | Dashboard FRS |
| `webapp/controller/Dashboard.controller.js` | Navigates to module routes. | Dashboard navigation |
| `webapp/view/InspectionLot.view.xml` | Responsive SAPUI5 table bound to inspection lot OData. | Inspection lot display |
| `webapp/controller/InspectionLot.controller.js` | Search, sorting, filtering, refresh. | Table productivity features |
| `webapp/view/ResultRecording.view.xml` | Responsive table for characteristics and quantity inputs. | Result recording |
| `webapp/controller/ResultRecording.controller.js` | Live total calculation and SAP save call. | Day-wise saved result records |
| `webapp/view/UsageDecision.view.xml` | Responsive table with approved/rejected decision selection. | Usage decision |
| `webapp/controller/UsageDecision.controller.js` | Validates quantity match before save and refreshes locked result state. | Required quantity validation |
| `webapp/css/style.css` | SAP theme-token based layout, fade-in, tile hover, elevation transitions. | Enterprise UX and subtle animation |

## Login Flow

1. User enters SAP user ID and password.
2. `Login.controller.js` calls `/ValidateLogin` on `ZCDS_QM_LOGIN64_CDS`.
3. Password verification is expected to occur in the SAP backend.
4. If `LoginSuccess` is not true, the app shows `Invalid User ID or Password`.
5. Navigation to dashboard occurs only after SAP returns a successful login result.
6. Session stores user ID, engineer name, plant, and expiry only.

## Route Protection

`Component.js` protects every route except `login`.

If a user manually enters `#/dashboard` without a valid session, the router redirects to login with replace navigation.

## Logout Flow

Logout clears:

1. Session storage
2. Local storage key used by this app
3. Session model
4. OData model changes and caches
5. Protected route history state

After logout, the router navigates to login with replace navigation so the browser back button cannot reopen the dashboard without a valid session.

## Usage Decision Validation

The frontend validates this formula before calling SAP save:

`LotQuantity = Unrestricted + Blocked + Production`

If the values do not match, the app shows:

`Lot quantity should match inspected quantity`

The SAP backend must enforce the same validation authoritatively before saving.

## UX Notes

The app uses SAP Horizon via `index.html`.

Visual styling uses SAP theme parameters such as `--sapBackgroundColor`, `--sapTile_Background`, `--sapContent_Shadow1`, and `--sapContent_Shadow2`.

Animations are limited to fade-in transitions, tile hover lift, and subtle button transitions.
