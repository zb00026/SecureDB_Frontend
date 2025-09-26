import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Text,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  VStack,
  HStack,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { FormattedMessage } from 'react-intl';
import { FiMaximize2, FiMinimize2, FiRefreshCw, FiX } from 'react-icons/fi';
import { state } from '@common/state';
import keycloak from '@common/keycloak/keycloak';
import { getGoogleToken } from '@common/libs/request';
import { AUTH_PROVIDER } from '@/constants/enums';
import { getAuthToken, getKeyCode } from '@common/libs/utils';

interface DamWebTerminalProps {
  readonly assetId: number;
  readonly assetName: string;
  readonly hostAddress: string;
  readonly portNumber: string;
  readonly onClose: () => void;
  readonly isFullscreen?: boolean;
  readonly onToggleFullscreen?: () => void;
}

export function DamWebTerminal({
  assetId,
  assetName,
  hostAddress,
  portNumber,
  onClose,
  isFullscreen = false,
  onToggleFullscreen
}: DamWebTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevSizeRef = useRef<{ cols: number; rows: number } | null>(null);
  const stabilizeRafRef = useRef<number | null>(null);
  const stableCountRef = useRef<number>(0);

  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const connectionErrorRef = useRef<string | null>(null);

  // Update connectionError ref whenever state changes
  useEffect(() => {
    connectionErrorRef.current = connectionError;
  }, [connectionError]);
  const [isConnected, setIsConnected] = useState(false);
  const terminalBg = useColorModeValue('#1e1e1e', '#0d1117');
  const terminalFg = useColorModeValue('#ffffff', '#f0f6fc');

  // Simple debounced resize handler
  const handleTerminalResize = () => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    resizeTimeoutRef.current = setTimeout(() => {
      if (fitAddonRef.current && terminalInstanceRef.current) {
        fitAddonRef.current.fit();
        const { cols, rows } = terminalInstanceRef.current;

        // Send resize to server if connected
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
          websocketRef.current.send(JSON.stringify({
            action: 'resize',
            cols,
            rows
          }));
        }
      }
    }, 300); // Longer debounce to prevent multiple calls
  };

  // Stabilize fitting over a few frames to avoid initial shrink due to layout settling
  const stabilizeFit = (maxFrames: number = 10) => {
    if (!fitAddonRef.current || !terminalInstanceRef.current) return;

    const step = (remaining: number) => {
      if (!fitAddonRef.current || !terminalInstanceRef.current) return;

      fitAddonRef.current.fit();
      const { cols, rows } = terminalInstanceRef.current;

      // Check for stability
      const prev = prevSizeRef.current;
      if (prev && prev.cols === cols && prev.rows === rows) {
        stableCountRef.current += 1;
      } else {
        stableCountRef.current = 0;
      }
      prevSizeRef.current = { cols, rows };

      // Consider stable after 2 matching frames or when out of frames
      if (stableCountRef.current >= 2 || remaining <= 0) {
        // Send final resize to server if connected
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
          websocketRef.current.send(JSON.stringify({ action: 'resize', cols, rows }));
        }
        if (stabilizeRafRef.current) {
          cancelAnimationFrame(stabilizeRafRef.current);
          stabilizeRafRef.current = null;
        }
        return;
      }

      stabilizeRafRef.current = requestAnimationFrame(() => step(remaining - 1));
    };

    // Kick off the stabilization loop
    if (stabilizeRafRef.current) cancelAnimationFrame(stabilizeRafRef.current);
    stabilizeRafRef.current = requestAnimationFrame(() => step(maxFrames));
  };
  
  useEffect(() => {
    initializeTerminal();
    connectToServer();

    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (terminalInstanceRef.current && fitAddonRef.current) {
      // Re-stabilize on fullscreen changes
      stabilizeFit();
    }
  }, [isFullscreen]);

  const initializeTerminal = () => {
    if (!terminalRef.current) return;

    // Create terminal instance
    const terminal = new Terminal({
      theme: {
        background: terminalBg,
        foreground: terminalFg,
        cursor: '#ffffff',
        black: '#000000',
        red: '#ff5555',
        green: '#50fa7b',
        yellow: '#f1fa8c',
        blue: '#bd93f9',
        magenta: '#ff79c6',
        cyan: '#8be9fd',
        white: '#f8f8f2',
        brightBlack: '#6272a4',
        brightRed: '#ff6e6e',
        brightGreen: '#69ff94',
        brightYellow: '#ffffa5',
        brightBlue: '#d6acff',
        brightMagenta: '#ff92df',
        brightCyan: '#a4ffff',
        brightWhite: '#ffffff',
      },
      fontSize: 14,
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 1000,
      tabStopWidth: 4,
      allowTransparency: false,
      allowProposedApi: true,
    });

    // Add addons
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);

    // Store references
    terminalInstanceRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Open terminal
    terminal.open(terminalRef.current);

    // Stabilized initial fit after a short delay to allow modal layout to settle
    setTimeout(() => {
      stabilizeFit();
    }, 150);

    // Handle window resize
    const handleWindowResize = () => {
      handleTerminalResize();
    };

    window.addEventListener('resize', handleWindowResize);

    // Handle terminal input
    terminal.onData((data) => {
      // Don't process input if there's a connection error
      if (connectionErrorRef.current) {
        return;
      }

      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        const keyCode = getKeyCode(data);
        
        websocketRef.current.send(JSON.stringify({
          action: 'keyboard_event',
          key: data,
          keyCode: keyCode
        }));
      }
      // Note: We don't send every keystroke to the server anymore
    });

    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  };

  const connectToServer = () => {
    setIsConnecting(true);
    setConnectionError(null);

    try {
      // WebSocket connection to the gateway service
      const authData = getAuthToken();
      if (!authData) {
        setConnectionError('Authentication token not found. Please log in again.');
        setIsConnecting(false);
        return;
      }

      const { token, provider } = authData;
      const wsUrl = `${import.meta.env.VITE_WEBSOCKET_URL || 'ws://127.0.0.1:8080'}/ws/terminal/connect?assetId=${assetId}&host=${hostAddress}&port=${portNumber}&token=${encodeURIComponent(token)}&authProvider=${encodeURIComponent(provider)}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnecting(false);
        setIsConnected(true);
        setConnectionError(null);

        // Send authentication and user context
        const user = state.session.user;
        ws.send(JSON.stringify({
          action: 'authenticate',
          token: token,
          authProvider: provider,
          userId: user?.id,
          username: user?.username || user?.email,
          assetId: assetId
        }));

        // Send initial terminal size after terminal is ready
        setTimeout(() => {
          handleTerminalResize();
        }, 400);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'output' && terminalInstanceRef.current) {
            terminalInstanceRef.current.write(message.data);
          } else if (message.type === 'error') {
            setConnectionError(message.message || 'Connection error occurred');
            setIsConnected(false);
          } else if (message.type === 'ssh_error') {
            // Handle SSH connection errors
            setConnectionError(`${message.message || 'Authentication failed'}`);
            setIsConnected(false);
            setIsConnecting(false);

            // Write error message to terminal
            if (terminalInstanceRef.current) {
              terminalInstanceRef.current.write(`\r\n\x1b[31mSSH Connection Error: ${message.message || 'Authentication failed'}\x1b[0m\r\n`);
              terminalInstanceRef.current.write('\x1b[33mTerminal session terminated. Please check your SSH credentials.\x1b[0m\r\n');
            }
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };



      ws.onclose = (event) => {
        setIsConnected(false);
        setIsConnecting(false);

        if (event.code === 4001) {
          setConnectionError('Authentication failed. Please log in again.');
        } else if (event.code === 4003) {
          setConnectionError('Access denied. You do not have permission to access this asset.');
        } else if (event.code !== 1000) { // Not a normal closure
          setConnectionError('Connection closed unexpectedly');
        }
      };

      ws.onerror = (error) => {
        setIsConnecting(false);
        setIsConnected(false);
        setConnectionError('Failed to connect to server');
        console.error('WebSocket error:', error);
      };

      websocketRef.current = ws;
    } catch (error) {
      setIsConnecting(false);
      setConnectionError('Failed to establish connection');
      console.error('Connection error:', error);
    }
  };

  const cleanup = () => {
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }

    if (terminalInstanceRef.current) {
      terminalInstanceRef.current.dispose();
      terminalInstanceRef.current = null;
    }

    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = null;
    }

    if (stabilizeRafRef.current) {
      cancelAnimationFrame(stabilizeRafRef.current);
      stabilizeRafRef.current = null;
    }
  };

  const handleReconnect = () => {
    cleanup();
    setTimeout(() => {
      initializeTerminal();
      connectToServer();
    }, 100);
  };

  // Check if token is still valid before reconnecting
  const isTokenValid = () => {
    const authData = getAuthToken();
    if (!authData) return false;

    // For Keycloak, check if token is expired
    if (authData.provider === AUTH_PROVIDER.KEYCLOAK && keycloak.token && keycloak.isTokenExpired()) {
      return false;
    }

    return true;
  };

  const handleCopy = () => {
    if (terminalInstanceRef.current) {
      const selection = terminalInstanceRef.current.getSelection();
      if (selection) {
        navigator.clipboard.writeText(selection);
      }
    }
  };

  const handlePaste = () => {
    // Don't allow pasting if there's a connection error
    if (connectionError) {
      return;
    }

    navigator.clipboard.readText().then(text => {
      // Send pasted text as keyboard events
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        // Send each character as a keyboard event
        for (const char of text) {
          const keyCode = getKeyCode(char);
          
          websocketRef.current.send(JSON.stringify({
            action: 'keyboard_event',
            key: char,
            keyCode: keyCode
          }));
        }
      }
    }).catch(err => {
      console.error('Failed to read clipboard:', err);
    });
  };

  return (
    <VStack spacing={0} h="full" w="full">
      {/* Terminal Header */}
      <Flex
        w="full"
        p={3}
        bg={useColorModeValue('gray.100', 'gray.700')}
        borderBottom="1px"
        borderColor={useColorModeValue('gray.200', 'gray.600')}
        align="center"
        justify="space-between"
      >
        <HStack spacing={4}>
          <Text fontSize="sm" fontWeight="medium" mb={0}>
            <FormattedMessage id="text.terminal" />: {assetName}
          </Text>
          <Text fontSize="xs" color="gray.500" mb={0}>
            {hostAddress}:{portNumber}
          </Text>
          {isConnected && (
            <Box w={2} h={2} bg="green.400" borderRadius="full" />
          )}
          {isConnecting && (
            <Spinner size="xs" />
          )}
        </HStack>

        <HStack spacing={2}>
          <Tooltip label="Copy selection">
            <IconButton
              size="sm"
              variant="ghost"
              aria-label="Copy"
              onClick={handleCopy}
            >
              📋
            </IconButton>
          </Tooltip>

          <Tooltip label="Paste">
            <IconButton
              size="sm"
              variant="ghost"
              aria-label="Paste"
              onClick={handlePaste}
            >
              📄
            </IconButton>
          </Tooltip>

          <Tooltip label="Reconnect">
            <IconButton
              size="sm"
              variant="ghost"
              aria-label="Reconnect"
              onClick={handleReconnect}
              icon={<FiRefreshCw />}
              isDisabled={!isTokenValid()}
            />
          </Tooltip>

          {onToggleFullscreen && (
            <Tooltip label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}>
              <IconButton
                size="sm"
                variant="ghost"
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                onClick={onToggleFullscreen}
                icon={isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
              />
            </Tooltip>
          )}

          <Tooltip label="Close terminal">
            <IconButton
              size="sm"
              variant="ghost"
              aria-label="Close terminal"
              onClick={onClose}
              icon={<FiX />}
            />
          </Tooltip>
        </HStack>
      </Flex>

      {/* Connection Status */}
      {connectionError && (
        <Alert status="error" size="sm">
          <AlertIcon />
          <Text fontSize="sm" mb={0}>{connectionError}</Text>
          <Button
            size="sm"
            ml="auto"
            onClick={handleReconnect}
            colorScheme="red"
            variant="solid"
          >
            <FormattedMessage id="text.reconnect" />
          </Button>
        </Alert>
      )}

      {/* Terminal Container */}
      <Box
        ref={terminalRef}
        w="full"
        h="full"
        minH="600px"
        minW="600px"
        bg={terminalBg}
        position="relative"
      />
    </VStack>
  );
}
