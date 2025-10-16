import { PAYBACK_RATES } from "./constants.js";

/**
 * Calculate payback in cents (or LKR, your choice) given category and weightKG.
 * Weight can be a decimal; round to 2 decimals on output side if needed.
 */
export const calculatePayback = (category, weightKG) => {
  const rate = PAYBACK_RATES[category] ?? 0;
  const value = rate * (Number(weightKG) || 0);
  return Math.max(0, Math.round(value * 100) / 100); // 2 decimals
};
