import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  Text,
  Box,
  useColorModeValue,
  Divider,
} from '@chakra-ui/react';
import { FormattedMessage } from 'react-intl';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { Global, css } from '@emotion/react';

interface AuditChangesDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly action: string;
  readonly previousValue: any;
  readonly newValue: any;
  readonly timestamp: string;
  readonly user: string;
}

export function AuditChangesDialog({
  isOpen,
  onClose,
  action,
  previousValue,
  newValue,
  timestamp,
  user,
}: AuditChangesDialogProps) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // Color values for status indicators
  const noChangesColor = useColorModeValue('orange.600', 'orange.400');
  const changesFoundColor = useColorModeValue('green.600', 'green.400');

  // Format the values for display
  const formatValue = (value: any) => {
    if (!value) return '';
    if (typeof value === 'string') {
      try {
        // Try to parse as JSON first
        const parsed = JSON.parse(value);
        return JSON.stringify(parsed, null, 2);
      } catch {
        // If not JSON, return as is
        return value;
      }
    }
    return JSON.stringify(value, null, 2);
  };

  const oldValue = formatValue(previousValue);
  const newValueFormatted = formatValue(newValue);

  // Debug logging
  console.log('AuditChangesDialog - Raw values:', { previousValue, newValue });
  console.log('AuditChangesDialog - Formatted values:', { oldValue, newValueFormatted });
  console.log('AuditChangesDialog - Are values equal?', oldValue === newValueFormatted);
  console.log('AuditChangesDialog - Old value length:', oldValue.length);
  console.log('AuditChangesDialog - New value length:', newValueFormatted.length);

  // Generate human-readable description
  const getHumanReadableDescription = () => {
    if (!previousValue && !newValue) {
      return `User ${user} performed ${action} at ${new Date(timestamp).toLocaleString()}`;
    }

    if (!previousValue) {
      return `User ${user} created new record with action ${action} at ${new Date(timestamp).toLocaleString()}`;
    }

    if (!newValue) {
      return `User ${user} deleted record with action ${action} at ${new Date(timestamp).toLocaleString()}`;
    }

    return `User ${user} updated record with action ${action} at ${new Date(timestamp).toLocaleString()}`;
  };

  const diffViewerStyles = css`
    .diff-viewer {
      width: 100% !important;
      height: 100%;
      overflow: auto;
      display: flex !important;
      flex-direction: column !important;
    }
    .diff-viewer .diff-container {
      display: flex !important;
      flex-direction: row !important;
      width: 100% !important;
      height: 100% !important;
      overflow: auto !important;
      min-width: 100% !important;
    }
    .diff-viewer .split-view {
      display: flex !important;
      flex-direction: row !important;
      width: 100% !important;
      height: 100% !important;
      overflow: auto !important;
      min-width: 100% !important;
    }
    .diff-viewer .split-view-left {
      flex: 1 1 50% !important;
      border-right: 1px solid ${borderColor} !important;
      padding-right: 8px !important;
      overflow-y: auto !important;
      max-height: 100% !important;
      min-width: 0 !important;
    }
    .diff-viewer .split-view-right {
      flex: 1 1 50% !important;
      padding-left: 8px !important;
      overflow-y: auto !important;
      max-height: 100% !important;
      min-width: 0 !important;
    }
    .diff-viewer .diff-viewer-container {
      overflow: auto !important;
      max-height: 100% !important;
      width: 100% !important;
    }
    .diff-viewer .diff-viewer-container > div {
      width: 100% !important;
      min-width: 100% !important;
    }
    .diff-viewer table {
      width: 100% !important;
      min-width: 100% !important;
    }
    .diff-viewer tbody {
      width: 100% !important;
    }
    .diff-viewer tbody tr {
      width: 100% !important;
    }
  `;

  return (
    <>
      <Global styles={diffViewerStyles} />
      <Modal isOpen={isOpen} onClose={onClose} size="6xl" closeOnOverlayClick={false}>
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent bg={bgColor} maxH="90vh" minH="600px" borderRadius="lg" shadow="2xl">
        <ModalHeader color={textColor} borderBottom="1px solid" borderColor={useColorModeValue('gray.200', 'gray.600')} bg={useColorModeValue('gray.50', 'gray.800')}>
          <VStack align="start" spacing={2}>
            <Text fontSize="lg" fontWeight="bold" color={useColorModeValue('gray.800', 'white')}>
              <FormattedMessage id="text.audit_changes" />
            </Text>
            <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')}>
              {getHumanReadableDescription()}
            </Text>
          </VStack>
        </ModalHeader>
        
        <Divider />
        
        <ModalBody overflowY="auto" p={0} maxH="70vh">
          <Box p={4} height="100%" overflow="hidden">
            {/* Debug info with professional styling */}
            <Box mb={4} p={3} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md" border="1px solid" borderColor={useColorModeValue('gray.200', 'gray.600')}>
              <Text fontSize="sm" fontWeight="semibold" color={useColorModeValue('gray.700', 'gray.200')} mb={2}>
                Change Details:
              </Text>
              <VStack align="start" spacing={1}>
                <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.300')}>
                  <Text as="span" fontWeight="medium">Previous:</Text> {oldValue.substring(0, 50)}{oldValue.length > 50 ? '...' : ''}
                </Text>
                <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.300')}>
                  <Text as="span" fontWeight="medium">Current:</Text> {newValueFormatted.substring(0, 50)}{newValueFormatted.length > 50 ? '...' : ''}
                </Text>
                <Text fontSize="xs" color={oldValue === newValueFormatted ? noChangesColor : changesFoundColor}>
                  <Text as="span" fontWeight="medium">Status:</Text> {oldValue === newValueFormatted ? 'No changes detected' : 'Changes found'}
                </Text>
              </VStack>
            </Box>
            
            {/* Always show diff viewer for debugging */}
            <Box className="diff-viewer" height="100%" overflow="hidden" width='100%'>
              <ReactDiffViewer
                oldValue={oldValue || ''}
                newValue={newValueFormatted || ''}
                splitView={true}
                showDiffOnly={false}
                useDarkTheme={useColorModeValue(false, true)}
                leftTitle="Previous Value"
                rightTitle="New Value"
                hideLineNumbers={false}
                styles={{
                  diffContainer: {
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'row',
                    width: '100%',
                    minWidth: '100%',
                    overflow: 'auto',
                  },
                  diffRemoved: {
                    backgroundColor: useColorModeValue('#fef2f2', '#2d1b1b'),
                    color: useColorModeValue('#dc2626', '#fca5a5'),
                    borderLeft: `3px solid ${useColorModeValue('#dc2626', '#fca5a5')}`,
                  },
                  diffAdded: {
                    backgroundColor: useColorModeValue('#f0fdf4', '#1a2e1a'),
                    color: useColorModeValue('#16a34a', '#86efac'),
                    borderLeft: `3px solid ${useColorModeValue('#16a34a', '#86efac')}`,
                  },
                  marker: {
                    fontSize: '12px',
                    fontWeight: 'bold',
                  },
                  content: {
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    width: 'inherit',
                  },
                  line: {
                    fontSize: '14px',
                    fontFamily: 'monospace',
                  },
                  wordDiff: {
                    fontSize: '14px',
                  },
                  wordAdded: {
                    backgroundColor: useColorModeValue('#dcfce7', '#1a2e1a'),
                    color: useColorModeValue('#16a34a', '#86efac'),
                    fontWeight: '500',
                  },
                  wordRemoved: {
                    backgroundColor: useColorModeValue('#fef2f2', '#2d1b1b'),
                    color: useColorModeValue('#dc2626', '#fca5a5'),
                    fontWeight: '500',
                  },
                  gutter: {
                    backgroundColor: useColorModeValue('#f8fafc', '#1a202c'),
                    color: useColorModeValue('#64748b', '#94a3b8'),
                    borderRight: `1px solid ${useColorModeValue('#e2e8f0', '#4a5568')}`,
                  },
                  lineNumber: {
                    color: useColorModeValue('#64748b', '#94a3b8'),
                    fontSize: '12px',
                  },
                  splitView: {
                    flexDirection: 'row',
                    display: 'flex',
                    width: '100%',
                    height: '100%',
                    overflow: 'auto',
                  },
                  codeFold: {
                    backgroundColor: useColorModeValue('#f8fafc', '#1a202c'),
                    color: useColorModeValue('#64748b', '#94a3b8'),
                  },
                  codeFoldGutter: {
                    backgroundColor: useColorModeValue('#f8fafc', '#1a202c'),
                    color: useColorModeValue('#64748b', '#94a3b8'),
                  },
                }}
              />
            </Box>
          </Box>
        </ModalBody>
        
        <ModalFooter borderTop="1px solid" borderColor={useColorModeValue('gray.200', 'gray.600')} bg={useColorModeValue('gray.50', 'gray.800')}>
          <Button onClick={onClose} colorScheme="blue" size="md" fontWeight="medium">
            <FormattedMessage id="text.close" />
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
    </>
  );
}
