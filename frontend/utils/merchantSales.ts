export function normalizeMerchantSales(data: any) {
  const records = data?.sales;
  if (!Array.isArray(records)) throw new Error('Unable to read merchant sales history');
  return records.map((sale: any) => ({
    ...sale,
    customerName: sale.customerName && !/^unknown$/i.test(sale.customerName.trim()) ? sale.customerName : sale.customerPhone || 'Customer',
    totalSalesValue: sale.totalPrice ?? sale.totalSalesValue ?? 0,
    totalDiscountGiven: sale.intownSavings ?? sale.inTownSavings ?? sale.totalDiscountGiven ?? 0,
    totalAmountReceived: sale.payablePrice ?? sale.inTownPrice ?? sale.totalAmountReceived ?? 0,
  })).sort((a: any, b: any) => (Date.parse(b.transactionDate) || 0) - (Date.parse(a.transactionDate) || 0) || Number(b.transactionId) - Number(a.transactionId));
}
