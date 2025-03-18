import { Box, Flex, Input, Select, Grid, GridItem, useColorMode } from "@chakra-ui/react";
import { Global, css } from "@emotion/react";
import { MyBasePage } from "@common/components/MyBasePage";
import { useListPage } from "@common/hooks/useListPage";

import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { AuditTrail } from "@models/AuditTrail";
import { DatePicker } from "antd";
import dayjs from "dayjs";
const { RangePicker } = DatePicker;
import { PrimaryButton } from "@common/index";
import { MyTable } from "@common/components/MyTable";

export const isSearchable = true;
export const displayName = 'Audit Trail';

export function Component() {
  const intl = useIntl();
  const { colorMode } = useColorMode();
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    action: '',
    user: '',
    previousValue: '',
    newValue: '',
    ipAddress: '',
  });

  const { getData, getList, pagination } = useListPage<AuditTrail>({
    baseUri: '/api/audit-trails',
    defaultParams: { ...filters }
  });

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
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
    },
    {
      title: 'Previous Value',
      dataIndex: 'previousValue',
      key: 'previousValue',
      render: (text: string) => text ? JSON.stringify(text) : '-',
    },
    {
      title: 'New Value',
      dataIndex: 'newValue',
      key: 'newValue',
      render: (text: string) => text ? JSON.stringify(text) : '-',
    },
  ];

  const handleSearch = () => {
    getList({
      page: 1,
      perPage: 20,
      ...filters
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
    });
    getList({
      page: 1,
      perPage: 20
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
    <MyBasePage
      title={intl.formatMessage({ id: 'text.audit_trail' })}
      backTitle={intl.formatMessage({ id: 'text.dashboard' })}
      backURI="/">
      <Global styles={getDarkModeStyles(colorMode)} />
      <Box p={6}>
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
                      startDate: dates?.[0]?.format('YYYY-MM-DD') || '',
                      endDate: dates?.[1]?.format('YYYY-MM-DD') || ''
                    });
                  }}
                  className={colorMode === 'dark' ? 'dark-theme-picker' : ''}
                />
              </Flex>
            </GridItem>

            {/* Action Dropdown */}
            <GridItem>
              <Select
                placeholder="Select Action"
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              >
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
              </Select>
            </GridItem>

            {/* User Input */}
            <GridItem>
              <Input
                placeholder="User"
                value={filters.user}
                onChange={(e) => setFilters({ ...filters, user: e.target.value })}
              />
            </GridItem>

            {/* IP Address */}
            <GridItem>
              <Input
                placeholder="IP Address"
                value={filters.ipAddress}
                onChange={(e) => setFilters({ ...filters, ipAddress: e.target.value })}
              />
            </GridItem>

            {/* Previous Value */}
            <GridItem>
              <Input
                placeholder="Previous Value"
                value={filters.previousValue}
                onChange={(e) => setFilters({ ...filters, previousValue: e.target.value })}
              />
            </GridItem>

            {/* New Value */}
            <GridItem>
              <Input
                placeholder="New Value"
                value={filters.newValue}
                onChange={(e) => setFilters({ ...filters, newValue: e.target.value })}
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

        <MyTable
          id="tableAuditTrail"
          columns={columns}
          dataSource={(Array.isArray(getData) ? getData : getData?.content) || []}
          pagination={pagination}
          rowKey="id"
        />
      </Box>
    </MyBasePage>
  );
} 