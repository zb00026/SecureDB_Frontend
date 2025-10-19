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
  Container,
  Text,
  VStack,
  Divider,
  Icon
} from "@chakra-ui/react";
import useLogout from "@common/hooks/useLogout";
import { FormattedMessage } from "react-intl";
import { useMyState } from "@common/state";
import { Link, useLocation } from "react-router-dom";
import { FiMoon, FiSun, FiLogOut, FiHome, FiMenu, FiChevronLeft, FiDatabase, FiUsers, FiShield, FiSettings, FiBarChart, FiTerminal, FiUser, FiHardDrive, FiKey, FiCheckCircle } from 'react-icons/fi';
import { useLicenseStatus } from "@common/hooks/useLicenseStatus";
import { DamLicenseBanner } from "@common/components/DamLicenseBanner";
import { useState, useMemo } from "react";
import { USER_ROLE } from "@/constants/enums";
import { userHasRole } from "@common/index";

export type DamPageProps = Readonly<{
  title: string;
  children?: any;
  hasBody?: boolean;
}>;

// Utility function to determine if a navigation item should be highlighted
function isNavigationItemActive(
  currentPath: string, 
  itemPath: string, 
  allNavLinks: Array<{ to: string }>
): boolean {
  // Exact match always wins
  if (currentPath === itemPath) {
    return true;
  }

  // Check if current path starts with item path (prefix match)
  const isPrefixMatch = itemPath !== '/' && 
    currentPath.startsWith(itemPath) && 
    (currentPath.length === itemPath.length || currentPath[itemPath.length] === '/');

  if (!isPrefixMatch) {
    return false;
  }

  // For prefix matches, check if there's a more specific match available
  const hasMoreSpecificMatch = allNavLinks.some(otherItem => 
    otherItem.to !== itemPath && 
    otherItem.to.startsWith(itemPath) && 
    currentPath.startsWith(otherItem.to) &&
    otherItem.to.length > itemPath.length
  );

  // Only highlight if there's no more specific match
  return !hasMoreSpecificMatch;
}

export function DamBasePage({
  title,
  children,
  hasBody = true
}: DamPageProps) {
  const logout = useLogout();
  const { colorMode, toggleColorMode } = useColorMode();
  const location = useLocation();
  const { licenseStatus } = useLicenseStatus();
  const { snap } = useMyState();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('dam_sidebar_collapsed') === '1';
    } catch {
      return false;
    }
  });
  const toggleSidebar = () => {
    const next = !isSidebarCollapsed;
    setIsSidebarCollapsed(next);
    try {
      localStorage.setItem('dam_sidebar_collapsed', next ? '1' : '0');
    } catch {}
  };
  const user = snap.session.user;
  const roleIcons: Record<string, any> = {
    'developer': FiDatabase,
    'auditor': FiShield,
    'approver': FiCheckCircle,
    'asset_owner': FiUsers,
  };
  const isAdmin = user && userHasRole(user, USER_ROLE.ADMIN);
  const navLinks = useMemo(() => {
    const links: Array<{ label: string; to: string; icon: any }> = [
      { label: 'Dashboard', to: '/', icon: FiHome },
    ];

    if (user?.roles) {
      const filteredRoles = user.roles
        .filter((r: any) => (r.name || '').toLowerCase() !== 'admin' && (r.name || '').toLowerCase() !== 'none');
      
      for (const role of filteredRoles) {
        const roleName = (role.name || '').toLowerCase().replace(' ', '_');
        links.push({
          label: role.name,
          to: `/${roleName}`,
          icon: roleIcons[roleName] || FiDatabase,
        });
      }
    }

    if (isAdmin) {
      links.push(
        { label: 'Users', to: '/admin/users', icon: FiUser },
        { label: 'Settings', to: '/admin/settings', icon: FiSettings },
        { label: 'Assets', to: '/admin/assets', icon: FiHardDrive },
        { label: 'License', to: '/admin/license', icon: FiKey },
      );
    }

    const canSeeAuditTrail = user && (userHasRole(user, USER_ROLE.ADMIN) || userHasRole(user, USER_ROLE.AUDITOR) || userHasRole(user, USER_ROLE.ASSET_OWNER) || userHasRole(user, USER_ROLE.APPROVER));
    if (canSeeAuditTrail) {
      links.push({ label: 'Audit Trail', to: '/auditor/audit-trail', icon: FiBarChart });
    }
    const canSeeTerminal = user && (userHasRole(user, USER_ROLE.ADMIN) || userHasRole(user, USER_ROLE.AUDITOR));
    if (canSeeTerminal) {
      links.push({ label: 'Terminal Audit', to: '/auditor/terminal-audit', icon: FiTerminal });
    }
    const canSeeUnixGroups = user && userHasRole(user, USER_ROLE.ASSET_OWNER);
    if (canSeeUnixGroups) {
      links.push({ label: 'Unix Groups', to: '/asset_owner/unix-groups', icon: FiUsers });
    }

    return links;
  }, [user, isAdmin]);
  
  const headerBg = useColorModeValue('white', 'gray.800');
  const headerBorderColor = useColorModeValue('gray.200', 'gray.700');
  const contentBg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  
  // Generate breadcrumb from current path
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbItems = [
    { label: 'Dashboard', href: '/', icon: FiHome },
    ...pathSegments.map((segment, index) => ({
      label: segment.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
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
        <Container maxW="95%" px={6} py={4}>
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

            {/* Center - intentionally left blank to remove page title while keeping layout */}
            <Box flex={1} />

            {/* Right side - Actions */}
            <HStack spacing={3} flex={1} justify="flex-end">
              {/* Display logged-in user name/email */}
              <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }} mb={0}>
                {snap.session.user?.name ?? snap.session.user?.email}
              </Text>
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

      {/* License Expiry Banner */}
      {licenseStatus && <DamLicenseBanner licenseStatus={licenseStatus} />}

      {/* Main Content with Sidebar Navigation */}
      <Container maxW="100%" px={{ base: 2, md: 6 }} py={{ base: 4, md: 8 }}>
        <Flex align="flex-start" gap={{ base: 3, md: 6 }}>
          {/* Left Navigation */}
          <Box as="nav"
            position="sticky"
            top="72px"
            alignSelf="flex-start"
            bg={headerBg}
            border="1px solid"
            borderColor={headerBorderColor}
            borderRadius="xl"
            boxShadow="sm"
            w={{ base: isSidebarCollapsed ? '56px' : '200px', md: isSidebarCollapsed ? '64px' : '260px' }}
            transition="width 0.2s ease-in-out"
            flexShrink={0}
          >
            <VStack align="stretch" spacing={1} p={2}>
              <Button onClick={toggleSidebar} variant="ghost" size="sm" leftIcon={isSidebarCollapsed ? <FiMenu /> : <FiChevronLeft />} justifyContent={isSidebarCollapsed ? 'center' : 'flex-start'}>
                {isSidebarCollapsed ? '' : 'Collapse'}
              </Button>
              <Divider />
              {navLinks.map((item) => {
                const isActive = isNavigationItemActive(location.pathname, item.to, navLinks);
                return (
                  <Button
                    key={item.to}
                    as={Link}
                    to={item.to}
                    variant={isActive ? 'solid' : 'ghost'}
                    colorScheme={isActive ? 'blue' : 'gray'}
                    size="sm"
                    justifyContent={isSidebarCollapsed ? 'center' : 'flex-start'}
                    leftIcon={<Icon as={item.icon} />}
                  >
                    {isSidebarCollapsed ? '' : item.label}
                  </Button>
                );
              })}
            </VStack>
          </Box>

          {/* Page Content */}
          <Box flex={1} minW={0}>
            {hasBody ? (
              <Box
                bg={cardBg}
                borderRadius="2xl"
                boxShadow="lg"
                border="1px solid"
                borderColor={headerBorderColor}
                overflowX="auto"
                overflowY="hidden"
                transition="all 0.2s ease-in-out"
                _hover={{
                  boxShadow: 'xl',
                }}
              >
                {/* Content with proper padding */}
                <Box p={{ base: 4, md: 8 }} minW={0}>
                  {children}
                </Box>
              </Box>
            ) : (
              // No wrapper for custom layouts like dashboard
              <Box minW={0} overflowX="auto">
                {children}
              </Box>
            )}
          </Box>
        </Flex>
      </Container>
    </Box>
  );
}