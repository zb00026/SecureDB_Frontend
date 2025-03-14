import { Text } from "@chakra-ui/react";

export function TextCardHeader({ children, id, ...rest }: any) {
  return (
    <Text
      id={id}
      sx={{
        fontSize: "20px",
        fontWeight: "var(--cds-fontWeights-medium)",
        textAlign: "start",
        transition: "color .15s ease-out,opacity .15s ease-out",
        px: 6,
        py: 4,
        _light: {
          color: "gray.99",
        },
        _dark: {
          color: "gray.0",
        },
        ...rest,
      }}
    >
      {children}
    </Text>
  );
}
