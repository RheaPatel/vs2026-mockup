// ======================================
// Visual Studio 2026 Mockup — Full IDE
// ======================================

document.addEventListener('DOMContentLoaded', async () => {

  // --- GitHub OAuth Device Flow Configuration ---
  const GITHUB_OAUTH = {
    // GitHub's official Copilot OAuth App Client ID (public)
    clientId: 'Iv1.b507a08c87ecfe98',
    // Use CORS proxy for OAuth endpoints (GitHub doesn't allow CORS from browsers)
    corsProxy: 'https://corsproxy.io/?',
    deviceCodeUrl: 'https://github.com/login/device/code',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    copilotApiUrl: 'https://api.githubcopilot.com/chat/completions',
    scope: 'read:user copilot'
  };

  // --- Auth Token Storage ---
  const AUTH_STORAGE_KEY = 'vs2026-github-token';
  let githubAccessToken = null;
  let githubUser = null;

  function storeAuthToken(token, user = null) {
    const data = { token, user, storedAt: Date.now() };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
    githubAccessToken = token;
    githubUser = user;
  }

  function getStoredAuth() {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        githubAccessToken = data.token;
        githubUser = data.user;
        return data;
      }
    } catch (e) {
      console.error('Failed to load stored auth:', e);
    }
    return null;
  }

  function clearStoredAuth() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    githubAccessToken = null;
    githubUser = null;
  }

  function isAuthenticated() {
    return !!githubAccessToken;
  }

  function logout() {
    clearStoredAuth();
    appendLog('[Auth] Signed out');
    updateUserAvatar();
    showAuthPrompt();
  }

  function updateUserAvatar() {
    const avatarEl = document.querySelector('.user-avatar-circle');
    if (!avatarEl) return;

    if (isAuthenticated() && githubUser) {
      // Show user initial and add dropdown menu
      avatarEl.innerHTML = `
        <span class="user-initial">${githubUser.charAt(0).toUpperCase()}</span>
      `;
      avatarEl.classList.add('authenticated');
      avatarEl.title = `Signed in as ${githubUser}`;

      // Add click handler for logout menu
      avatarEl.onclick = (e) => {
        e.stopPropagation();
        toggleUserMenu();
      };
    } else {
      // Show default icon
      avatarEl.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 16 16"><circle cx="8" cy="5" r="3" fill="#aaa"/><path fill="#aaa" d="M2 14c0-3 2.5-5 6-5s6 2 6 5H2z"/></svg>
      `;
      avatarEl.classList.remove('authenticated');
      avatarEl.title = 'Not signed in';
      avatarEl.onclick = () => showAuthPrompt();
    }
  }

  function toggleUserMenu() {
    // Remove existing menu
    document.querySelector('.user-menu')?.remove();

    const avatarEl = document.querySelector('.user-avatar-circle');
    if (!avatarEl) return;

    const menu = document.createElement('div');
    menu.className = 'user-menu';
    menu.innerHTML = `
      <div class="user-menu-header">
        <svg width="20" height="20" viewBox="0 0 16 16">
          <path fill="#fff" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
        </svg>
        <span>${githubUser || 'User'}</span>
      </div>
      <div class="user-menu-item" id="logoutBtn">
        <svg width="14" height="14" viewBox="0 0 16 16">
          <path fill="currentColor" d="M2 2.5A2.5 2.5 0 0 1 4.5 0h7A2.5 2.5 0 0 1 14 2.5v11a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 2 13.5v-3h1v3A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 11.5 1h-7A1.5 1.5 0 0 0 3 2.5v3H2v-3z"/>
          <path fill="currentColor" d="M5.854 4.646a.5.5 0 0 1 0 .708L3.207 8l2.647 2.646a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 0 1 .708 0z"/>
          <path fill="currentColor" d="M.5 8a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1H1a.5.5 0 0 1-.5-.5z"/>
        </svg>
        Sign out
      </div>
    `;

    // Position menu below avatar
    const rect = avatarEl.getBoundingClientRect();
    menu.style.top = (rect.bottom + 4) + 'px';
    menu.style.right = (window.innerWidth - rect.right) + 'px';

    document.body.appendChild(menu);

    document.getElementById('logoutBtn')?.addEventListener('click', () => {
      menu.remove();
      logout();
    });

    // Close menu on click outside
    setTimeout(() => {
      document.addEventListener('click', function closeMenu(e) {
        if (!menu.contains(e.target)) {
          menu.remove();
          document.removeEventListener('click', closeMenu);
        }
      });
    }, 0);
  }

  // Load any stored auth on startup
  getStoredAuth();

  // --- GitHub Device Flow Authentication ---
  async function startDeviceFlow() {
    try {
      // Step 1: Request device code (via CORS proxy since GitHub doesn't allow browser CORS)
      const proxyUrl = GITHUB_OAUTH.corsProxy + encodeURIComponent(GITHUB_OAUTH.deviceCodeUrl);
      const codeResponse = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: GITHUB_OAUTH.clientId,
          scope: GITHUB_OAUTH.scope
        })
      });

      if (!codeResponse.ok) {
        const errorText = await codeResponse.text();
        console.error('Device flow error response:', errorText);
        throw new Error('Failed to initiate device flow');
      }

      const codeData = await codeResponse.json();

      // Return the device code info for UI display
      return {
        deviceCode: codeData.device_code,
        userCode: codeData.user_code,
        verificationUri: codeData.verification_uri,
        expiresIn: codeData.expires_in,
        interval: codeData.interval || 5
      };
    } catch (err) {
      console.error('Device flow error:', err);
      throw err;
    }
  }

  async function pollForToken(deviceCode, interval, expiresAt) {
    const pollInterval = Math.max(interval, 5) * 1000; // Minimum 5 seconds as per GitHub spec

    while (Date.now() < expiresAt) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      try {
        // Use CORS proxy for token endpoint
        const proxyUrl = GITHUB_OAUTH.corsProxy + encodeURIComponent(GITHUB_OAUTH.tokenUrl);
        const tokenResponse = await fetch(proxyUrl, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            client_id: GITHUB_OAUTH.clientId,
            device_code: deviceCode,
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
          })
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.access_token) {
          // Success! Get user info and store token
          const userInfo = await fetchGitHubUser(tokenData.access_token);
          storeAuthToken(tokenData.access_token, userInfo?.login);
          return { success: true, token: tokenData.access_token, user: userInfo?.login };
        }

        if (tokenData.error === 'authorization_pending') {
          // User hasn't completed auth yet, continue polling
          continue;
        }

        if (tokenData.error === 'slow_down') {
          // Increase polling interval
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }

        if (tokenData.error === 'expired_token') {
          return { success: false, error: 'Code expired. Please try again.' };
        }

        if (tokenData.error === 'access_denied') {
          return { success: false, error: 'Access denied by user.' };
        }

        // Unknown error
        return { success: false, error: tokenData.error_description || tokenData.error || 'Unknown error' };
      } catch (err) {
        console.error('Polling error:', err);
        // Continue polling on network errors
      }
    }

    return { success: false, error: 'Authentication timed out. Please try again.' };
  }

  async function fetchGitHubUser(token) {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.error('Failed to fetch user info:', err);
    }
    return null;
  }

  // --- GitHub Copilot API Integration ---
  async function* streamCopilotAPI(messages, mode) {
    if (!githubAccessToken) {
      throw new Error('Not authenticated. Please sign in with GitHub.');
    }

    // Build the system message based on mode
    const systemMessage = mode === 'agent'
      ? 'You are a helpful AI coding assistant integrated into Visual Studio 2026. You can help users with code, explain concepts, and provide suggestions. When asked to create or modify files, describe what changes you would make.'
      : 'You are a helpful AI coding assistant. Answer concisely about coding topics. Provide code examples when helpful.';

    const apiMessages = [
      { role: 'system', content: systemMessage },
      ...messages
    ];

    try {
      const response = await fetch('https://api.githubcopilot.com/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubAccessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Editor-Version': 'vscode/1.85.0',
          'Editor-Plugin-Version': 'copilot-chat/0.12.0',
          'Openai-Organization': 'github-copilot',
          'Copilot-Integration-Id': 'vscode-chat'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: apiMessages,
          stream: true,
          temperature: 0.7,
          max_tokens: 4096
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          clearStoredAuth();
          throw new Error('Session expired. Please sign in again.');
        }
        if (response.status === 403) {
          throw new Error('GitHub Copilot access denied. Please ensure you have an active Copilot subscription.');
        }
        const errorText = await response.text();
        throw new Error(`Copilot API error: ${response.status} - ${errorText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();

          if (payload === '[DONE]') {
            return;
          }

          try {
            const data = JSON.parse(payload);
            const content = data.choices?.[0]?.delta?.content;
            if (content) {
              yield { type: 'text', content };
            }
          } catch (e) {
            // Skip malformed JSON chunks
          }
        }
      }
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Network error. Please check your internet connection.');
      }
      throw err;
    }
  }

  // --- Monaco Editor Setup ---
  let editor = null;
  let currentFilePath = null;
  const openTabs = new Map(); // path -> { model, viewState }

  // Load Monaco from CDN
  async function loadMonaco() {
    return new Promise((resolve) => {
      require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });
      require(['vs/editor/editor.main'], () => resolve());
    });
  }

  // Initialize Monaco Editor
  async function initMonaco() {
    await loadMonaco();
    const container = document.getElementById('monacoEditor');

    editor = monaco.editor.create(container, {
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: true },
      fontSize: 13,
      fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      renderWhitespace: 'selection',
      tabSize: 2
    });

    // Auto-save on change (debounced)
    let saveTimeout = null;
    editor.onDidChangeModelContent(() => {
      if (currentFilePath && currentFilePath !== 'welcome') {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => saveCurrentFile(), 1000);
        markTabModified(currentFilePath, true);
      }
    });
  }

  // Get language from file extension
  function getLanguage(filePath) {
    const ext = filePath.split('.').pop().toLowerCase();
    const langMap = {
      js: 'javascript', ts: 'typescript', jsx: 'javascript', tsx: 'typescript',
      json: 'json', html: 'html', htm: 'html', css: 'css', scss: 'scss',
      md: 'markdown', py: 'python', rb: 'ruby', go: 'go', rs: 'rust',
      java: 'java', cs: 'csharp', cpp: 'cpp', c: 'c', h: 'c',
      sh: 'shell', bash: 'shell', yml: 'yaml', yaml: 'yaml', xml: 'xml'
    };
    return langMap[ext] || 'plaintext';
  }

  // Mock file contents for static mode
  const MOCK_FILE_CONTENTS = {
    'src/App.tsx': `import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { fetchUserData } from './utils/api';
import './styles.css';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
}

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await fetchUserData();
        setUser(data);
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  return (
    <div className={\`app \${theme}\`}>
      <Header user={user} onThemeToggle={toggleTheme} />
      <main className="main-content">
        <Dashboard user={user} />
      </main>
    </div>
  );
};

export default App;`,

    'src/index.tsx': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,

    'src/styles.css': `/* Global Styles */
:root {
  --bg-primary: #1e1e1e;
  --bg-secondary: #252526;
  --text-primary: #cccccc;
  --text-secondary: #999999;
  --accent: #0078d4;
  --border: #3f3f3f;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', system-ui, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  min-height: 100vh;
}

.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app.dark {
  --bg-primary: #1e1e1e;
  --text-primary: #ffffff;
}

.app.light {
  --bg-primary: #ffffff;
  --text-primary: #1e1e1e;
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  font-size: 1.5rem;
}

.main-content {
  flex: 1;
  padding: 24px;
}`,

    'src/utils/helpers.ts': `// Utility helper functions

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function classNames(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}`,

    'src/utils/api.ts': `// API utility functions

const API_BASE = '/api/v1';

interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

export async function fetchUserData(): Promise<any> {
  const response = await fetch(\`\${API_BASE}/user\`);
  if (!response.ok) {
    throw new Error('Failed to fetch user data');
  }
  return response.json();
}

export async function updateUserSettings(settings: Record<string, any>): Promise<void> {
  const response = await fetch(\`\${API_BASE}/user/settings\`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!response.ok) {
    throw new Error('Failed to update settings');
  }
}`,

    'package.json': `{
  "name": "my-react-app",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "lint": "eslint src/"
  }
}`,

    'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "ESNext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}`,

    'README.md': `# My React Application

A modern React application with TypeScript support.

## Features

- React 18 with hooks
- TypeScript for type safety
- Dark/Light theme support
- Modular component architecture

## Getting Started

\`\`\`bash
npm install
npm start
\`\`\`

## Project Structure

\`\`\`
src/
  ├── components/    # Reusable UI components
  ├── utils/         # Helper functions and API
  ├── App.tsx        # Main application component
  └── index.tsx      # Entry point
\`\`\`
`,
  };

  // Open a file in the editor
  async function openFile(filePath) {
    const welcomeScreen = document.getElementById('welcomeScreen');
    const monacoContainer = document.getElementById('monacoEditor');

    if (filePath === 'welcome') {
      welcomeScreen.style.display = 'flex';
      monacoContainer.style.display = 'none';
      currentFilePath = 'welcome';
      updateBreadcrumb('Welcome');
      return;
    }

    try {
      let content;
      if (isStaticMode) {
        // Use mock content
        content = MOCK_FILE_CONTENTS[filePath];
        if (!content) {
          content = `// ${filePath}\n// File content not available in demo mode`;
        }
      } else {
        const res = await fetch(`/api/file?path=${encodeURIComponent(filePath)}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        content = data.content;
      }

      welcomeScreen.style.display = 'none';
      monacoContainer.style.display = 'block';

      // Save current view state
      if (currentFilePath && currentFilePath !== 'welcome' && editor) {
        const tab = openTabs.get(currentFilePath);
        if (tab) tab.viewState = editor.saveViewState();
      }

      // Check if already open
      if (openTabs.has(filePath)) {
        const tab = openTabs.get(filePath);
        editor.setModel(tab.model);
        if (tab.viewState) editor.restoreViewState(tab.viewState);
      } else {
        // Create new model
        const model = monaco.editor.createModel(content, getLanguage(filePath));
        openTabs.set(filePath, { model, viewState: null });
        editor.setModel(model);
      }

      currentFilePath = filePath;
      addTab(filePath);
      updateBreadcrumb(filePath);
      updateFileTreeSelection(filePath);
      appendLog(`[File] Opened: ${filePath}`);

    } catch (err) {
      appendLog(`[Error] Failed to open file: ${err.message}`);
    }
  }

  // Auto-open a file in static mode
  function autoOpenDefaultFile() {
    if (isStaticMode && !currentFilePath) {
      setTimeout(() => openFile('src/App.tsx'), 500);
    }
  }

  // Save current file
  async function saveCurrentFile() {
    if (!currentFilePath || currentFilePath === 'welcome' || !editor) return;

    try {
      const content = editor.getValue();
      const res = await fetch('/api/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: currentFilePath, content })
      });
      const { error } = await res.json();
      if (error) throw new Error(error);
      markTabModified(currentFilePath, false);
      appendLog(`[File] Saved: ${currentFilePath}`);
    } catch (err) {
      appendLog(`[Error] Failed to save: ${err.message}`);
    }
  }

  // Refresh file content (after agent edit)
  async function refreshFile(filePath) {
    if (!openTabs.has(filePath)) return;

    try {
      const res = await fetch(`/api/file?path=${encodeURIComponent(filePath)}`);
      const { content, error } = await res.json();
      if (error) throw new Error(error);

      const tab = openTabs.get(filePath);
      tab.model.setValue(content);

      if (currentFilePath === filePath) {
        appendLog(`[File] Refreshed: ${filePath}`);
      }
    } catch (err) {
      appendLog(`[Error] Refresh failed: ${err.message}`);
    }
  }

  // --- Tab Management ---
  const tabBar = document.getElementById('tabBar');

  function addTab(filePath) {
    // Check if tab already exists
    let existing = tabBar.querySelector(`[data-path="${CSS.escape(filePath)}"]`);
    if (existing) {
      activateTab(filePath);
      return;
    }

    const fileName = filePath.split('/').pop();
    const tab = document.createElement('div');
    tab.className = 'tab';
    tab.dataset.path = filePath;
    tab.innerHTML = `
      <span class="tab-icon">${getFileIcon(filePath)}</span>
      <span class="tab-name">${fileName}</span>
      <span class="tab-modified" style="display:none;">●</span>
      <button class="tab-close">&times;</button>
    `;

    tab.addEventListener('click', (e) => {
      if (!e.target.classList.contains('tab-close')) {
        openFile(filePath);
      }
    });

    tab.querySelector('.tab-close').addEventListener('click', (e) => {
      e.stopPropagation();
      closeTab(filePath);
    });

    // Insert before overflow button
    const overflow = tabBar.querySelector('.tab-overflow');
    tabBar.insertBefore(tab, overflow);
    activateTab(filePath);
  }

  function activateTab(filePath) {
    tabBar.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    const tab = tabBar.querySelector(`[data-path="${CSS.escape(filePath)}"]`);
    if (tab) tab.classList.add('active');
  }

  function closeTab(filePath) {
    const tab = tabBar.querySelector(`[data-path="${CSS.escape(filePath)}"]`);
    if (!tab) return;

    // Dispose model
    const tabData = openTabs.get(filePath);
    if (tabData && tabData.model) tabData.model.dispose();
    openTabs.delete(filePath);

    tab.remove();

    // Open another tab or welcome
    if (currentFilePath === filePath) {
      const remaining = Array.from(openTabs.keys());
      if (remaining.length > 0) {
        openFile(remaining[remaining.length - 1]);
      } else {
        openFile('welcome');
      }
    }
  }

  function markTabModified(filePath, modified) {
    const tab = tabBar.querySelector(`[data-path="${CSS.escape(filePath)}"]`);
    if (tab) {
      const indicator = tab.querySelector('.tab-modified');
      indicator.style.display = modified ? 'inline' : 'none';
    }
  }

  function getFileIcon(filePath) {
    const ext = filePath.split('.').pop().toLowerCase();
    const icons = {
      js: '📜', ts: '📘', json: '{ }', html: '🌐', css: '🎨',
      md: '📝', py: '🐍', go: '🔵', rs: '🦀', java: '☕',
      cs: '♯', cpp: '⊕', c: '©', sh: '🖥️', yml: '⚙️', yaml: '⚙️'
    };
    return icons[ext] || '📄';
  }

  // --- Breadcrumb ---
  function updateBreadcrumb(filePath) {
    const breadcrumb = document.getElementById('breadcrumbPath');
    if (filePath === 'welcome') {
      breadcrumb.textContent = 'Welcome';
    } else {
      breadcrumb.textContent = filePath.split('/').slice(-3).join(' › ');
    }
  }

  // --- File Explorer ---
  const fileTree = document.getElementById('fileTree');
  const projectName = document.getElementById('projectName');
  let projectRoot = '';
  let isStaticMode = false; // Set to true when server is unavailable

  // Static mock file tree for GitHub Pages deployment
  const MOCK_FILE_TREE = [
    { name: 'src', path: 'src', isDirectory: true },
    { name: 'components', path: 'src/components', isDirectory: true },
    { name: 'App.tsx', path: 'src/App.tsx', isDirectory: false },
    { name: 'index.tsx', path: 'src/index.tsx', isDirectory: false },
    { name: 'styles.css', path: 'src/styles.css', isDirectory: false },
    { name: 'utils', path: 'src/utils', isDirectory: true },
    { name: 'helpers.ts', path: 'src/utils/helpers.ts', isDirectory: false },
    { name: 'api.ts', path: 'src/utils/api.ts', isDirectory: false },
    { name: 'public', path: 'public', isDirectory: true },
    { name: 'index.html', path: 'public/index.html', isDirectory: false },
    { name: 'package.json', path: 'package.json', isDirectory: false },
    { name: 'tsconfig.json', path: 'tsconfig.json', isDirectory: false },
    { name: 'README.md', path: 'README.md', isDirectory: false },
  ];

  // Organize mock files into tree structure
  function buildMockTree(files) {
    const root = [];
    const dirs = {};

    // First pass: create directory nodes
    files.filter(f => f.isDirectory).forEach(f => {
      dirs[f.path] = { ...f, children: [] };
    });

    // Second pass: assign files to directories or root
    files.forEach(f => {
      const parts = f.path.split('/');
      if (parts.length === 1) {
        root.push(f);
      } else {
        const parentPath = parts.slice(0, -1).join('/');
        if (dirs[parentPath]) {
          dirs[parentPath].children.push(f);
        }
      }
    });

    // Return top-level items
    return files.filter(f => !f.path.includes('/') || f.path.split('/').length === 1);
  }

  async function loadFileTree(dir = '') {
    try {
      const res = await fetch(`/api/files${dir ? `?dir=${encodeURIComponent(dir)}` : ''}`);
      // Check if response is JSON (server running) or HTML (404 page)
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        throw new Error('Server not available');
      }
      const { files, root, error } = await res.json();
      if (error) throw new Error(error);

      projectRoot = root;
      projectName.textContent = root.split('/').pop();

      fileTree.innerHTML = '';
      renderFiles(files, fileTree, 0);
    } catch (err) {
      // Fall back to static mock data
      isStaticMode = true;
      appendLog('[IDE] Running in static demo mode');
      projectName.textContent = 'MyProject';
      fileTree.innerHTML = '';
      const topLevel = MOCK_FILE_TREE.filter(f => !f.path.includes('/'));
      renderFiles(topLevel, fileTree, 0);
    }
  }

  function renderFiles(files, container, depth) {
    files.forEach(file => {
      const item = document.createElement('div');
      item.className = `file-item${depth > 0 ? ` nested${depth > 1 ? '-2' : ''}` : ''}${file.isDirectory ? ' directory' : ''}`;
      item.dataset.path = file.path;

      const icon = file.isDirectory ? '📁' : getFileIcon(file.path);
      item.innerHTML = `<span class="icon">${icon}</span><span class="name">${file.name}</span>`;

      if (file.isDirectory) {
        item.addEventListener('click', async () => {
          if (item.classList.contains('expanded')) {
            // Collapse
            item.classList.remove('expanded');
            item.querySelector('.icon').textContent = '📁';
            let next = item.nextElementSibling;
            while (next && (next.classList.contains('nested') || next.classList.contains('nested-2'))) {
              const toRemove = next;
              next = next.nextElementSibling;
              toRemove.remove();
            }
          } else {
            // Expand
            item.classList.add('expanded');
            item.querySelector('.icon').textContent = '📂';

            let subFiles = [];
            if (isStaticMode) {
              // Use mock data
              subFiles = MOCK_FILE_TREE.filter(f => {
                const parts = f.path.split('/');
                return parts.length > 1 && parts.slice(0, -1).join('/') === file.path;
              });
            } else {
              const res = await fetch(`/api/files?dir=${encodeURIComponent(file.path)}`);
              const data = await res.json();
              subFiles = data.files || [];
            }

            const tempContainer = document.createElement('div');
            renderFiles(subFiles, tempContainer, depth + 1);
            // Insert after this item
            let insertAfter = item;
            Array.from(tempContainer.children).forEach(child => {
              insertAfter.after(child);
              insertAfter = child;
            });
          }
        });
      } else {
        item.addEventListener('click', () => openFile(file.path));
      }

      container.appendChild(item);
    });
  }

  function updateFileTreeSelection(filePath) {
    fileTree.querySelectorAll('.file-item').forEach(item => {
      item.classList.toggle('active', item.dataset.path === filePath);
    });
  }

  // Refresh button
  document.getElementById('refreshFiles')?.addEventListener('click', () => loadFileTree());

  // --- Output Panel ---
  const outputLog = document.getElementById('outputLog');

  function appendLog(msg) {
    if (outputLog) {
      const timestamp = new Date().toLocaleTimeString();
      outputLog.textContent += `[${timestamp}] ${msg}\n`;
      outputLog.scrollTop = outputLog.scrollHeight;
    }
    console.log(msg);
  }

  // --- Bottom Panel Resize ---
  const bottomPanel = document.getElementById('bottomPanel');
  const bottomPanelResize = document.getElementById('bottomPanelResize');
  const expandBtn = document.getElementById('expandBtn');

  if (expandBtn) {
    expandBtn.addEventListener('click', () => {
      bottomPanel.classList.toggle('expanded');
      expandBtn.textContent = bottomPanel.classList.contains('expanded') ? '▼' : '▲';
    });
  }

  let isResizing = false;
  let startY, startHeight;

  bottomPanelResize?.addEventListener('mousedown', (e) => {
    isResizing = true;
    startY = e.clientY;
    startHeight = bottomPanel.offsetHeight;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const delta = startY - e.clientY;
    const newHeight = Math.min(Math.max(startHeight + delta, 60), window.innerHeight * 0.6);
    bottomPanel.style.height = newHeight + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  });

  // --- Bottom Tab Switching ---
  document.querySelectorAll('.bottom-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.bottom-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const panelId = tab.dataset.panel + 'Panel';
      document.querySelectorAll('.panel-content').forEach(p => p.style.display = 'none');
      const panel = document.getElementById(panelId);
      if (panel) panel.style.display = 'block';
    });
  });

  // --- Chat Panel ---
  const chatPanel = document.getElementById('chatPanel');
  const closeChatBtn = document.getElementById('closeChatBtn');
  closeChatBtn?.addEventListener('click', () => chatPanel.classList.toggle('hidden'));

  // --- PR Threads Toggle ---
  const prBtn = document.querySelector('.active-thread-btn');
  const copilotBtn = document.querySelector('.copilot-thread-btn');
  const prThreadsView = document.getElementById('prThreadsView');
  const chatView = document.getElementById('chatView');

  prBtn?.addEventListener('click', () => {
    prThreadsView.style.display = 'block';
    chatView.style.display = 'none';
    prBtn.classList.add('active-thread-btn');
    copilotBtn.classList.remove('active-thread-btn');
  });
  copilotBtn?.addEventListener('click', () => {
    prThreadsView.style.display = 'none';
    chatView.style.display = 'flex';
    copilotBtn.classList.add('active-thread-btn');
    prBtn.classList.remove('active-thread-btn');
  });

  // --- Agent Mode & Model Selection ---
  let currentMode = 'ask';
  let currentModel = 'gpt-4.1';

  const agentSelector = document.getElementById('agentSelector');
  const agentModePopup = document.getElementById('agentModePopup');
  const modelSelector = document.getElementById('modelSelector');
  const modelPopup = document.getElementById('modelPopup');

  agentSelector?.addEventListener('click', (e) => {
    e.stopPropagation();
    agentModePopup.classList.toggle('visible');
    modelPopup.classList.remove('visible');
  });

  document.querySelectorAll('.agent-mode-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.agent-mode-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      currentMode = item.dataset.mode;
      const name = item.querySelector('.agent-mode-name').textContent;
      agentSelector.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 16 16"><path fill="${currentMode === 'agent' ? '#b388ff' : '#ccc'}" d="M8 1l2 3h4l-1 3 2 3h-4l-2 3-2-3H3l1-3-2-3h4l2-3z"/></svg>
        ${name}
        <span class="selector-chevron">&#9662;</span>
      `;
      agentModePopup.classList.remove('visible');
      appendLog(`[Mode] Switched to: ${name}`);
    });
  });

  modelSelector?.addEventListener('click', (e) => {
    e.stopPropagation();
    modelPopup.classList.toggle('visible');
    agentModePopup.classList.remove('visible');
  });

  document.querySelectorAll('.model-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.model-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      currentModel = item.dataset.model;
      const name = item.querySelector('.model-name').textContent.trim();
      modelSelector.innerHTML = `${name}<span class="selector-chevron">&#9662;</span>`;
      modelPopup.classList.remove('visible');
    });
  });

  document.addEventListener('click', (e) => {
    if (!agentModePopup?.contains(e.target) && !agentSelector?.contains(e.target)) {
      agentModePopup?.classList.remove('visible');
    }
    if (!modelPopup?.contains(e.target) && !modelSelector?.contains(e.target)) {
      modelPopup?.classList.remove('visible');
    }
  });

  // --- Slash Menu ---
  const chatInput = document.getElementById('chatInput');
  const slashMenu = document.getElementById('slashMenu');

  chatInput?.addEventListener('input', () => {
    const val = chatInput.value;
    if (val === '/' || (val.startsWith('/') && val.length < 20)) {
      slashMenu.classList.add('visible');
      agentModePopup?.classList.remove('visible');
      modelPopup?.classList.remove('visible');
    } else {
      slashMenu.classList.remove('visible');
    }
  });

  chatInput?.addEventListener('focus', () => {
    const hint = document.getElementById('chatHint');
    if (chatInput.value === '') hint?.classList.add('visible');
  });

  chatInput?.addEventListener('blur', () => {
    setTimeout(() => {
      slashMenu.classList.remove('visible');
      document.getElementById('chatHint')?.classList.remove('visible');
    }, 200);
  });

  document.querySelectorAll('.slash-row').forEach(row => {
    row.addEventListener('click', () => {
      chatInput.value = row.dataset.cmd + ' ';
      chatInput.focus();
      slashMenu.classList.remove('visible');
    });
  });

  // --- Thread Management ---
  const STORAGE_KEY = 'vs2026-copilot-threads';

  const ThreadManager = {
    threads: [],
    activeThreadId: null,

    load() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const data = JSON.parse(saved);
          this.threads = data.threads || [];
          this.activeThreadId = data.activeThreadId;
        }
        if (this.threads.length === 0) this.createThread();
        else if (!this.activeThreadId) this.activeThreadId = this.threads[0].id;
      } catch (e) {
        this.threads = [];
        this.createThread();
      }
      return this;
    },

    save() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        threads: this.threads,
        activeThreadId: this.activeThreadId
      }));
    },

    createThread(title = null) {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const thread = { id, title: title || `Thread ${this.threads.length + 1}`, messages: [], createdAt: Date.now(), updatedAt: Date.now() };
      this.threads.unshift(thread);
      this.activeThreadId = id;
      this.save();
      return thread;
    },

    getActiveThread() { return this.threads.find(t => t.id === this.activeThreadId); },

    addMessage(role, content) {
      const thread = this.getActiveThread();
      if (thread) {
        thread.messages.push({ role, content, timestamp: Date.now() });
        thread.updatedAt = Date.now();
        if (thread.messages.length === 1 && role === 'user') {
          thread.title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
        }
        this.save();
      }
    },

    getMessages() {
      const thread = this.getActiveThread();
      return thread ? thread.messages.map(m => ({ role: m.role, content: m.content })) : [];
    }
  };

  ThreadManager.load();

  // --- Chat UI ---
  const sendBtn = document.getElementById('sendBtn');
  const chatMessages = document.getElementById('chatMessages');
  const COPILOT_AVATAR_SVG = `<svg width="18" height="18" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="#0078d4" stroke-width="1.5"/><circle cx="6" cy="7" r="1" fill="#0078d4"/><circle cx="10" cy="7" r="1" fill="#0078d4"/><path d="M6 10s.5 1.5 2 1.5 2-1.5 2-1.5" fill="none" stroke="#0078d4" stroke-width="1"/></svg>`;

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function renderMarkdown(md) {
    let html = md;
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      return `<div class="code-block"><div class="code-block-header"><span>${escapeHtml(lang || 'code')}</span></div><pre><code>${escapeHtml(code)}</code></pre></div>`;
    });
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/(^|\n)- (.+)/g, '$1<li>$2</li>');
    html = html.replace(/\n{2,}/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    if (!html.startsWith('<')) html = '<p>' + html + '</p>';
    return html;
  }

  // Stream response from API with tool call handling
  async function streamFromAPI(messages, mode, textEl, onFirstToken) {
    // In static mode, use GitHub Copilot API directly
    if (isStaticMode) {
      if (!isAuthenticated()) {
        throw new Error('Please sign in with GitHub to use chat features.');
      }

      let fullText = '';
      let firstToken = true;

      try {
        appendLog('[Copilot] Sending request...');
        for await (const event of streamCopilotAPI(messages, mode)) {
          if (event.type === 'text') {
            if (firstToken) {
              firstToken = false;
              if (onFirstToken) onFirstToken();
            }
            fullText += event.content;
            textEl.innerHTML = renderMarkdown(fullText);
            chatMessages.scrollTop = chatMessages.scrollHeight;
          }
        }
        appendLog('[Copilot] Response complete');
      } catch (err) {
        // If auth error, prompt for re-authentication
        if (err.message.includes('Session expired') || err.message.includes('sign in')) {
          showAuthPrompt();
        }
        throw err;
      }

      return fullText;
    }

    // Server mode: use the local API
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, mode })
    });

    if (!res.ok) throw new Error(`Server returned ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';
    let firstToken = true;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6);
        if (payload === '[DONE]') break;

        try {
          const event = JSON.parse(payload);

          if (event.type === 'log') {
            appendLog(event.message);
          } else if (event.type === 'text') {
            if (firstToken) {
              firstToken = false;
              if (onFirstToken) onFirstToken();
            }
            fullText += event.content;
            textEl.innerHTML = renderMarkdown(fullText);
            chatMessages.scrollTop = chatMessages.scrollHeight;
          } else if (event.type === 'toolStatus') {
            // Show tool activity in the chat
            const toolName = event.tool;
            const status = event.status;

            if (status === 'running') {
              // Show tool is running
              const toolIndicator = document.createElement('div');
              toolIndicator.className = 'tool-indicator';
              toolIndicator.id = `tool-${toolName}-indicator`;
              if (toolName === 'listFiles') {
                toolIndicator.innerHTML = `<span class="tool-icon">📂</span> Exploring ${event.directory || 'directory'}...`;
              } else if (toolName === 'readFile') {
                toolIndicator.innerHTML = `<span class="tool-icon">📖</span> Reading ${event.path}...`;
              } else if (toolName === 'writeFile') {
                toolIndicator.innerHTML = `<span class="tool-icon">✏️</span> Writing ${event.path}...`;
              }
              textEl.appendChild(toolIndicator);
              chatMessages.scrollTop = chatMessages.scrollHeight;
              appendLog(`[Agent] ${toolName}: ${event.path || event.directory || ''}`);
            } else if (status === 'success') {
              // Update indicator to show success
              const indicator = document.getElementById(`tool-${toolName}-indicator`);
              if (indicator) {
                if (toolName === 'listFiles') {
                  indicator.innerHTML = `<span class="tool-icon">✅</span> Found ${event.count} items in ${event.directory}`;
                } else if (toolName === 'readFile') {
                  indicator.innerHTML = `<span class="tool-icon">✅</span> Read ${event.path}`;
                } else if (toolName === 'writeFile') {
                  indicator.innerHTML = `<span class="tool-icon">✅</span> Wrote ${event.path} (${event.bytesWritten} bytes)`;
                  // Open the file and refresh tree
                  setTimeout(async () => {
                    await openFile(event.path);
                    loadFileTree();
                  }, 100);
                }
                indicator.classList.add('tool-success');
              }
            } else if (status === 'error') {
              const indicator = document.getElementById(`tool-${toolName}-indicator`);
              if (indicator) {
                indicator.innerHTML = `<span class="tool-icon">❌</span> Failed: ${event.error}`;
                indicator.classList.add('tool-error');
              }
            }
          } else if (event.type === 'tool') {
            // Legacy tool event - refresh the file if it was written
            if (event.name === 'writeFile' && event.result?.success) {
              const filePath = event.args?.path;
              if (filePath) {
                await openFile(filePath);
                appendLog(`[Agent] Modified: ${filePath}`);
              }
              loadFileTree();
            }
          } else if (event.type === 'error') {
            throw new Error(event.message);
          }
        } catch (e) {
          if (e.message !== 'Unexpected end of JSON input') throw e;
        }
      }
    }

    return fullText;
  }

  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Remove welcome screen
    const welcome = document.querySelector('.welcome-screen');
    if (welcome) welcome.remove();

    // Add context about current file if in agent mode
    let messageText = text;
    if (currentMode === 'agent' && currentFilePath && currentFilePath !== 'welcome') {
      messageText = `[Current file: ${currentFilePath}]\n\n${text}`;
    }

    // Add user message to UI
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-msg user-msg';
    userMsg.innerHTML = `
      <div class="msg-avatar user-avatar">RP</div>
      <div class="msg-body">
        <div class="msg-name">You</div>
        <div class="msg-text">${escapeHtml(text)}</div>
      </div>
    `;
    chatMessages.appendChild(userMsg);
    chatInput.value = '';
    slashMenu.classList.remove('visible');
    chatMessages.scrollTop = chatMessages.scrollHeight;

    ThreadManager.addMessage('user', text);

    // Show thinking indicator
    const thinkingMsg = document.createElement('div');
    thinkingMsg.className = 'chat-msg copilot-msg';
    thinkingMsg.id = 'thinkingMsg';
    thinkingMsg.innerHTML = `
      <div class="msg-avatar copilot-avatar">${COPILOT_AVATAR_SVG}</div>
      <div class="msg-body">
        <div class="msg-name">Copilot ${currentMode === 'agent' ? '(Agent)' : ''}</div>
        <div class="msg-text"><div class="thinking-dots"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div></div>
      </div>
    `;
    chatMessages.appendChild(thinkingMsg);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Create response element
    const copilotMsg = document.createElement('div');
    copilotMsg.className = 'chat-msg copilot-msg';
    copilotMsg.innerHTML = `
      <div class="msg-avatar copilot-avatar">${COPILOT_AVATAR_SVG}</div>
      <div class="msg-body">
        <div class="msg-name">Copilot ${currentMode === 'agent' ? '(Agent)' : ''}</div>
        <div class="msg-text"></div>
        <div class="msg-actions" style="display:none;">
          <button class="msg-action-btn">👍</button>
          <button class="msg-action-btn">👎</button>
          <button class="msg-action-btn">📋 Copy</button>
        </div>
      </div>
    `;
    const textEl = copilotMsg.querySelector('.msg-text');
    const actionsEl = copilotMsg.querySelector('.msg-actions');

    try {
      const fullText = await streamFromAPI(
        [...ThreadManager.getMessages().slice(0, -1), { role: 'user', content: messageText }],
        currentMode,
        textEl,
        () => {
          document.getElementById('thinkingMsg')?.remove();
          chatMessages.appendChild(copilotMsg);
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }
      );

      actionsEl.style.display = '';
      ThreadManager.addMessage('assistant', fullText);
    } catch (err) {
      document.getElementById('thinkingMsg')?.remove();
      textEl.innerHTML = `<p style="color: #f44;"><strong>Error:</strong> ${escapeHtml(err.message)}</p>`;
      chatMessages.appendChild(copilotMsg);
    }

    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  sendBtn?.addEventListener('click', sendMessage);
  chatInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Welcome action buttons
  document.querySelectorAll('.welcome-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      chatInput.value = btn.textContent.trim();
      chatInput.focus();
    });
  });

  // --- Feature Audit Panel ---
  const auditToggle = document.getElementById('auditToggle');
  const auditPanel = document.getElementById('auditPanel');
  const auditClose = document.getElementById('auditClose');

  auditToggle?.addEventListener('click', () => {
    auditPanel.classList.toggle('visible');
    document.body.classList.toggle('audit-mode');
  });

  auditClose?.addEventListener('click', () => {
    auditPanel.classList.remove('visible');
    document.body.classList.remove('audit-mode');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && auditPanel?.classList.contains('visible')) {
      auditPanel.classList.remove('visible');
      document.body.classList.remove('audit-mode');
    }
  });

  // --- Auth Status Check ---
  async function checkAuthStatus() {
    if (isStaticMode) {
      // In static mode, check for stored GitHub OAuth token
      if (isAuthenticated()) {
        appendLog(`[Auth] Signed in as: ${githubUser || 'authenticated'}`);
        appendLog('[Auth] GitHub Copilot ready');
        return true;
      } else {
        appendLog('[Auth] Static mode - Sign in with GitHub to use chat features');
        showAuthPrompt();
        return false;
      }
    }

    // Server mode: check local server auth
    try {
      const res = await fetch('/api/auth/status');
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        throw new Error('Server not available');
      }
      const status = await res.json();

      if (!status.authenticated) {
        showAuthPrompt(status);
        return false;
      }

      if (status.copilotReady) {
        appendLog(`[Auth] Logged in as: ${status.user}`);
        appendLog('[Auth] Copilot SDK ready');
      } else {
        appendLog('[Auth] Authenticated but Copilot not ready - some features may be limited');
      }
      return true;
    } catch (err) {
      appendLog('[Auth] Running in demo mode');
      return false;
    }
  }

  function showAuthPrompt(options = {}) {
    // Remove any existing overlay
    document.querySelector('.auth-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'auth-overlay';
    overlay.id = 'authOverlay';

    // Determine if this is static mode (GitHub Pages) or server mode
    const isGitHubPages = isStaticMode;

    if (isGitHubPages) {
      // GitHub Pages: Show Device Flow sign-in button (uses CORS proxy)
      overlay.innerHTML = `
        <div class="auth-modal">
          <div class="auth-icon">
            <svg width="64" height="64" viewBox="0 0 16 16">
              <path fill="#fff" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
          </div>
          <h2>Sign in with GitHub</h2>
          <p>Connect your GitHub account to use Copilot chat features.</p>
          <div class="auth-actions">
            <button class="auth-btn primary" id="startAuthBtn">
              <svg width="16" height="16" viewBox="0 0 16 16" style="margin-right: 8px; vertical-align: middle;">
                <path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
              </svg>
              Sign in with GitHub
            </button>
            <button class="auth-btn secondary" id="skipAuthBtn">Continue Without Auth</button>
          </div>
          <p class="auth-note">The IDE will work for file browsing, but chat features require authentication.</p>
        </div>
      `;
    } else {
      // Server mode: Show CLI instructions
      overlay.innerHTML = `
        <div class="auth-modal">
          <div class="auth-icon">
            <svg width="64" height="64" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="7" fill="none" stroke="#f0883e" stroke-width="1.5"/>
              <path fill="#f0883e" d="M8 4v5M8 10.5v1"/>
            </svg>
          </div>
          <h2>GitHub Authentication Required</h2>
          <p>To use Copilot features, please authenticate with GitHub CLI.</p>
          <div class="auth-steps">
            ${options.instructions ? options.instructions.map(step => `<div class="auth-step">${step}</div>`).join('') : ''}
          </div>
          <div class="auth-actions">
            <button class="auth-btn primary" onclick="location.reload()">Refresh</button>
            <button class="auth-btn secondary" id="skipAuthBtn">Continue Without Auth</button>
          </div>
          <p class="auth-note">The IDE will work for file browsing, but chat features require authentication.</p>
        </div>
      `;
    }

    document.body.appendChild(overlay);

    // Attach event listeners
    const startAuthBtn = document.getElementById('startAuthBtn');
    const skipAuthBtn = document.getElementById('skipAuthBtn');

    if (startAuthBtn) {
      startAuthBtn.addEventListener('click', handleDeviceFlowAuth);
    }

    if (skipAuthBtn) {
      skipAuthBtn.addEventListener('click', () => {
        overlay.remove();
        appendLog('[Auth] Continuing without authentication');
      });
    }
  }

  async function handleDeviceFlowAuth() {
    const overlay = document.getElementById('authOverlay');
    if (!overlay) return;

    const modal = overlay.querySelector('.auth-modal');

    // Show loading state
    modal.innerHTML = `
      <div class="auth-icon">
        <div class="auth-spinner"></div>
      </div>
      <h2>Connecting to GitHub...</h2>
      <p>Please wait while we initiate the sign-in process.</p>
    `;

    try {
      const deviceInfo = await startDeviceFlow();

      // Show the device code
      modal.innerHTML = `
        <div class="auth-icon">
          <svg width="64" height="64" viewBox="0 0 16 16">
            <path fill="#2ea043" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
        </div>
        <h2>Enter the code on GitHub</h2>
        <p>Go to <a href="${deviceInfo.verificationUri}" target="_blank" class="verification-link">${deviceInfo.verificationUri}</a> and enter this code:</p>
        <div class="device-code">${deviceInfo.userCode}</div>
        <div class="auth-polling">
          <div class="auth-spinner-small"></div>
          <span>Waiting for authorization...</span>
        </div>
        <div class="auth-actions">
          <button class="auth-btn secondary" id="cancelAuthBtn">Cancel</button>
        </div>
        <p class="auth-note">This code expires in ${Math.floor(deviceInfo.expiresIn / 60)} minutes.</p>
      `;

      // Add cancel button handler
      document.getElementById('cancelAuthBtn')?.addEventListener('click', () => {
        overlay.remove();
        appendLog('[Auth] Authentication cancelled');
      });

      // Copy code to clipboard on click
      const codeEl = modal.querySelector('.device-code');
      codeEl.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(deviceInfo.userCode);
          codeEl.classList.add('copied');
          setTimeout(() => codeEl.classList.remove('copied'), 2000);
        } catch (e) {
          console.error('Failed to copy:', e);
        }
      });

      // Start polling for token
      const expiresAt = Date.now() + (deviceInfo.expiresIn * 1000);
      const result = await pollForToken(deviceInfo.deviceCode, deviceInfo.interval, expiresAt);

      if (result.success) {
        // Success! Show success message and close
        modal.innerHTML = `
          <div class="auth-icon">
            <svg width="64" height="64" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="7" fill="none" stroke="#2ea043" stroke-width="1.5"/>
              <path fill="#2ea043" d="M6.5 10.5L4 8l1-1 1.5 1.5L10 5l1 1-4.5 4.5z"/>
            </svg>
          </div>
          <h2>Successfully signed in!</h2>
          <p>Welcome, ${result.user || 'user'}! You can now use Copilot features.</p>
          <div class="auth-actions">
            <button class="auth-btn primary" id="closeAuthBtn">Get Started</button>
          </div>
        `;

        document.getElementById('closeAuthBtn')?.addEventListener('click', () => {
          overlay.remove();
        });

        appendLog(`[Auth] Signed in as: ${result.user || 'authenticated'}`);
        appendLog('[Auth] GitHub Copilot ready');
        updateUserAvatar();
      } else {
        // Error
        modal.innerHTML = `
          <div class="auth-icon">
            <svg width="64" height="64" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="7" fill="none" stroke="#f44" stroke-width="1.5"/>
              <path fill="#f44" d="M8 4v5M8 10.5v1"/>
            </svg>
          </div>
          <h2>Authentication Failed</h2>
          <p>${result.error}</p>
          <div class="auth-actions">
            <button class="auth-btn primary" id="retryAuthBtn">Try Again</button>
            <button class="auth-btn secondary" id="closeErrorBtn">Close</button>
          </div>
        `;

        document.getElementById('retryAuthBtn')?.addEventListener('click', () => {
          overlay.remove();
          showAuthPrompt();
        });
        document.getElementById('closeErrorBtn')?.addEventListener('click', () => {
          overlay.remove();
        });

        appendLog(`[Auth] Authentication failed: ${result.error}`);
      }
    } catch (err) {
      // Show error
      modal.innerHTML = `
        <div class="auth-icon">
          <svg width="64" height="64" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="7" fill="none" stroke="#f44" stroke-width="1.5"/>
            <path fill="#f44" d="M8 4v5M8 10.5v1"/>
          </svg>
        </div>
        <h2>Connection Error</h2>
        <p>Failed to connect to GitHub. Please check your internet connection and try again.</p>
        <div class="auth-actions">
          <button class="auth-btn primary" id="retryAuthBtn">Try Again</button>
          <button class="auth-btn secondary" id="closeErrorBtn">Close</button>
        </div>
      `;

      document.getElementById('retryAuthBtn')?.addEventListener('click', () => {
        overlay.remove();
        showAuthPrompt();
      });
      document.getElementById('closeErrorBtn')?.addEventListener('click', () => {
        overlay.remove();
      });

      appendLog(`[Auth] Error: ${err.message}`);
    }
  }

  // --- Initialize ---
  await initMonaco();
  await loadFileTree();
  updateUserAvatar(); // Update avatar based on auth state
  await checkAuthStatus();
  appendLog('[IDE] Ready - Monaco Editor loaded');
  appendLog('[IDE] Select "Agent" mode to let Copilot edit files');
  autoOpenDefaultFile();
});
