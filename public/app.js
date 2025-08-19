// Facebook Comments Manager - Main Application
class FacebookCommentsManager {
    constructor() {
        this.currentPage = null;
        this.currentPosts = [];
        this.currentComments = [];
        this.autoReplies = [];
        this.socket = io();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadAutoReplies();
        this.loadStatistics();
        this.setupSocketListeners();
        this.checkFacebookAuth();
    }

    checkFacebookAuth() {
        const accessToken = localStorage.getItem('fbAccessToken');
        const pages = localStorage.getItem('fbPages');
        
        if (accessToken && pages) {
            this.showFacebookAuthStatus(true);
            this.loadUserPages(JSON.parse(pages));
        } else {
            this.showFacebookAuthStatus(false);
        }
    }

    showFacebookAuthStatus(isAuthenticated) {
        const authStatus = document.getElementById('authStatus');
        if (authStatus) {
            if (isAuthenticated) {
                authStatus.innerHTML = `
                    <div class="auth-success">
                        <span class="auth-icon">✓</span>
                        تم تسجيل الدخول مع Facebook
                        <button class="auth-btn" onclick="this.logout()">تسجيل الخروج</button>
                    </div>
                `;
            } else {
                authStatus.innerHTML = `
                    <div class="auth-error">
                        <span class="auth-icon">⚠</span>
                        لم يتم تسجيل الدخول مع Facebook
                        <a href="/login" class="auth-btn">تسجيل الدخول</a>
                    </div>
                `;
            }
        }
    }

    loadUserPages(pages) {
        const pageSelector = document.getElementById('pageSelector');
        if (pageSelector) {
            pageSelector.innerHTML = '<option value="">اختر الصفحة</option>';
            pages.forEach(page => {
                const option = document.createElement('option');
                option.value = page.id;
                option.textContent = page.name;
                pageSelector.appendChild(option);
            });
        }
    }

    logout() {
        localStorage.removeItem('fbAccessToken');
        localStorage.removeItem('fbPages');
        this.showFacebookAuthStatus(false);
        location.reload();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Dashboard
        document.getElementById('loadPageBtn').addEventListener('click', () => {
            this.loadFacebookPage();
        });

        // Comments
        document.getElementById('statusFilter').addEventListener('change', () => {
            this.filterComments();
        });

        document.getElementById('searchComments').addEventListener('input', (e) => {
            this.searchComments(e.target.value);
        });

        document.getElementById('prevPage').addEventListener('click', () => {
            this.changePage(-1);
        });

        document.getElementById('nextPage').addEventListener('click', () => {
            this.changePage(1);
        });

        // Auto Replies
        document.getElementById('addTemplateBtn').addEventListener('click', () => {
            this.showTemplateModal();
        });

        document.getElementById('templateForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTemplate();
        });

        // Settings
        document.getElementById('saveSettingsBtn').addEventListener('click', () => {
            this.saveSettings();
        });

        // Modal close events
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                this.closeModals();
            });
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModals();
            }
        });
    }

    setupSocketListeners() {
        this.socket.on('commentReceived', (data) => {
            this.handleNewComment(data);
        });

        this.socket.on('replySent', (data) => {
            this.handleReplySent(data);
        });
    }

    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Remove active class from all nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab
        document.getElementById(tabName).classList.add('active');

        // Add active class to clicked button
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Load data for specific tabs
        if (tabName === 'comments') {
            this.loadComments();
        } else if (tabName === 'auto-replies') {
            this.loadTemplates();
        }
    }

    async loadFacebookPage() {
        const pageId = document.getElementById('pageSelect').value.trim();
        if (!pageId) {
            this.showNotification('يرجى إدخال معرف صفحة الفيسبوك', 'error');
            return;
        }

        this.showLoading(true);
        try {
            const response = await fetch(`/api/facebook/page/${pageId}`);
            const data = await response.json();

            if (response.ok) {
                this.currentPageId = pageId;
                this.showNotification(`تم تحميل صفحة: ${data.name}`, 'success');
                await this.loadPagePosts();
                await this.loadStatistics();
            } else {
                throw new Error(data.error || 'فشل في تحميل الصفحة');
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async loadPagePosts() {
        if (!this.currentPageId) return;

        try {
            const response = await fetch(`/api/facebook/page/${this.currentPageId}/posts?limit=10`);
            const data = await response.json();

            if (response.ok) {
                await this.loadPostsComments(data.data);
            }
        } catch (error) {
            console.error('Error loading posts:', error);
        }
    }

    async loadPostsComments(posts) {
        for (const post of posts) {
            try {
                const response = await fetch(`/api/facebook/post/${post.id}/comments?limit=20`);
                const data = await response.json();

                if (response.ok) {
                    this.processComments(data.data, post);
                }
            } catch (error) {
                console.error(`Error loading comments for post ${post.id}:`, error);
            }
        }
    }

    processComments(comments, post) {
        comments.forEach(comment => {
            comment.postId = post.id;
            comment.postMessage = post.message;
            comment.status = 'pending';
            comment.replies = [];

            // Check if comment matches any auto-reply template
            this.checkAutoReply(comment);
        });

        this.comments = [...this.comments, ...comments];
        this.updateCommentsList();
        this.updateStatistics();
    }

    checkAutoReply(comment) {
        const matchingTemplate = this.templates.find(template =>
            template.isActive &&
            template.triggers.some(trigger =>
                comment.message.toLowerCase().includes(trigger.toLowerCase())
            )
        );

        if (matchingTemplate) {
            this.autoReply(comment, matchingTemplate);
        }
    }

    async autoReply(comment, template) {
        try {
            const response = await fetch(`/api/facebook/comment/${comment.id}/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: template.content
                })
            });

            if (response.ok) {
                comment.status = 'replied';
                comment.autoReplied = true;
                this.updateCommentsList();
                this.updateStatistics();
                this.showNotification('تم الرد التلقائي بنجاح', 'success');
            }
        } catch (error) {
            console.error('Auto-reply failed:', error);
        }
    }

    async loadComments() {
        try {
            const response = await fetch(`/api/comments?page=${this.currentPage}&limit=20`);
            const data = await response.json();

            if (response.ok) {
                this.comments = data.comments;
                this.updateCommentsList();
                this.updatePagination(data.pagination);
            }
        } catch (error) {
            this.showNotification('فشل في تحميل التعليقات', 'error');
        }
    }

    updateCommentsList() {
        const commentsList = document.getElementById('commentsList');
        if (!commentsList) return;

        commentsList.innerHTML = '';

        if (this.comments.length === 0) {
            commentsList.innerHTML = `
                <div class="comment-item">
                    <p class="text-center">لا توجد تعليقات لعرضها</p>
                </div>
            `;
            return;
        }

        this.comments.forEach(comment => {
            const commentElement = this.createCommentElement(comment);
            commentsList.appendChild(commentElement);
        });
    }

    createCommentElement(comment) {
        const div = document.createElement('div');
        div.className = 'comment-item';

        const statusClass = comment.status === 'replied' ? 'replied' :
            comment.status === 'flagged' ? 'flagged' : 'pending';

        div.innerHTML = `
            <div class="comment-header">
                <div class="comment-author">
                    <img src="https://via.placeholder.com/40x40/1877f2/ffffff?text=${comment.from?.name?.charAt(0) || 'U'}" alt="User">
                    <div class="comment-author-info">
                        <h4>${comment.from?.name || 'مستخدم مجهول'}</h4>
                        <small>${this.formatDate(comment.created_time)}</small>
                    </div>
                </div>
                <span class="comment-status ${statusClass}">
                    ${this.getStatusText(comment.status)}
                </span>
            </div>
            <div class="comment-content">
                ${comment.message}
            </div>
            <div class="comment-actions">
                <button class="btn btn-primary btn-sm" onclick="app.replyToComment('${comment.id}')">
                    <i class="fas fa-reply"></i>
                    رد
                </button>
                <button class="btn btn-secondary btn-sm" onclick="app.viewCommentDetails('${comment.id}')">
                    <i class="fas fa-eye"></i>
                    تفاصيل
                </button>
                ${comment.status === 'pending' ? `
                    <button class="btn btn-danger btn-sm" onclick="app.flagComment('${comment.id}')">
                        <i class="fas fa-flag"></i>
                        تمييز
                    </button>
                ` : ''}
            </div>
        `;

        return div;
    }

    async replyToComment(commentId) {
        const comment = this.comments.find(c => c.id === commentId);
        if (!comment) return;

        this.showCommentModal(comment);
    }

    async sendReply(commentId, message) {
        try {
            const response = await fetch(`/api/facebook/comment/${commentId}/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });

            if (response.ok) {
                const comment = this.comments.find(c => c.id === commentId);
                if (comment) {
                    comment.status = 'replied';
                    comment.replies.push({
                        id: Date.now().toString(),
                        message,
                        created_at: new Date().toISOString()
                    });
                }

                this.updateCommentsList();
                this.updateStatistics();
                this.closeModals();
                this.showNotification('تم إرسال الرد بنجاح', 'success');
            }
        } catch (error) {
            this.showNotification('فشل في إرسال الرد', 'error');
        }
    }

    async loadTemplates() {
        try {
            const response = await fetch('/api/comments/auto-replies/templates');
            const data = await response.json();

            if (response.ok) {
                this.templates = data.templates;
                this.updateTemplatesList();
            }
        } catch (error) {
            console.error('Error loading templates:', error);
        }
    }

    updateTemplatesList() {
        const templatesList = document.getElementById('templatesList');
        if (!templatesList) return;

        templatesList.innerHTML = '';

        if (this.templates.length === 0) {
            templatesList.innerHTML = `
                <div class="template-card">
                    <p class="text-center">لا توجد قوالب للردود التلقائية</p>
                </div>
            `;
            return;
        }

        this.templates.forEach(template => {
            const templateElement = this.createTemplateElement(template);
            templatesList.appendChild(templateElement);
        });
    }

    createTemplateElement(template) {
        const div = document.createElement('div');
        div.className = 'template-card';

        const statusClass = template.isActive ? 'active' : 'inactive';
        const statusText = template.isActive ? 'مفعل' : 'معطل';

        div.innerHTML = `
            <div class="template-header">
                <span class="template-name">${template.name}</span>
                <span class="template-status ${statusClass}">${statusText}</span>
            </div>
            <div class="template-content">${template.content}</div>
            <div class="template-triggers">
                ${template.triggers.map(trigger =>
            `<span class="trigger-tag">${trigger}</span>`
        ).join('')}
            </div>
            <div class="template-actions">
                <button class="btn btn-primary btn-sm" onclick="app.editTemplate('${template.id}')">
                    <i class="fas fa-edit"></i>
                    تعديل
                </button>
                <button class="btn btn-danger btn-sm" onclick="app.deleteTemplate('${template.id}')">
                    <i class="fas fa-trash"></i>
                    حذف
                </button>
            </div>
        `;

        return div;
    }

    async saveTemplate() {
        const formData = {
            name: document.getElementById('templateName').value,
            content: document.getElementById('templateContent').value,
            triggers: document.getElementById('templateTriggers').value.split(',').map(t => t.trim()),
            isActive: document.getElementById('templateActive').checked
        };

        try {
            const response = await fetch('/api/comments/auto-replies/templates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                this.showNotification('تم حفظ القالب بنجاح', 'success');
                this.closeModals();
                this.loadTemplates();
            } else {
                const data = await response.json();
                throw new Error(data.error || 'فشل في حفظ القالب');
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    async loadStatistics() {
        try {
            const response = await fetch('/api/comments/stats/overview');
            const data = await response.json();

            if (response.ok) {
                this.updateStatistics(data);
            }
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    }

    updateStatistics(stats = null) {
        if (!stats) {
            const pendingCount = this.comments.filter(c => c.status === 'pending').length;
            const repliedCount = this.comments.filter(c => c.status === 'replied').length;
            const totalCount = this.comments.length;
            const responseRate = totalCount > 0 ? ((repliedCount / totalCount) * 100).toFixed(1) : 0;

            stats = {
                totalComments: totalCount,
                pendingComments: pendingCount,
                repliedComments: repliedCount,
                responseRate: responseRate
            };
        }

        document.getElementById('totalComments').textContent = stats.totalComments;
        document.getElementById('pendingComments').textContent = stats.pendingComments;
        document.getElementById('repliedComments').textContent = stats.repliedComments;
        document.getElementById('responseRate').textContent = `${stats.responseRate}%`;
    }

    // Utility methods
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getStatusText(status) {
        const statusMap = {
            'pending': 'في الانتظار',
            'replied': 'تم الرد',
            'flagged': 'مميز'
        };
        return statusMap[status] || status;
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (show) {
            spinner.classList.remove('hidden');
        } else {
            spinner.classList.add('hidden');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);

        // Remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    showCommentModal(comment) {
        const modal = document.getElementById('commentModal');
        const commentDetails = document.getElementById('commentDetails');
        const replyMessage = document.getElementById('replyMessage');

        commentDetails.innerHTML = `
            <div class="comment-item">
                <div class="comment-header">
                    <div class="comment-author">
                        <img src="https://via.placeholder.com/40x40/1877f2/ffffff?text=${comment.from?.name?.charAt(0) || 'U'}" alt="User">
                        <div class="comment-author-info">
                            <h4>${comment.from?.name || 'مستخدم مجهول'}</h4>
                            <small>${this.formatDate(comment.created_time)}</small>
                        </div>
                    </div>
                </div>
                <div class="comment-content">${comment.message}</div>
            </div>
        `;

        replyMessage.value = '';
        modal.style.display = 'block';

        // Bind send reply button
        document.getElementById('sendReplyBtn').onclick = () => {
            const message = replyMessage.value.trim();
            if (message) {
                this.sendReply(comment.id, message);
            } else {
                this.showNotification('يرجى كتابة رسالة للرد', 'error');
            }
        };
    }

    showTemplateModal(template = null) {
        const modal = document.getElementById('templateModal');
        const title = document.getElementById('templateModalTitle');
        const form = document.getElementById('templateForm');

        if (template) {
            title.textContent = 'تعديل القالب';
            document.getElementById('templateName').value = template.name;
            document.getElementById('templateContent').value = template.content;
            document.getElementById('templateTriggers').value = template.triggers.join(', ');
            document.getElementById('templateActive').checked = template.isActive;
        } else {
            title.textContent = 'إضافة قالب جديد';
            form.reset();
        }

        modal.style.display = 'block';
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    // Additional methods for comment management
    async flagComment(commentId) {
        try {
            const response = await fetch(`/api/comments/${commentId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'flagged' })
            });

            if (response.ok) {
                const comment = this.comments.find(c => c.id === commentId);
                if (comment) {
                    comment.status = 'flagged';
                }
                this.updateCommentsList();
                this.updateStatistics();
                this.showNotification('تم تمييز التعليق', 'success');
            }
        } catch (error) {
            this.showNotification('فشل في تمييز التعليق', 'error');
        }
    }

    async viewCommentDetails(commentId) {
        try {
            const response = await fetch(`/api/comments/${commentId}`);
            const comment = await response.json();

            if (response.ok) {
                this.showCommentModal(comment);
            }
        } catch (error) {
            this.showNotification('فشل في تحميل تفاصيل التعليق', 'error');
        }
    }

    filterComments() {
        const status = document.getElementById('statusFilter').value;
        const filteredComments = status ?
            this.comments.filter(c => c.status === status) :
            this.comments;

        this.updateCommentsList(filteredComments);
    }

    searchComments(query) {
        if (!query.trim()) {
            this.updateCommentsList();
            return;
        }

        const filteredComments = this.comments.filter(comment =>
            comment.message.toLowerCase().includes(query.toLowerCase()) ||
            comment.from?.name?.toLowerCase().includes(query.toLowerCase())
        );

        this.updateCommentsList(filteredComments);
    }

    changePage(delta) {
        const newPage = this.currentPage + delta;
        if (newPage > 0) {
            this.currentPage = newPage;
            this.loadComments();
        }
    }

    updatePagination(pagination) {
        document.getElementById('pageInfo').textContent =
            `صفحة ${pagination.currentPage} من ${pagination.totalPages}`;

        document.getElementById('prevPage').disabled = !pagination.hasPrev;
        document.getElementById('nextPage').disabled = !pagination.hasNext;
    }

    async saveSettings() {
        const settings = {
            appId: document.getElementById('fbAppId').value,
            appSecret: document.getElementById('fbAppSecret').value,
            accessToken: document.getElementById('fbAccessToken').value
        };

        // In a real app, you'd save these to a database
        localStorage.setItem('fbSettings', JSON.stringify(settings));
        this.showNotification('تم حفظ الإعدادات', 'success');
    }

    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('fbSettings') || '{}');
        if (settings.appId) document.getElementById('fbAppId').value = settings.appId;
        if (settings.appSecret) document.getElementById('fbAppSecret').value = settings.appSecret;
        if (settings.accessToken) document.getElementById('fbAccessToken').value = settings.accessToken;
    }

    // Event handlers for real-time updates
    handleNewComment(comment) {
        this.comments.unshift(comment);
        this.updateCommentsList();
        this.updateStatistics();
        this.showNotification('تعليق جديد تم استلامه', 'info');
    }

    handleReplySent(data) {
        const comment = this.comments.find(c => c.id === data.commentId);
        if (comment) {
            comment.status = 'replied';
            this.updateCommentsList();
            this.updateStatistics();
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FacebookCommentsManager();
});

// Add notification styles
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        z-index: 4000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 400px;
    }

    .notification.show {
        transform: translateX(0);
    }

    .notification-success {
        border-left: 4px solid #28a745;
        color: #155724;
    }

    .notification-error {
        border-left: 4px solid #dc3545;
        color: #721c24;
    }

    .notification-info {
        border-left: 4px solid #17a2b8;
        color: #0c5460;
    }

    .btn-sm {
        padding: 0.5rem 1rem;
        font-size: 0.9rem;
    }

    .text-center {
        text-align: center;
    }
`;
document.head.appendChild(style);
