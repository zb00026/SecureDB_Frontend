// Utility functions for terminal audit components

export const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

export const getRiskLevelColor = (riskLevel: string) => {
  switch (riskLevel) {
    case 'CRITICAL': return 'red';
    case 'HIGH': return 'orange';
    case 'MEDIUM': return 'yellow';
    case 'LOW': return 'green';
    default: return 'gray';
  }
};

export const getCommandTypeColor = (commandType: string) => {
  switch (commandType) {
    case 'security': return 'red';
    case 'system_admin': return 'orange';
    case 'file_operation': return 'blue';
    case 'network': return 'purple';
    case 'process_management': return 'teal';
    case 'text_processing': return 'green';
    case 'editor': return 'pink';
    default: return 'gray';
  }
};
