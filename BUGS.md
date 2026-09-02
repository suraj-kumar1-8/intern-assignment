

BUG-1 — Expenses were sorted in the wrong order
Reproduce: Open the app. The list says "Newest first," but the oldest expense (Wine, 7 Mar) was showing at the top and the newest (Board game, 15 Mar) was near the bottom.
Problem: The list was sorted oldest-to-newest instead of newest-to-oldest. On top of that, the function converting dates into numbers wasn't working correctly (it produced NaN).
Fix: Fixed the date-to-number conversion, and flipped the sort order so the newest expense shows first.

BUG-2 — Payer's balance was wrongly reduced when they weren't part of the split
Reproduce: Someone pays for a bill but isn't part of the split themselves (e.g., Diya pays $60 for an Uber, but only Aisha and Ben rode it).
Problem: Diya should get the full $60 back, but the code was incorrectly subtracting an extra amount from her balance — as if she'd also consumed a share, even though she wasn't part of the ride. This meant the whole group's balances didn't add up to zero.
Fix: Removed the incorrect subtraction. Now the payer gets full credit when they're not part of the split.

BUG-3 — Settle Up showed nothing when two amounts matched exactly
Reproduce: One person owes exactly $50, and another person is owed exactly $50.
Problem: The app said "Everyone is settled," when it should have suggested a transfer ("Alice pays Bob $50").
Fix: Fixed the settlement logic so it correctly generates a transfer even when the debt and credit amounts are exactly equal.

BUG-4 — "Owes" and "Is owed" labels were swapped
Reproduce: Look at the balances panel — people who are owed money vs. people who owe money.
Problem: The labels and colors were reversed — people who should receive money were shown as "owes" (in red), and people who owed money were shown as "is owed" (in green). Completely backwards.
Fix: Corrected the condition so people with a positive balance now correctly show "is owed" (green), and people with a negative balance show "owes" (red).

BUG-5 — Deleting/editing while filtered or sorted affected the wrong expense
Reproduce: Apply a filter (e.g., Category = Travel), then delete or edit the first item shown.
Problem: The wrong expense would get deleted or edited — not the one actually visible on screen. This happened because the app was using the item's position in the (filtered/sorted) list instead of its actual identity, and that position doesn't match the real underlying data once you filter or sort.
Fix: Now every expense is deleted/edited using its unique ID instead of its list position, so the correct expense is always targeted regardless of filtering or sorting.

BUG-6 — The "Paid by" filter hid all expenses
Reproduce: In the filter panel, select a member under "Paid by" (e.g., Aisha Khan).
Problem: It showed "No expenses match," even though Aisha had expenses.
Cause: One side of the comparison was a number and the other was a string (text), so they never matched.
Fix: Converted both sides to the same type (string) before comparing.

BUG-7 — Splitting an amount lost or created a few cents (rounding issue)
Reproduce: Split $100 equally among 3 people, or among 6 people, or use a custom percentage split.
Problem: $100 ÷ 3 = $33.33 each, totaling $99.99 — one cent went missing. $100 ÷ 6 created 2 extra cents instead. Percentage splits also didn't add back up to the original total.
Fix: Updated the split logic to distribute any leftover cents among the participants, so the shares always add up to exactly the original amount.

BUG-8 — Newly added members didn't show up in "Paid so far" right away
Reproduce: Add a new member in the Summary panel.
Problem: The new member wouldn't appear in "Paid so far" until an expense was created or edited.
Cause: The code was only set to refresh that section when expenses changed, not when members changed.
Fix: Now it also refreshes when members change, so new members show up immediately.

BUG-9 — The "Add expense" form didn't clear after saving
Reproduce: Fill in description and amount, click "Save expense."
Problem: The expense saved correctly, but the form kept the old values in it — you'd have to manually clear them before entering the next one.
Fix: The description, amount, and error fields are now cleared automatically after a successful save.

BUG-10 — Dates lost their formatting after a page reload
Reproduce: Look at expense dates (e.g., "12 Mar 2026"), then refresh the page.
Problem: After reloading, dates reverted to the raw stored format (e.g., "2026-03-12") instead of staying nicely formatted.
Cause: When data was loaded back from localStorage, the step that converts dates into a proper format was being skipped.
Fix: Dates are now properly parsed and formatted when the data is loaded back in.