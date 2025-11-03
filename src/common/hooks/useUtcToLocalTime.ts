import moment from 'moment';
import { useTimezoneContext } from '@common/contexts/TimezoneContext';

// Legacy hook - kept for backward compatibility
export default (date: any, fmt: any = 'YYYY/MM/DD HH:mm:ss'):any => {
  const flagDate = date.substr(0, 10) + 'T' + date.substr(11, 8) + 'Z';
  //   const fmt = 'YYYY/MM/DD HH:mm:00';
  return moment.utc(flagDate).local().format(fmt);
};

// New hook that uses timezone context
export const useUtcToLocalTimeWithTimezone = () => {
  const { currentTimezone } = useTimezoneContext();
  
  /**
   * Parse a date value into a Date object
   */
  const parseDate = (date: any): Date => {
    if (typeof date === 'string') {
      // Handle different date formats
      if (date.includes('T') && date.includes('Z')) {
        // ISO format with Z
        return new Date(date);
      }
      if (date.includes('T')) {
        // ISO format without Z
        return new Date(date + 'Z');
      }
      // Try to parse as is
      return new Date(date);
    }
    return new Date(date);
  };

  /**
   * Convert format string to Intl options
   */
  const parseFormatToOptions = (fmt: string): Intl.DateTimeFormatOptions => {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: currentTimezone,
    };
    
    if (fmt.includes('YYYY')) options.year = 'numeric';
    if (fmt.includes('MM')) options.month = '2-digit';
    if (fmt.includes('DD')) options.day = '2-digit';
    if (fmt.includes('HH')) options.hour = '2-digit';
    if (fmt.includes('mm')) options.minute = '2-digit';
    if (fmt.includes('ss')) options.second = '2-digit';
    if (fmt.includes('hh')) {
      options.hour = '2-digit';
      options.hour12 = true;
    }
    
    return options;
  };

  /**
   * Fallback to moment for date formatting
   */
  const formatWithMoment = (date: any, fmt: any): string => {
    const flagDate = date.substr(0, 10) + 'T' + date.substr(11, 8) + 'Z';
    return moment.utc(flagDate).local().format(fmt);
  };
  
  return (date: any, fmt: any = 'YYYY/MM/DD HH:mm:ss'): any => {
    if (!date) return '';
    
    try {
      const dateObj = parseDate(date);
      
      if (Number.isNaN(dateObj.getTime())) {
        // Fallback to moment for complex parsing
        return formatWithMoment(date, fmt);
      }
      
      const options = parseFormatToOptions(fmt);
      return dateObj.toLocaleString('en-US', options);
    } catch (error) {
      console.error('Error formatting date with timezone:', error);
      // Fallback to moment
      return formatWithMoment(date, fmt);
    }
  };
};

