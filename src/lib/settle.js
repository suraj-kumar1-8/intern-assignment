export function suggestSettlements(balances, members) {
  const nameOf = (id) => members.find((m) => m.id === id)?.name ?? `#${id}`;

  const debtors = [];
  const creditors = [];

  for (const [id, raw] of Object.entries(balances)) {
    const amount = Number(raw);
    const memberId = Number(id);
    const cents = Math.round(amount * 100);
    if (cents < 0) debtors.push({ id: memberId, cents: -cents });
    else if (cents > 0) creditors.push({ id: memberId, cents });
  }

  debtors.sort((a, b) => b.cents - a.cents);
  creditors.sort((a, b) => b.cents - a.cents);

  const transfers = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i];
    const c = creditors[j];
    const settleCents = Math.min(d.cents, c.cents);

    if (settleCents > 0) {
      transfers.push({
        from: d.id,
        to: c.id,
        fromName: nameOf(d.id),
        toName: nameOf(c.id),
        amount: Number((settleCents / 100).toFixed(2)),
      });
      d.cents -= settleCents;
      c.cents -= settleCents;
    }

    if (d.cents === 0) i += 1;
    if (c.cents === 0) j += 1;
  }

  return transfers;
}

