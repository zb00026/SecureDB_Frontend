import React from 'react';
import { AssetCredential } from '../AssetCredential';
import { Role } from '../../Role';

// Note: RoleOption should be imported where needed, but defining inline for now
export interface RoleOption {
  label: string;
  value: string;
}

// Core AI Chat interfaces
export interface Message {
  readonly id: string;
  readonly type: 'user' | 'ai' | 'system' | 'error';
  readonly content: string;
  readonly timestamp: Date;
  readonly sender?: string;
  readonly suggestions?: MaskingSuggestion[];
  readonly confirmationRequired?: boolean;
}

export interface MaskingSuggestion {
  readonly id: string;
  readonly fieldName: string;
  readonly tableName: string;
  readonly dataType: string;
  readonly suggestedStrategy: string;
  readonly confidence: number;
  readonly isSelected: boolean;
  readonly sensitivityLevel: string;
}

export interface MaskingPolicy {
  readonly originalRequest: string; // description -> originalRequest
  readonly intentType?: string;
  readonly tableName: string;
  readonly fieldName: string;
  readonly maskingStrategy: 'partial' | 'full' | 'hash' | 'custom';
  readonly maskingPattern?: string;
  readonly preserveChars?: number;
  readonly maskChar?: string;
  readonly targetRole?: string;
  readonly aiConfidence?: number;
  readonly aiReasoning?: string;
  readonly roles: string[]; // Changed to string array to match backend @Transient field
  readonly suggestions: MaskingSuggestion[]; // Include all selected suggestions
}

// Theme color interfaces
export interface QuickSuggestionColors {
  readonly text: string;
  readonly border: string;
  readonly hoverBg: string;
  readonly hoverBorder: string;
  readonly disabledText: string;
  readonly disabledBorder: string;
}

export interface ThemeColors {
  readonly sectionGrayBg: string;
  readonly sectionGrayBorder: string;
  readonly sectionGreenBg: string;
  readonly sectionGreenBorder: string;
  readonly sectionBlueBg: string;
  readonly sectionBlueBorder: string;
  readonly sectionPurpleBg: string;
  readonly sectionPurpleBorder: string;
  readonly sectionYellowBg: string;
  readonly sectionYellowBorder: string;
  readonly cardBg: string;
  readonly cardBorder: string;
  readonly cardHoverBg: string;
  readonly cardHoverBorder: string;
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly quickLabel: string;
  readonly disabledText: string;
  readonly disabledBorder: string;
}

export interface ChatTheme {
  readonly bgColor: string;
  readonly borderColor: string;
  readonly userMessageBg: string;
  readonly aiMessageBg: string;
  readonly themeColors: ThemeColors;
}

export interface ChatState {
  readonly messages: Message[];
  readonly setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  readonly inputValue: string;
  readonly setInputValue: React.Dispatch<React.SetStateAction<string>>;
  readonly isLoading: boolean;
  readonly setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  readonly selectedAsset: any;
  readonly setSelectedAsset: React.Dispatch<React.SetStateAction<any>>;
  readonly pendingPolicy: MaskingPolicy | null;
  readonly setPendingPolicy: React.Dispatch<React.SetStateAction<MaskingPolicy | null>>;
  readonly currentSessionId: string | null;
  readonly setCurrentSessionId: React.Dispatch<React.SetStateAction<string | null>>;
  readonly isSessionLoading: boolean;
  readonly setIsSessionLoading: React.Dispatch<React.SetStateAction<boolean>>;
  readonly roleOptions: Array<RoleOption>;
  readonly setRoleOptions: React.Dispatch<React.SetStateAction<Array<RoleOption>>>;
  readonly roles: Array<Role>;
  readonly setRoles: React.Dispatch<React.SetStateAction<Array<Role>>>;
}

// Component prop interfaces
export interface AIMaskingChatProps {
  readonly credentials: AssetCredential[];
  readonly onPolicyCreated?: () => void;
}

export interface ChatHeaderProps {
  readonly assets: any[];
  readonly selectedAsset: any;
  readonly onAssetChange: (assetId: string) => void;
  readonly currentSessionId: string | null;
  readonly isSessionLoading: boolean;
  readonly onRefreshSession: () => void;
  readonly borderColor: string;
  readonly selectBg: string;
  readonly intl: any;
}

export interface ChatMessagesAreaProps {
  readonly messagesContainerRef: React.RefObject<HTMLDivElement>;
  readonly messages: Message[];
  readonly renderMessage: (message: Message) => React.ReactNode;
  readonly isLoading: boolean;
  readonly aiMessageBg: string;
  readonly borderColor: string;
  readonly intl: any;
}

export interface ChatInputAreaProps {
  readonly inputValue: string;
  readonly onInputChange: (value: string) => void;
  readonly onSendMessage: () => void;
  readonly onSendSuggestion: (suggestion: string) => void;
  readonly selectedAsset: any;
  readonly currentSessionId: string | null;
  readonly isSessionLoading: boolean;
  readonly isLoading: boolean;
  readonly borderColor: string;
  readonly quickSuggestionColors: QuickSuggestionColors;
  readonly intl: any;
}

export interface QuickSuggestionsProps {
  readonly onSendSuggestion: (suggestion: string) => void;
  readonly currentSessionId: string | null;
  readonly isSessionLoading: boolean;
  readonly selectedAsset: any;
  readonly colors: QuickSuggestionColors;
}

export interface PolicyConfirmationModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly pendingPolicy: MaskingPolicy | null;
  readonly roleOptions: any[];
  readonly roles: any[];
  readonly onPolicyChange: (policy: MaskingPolicy | null) => void;
  readonly onRoleChange: (selectedOptions: any) => void;
  readonly onConfirmPolicy: () => void;
  readonly intl: any;
}
