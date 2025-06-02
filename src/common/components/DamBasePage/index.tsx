import { 
  Flex, 
  Box, 
  HStack, 
  Heading, 
  Button, 
  useColorModeValue, 
  IconButton, 
  useColorMode,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Container
} from "@chakra-ui/react";
import useLogout from "@common/hooks/useLogout";
import { FormattedMessage } from "react-intl";
import { Link, useLocation } from "react-router-dom";
import { FiMoon, FiSun, FiLogOut, FiHome } from 'react-icons/fi';

export type DamPageProps = Readonly<{
  title: string;
  children?: any;
  hasBody?: boolean;
}>;

export function DamBasePage({
  title,
  children,
  hasBody = true
}: DamPageProps) {
  const logout = useLogout();
  const { colorMode, toggleColorMode } = useColorMode();
  const location = useLocation();
  
  const headerBg = useColorModeValue('white', 'gray.800');
  const headerBorderColor = useColorModeValue('gray.200', 'gray.700');
  const contentBg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  
  // Generate breadcrumb from current path
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbItems = [
    { label: 'Dashboard', href: '/', icon: FiHome },
    ...pathSegments.map((segment, index) => ({
      label: segment.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      href: '/' + pathSegments.slice(0, index + 1).join('/'),
    }))
  ];

  return (
    <Box bg={contentBg} minH="100vh">
      {/* Modern Header */}
      <Box
        bg={headerBg}
        borderBottom="1px solid"
        borderColor={headerBorderColor}
        position="sticky"
        top={0}
        zIndex={10}
        backdropFilter="blur(10px)"
        boxShadow="sm"
      >
        <Container maxW="7xl" px={6} py={4}>
          <Flex justify="space-between" align="center">
            {/* Left side - Breadcrumb Navigation */}
            <HStack spacing={4} flex={1}>
              <Breadcrumb separator="/" fontSize="sm" color="gray.500">
                {breadcrumbItems.slice(0, -1).map((item, index) => (
                  <BreadcrumbItem key={item.href + "::" + item.label}>
                    <BreadcrumbLink 
                      as={Link} 
                      to={item.href}
                      _hover={{ color: 'brand.500' }}
                      display="flex"
                      alignItems="center"
                      gap={1}
                    >
                      {index === 0 && <FiHome size={14} />}
                      {item.label}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                ))}
                <BreadcrumbItem isCurrentPage>
                  <BreadcrumbLink 
                    color="gray.700" 
                    _dark={{ color: 'gray.300' }} 
                    fontWeight="500"
                    display="flex"
                    alignItems="center"
                    cursor="default"
                    _hover={{ color: "gray.700", textDecoration: "none" }}
                    
                  >
                    {breadcrumbItems[breadcrumbItems.length - 1]?.label ?? title}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </Breadcrumb>
            </HStack>

            {/* Center - Page Title */}
            <Heading 
              size="lg" 
              textAlign="center" 
              color="gray.800" 
              _dark={{ color: 'gray.100' }}
              fontWeight="700"
              flex={1}
            >
              {title}
            </Heading>

            {/* Right side - Actions */}
            <HStack spacing={3} flex={1} justify="flex-end">
              <IconButton
                aria-label="Toggle color mode"
                icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
                onClick={toggleColorMode}
                variant="ghost"
                size="sm"
                _hover={{
                  bg: useColorModeValue('gray.100', 'gray.700'),
                }}
              />
              
              <Button
                onClick={logout}
                variant="ghost"
                colorScheme="red"
                size="sm"
                leftIcon={<FiLogOut />}
                _hover={{
                  bg: 'red.50',
                  color: 'red.600',
                }}
                _dark={{
                  _hover: {
                    bg: 'red.900',
                    color: 'red.300',
                  }
                }}
              >
                <FormattedMessage id="text.logout" />
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="7xl" px={6} py={8}>
        {hasBody ? (
          <Box
            bg={cardBg}
            borderRadius="2xl"
            boxShadow="lg"
            border="1px solid"
            borderColor={headerBorderColor}
            overflow="hidden"
            transition="all 0.2s ease-in-out"
            _hover={{
              boxShadow: 'xl',
            }}
          >
            {/* Content with proper padding */}
            <Box p={8}>
              {children}
            </Box>
          </Box>
        ) : (
          // No wrapper for custom layouts like dashboard
          <Box>
            {children}
          </Box>
        )}
      </Container>
    </Box>
  );
}