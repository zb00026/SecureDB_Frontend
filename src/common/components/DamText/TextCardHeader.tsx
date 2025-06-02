import { Heading } from "@chakra-ui/react";

export function TextCardHeader({ children, id, ...rest }: any) {
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
      {...rest}
    >
      {children}
    </Heading>
  );
}
