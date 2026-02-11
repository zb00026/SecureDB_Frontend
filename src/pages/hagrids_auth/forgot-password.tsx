import { 
  VStack,
  Heading,
  Text,
  Icon,
  Input,
  Button,
  Box,
  FormControl,
  FormLabel
} from "@chakra-ui/react";
import { request, useDamToast, DamFullLoading } from "@common/index";
import DamAuthLayout from "@common/components/DamAuthLayout";
import DamAuthCard from "@common/components/DamAuthCard";
import DamBackToLogin from "@common/components/DamBackToLogin";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { FiMail } from 'react-icons/fi';

export default function ForgotPassword() {
  const { showError, showSuccess } = useDamToast();
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const intl = useIntl();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      showError({
        description: intl.formatMessage({ id: 'text.please_enter_email' })
      });
      return;
    }

    // Basic email validation - using string operations to prevent any ReDoS vulnerability
    const isValidEmail = (email: string): boolean => {
      const trimmedEmail = email.trim();
      const atIndex = trimmedEmail.indexOf('@');
      const dotIndex = trimmedEmail.lastIndexOf('.');
      
      return atIndex > 0 && 
             dotIndex > atIndex + 1 && 
             dotIndex < trimmedEmail.length - 1 &&
             !trimmedEmail.includes(' ') &&
             !trimmedEmail.includes('\t') &&
             !trimmedEmail.includes('\n');
    };
    
    if (!isValidEmail(email)) {
      showError({
        description: intl.formatMessage({ id: 'text.please_enter_valid_email' })
      });
      return;
    }

    setIsLoading(true);
    
    request('/api/auth/forgotPassword', {
      method: 'POST',
      data: { email: email.trim() }
    }).then((res: any) => {
      setIsSubmitted(true);
      showSuccess({
        description: intl.formatMessage({ id: 'text.password_reset_email_sent' })
      });
    }).catch((error: any) => {
      const errorMessage = error?.response?.data?.message ?? 
                          error?.response?.data?.error ?? 
                          error?.message ??
                          intl.formatMessage({ id: 'text.failed_to_send_reset_email' });
      
      showError({
        description: errorMessage
      });
    }).finally(() => {
      setIsLoading(false);
    });
  };

  if (isLoading) {
    return <DamFullLoading showBackground />;
  }

  return (
    <DamAuthLayout>
      <DamAuthCard>
        <VStack spacing={6}>
          <VStack spacing={2} textAlign="center">
            <Icon as={FiMail} boxSize={8} color="brand.500" />
            <Heading size="lg" color="gray.700" _dark={{ color: 'gray.200' }}>
              {isSubmitted 
                ? intl.formatMessage({ id: 'text.check_your_email' })
                : intl.formatMessage({ id: 'text.forgot_password' })
              }
            </Heading>
            <Text color="gray.600" _dark={{ color: 'gray.400' }}>
              {isSubmitted 
                ? intl.formatMessage({ id: 'text.password_reset_instructions' })
                : intl.formatMessage({ id: 'text.enter_email_for_reset' })
              }
            </Text>
          </VStack>

          {isSubmitted ? (
            <VStack spacing={4} w="full">
              <Text 
                fontSize="sm" 
                color="gray.500" 
                textAlign="center"
                bg="green.50"
                _dark={{ bg: 'green.900' }}
                p={4}
                borderRadius="lg"
                w="full"
              >
                {intl.formatMessage({ id: 'text.reset_email_sent_to' })} <strong>{email}</strong>
              </Text>
              
              <Button
                variant="outline"
                size="lg"
                w="full"
                borderRadius="lg"
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail("");
                }}
              >
                {intl.formatMessage({ id: 'text.try_another_email' })}
              </Button>
            </VStack>
          ) : (
            <Box as="form" w="full" onSubmit={handleSubmit}>
              <VStack spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>
                    <FormattedMessage id="text.email" />
                  </FormLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    size="lg"
                    borderRadius="lg"
                    _focus={{
                      borderColor: 'brand.500',
                      boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
                    }}
                  />
                </FormControl>
                
                <Button
                  type="submit"
                  colorScheme="brand"
                  size="lg"
                  w="full"
                  borderRadius="lg"
                  isLoading={isLoading}
                  loadingText={intl.formatMessage({ id: 'text.sending' })}
                >
                  {intl.formatMessage({ id: 'text.send_reset_link' })}
                </Button>
              </VStack>
            </Box>
          )}

          <DamBackToLogin />

          <Text fontSize="sm" color="gray.500" textAlign="center">
            {intl.formatMessage({ id: 'text.forgot_password_help' })}
          </Text>
        </VStack>
      </DamAuthCard>
    </DamAuthLayout>
  );
} 