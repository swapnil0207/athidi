export const DELIVERY_FEE = 30;
export const money = value => `₹${value.toLocaleString('en-IN')}`;

export function validateDelivery({ name, address, pincode }, count) {
  if (!name || !address || !/^\d{6}$/.test(pincode)) return 'Please enter your name, complete address, and a valid 6-digit PIN code.';
  if (!['518301', '518302'].includes(pincode)) return 'Sorry, we are currently not serving your area. Please check back as we expand delivery.';
  if (!count) return 'Please select at least one dish before ordering.';
  return '';
}

