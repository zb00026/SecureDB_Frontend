import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useTimezone } from '@common/hooks/useTimezone';
import { TimezoneInfoDTO } from '@models/Timezone';

interface TimezoneContextType {
  readonly timezones: readonly TimezoneInfoDTO[];
  readonly currentTimezone: string;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly fetchTimezones: () => Promise<void>;
  readonly updateTimezone: (timezone: string) => Promise<boolean>;
  readonly refreshCurrentTimezone: () => Promise<void>;
}

const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined);

interface TimezoneProviderProps {
  readonly children: ReactNode;
}

export const TimezoneProvider: React.FC<TimezoneProviderProps> = ({ children }) => {
  const timezoneData = useTimezone();

  // Memoize the context value to prevent unnecessary re-renders
  // Only depend on primitive values, not functions (functions are stable from useCallback)
  const contextValue = useMemo(() => timezoneData, [
    timezoneData.timezones,
    timezoneData.currentTimezone,
    timezoneData.isLoading,
    timezoneData.error,
    // Functions are stable (useCallback with empty deps), so we don't need to include them
  ]);

  return (
    <TimezoneContext.Provider value={contextValue}>
      {children}
    </TimezoneContext.Provider>
  );
};

export const useTimezoneContext = (): TimezoneContextType => {
  const context = useContext(TimezoneContext);
  if (context === undefined) {
    throw new Error('useTimezoneContext must be used within a TimezoneProvider');
  }
  return context;
};
