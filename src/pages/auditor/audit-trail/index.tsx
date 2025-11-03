import { Box, Flex, Input, Select, Grid, GridItem, useColorMode, useColorModeValue, Alert, AlertIcon, Text, Button, useDisclosure, Tooltip, Tabs, TabList, TabPanels, Tab, TabPanel, IconButton, Icon } from "@chakra-ui/react";
import { Global, css } from "@emotion/react";
import { DamBasePage } from "@common/components/DamBasePage";
import { useRoleBasedAuditTrail } from "@common/hooks/useRoleBasedAuditTrail";

import { FormattedMessage, useIntl } from "react-intl";
import { DatePicker, Select as AntSelect } from "antd";
import dayjs from "dayjs";
const { RangePicker } = DatePicker;
import { PrimaryButton, useMyState, useAssetsForAudit, useDamToast } from "@common/index";
import { DamTable } from "@common/components/DamTable";
import { AuditChangesDialog } from "@common/components/DamDialog/AuditChangesDialog";
import { useState } from "react";
import { FiDownload, FiEye } from "react-icons/fi";
import { AuditStatsCharts } from "./components/AuditStatsCharts";

export const isSearchable = true;
export const displayName = 'Audit Trail';

export function Component() {
  const intl = useIntl();
  const { colorMode } = useColorMode();
  const { snap } = useMyState();
  const user = snap.session.user;
  const { showSuccess, showError } = useDamToast();
  // State for changes dialog
  const [selectedAuditRecord, setSelectedAuditRecord] = useState<any>(null);
  const { isOpen: isChangesDialogOpen, onOpen: onChangesDialogOpen, onClose: onChangesDialogClose } = useDisclosure();
  
  // State for download
  const [isDownloading, setIsDownloading] = useState(false);

  // State for tabs
  const [activeTab, setActiveTab] = useState<'logs' | 'stats'>('logs');

  // Color mode values
  const descriptionTextColor = useColorModeValue('gray.600', 'gray.300');

  const {
    filters,
    setFilters,
    getData,
    getList,
    pagination,
    availableFilters,
    roleBasedMessage,
    downloadAuditLogs
  } = useRoleBasedAuditTrail({ user });

  // Fetch assets for the dropdown
  const { assets, loading: assetsLoading, error: assetsError } = useAssetsForAudit({ user });

  const handleViewChanges = (record: any) => {
    setSelectedAuditRecord(record);
    onChangesDialogOpen();
  };

  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      // render: (text: string) => formatTimeWithTimezone(text, 'YYYY/MM/DD HH:mm:ss'),
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
      render: (text: any) => {
        return (
          <Tooltip label={text} placement="top" hasArrow>
            <Text
              fontSize="sm"
              color={descriptionTextColor}
              maxW="300px"
              isTruncated
              cursor="help"
              mb={0}
            >
              {text}
            </Text>
          </Tooltip>
        );
      },
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
      title: '',
      dataIndex: 'id',
      key: 'viewChanges',
      width: '60px',
      render: (_: any, record: any) => {
        const hasChanges = record.previousValue || record.newValue;
        if (!hasChanges) return null;
        
        return (
          <Tooltip label={intl.formatMessage({ id: 'text.view_changes' })} placement="top" hasArrow>
            <IconButton
              aria-label={intl.formatMessage({ id: 'text.view_changes' })}
              icon={<Icon as={FiEye} />}
              size="sm"
              variant="ghost"
              colorScheme="blue"
              onClick={(e) => {
                e.stopPropagation();
                handleViewChanges(record);
              }}
            />
          </Tooltip>
        );
      },
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

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await downloadAuditLogs(filters);
      showSuccess({
        title: intl.formatMessage({ id: 'text.download_success' }),
        description: intl.formatMessage({ id: 'text.audit_logs_downloaded' })
      });
    } catch (error) {
      console.error('Download failed:', error);
      showError({
        title: intl.formatMessage({ id: 'text.download_failed' }),
        description: intl.formatMessage({ id: 'text.audit_logs_download_error' })
      });
    } finally {
      setIsDownloading(false);
    }
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

        {/* Tabs */}
        <Tabs index={activeTab === 'logs' ? 0 : 1} onChange={(index) => setActiveTab(index === 0 ? 'logs' : 'stats')} mb={6}>
          <TabList>
            <Tab>
              <FormattedMessage id="text.audit_logs" />
            </Tab>
            <Tab>
              <FormattedMessage id="text.audit_stats" />
            </Tab>
          </TabList>

          <TabPanels>
            {/* Audit Logs Tab */}
            <TabPanel px={0}>
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
                        {assets.map(asset => (
                          <option key={asset.id} value={asset.id?.toString()}>
                            {asset.name}
                          </option>
                        ))}
                      </Select>
                    </GridItem>
                  )}

                  {/* Action Dropdown (searchable) */}
                  <GridItem>
                    <AntSelect
                      allowClear
                      showSearch
                      size="large"
                      style={{ width: '100%' }}
                      placeholder="Select Action"
                      value={filters.action || undefined}
                      onChange={(value) => setFilters({ ...filters, action: value ?? '' })}
                      optionFilterProp="label"
                      filterOption={(input, option) => ((option?.label as string) ?? '').toLowerCase().includes(input.toLowerCase())}
                      options={availableFilters.availableActions.map((action: string) => ({ label: action, value: action }))}
                    />
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
                <Flex justify="space-between" gap={4} mt={4}>
                  <Button
                    leftIcon={<FiDownload />}
                    colorScheme="green"
                    variant="outline"
                    onClick={handleDownload}
                    isLoading={isDownloading}
                    loadingText={intl.formatMessage({ id: 'text.downloading' })}
                  >
                    <FormattedMessage id="text.download_audit_logs" />
                  </Button>

                  <Flex gap={4}>
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
                </Flex>
              </Box>

              <Text fontSize="md" fontWeight="semibold" mb={4}>
                <FormattedMessage id="text.audit_logs" />
              </Text>

              <DamTable
                id="tableAuditTrail"
                columns={columns}
                dataSource={(Array.isArray(getData) ? getData : getData?.content) || []}
                pagination={pagination}
                rowKey="id"
                selectable={false}
              />
            </TabPanel>

            {/* Audit Stats Tab */}
            <TabPanel px={0}>
              <AuditStatsCharts
                filters={filters}
                user={user}
                availableFilters={availableFilters}
                assets={assets}
                assetsLoading={assetsLoading}
                onAssetChange={handleAssetChange}
                onFiltersChange={setFilters}
                intl={intl}
                colorMode={colorMode}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Changes Dialog */}
        {selectedAuditRecord && (
          <AuditChangesDialog
            isOpen={isChangesDialogOpen}
            onClose={onChangesDialogClose}
            previousValue={selectedAuditRecord.previousValue}
            newValue={selectedAuditRecord.newValue}
            readableDescription={selectedAuditRecord.readableDescription}
          />
        )}
      </Box>
    </DamBasePage>
  );
} 