// Settings Hotkey

import {
  Flex, Input, Text, Alert, AlertIcon
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
  const [showWarning, setShowWarning] = useState<boolean>(false);

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
  
  // List of browser shortcuts that cannot be prevented
  const browserShortcuts = [
    'Ctrl+T', 'Ctrl+W', 'Ctrl+N', 'Ctrl+Shift+T', 'Ctrl+Shift+N',
    'Ctrl+Shift+W', 'Ctrl+Shift+Delete', 'Ctrl+Shift+I', 'F12'
  ];

  const isBrowserShortcut = (combination: string) => {
    return browserShortcuts.includes(combination);
  };

  useLayoutEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hotkeyInputFocusedRef.current) return;

      // Prevent default browser behavior for all key combinations
      e.preventDefault();
      e.stopPropagation();

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
      } else {
        // Use the dispKey directly since it already includes modifiers
        combination = dispKey;
      }

      // Check if this is a browser shortcut that cannot be prevented
      if (isBrowserShortcut(combination)) {
        setShowWarning(true);
        // Hide warning after 3 seconds
        setTimeout(() => setShowWarning(false), 3000);
      } else {
        setShowWarning(false);
      }

      setHotkeyCombination(combination);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (hotkeyInputFocusedRef.current) {
        e.preventDefault();
        e.stopPropagation();

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
      }
    };

    const handleBeforeInput = (e: InputEvent) => {
      if (hotkeyInputFocusedRef.current) {
        e.preventDefault();
      }
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      if (hotkeyInputFocusedRef.current) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Add event listeners with capture phase for better control
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('keypress', handleKeyPress, true);
    window.addEventListener('beforeinput', handleBeforeInput, true);

    // Cleanup the event listener
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('keypress', handleKeyPress, true);
      window.removeEventListener('beforeinput', handleBeforeInput, true);
    };
  }, []);

  const handleUpdate = async () => {
    stateActions.setHotKey(hotkeyCombination);
  };

  return (
    <Flex direction="column" w='full' gap={2}>
      <Flex w='full' textAlign={'center'} alignItems={'center'} gap={2}>
        <Text mb={0} minW='150px' textAlign={'right'}>
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
          onKeyDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onKeyUp={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onKeyPress={(e) => {
            e.preventDefault();
            e.stopPropagation();
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
      
      {showWarning && (
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          <Text fontSize="sm">
            This key combination conflicts with browser shortcuts and may not work reliably. 
            Consider using a different combination like Ctrl+Shift+K or Alt+K.
          </Text>
        </Alert>
      )}
    </Flex>
  );
}
