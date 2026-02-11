import { 
  HStack,
  Icon,
  Link
} from "@chakra-ui/react";
import { useIntl } from "react-intl";
import { Link as RouterLink } from "react-router-dom";
import { FiArrowLeft } from 'react-icons/fi';

export default function DamBackToLogin() {
  const intl = useIntl();

  return (
    <HStack spacing={2} justify="center">
      <Icon as={FiArrowLeft} boxSize={4} color="gray.400" />
      <Link
        as={RouterLink}
        to="/hagrids_auth/login"
        color="brand.500"
        _hover={{ textDecoration: 'underline' }}
        fontSize="sm"
      >
        {intl.formatMessage({ id: 'text.back_to_login' })}
      </Link>
    </HStack>
  );
} 