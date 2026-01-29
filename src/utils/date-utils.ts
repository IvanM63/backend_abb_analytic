/**
 * Utility functions for date formatting and timezone conversion
 * Handles conversion between Jakarta timezone (UTC+7) and UTC for database queries
 * Also formats dates for export in Jakarta timezone
 */
export const formatDateToJakarta = (date: Date) => {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Jakarta', // GMT+7 (WIB)
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };

  const formatter: Intl.DateTimeFormat = new Intl.DateTimeFormat(
    'en-GB',
    options
  );

  const parts = formatter.formatToParts(date);
  const dateStr = `${parts.find((p) => p.type === 'year')?.value}-${parts.find((p) => p.type === 'month')?.value}-${parts.find((p) => p.type === 'day')?.value}`;
  const timeStr = `${parts.find((p) => p.type === 'hour')?.value}:${parts.find((p) => p.type === 'minute')?.value}:${parts.find((p) => p.type === 'second')?.value}.${date.getMilliseconds().toString().padStart(3, '0')}`;

  return `${dateStr} ${timeStr}`;
};

/**
 * Helper function to convert Jakarta timezone date (UTC+7) to UTC for database query
 * @param dateString - Date string in YYYY-MM-DD format (Jakarta timezone)
 * @returns Date object in UTC for database query
 */
export const convertJakartaDateToUTC = (dateString: string): Date => {
  // Parse as Jakarta date (UTC+7)
  const jakartaDate = new Date(dateString + 'T00:00:00+07:00');
  return jakartaDate;
};

/**
 * Helper function to convert UTC database date to Jakarta timezone for export
 * @param utcDate - UTC date from database
 * @returns Formatted date string in Jakarta timezone
 */
export const convertUTCToJakartaForExport = (utcDate: Date): string => {
  // Convert UTC date to Jakarta timezone using toLocaleString
  return utcDate.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};
