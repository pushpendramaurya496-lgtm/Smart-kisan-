/**
 * Business Calculation Engine for Flour Mill & Grinding
 */

// Calculate Total Cost: Weight (kg) × Rate (₹/kg)
export const calculateTotal = (weightKg, ratePerKg) => {
  const weight = parseFloat(weightKg) || 0;
  const rate = parseFloat(ratePerKg) || 0;
  return Math.round(weight * rate);
};

// Calculate customer's outstanding balance
export const calculateBalance = (totalAmount, amountPaid) => {
  const total = parseFloat(totalAmount) || 0;
  const paid = parseFloat(amountPaid) || 0;
  return Math.max(0, total - paid);
};

// Parse spoken voice Hindi sentence: e.g. "रामलाल का 25 किलो गेहूं 4 रुपये से जोड़ दो"
export const parseVoiceInput = (speechText) => {
  if (!speechText) return null;
  const text = speechText.trim();
  
  // Extract weight in kg (digits followed by kilo/kg)
  const weightMatch = text.match(/(\d+)\s*(?:किलो|kg|kilo)/i);
  const weight = weightMatch ? parseInt(weightMatch[1], 10) : 25;

  // Extract rate if spoken (e.g. 4 रुपये)
  const rateMatch = text.match(/(\d+)\s*(?:रुपये|rupaye|rs|₹)/i);
  const rate = rateMatch ? parseInt(rateMatch[1], 10) : 4;

  // Extract crop type
  let item = 'गेहूं';
  if (/सरसों|sarson|tel|तेल/i.test(text)) item = 'सरसों';
  else if (/हल्दी|haldi|मसाला|masala/i.test(text)) item = 'हल्दी';
  else if (/मक्का|makka/i.test(text)) item = 'मक्का';

  // Extract customer name (first word before 'का' or first word)
  let name = 'रामलाल';
  const nameMatch = text.match(/^([^\s]+)\s+का/i);
  if (nameMatch) {
    name = nameMatch[1];
  }

  return {
    customerName: name,
    item,
    weight,
    rate,
    total: weight * rate,
  };
};

