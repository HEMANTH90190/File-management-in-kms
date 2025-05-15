// Check authentication
const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
if (!currentUser) {
    window.location.href = 'login.html';
}

// Display user info
document.getElementById('userDisplay').textContent = `Welcome, ${currentUser.username} (${currentUser.role})`;

// Handle logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
});

// Store documents in localStorage
let documents = JSON.parse(localStorage.getItem('documents')) || [];

// DOM Elements
const uploadForm = document.getElementById('uploadForm');
const documentsGrid = document.getElementById('documentsGrid');
const searchInput = document.getElementById('searchInput');
const categoryLinks = document.querySelectorAll('.categories a');

// Event Listeners
uploadForm.addEventListener('submit', handleUpload);
searchInput.addEventListener('input', handleSearch);
categoryLinks.forEach(link => {
    link.addEventListener('click', handleCategoryFilter);
});

// File upload preview
document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const fileName = file?.name || 'No file chosen';
    document.getElementById('fileName').textContent = fileName;
    
    // Preview image if it's an image file
    const previewContainer = document.getElementById('filePreview');
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewContainer.innerHTML = `
                <div class="image-preview">
                    <img src="${e.target.result}" alt="Preview">
                </div>
            `;
        };
        reader.readAsDataURL(file);
    } else {
        previewContainer.innerHTML = `
            <div class="file-preview">
                <i class="fas fa-file"></i>
                <span>${fileName}</span>
            </div>
        `;
    }
});

// Tags input handling
document.getElementById('documentTags').addEventListener('input', function(e) {
    const tagsPreview = document.getElementById('tagsPreview');
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    
    tagsPreview.innerHTML = tags.map(tag => `
        <span class="tag">
            ${tag}
            <i class="fas fa-times" onclick="removeTag(this, '${tag}')"></i>
        </span>
    `).join('');
});

function removeTag(element, tag) {
    const tagsInput = document.getElementById('documentTags');
    const currentTags = tagsInput.value.split(',').map(t => t.trim());
    const newTags = currentTags.filter(t => t !== tag);
    tagsInput.value = newTags.join(', ');
    element.parentElement.remove();
}

// Handle document upload
function handleUpload(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('fileInput');
    const titleInput = document.getElementById('documentTitle');
    const tagsInput = document.getElementById('documentTags');
    const categoryInput = document.getElementById('documentCategory');
    
    // Check each field individually and show specific error messages
    if (!fileInput.files[0]) {
        showNotification('Please select a file to upload', 'error');
        return;
    }
    
    if (!titleInput.value.trim()) {
        showNotification('Please enter a document title', 'error');
        return;
    }
    
    if (!categoryInput.value) {
        showNotification('Please select a category', 'error');
        return;
    }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const document = {
            id: Date.now(),
            title: titleInput.value.trim(),
            category: categoryInput.value,
            tags: tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag),
            file: {
                name: file.name,
                type: file.type,
                size: file.size,
                content: e.target.result
            },
            uploadDate: new Date().toISOString(),
            uploadedBy: currentUser.username,
            userRole: currentUser.role
        };
        
        documents.push(document);
        saveDocuments();
        renderDocuments();
        uploadForm.reset();
        document.getElementById('fileName').textContent = 'No file chosen';
        document.getElementById('tagsPreview').innerHTML = '';
        document.getElementById('filePreview').innerHTML = '';
        
        showNotification('Document uploaded successfully!', 'success');
    };
    
    reader.onerror = function(error) {
        console.error('Error reading file:', error);
        showNotification('Error uploading file', 'error');
    };
    
    reader.readAsDataURL(file);
}

// Save documents to localStorage
function saveDocuments() {
    try {
        localStorage.setItem('documents', JSON.stringify(documents));
    } catch (error) {
        console.error('Error saving documents:', error);
        showNotification('Error saving document - file might be too large', 'error');
    }
}

// Render documents in the grid
function renderDocuments(filteredDocs = documents) {
    documentsGrid.innerHTML = '';
    
    if (filteredDocs.length === 0) {
        documentsGrid.innerHTML = `
            <div class="no-documents">
                <i class="fas fa-folder-open"></i>
                <h3>No documents found</h3>
                <p>Try uploading a new document or adjusting your search</p>
            </div>
        `;
        return;
    }
    
    filteredDocs.forEach(doc => {
        const card = document.createElement('div');
        card.className = 'document-card';
        
        const tags = doc.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
        const fileSize = formatFileSize(doc.file.size);
        
        // Determine file icon based on type
        let fileIcon = 'fa-file';
        if (doc.file.type.startsWith('image/')) {
            fileIcon = 'fa-image';
        } else if (doc.file.type.includes('pdf')) {
            fileIcon = 'fa-file-pdf';
        } else if (doc.file.type.includes('word')) {
            fileIcon = 'fa-file-word';
        } else if (doc.file.type.includes('text')) {
            fileIcon = 'fa-file-alt';
        }
        
        // Add preview if it's an image
        const previewContent = doc.file.type.startsWith('image/') 
            ? `<div class="document-preview"><img src="${doc.file.content}" alt="${doc.title}"></div>`
            : `<div class="document-preview"><i class="fas ${fileIcon}"></i></div>`;
        
        card.innerHTML = `
            <div class="document-preview-container">
                ${previewContent}
            </div>
            <div class="document-content">
                <div class="document-header">
                    <h4>${doc.title}</h4>
                    <span class="uploader"><i class="fas fa-user"></i> ${doc.uploadedBy}</span>
                </div>
                <div class="document-info">
                    <p><i class="fas fa-folder"></i> ${doc.category}</p>
                    <p><i class="fas ${fileIcon}"></i> ${doc.file.name} (${fileSize})</p>
                    <p><i class="fas fa-calendar"></i> ${new Date(doc.uploadDate).toLocaleDateString()}</p>
                </div>
                <div class="tags">${tags}</div>
                <div class="document-actions">
                    <button onclick="downloadDocument(${doc.id})" class="download-btn">
                        <i class="fas fa-download"></i> Download
                    </button>
                    ${currentUser.role === 'admin' ? `
                        <button onclick="deleteDocument(${doc.id})" class="delete-btn">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        documentsGrid.appendChild(card);
    });
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Handle search
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filteredDocs = documents.filter(doc => 
        doc.title.toLowerCase().includes(searchTerm) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
        doc.uploadedBy.toLowerCase().includes(searchTerm)
    );
    renderDocuments(filteredDocs);
}

// Handle category filter
function handleCategoryFilter(e) {
    e.preventDefault();
    const category = e.target.dataset.category;
    
    categoryLinks.forEach(link => link.classList.remove('active'));
    e.target.classList.add('active');
    
    const filteredDocs = category === 'all' 
        ? documents 
        : documents.filter(doc => doc.category === category);
    
    renderDocuments(filteredDocs);
}

// Download document
function downloadDocument(id) {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;
    
    const link = document.createElement('a');
    link.href = doc.file.content;
    link.download = doc.file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Delete document (admin only)
function deleteDocument(id) {
    if (currentUser.role !== 'admin') {
        showNotification('Only admins can delete documents!', 'error');
        return;
    }
    
    if (confirm('Are you sure you want to delete this document?')) {
        documents = documents.filter(doc => doc.id !== id);
        saveDocuments();
        renderDocuments();
        showNotification('Document deleted successfully', 'success');
    }
}

// Initial render
renderDocuments();

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Chatbot functionality
function toggleChat() {
    const chatContainer = document.getElementById('chatContainer');
    chatContainer.classList.toggle('active');
}

function handleChatInput(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    
    if (message) {
        addMessage(message, 'user');
        chatInput.value = '';
        
        // Simulate bot response
        setTimeout(() => {
            const response = generateBotResponse(message);
            addMessage(response, 'bot');
        }, 1000);
    }
}

function addMessage(message, sender) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const icon = sender === 'user' ? 'user' : 'robot';
    messageDiv.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <div class="message-content">${message}</div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function generateBotResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // FAQ responses
    if (lowerMessage.includes('how do i upload')) {
        return 'To upload a document:\n1. Go to the "Upload Document" section in the sidebar\n2. Click "Choose File" to select your document\n3. Enter a title for your document\n4. Add relevant tags (comma-separated)\n5. Select a category\n6. Click the "Upload" button';
    }
    
    if (lowerMessage.includes('how do i search')) {
        return 'You can search documents in several ways:\n1. Use the search bar at the top to search by title or content\n2. Use the category filters to browse by category\n3. Use the date filter to find recent documents\n4. Use the file type filter to find specific file types';
    }
    
    if (lowerMessage.includes('file types') || lowerMessage.includes('supported files')) {
        return 'The system currently supports the following file types:\n- PDF (.pdf)\n- Word Documents (.doc, .docx)\n- Text Files (.txt)\n- Images (.jpg, .png, .gif)';
    }
    
    if (lowerMessage.includes('manage categories')) {
        return 'Category management is available to administrators:\n1. Categories are displayed in the sidebar\n2. Click on a category to view its documents\n3. When uploading, select a category for your document\n4. Admins can add/remove categories through the admin panel';
    }
    
    if (lowerMessage.includes('user roles') || lowerMessage.includes('permissions')) {
        return 'There are two main user roles:\n1. Regular Users:\n   - Can upload documents\n   - Can search and view documents\n   - Can download documents\n2. Administrators:\n   - All regular user privileges\n   - Can delete documents\n   - Can manage categories\n   - Can manage user access';
    }
    
    // Original responses
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        return 'Hello! How can I help you today? You can also check the FAQ section for quick answers to common questions.';
    }
    
    if (lowerMessage.includes('help')) {
        return 'I can help you with:\n- Searching documents\n- Uploading files\n- Managing categories\n- Finding specific information\n\nClick the question mark icon to see frequently asked questions!';
    }
    
    if (lowerMessage.includes('upload') || lowerMessage.includes('add')) {
        return 'To upload a document:\n1. Click the "Upload Document" section\n2. Select your file\n3. Add a title and tags\n4. Choose a category\n5. Click Upload';
    }
    
    if (lowerMessage.includes('search') || lowerMessage.includes('find')) {
        return 'You can search documents using:\n- The search bar at the top\n- Category filters\n- Date filters\n- File type filters';
    }
    
    if (lowerMessage.includes('delete') || lowerMessage.includes('remove')) {
        return 'Only administrators can delete documents. If you need a document removed, please contact your system administrator.';
    }
    
    if (lowerMessage.includes('thank')) {
        return 'You\'re welcome! Let me know if you need anything else.';
    }
    
    // Default response for unrecognized queries
    return 'I\'m not sure I understand. You can:\n- Ask me a specific question\n- Click the question mark icon to see FAQs\n- Try rephrasing your question';
}

function toggleFAQ() {
    const faqSection = document.getElementById('faqSection');
    faqSection.classList.toggle('active');
}

function askFAQ(question) {
    addMessage(question, 'user');
    setTimeout(() => {
        addMessage(generateBotResponse(question), 'bot');
    }, 500);
    document.getElementById('faqSection').classList.remove('active');
}

// Add smooth scrolling to categories
document.querySelectorAll('.categories a').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const category = this.dataset.category;
        
        document.querySelectorAll('.categories a').forEach(a => a.classList.remove('active'));
        this.classList.add('active');
        
        const filteredDocs = category === 'all' 
            ? documents 
            : documents.filter(doc => doc.category === category);
        
        renderDocuments(filteredDocs);
        
        // Smooth scroll to content
        document.querySelector('.content').scrollIntoView({ behavior: 'smooth' });
    });
}); 