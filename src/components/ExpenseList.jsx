import { useEffect, useState } from "react";
import { formatMoney } from "../lib/money.js";
import { dateValue, formatDate } from "../lib/format.js";

function initials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function ExpenseRow({ expense, memberMap, onDelete, onSaveAmount }) {
  const [draft, setDraft] = useState(String(expense.amount));
  const payer = memberMap[expense.paidBy];

  useEffect(() => {
    setDraft(String(expense.amount));
  }, [expense.amount]);

  return (
    <article className="expense">
      <span className="avatar" style={{ background: payer?.color ?? "#888" }}>
        {payer ? initials(payer.name) : "?"}
      </span>
      <div>
        <div className="expense-title">
          {expense.description}
          <span className="cat">{expense.category}</span>
        </div>
        <div className="expense-meta">
          {payer?.name ?? "Unknown"} · {formatDate(expense.date)} · split{" "}
          {expense.splitWith.length} ways
        </div>
        <div className="actions">
          <input
            className="edit-amount"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              const n = Number(draft);
              if (Number.isFinite(n) && n > 0 && n !== Number(expense.amount)) {
                onSaveAmount(n);
              } else {
                setDraft(String(expense.amount));
              }
            }}
            aria-label={`Edit amount for ${expense.description}`}
          />
          <button type="button" className="btn danger" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>
      <div className="amount">{formatMoney(expense.amount)}</div>
    </article>
  );
}

function expenseOrder(e) {
  if (typeof e.id === "string" && e.id.startsWith("e-")) {
    return Number(e.id.slice(2)) || 0;
  }
  if (typeof e.id === "string" && e.id.startsWith("e")) {
    return Number(e.id.slice(1)) || 0;
  }
  return Number(e.id) || 0;
}

export default function ExpenseList({
  expenses,
  members,
  onDeleteExpense,
  onUpdateExpense,
}) {
  const memberMap = Object.fromEntries(members.map((m) => [m.id, m]));
  const sorted = [...expenses].sort((a, b) => {
    const diff = dateValue(b.date) - dateValue(a.date);
    if (diff !== 0) return diff;
    return expenseOrder(b) - expenseOrder(a);
  });



  return (
    <section className="card">
      <h2>Expenses</h2>
      <p className="sort-label">Newest first</p>
      {sorted.length === 0 ? (
        <p className="empty">No expenses match these filters.</p>
      ) : (
        sorted.map((expense) => (
          <ExpenseRow
            key={expense.id}
            expense={expense}
            memberMap={memberMap}
            onDelete={() => onDeleteExpense(expense.id)}
            onSaveAmount={(amount) => onUpdateExpense(expense.id, { amount })}
          />
        ))
      )}
    </section>
  );
}

