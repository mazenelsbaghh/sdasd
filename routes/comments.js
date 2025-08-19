const express = require('express');
const router = express.Router();

// In-memory storage for demo purposes
// In production, you'd use a database
let comments = [
  {
    id: 'comment_1',
    message: 'أهلاً وسهلاً! الصفحة جميلة جداً 😊',
    created_time: new Date(Date.now() - 3600000).toISOString(),
    from: {
      name: 'أحمد محمد',
      id: 'user_1'
    },
    comment_count: 2,
    like_count: 5,
    status: 'pending',
    postId: 'post_1',
    postMessage: 'مرحباً بكم في صفحتنا التجريبية! 🎉',
    replies: []
  },
  {
    id: 'comment_2',
    message: 'محتوى رائع ومفيد 👍',
    created_time: new Date(Date.now() - 7200000).toISOString(),
    from: {
      name: 'فاطمة علي',
      id: 'user_2'
    },
    comment_count: 0,
    like_count: 3,
    status: 'replied',
    postId: 'post_2',
    postMessage: 'نحن سعداء بلقائكم هنا 👋',
    replies: [
      {
        id: 'reply_1',
        message: 'شكراً لك على التعليق الجميل! 😊',
        created_at: new Date(Date.now() - 1800000).toISOString()
      }
    ]
  },
  {
    id: 'comment_3',
    message: 'أتمنى المزيد من المحتوى المميز 🌟',
    created_time: new Date(Date.now() - 10800000).toISOString(),
    from: {
      name: 'محمد أحمد',
      id: 'user_3'
    },
    comment_count: 1,
    like_count: 7,
    status: 'pending',
    postId: 'post_3',
    postMessage: 'شكراً لكم على دعمكم المستمر ❤️',
    replies: []
  },
  {
    id: 'comment_4',
    message: 'شكراً لكم على هذا العمل الرائع 💕',
    created_time: new Date(Date.now() - 14400000).toISOString(),
    from: {
      name: 'سارة خالد',
      id: 'user_4'
    },
    comment_count: 0,
    like_count: 4,
    status: 'flagged',
    postId: 'post_1',
    postMessage: 'مرحباً بكم في صفحتنا التجريبية! 🎉',
    replies: []
  },
  {
    id: 'comment_5',
    message: 'أحب المحتوى كثيراً، استمروا 👏',
    created_time: new Date(Date.now() - 18000000).toISOString(),
    from: {
      name: 'خالد سعد',
      id: 'user_5'
    },
    comment_count: 0,
    like_count: 6,
    status: 'replied',
    postId: 'post_2',
    postMessage: 'نحن سعداء بلقائكم هنا 👋',
    replies: [
      {
        id: 'reply_2',
        message: 'نحن سعداء أن المحتوى أعجبك 🌟',
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ]
  }
];

let replies = [
  {
    id: 'reply_1',
    commentId: 'comment_2',
    message: 'شكراً لك على التعليق الجميل! 😊',
    created_at: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 'reply_2',
    commentId: 'comment_5',
    message: 'نحن سعداء أن المحتوى أعجبك 🌟',
    created_at: new Date(Date.now() - 3600000).toISOString()
  }
];

let autoReplies = [
  {
    id: 'template_1',
    name: 'رد شكر عام',
    content: 'شكراً لك على التعليق الجميل! 😊 نحن سعداء أن المحتوى أعجبك.',
    triggers: ['شكراً', 'ممتاز', 'رائع', 'جميل'],
    isActive: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'template_2',
    name: 'رد ترحيب',
    content: 'أهلاً وسهلاً بك! 🎉 نحن سعداء بلقائك في صفحتنا.',
    triggers: ['أهلاً', 'مرحباً', 'أول مرة', 'جديد'],
    isActive: true,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: 'template_3',
    name: 'رد دعم',
    content: 'شكراً لكم على دعمكم المستمر! ❤️ نحن نقدر ذلك كثيراً.',
    triggers: ['دعم', 'استمروا', 'أحب', 'متابع'],
    isActive: true,
    created_at: new Date(Date.now() - 259200000).toISOString(),
    updated_at: new Date(Date.now() - 259200000).toISOString()
  }
];

// Get all comments
router.get('/', (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);

    let filteredComments = [...comments];

    // Filter by status if provided
    if (status) {
      filteredComments = filteredComments.filter(comment => comment.status === status);
    }

    // Sort by creation time (newest first)
    filteredComments.sort((a, b) => new Date(b.created_time) - new Date(a.created_time));

    const paginatedComments = filteredComments.slice(startIndex, endIndex);

    res.json({
      comments: paginatedComments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredComments.length / limit),
        totalComments: filteredComments.length,
        hasNext: endIndex < filteredComments.length,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Get comment by ID
router.get('/:commentId', (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = comments.find(c => c.id === commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Get replies for this comment
    const commentReplies = replies.filter(r => r.commentId === commentId);

    res.json({
      ...comment,
      replies: commentReplies
    });
  } catch (error) {
    console.error('Error fetching comment:', error);
    res.status(500).json({ error: 'Failed to fetch comment' });
  }
});

// Update comment status
router.patch('/:commentId/status', (req, res) => {
  try {
    const { commentId } = req.params;
    const { status } = req.body;

    const commentIndex = comments.findIndex(c => c.id === commentId);
    if (commentIndex === -1) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    comments[commentIndex].status = status;
    comments[commentIndex].updated_at = new Date().toISOString();

    res.json({
      success: true,
      comment: comments[commentIndex],
      message: 'Comment status updated successfully'
    });
  } catch (error) {
    console.error('Error updating comment status:', error);
    res.status(500).json({ error: 'Failed to update comment status' });
  }
});

// Add internal note to comment
router.post('/:commentId/note', (req, res) => {
  try {
    const { commentId } = req.params;
    const { note } = req.body;

    if (!note || note.trim().length === 0) {
      return res.status(400).json({ error: 'Note is required' });
    }

    const commentIndex = comments.findIndex(c => c.id === commentId);
    if (commentIndex === -1) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (!comments[commentIndex].notes) {
      comments[commentIndex].notes = [];
    }

    comments[commentIndex].notes.push({
      id: Date.now().toString(),
      text: note.trim(),
      created_at: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Note added successfully',
      notes: comments[commentIndex].notes
    });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ error: 'Failed to add note' });
  }
});

// Get auto-reply templates
router.get('/auto-replies/templates', (req, res) => {
  try {
    res.json({
      templates: autoReplies,
      total: autoReplies.length
    });
  } catch (error) {
    console.error('Error fetching auto-reply templates:', error);
    res.status(500).json({ error: 'Failed to fetch auto-reply templates' });
  }
});

// Create auto-reply template
router.post('/auto-replies/templates', (req, res) => {
  try {
    const { name, content, triggers, isActive = true } = req.body;

    if (!name || !content || !triggers) {
      return res.status(400).json({
        error: 'Name, content, and triggers are required'
      });
    }

    const template = {
      id: Date.now().toString(),
      name: name.trim(),
      content: content.trim(),
      triggers: Array.isArray(triggers) ? triggers : [triggers],
      isActive,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    autoReplies.push(template);

    res.status(201).json({
      success: true,
      template,
      message: 'Auto-reply template created successfully'
    });
  } catch (error) {
    console.error('Error creating auto-reply template:', error);
    res.status(500).json({ error: 'Failed to create auto-reply template' });
  }
});

// Update auto-reply template
router.put('/auto-replies/templates/:templateId', (req, res) => {
  try {
    const { templateId } = req.params;
    const { name, content, triggers, isActive } = req.body;

    const templateIndex = autoReplies.findIndex(t => t.id === templateId);
    if (templateIndex === -1) {
      return res.status(404).json({ error: 'Template not found' });
    }

    if (name) autoReplies[templateIndex].name = name.trim();
    if (content) autoReplies[templateIndex].content = content.trim();
    if (triggers) autoReplies[templateIndex].triggers = Array.isArray(triggers) ? triggers : [triggers];
    if (typeof isActive === 'boolean') autoReplies[templateIndex].isActive = isActive;

    autoReplies[templateIndex].updated_at = new Date().toISOString();

    res.json({
      success: true,
      template: autoReplies[templateIndex],
      message: 'Template updated successfully'
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Delete auto-reply template
router.delete('/auto-replies/templates/:templateId', (req, res) => {
  try {
    const { templateId } = req.params;

    const templateIndex = autoReplies.findIndex(t => t.id === templateId);
    if (templateIndex === -1) {
      return res.status(404).json({ error: 'Template not found' });
    }

    autoReplies.splice(templateIndex, 1);

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// Get comment statistics
router.get('/stats/overview', (req, res) => {
  try {
    const totalComments = comments.length;
    const pendingComments = comments.filter(c => c.status === 'pending').length;
    const repliedComments = comments.filter(c => c.status === 'replied').length;
    const flaggedComments = comments.filter(c => c.status === 'flagged').length;

    const totalReplies = replies.length;
    const totalLikes = comments.reduce((sum, c) => sum + (c.like_count || 0), 0);

    res.json({
      totalComments,
      pendingComments,
      repliedComments,
      flaggedComments,
      totalReplies,
      totalLikes,
      responseRate: totalComments > 0 ? ((repliedComments / totalComments) * 100).toFixed(1) : 0
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
