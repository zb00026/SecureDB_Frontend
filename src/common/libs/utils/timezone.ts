
/**
 * Format a date/time string to the specified timezone
 */
export const formatToTimezone = (dateString: string, timezone: string): string => {
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return dateString; // Return original if invalid date
    }
    
    return date.toLocaleString('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.error('Error formatting date to timezone:', error);
    return dateString; // Return original on error
  }
};

/**
 * Format a date/time string to the specified timezone with custom format
 */
export const formatToTimezoneCustom = (
  dateString: string, 
  timezone: string, 
  options: Intl.DateTimeFormatOptions = {}
): string => {
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return dateString; // Return original if invalid date
    }
    
    return date.toLocaleString('en-US', {
      timeZone: timezone,
      ...options
    });
  } catch (error) {
    console.error('Error formatting date to timezone:', error);
    return dateString; // Return original on error
  }
};

/**
 * Get current time in specified timezone
 */
export const getCurrentTimeInTimezone = (timezone: string): string => {
  try {
    return new Date().toLocaleString('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.error('Error getting current time in timezone:', error);
    return new Date().toISOString();
  }
};

/**
 * Validate if a timezone ID is valid
 */
export const isValidTimezone = (timezone: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (error) {
    // Handle error: log it for debugging, then return false
    console.error('Invalid timezone:', timezone, error);
    return false;
  }
};
