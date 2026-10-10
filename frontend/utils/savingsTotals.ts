export type SavingsPeriodTotals = {
  today: number;
  thisMonth: number;
  thisYear: number;
};

type SavingsTransaction = {
  status?: string | null;
  transactionStatus?: string | null;
  paymentStatus?: string | null;
  transaction_status?: string | null;
  payment_status?: string | null;
  transactionDate?: string | null;
  totalPrice?: number | string | null;
  inTownPrice?: number | string | null;
  intownPrice?: number | string | null;
  payablePrice?: number | string | null;
  intownSavings?: number | string | null;
  inTownSavings?: number | string | null;
};

export const isSavedTransaction = (transaction: SavingsTransaction): boolean => {
  const status =
    transaction.status ??
    transaction.transactionStatus ??
    transaction.paymentStatus ??
    transaction.transaction_status ??
    transaction.payment_status;
  if (status != null && status.trim()) {
    return status.trim().toUpperCase() === 'SAVED';
  }

  const recordedSavings = Number(transaction.inTownSavings ?? transaction.intownSavings ?? 0);
  return Number.isFinite(recordedSavings) && recordedSavings > 0;
};

export const getTransactionSavings = (transaction: SavingsTransaction): number => {
  if (!isSavedTransaction(transaction)) return 0;

  const recordedSavings = transaction.inTownSavings ?? transaction.intownSavings;
  if (recordedSavings != null) {
    const savings = Number(recordedSavings);
    if (Number.isFinite(savings)) return Math.max(savings, 0);
  }

  const amountPaid = transaction.payablePrice ?? transaction.inTownPrice ?? transaction.intownPrice;
  const totalPrice = transaction.totalPrice == null ? NaN : Number(transaction.totalPrice);
  const paidAmount = amountPaid == null ? NaN : Number(amountPaid);
  return Number.isFinite(totalPrice) && Number.isFinite(paidAmount)
    ? Math.max(totalPrice - paidAmount, 0)
    : 0;
};

export const getSavingsPeriodTotals = (
  transactions: readonly SavingsTransaction[],
  currentDate = new Date(),
): SavingsPeriodTotals => {
  const totals: SavingsPeriodTotals = { today: 0, thisMonth: 0, thisYear: 0 };

  transactions.forEach((transaction) => {
    if (!isSavedTransaction(transaction)) return;

    const transactionDate = transaction.transactionDate
      ? new Date(transaction.transactionDate)
      : null;
    const savings = getTransactionSavings(transaction);
    if (!transactionDate || Number.isNaN(transactionDate.getTime()) || !Number.isFinite(savings)) {
      return;
    }

    if (transactionDate.getFullYear() === currentDate.getFullYear()) {
      totals.thisYear += savings;
      if (transactionDate.getMonth() === currentDate.getMonth()) {
        totals.thisMonth += savings;
        if (transactionDate.getDate() === currentDate.getDate()) {
          totals.today += savings;
        }
      }
    }
  });

  return totals;
};

export const formatSavingsCurrency = (amount: number): string => `₹${amount.toFixed(2)}`;
