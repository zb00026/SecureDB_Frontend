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
          bg: "line",
        },
        _dark: {
          bg: "lineDark",
        },
      }}
    ></Flex>
  );
}
