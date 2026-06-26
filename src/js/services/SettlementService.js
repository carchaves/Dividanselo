const EPSILON = 0.005;

/**
 * Computes the net balance for each participant.
 * Positive = they are owed money. Negative = they owe money.
 */
export function computeBalances(participants, expenses) {
  const balances = Object.fromEntries(participants.map(p => [p.id, 0]));

  for (const expense of expenses) {
    if (!expense.participantIds.length) continue;
    const share = expense.amount / expense.participantIds.length;

    balances[expense.payerId] = (balances[expense.payerId] ?? 0) + expense.amount;

    for (const pid of expense.participantIds) {
      balances[pid] = (balances[pid] ?? 0) - share;
    }
  }

  // Round to 2 decimal places to avoid floating-point drift
  for (const id of Object.keys(balances)) {
    balances[id] = Math.round(balances[id] * 100) / 100;
  }

  return balances;
}

/**
 * Calculates the minimum set of transfers needed to settle all debts.
 * Uses a greedy algorithm: always match the largest creditor with the largest debtor.
 * This produces the minimum number of transactions.
 *
 * @returns {Array<{ from: string, to: string, amount: number }>}
 */
export function computeMinTransfers(balances) {
  const b = { ...balances };
  const transfers = [];

  for (let i = 0; i < 1000; i++) {
    const creditors = Object.entries(b)
      .filter(([, v]) => v > EPSILON)
      .sort((a, b) => b[1] - a[1]);

    const debtors = Object.entries(b)
      .filter(([, v]) => v < -EPSILON)
      .sort((a, b) => a[1] - b[1]);

    if (!creditors.length || !debtors.length) break;

    const [cId, cVal] = creditors[0];
    const [dId, dVal] = debtors[0];

    const amount = Math.round(Math.min(cVal, -dVal) * 100) / 100;

    transfers.push({ from: dId, to: cId, amount });

    b[cId] = Math.round((b[cId] - amount) * 100) / 100;
    b[dId] = Math.round((b[dId] + amount) * 100) / 100;
  }

  return transfers;
}
