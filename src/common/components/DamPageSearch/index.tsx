import { 
  Flex, 
  Portal, 
  VStack,
  useColorModeValue
} from "@chakra-ui/react";
import { getDisplayedKey, formatShortcutForDisplay, filterSearchableRoutes, useKeyboardNavigation } from "@common/index";
import { SpotlightSearch } from "@common/components/SpotlightSearch";
import { stateActions, useMyState } from "@common/state";
import { PageRoute } from "@models/PageRoute";
import { useEffect, useLayoutEffect, useRef, useState, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router";

export function DamPageSearch({ children }: { children: React.ReactNode }) {

  const { snap } = useMyState();
  const location = useLocation();
  const pageRoutes = snap.storage.pageRoutes;
  const [query, setQuery] = useState('');
  const [visible, setVisible] = useState<boolean>(false);
  const [filteredItems, setFilteredItems] = useState<PageRoute[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const overlayBg = useColorModeValue('rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.7)');

  useEffect(() => {
    if (!snap.storage.hotKey) {
      stateActions.setHotKey("Ctrl+J");
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentCombination = getDisplayedKey(e);
      if (snap.storage.hotKey == currentCombination) {
        e.preventDefault();
        // If we're on the index page, dispatch event to focus the input instead
        if (location.pathname === '/') {
          globalThis.dispatchEvent(new CustomEvent('focusIndexSearch'));
          return;
        }
        setVisible(true);
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        resetSearchCriteria(false);
      }
    }
    globalThis.addEventListener('keydown', handleKeyDown);
    return () => {
      globalThis.removeEventListener('keydown', handleKeyDown);
    }
  }, [location.pathname, snap.storage.hotKey]);

  useLayoutEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [visible])

  const resetSearchCriteria = useCallback((visible: boolean) => {
    setFilteredItems([]);
    setQuery('');
    setSelectedIndex(0);
    setVisible(visible);
  }, []);

  // Update filtered items when query changes
  const handleSearch = useCallback((value: string) => {
    const searchQuery = value.toLowerCase();
    if (!searchQuery) {
      resetSearchCriteria(true);
      return;
    }
    setQuery(searchQuery);

    // Filter the items using shared utility function
    const results = filterSearchableRoutes(pageRoutes, searchQuery, snap.session.user, 8);
    setFilteredItems(results);
    setSelectedIndex(0);
  }, [pageRoutes, snap.session.user, resetSearchCriteria]);

  // Handle item click, navigate to the corresponding path
  const handleItemClick = useCallback((path: string) => {
    resetSearchCriteria(false);
    navigate(path);
  }, [resetSearchCriteria, navigate]);

  // Handle keyboard navigation
  useKeyboardNavigation({
    enabled: visible,
    filteredItems,
    selectedIndex,
    onEscape: () => resetSearchCriteria(false),
    onNavigate: handleItemClick,
    setSelectedIndex
  });

  // Get shortcut from storage or use default
  const shortcutDisplay = useMemo(() => {
    const currentHotKey = snap.storage?.hotKey || 'Ctrl+J';
    return formatShortcutForDisplay(currentHotKey);
  }, [snap.storage?.hotKey]);


  return (
    <>
      {children}
      {visible && (
        <Portal>
          <Flex
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg={overlayBg}
            zIndex={99999}
            justifyContent="center"
            alignItems="flex-start"
            pt={20}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                resetSearchCriteria(false);
              }
            }}
          >
            <VStack spacing={4} align="stretch" maxW="800px" w="full" px={4}>
              <SpotlightSearch
                ref={inputRef}
                query={query}
                onQueryChange={handleSearch}
                filteredItems={filteredItems}
                selectedIndex={selectedIndex}
                onItemClick={handleItemClick}
                shortcutDisplay={shortcutDisplay}
                autoFocus={true}
                showHints={true}
              />
            </VStack>
          </Flex>
        </Portal>
      )}
    </>
  );
}
