import { USER_ROLE } from "@/constants/enums";
import { 
  Box, 
  Grid, 
  GridItem, 
  Heading, 
  Text, 
  Icon, 
  useColorModeValue,
  VStack,
  HStack,
  Badge,
  Button,
  Card,
  CardBody,
  Avatar,
  AvatarBadge
} from "@chakra-ui/react";
import { DamBasePage } from "@common/components/DamBasePage";
import { useMyState, userHasRole } from "@common/index";
import { Role } from "@models/Role";
import { FormattedMessage, useIntl } from "react-intl";
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiDatabase, 
  FiUsers, 
  FiShield, 
  FiSettings, 
  FiActivity, 
  FiBarChart,
  FiClock,
  FiCheckCircle,
  FiUser,
  FiHardDrive,
  FiKey
} from 'react-icons/fi';

export const name = 'Dashboard';

// Role icon mapping for better visual identification
const roleIcons: Record<string, any> = {
  'developer': FiDatabase,
  'auditor': FiShield,
  'approver': FiCheckCircle,
  'asset_owner': FiUsers,
};

// Role color mapping for consistent theming
const roleColors: Record<string, string> = {
  'developer': 'blue',
  'auditor': 'purple',
  'approver': 'green',
  'asset_owner': 'orange',
};

// Admin navigation items
const adminNavItems = [
  {
    id: 'users',
    titleId: 'text.users',
    description: 'Manage user accounts and permissions',
    icon: FiUser,
    colorScheme: 'red',
    href: '/admin/users'
  },
  {
    id: 'settings',
    titleId: 'text.settings', 
    description: 'Configure system settings',
    icon: FiSettings,
    colorScheme: 'gray',
    href: '/admin/settings'
  },
  {
    id: 'assets',
    titleId: 'text.assets',
    description: 'Manage database assets',
    icon: FiHardDrive,
    colorScheme: 'teal',
    href: '/admin/assets'
  },
  {
    id: 'license',
    titleId: 'text.license',
    description: 'Manage license files and settings',
    icon: FiKey,
    colorScheme: 'purple',
    href: '/admin/license'
  }
];

export function Component() {
  const { snap } = useMyState()
  const navigate = useNavigate();
  const intl = useIntl();

  const user = snap.session.user;
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorderColor = useColorModeValue('gray.200', 'gray.700');
  const gradientBg = useColorModeValue(
    'linear(to-r, brand.500, brand.600)',
    'linear(to-r, brand.600, brand.700)'
  );

  if (!user?.roles?.length) {
    navigate('/error/forbidden');
    return;
  }

  // Filter out admin role for regular role display since we handle admin separately
  const nonAdminRoles = user.roles.filter((role: Role) => role.name.toLowerCase() !== 'admin');
  const isAdmin = userHasRole(user, USER_ROLE.ADMIN);

  // Helper function to get audit trail description based on user role
  const getAuditTrailDescription = () => {
    if (userHasRole(user, USER_ROLE.ADMIN) || userHasRole(user, USER_ROLE.AUDITOR)) {
      return 'View all system audit logs';
    }
    if (userHasRole(user, USER_ROLE.ASSET_OWNER)) {
      return 'View audit logs for your assets';
    }
    return 'View audit logs for approved assets';
  };

  return (
    <DamBasePage
      title={intl.formatMessage({ id: 'text.dashboard' })}
      hasBody={false}>
      
      {/* Hero Section */}
      <Box
        bgGradient={gradientBg}
        borderRadius="2xl"
        p={8}
        mb={8}
        color="white"
        position="relative"
        overflow="hidden"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgGradient: 'linear(45deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
          animation: 'shimmer 3s ease-in-out infinite',
        }}
      >
        <HStack spacing={6} align="center">
          <Avatar size="xl" name={user.name ?? user.email}>
            <AvatarBadge boxSize="1.25em" bg="green.500" />
          </Avatar>
          <VStack align="start" spacing={2}>
            <Heading size="lg" fontWeight="700">
              Welcome back, {user.name ?? user.email}
            </Heading>
            <Text fontSize="lg" opacity={0.9}>
              Database Access Management System
            </Text>
            <HStack spacing={2}>
              {user.roles.map((role: Role) => {
                const roleKey = role.name.toLowerCase().replace(" ", "_");
                return (
                  <Badge
                    key={role.id}
                    colorScheme={roleColors[roleKey] ?? 'blue'}
                    variant="subtle"
                    px={3}
                    py={1}
                    borderRadius="full"
                    textTransform="capitalize"
                  >
                    {role.name}
                  </Badge>
                );
              })}
            </HStack>
          </VStack>
        </HStack>
      </Box>

      {/* Role-based Actions */}
      <VStack spacing={6} align="stretch">
        <Heading size="md" color="gray.700" _dark={{ color: 'gray.300' }}>
          Quick Actions
        </Heading>
        
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
          {/* Non-Admin Role Cards */}
          {nonAdminRoles.map((role: Role) => {
            const roleName = role.name.toLowerCase().replace(" ", "_");
            const IconComponent = roleIcons[roleName] ?? FiDatabase;
            const colorScheme = roleColors[roleName] ?? 'blue';
            
            return (
              <GridItem key={role.id}>
                <Card
                  variant="elevated"
                  bg={cardBg}
                  borderColor={cardBorderColor}
                  transition="all 0.2s ease-in-out"
                  _hover={{
                    transform: 'translateY(-4px)',
                    boxShadow: 'xl',
                    borderColor: `${colorScheme}.300`,
                  }}
                  cursor="pointer"
                  as={Link}
                  to={"/" + roleName}
                >
                  <CardBody>
                    <VStack spacing={4} align="center" py={4}>
                      <Box
                        p={4}
                        bg={`${colorScheme}.50`}
                        borderRadius="2xl"
                        _dark={{ bg: `${colorScheme}.900` }}
                      >
                        <Icon
                          as={IconComponent}
                          boxSize={8}
                          color={`${colorScheme}.500`}
                        />
                      </Box>
                      <VStack spacing={2} textAlign="center">
                        <Heading size="sm" textTransform="capitalize">
                          <FormattedMessage id={"text." + roleName} />
                        </Heading>
                        <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                          Access {role.name.toLowerCase()} dashboard
                        </Text>
                      </VStack>
                      <Button
                        variant="ghost"
                        colorScheme={colorScheme}
                        size="sm"
                        rightIcon={<Icon as={FiActivity} />}
                      >
                        Open Dashboard
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              </GridItem>
            );
          })}

          {/* Admin Navigation Cards */}
          {isAdmin && adminNavItems.map((item) => (
            <GridItem key={item.id}>
              <Card
                variant="elevated"
                bg={cardBg}
                borderColor={cardBorderColor}
                transition="all 0.2s ease-in-out"
                _hover={{
                  transform: 'translateY(-4px)',
                  boxShadow: 'xl',
                  borderColor: `${item.colorScheme}.300`,
                }}
                cursor="pointer"
                as={Link}
                to={item.href}
              >
                <CardBody>
                  <VStack spacing={4} align="center" py={4}>
                    <Box
                      p={4}
                      bg={`${item.colorScheme}.50`}
                      borderRadius="2xl"
                      _dark={{ bg: `${item.colorScheme}.900` }}
                    >
                      <Icon
                        as={item.icon}
                        boxSize={8}
                        color={`${item.colorScheme}.500`}
                      />
                    </Box>
                    <VStack spacing={2} textAlign="center">
                      <Heading size="sm">
                        <FormattedMessage id={item.titleId} />
                      </Heading>
                      <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                        {item.description}
                      </Text>
                    </VStack>
                    <Button
                      variant="ghost"
                      colorScheme={item.colorScheme}
                      size="sm"
                      rightIcon={<Icon as={FiActivity} />}
                    >
                      Manage
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            </GridItem>
          ))}
          
          {/* Audit Trail Card (if user has permission) */}
          {(userHasRole(user, USER_ROLE.AUDITOR) || 
            userHasRole(user, USER_ROLE.ADMIN) || 
            userHasRole(user, USER_ROLE.ASSET_OWNER) || 
            userHasRole(user, USER_ROLE.APPROVER)) && (
            <GridItem>
              <Card
                variant="elevated"
                bg={cardBg}
                borderColor={cardBorderColor}
                transition="all 0.2s ease-in-out"
                _hover={{
                  transform: 'translateY(-4px)',
                  boxShadow: 'xl',
                  borderColor: 'purple.300',
                }}
                cursor="pointer"
                as={Link}
                to="/auditor/audit-trail"
              >
                <CardBody>
                  <VStack spacing={4} align="center" py={4}>
                    <Box
                      p={4}
                      bg="purple.50"
                      borderRadius="2xl"
                      _dark={{ bg: 'purple.900' }}
                    >
                      <Icon
                        as={FiBarChart}
                        boxSize={8}
                        color="purple.500"
                      />
                    </Box>
                    <VStack spacing={2} textAlign="center">
                      <Heading size="sm">
                        <FormattedMessage id="text.audit_trail" />
                      </Heading>
                      <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                        {getAuditTrailDescription()}
                      </Text>
                    </VStack>
                    <Button
                      variant="ghost"
                      colorScheme="purple"
                      size="sm"
                      rightIcon={<Icon as={FiClock} />}
                    >
                      View Logs
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            </GridItem>
          )}
        </Grid>
      </VStack>
    </DamBasePage>
  );
}