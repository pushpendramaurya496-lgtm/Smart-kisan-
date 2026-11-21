// Formats numbers into Indian Rupee format: e.g. 2850 -> ₹ 2,850
export const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return '₹ ' + num.toLocaleString('en-IN');
};

