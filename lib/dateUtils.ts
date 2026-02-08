/**
 * Formats a Date object to YYYY-MM-DD string using LOCAL time.
 * This prevents the "off-by-one-day" error caused by toISOString() which uses UTC.
 * Especially important for users in GMT+7 (Indonesia).
 * 
 * @param date - The date to format (default: new Date())
 * @returns string "YYYY-MM-DD"
 */
export const formatDateToISO = (date: Date = new Date()): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Get current date string in YYYY-MM-DD format (Local Time)
 */
export const getTodayISO = (): string => {
    return formatDateToISO(new Date());
};
