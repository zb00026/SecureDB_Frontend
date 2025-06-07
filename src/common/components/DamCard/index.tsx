import { Flex, FlexProps } from "@chakra-ui/react";

const styles = {
  Card: {
    width: "100%",
    border: "1px solid",
    _light: {
      bg: "light.300",
      borderColor: "gray.400",
    },
    _dark: {
      bg: "gray.99",
      borderColor: "gray.600",
    },
  },
};

export function DamCard({ children, ...rest }: FlexProps) {
  return (
    <div style={{ width: "100%" }}>
      <Flex borderRadius="8px" {...styles.Card} {...rest}>
        {children}
      </Flex>
    </div>
  );
}
