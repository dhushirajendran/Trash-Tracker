export const SPECIAL_TYPES = ["bulky", "ewaste"]; // extend later if needed

export const RECYCLABLE_CATEGORIES = [
  "plastic",
  "paper",
  "glass",
  "metal",
  "ewaste"
];

export const REQUEST_STATUS = ["pending", "scheduled", "completed", "canceled"];
export const SUBMISSION_STATUS = ["submitted", "processing", "completed", "canceled"];

// simple per-kg payback rates (example)
export const PAYBACK_RATES = {
  plastic: 40,   // LKR/KG
  paper: 20,
  glass: 10,
  metal: 70,
  ewaste: 0      // often handled differently
};
