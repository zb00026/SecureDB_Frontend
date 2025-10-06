import { Box, Flex, Input, Select, Grid, GridItem, useColorMode, Alert, AlertIcon, Text, Button, useDisclosure } from "@chakra-ui/react";
import { Global, css } from "@emotion/react";
import { DamBasePage } from "@common/components/DamBasePage";
import { useRoleBasedAuditTrail } from "@common/hooks/useRoleBasedAuditTrail";

import { FormattedMessage, useIntl } from "react-intl";
import { DatePicker } from "antd";
import dayjs from "dayjs";
const { RangePicker } = DatePicker;
import { PrimaryButton, useMyState, useAssetsForAudit } from "@common/index";
import { DamTable } from "@common/components/DamTable";
import { AuditChangesDialog } from "@common/components/DamDialog/AuditChangesDialog";
import { useState } from "react";

export const isSearchable = true;
export const displayName = 'Audit Trail';

export function Component() {
  const intl = useIntl();
  const { colorMode } = useColorMode();
  const { snap } = useMyState();
  const user = snap.session.user;
  
  // State for changes dialog
  const [selectedAuditRecord, setSelectedAuditRecord] = useState<any>(null);
  const { isOpen: isChangesDialogOpen, onOpen: onChangesDialogOpen, onClose: onChangesDialogClose } = useDisclosure();

  const {
    filters,
    setFilters,
    getData,
    getList,
    pagination,
    availableFilters,
    roleBasedMessage
  } = useRoleBasedAuditTrail({ user });

  // Fetch assets for the dropdown
  const { assets, loading: assetsLoading, error: assetsError } = useAssetsForAudit({ user });

  const handleViewChanges = (record: any) => {
    setSelectedAuditRecord(record);
    onChangesDialogOpen();
  };

  const getHumanReadableDescription = (record: any) => {
    const { action, previousValue, newValue, user } = record;
    
    if (!previousValue && !newValue) {
      return `User ${user} performed ${action}`;
    }

    if (!previousValue) {
      return `User ${user} created new record with action ${action}`;
    }

    if (!newValue) {
      return `User ${user} deleted record with action ${action}`;
    }

    return `User ${user} updated record with action ${action}`;
  };

  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: 'User',
      dataIndex: 'user',
      key: 'user',
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text: any, record: any) => (
        <Text fontSize="sm" color="gray.600" maxW="300px" isTruncated>
          {getHumanReadableDescription(record)}
        </Text>
      ),
    },
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
    },
    {
      title: 'Instance',
      dataIndex: 'instanceId',
      key: 'instanceId',
    },
    {
      title: 'Changes',
      dataIndex: 'changes',
      key: 'changes',
      render: (text: any, record: any) => (
        <Button
          size="sm"
          variant="outline"
          colorScheme="blue"
          onClick={() => handleViewChanges(record)}
          isDisabled={!record.previousValue && !record.newValue}
        >
          <FormattedMessage id="text.view_changes" />
        </Button>
      ),
    },
  ];

  const handleSearch = () => {
    getList({
      page: 1,
      perPage: 20,
    });
  };

  const handleReset = () => {
    setFilters({
      startDate: '',
      endDate: '',
      action: '',
      user: '',
      previousValue: '',
      newValue: '',
      ipAddress: '',
      assetId: undefined,
    });
    getList({
      page: 1,
      perPage: 20
    });
  };

  const handleAssetChange = (assetId: string) => {
    setFilters({
      ...filters,
      assetId: assetId === 'all' ? undefined : parseInt(assetId),
    });
  };

  const getDarkModeStyles = (colorMode: string) => {
    const colors = {
      dark: {
        bg: '#2D3748',
        border: '#4A5568',
        text: '#FFFFFF',
        muted: '#A0AEC0',
        hover: '#4A5568'
      },
      light: {
        bg: 'white',
        border: '#E2E8F0',
        text: 'inherit',
        muted: 'inherit',
        hover: '#EDF2F7'
      }
    };
  
    const mode = colorMode === 'dark' ? colors.dark : colors.light;
  
    return css`
      .dark-theme-picker.ant-picker {
        background-color: ${mode.bg};
        border-color: ${mode.border};
      }
      .dark-theme-picker .ant-picker-input > input {
        color: ${mode.text};
      }
      .dark-theme-picker .ant-picker-separator,
      .dark-theme-picker .ant-picker-suffix {
        color: ${mode.muted};
      }
      .dark-theme-picker .ant-picker-clear {
        background-color: ${mode.bg};
        color: ${mode.muted};
      }
      .dark-theme-picker:hover,
      .dark-theme-picker:focus {
        border-color: #63B3ED;
      }
      .dark-theme-picker .ant-picker-panel-container,
      .dark-theme-picker .ant-picker-panel {
        background-color: ${mode.bg};
        border-color: ${mode.border};
      }
      .dark-theme-picker .ant-picker-content th {
        color: ${mode.muted};
      }
      .dark-theme-picker .ant-picker-cell,
      .dark-theme-picker .ant-picker-cell-in-view {
        color: ${mode.text};
      }
      .dark-theme-picker .ant-picker-cell-disabled {
        color: ${mode.border};
      }
      .dark-theme-picker .ant-picker-cell:hover .ant-picker-cell-inner {
        background-color: ${mode.hover};
      }
      .dark-theme-picker .ant-picker-cell-selected .ant-picker-cell-inner {
        background-color: #63B3ED;
      }
    `;
  };
  

  return (
    <DamBasePage
      title={intl.formatMessage({ id: 'text.audit_trail' })}>
      <Global styles={getDarkModeStyles(colorMode)} />
      <Box p={6}>
        {/* Role-based access notice */}
        <Alert status="info" mb={4}>
          <AlertIcon />
          <Text fontSize="sm" mb={0}>{roleBasedMessage}</Text>
        </Alert>
        
        {/* Asset loading error */}
        {assetsError && (
          <Alert status="error" mb={4}>
            <AlertIcon />
            <Text fontSize="sm" mb={0}>{assetsError}</Text>
          </Alert>
        )}
        <Box 
          p={4} 
          borderRadius="md" 
          shadow="sm"
          mb={6}
        >
          <Grid
            templateColumns="repeat(3, 1fr)"
            gap={4}
            mb={4}
          >
            {/* Date Range Row */}
            <GridItem>
              <Flex gap={4}>
              <RangePicker
                  size="large"
                  placeholder={[
                    intl.formatMessage({ id: "text.from" }),
                    intl.formatMessage({ id: "text.to" }),
                  ]}
                  style={{ width: "100%" }}
                  value={filters.startDate ? [dayjs(filters.startDate), dayjs(filters.endDate)] : null}
                  onChange={(dates) => {
                    setFilters({
                      ...filters,
                      startDate: dates?.[0]?.format('YYYY-MM-DD') ?? '',
                      endDate: dates?.[1]?.format('YYYY-MM-DD') ?? ''
                    });
                  }}
                  className={colorMode === 'dark' ? 'dark-theme-picker' : ''}
                />
              </Flex>
            </GridItem>

            {/* Asset Dropdown - only show if user can filter by asset */}
            {availableFilters.canFilterByAsset && (
              <GridItem>
                <Select
                  value={filters.assetId?.toString() || 'all'}
                  onChange={(e) => handleAssetChange(e.target.value)}
                  isDisabled={assetsLoading}
                >
                  <option value="all">All Assets</option>
                  {assets
                    .map(asset => (
                      <option key={asset.id} value={asset.id?.toString()}>
                        {asset.name}
                      </option>
                    ))}
                </Select>
              </GridItem>
            )}

            {/* Action Dropdown */}
            <GridItem>
              <Select
                placeholder="Select Action"
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              >
                {availableFilters.availableActions.map((action: string) => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </Select>
            </GridItem>

            {/* User Input - only show if user can view all users */}
            {availableFilters.canViewAllUsers && (
              <GridItem>
                <Input
                  placeholder="User"
                  value={filters.user}
                  onChange={(e) => setFilters({ ...filters, user: e.target.value })}
                />
              </GridItem>
            )}

            {/* IP Address */}
            <GridItem>
              <Input
                placeholder="IP Address"
                value={filters.ipAddress}
                onChange={(e) => setFilters({ ...filters, ipAddress: e.target.value })}
              />
            </GridItem>

          </Grid>

          {/* Buttons Row */}
          <Flex justify="flex-end" gap={4} mt={4}>
            <PrimaryButton 
              variant="outline" 
              onClick={handleReset}
            >
              <FormattedMessage id="text.reset" />
            </PrimaryButton>
            <PrimaryButton onClick={handleSearch} id="btnSearchAuditTrail">
              <FormattedMessage id="text.search" />
            </PrimaryButton>
          </Flex>
        </Box>

        <DamTable
          id="tableAuditTrail"
          columns={columns}
          dataSource={(Array.isArray(getData) ? getData : getData?.content) || []}
          pagination={pagination}
          rowKey="id"
        />
        
        {/* Changes Dialog */}
        {selectedAuditRecord && (
          <AuditChangesDialog
            isOpen={isChangesDialogOpen}
            onClose={onChangesDialogClose}
            action={selectedAuditRecord.action}
            previousValue={selectedAuditRecord.previousValue}
            newValue={selectedAuditRecord.newValue}
            timestamp={selectedAuditRecord.timestamp}
            user={selectedAuditRecord.user}
          />
        )}
      </Box>
    </DamBasePage>
  );
} 