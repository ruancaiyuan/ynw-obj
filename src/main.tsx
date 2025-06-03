import './pwa';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { Provider } from 'react-redux';
import { theme } from './theme';
import { setupStore } from './store';
import { router } from './routes';

import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import hljsSyntaxPowerShell from 'react-syntax-highlighter/dist/esm/languages/hljs/powershell';
import hljsSyntaxBash from 'react-syntax-highlighter/dist/esm/languages/hljs/bash';

SyntaxHighlighter.registerLanguage('ps1', hljsSyntaxPowerShell);
SyntaxHighlighter.registerLanguage('bash', hljsSyntaxBash);

const store = setupStore();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <ChakraProvider theme={theme}>
        <RouterProvider router={router} />
      </ChakraProvider>
    </Provider>
  </React.StrictMode>,
);
