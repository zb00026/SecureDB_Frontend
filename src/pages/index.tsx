import { USER_ROLE } from "@/constants/enums";
import { 
  Box, 
  Heading, 
  Text, 
  Icon, 
  useColorModeValue,
  VStack,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  List,
  ListItem,
  Kbd,
  Flex
} from "@chakra-ui/react";
import { DamBasePage } from "@common/components/DamBasePage";
import { useMyState, isAuthorizedPath } from "@common/index";
import { useIntl } from "react-intl";
import { useNavigate } from 'react-router-dom';
import { 
  FiSearch,
  FiCommand
} from 'react-icons/fi';
import { useState, useEffect, useRef } from 'react';
import { PageRoute } from "@models/PageRoute";

export const name = 'Dashboard';

// These constants are no longer needed since we removed the card-based layout

export function Component() {
  const { snap } = useMyState();
  const navigate = useNavigate();
  const intl = useIntl();
  const inputRef = useRef<HTMLInputElement>(null);

  const user = snap.session.user;
  const pageRoutes = snap.storage.pageRoutes;
  
  const [query, setQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<PageRoute[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const selectedBg = useColorModeValue('brand.50', 'brand.900');
  const selectedBorderColor = useColorModeValue('brand.500', 'brand.400');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const subtleTextColor = useColorModeValue('gray.600', 'gray.400');
  const kbdBg = useColorModeValue('gray.100', 'gray.700');

  // Helper function to filter searchable routes
  const getFilteredRoutes = (searchQuery: string) => {
    return pageRoutes
      .filter((route: PageRoute) => {
        // Only show searchable routes that user has access to
        return route.isSearchable && 
               isAuthorizedPath(route.path, user) &&
               route.title.toLowerCase().includes(searchQuery);
      })
      .slice(0, 8); // Limit to 8 results
  };

  // Filter and search pages
  useEffect(() => {
    if (!query.trim()) {
      setFilteredItems([]);
      setSelectedIndex(0);
      return;
    }

    const searchQuery = query.toLowerCase();
    const filtered = getFilteredRoutes(searchQuery);
    setFilteredItems(filtered);
    setSelectedIndex(0);
  }, [query, pageRoutes, user]);

  // Helper function to handle keyboard navigation
  const handleKeyboardNavigation = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setQuery('');
      setSelectedIndex(0);
      return;
    }

    if (!filteredItems.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      e.preventDefault();
      navigate(filteredItems[selectedIndex].path);
      setQuery('');
    }
  };

  // Keyboard navigation
  useEffect(() => {
    globalThis.addEventListener('keydown', handleKeyboardNavigation);
    return () => globalThis.removeEventListener('keydown', handleKeyboardNavigation);
  }, [filteredItems, selectedIndex, navigate, query]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleItemClick = (path: string) => {
    navigate(path);
    setQuery('');
  };

  return (
    <DamBasePage
      title={intl.formatMessage({ id: 'text.dashboard' })}
      hasBody={false}>
      
      {/* Spotlight Search */}
      <VStack spacing={4} align="stretch" maxW="800px" mx="auto" mt={20} minH="100vh" position="relative" overflow="visible">
        <Box position="relative" overflow="visible">
          <InputGroup size="lg">
            <InputLeftElement pointerEvents="none" height="100%">
              <Icon as={FiSearch} color={subtleTextColor} boxSize={6} />
            </InputLeftElement>
            <Input
              ref={inputRef}
              placeholder="Search for pages, dashboards, and settings..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              bg={cardBg}
              borderColor={borderColor}
              borderWidth="2px"
              borderRadius="xl"
              fontSize="lg"
              height="70px"
              pl="60px"
              pr="120px"
              color={textColor}
              _hover={{
                borderColor: 'brand.400',
              }}
              _focus={{
                borderColor: 'brand.500',
                boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.15)',
              }}
              _placeholder={{
                color: subtleTextColor,
              }}
            />
            <Box
              position="absolute"
              right={4}
              top="50%"
              transform="translateY(-50%)"
              display="flex"
              alignItems="center"
              gap={2}
            >
              <Flex align="center" gap={1}>
                <Kbd fontSize="sm" bg={kbdBg}>
                  <Icon as={FiCommand} boxSize={3} />
                </Kbd>
                <Kbd fontSize="sm" bg={kbdBg}>K</Kbd>
              </Flex>
            </Box>
          </InputGroup>

          {/* Search Results */}
          {filteredItems.length > 0 && (
            <Box
              position="absolute"
              top="calc(100% + 8px)"
              left={0}
              right={0}
              bg={cardBg}
              borderRadius="xl"
              borderWidth="2px"
              borderColor={borderColor}
              boxShadow="2xl"
              overflow="hidden"
              zIndex={9999}
            >
              <List spacing={0}>
                {filteredItems.map((item, index) => (
                  <ListItem
                    key={item.path}
                    onClick={() => handleItemClick(item.path)}
                    cursor="pointer"
                    px={6}
                    py={4}
                    bg={index === selectedIndex ? selectedBg : 'transparent'}
                    borderLeftWidth="4px"
                    borderLeftColor={index === selectedIndex ? selectedBorderColor : 'transparent'}
                    transition="all 0.15s ease"
                    _hover={{
                      bg: selectedBg,
                      borderLeftColor: selectedBorderColor,
                    }}
                  >
                    <Flex justify="space-between" align="center">
                      <VStack align="start" spacing={0}>
                        <Text fontSize="md" fontWeight="600" color={textColor} mb={0}>
                          {item.title}
                        </Text>
                        <Text fontSize="sm" color={subtleTextColor} mb={0}>
                          {item.path}
                        </Text>
                      </VStack>
                      {index === selectedIndex && (
                        <Kbd fontSize="xs">Enter</Kbd>
                      )}
                    </Flex>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Box>

        {/* Hints */}
        <Flex
          justify="center"
          gap={6}
          mt={8}
          fontSize="sm"
          color={subtleTextColor}
          flexWrap="wrap"
        >
          <Flex align="center" gap={2}>
            <Kbd fontSize="xs">↑↓</Kbd>
            <Text mb={0}>Navigate</Text>
          </Flex>
          <Flex align="center" gap={2}>
            <Kbd fontSize="xs">Enter</Kbd>
            <Text mb={0}>Select</Text>
          </Flex>
          <Flex align="center" gap={2}>
            <Kbd fontSize="xs">Esc</Kbd>
            <Text mb={0}>Clear</Text>
          </Flex>
        </Flex>
      </VStack>
    </DamBasePage>
  );
}