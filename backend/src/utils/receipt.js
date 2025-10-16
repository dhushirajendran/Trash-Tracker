export const buildRecyclableReceipt = (submission) => {
  return {
    receiptNo: submission.receiptNo,
    date: new Date().toISOString(),
    items: submission.items.map(i => ({
      category: i.category,
      weightKG: i.weightKG,
    })),
    totalPayback: submission.totalPayback
  };
};
