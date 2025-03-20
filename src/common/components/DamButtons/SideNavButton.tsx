import { Flex, Text } from "@chakra-ui/react";
import { DamButton, DamIcon } from "../..";
import { sharedStyles } from "./sharedStyles";

const specificStyles = {
  ButtonOn: {
    ...sharedStyles.Button,
    _light: {
      color: "blue.60",
      _hover: { color: "#0052ff" },
      _active: {
        color: "#0052ff",
        transform: "scale(0.98)",
      },
    },
    _dark: {
      color: "blue.40",
      _hover: { color: "#0052ff" },
      _active: {
        color: "#fff",
        opacity: 0.92,
        transform: "scale(0.98)",
      },
    },
  },
  ButtonOff: {
    ...sharedStyles.Button,
    _light: {
      color: "gray.99",
      _hover: { color: "#0052ff" },
      _active: {
        opacity: 0.92,
        transform: "scale(0.98)",
      },
    },
    _dark: {
      color: "gray.0",
      bg: "transparent",
      _hover: { color: "#0052ff" },
      _active: {
        opacity: 0.92,
        transform: "scale(0.98)",
      },
    },
  },
  Container: {
    ...sharedStyles.Container,
    // justifyContent: {
    //   base: "center",
    //   sm: "center",
    //   md: "center",
    //   lg: "flex-start",
    // },
  },
  Title: {
    ...sharedStyles.Title,
    // display: { base: "none", sm: "none", md: "none", lg: "block" },
  },
};

export function SideNavFButton({ link, icon, title, selected = false }: any) {
  return (
    <DamButton
      variant="sidebarOn"
      link={link}
      sx={selected ? specificStyles.ButtonOn : specificStyles.ButtonOff}
      pl={0}
    >
      <Flex sx={specificStyles.Container}>
        <DamIcon icon={icon} />
        <Flex
          grow={0}
          w={1}
          sx={{
            display: { base: "none", sm: "none", md: "none", lg: "block" },
          }}
        ></Flex>
        <Text as="span" sx={specificStyles.Title}>
          {title}
        </Text>
      </Flex>
    </DamButton>
  );
}
