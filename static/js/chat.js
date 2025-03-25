// chat.js

// Main references
const chatForm      = document.getElementById('chat-form');
const messageInput  = document.getElementById('message');
const chatContainer = document.getElementById('chat-container');

// "Attach Image" references
const attachBtn     = document.getElementById('attachBtn');
const fileInput     = document.getElementById('fileInput');

// Preview container references (inside the form)
const previewContainer = document.getElementById('preview-container');
const previewImg       = document.getElementById('preview-img');
const removeUploadBtn  = document.getElementById('remove-upload');

const blurOverlay = document.getElementById('scroll-blur');

// We'll store the selected image file here so it doesn't upload immediately:
let attachedImageFile = null;

// Add a clear conversation button to the UI
document.addEventListener('DOMContentLoaded', function() {
  // Check if this is a fresh page load (not a refresh)
  if (!sessionStorage.getItem('chatInitialized')) {
    // This is a fresh load, clear the server-side session and images
    fetch('/clear', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    .then(response => response.json())
    .then(data => {
      console.log('Session and uploads cleared on page load');
      // Add welcome message
      addMessageBubble('Hello! I\'m your AI assistant. You can ask me any questions or upload an image for us to discuss.', 'bot');
    })
    .catch(error => {
      console.error('Error clearing session:', error);
    });
    
    // Set flag in session storage
    sessionStorage.setItem('chatInitialized', 'true');
  }
  
  // Add clear button to UI
  const clearButton = document.createElement('button');
  clearButton.id = 'clearBtn'; 
  clearButton.className = 'clear-button';
  clearButton.addEventListener('click', clearConversation);

  const heroSection = document.querySelector('.hero');
  if (heroSection) {
    heroSection.appendChild(clearButton);
  }

  // Enable Enter key to send (Shift+Enter for new line)
  messageInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chatForm.dispatchEvent(new Event('submit'));
    }
  });
  
  // Auto-focus input on page load
  messageInput.focus();
});

// Add scroll handling to modify the title appearance
document.addEventListener('DOMContentLoaded', function() {
  // Create and add the clear button directly to the document body
  const clearButton = document.createElement('button');
  clearButton.id = 'clearBtn';
  clearButton.className = 'clear-button';
  clearButton.addEventListener('click', clearConversation);
  document.body.appendChild(clearButton);
  
  // Handle scroll behavior for the floating title
  const chatContainer = document.getElementById('chat-container');
  const mainTitle = document.querySelector('.main-title');
  
  chatContainer.addEventListener('scroll', function() {
    if (chatContainer.scrollTop > 50) {
      document.body.classList.add('scroll-triggered');
    } else {
      document.body.classList.remove('scroll-triggered');
    }
  });
});

// Reset session flag when page is unloaded
window.addEventListener('unload', function() {
  sessionStorage.removeItem('chatInitialized');
});

/********************************************************
 * 1) Handle "Attach Image" and show inline preview
 ********************************************************/
attachBtn.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', async () => {
  if (fileInput.files && fileInput.files.length > 0) {
    attachedImageFile = fileInput.files[0];
    console.log("User selected image:", attachedImageFile.name);
    // Convert file to base64 for preview display
    const base64 = await fileToBase64(attachedImageFile);
    previewImg.src = `data:image/png;base64,${base64}`;
    // Ensure the preview container is visible
    previewContainer.classList.remove('hidden');
    previewContainer.style.display = 'flex';
  } else {
    clearPreview();
  }
});

// Remove the attached image when user clicks the cross (×)
removeUploadBtn.addEventListener('click', () => {
  clearPreview();
});

// Helper to clear the preview
function clearPreview() {
  attachedImageFile = null;
  fileInput.value = null;
  previewContainer.classList.add('hidden');
  previewContainer.style.display = 'none';
  previewImg.src = '';
}

/********************************************************
 * 2) On form submission, send text + (optional) image
 *    and add an image bubble in the chat area.
 ********************************************************/
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const userText = messageInput.value.trim();

  // Exit if no text and no image
  if (!userText && !attachedImageFile) return;
  
  // Save and clear input right away for better UX
  messageInput.value = '';
  autoResizeTextArea(messageInput);
  
  // Convert attached image to base64 if present
  let base64Image = null;
  if (attachedImageFile) {
    base64Image = await fileToBase64(attachedImageFile);
    // Add image bubble to chat
    addImageBubble(base64Image, 'user');
  }

  // Show user message if text is entered
  if (userText) {
    addMessageBubble(userText, 'user');
  }

  // Show typing indicator
  const typingBubble = addTypingIndicator();
  
  // Scroll to bottom after adding user messages
  scrollToBottom();

  try {
    // Send request to backend
    const res = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: userText,
        image_base64: base64Image
      })
    });
    
    if (!res.ok) {
      throw new Error(`Server responded with status ${res.status}`);
    }
    
    const data = await res.json();

    // Remove typing indicator and add response
    typingBubble.remove();
    addMessageBubble(data.Answer, 'bot');
  } catch (err) {
    typingBubble.remove();
    addMessageBubble(`Sorry, there was an error: ${err.message}`, 'system');
    console.error(err);
  } finally {
    // Reset inputs for next message
    clearPreview();
    scrollToBottom();
  }
});

/********************************************************
 * 3) Add a normal text message bubble to the chat area
 ********************************************************/
function addMessage(text, sender) {
  const bubble = document.createElement('div');
  bubble.classList.add('message', sender);

  let parsed = text;
  if (window.marked) {
    parsed = marked.parse(text);
  }

  const timeStr = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  bubble.innerHTML = `
    <div class="message-text">${parsed}</div>
    <div class="timestamp">${timeStr}</div>
  `;
  chatContainer.appendChild(bubble);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

/********************************************************
 * 4) Add an image bubble to the chat area
 ********************************************************/
function addImageBubble(base64String, sender) {
  const bubble = document.createElement('div');
  bubble.classList.add('message', sender);

  const timeStr = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  bubble.innerHTML = `
    <div class="message-text">
      <img 
        src="data:image/png;base64,${base64String}" 
        alt="User attached image" 
        style="max-width: 150px; border-radius: 8px; cursor: pointer;"
      />
    </div>
    <div class="timestamp">${timeStr}</div>
  `;
  
  const img = bubble.querySelector('img');
  img.addEventListener('click', () => {
    showImageModal(base64String);
  });
  
  chatContainer.appendChild(bubble);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

/********************************************************
 * 5) Show image in a modal (zoom view)
 ********************************************************/
function showImageModal(base64String) {
  const modal = document.getElementById('image-modal');
  const modalImg = document.getElementById('modal-img');
  modalImg.src = `data:image/png;base64,${base64String}`;
  modal.style.display = 'flex';
}

document.getElementById('close-modal').addEventListener('click', () => {
  document.getElementById('image-modal').style.display = 'none';
});

/********************************************************
 * 6) Add a "typing" bubble to the chat area
 ********************************************************/
function addTypingBubble() {
  const bubble = document.createElement('div');
  bubble.classList.add('message', 'bot');
  bubble.setAttribute('id', 'typing-bubble');
  bubble.innerHTML = `
    <div class="message-text"><em>Waiting for response...</em></div>
  `;
  chatContainer.appendChild(bubble);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  return bubble;
}

function addTypingIndicator() {
  const indicator = document.createElement('div');
  indicator.classList.add('message', 'bot');
  indicator.setAttribute('id', 'typing-bubble');
  indicator.innerHTML = `
    <div class="message-text">
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;
  
  chatContainer.appendChild(indicator);
  scrollToBottom();
  
  return indicator;
}

/********************************************************
 * 7) Auto-resize the textarea for multi-line input
 ********************************************************/
messageInput.addEventListener('input', () => {
  autoResizeTextArea(messageInput);
});
function autoResizeTextArea(elem) {
  elem.style.height = 'auto';
  elem.style.height = elem.scrollHeight + 'px';
}

/********************************************************
 * 8) Utility: Convert file to Base64
 ********************************************************/
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

// Function to clear conversation
function clearConversation() {
  // First add a system message
  addMessageBubble('Starting a new conversation...', 'system');
  
  // Call backend to clear session and uploaded images
  fetch('/clear', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  })
  .then(response => response.json())
  .then(data => {
    console.log('Conversation and uploads cleared:', data);
    // Clear all chat messages except the last system message
    const messages = chatContainer.querySelectorAll('.message:not(:last-child)');
    messages.forEach(msg => msg.remove());
    
    // Add a welcome message
    addMessageBubble('Hello! How can I help you today?', 'bot');
  })
  .catch(error => {
    console.error('Error clearing conversation:', error);
    addMessageBubble('Error clearing the conversation. Please try again.', 'system');
  });
}

// Function to scroll chat to bottom
function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Replace the undefined addMessageBubble function with this:
function addMessageBubble(text, type) {
  const bubble = document.createElement('div');
  bubble.classList.add('message', type === 'user' ? 'user' : type === 'bot' ? 'bot' : 'system');

  let parsed = text;
  if (window.marked) {
    marked.setOptions({
      breaks: true,
      gfm: true
    });
    parsed = marked.parse(text);
  }

  const timeStr = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  bubble.innerHTML = `
    <div class="message-text">${parsed}</div>
    ${type !== 'system' ? `<div class="timestamp">${timeStr}</div>` : ''}
  `;
  chatContainer.appendChild(bubble);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  
  return bubble;
}

