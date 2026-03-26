export type Currency = "INR" | "USD";

// Fixed exchange rate: 1 USD = 84 INR
export const USD_TO_INR = 84;

/**
 * Amounts are stored in USD internally.
 * formatCurrency converts and formats for display.
 */
export function formatCurrency(amountUSD: number, currency: Currency): string {
  if (currency === "INR") {
    const inr = amountUSD * USD_TO_INR;
    return `₹${inr.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  }
  return `$${amountUSD.toFixed(2)}`;
}

/**
 * Converts a user-entered amount to USD for storage.
 * If currency is INR, divide by 84. If USD, pass through.
 */
export function toUSD(amount: number, currency: Currency): number {
  return currency === "INR" ? amount / USD_TO_INR : amount;
}

export function currencySymbol(currency: Currency): string {
  return currency === "INR" ? "₹" : "$";
}
