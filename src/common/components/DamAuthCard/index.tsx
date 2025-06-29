import { 
  Card,
  CardBody,
  Text,
  useColorModeValue
} from "@chakra-ui/react";
import { ReactNode } from "react";

interface AuthCardProps {
  readonly children: ReactNode;
}

export default function DamAuthCard({ children }: AuthCardProps) {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <>
      <Card
        variant="elevated"
        bg={cardBg}
        borderColor={borderColor}
        borderWidth="1px"
        borderRadius="2xl"
        p={6}
        boxShadow="2xl"
        _hover={{
          boxShadow: '3xl',
          transform: 'translateY(-2px)',
        }}
        transition="all 0.2s ease-in-out"
      >
        <CardBody>
          {children}
        </CardBody>
      </Card>

      {/* Footer */}
      <Text 
        fontSize="sm" 
        color="gray.500" 
        mt={4}
        textAlign="center"
      >
        © {new Date().getFullYear()} Hagrid Database Access Management
      </Text>
    </>
  );
} 