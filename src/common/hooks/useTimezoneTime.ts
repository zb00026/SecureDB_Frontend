import { useTimezoneContext } from '@common/contexts/TimezoneContext';
import { formatToTimezone, formatToTimezoneCustom } from '@common/libs/utils/timezone';

/**
 * Hook for formatting dates using the system timezone
 */
export const useTimezoneTime = () => {
  const { currentTimezone } = useTimezoneContext();

  /**
   * Parse format string and convert to Intl options
   */
  const parseFormatToOptions = (format: string): Intl.DateTimeFormatOptions => {
    const options: Intl.DateTimeFormatOptions = {};
    
    if (format.includes('YYYY')) options.year = 'numeric';
    if (format.includes('MM')) options.month = '2-digit';
    if (format.includes('DD')) options.day = '2-digit';
    if (format.includes('HH')) options.hour = '2-digit';
    if (format.includes('mm')) options.minute = '2-digit';
    if (format.includes('ss')) options.second = '2-digit';
    if (format.includes('hh')) {
      options.hour = '2-digit';
      options.hour12 = true;
    }
    
    return options;
  };

  /**
   * Format a date/time string to the current system timezone
   */
  const formatTime = (dateString: string, format?: string): string => {
    if (!dateString) return '';
    
    if (format) {
      const options = parseFormatToOptions(format);
      return formatToTimezoneCustom(dateString, currentTimezone, options);
    }
    
    return formatToTimezone(dateString, currentTimezone);
  };

  /**
   * Format a date/time string with a custom format
   */
  const formatTimeCustom = (dateString: string, options: Intl.DateTimeFormatOptions): string => {
    if (!dateString) return '';
    return formatToTimezoneCustom(dateString, currentTimezone, options);
  };

  /**
   * Get current time in the system timezone
   */
  const getCurrentTime = (): string => {
    return new Date().toLocaleString('en-US', {
      timeZone: currentTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return {
    formatTime,
    formatTimeCustom,
    getCurrentTime,
    currentTimezone,
  };
};
