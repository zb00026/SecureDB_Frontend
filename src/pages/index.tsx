import { VStack } from "@chakra-ui/react";
import { DamBasePage } from "@common/components/DamBasePage";
import { SpotlightSearch } from "@common/components/SpotlightSearch";
import { DamDynamicDashboard } from "@common/components/DamDynamicDashboard";
import { useMyState, formatShortcutForDisplay, filterSearchableRoutes, useKeyboardNavigation } from "@common/index";
import { useIntl } from "react-intl";
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useMemo } from 'react';
import { PageRoute } from "@models/PageRoute";

export const name = 'Dashboard';

// These constants are no longer needed since we removed the card-based layout

export function Component() {
  const { snap } = useMyState();
  const navigate = useNavigate();
  const intl = useIntl();
  const inputRef = useRef<HTMLInputElement>(null);

  const user = snap.session.user;
  const pageRoutes = snap.storage.pageRoutes;
  
  const [query, setQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<PageRoute[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter and search pages
  useEffect(() => {
    if (!query.trim()) {
      setFilteredItems([]);
      setSelectedIndex(0);
      return;
    }

    const filtered = filterSearchableRoutes(pageRoutes, query, user, 8);
    setFilteredItems(filtered);
    setSelectedIndex(0);
  }, [query, pageRoutes, user]);

  // Keyboard navigation
  useKeyboardNavigation({
    enabled: true,
    filteredItems,
    selectedIndex,
    onEscape: () => {
      setQuery('');
      setSelectedIndex(0);
    },
    onNavigate: (path) => {
      navigate(path);
      setQuery('');
    },
    setSelectedIndex
  });

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Listen for shortcut to focus input
  useEffect(() => {
    const handleFocusSearch = () => {
      inputRef.current?.focus();
    };
    globalThis.addEventListener('focusIndexSearch', handleFocusSearch);
    return () => {
      globalThis.removeEventListener('focusIndexSearch', handleFocusSearch);
    };
  }, []);

  // Get shortcut from storage or use default
  const shortcutDisplay = useMemo(() => {
    const currentHotKey = snap.storage?.hotKey || 'Ctrl+J';
    return formatShortcutForDisplay(currentHotKey);
  }, [snap.storage?.hotKey]);

  const handleItemClick = (path: string) => {
    navigate(path);
    setQuery('');
  };

  return (
    <DamBasePage
      title={intl.formatMessage({ id: 'text.dashboard' })}
      hasBody={false}>
      
      {/* Spotlight Search */}
      <VStack spacing={4} align="stretch" maxW="800px" mx="auto" mt={20} minH="100vh">
        <SpotlightSearch
          ref={inputRef}
          query={query}
          onQueryChange={setQuery}
          filteredItems={filteredItems}
          selectedIndex={selectedIndex}
          onItemClick={handleItemClick}
          shortcutDisplay={shortcutDisplay}
          showHints={true}
        />

        {/* Dynamic Dashboard Component */}
        <DamDynamicDashboard user={user} />
      </VStack>
    </DamBasePage>
  );
}