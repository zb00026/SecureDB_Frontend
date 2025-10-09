import {
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  VStack,
  Text,
  Box,
  useDisclosure,
  InputProps,
  Flex,
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon, CheckIcon, CloseIcon } from "@chakra-ui/icons";
import { useState, useEffect } from "react";
import { FormattedMessage } from "react-intl";
import { validatePassword } from "@common/libs/utils";

interface PasswordRequirement {
  readonly id: string;
  readonly label: string;
  readonly test: (password: string) => boolean;
}

interface DamPasswordInputProps extends Omit<InputProps, 'type' | 'onChange' | 'readOnly'> {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly showRequirements?: boolean;
  readonly onValidationChange?: (isValid: boolean) => void;
  readonly autoComplete?: string;
  readonly readOnly?: boolean;
  readonly 'data-lpignore'?: string;
  readonly 'data-1p-ignore'?: string;
  readonly 'data-save'?: string;
  readonly 'data-browser-ignore'?: string;
  readonly 'data-no-autofill'?: string;
}

const passwordRequirements: PasswordRequirement[] = [
  {
    id: 'length',
    label: 'text.password_min_length',
    test: (password: string) => password.length >= 12,
  },
  {
    id: 'uppercase',
    label: 'text.password_uppercase',
    test: (password: string) => /[A-Z]/.test(password),
  },
  {
    id: 'lowercase',
    label: 'text.password_lowercase',
    test: (password: string) => /[a-z]/.test(password),
  },
  {
    id: 'digit',
    label: 'text.password_digit',
    test: (password: string) => /\d/.test(password),
  },
  {
    id: 'special',
    label: 'text.password_special_char',
    test: (password: string) => /[!@#$%^&*()\-_=+[\]{}|;:'",.<>/?]/.test(password),
  },
];

export function DamPasswordInput({
  value,
  onChange,
  showRequirements = false,
  placeholder = "Enter password",
  onValidationChange,
  autoComplete = "off",
  readOnly = false,
  'data-lpignore': dataLpignore,
  'data-1p-ignore': data1pIgnore,
  'data-save': dataSave,
  'data-browser-ignore': dataBrowserIgnore,
  'data-no-autofill': dataNoAutofill,
  ...props
}: DamPasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [requirements, setRequirements] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const newRequirements: Record<string, boolean> = {};
    passwordRequirements.forEach((req) => {
      newRequirements[req.id] = req.test(value);
    });
    setRequirements(newRequirements);
    
    // Notify parent of validation status
    const { isValid: isPasswordValid } = validatePassword(value);
    onValidationChange?.(isPasswordValid);
  }, [value, onValidationChange]);

  const handleFocus = () => {
    setIsFocused(true);
    if (showRequirements) {
      onOpen();
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    setIsFocused(false);
    onClose();
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const allRequirementsMet = passwordRequirements.every((req) => requirements[req.id]);

  return (
    <Popover
      isOpen={(isOpen || isFocused) && showRequirements}
      onOpen={onOpen}
      onClose={onClose}
      placement="right"
      closeOnBlur={false}
      autoFocus={false}
      returnFocusOnClose={false}
    >
      <PopoverTrigger>
        <InputGroup>
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            pr="4.5rem"
            borderColor={value && allRequirementsMet ? "green.400" : undefined}
            autoComplete={autoComplete}
            readOnly={readOnly}
            data-form-type="other"
            data-lpignore={dataLpignore}
            data-1p-ignore={data1pIgnore}
            data-save={dataSave}
            data-browser-ignore={dataBrowserIgnore}
            data-no-autofill={dataNoAutofill}
            sx={{
              WebkitTextSecurity: showPassword ? 'none' : 'disc',
              ...props.sx
            }}
            {...props}
          />
          <InputRightElement width="4.5rem">
            <IconButton
              h="1.75rem"
              size="sm"
              onClick={togglePasswordVisibility}
              icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
              variant="ghost"
              aria-label={showPassword ? "Hide password" : "Show password"}
            />
          </InputRightElement>
        </InputGroup>
      </PopoverTrigger>

      {showRequirements && (
        <PopoverContent
          width="300px"
          zIndex={1000}
          _focus={{ outline: "none" }}
          sx={{
            _light: {
              bg: "white",
              borderColor: "gray.200",
              boxShadow: "lg"
            },
            _dark: {
              bg: "gray.800",
              borderColor: "gray.600",
              boxShadow: "dark-lg"
            }
          }}
        >
          <PopoverBody>
            <VStack align="stretch" spacing={2}>
              <Text
                fontWeight="bold"
                mb={2}
                sx={{
                  _light: { color: "gray.800" },
                  _dark: { color: "gray.100" }
                }}
              >
                <FormattedMessage id="text.password_requirements" />
              </Text>

              {passwordRequirements.map((requirement) => (
                <Flex key={requirement.id} gap={2} w='full' alignItems={'center'}>
                  <Box
                    minW="20px"
                    minH="20px"
                    borderRadius="50%"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    sx={{
                      _light: {
                        bg: requirements[requirement.id] ? "green.500" : "gray.300",
                        color: "white"
                      },
                      _dark: {
                        bg: requirements[requirement.id] ? "green.400" : "gray.600",
                        color: requirements[requirement.id] ? "white" : "gray.300"
                      }
                    }}
                    fontSize="10px"
                  >
                    {requirements[requirement.id] ? (
                      <CheckIcon
                        w="11px"
                        h="11px" />
                    ) : (
                      <CloseIcon
                        w="11px"
                        h="11px" />
                    )}
                  </Box>
                  <Text
                    fontSize="sm"
                    mb={0}
                    sx={{
                      _light: {
                        color: requirements[requirement.id] ? "green.600" : "gray.600"
                      },
                      _dark: {
                        color: requirements[requirement.id] ? "green.300" : "gray.400"
                      }
                    }}
                    fontWeight={requirements[requirement.id] ? "semibold" : "normal"}
                  >
                    <FormattedMessage id={requirement.label} />
                  </Text>
                </Flex>
              ))}
            </VStack>
          </PopoverBody>
        </PopoverContent>
      )}
    </Popover>
  );
}

export { passwordRequirements };
export type { PasswordRequirement }; 