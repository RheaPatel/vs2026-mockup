// ======================================
// Visual Studio 2026 Mockup — Interactions
// ======================================

document.addEventListener('DOMContentLoaded', () => {

  // --- Line numbers ---
  const gutter = document.getElementById('gutter');
  const codeContent = document.getElementById('codeContent');
  const lines = codeContent.querySelectorAll('.code-line');
  lines.forEach((_, i) => {
    const lineNum = document.createElement('div');
    lineNum.textContent = i + 1;
    lineNum.style.height = '20px';
    lineNum.style.lineHeight = '20px';
    gutter.appendChild(lineNum);
  });

  // --- Close/Toggle chat panel ---
  const chatPanel = document.getElementById('chatPanel');
  const closeChatBtn = document.getElementById('closeChatBtn');
  closeChatBtn.addEventListener('click', () => {
    chatPanel.classList.toggle('hidden');
  });

  // --- Tab switching ---
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  // --- Bottom tab switching ---
  const outputLog = document.getElementById('outputLog');
  document.querySelectorAll('.bottom-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.bottom-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      // Show the corresponding panel
      const panelId = tab.dataset.panel + 'Panel';
      document.querySelectorAll('.panel-content').forEach(p => p.style.display = 'none');
      const panel = document.getElementById(panelId);
      if (panel) panel.style.display = 'block';
    });
  });

  // Helper to append log to output panel
  function appendLog(msg) {
    if (outputLog) {
      const timestamp = new Date().toLocaleTimeString();
      outputLog.textContent += `[${timestamp}] ${msg}\n`;
      outputLog.scrollTop = outputLog.scrollHeight;
    }
  }

  // --- Bottom panel resize ---
  const bottomPanel = document.getElementById('bottomPanel');
  const bottomPanelResize = document.getElementById('bottomPanelResize');
  const expandBtn = document.getElementById('expandBtn');

  // Expand/collapse button
  expandBtn.addEventListener('click', () => {
    bottomPanel.classList.toggle('expanded');
    expandBtn.textContent = bottomPanel.classList.contains('expanded') ? '\u25BC' : '\u25B2';
  });

  // Drag to resize
  let isResizing = false;
  let startY, startHeight;

  bottomPanelResize.addEventListener('mousedown', (e) => {
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
    bottomPanel.classList.remove('expanded');
  });

  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  });

  // --- PR Threads toggle ---
  const prBtn = document.querySelector('.active-thread-btn');
  const copilotBtn = document.querySelector('.copilot-thread-btn');
  const prThreadsView = document.getElementById('prThreadsView');
  const chatView = document.getElementById('chatView');

  prBtn.addEventListener('click', () => {
    prThreadsView.style.display = 'block';
    chatView.style.display = 'none';
    prBtn.classList.add('active-thread-btn');
    copilotBtn.classList.remove('active-thread-btn');
  });
  copilotBtn.addEventListener('click', () => {
    prThreadsView.style.display = 'none';
    chatView.style.display = 'flex';
    copilotBtn.classList.add('active-thread-btn');
    prBtn.classList.remove('active-thread-btn');
  });

  // --- Slash command menu ---
  const chatInput = document.getElementById('chatInput');
  const slashMenu = document.getElementById('slashMenu');

  chatInput.addEventListener('input', () => {
    const val = chatInput.value;
    if (val === '/' || (val.startsWith('/') && val.length < 20)) {
      slashMenu.classList.add('visible');
      agentModePopup.classList.remove('visible');
      modelPopup.classList.remove('visible');
    } else {
      slashMenu.classList.remove('visible');
    }
  });

  chatInput.addEventListener('focus', () => {
    const hint = document.getElementById('chatHint');
    if (chatInput.value === '') {
      hint.classList.add('visible');
    }
  });

  chatInput.addEventListener('blur', () => {
    setTimeout(() => {
      slashMenu.classList.remove('visible');
      document.getElementById('chatHint').classList.remove('visible');
    }, 200);
  });

  // Slash row click
  document.querySelectorAll('.slash-row').forEach(row => {
    row.addEventListener('click', () => {
      chatInput.value = row.dataset.cmd + ' ';
      chatInput.focus();
      slashMenu.classList.remove('visible');
    });
  });

  // --- Agent mode popup ---
  const agentSelector = document.getElementById('agentSelector');
  const agentModePopup = document.getElementById('agentModePopup');

  agentSelector.addEventListener('click', (e) => {
    e.stopPropagation();
    agentModePopup.classList.toggle('visible');
    modelPopup.classList.remove('visible');
    slashMenu.classList.remove('visible');
  });

  document.querySelectorAll('.agent-mode-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.agent-mode-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const name = item.querySelector('.agent-mode-name').textContent;
      agentSelector.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 16 16"><path fill="#b388ff" d="M8 1l2 3h4l-1 3 2 3h-4l-2 3-2-3H3l1-3-2-3h4l2-3z"/></svg>
        ${name}
        <span class="selector-chevron">&#9662;</span>
      `;
      agentModePopup.classList.remove('visible');
    });
  });

  // --- Model popup ---
  const modelSelector = document.getElementById('modelSelector');
  const modelPopup = document.getElementById('modelPopup');

  modelSelector.addEventListener('click', (e) => {
    e.stopPropagation();
    modelPopup.classList.toggle('visible');
    agentModePopup.classList.remove('visible');
    slashMenu.classList.remove('visible');
  });

  document.querySelectorAll('.model-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.model-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const name = item.querySelector('.model-name').textContent.trim();
      modelSelector.innerHTML = `
        ${name}
        <span class="selector-chevron">&#9662;</span>
      `;
      modelPopup.classList.remove('visible');
    });
  });

  // --- Close popups on outside click ---
  document.addEventListener('click', (e) => {
    if (!agentModePopup.contains(e.target) && !agentSelector.contains(e.target)) {
      agentModePopup.classList.remove('visible');
    }
    if (!modelPopup.contains(e.target) && !modelSelector.contains(e.target)) {
      modelPopup.classList.remove('visible');
    }
  });

  // --- Send message ---
  const sendBtn = document.getElementById('sendBtn');
  const chatMessages = document.getElementById('chatMessages');

  // --- Thread Management with localStorage ---
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
        // Ensure at least one thread exists
        if (this.threads.length === 0) {
          this.createThread();
        } else if (!this.activeThreadId || !this.threads.find(t => t.id === this.activeThreadId)) {
          this.activeThreadId = this.threads[0].id;
        }
      } catch (e) {
        console.error('Failed to load threads:', e);
        this.threads = [];
        this.createThread();
      }
      return this;
    },

    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          threads: this.threads,
          activeThreadId: this.activeThreadId
        }));
      } catch (e) {
        console.error('Failed to save threads:', e);
      }
    },

    createThread(title = null) {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const thread = {
        id,
        title: title || `Thread ${this.threads.length + 1}`,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      this.threads.unshift(thread);
      this.activeThreadId = id;
      this.save();
      return thread;
    },

    getActiveThread() {
      return this.threads.find(t => t.id === this.activeThreadId);
    },

    addMessage(role, content) {
      const thread = this.getActiveThread();
      if (thread) {
        thread.messages.push({ role, content, timestamp: Date.now() });
        thread.updatedAt = Date.now();
        // Auto-title based on first user message
        if (thread.messages.length === 1 && role === 'user') {
          thread.title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
        }
        this.save();
      }
    },

    getMessages() {
      const thread = this.getActiveThread();
      return thread ? thread.messages.map(m => ({ role: m.role, content: m.content })) : [];
    },

    switchThread(threadId) {
      if (this.threads.find(t => t.id === threadId)) {
        this.activeThreadId = threadId;
        this.save();
        return true;
      }
      return false;
    },

    deleteThread(threadId) {
      const index = this.threads.findIndex(t => t.id === threadId);
      if (index > -1) {
        this.threads.splice(index, 1);
        if (this.activeThreadId === threadId) {
          this.activeThreadId = this.threads.length > 0 ? this.threads[0].id : null;
          if (!this.activeThreadId) this.createThread();
        }
        this.save();
      }
    }
  };

  // Initialize thread manager
  ThreadManager.load();

  // --- Thread Selector UI ---
  const threadSelect = document.getElementById('threadSelect');
  let threadDropdown = null;

  function updateThreadSelector() {
    const thread = ThreadManager.getActiveThread();
    if (thread && threadSelect) {
      const titleSpan = threadSelect.querySelector('span:not(.thread-chevron)');
      if (titleSpan) {
        titleSpan.textContent = thread.title.length > 25
          ? thread.title.slice(0, 25) + '...'
          : thread.title;
      }
    }
  }

  function renderThreadDropdown() {
    // Remove existing dropdown
    if (threadDropdown) {
      threadDropdown.remove();
      threadDropdown = null;
      return;
    }

    threadDropdown = document.createElement('div');
    threadDropdown.className = 'thread-dropdown';
    threadDropdown.innerHTML = `
      <div class="thread-dropdown-header">
        <span>Threads</span>
        <button class="new-thread-btn" title="New Thread">+ New</button>
      </div>
      <div class="thread-dropdown-list">
        ${ThreadManager.threads.map(t => `
          <div class="thread-dropdown-item ${t.id === ThreadManager.activeThreadId ? 'active' : ''}" data-id="${t.id}">
            <span class="thread-item-title">${escapeHtml(t.title)}</span>
            <span class="thread-item-date">${new Date(t.updatedAt).toLocaleDateString()}</span>
            ${ThreadManager.threads.length > 1 ? `<button class="thread-delete-btn" data-id="${t.id}" title="Delete">&times;</button>` : ''}
          </div>
        `).join('')}
      </div>
    `;

    threadSelect.parentElement.appendChild(threadDropdown);

    // New thread button
    threadDropdown.querySelector('.new-thread-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      ThreadManager.createThread();
      renderChatMessages();
      updateThreadSelector();
      renderThreadDropdown(); // Close dropdown
    });

    // Thread item clicks
    threadDropdown.querySelectorAll('.thread-dropdown-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('thread-delete-btn')) return;
        const id = item.dataset.id;
        if (id !== ThreadManager.activeThreadId) {
          ThreadManager.switchThread(id);
          renderChatMessages();
          updateThreadSelector();
        }
        renderThreadDropdown(); // Close dropdown
      });
    });

    // Delete buttons
    threadDropdown.querySelectorAll('.thread-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        ThreadManager.deleteThread(id);
        renderChatMessages();
        updateThreadSelector();
        renderThreadDropdown(); // Refresh dropdown
        renderThreadDropdown(); // Reopen
      });
    });
  }

  function renderChatMessages() {
    const thread = ThreadManager.getActiveThread();

    // Clear existing messages
    chatMessages.innerHTML = '';

    if (!thread || thread.messages.length === 0) {
      // Show welcome screen
      chatMessages.innerHTML = `
        <div class="welcome-screen">
          <div class="welcome-icon">
            <svg width="72" height="72" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="32" fill="none" stroke="#555" stroke-width="2.5"/>
              <circle cx="26" cy="30" r="4" fill="#555"/>
              <circle cx="46" cy="30" r="4" fill="#555"/>
              <path d="M22 44 c0 0 4 10 14 10 s14-10 14-10" fill="none" stroke="#555" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
          </div>
          <h2 class="welcome-title">Copilot Chat</h2>
          <p class="welcome-subtitle">I might make mistakes, so check for accuracy.</p>
          <div class="welcome-actions">
            <button class="welcome-action-btn">
              <svg width="16" height="16" viewBox="0 0 16 16"><path fill="#0078d4" d="M8 2l2.5 5H14l-3.5 3 1.5 5L8 12 4 15l1.5-5L2 7h3.5L8 2z"/></svg>
              Optimize my code
            </button>
            <button class="welcome-action-btn">
              <svg width="16" height="16" viewBox="0 0 16 16"><path fill="#0078d4" d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 12.5A5.5 5.5 0 1 1 8 2.5a5.5 5.5 0 0 1 0 11zM7 5h2v4H7V5zm0 5h2v2H7v-2z"/></svg>
              Fix my code
            </button>
            <button class="welcome-action-btn">
              <svg width="16" height="16" viewBox="0 0 16 16"><path fill="#0078d4" d="M2 2h12v1H2V2zm0 3h12v1H2V5zm0 3h8v1H2V8zm0 3h10v1H2v-1z"/></svg>
              Write unit tests
            </button>
          </div>
        </div>
      `;
      // Re-attach welcome button listeners
      chatMessages.querySelectorAll('.welcome-action-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          chatInput.value = btn.textContent.trim();
          chatInput.focus();
        });
      });
      return;
    }

    // Render messages
    thread.messages.forEach(msg => {
      const msgEl = document.createElement('div');
      msgEl.className = `chat-msg ${msg.role === 'user' ? 'user-msg' : 'copilot-msg'}`;

      if (msg.role === 'user') {
        msgEl.innerHTML = `
          <div class="msg-avatar user-avatar">RP</div>
          <div class="msg-body">
            <div class="msg-name">You</div>
            <div class="msg-text">${escapeHtml(msg.content)}</div>
          </div>
        `;
      } else {
        msgEl.innerHTML = `
          <div class="msg-avatar copilot-avatar">${COPILOT_AVATAR_SVG}</div>
          <div class="msg-body">
            <div class="msg-name">Copilot</div>
            <div class="msg-text">${renderMarkdown(msg.content)}</div>
            <div class="msg-actions">
              <button class="msg-action-btn">&#128077;</button>
              <button class="msg-action-btn">&#128078;</button>
              <button class="msg-action-btn">&#128203; Copy</button>
            </div>
          </div>
        `;
      }
      chatMessages.appendChild(msgEl);
    });

    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Thread selector click handler
  if (threadSelect) {
    threadSelect.addEventListener('click', (e) => {
      e.stopPropagation();
      renderThreadDropdown();
    });
  }

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (threadDropdown && !threadDropdown.contains(e.target) && !threadSelect.contains(e.target)) {
      threadDropdown.remove();
      threadDropdown = null;
    }
  });

  const COPILOT_AVATAR_SVG = `<svg width="18" height="18" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="#0078d4" stroke-width="1.5"/><circle cx="6" cy="7" r="1" fill="#0078d4"/><circle cx="10" cy="7" r="1" fill="#0078d4"/><path d="M6 10s.5 1.5 2 1.5 2-1.5 2-1.5" fill="none" stroke="#0078d4" stroke-width="1"/></svg>`;

  // Initialize UI
  updateThreadSelector();
  renderChatMessages();

  // Minimal markdown→HTML for streamed text
  function renderMarkdown(md) {
    let html = md;
    // Fenced code blocks: ```lang\n...\n```
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const label = lang || 'code';
      return `<div class="code-block"><div class="code-block-header"><span>${escapeHtml(label)}</span></div><pre><code>${escapeHtml(code)}</code></pre></div>`;
    });
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Unordered lists (lines starting with - )
    html = html.replace(/(^|\n)- (.+)/g, '$1<li>$2</li>');
    html = html.replace(/(<li>.*<\/li>(\n|$))+/g, '<ul>$&</ul>');
    // Ordered lists (lines starting with digit. )
    html = html.replace(/(^|\n)\d+\. (.+)/g, '$1<li>$2</li>');
    // Paragraphs: double newlines
    html = html.replace(/\n{2,}/g, '</p><p>');
    // Single newlines to <br> (but not inside code blocks)
    html = html.replace(/\n/g, '<br>');
    // Wrap in <p> if not already block-level
    if (!html.startsWith('<')) html = '<p>' + html + '</p>';
    return html;
  }

  // Stream response from the proxy server
  // onFirstToken is called once when the first text arrives
  async function streamFromAPI(messages, textEl, onFirstToken) {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
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
      buffer = lines.pop(); // keep incomplete line in buffer

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6);
        if (payload === '[DONE]') break;

        try {
          const { text, log, error } = JSON.parse(payload);
          if (error) throw new Error(error);
          if (log) {
            appendLog(log);
          }
          if (text) {
            if (firstToken) {
              firstToken = false;
              if (onFirstToken) onFirstToken();
            }
            fullText += text;
            textEl.innerHTML = renderMarkdown(fullText);
            chatMessages.scrollTop = chatMessages.scrollHeight;
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

    // Remove welcome screen if present
    const welcome = document.querySelector('.welcome-screen');
    if (welcome) welcome.remove();

    // Add user message
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
    document.getElementById('chatHint').classList.remove('visible');
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Add to thread history (auto-saves to localStorage)
    ThreadManager.addMessage('user', text);
    updateThreadSelector();

    // Show thinking indicator
    const thinkingMsg = document.createElement('div');
    thinkingMsg.className = 'chat-msg copilot-msg';
    thinkingMsg.id = 'thinkingMsg';
    thinkingMsg.innerHTML = `
      <div class="msg-avatar copilot-avatar">${COPILOT_AVATAR_SVG}</div>
      <div class="msg-body">
        <div class="msg-name">Copilot</div>
        <div class="msg-text">
          <div class="thinking-dots"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>
        </div>
      </div>
    `;
    chatMessages.appendChild(thinkingMsg);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Create the response message element (hidden until streaming starts)
    const copilotMsg = document.createElement('div');
    copilotMsg.className = 'chat-msg copilot-msg';
    copilotMsg.innerHTML = `
      <div class="msg-avatar copilot-avatar">${COPILOT_AVATAR_SVG}</div>
      <div class="msg-body">
        <div class="msg-name">Copilot</div>
        <div class="msg-text"></div>
        <div class="msg-actions" style="display:none;">
          <button class="msg-action-btn">&#128077;</button>
          <button class="msg-action-btn">&#128078;</button>
          <button class="msg-action-btn">&#128203; Copy</button>
        </div>
      </div>
    `;
    const textEl = copilotMsg.querySelector('.msg-text');
    const actionsEl = copilotMsg.querySelector('.msg-actions');

    try {
      // Try real API — swap thinking for streaming message on first token
      const fullText = await streamFromAPI(
        ThreadManager.getMessages(),
        textEl,
        () => {
          // On first token: replace thinking dots with the streaming message
          const existing = document.getElementById('thinkingMsg');
          if (existing) existing.remove();
          chatMessages.appendChild(copilotMsg);
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }
      );

      // Show action buttons after streaming completes
      actionsEl.style.display = '';
      chatMessages.scrollTop = chatMessages.scrollHeight;

      // Save assistant response to thread history (auto-saves to localStorage)
      ThreadManager.addMessage('assistant', fullText);
    } catch (err) {
      // Show error - no fallback, proves we need the real API
      console.error('API error:', err.message);
      const existing = document.getElementById('thinkingMsg');
      if (existing) existing.remove();

      textEl.innerHTML = `<p style="color: #f44;"><strong>Error:</strong> ${escapeHtml(err.message)}</p><p>Make sure the server is running: <code>npm start</code></p>`;
      actionsEl.style.display = '';
      chatMessages.appendChild(copilotMsg);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // --- Welcome action buttons ---
  document.querySelectorAll('.welcome-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      chatInput.value = btn.textContent.trim();
      chatInput.focus();
    });
  });

  // --- Helpers ---
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Scroll chat to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // --- Feature Audit Panel ---
  const auditToggle = document.getElementById('auditToggle');
  const auditPanel = document.getElementById('auditPanel');
  const auditClose = document.getElementById('auditClose');

  auditToggle.addEventListener('click', () => {
    auditPanel.classList.toggle('visible');
    document.body.classList.toggle('audit-mode');
  });

  auditClose.addEventListener('click', () => {
    auditPanel.classList.remove('visible');
    document.body.classList.remove('audit-mode');
  });

  // Close audit panel on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && auditPanel.classList.contains('visible')) {
      auditPanel.classList.remove('visible');
      document.body.classList.remove('audit-mode');
    }
  });
});
