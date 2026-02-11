import { 
  VStack,
  Heading,
  Text,
  Icon,
  Input,
  Button,
  InputGroup,
  InputRightElement,
  IconButton,
  Box,
  FormControl,
  FormLabel
} from "@chakra-ui/react";
import { request, useDamToast, DamFullLoading } from "@common/index";
import DamAuthLayout from "@common/components/DamAuthLayout";
import DamAuthCard from "@common/components/DamAuthCard";
import DamBackToLogin from "@common/components/DamBackToLogin";
import { useState, useEffect } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { DamPasswordInput } from "@common/components/DamPasswordInput";

interface ResetTokenData {
  readonly email: string;
  readonly fullName: string;
  readonly isValid: boolean;
}

export default function ResetPassword() {
  const { showError, showSuccess } = useDamToast();
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(true);
  const [isPasswordValid, setIsPasswordValid] = useState<boolean>(false);
  const [resetTokenData, setResetTokenData] = useState<ResetTokenData | null>(null);
  const intl = useIntl();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      showError({
        description: intl.formatMessage({ id: 'text.invalid_reset_link' })
      });
      navigate('/hagrids_auth/forgot-password');
      return;
    }

    // Validate the reset token
    validateResetToken();
  }, [token]);

  const validateResetToken = () => {
    request('/api/auth/validateResetToken', {
      method: 'POST',
      data: { token }
    }).then((response: any) => {
      setResetTokenData({
        email: response.email,
        fullName: response.fullName,
        isValid: true
      });
    }).catch((error: any) => {
      const errorMessage = error?.response?.data?.message ?? 
                          error?.response?.data?.error ?? 
                          error?.message ??
                          intl.formatMessage({ id: 'text.invalid_or_expired_token' });
      
      showError({
        description: errorMessage
      });
      navigate('/hagrids_auth/forgot-password');
    }).finally(() => {
      setIsValidating(false);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      showError({
        description: intl.formatMessage({ id: 'text.please_enter_password' })
      });
      return;
    }

    if (!isPasswordValid) {
      showError({
        description: intl.formatMessage({ id: 'text.password_does_not_meet_requirements' })
      });
      return;
    }

    if (password !== confirmPassword) {
      showError({
        description: intl.formatMessage({ id: 'text.passwords_do_not_match' })
      });
      return;
    }

    setIsLoading(true);
    
    request('/api/auth/updateFromForgotPassword', {
      method: 'POST',
      data: { 
        token,
        password: password.trim()
      }
    }).then((res: any) => {
      showSuccess({
        description: intl.formatMessage({ id: 'text.password_reset_success' })
      });
      
      // Redirect to login page after successful password reset
      setTimeout(() => {
        navigate('/hagrids_auth/login');
      }, 2000);
    }).catch((error: any) => {
      const errorMessage = error?.response?.data?.message ?? 
                          error?.response?.data?.error ?? 
                          error?.message ??
                          intl.formatMessage({ id: 'text.failed_to_reset_password' });
      
      showError({
        description: errorMessage
      });
    }).finally(() => {
      setIsLoading(false);
    });
  };

  if (isValidating) {
    return <DamFullLoading showBackground />;
  }

  if (!resetTokenData?.isValid) {
    return null; // Will redirect to forgot password page
  }

  return (
    <DamAuthLayout>
      <DamAuthCard>
        <VStack spacing={6}>
          <VStack spacing={2} textAlign="center">
            <Icon as={FiLock} boxSize={8} color="brand.500" />
            <Heading size="lg" color="gray.700" _dark={{ color: 'gray.200' }}>
              {intl.formatMessage({ id: 'text.reset_password' })}
            </Heading>
            <Text color="gray.600" _dark={{ color: 'gray.400' }}>
              {intl.formatMessage({ id: 'text.enter_new_password' })}
            </Text>
          </VStack>

          {/* User Info */}
          <VStack spacing={2} w="full" p={4} bg="gray.50" _dark={{ bg: 'gray.700' }} borderRadius="lg">
            <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
              {intl.formatMessage({ id: 'text.resetting_password_for' })}
            </Text>
            <Text fontWeight="semibold" color="gray.800" _dark={{ color: 'gray.200' }}>
              {resetTokenData?.fullName}
            </Text>
            <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
              {resetTokenData?.email}
            </Text>
          </VStack>

          <Box as="form" w="full" onSubmit={handleSubmit}>
            <VStack spacing={4} w="full">
              <FormControl isRequired>
                <FormLabel>
                  <FormattedMessage id="text.password" />
                </FormLabel>
                <DamPasswordInput
                  value={password}
                  onChange={setPassword}
                  placeholder=""
                  showRequirements={true}
                  onValidationChange={setIsPasswordValid}
                  size="lg"
                  borderRadius="lg"
                  _focus={{
                    borderColor: 'brand.500',
                    boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
                  }}
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>
                  <FormattedMessage id="text.confirm_password" />
                </FormLabel>
                <InputGroup size="lg">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    borderRadius="lg"
                    _focus={{
                      borderColor: 'brand.500',
                      boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
                    }}
                    pr="4.5rem"
                />
                <InputRightElement width="4.5rem">
                  <IconButton
                    h="1.75rem"
                    size="sm"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    icon={showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                    variant="ghost"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  />
                </InputRightElement>
              </InputGroup>
              </FormControl>
              
              <Button
                type="submit"
                colorScheme="brand"
                size="lg"
                w="full"
                borderRadius="lg"
                isLoading={isLoading}
                loadingText={intl.formatMessage({ id: 'text.updating' })}
                isDisabled={!isPasswordValid || password !== confirmPassword}
              >
                {intl.formatMessage({ id: 'text.update_password' })}
              </Button>
            </VStack>
          </Box>

          <DamBackToLogin />

          <Text fontSize="sm" color="gray.500" textAlign="center">
            {intl.formatMessage({ id: 'text.reset_password_help' })}
          </Text>
        </VStack>
      </DamAuthCard>
    </DamAuthLayout>
  );
} 