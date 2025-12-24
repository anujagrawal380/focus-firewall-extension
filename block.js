// Get the blocked URL from query parameter
const urlParams = new URLSearchParams(window.location.search);
const blockedUrl = urlParams.get('url');

// Display blocked URL
document.getElementById('blockedUrl').textContent = blockedUrl || 'Unknown URL';

// Load and display todos
chrome.storage.sync.get(['todos'], (data) => {
  let todos = data.todos || [];
  
  if (todos.length > 0) {
    document.getElementById('todosSection').style.display = 'block';
    const todoList = document.getElementById('todoList');
    
    // Sort by priority
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    todos.sort((a, b) => {
      const aPriority = (typeof a === 'string') ? 'medium' : (a.priority || 'medium');
      const bPriority = (typeof b === 'string') ? 'medium' : (b.priority || 'medium');
      return priorityOrder[aPriority] - priorityOrder[bPriority];
    });
    
    todos.forEach(todo => {
      const todoText = typeof todo === 'string' ? todo : todo.text;
      const priority = typeof todo === 'string' ? 'medium' : (todo.priority || 'medium');
      
      const li = document.createElement('li');
      li.className = `priority-${priority}`;
      li.textContent = todoText;
      todoList.appendChild(li);
    });
  }
});

// Handle explanation textarea
const textarea = document.getElementById('explanation');
const charCount = document.getElementById('charCount');
const proceedBtn = document.getElementById('proceedBtn');
const cancelBtn = document.getElementById('cancelBtn');

textarea.addEventListener('input', () => {
  const length = textarea.value.length;
  charCount.textContent = length;
  
  // Enable proceed button only if explanation is 100+ characters
  if (length >= 100) {
    proceedBtn.disabled = false;
    charCount.parentElement.classList.add('sufficient');
  } else {
    proceedBtn.disabled = true;
    charCount.parentElement.classList.remove('sufficient');
  }
});

// Handle proceed button
proceedBtn.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  
  const explanation = textarea.value.trim();
  
  if (explanation.length >= 100 && blockedUrl) {
    // Disable button to prevent double clicks
    proceedBtn.disabled = true;
    proceedBtn.textContent = 'REDIRECTING...';
    
    // Store access log
    chrome.storage.local.get(['accessHistory'], (data) => {
      const history = data.accessHistory || [];
      history.push({
        url: blockedUrl,
        reason: explanation,
        timestamp: Date.now()
      });
      
      // Keep only last 100 entries
      if (history.length > 100) {
        history.shift();
      }
      
      chrome.storage.local.set({ accessHistory: history }, () => {
        // Tell background script to bypass this URL for this tab
        chrome.runtime.sendMessage(
          { action: 'bypass', url: blockedUrl },
          () => {
            // Now navigate to the URL
            window.location.href = blockedUrl;
          }
        );
      });
    });
  }
});

// Handle cancel button
cancelBtn.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  
  // Go back in history or close tab
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.close();
  }
});
