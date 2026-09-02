# Bugs found

All identified and confirmed bugs, root causes, fixes, and verifications are documented below.

---

## BUG-001 — Expense Sorting Order (Oldest First vs Newest First)

- **Severity:** Medium
- **Area:** UI / Expense
- **Steps to Reproduce:**
  1. Open the application.
  2. Look at the expenses list which displays the subheader "Newest first".
  3. Observe that "Wine (7 Mar)" appears at the top, while "Board game (15 Mar)" is at the bottom.
- **Expected Behavior:** Most recent expenses (newest dates) should appear at the top of the list.
- **Actual Behavior:** The list was sorted in ascending order (oldest first). Additionally, date strings produced `NaN` during subtraction.
- **Root Cause:** In `src/components/ExpenseList.jsx`, the sort comparator was `(a, b) => dateValue(a.date) - dateValue(b.date)` (ascending) and `dateValue` in `src/lib/format.js` returned the unparsed date directly.
- **Fix:** Updated `dateValue` in `src/lib/format.js` to return numeric timestamps (`new Date(date).getTime()`), and updated `ExpenseList.jsx` to sort descending: `dateValue(b.date) - dateValue(a.date)`.
- **Verification:** Verified that expenses are sorted descending with the newest dates at the top.

---

## BUG-002 — Payer Excluded from Split Deducts From Payer's Balance

- **Severity:** Critical
- **Area:** Balance / Expense
- **Steps to Reproduce:**
  1. Have an expense where the payer is not part of the split (e.g., in seed data, Diya pays $60 Uber for Aisha and Ben; or add an expense where Person A pays $100 for Person B and C).
  2. Inspect the group balances.
- **Expected Behavior:** The payer receives full credit for the amount paid ($60 / $100). The participants owe their respective shares ($30 / $50 each). The sum of all group balances must equal 0.
- **Actual Behavior:** The payer was penalized by having `amount / splitWith.length` deducted from their balance, leaving them with only partial credit. The sum of group balances did not cancel out to 0 (e.g., -$30.00 on seed data).
- **Root Cause:** In `src/lib/balances.js`, lines 16–19 contained an erroneous block: `if (!(exp.paidBy in shares)...) bal[exp.paidBy] -= Number(exp.amount) / n;`.
- **Fix:** Removed the invalid deduction block from `computeBalances` so a payer who is not in the split is credited the full payment amount without being forced to consume a share.
- **Verification:** Tested seed data and standalone test cases; verified `bal[payer] === amountPaid` and `SUM(all balances) === 0`.

---

## BUG-003 — Settle Up Algorithm Omits Transfers for Equal Debt/Credit Amounts

- **Severity:** Critical
- **Area:** Settlement
- **Steps to Reproduce:**
  1. Create a balance state where a debtor owes an amount equal to what a creditor is owed (e.g., Alice owes $50.00 and Bob is owed $50.00).
  2. View the "Settle up" panel.
- **Expected Behavior:** The panel displays a settlement transfer (e.g., "Alice pays Bob $50.00").
- **Actual Behavior:** The panel showed "Everyone is settled." and produced zero transfers, leaving debts unsettled.
- **Root Cause:** In `src/lib/settle.js`, when `d.amount === c.amount`, the `else` branch incremented pointers `i += 1; j += 1;` without adding any transfer to the `transfers` array.
- **Fix:** Replaced branch comparisons with `settleCents = Math.min(d.cents, c.cents)`, recording the transfer for all matching amounts and advancing indices as debts/credits reach zero.
- **Verification:** Tested equal balances, seed balances, and complex multi-debtor/creditor states. Verified that applying all suggested transfers results in $0.00 net balance for all members.

---

## BUG-004 — Inverted Balance Labels and Color Styling

- **Severity:** High
- **Area:** Balance / UI
- **Steps to Reproduce:**
  1. View the Balances panel for members with positive balances (creditors) and negative balances (debtors).
  2. Observe the label and color for each person (e.g., Ben with +$59.00 and Aisha with -$85.01).
- **Expected Behavior:** Members with positive balance (paid more than consumed) show `is owed $X.XX` with green styling (`owed`). Members with negative balance (consumed more than paid) show `owes $X.XX` with red styling (`owe`).
- **Actual Behavior:** The UI displayed `owes $59.00` in red for Ben (who is owed money) and `is owed $85.01` in green for Aisha (who owes money).
- **Root Cause:** In `src/components/BalancesPanel.jsx`, the conditions and CSS classes were inverted (`bal > 0.005` assigned `owes`/`owe` and `bal < -0.005` assigned `is owed`/`owed`).
- **Fix:** Corrected `BalancesPanel.jsx` so `bal > 0.005` yields `is owed ${formatMoney(bal)}` with class `owed`, and `bal < -0.005` yields `owes ${formatMoney(-bal)}` with class `owe`.
- **Verification:** Verified that creditors display `is owed` in green and debtors display `owes` in red.

---

## BUG-005 — Deleting and Editing Wrong Expense Due to Array Index Mismatch

- **Severity:** Critical
- **Area:** Deleting / Editing
- **Steps to Reproduce:**
  1. Apply a filter (e.g. Category = "Travel") or view the sorted expenses list.
  2. Click "Delete" or edit the amount on the first item in the list.
- **Expected Behavior:** The targeted expense is deleted or updated.
- **Actual Behavior:** A different expense in `state.expenses` was deleted or edited. Additionally, `ExpenseRow` reused stale amount drafts because `key={index}` was used instead of `key={expense.id}`.
- **Root Cause:** `ExpenseList.jsx` passed the index from the sorted/filtered array to `onDeleteAt` and `onUpdateAt`, which spliced or indexed `state.expenses` by that local index.
- **Fix:** Changed `DELETE_EXPENSE` and `UPDATE_EXPENSE` actions to operate by unique `id` (`expense.id`). Updated `ExpenseList.jsx` to use `key={expense.id}` and added a `useEffect` in `ExpenseRow` to sync amount draft with props.
- **Verification:** Verified that deleting or editing an expense while sorted or filtered modifies only the targeted expense.

---

## BUG-006 — "Paid by" Filter Hides All Expenses Due to Type Mismatch

- **Severity:** High
- **Area:** Filters
- **Steps to Reproduce:**
  1. Open the Filter panel.
  2. Select any member in the "Paid by" dropdown (e.g., "Aisha Khan").
- **Expected Behavior:** Shows only expenses paid by Aisha Khan.
- **Actual Behavior:** Shows "No expenses match these filters." (0 expenses shown).
- **Root Cause:** In `src/App.jsx`, `e.paidBy !== paidBy` compared a Number (`e.paidBy`) to a String (`paidBy` from `<select>`), which always evaluated to true under strict inequality.
- **Fix:** Updated the filter condition in `src/App.jsx` to `String(e.paidBy) !== String(paidBy)`.
- **Verification:** Verified that selecting each member in the "Paid by" dropdown correctly filters to expenses paid by that member.

---

## BUG-007 — Equal Split and Custom Percentage Rounding Invariant Violations

- **Severity:** High
- **Area:** Equal Split / Uneven Split
- **Steps to Reproduce:**
  1. Create an equal split expense with an amount not evenly divisible by participant count (e.g. $100 split 3 ways, $100 split 6 ways, $10 split 3 ways).
  2. Create a custom percentage split (e.g. $20 with 33.33%, 33.33%, 33.34%).
- **Expected Behavior:** `SUM(all participant shares) === original expense amount`. No money is lost or created in rounding.
- **Actual Behavior:** $100 split 3 ways resulted in $33.33 each ($99.99 total, losing $0.01). $100 split 6 ways resulted in $16.67 each ($100.02 total, creating $0.02). $20 custom percentage split resulted in $20.01.
- **Root Cause:** `splitEqual` in `src/lib/money.js` used naive floating point division without distributing remainder cents. `splitByPercent` did not adjust residual cents.
- **Fix:** Updated `splitEqual` to calculate total cents, base cents, and distribute remainder cents across participants. Updated `splitByPercent` to ensure total allocated cents match total expense cents.
- **Verification:** Ran test cases for $100/3, $100/6, $10/3, $1/3, and custom percentages; verified `SUM(shares) === amount` in all cases.

---

## BUG-008 — Summary Cards "Paid So Far" Does Not Update on Adding Members

- **Severity:** Medium
- **Area:** UI / Member Management
- **Steps to Reproduce:**
  1. In the Summary panel, enter a new name under "Add member" and click "Add".
  2. Look at the "Paid so far" list.
- **Expected Behavior:** The new member appears in "Paid so far" with $0.00 paid.
- **Actual Behavior:** The new member did not appear in "Paid so far" until an expense was created or modified.
- **Root Cause:** In `src/components/SummaryCards.jsx`, `perPerson` useMemo dependency array was `[expenses]`, omitting `members`.
- **Fix:** Updated `perPerson` dependency array to `[members, expenses]`.
- **Verification:** Verified that adding a new member immediately updates the "Paid so far" section.

---

## BUG-009 — Add Expense Form Inputs Not Reset on Submit

- **Severity:** Low
- **Area:** Expense / UI
- **Steps to Reproduce:**
  1. Fill in Description and Amount in the "Add expense" form.
  2. Click "Save expense".
- **Expected Behavior:** Description and Amount inputs are cleared so the user can easily enter the next expense.
- **Actual Behavior:** Inputs remained filled with previous values.
- **Root Cause:** In `src/components/AddExpenseForm.jsx`, `submit` did not reset `description` or `amount` state.
- **Fix:** Added `setDescription("")`, `setAmount("")`, and `setError("")` on successful form submission.
- **Verification:** Verified inputs clear after adding an expense.

---

## BUG-010 — Date Format Inconsistency on Page Reload / Hydration

- **Severity:** Medium
- **Area:** Persistence / UI
- **Steps to Reproduce:**
  1. Open the app and view expense dates (formatted as e.g. "12 Mar 2026").
  2. Refresh the browser page.
- **Expected Behavior:** Expense dates remain formatted as "12 Mar 2026".
- **Actual Behavior:** After reload from `localStorage`, dates reverted to raw date strings like "2026-03-12".
- **Root Cause:** `loadState` in `src/state/store.js` returned unhydrated raw JSON from `localStorage`, leaving `e.date` as a plain string, and `formatDate` in `src/lib/format.js` only formatted `Date` instances.
- **Fix:** Updated `loadState` in `src/state/store.js` to call `hydrate(JSON.parse(raw))` and updated `formatDate` in `src/lib/format.js` to parse date strings and format them consistently.
- **Verification:** Verified dates format consistently before and after page reload.
