import { Button, ButtonProps, useColorModeValue } from "@chakra-ui/react";
import { forwardRef } from "react";

export interface ModernButtonProps extends ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  isLoading?: boolean;
}

export const ModernButton = forwardRef<HTMLButtonElement, ModernButtonProps>(
  ({ variant = 'primary', children, isLoading, ...props }, ref) => {
    const buttonStyles = {
      primary: {
        bg: 'linear-gradient(135deg, #2196f3 0%, #1e88e5 100%)',
        color: 'white',
        border: 'none',
        _hover: {
          bg: 'linear-gradient(135deg, #1e88e5 0%, #1976d2 100%)',
          transform: 'translateY(-2px)',
          boxShadow: 'xl',
        },
        _active: {
          transform: 'translateY(0)',
        },
        _disabled: {
          bg: 'gray.300',
          color: 'gray.500',
          _hover: {
            bg: 'gray.300',
            transform: 'none',
            boxShadow: 'none',
          },
        },
      },
      secondary: {
        bg: useColorModeValue('gray.50', 'gray.700'),
        color: useColorModeValue('gray.700', 'gray.200'),
        border: '2px solid',
        borderColor: useColorModeValue('gray.200', 'gray.600'),
        _hover: {
          bg: useColorModeValue('gray.100', 'gray.600'),
          borderColor: useColorModeValue('gray.300', 'gray.500'),
          transform: 'translateY(-1px)',
          boxShadow: 'md',
        },
        _active: {
          transform: 'translateY(0)',
        },
      },
      outline: {
        bg: 'transparent',
        color: 'brand.500',
        border: '2px solid',
        borderColor: 'brand.500',
        _hover: {
          bg: 'brand.50',
          transform: 'translateY(-1px)',
          boxShadow: 'md',
        },
        _dark: {
          color: 'brand.300',
          borderColor: 'brand.300',
          _hover: {
            bg: 'brand.900',
          },
        },
      },
      ghost: {
        bg: 'transparent',
        color: useColorModeValue('gray.600', 'gray.300'),
        border: 'none',
        _hover: {
          bg: useColorModeValue('gray.50', 'gray.800'),
          color: useColorModeValue('gray.700', 'gray.200'),
        },
      },
      danger: {
        bg: 'linear-gradient(135deg, #f44336 0%, #e53935 100%)',
        color: 'white',
        border: 'none',
        _hover: {
          bg: 'linear-gradient(135deg, #e53935 0%, #d32f2f 100%)',
          transform: 'translateY(-2px)',
          boxShadow: 'xl',
        },
        _active: {
          transform: 'translateY(0)',
        },
      },
    };

    return (
      <Button
        ref={ref}
        fontWeight="600"
        borderRadius="12px"
        transition="all 0.2s ease-in-out"
        px={6}
        py={3}
        h="auto"
        minH="44px"
        fontSize="md"
        isLoading={isLoading}
        _focus={{
          boxShadow: 'none',
        }}
        {...buttonStyles[variant]}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

ModernButton.displayName = 'ModernButton'; 