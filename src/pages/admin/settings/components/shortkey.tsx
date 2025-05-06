// Settings Hotkey

import {
  Flex, Input, Text
} from "@chakra-ui/react";
import {
  getDisplayedKey, getMetaKeyName,
  stateActions,
  useMyState,
  PrimaryButton
} from "@common/index";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";

export function ShortKey() {
  const { snap } = useMyState();
  const [hotkeyCombination, setHotkeyCombination] = useState<string>(snap.storage.hotKey);
  const [hotkeyInputFocused, setHotkeyInputFocused] = useState<boolean>(false);
  const [oldHotkey, setOldHotkey] = useState<string>(snap.storage.hotKey);

  const hotkeyCombinationRef = useRef(hotkeyCombination);
  const oldHotkeyRef = useRef(oldHotkey);
  const hotkeyInputFocusedRef = useRef(hotkeyInputFocused);

  // Sync state with refs in real-time
  useEffect(() => {
    hotkeyCombinationRef.current = hotkeyCombination;
    oldHotkeyRef.current = oldHotkey;
    hotkeyInputFocusedRef.current = hotkeyInputFocused;
  }, [hotkeyCombination, oldHotkey, hotkeyInputFocused]);

  const modifierKeys = ['Ctrl', 'Alt', 'Shift', getMetaKeyName(), 'Meta', 'Control'];
  useLayoutEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hotkeyInputFocusedRef.current) return;

      // Build modifier array
      const modifiers: string[] = [];
      if (e.ctrlKey) modifiers.push('Ctrl');
      if (e.altKey) modifiers.push('Alt');
      if (e.shiftKey) modifiers.push('Shift');
      if (e.metaKey) modifiers.push(getMetaKeyName());

      const dispKey = getDisplayedKey(e);

      // Check if dispKey is a modifier key
      const isModifierKey = modifierKeys.some(key => dispKey.endsWith(key));

      let combination: string;
      if (isModifierKey) {
        combination = modifiers.join('+');
      } else if (modifiers.length > 0) {
        combination = `${modifiers.join('+')}+${dispKey.replace(/^[^+]*\+/, '')}`;
      } else {
        combination = dispKey;
      }

      setHotkeyCombination(combination);
      e.preventDefault();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (hotkeyInputFocusedRef.current) {

        let sameModifierPressed = false;
        modifierKeys.forEach((key) => {
          if (hotkeyCombinationRef.current.endsWith(key)) {
            sameModifierPressed = true;
          }
        });

        if (sameModifierPressed) {
          setHotkeyCombination(oldHotkeyRef.current);
        } else {
          setOldHotkey(hotkeyCombinationRef.current);
        }
        e.preventDefault();
      }
    };

    // Add event listener for keydown events
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Cleanup the event listener
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleUpdate = async () => {
    stateActions.setHotKey(hotkeyCombination);
  };

  return (
    <Flex w='full' textAlign={'center'} mt={2} alignItems={'center'} gap={2}>
      <Text mb={0}  minW='150px' textAlign={'right'}>
        <FormattedMessage id='text.settings_shortcut_key'/>
      </Text>
      <Input
        value={hotkeyCombination}
          onFocus={() => {
            setHotkeyInputFocused(true);
          }}
          onBlur={() => {
            setHotkeyInputFocused(false);
          }}
          readOnly
        placeholder="Enter shortcut key for Search (e.g., Ctrl+K)"
      />
      <PrimaryButton
        id="btnApplyShortKey"
        onClick={handleUpdate}>
        <FormattedMessage id="text.apply" />
      </PrimaryButton>
    </Flex>
  );
}
