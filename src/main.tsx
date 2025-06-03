// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { StagewiseToolbar, type ToolbarConfig } from '@stagewise/toolbar-react';
import './index.css';

// 既存アプリ本体をマウント
const mainContainer = document.getElementById('root');
if (!mainContainer) throw new Error('Cannot find #root');
createRoot(mainContainer).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Stagewise Toolbar を別ルートでマウント
const toolbarConfig: ToolbarConfig = { plugins: [] };
const toolbarRoot = document.createElement('div');
toolbarRoot.id = 'stagewise-toolbar-root';
document.body.appendChild(toolbarRoot);
createRoot(toolbarRoot).render(
  <StrictMode>
    <StagewiseToolbar config={toolbarConfig} />
  </StrictMode>
);
