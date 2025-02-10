import { Box, Flex, Input, List, ListItem, Portal } from "@chakra-ui/react";
import { isAuthorizedPath } from "@common/index";
import { useMyState } from "@common/state";
import { PageRoute } from "@models/PageRoute";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

export function MyPageSearch({ children }: { children: React.ReactNode }) {

  const { snap } = useMyState();
  const pageRoutes = snap.storage.pageRoutes;
  const [query, setQuery] = useState('');
  const [isVisible, setVisible] = useState<boolean>(false);
  const [filteredItems, setFilteredItems] = useState<PageRoute[]>([]);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        setVisible(true);
      }
      if (e.key === 'Escape') {
        resetSearchCriteria(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    }
  }, []);

  useLayoutEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible])

  const resetSearchCriteria = (visible: boolean) => {
    setFilteredItems([]);
    setQuery('');
    setVisible(visible);
  }

  // Update filtered items when query changes
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchQuery = event.target.value.toLowerCase();
    if (!searchQuery) {
      resetSearchCriteria(true);
      return;
    }
    setQuery(searchQuery);

    // Filter the items based on the search query and isSearchable flag
    const results = pageRoutes.filter(
      (item) =>
        item.isSearchable &&
        item.title.toLowerCase().includes(searchQuery) &&
        isAuthorizedPath(item.path, snap.session.user)
    );
    setFilteredItems(results);
  };

  // Handle item click, navigate to the corresponding path
  const handleItemClick = (path: string) => {
    resetSearchCriteria(false);
    navigate(path);
  };


  return (
    isVisible ? (
      <Portal>
        <Flex
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            zIndex: "99999",
          }}
        >
          <Box p={4} w='full'>
            <Input
              autoFocus={true}
              ref={inputRef}
              placeholder="Search..."
              value={query}
              onChange={handleSearch}
              mb={4}
              borderRadius="md"
              boxShadow="sm"
            />
            <List spacing={2}>
              {filteredItems.map((item) => (
                <ListItem
                  key={item.path}
                  onClick={() => handleItemClick(item.path)}
                  cursor="pointer"
                  p={3}
                  borderRadius="md"
                  transition="all 0.2s ease"
                  _hover={{
                    bg: 'gray.200',
                    transform: 'scale(1.01)',
                    boxShadow: 'md',
                  }}
                  _active={{
                    bg: 'gray.300',
                  }}
                  _dark={{
                    bg: 'gray.700',
                    _hover: {
                      bg: 'gray.600',
                      transform: 'scale(1.01)',
                    },
                  }}
                >
                  {item.title}
                </ListItem>
              ))}
            </List>
          </Box>
        </Flex>
      </Portal>
    ) : (
      <>
        {children}
      </>
    )
  );
}
