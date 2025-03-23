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

  // Convert attached image to base64 if present
  let base64Image = null;
  if (attachedImageFile) {
    base64Image = await fileToBase64(attachedImageFile);
    // Add an image bubble in the main chat area (so the conversation shows the image)
    addImageBubble(base64Image, 'user');
  }

  // Show user text bubble if text is entered
  if (userText) {
    addMessage(userText, 'user');
  }

  // If no text and no image, do nothing
  if (!userText && !base64Image) return;

  // Insert a temporary typing bubble
  const typingBubble = addTypingBubble();

  try {
    // Send text and (optional) image to your Flask endpoint
    const res = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: userText,
        image_base64: base64Image
      })
    });
    const data = await res.json();

    // Remove typing bubble
    typingBubble.remove();

    // Add bot reply bubble to the chat area
    addMessage(data.Answer, 'bot');
  } catch (err) {
    typingBubble.remove();
    addMessage("Error: Failed to fetch response.", 'bot');
    console.error(err);
  } finally {
    // Reset inputs and preview so user can attach a new image next time
    clearPreview();
    messageInput.value = '';
    autoResizeTextArea(messageInput);
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

  bubble.innerHTML = `
    <div class="message-text">
      <img 
        src="data:image/png;base64,${base64String}" 
        alt="User attached image" 
        style="max-width: 150px; border-radius: 8px; cursor: pointer;"
      />
    </div>
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

