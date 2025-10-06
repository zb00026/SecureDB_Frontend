declare module 'react-diff-viewer-continued' {
  import React from 'react';

  interface ReactDiffViewerProps {
    oldValue: string;
    newValue: string;
    splitView?: boolean;
    showDiffOnly?: boolean;
    useDarkTheme?: boolean;
    leftTitle?: string;
    rightTitle?: string;
    hideLineNumbers?: boolean;
    styles?: {
      [key: string]: React.CSSProperties;
    };
  }

  const ReactDiffViewer: React.FC<ReactDiffViewerProps>;
  export default ReactDiffViewer;
}
