import { 
  Flex,
  Box,
  VStack,
  Heading,
  Text,
  useColorModeValue,
  Container,
  Icon
} from "@chakra-ui/react";
import { FiShield } from 'react-icons/fi';
import { ReactNode } from "react";

interface AuthLayoutProps {
  readonly children: ReactNode;
  readonly title?: string;
  readonly subtitle?: string;
}

export default function DamAuthLayout({ children, title = "Hagrid", subtitle = "Secure, auditable, and controlled access to your enterprise databases" }: AuthLayoutProps) {
  const bgGradient = useColorModeValue(
    'linear(to-br, blue.50, purple.50, brand.50)',
    'linear(to-br, gray.900, blue.900, purple.900)'
  );

  return (
    <Box 
      height="100vh" 
      bgGradient={bgGradient}
      position="relative"
      overflow="hidden"
      _before={{
        content: '""',
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: `radial-gradient(circle, rgba(79, 172, 254, 0.1) 0%, transparent 50%)`,
        animation: 'pulse 4s ease-in-out infinite',
      }}
    >
      <Container maxW="container.xl" h="full">
        <Flex 
          align="center" 
          justify="center" 
          h="full"
          position="relative"
          zIndex={1}
        >
          {/* Hero Section - Left Side */}
          <Box flex="1" pr={{ base: 0, lg: 12 }} mb={{ base: 8, lg: 0 }}>
            <VStack spacing={6} align={{ base: 'center', lg: 'start' }} textAlign={{ base: 'center', lg: 'left' }}>
              <Box position="relative">
                <Icon 
                  as={FiShield} 
                  boxSize={12} 
                  color="brand.500"
                  filter="drop-shadow(0 4px 12px rgba(79, 172, 254, 0.3))"
                />
                <Box
                  position="absolute"
                  top="50%"
                  left="50%"
                  transform="translate(-50%, -50%)"
                  p={3}
                  bg="brand.500"
                  borderRadius="full"
                  opacity={0.1}
                  animation="pulse 2s ease-in-out infinite"
                />
              </Box>
              
              <VStack spacing={3} align={{ base: 'center', lg: 'start' }}>
                <Heading 
                  size="2xl" 
                  bgGradient="linear(to-r, brand.500, purple.500)"
                  bgClip="text"
                  fontWeight="800"
                  lineHeight="1.2"
                >
                  {title}
                </Heading>
                <Text 
                  fontSize="lg" 
                  color="gray.600" 
                  _dark={{ color: 'gray.400' }}
                  maxW="md"
                >
                  {subtitle}
                </Text>
              </VStack>
            </VStack>
          </Box>

          {/* Auth Card - Right Side */}
          <Box w={{ base: 'full', lg: 'md' }} maxW="md">
            {children}
          </Box>
        </Flex>
      </Container>
    </Box>
  );
} 