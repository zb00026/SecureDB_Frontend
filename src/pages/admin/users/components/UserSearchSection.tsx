import {
  Flex, VStack, InputGroup, InputLeftElement, Input, IconButton, Tooltip, HStack, Text, Badge, useColorModeValue
} from "@chakra-ui/react";
import { CloseIcon, SearchIcon } from "@chakra-ui/icons";
import { FormattedMessage, useIntl } from "react-intl";

interface UserSearchSectionProps {
  readonly searchTerm: string;
  readonly isSearchActive: boolean;
  readonly usersCount: number;
  readonly suggestions: readonly string[];
  readonly onSearchChange: (value: string) => void;
  readonly onClearSearch: () => void;
}

export function UserSearchSection({
  searchTerm,
  isSearchActive,
  usersCount,
  suggestions,
  onSearchChange,
  onClearSearch
}: UserSearchSectionProps) {
  const intl = useIntl();
  const inputBg = useColorModeValue('white', 'gray.700');

  return (
    <Flex flex="1" justify="center" maxW={{ base: "100%", md: "400px" }} mx={4}>
      <VStack w="100%" spacing={2}>
        <InputGroup size="md" w="100%">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder={intl.formatMessage({ id: 'text.search_users_placeholder' })}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            bg={inputBg}
            border="1px solid"
            borderColor={isSearchActive ? 'blue.400' : 'gray.300'}
            _hover={{ borderColor: 'gray.400' }}
            _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px #3182ce' }}
            pr={searchTerm ? "40px" : "12px"}
          />
          {searchTerm && (
            <Tooltip label={intl.formatMessage({ id: 'text.search_clear' })} fontSize="xs">
              <IconButton
                aria-label={intl.formatMessage({ id: 'text.search_clear' })}
                icon={<CloseIcon />}
                size="xs"
                variant="ghost"
                position="absolute"
                right="8px"
                top="50%"
                transform="translateY(-50%)"
                onClick={onClearSearch}
                zIndex={2}
              />
            </Tooltip>
          )}
        </InputGroup>
        
        {/* Search Suggestions */}
        {searchTerm && suggestions.length > 0 && (
          <HStack spacing={2} w="100%" justify="flex-start" flexWrap="wrap">
            <Text fontSize="xs" color="gray.500">
              <FormattedMessage id="text.search_suggestions_try" />
            </Text>
            {suggestions.map((suggestion) => (
              <Badge
                key={suggestion}
                variant="outline"
                colorScheme="blue"
                cursor="pointer"
                fontSize="xs"
                onClick={() => onSearchChange(suggestion)}
                _hover={{ bg: 'blue.50' }}
              >
                {suggestion}
              </Badge>
            ))}
          </HStack>
        )}
        
        {/* Search Status */}
        {isSearchActive && (
          <Text fontSize="xs" color="blue.600" w="100%" textAlign="center">
            {usersCount} {usersCount === 1 
              ? intl.formatMessage({ id: 'text.search_results_count' })
              : intl.formatMessage({ id: 'text.search_results_count_plural' })
            } for "{searchTerm}"
          </Text>
        )}
      </VStack>
    </Flex>
  );
}

