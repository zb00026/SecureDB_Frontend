import { Box } from "@chakra-ui/react";
import { useRef } from "react";
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import sql from 'react-syntax-highlighter/dist/esm/languages/hljs/sql';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';

// Register SQL language
SyntaxHighlighter.registerLanguage('sql', sql);

interface DamQueryInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  readOnly?: boolean;
}

const LINE_HEIGHT = 24; // px
const LINE_NUMBER_WIDTH = 50; // px (increased for better number display)

export const DamQueryInput = ({ 
  value, 
  onChange, 
  placeholder = "Enter your SQL query here...",
  rows = 10,
  readOnly = false
}: DamQueryInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const syntaxHighlighterRef = useRef<HTMLDivElement>(null);

  // Sync scroll between textarea and syntax highlighter
  const handleScroll = () => {
    if (textareaRef.current && syntaxHighlighterRef.current) {
      const textarea = textareaRef.current;
      const highlighter = syntaxHighlighterRef.current.querySelector('pre');
      if (highlighter) {
        highlighter.scrollTop = textarea.scrollTop;
        highlighter.scrollLeft = textarea.scrollLeft;
      }
    }
  };

  return (
    <Box position="relative" mt={4}>
      <Box 
        display="flex" 
        borderRadius="4px" 
        border="1px solid" 
        borderColor="gray.200" 
        bg="white" 
        overflow="hidden"
        minHeight={`${rows * LINE_HEIGHT + 24}px`}
      >
        {/* Editor Area */}
        <Box flex={1} position="relative" overflow="hidden">
          {/* Syntax Highlighted Background */}
          <Box 
            ref={syntaxHighlighterRef}
            position="absolute" 
            top={0} 
            left={0} 
            right={0} 
            bottom={0} 
            zIndex={1}
            pointerEvents="none"
          >
            <SyntaxHighlighter
              language="sql"
              style={docco}
              showLineNumbers={true}
              customStyle={{
                margin: 0,
                padding: '8px',
                fontFamily: 'monospace',
                fontSize: '14px',
                lineHeight: `${LINE_HEIGHT}px`,
                background: 'transparent',
                border: 'none',
                overflow: 'hidden', // Prevent double scrollbars
                maxHeight: `${rows * LINE_HEIGHT + 16}px`,
                minHeight: `${rows * LINE_HEIGHT + 16}px`,
              }}
              lineNumberStyle={{
                minWidth: '40px',
                paddingRight: '8px',
                marginRight: '8px',
                color: '#666',
                borderRight: '1px solid #e2e8f0',
                backgroundColor: '#f7fafc',
              }}
              wrapLines={false}
              wrapLongLines={false}
            >
              {value || ' '}
            </SyntaxHighlighter>
          </Box>

          {/* Transparent Textarea for Input */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => { onChange(e.target.value); }}
            onScroll={handleScroll}
            placeholder={placeholder}
            readOnly={readOnly}
            disabled={readOnly}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              minHeight: `${rows * LINE_HEIGHT + 16}px`,
              maxHeight: `${rows * LINE_HEIGHT + 16}px`,
              fontFamily: 'monospace',
              fontSize: '14px',
              lineHeight: `${LINE_HEIGHT}px`,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: readOnly ? 'none' : 'vertical',
              color: 'transparent',
              caretColor: readOnly ? 'transparent' : 'black',
              padding: '8px',
              paddingLeft: '56px', // Account for line numbers
              boxSizing: 'border-box',
              zIndex: 2,
              overflow: 'auto',
              whiteSpace: 'pre', // Preserve whitespace
              wordWrap: 'break-word',
              cursor: readOnly ? 'default' : 'text',
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}; 