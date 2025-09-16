import { useState } from 'react';
import { request } from '@common/libs/request';
import { TerminalSessionRecording } from '@models/TerminalSessionRecording';
import { TerminalCommandAudit } from '@models/TerminalCommandAudit';
import { useListPage } from './useListPage';

export interface TerminalAuditFilters {
  page: number;
  size: number;
  startDate?: string;
  endDate?: string;
  riskLevel?: string;
  commandType?: string;
  isDangerous?: boolean;
  searchQuery?: string;
  sessionId?: string;
}

export interface TerminalAuditStatistics {
  activeSessions: number;
  sessionsToday: number;
  dangerousCommandsToday: number;
  commandsToday: number;
  commandTypeStats: Record<string, number>;
  riskLevelStats: Record<string, number>;
}

export const useTerminalAudit = () => {
  const [viewMode, setViewMode] = useState<'sessions' | 'commands'>('sessions');
  const [filters, setFilters] = useState<TerminalAuditFilters>({
    page: 0,
    size: 20
  });
  const [statistics, setStatistics] = useState<TerminalAuditStatistics | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Use useListPage for sessions
  const {
    getData: sessionsData,
    getList: getSessionsList,
    pagination: sessionsPagination
  } = useListPage<TerminalSessionRecording>({
    baseUri: '/api/audit-trails/terminal/sessions'
  });

  // Use useListPage for commands
  const {
    getData: commandsData,
    getList: getCommandsList,
    pagination: commandsPagination
  } = useListPage<TerminalCommandAudit>({
    baseUri: '/api/audit-trails/terminal/commands'
  });

  // Fetch sessions with current filters
  const fetchSessions = async (newFilters?: Partial<TerminalAuditFilters>) => {
    const currentFilters = newFilters ? { ...filters, ...newFilters } : filters;
    setFilters(currentFilters);
    
    const params: any = {
      page: 1,
      perPage: currentFilters.size || 20
    };
    
    // Add filter parameters that match backend TerminalSessionRecordingFilter
    if (currentFilters.startDate) params.startDate = currentFilters.startDate;
    if (currentFilters.endDate) params.endDate = currentFilters.endDate;
    if (currentFilters.sessionId) params.sessionId = currentFilters.sessionId;
    
    await getSessionsList(params);
  };

  // Fetch commands with current filters
  const fetchCommands = async (newFilters?: Partial<TerminalAuditFilters>) => {
    const currentFilters = newFilters ? { ...filters, ...newFilters } : filters;
    setFilters(currentFilters);
    
    const params: any = {
      page: 1,
      perPage: currentFilters.size || 20
    };
    
    // Add filter parameters that match backend TerminalCommandAuditFilter
    if (currentFilters.startDate) params.startDate = currentFilters.startDate;
    if (currentFilters.endDate) params.endDate = currentFilters.endDate;
    if (currentFilters.riskLevel) params.riskLevel = currentFilters.riskLevel;
    if (currentFilters.commandType) params.commandType = currentFilters.commandType;
    if (currentFilters.isDangerous !== undefined) params.isDangerous = currentFilters.isDangerous;
    if (currentFilters.searchQuery) params.query = currentFilters.searchQuery;
    if (currentFilters.sessionId) params.sessionId = currentFilters.sessionId;
    
    await getCommandsList(params);
  };

  // Fetch session commands
  const fetchSessionCommands = async (sessionId: string) => {
    try {
      const response = await request(`/api/audit-trails/terminal/sessions/${sessionId}/commands`);
      return response || [];
    } catch (err: any) {
      setError(err.message || 'Failed to fetch session commands');
      return [];
    }
  };

  // Fetch session details
  const fetchSessionDetails = async (sessionId: string) => {
    try {
      const response = await request(`/api/audit-trails/terminal/sessions/${sessionId}`);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch session details');
      return null;
    }
  };

  // Fetch active sessions
  const fetchActiveSessions = async () => {
    try {
      const response = await request('/api/audit-trails/terminal/sessions/active');
      return response.data || [];
    } catch (err: any) {
      setError(err.message || 'Failed to fetch active sessions');
      return [];
    }
  };

  // Fetch recent dangerous commands
  const fetchRecentDangerousCommands = async () => {
    try {
      const response = await request('/api/audit-trails/terminal/commands/recent-dangerous');
      return response.data || [];
    } catch (err: any) {
      setError(err.message || 'Failed to fetch recent dangerous commands');
      return [];
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const [dashboardResponse, commandTypeResponse, riskLevelResponse] = await Promise.all([
        request('/api/audit-trails/terminal/statistics/dashboard'),
        request('/api/audit-trails/terminal/statistics/command-types'),
        request('/api/audit-trails/terminal/statistics/risk-levels')
      ]);

      const stats: TerminalAuditStatistics = {
        ...dashboardResponse.data,
        commandTypeStats: commandTypeResponse.data || {},
        riskLevelStats: riskLevelResponse.data || {}
      };

      setStatistics(stats);
      return stats;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch statistics');
      return null;
    }
  };

  // Handle search
  const handleSearch = () => {
    if (viewMode === 'sessions') {
      fetchSessions();
    } else {
      fetchCommands();
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof TerminalAuditFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  // Fetch assets for filtering
  const fetchAssets = async () => {
    try {
      const response = await request('/api/audit-trails/terminal/assets');
      return response.data || [];
    } catch (err: any) {
      setError(err.message || 'Failed to fetch assets');
      return [];
    }
  };

  return {
    // Data
    sessions: Array.isArray(sessionsData) ? sessionsData : sessionsData?.content || [],
    commands: Array.isArray(commandsData) ? commandsData : commandsData?.content || [],
    statistics,
    error,
    
    // Pagination
    sessionsPagination,
    commandsPagination,
    
    // State
    viewMode,
    setViewMode,
    filters,
    
    // Actions
    fetchSessions,
    fetchCommands,
    fetchSessionCommands,
    fetchSessionDetails,
    fetchActiveSessions,
    fetchRecentDangerousCommands,
    fetchStatistics,
    fetchAssets,
    handleSearch,
    handleFilterChange
  };
};
