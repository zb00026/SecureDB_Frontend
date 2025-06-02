import { extendTheme } from '@chakra-ui/react';

// Modern color palette for enterprise applications
const colors = {
  brand: {
    50: '#e3f2fd',
    100: '#bbdefb',
    200: '#90caf9',
    300: '#64b5f6',
    400: '#42a5f5',
    500: '#2196f3', // Primary brand color
    600: '#1e88e5',
    700: '#1976d2',
    800: '#1565c0',
    900: '#0d47a1',
  },
  success: {
    50: '#e8f5e8',
    100: '#c8e6c9',
    200: '#a5d6a7',
    300: '#81c784',
    400: '#66bb6a',
    500: '#4caf50',
    600: '#43a047',
    700: '#388e3c',
    800: '#2e7d32',
    900: '#1b5e20',
  },
  warning: {
    50: '#fff3e0',
    100: '#ffe0b2',
    200: '#ffcc80',
    300: '#ffb74d',
    400: '#ffa726',
    500: '#ff9800',
    600: '#fb8c00',
    700: '#f57c00',
    800: '#ef6c00',
    900: '#e65100',
  },
  danger: {
    50: '#ffebee',
    100: '#ffcdd2',
    200: '#ef9a9a',
    300: '#e57373',
    400: '#ef5350',
    500: '#f44336',
    600: '#e53935',
    700: '#d32f2f',
    800: '#c62828',
    900: '#b71c1c',
  },
  gray: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  surface: {
    light: '#ffffff',
    dark: '#1a1a1a',
    paper: '#f8f9fa',
    paperDark: '#2d2d2d',
  }
};

// Enhanced typography for enterprise readability
const fonts = {
  heading: `'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`,
  body: `'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`,
  mono: `'JetBrains Mono', 'SF Mono', Monaco, Inconsolata, 'Roboto Mono', monospace`,
};

// Modern shadows for depth and elevation
const shadows = {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  glow: '0 0 20px rgba(33, 150, 243, 0.3)',
  glowHover: '0 0 30px rgba(33, 150, 243, 0.4)',
};

// Component style overrides
const components = {
  Button: {
    baseStyle: {
      fontWeight: '600',
      borderRadius: '12px',
      transition: 'all 0.2s ease-in-out',
      _focus: {
        boxShadow: 'none',
      },
    },
    variants: {
      solid: {
        bg: 'brand.500',
        color: 'white',
        _hover: {
          bg: 'brand.600',
          transform: 'translateY(-1px)',
          boxShadow: 'lg',
        },
        _active: {
          transform: 'translateY(0)',
          boxShadow: 'md',
        },
      },
      primary: {
        bg: 'linear-gradient(135deg, brand.500 0%, brand.600 100%)',
        color: 'white',
        border: 'none',
        _hover: {
          bg: 'linear-gradient(135deg, brand.600 0%, brand.700 100%)',
          transform: 'translateY(-2px)',
          boxShadow: 'xl',
        },
        _active: {
          transform: 'translateY(0)',
        },
      },
      secondary: {
        bg: 'transparent',
        border: '2px solid',
        borderColor: 'brand.500',
        color: 'brand.500',
        _hover: {
          bg: 'brand.50',
          transform: 'translateY(-1px)',
          boxShadow: 'md',
        },
      },
      ghost: {
        bg: 'transparent',
        color: 'gray.600',
        _hover: {
          bg: 'gray.50',
          color: 'gray.700',
        },
        _dark: {
          color: 'gray.300',
          _hover: {
            bg: 'gray.800',
            color: 'gray.200',
          },
        },
      },
    },
    sizes: {
      sm: {
        h: '8',
        minW: '8',
        fontSize: 'sm',
        px: '3',
      },
      md: {
        h: '10',
        minW: '10',
        fontSize: 'md',
        px: '4',
      },
      lg: {
        h: '12',
        minW: '12',
        fontSize: 'lg',
        px: '6',
      },
    },
  },
  Card: {
    baseStyle: {
      p: '6',
      borderRadius: '16px',
      boxShadow: 'md',
      bg: 'surface.light',
      border: '1px solid',
      borderColor: 'gray.200',
      _dark: {
        bg: 'surface.paperDark',
        borderColor: 'gray.700',
      },
    },
    variants: {
      elevated: {
        boxShadow: 'xl',
        border: 'none',
        _hover: {
          transform: 'translateY(-2px)',
          boxShadow: '2xl',
          transition: 'all 0.2s ease-in-out',
        },
      },
      outline: {
        boxShadow: 'none',
        border: '2px solid',
        borderColor: 'gray.200',
        _dark: {
          borderColor: 'gray.600',
        },
      },
    },
  },
  Input: {
    baseStyle: {
      field: {
        borderRadius: '12px',
        border: '2px solid',
        borderColor: 'gray.200',
        _focus: {
          borderColor: 'brand.500',
          boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
        },
        _dark: {
          borderColor: 'gray.600',
          bg: 'gray.800',
        },
      },
    },
    variants: {
      filled: {
        field: {
          bg: 'gray.50',
          border: '2px solid transparent',
          _hover: {
            bg: 'gray.100',
          },
          _focus: {
            bg: 'white',
            borderColor: 'brand.500',
          },
          _dark: {
            bg: 'gray.800',
            _hover: {
              bg: 'gray.700',
            },
            _focus: {
              bg: 'gray.900',
            },
          },
        },
      },
    },
  },
};

// Global styles
const styles = {
  global: (props: any) => ({
    body: {
      fontFamily: 'body',
      color: props.colorMode === 'dark' ? 'gray.100' : 'gray.800',
      bg: props.colorMode === 'dark' ? 'gray.900' : 'gray.50',
      lineHeight: 'tall',
    },
    '*::placeholder': {
      color: props.colorMode === 'dark' ? 'gray.400' : 'gray.500',
    },
    '*, *::before, &::after': {
      borderColor: props.colorMode === 'dark' ? 'gray.700' : 'gray.200',
    },
    // Smooth scrolling
    html: {
      scrollBehavior: 'smooth',
    },
    // Custom scrollbar
    '::-webkit-scrollbar': {
      width: '8px',
    },
    '::-webkit-scrollbar-track': {
      bg: props.colorMode === 'dark' ? 'gray.800' : 'gray.100',
    },
    '::-webkit-scrollbar-thumb': {
      bg: props.colorMode === 'dark' ? 'gray.600' : 'gray.300',
      borderRadius: '4px',
      _hover: {
        bg: props.colorMode === 'dark' ? 'gray.500' : 'gray.400',
      },
    },
  }),
};

const config = {
  initialColorMode: 'light',
  useSystemColorMode: true,
};

export const theme = extendTheme({
  colors,
  fonts,
  shadows,
  components,
  styles,
  config,
  space: {
    px: '1px',
    0.5: '0.125rem',
    1: '0.25rem',
    1.5: '0.375rem',
    2: '0.5rem',
    2.5: '0.625rem',
    3: '0.75rem',
    3.5: '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    28: '7rem',
    32: '8rem',
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
}); 