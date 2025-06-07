import { Flex } from "@chakra-ui/react";

export function DamCardDivider() {
  return (
    <Flex
      sx={{
        w: "full",
        alignSelf: "stretch",
        alignItems: "stretch",
        height: "1px",
        flexGrow: "1",
        mt: "0 !important",
        _light: {
          bg: "gray.400",
        },
        _dark: {
          bg: "gray.600",
        },
      }}
    ></Flex>
  );
}
