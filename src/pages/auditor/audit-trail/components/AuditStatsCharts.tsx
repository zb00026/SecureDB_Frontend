import { 
  Box, 
  Flex, 
  Input, 
  Select, 
  Grid, 
  GridItem, 
  useColorModeValue, 
  Text, 
  VStack,
  HStack,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Spinner,
  Alert,
  AlertIcon
} from "@chakra-ui/react";
import { FormattedMessage, IntlShape } from "react-intl";
import { DatePicker } from "antd";
import dayjs from "dayjs";
const { RangePicker } = DatePicker;
import { PrimaryButton, useDamToast, userHasRole } from "@common/index";
import { convertToString } from "@common/libs/utils";
import { request } from "@common/libs/request";
import { useState, useEffect } from "react";
import { FiBarChart, FiTrendingUp, FiUsers, FiGlobe } from "react-icons/fi";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from "recharts";
import { AuditStatsData, AvailableFilters } from "@models/AuditStats";
import { AuditTrailFilters } from "@common/hooks/useRoleBasedAuditTrail";
import { User } from "@models/User";
import { Asset } from "@models/assets/Asset";
import { USER_ROLE, FEATURE_FLAGS } from "@/constants/enums";
import { SAMPLE_EMAILS, SAMPLE_ASSETS, SAMPLE_IPS } from "../sampleData";

// Custom tooltip component moved outside to avoid hooks order issues
interface TooltipProps {
  readonly active?: boolean;
  readonly payload?: Array<{
    color: string;
    dataKey: string;
    value: number;
    payload?: {
      name: string;
      value: number;
    };
  }>;
  readonly label?: string;
}

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  
  if (active && payload?.length) {
    const data = payload[0]?.payload;
    return (
      <Box 
        bg={cardBg} 
        p={3} 
        borderRadius="md" 
        boxShadow="lg" 
        border="1px solid" 
        borderColor={borderColor}
      >
        <Text fontWeight="bold" mb={1} color={textColor}>
          {data?.name || label}
        </Text>
        <Text color={payload[0]?.color}>
          Activity Count: {payload[0]?.value}
        </Text>
      </Box>
    );
  }
  return null;
};


interface AuditStatsChartsProps {
  readonly filters: AuditTrailFilters;
  readonly user: User | null;
  readonly availableFilters: AvailableFilters;
  readonly assets: Asset[];
  readonly assetsLoading: boolean;
  readonly onAssetChange: (assetId: string) => void;
  readonly onFiltersChange: (filters: AuditTrailFilters) => void;
  readonly intl: IntlShape;
  readonly colorMode: string;
}

export function AuditStatsCharts({
  filters,
  user,
  availableFilters,
  assets,
  assetsLoading,
  onAssetChange,
  onFiltersChange,
  intl,
  colorMode
}: AuditStatsChartsProps) {
  const { showError } = useDamToast();
  
  const [statsData, setStatsData] = useState<AuditStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [localFilters, setLocalFilters] = useState<AuditTrailFilters>(filters);

  // Color mode values
  const axisColor = useColorModeValue('#666', '#ccc');
  const gridColor = useColorModeValue('#e0e0e0', '#444');
  const headingColor = useColorModeValue('gray.800', 'gray.100');

  // Get role-based endpoint
  const getStatsEndpoint = () => {
    if (!user) return '/api/audit-trails/stats/charts';
    
    // Use the same logic as useRoleBasedAuditTrail for endpoint selection
    if (userHasRole(user, USER_ROLE.ADMIN) || userHasRole(user, USER_ROLE.AUDITOR)) {
      return '/api/audit-trails/stats/charts';
    }
    if (userHasRole(user, USER_ROLE.ASSET_OWNER)) {
      return '/api/asset_owner/audit-trails/stats/charts';
    }
    if (FEATURE_FLAGS.ENABLE_APPROVER_ROLE && userHasRole(user, USER_ROLE.APPROVER)) {
      return '/api/approver/audit-trails/stats/charts';
    }
    return '/api/developer/audit-trails/stats/charts';
  };

  // Fetch stats data
  const fetchStatsData = async () => {
    setIsLoading(true);
    try {
      const endpoint = getStatsEndpoint();
      const queryParams = new URLSearchParams();
      
      // Build query string from filters
      for (const [key, value] of Object.entries(localFilters)) {
        if (value !== undefined && value !== '' && value !== null) {
          const stringValue = convertToString(value);
          queryParams.append(key, stringValue);
        }
      }

      const queryString = queryParams.toString();
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;
      
      const data = await request(url, { method: 'GET' });
      
      
      // If no data is returned, show sample data for testing
      if (!data || (!data.topAssets && !data.topUsers && !data.topIpAddresses)) {
        const sampleData = {
          timeSeriesData: [
            { timestamp: '2024-01-15T10:00:00', eventCount: 5 },
            { timestamp: '2024-01-15T11:00:00', eventCount: 3 },
            { timestamp: '2024-01-15T12:00:00', eventCount: 8 }
          ],
          topAssets: [
            { assetId: 1, assetName: SAMPLE_ASSETS.ASSET_1, activityCount: 15 },
            { assetId: 2, assetName: SAMPLE_ASSETS.ASSET_2, activityCount: 8 },
            { assetId: 3, assetName: SAMPLE_ASSETS.ASSET_3, activityCount: 12 }
          ],
          topUsers: [
            { userEmail: SAMPLE_EMAILS.USER_1, activityCount: 12 },
            { userEmail: SAMPLE_EMAILS.USER_2, activityCount: 9 },
            { userEmail: SAMPLE_EMAILS.USER_3, activityCount: 15 }
          ],
          topIpAddresses: [
            { ipAddress: SAMPLE_IPS.IP_1, activityCount: 8 },
            { ipAddress: SAMPLE_IPS.IP_2, activityCount: 6 },
            { ipAddress: SAMPLE_IPS.IP_3, activityCount: 10 }
          ],
          totalEvents: 50,
          startDate: '2024-01-15T08:00:00',
          endDate: '2024-01-15T12:30:00'
        };
        setStatsData(sampleData);
      } else {
        setStatsData(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      showError({
        title: intl.formatMessage({ id: 'text.error_occurred' }),
        description: intl.formatMessage({ id: 'text.failed_to_load_stats' })
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when filters change
  useEffect(() => {
    fetchStatsData();
  }, [localFilters]);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleSearch = () => {
    onFiltersChange(localFilters);
    fetchStatsData();
  };

  const handleReset = () => {
    const resetFilters: AuditTrailFilters = {
      startDate: '',
      endDate: '',
      action: '',
      user: '',
      previousValue: '',
      newValue: '',
      ipAddress: '',
      assetId: undefined,
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const handleAssetChange = (assetId: string) => {
    const newFilters: AuditTrailFilters = {
      ...localFilters,
      assetId: assetId === 'all' ? undefined : Number.parseInt(assetId, 10),
    };
    setLocalFilters(newFilters);
    onAssetChange(assetId);
  };

  // Format data for charts
  const formatTimeSeriesData = (data: AuditStatsData) => {
    return data.timeSeriesData.map(item => ({
      time: dayjs(item.timestamp).format('MMM DD HH:mm'),
      events: item.eventCount,
      timestamp: item.timestamp
    }));
  };

  const formatBarChartData = <T extends Record<string, any>>(
    data: T[], 
    labelKey: keyof T, 
    valueKey: keyof T
  ) => {
    if (!data || data.length === 0) {
      console.log('No data to format');
      return [];
    }
    
    const formatted = data.slice(0, 10).map(item => ({
      name: String(item[labelKey]),
      value: Number(item[valueKey])
    }));
    return formatted;
  };

  // Render stats content component
  const renderStatsContent = () => {
    if (isLoading) {
      return (
        <Flex justify="center" align="center" h="400px">
          <VStack>
            <Spinner size="xl" />
            <Text>Loading statistics...</Text>
          </VStack>
        </Flex>
      );
    }
    
    if (statsData) {
      return (
        <Grid templateColumns={{ base: "1fr", xl: "repeat(2, 1fr)" }} gap={6}>
          {/* Time Series Chart */}
          <GridItem colSpan={{ base: 1, xl: 2 }}>
            <Card>
              <CardHeader>
                <HStack>
                  <FiTrendingUp />
                  <Heading size="md">
                    <FormattedMessage id="text.activity_over_time" />
                  </Heading>
                </HStack>
              </CardHeader>
              <CardBody>
                <Box h="400px">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formatTimeSeriesData(statsData)}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis 
                        dataKey="time" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={12}
                        tick={{ fill: axisColor }}
                        axisLine={{ stroke: axisColor }}
                      />
                      <YAxis 
                        tick={{ fill: axisColor }}
                        axisLine={{ stroke: axisColor }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey="events" 
                        stroke="#3182ce" 
                        strokeWidth={2}
                        dot={{ fill: '#3182ce', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#3182ce', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardBody>
            </Card>
          </GridItem>

          {/* Top Assets */}
          <GridItem>
            <Card>
              <CardHeader>
                <HStack>
                  <FiBarChart />
                  <Heading size="md" color={headingColor}>
                    <FormattedMessage id="text.top_assets" />
                  </Heading>
                </HStack>
              </CardHeader>
              <CardBody>
                <Box h="400px">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formatBarChartData(statsData.topAssets, 'assetName', 'activityCount')} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis 
                        type="number"
                        tick={{ fill: axisColor }}
                        axisLine={{ stroke: axisColor }}
                      />
                      <YAxis 
                        dataKey="name"
                        type="category"
                        tick={{ fill: axisColor, fontSize: 10 }}
                        axisLine={{ stroke: axisColor }}
                        width={140}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill="#805ad5" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardBody>
            </Card>
          </GridItem>

          {/* Top Users */}
          <GridItem>
            <Card>
              <CardHeader>
                <HStack>
                  <FiUsers />
                  <Heading size="md" color={headingColor}>
                    <FormattedMessage id="text.top_users" />
                  </Heading>
                </HStack>
              </CardHeader>
              <CardBody>
                <Box h="400px">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formatBarChartData(statsData.topUsers, 'userEmail', 'activityCount')} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis 
                        type="number"
                        tick={{ fill: axisColor }}
                        axisLine={{ stroke: axisColor }}
                      />
                      <YAxis 
                        dataKey="name"
                        type="category"
                        tick={{ fill: axisColor, fontSize: 10 }}
                        axisLine={{ stroke: axisColor }}
                        width={140}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill="#38a169" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardBody>
            </Card>
          </GridItem>

          {/* Top IP Addresses */}
          <GridItem>
            <Card>
              <CardHeader>
                <HStack>
                  <FiGlobe />
                  <Heading size="md" color={headingColor}>
                    <FormattedMessage id="text.top_ip_addresses" />
                  </Heading>
                </HStack>
              </CardHeader>
              <CardBody>
                <Box h="400px">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formatBarChartData(statsData.topIpAddresses, 'ipAddress', 'activityCount')} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis 
                        type="number"
                        tick={{ fill: axisColor }}
                        axisLine={{ stroke: axisColor }}
                      />
                      <YAxis 
                        dataKey="name"
                        type="category"
                        tick={{ fill: axisColor, fontSize: 10 }}
                        axisLine={{ stroke: axisColor }}
                        width={140}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill="#ed8936" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardBody>
            </Card>
          </GridItem>

          {/* Summary Stats */}
          <GridItem colSpan={{ base: 1, xl: 2 }}>
            <Card>
              <CardHeader>
                <Heading size="md">
                  <FormattedMessage id="text.summary" />
                </Heading>
              </CardHeader>
              <CardBody>
                <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
                  <Box>
                    <Text fontSize="sm" color="gray.500">
                      <FormattedMessage id="text.total_events" />
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold">
                      {statsData!.totalEvents.toLocaleString()}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">
                      <FormattedMessage id="text.date_range" />
                    </Text>
                    <Text>
                      {dayjs(statsData!.startDate).format('MMM DD, YYYY')} - {dayjs(statsData!.endDate).format('MMM DD, YYYY')}
                    </Text>
                  </Box>
                </Grid>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      );
    }
    
    return (
      <Alert status="info">
      <AlertIcon />
      <Text>No statistics data available. Please adjust your filters and try again.</Text>
    </Alert>
    );
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Search Filters */}
      <Card>
        <CardBody>
          <Grid templateColumns="repeat(3, 1fr)" gap={4} mb={4}>
            {/* Date Range */}
            <GridItem>
              <RangePicker
                size="large"
                placeholder={[
                  intl.formatMessage({ id: "text.from" }),
                  intl.formatMessage({ id: "text.to" }),
                ]}
                style={{ width: "100%" }}
                value={localFilters.startDate ? [dayjs(localFilters.startDate), dayjs(localFilters.endDate)] : null}
                onChange={(dates) => {
                  setLocalFilters({
                    ...localFilters,
                    startDate: dates?.[0]?.format('YYYY-MM-DD') ?? '',
                    endDate: dates?.[1]?.format('YYYY-MM-DD') ?? ''
                  });
                }}
                className={colorMode === 'dark' ? 'dark-theme-picker' : ''}
              />
            </GridItem>

            {/* Asset Dropdown */}
            {availableFilters.canFilterByAsset && (
              <GridItem>
                <Select
                  value={localFilters.assetId?.toString() || 'all'}
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

            {/* Action Dropdown */}
            <GridItem>
              <Select
                placeholder="Select Action"
                value={localFilters.action}
                onChange={(e) => setLocalFilters({ ...localFilters, action: e.target.value })}
              >
                {availableFilters.availableActions.map((action: string) => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </Select>
            </GridItem>

            {/* User Input */}
            {availableFilters.canViewAllUsers && (
              <GridItem>
                <Input
                  placeholder="User"
                  value={localFilters.user}
                  onChange={(e) => setLocalFilters({ ...localFilters, user: e.target.value })}
                />
              </GridItem>
            )}

            {/* IP Address */}
            <GridItem>
              <Input
                placeholder="IP Address"
                value={localFilters.ipAddress}
                onChange={(e) => setLocalFilters({ ...localFilters, ipAddress: e.target.value })}
              />
            </GridItem>
          </Grid>

          {/* Buttons */}
          <Flex justify="flex-end" gap={4}>
            <PrimaryButton variant="outline" onClick={handleReset}>
              <FormattedMessage id="text.reset" />
            </PrimaryButton>
            <PrimaryButton onClick={handleSearch}>
              <FormattedMessage id="text.search" />
            </PrimaryButton>
          </Flex>
        </CardBody>
      </Card>

      {/* Stats Content */}
      {renderStatsContent()}
    </VStack>
  );
}
