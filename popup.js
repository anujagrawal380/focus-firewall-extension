// Load and display blocked websites
function loadBlockedSites() {
  chrome.storage.sync.get(['blockedSites'], (data) => {
    const blockedSites = data.blockedSites || [];
    const blockedList = document.getElementById('blockedList');
    blockedList.innerHTML = '';

    if (blockedSites.length === 0) {
      blockedList.innerHTML = '<p class="empty">No websites blocked yet.</p>';
      return;
    }

    blockedSites.forEach(site => {
      const item = document.createElement('div');
      item.className = 'list-item';
      item.innerHTML = `
        <span class="site-name">${site}</span>
        <button class="remove-btn" data-site="${site}">×</button>
      `;
      blockedList.appendChild(item);
    });

    // Add remove listeners
    document.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const site = e.target.getAttribute('data-site');
        removeBlockedSite(site);
      });
    });
  });
}

// Load and display todos
function loadTodos() {
  chrome.storage.sync.get(['todos'], (data) => {
    let todos = data.todos || [];
    const todosList = document.getElementById('todosList');
    todosList.innerHTML = '';

    if (todos.length === 0) {
      todosList.innerHTML = '<p class="empty">No todos yet.</p>';
      return;
    }

    // Sort by priority: high > medium > low
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    todos = todos.map((todo, originalIndex) => ({ todo, originalIndex }));
    todos.sort((a, b) => {
      const aPriority = a.todo.priority || 'medium';
      const bPriority = b.todo.priority || 'medium';
      return priorityOrder[aPriority] - priorityOrder[bPriority];
    });

    todos.forEach(({ todo, originalIndex }) => {
      const todoText = typeof todo === 'string' ? todo : todo.text;
      const priority = typeof todo === 'string' ? 'medium' : (todo.priority || 'medium');
      
      const item = document.createElement('div');
      item.className = 'list-item';
      item.innerHTML = `
        <span class="priority-badge priority-${priority}">${priority.charAt(0).toUpperCase()}</span>
        <span class="todo-text">${todoText}</span>
        <button class="remove-btn" data-index="${originalIndex}">×</button>
      `;
      todosList.appendChild(item);
    });

    // Add remove listeners
    document.querySelectorAll('#todosList .remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.getAttribute('data-index'));
        removeTodo(index);
      });
    });
  });
}

// Add blocked website
document.getElementById('addWebsiteBtn').addEventListener('click', () => {
  const input = document.getElementById('newWebsite');
  const website = input.value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');

  if (!website) return;

  chrome.storage.sync.get(['blockedSites'], (data) => {
    const blockedSites = data.blockedSites || [];
    
    if (!blockedSites.includes(website)) {
      blockedSites.push(website);
      chrome.storage.sync.set({ blockedSites }, () => {
        input.value = '';
        loadBlockedSites();
      });
    }
  });
});

// Add todo
document.getElementById('addTodoBtn').addEventListener('click', () => {
  const input = document.getElementById('newTodo');
  const prioritySelect = document.getElementById('todoPriority');
  const todoText = input.value.trim();
  const priority = prioritySelect.value;

  if (!todoText) return;

  chrome.storage.sync.get(['todos'], (data) => {
    const todos = data.todos || [];
    todos.push({ text: todoText, priority: priority });
    
    chrome.storage.sync.set({ todos }, () => {
      input.value = '';
      prioritySelect.value = 'medium';
      loadTodos();
    });
  });
});

// Remove blocked site
function removeBlockedSite(site) {
  chrome.storage.sync.get(['blockedSites'], (data) => {
    const blockedSites = data.blockedSites || [];
    const filtered = blockedSites.filter(s => s !== site);
    
    chrome.storage.sync.set({ blockedSites: filtered }, () => {
      loadBlockedSites();
    });
  });
}

// Remove todo
function removeTodo(index) {
  chrome.storage.sync.get(['todos'], (data) => {
    const todos = data.todos || [];
    todos.splice(index, 1);
    
    chrome.storage.sync.set({ todos }, () => {
      loadTodos();
    });
  });
}

// Enter key handlers
document.getElementById('newWebsite').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('addWebsiteBtn').click();
  }
});

document.getElementById('newTodo').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('addTodoBtn').click();
  }
});

// Load and display access history
function loadAccessHistory() {
  chrome.storage.local.get(['accessHistory'], (data) => {
    const history = data.accessHistory || [];
    const historyDiv = document.getElementById('accessHistory');
    historyDiv.innerHTML = '';

    if (history.length === 0) {
      historyDiv.innerHTML = '<p class="empty">No access history yet.</p>';
      return;
    }

    // Show last 10 entries, most recent first
    const recentHistory = history.slice(-10).reverse();
    
    recentHistory.forEach((entry) => {
      const item = document.createElement('div');
      item.className = 'history-item';
      
      const date = new Date(entry.timestamp);
      const dateStr = date.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      const url = new URL(entry.url).hostname.replace('www.', '');
      
      item.innerHTML = `
        <div class="history-header">
          <span class="history-url">${url}</span>
          <span class="history-date">${dateStr}</span>
        </div>
        <div class="history-reason">${entry.reason}</div>
      `;
      historyDiv.appendChild(item);
    });
  });
}

// Clear access history
document.getElementById('clearHistoryBtn').addEventListener('click', () => {
  if (confirm('Clear all access history?')) {
    chrome.storage.local.set({ accessHistory: [] }, () => {
      loadAccessHistory();
    });
  }
});

// Initialize
loadBlockedSites();
loadTodos();
loadAccessHistory();
