import { Box, Button, Text, Flex, Input, FormControl, FormLabel, HStack } from "@chakra-ui/react";
import { DamButton } from "@common/index";
import { Role } from "@models/Role";
import { FormattedMessage } from "react-intl";
import { MultiValue, Select } from 'chakra-react-select';
import { RoleOption } from '../index';

interface UserFormProps {
  readonly isHorizontal: boolean;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly selectedRoles: Array<Role>;
  readonly roleOptions: Array<RoleOption>;
  readonly firstNameError: string;
  readonly lastNameError: string;
  readonly emailError: string;
  readonly isEdit: boolean;
  readonly onFirstNameChange: (value: string) => void;
  readonly onLastNameChange: (value: string) => void;
  readonly onEmailChange: (value: string) => void;
  readonly onRoleChange: (selectedOptions: MultiValue<RoleOption>) => void;
  readonly onSave: () => void;
  readonly onCancel: () => void;
}

export function UserForm({
  isHorizontal,
  firstName,
  lastName,
  email,
  selectedRoles,
  roleOptions,
  firstNameError,
  lastNameError,
  emailError,
  isEdit,
  onFirstNameChange,
  onLastNameChange,
  onEmailChange,
  onRoleChange,
  onSave,
  onCancel
}: UserFormProps) {
  const renderHorizontalForm = () => (
    <>
      {/* Name and Email fields in a row */}
      <Flex gap={4} wrap="wrap">
        <FormControl isInvalid={!!firstNameError} flex={{ base: "1 1 100%", lg: "0 1 300px" }}>
          <HStack spacing={2} align="center">
            <FormLabel mb={0} minW="80px" flexShrink={0}>
              <FormattedMessage id="text.first_name" />
            </FormLabel>
            <Box flex={1} minW={0}>
              <Input
                id="inputFirstName"
                value={firstName}
                onChange={(e) => onFirstNameChange(e.target.value)}
                borderColor={firstNameError ? 'red.300' : undefined}
              />
              {firstNameError && (
                <Text fontSize="xs" color="red.500" mt={1}>
                  {firstNameError}
                </Text>
              )}
            </Box>
          </HStack>
        </FormControl>
        <FormControl isInvalid={!!lastNameError} flex={{ base: "1 1 100%", lg: "0 1 300px" }}>
          <HStack spacing={2} align="center">
            <FormLabel mb={0} minW="80px" flexShrink={0}>
              <FormattedMessage id="text.last_name" />
            </FormLabel>
            <Box flex={1} minW={0}>
              <Input
                id="inputLastName"
                value={lastName}
                onChange={(e) => onLastNameChange(e.target.value)}
                borderColor={lastNameError ? 'red.300' : undefined}
              />
              {lastNameError && (
                <Text fontSize="xs" color="red.500" mt={1}>
                  {lastNameError}
                </Text>
              )}
            </Box>
          </HStack>
        </FormControl>
        <FormControl isInvalid={!!emailError} flex={{ base: "1 1 100%", lg: "0 1 400px" }}>
          <HStack spacing={2} align="center">
            <FormLabel mb={0} minW="80px" flexShrink={0}>
              <FormattedMessage id="text.email" />
            </FormLabel>
            <Box flex={1} minW={0}>
              <Input
                id="inputEmail"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                borderColor={emailError ? 'red.300' : undefined}
              />
              {emailError && (
                <Text fontSize="xs" color="red.500" mt={1}>
                  {emailError}
                </Text>
              )}
            </Box>
          </HStack>
        </FormControl>
      </Flex>
      
      {/* Role field below the first name row */}
      <FormControl>
        <HStack spacing={2} align="center">
          <FormLabel mb={0} minW="80px" flexShrink={0}>
            <FormattedMessage id="text.role" />
          </FormLabel>
          <Box flex={1} minW={0} maxW={{ base: "100%", lg: "500px" }}>
            <Select
              id="selectRoles"
              isMulti
              value={selectedRoles.map(role => ({ label: role.name, value: role.id.toString() }))}
              options={roleOptions}
              onChange={onRoleChange}
              placeholder=""
              closeMenuOnSelect={false}
              isSearchable={false}
              size="md"
              chakraStyles={{
                container: (provided) => ({
                  ...provided,
                  width: "100%"
                })
              }}
            />
          </Box>
        </HStack>
      </FormControl>
    </>
  );

  const renderVerticalForm = () => (
    <Flex gap={4} direction="column">
      <FormControl w='full' isInvalid={!!firstNameError}>
        <FormLabel mb={1}>
          <FormattedMessage id="text.first_name" />
        </FormLabel>
        <Input
          id="inputFirstName"
          value={firstName}
          onChange={(e) => onFirstNameChange(e.target.value)}
          borderColor={firstNameError ? 'red.300' : undefined}
        />
        {firstNameError && (
          <Text fontSize="xs" color="red.500" mt={1}>
            {firstNameError}
          </Text>
        )}
      </FormControl>
      <FormControl w='full' isInvalid={!!lastNameError}>
        <FormLabel mb={1}>
          <FormattedMessage id="text.last_name" />
        </FormLabel>
        <Input
          id="inputLastName"
          value={lastName}
          onChange={(e) => onLastNameChange(e.target.value)}
          borderColor={lastNameError ? 'red.300' : undefined}
        />
        {lastNameError && (
          <Text fontSize="xs" color="red.500" mt={1}>
            {lastNameError}
          </Text>
        )}
      </FormControl>
      <FormControl w='full' isInvalid={!!emailError}>
        <FormLabel mb={1}>
          <FormattedMessage id="text.email" />
        </FormLabel>
        <Input
          id="inputEmail"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          borderColor={emailError ? 'red.300' : undefined}
        />
        {emailError && (
          <Text fontSize="xs" color="red.500" mt={1}>
            {emailError}
          </Text>
        )}
      </FormControl>
      <FormControl w={'full'}>
        <FormLabel mb={1}>
          <FormattedMessage id="text.role" />
        </FormLabel>
        <Box w="100%" minW="100%">
          <Select
            id="selectRoles"
            isMulti
            value={selectedRoles.map(role => ({ label: role.name, value: role.id.toString() }))}
            options={roleOptions}
            onChange={onRoleChange}
            placeholder=""
            closeMenuOnSelect={false}
            isSearchable={false}
            size="md"
            chakraStyles={{
              container: (provided) => ({
                ...provided,
                width: "100%"
              })
            }}
          />
        </Box>
      </FormControl>
    </Flex>
  );

  return (
    <Box pt={5} w="100%" mb={4}>
      <Flex id="flexUserForm" direction={'column'} w='100%' gap={4}>
        {isHorizontal ? renderHorizontalForm() : renderVerticalForm()}
        
        {!isEdit && (
          <Text fontSize="sm" color="gray.600" mb={0}>
            <FormattedMessage id="text.user_will_receive_email" />
          </Text>
        )}
        
        <Flex justify="space-between" align="center" gap={4}>
          <Text fontSize="xs" color="gray.500" mb={0}>
            <FormattedMessage id="text.user_validation_rules" />
          </Text>
          <Flex gap={3}>
            <Button
              id="btnSaveUser"
              colorScheme={isEdit ? "green" : "blue"}
              onClick={onSave}
              disabled={!firstName || !lastName || !email}
              px={6}
              borderRadius="5px"
              data-testid="submit-button"
            >
              <FormattedMessage id="text.save" />
            </Button>
            {isEdit && (
              <DamButton
                borderRadius="5px"
                px={6}
                colorScheme="red"
                onClick={onCancel}>
                <FormattedMessage id='text.cancel' />
              </DamButton>
            )}
          </Flex>
        </Flex>
      </Flex>
    </Box>
  );
}

