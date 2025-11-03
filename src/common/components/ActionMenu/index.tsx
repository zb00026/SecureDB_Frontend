import { HStack, Button, ButtonGroup, Menu, MenuButton, MenuList, MenuItem, IconButton } from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { FiMoreVertical } from "react-icons/fi";
import { ReactElement } from "react";

export interface ActionMenuItem {
  readonly label: string;
  readonly onClick: () => void;
  readonly isDisabled?: boolean;
  readonly icon?: ReactElement;
  readonly colorScheme?: string;
  readonly variant?: "solid" | "outline" | "ghost" | "link";
}

interface ActionMenuProps {
  readonly items: ActionMenuItem[];
  readonly hasSelection: boolean;
  readonly selectedCount?: number;
  readonly variant?: "buttons" | "menu";
  readonly showCount?: boolean;
}

export const ActionMenu = ({
  items,
  hasSelection,
  selectedCount = 0,
  variant = "buttons",
  showCount = true,
}: ActionMenuProps) => {
  // Filter items based on selection state
  const enabledItems = items.filter(item => !item.isDisabled);
  const disabledItems = items.filter(item => item.isDisabled);

  if (variant === "menu") {
    return (
      <HStack spacing={2}>
        {showCount && hasSelection && (
          <Button size="sm" variant="outline" isDisabled>
            {selectedCount} {selectedCount === 1 ? "item" : "items"} selected
          </Button>
        )}
        <Menu>
          <MenuButton
            as={IconButton}
            aria-label="Actions"
            icon={<FiMoreVertical />}
            size="sm"
            variant="outline"
            isDisabled={!hasSelection || enabledItems.length === 0}
          />
          <MenuList>
            {enabledItems.map((item) => (
              <MenuItem
                key={item.label}
                onClick={item.onClick}
                icon={item.icon ?? undefined}
              >
                {item.label}
              </MenuItem>
            ))}
            {disabledItems.length > 0 && enabledItems.length > 0 && (
              <MenuItem isDisabled>---</MenuItem>
            )}
            {disabledItems.map((item) => (
              <MenuItem
                key={`disabled-${item.label}`}
                onClick={item.onClick}
                isDisabled
                icon={item.icon ?? undefined}
              >
                {item.label}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
      </HStack>
    );
  }

  // Default: buttons variant (AWS-style)
  return (
    <HStack spacing={2}>
      <ButtonGroup size="sm" isAttached={false} spacing={2}>
        {enabledItems.map((item) => (
          <Button
            key={item.label}
            onClick={item.onClick}
            isDisabled={!hasSelection || item.isDisabled}
            colorScheme={item.colorScheme || "blue"}
            variant={item.variant || "solid"}
            leftIcon={item.icon ?? undefined}
          >
            {item.label}
          </Button>
        ))}
        {disabledItems.length > 0 && enabledItems.length > 0 && (
          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<ChevronDownIcon />}
              isDisabled={!hasSelection}
              colorScheme="blue"
              variant="solid"
            >
              More
            </MenuButton>
            <MenuList>
              {disabledItems.map((item) => (
                <MenuItem
                  key={`more-disabled-${item.label}`}
                  onClick={item.onClick}
                  isDisabled
                  icon={item.icon ?? undefined}
                >
                  {item.label}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
        )}
        {disabledItems.length > 0 && enabledItems.length === 0 && (
          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<ChevronDownIcon />}
              isDisabled={!hasSelection}
              colorScheme="blue"
              variant="solid"
            >
              Actions
            </MenuButton>
            <MenuList>
              {disabledItems.map((item) => (
                <MenuItem
                  key={`actions-disabled-${item.label}`}
                  onClick={item.onClick}
                  isDisabled
                  icon={item.icon ?? undefined}
                >
                  {item.label}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
        )}
      </ButtonGroup>
    </HStack>
  );
};

