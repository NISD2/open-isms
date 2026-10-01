/**
 * The size limits of § 28 Abs. 1 Nr. 4 and Abs. 2 Nr. 3 BSIG, which follow the Annex to
 * Recommendation 2003/361/EC: at least this many employees, or turnover AND balance sheet total
 * each above these amounts (million euros). One copy, read by the classifier and by the
 * Durchgang's thresholds screen. Its own file so a client component can import it without the
 * classifier's database enums.
 */
export const SIZE_THRESHOLDS = {
  large: { employees: 250, turnover: 50, balanceSheet: 43 },
  medium: { employees: 50, turnover: 10, balanceSheet: 10 },
} as const;
