import { Heading, useColorModeValue } from "@chakra-ui/react";

export function TextCardHeader({ children, id, ...rest }: any) {
  const headerBg = useColorModeValue('gray.100', 'gray.700');
  const headerBorderColor = useColorModeValue('gray.200', 'gray.600');
  return (
    <Heading
      id={id}
      size="md"
      fontWeight="600"
      color="gray.700"
      _dark={{ color: 'gray.200' }}
      px={6}
      py={4}
      textAlign="start"
      bg={headerBg}
      border="1px solid"
      borderColor={headerBorderColor}
      borderRadius="md"
      {...rest}
    >
      {children}
    </Heading>
  );
}
