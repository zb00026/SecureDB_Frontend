import {
  Box,
  Flex,
  Input,
  List,
  ListItem,
  VStack,
  InputGroup,
  InputLeftElement,
  Icon,
  useColorModeValue,
  Kbd,
  Text
} from "@chakra-ui/react";
import { getMetaKeyName } from "@common/index";
import { PageRoute } from "@models/PageRoute";
import { useMemo, forwardRef } from "react";
import { FiSearch, FiCommand } from 'react-icons/fi';

export interface SpotlightSearchProps {
  readonly query: string;
  readonly onQueryChange: (value: string) => void;
  readonly filteredItems: readonly PageRoute[];
  readonly selectedIndex: number;
  readonly onItemClick: (path: string) => void;
  readonly shortcutDisplay: readonly string[];
  readonly inputRef?: React.RefObject<HTMLInputElement>;
  readonly autoFocus?: boolean;
  readonly showHints?: boolean;
}

export const SpotlightSearch = forwardRef<HTMLInputElement, SpotlightSearchProps>(({
  query,
  onQueryChange,
  filteredItems,
  selectedIndex,
  onItemClick,
  shortcutDisplay,
  inputRef,
  autoFocus = false,
  showHints = true
}, ref) => {
  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const selectedBg = useColorModeValue('brand.50', 'brand.900');
  const selectedBorderColor = useColorModeValue('brand.500', 'brand.400');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const subtleTextColor = useColorModeValue('gray.600', 'gray.400');
  const kbdBg = useColorModeValue('gray.100', 'gray.700');

  const metaKeyName = useMemo(() => getMetaKeyName(), []);

  return (
    <VStack spacing={4} align="stretch" position="relative" overflow="visible">
      <Box position="relative" overflow="visible">
        <InputGroup size="lg">
          <InputLeftElement pointerEvents="none" height="100%">
            <Icon as={FiSearch} color={subtleTextColor} boxSize={6} />
          </InputLeftElement>
          <Input
            ref={ref || inputRef}
            autoFocus={autoFocus}
            placeholder="Search for pages, dashboards, and settings..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
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
          {shortcutDisplay.length > 0 && (
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
                {shortcutDisplay.map((key) => {
                  const isMetaKey = key === metaKeyName || key === '⌘' || key === '⊞';
                  return (
                    <Kbd key={`shortcut-key-${key}`} fontSize="sm" bg={kbdBg}>
                      {isMetaKey ? (
                        <Icon as={FiCommand} boxSize={3} />
                      ) : (
                        key
                      )}
                    </Kbd>
                  );
                })}
              </Flex>
            </Box>
          )}
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
                  onClick={() => onItemClick(item.path)}
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
      {showHints && (
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
      )}
    </VStack>
  );
});

SpotlightSearch.displayName = 'SpotlightSearch';

