/** Formats a number as a currency string */
export function formatCurrency(amount) {
  return `$${Math.abs(amount).toFixed(2)}`;
}

/** Returns the first letter of a name, uppercased */
export function initial(name = '') {
  return name.charAt(0).toUpperCase();
}

/** Generates inline avatar CSS vars from a color */
export function avatarStyle(color) {
  return `background:${color}22;color:${color}`;
}
