ViaSetu is GST-registered in Maharashtra (Pune), so the place-of-supply constant in the Accounts Excel export must change from "Karnataka" to "Maharashtra". Only one file is affected.

Changes:
1. `src/lib/accounts-export.ts` — update `PLACE_OF_SUPPLY_STATE` from "Karnataka" to "Maharashtra". This single constant drives the CGST/SGST vs IGST split across all 5 sheets (Orders, Monthly Summary, Partner Summary, GST Summary, Meta). No other logic needs changing.

Verification: re-run the `rg` search to confirm no other hardcoded "Karnataka" remains in tax/GST logic.