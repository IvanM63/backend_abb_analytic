/**
 * Timezone utility for converting dates to Jakarta timezone (GMT+7)
 * Since the database stores dates in GMT+0, we need to convert local dates
 * by subtracting 7 hours to match the database timezone
 */

/**
 * Converts a date to Jakarta timezone for database queries
 * @param date - The date to convert
 * @returns Date object adjusted for Jakarta timezone (GMT+7 to GMT+0)
 */
export const convertToJakartaTimezone = (date: Date): Date => {
  const jakartaDate = new Date(date);
  // Convert to Jakarta timezone by subtracting 7 hours (since DB stores in GMT+0)
  jakartaDate.setHours(jakartaDate.getHours() - 7);
  return jakartaDate;
};

/**
 * Converts start and end dates to Jakarta timezone for date range queries
 * @param startDate - The start date string
 * @param endDate - The end date string
 * @returns Object with converted start and end dates
 */
export const convertDateRangeToJakartaTimezone = (
  startDate: string,
  endDate: string
) => {
  const startDateObj = convertToJakartaTimezone(new Date(startDate));
  const endDateObj = convertToJakartaTimezone(new Date(endDate));

  // Set end date to end of day in Jakarta timezone
  endDateObj.setHours(23 - 7, 59, 59, 999);

  return {
    startDate: startDateObj,
    endDate: endDateObj,
  };
};

/**
 * Generates date range array with proper timezone conversion
 * @param startDate - The start date
 * @param endDate - The end date
 * @returns Array of date strings in DD/MM/YYYY format
 */
export const generateDateRange = (startDate: Date, endDate: Date): string[] => {
  const dates: string[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(
      currentDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    );
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
};

/**
 * Converts a date string from DD/MM/YYYY to Date object with Jakarta timezone
 * @param dateStr - Date string in DD/MM/YYYY format
 * @returns Date object adjusted for Jakarta timezone
 */
export const convertDateStringToJakartaTimezone = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('/');
  const queryDate = new Date(`${year}-${month}-${day}`);

  // Convert to Jakarta timezone (GMT+7) by subtracting 7 hours
  return convertToJakartaTimezone(queryDate);
};
