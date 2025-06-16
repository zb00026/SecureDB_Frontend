import { 
  Box, 
  CloseButton, 
  Flex, 
  Icon,
  Button,
  HStack,
  useColorModeValue,
  Collapse,
  ScaleFade
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { FiAlertTriangle, FiXCircle, FiRefreshCw } from "react-icons/fi";
import { LicenseStatus } from "@/models/LicenseStatus";

interface DamLicenseBannerProps {
  readonly licenseStatus: LicenseStatus;
  readonly onRefresh?: () => void;
  readonly isRefreshing?: boolean;
  readonly dismissible?: boolean;
  readonly autoHideDelay?: number;
}

export function DamLicenseBanner({ 
  licenseStatus, 
  onRefresh,
  isRefreshing = false,
  dismissible = true,
  autoHideDelay
}: DamLicenseBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Color mode values
  const errorBg = useColorModeValue('red.50', 'red.900');
  const errorBorder = useColorModeValue('red.500', 'red.300');
  const errorColor = useColorModeValue('red.800', 'red.100');
  
  const warningBg = useColorModeValue('orange.50', 'orange.900');
  const warningBorder = useColorModeValue('orange.400', 'orange.300');
  const warningColor = useColorModeValue('orange.800', 'orange.100');

  // Auto-hide functionality
  useEffect(() => {
    if (autoHideDelay && autoHideDelay > 0 && isVisible) {
      const timer = setTimeout(() => {
        setIsDismissed(true);
      }, autoHideDelay);
      
      return () => clearTimeout(timer);
    }
  }, [autoHideDelay, isVisible]);

  // Show/hide animation control
  useEffect(() => {
    if (!isDismissed && (licenseStatus.isExpiringSoon ?? !licenseStatus.isValid)) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isDismissed, licenseStatus.isExpiringSoon, licenseStatus.isValid]);

  // Don't show banner if license is valid and not expiring soon, or if dismissed
  const shouldShow = !isDismissed && (licenseStatus.isExpiringSoon ?? !licenseStatus.isValid);

  if (!shouldShow) {
    return null;
  }

  // Determine alert status and content based on license state
  const getBannerConfig = () => {
    if (!licenseStatus.isValid) {
      return {
        status: 'error' as const,
        title: 'License Invalid',
        icon: FiXCircle,
        colors: {
          bg: errorBg,
          borderColor: errorBorder,
          color: errorColor
        },
        priority: 'high' as const
      };
    }
    
    // License is valid but expiring soon
    if (licenseStatus.daysUntilExpiry !== undefined && licenseStatus.daysUntilExpiry <= 1) {
      return {
        status: 'error' as const,
        title: 'License Expiry Critical',
        icon: FiAlertTriangle,
        colors: {
          bg: errorBg,
          borderColor: errorBorder,
          color: errorColor
        },
        priority: 'high' as const
      };
    }
    
    if (licenseStatus.daysUntilExpiry !== undefined && licenseStatus.daysUntilExpiry <= 3) {
      return {
        status: 'warning' as const,
        title: 'License Expiry Warning',
        icon: FiAlertTriangle,
        colors: {
          bg: warningBg,
          borderColor: warningBorder,
          color: warningColor
        },
        priority: 'medium' as const
      };
    }
    
    return {
      status: 'warning' as const,
      title: 'License Expiry Notice',
      icon: FiAlertTriangle,
      colors: {
        bg: warningBg,
        borderColor: warningBorder,
        color: warningColor
      },
      priority: 'low' as const
    };
  };

  const config = getBannerConfig();

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => setIsDismissed(true), 200); // Allow animation to complete
  };

  const handleRefresh = () => {
    if (onRefresh && !isRefreshing) {
      onRefresh();
    }
  };

  return (
    <Collapse in={isVisible} animateOpacity>
      <ScaleFade initialScale={0.95} in={isVisible}>
        <Box
          bg={config.colors.bg}
          borderTop="4px solid"
          borderColor={config.colors.borderColor}
          color={config.colors.color}
          px={4}
          py={3}
          position="relative"
          zIndex={1000}
          role="alert"
          aria-live={config.priority === 'high' ? 'assertive' : 'polite'}
          aria-label={`License ${config.status}: ${config.title}`}
        >
          <Flex align="center" justify="space-between">
            <Flex align="center" flex={1}>
              <Icon 
                as={config.icon} 
                boxSize={5} 
                mr={3} 
                aria-hidden="true"
                color={config.colors.color}
              />
              <Box flex={1}>
                <Box fontWeight="bold" fontSize="sm" mb={1}>
                  {config.title}
                </Box>
                <Box fontSize="sm">
                  {licenseStatus.warningMessage ?? 'Please contact support for assistance.'}
                </Box>
                {licenseStatus.expiryDate && (
                  <Box fontSize="xs" mt={1} opacity={0.8}>
                    Expires: {licenseStatus.expiryDate.toLocaleDateString()}
                    {licenseStatus.daysUntilExpiry !== undefined && (
                      <> ({licenseStatus.daysUntilExpiry} day{licenseStatus.daysUntilExpiry !== 1 ? 's' : ''} remaining)</>
                    )}
                  </Box>
                )}
              </Box>
            </Flex>
            
            <HStack spacing={2} ml={4}>
              {onRefresh && (
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<FiRefreshCw />}
                  onClick={handleRefresh}
                  isLoading={isRefreshing}
                  loadingText="Checking..."
                  color={config.colors.color}
                  _hover={{
                    bg: 'rgba(0, 0, 0, 0.1)'
                  }}
                  aria-label="Refresh license status"
                >
                  Refresh
                </Button>
              )}
              
              {dismissible && (
                <CloseButton
                  size="sm"
                  onClick={handleDismiss}
                  color={config.colors.color}
                  _hover={{
                    bg: 'rgba(0, 0, 0, 0.1)'
                  }}
                  aria-label="Dismiss license warning"
                />
              )}
            </HStack>
          </Flex>
        </Box>
      </ScaleFade>
    </Collapse>
  );
} 