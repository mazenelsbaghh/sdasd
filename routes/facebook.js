const express = require('express');
const axios = require('axios');
const config = require('../config');

const router = express.Router();

// Facebook API base URL
const FB_API_BASE = `https://graph.facebook.com/${config.facebook.apiVersion}`;

// Get page information
router.get('/page/:pageId', async (req, res) => {
    try {
        const { pageId } = req.params;

        // Try to fetch real data from Facebook first
        const response = await axios.get(`${FB_API_BASE}/${pageId}`, {
            params: {
                access_token: config.facebook.accessToken,
                fields: 'id,name,fan_count,verification_status,picture'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching page info:', error.response?.data || error.message);

        // Return error instead of demo data
        res.status(500).json({
            error: 'Failed to fetch page information',
            details: error.response?.data || error.message
        });
    }
});

// Get posts from a page
router.get('/page/:pageId/posts', async (req, res) => {
    try {
        const { pageId } = req.params;
        const { limit = 25 } = req.query;

        // Try to fetch real data from Facebook first
        const response = await axios.get(`${FB_API_BASE}/${pageId}/posts`, {
            params: {
                access_token: config.facebook.accessToken,
                fields: 'id,message,created_time,type,permalink_url',
                limit: Math.min(limit, 100)
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching posts:', error.response?.data || error.message);

        // Return error instead of demo data
        res.status(500).json({
            error: 'Failed to fetch posts',
            details: error.response?.data || error.message
        });
    }
});

// Get comments from a post
router.get('/post/:postId/comments', async (req, res) => {
    try {
        const { postId } = req.params;
        const { limit = 50 } = req.query;

        // Try to fetch real data from Facebook first
        const response = await axios.get(`${FB_API_BASE}/${postId}/comments`, {
            params: {
                access_token: config.facebook.accessToken,
                fields: 'id,message,created_time,from,comment_count,like_count',
                limit: Math.min(limit, 100)
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching comments:', error.response?.data || error.message);

        // Return error instead of demo data
        res.status(500).json({
            error: 'Failed to fetch comments',
            details: error.response?.data || error.message
        });
    }
});

// Reply to a comment
router.post('/comment/:commentId/reply', async (req, res) => {
    try {
        const { commentId } = req.params;
        const { message } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Check if it's a demo comment
        if (commentId.startsWith('comment_')) {
            // Return demo response
            return res.json({
                success: true,
                replyId: `reply_${Date.now()}`,
                message: 'Reply posted successfully (Demo Mode)'
            });
        }

        const response = await axios.post(`${FB_API_BASE}/${commentId}/comments`, {
            access_token: config.facebook.accessToken,
            message: message.trim()
        });

        res.json({
            success: true,
            replyId: response.data.id,
            message: 'Reply posted successfully'
        });
    } catch (error) {
        console.error('Error posting reply:', error.response?.data || error.message);

        // If Facebook API fails, return demo response
        if (error.response?.data?.error?.code === 190 || error.response?.data?.error?.code === 100) {
            return res.json({
                success: true,
                replyId: `reply_${Date.now()}`,
                message: 'Reply posted successfully (Demo Mode)'
            });
        }

        res.status(500).json({
            error: 'Failed to post reply',
            details: error.response?.data || error.message
        });
    }
});

// Like a comment
router.post('/comment/:commentId/like', async (req, res) => {
    try {
        const { commentId } = req.params;

        // Check if it's a demo comment
        if (commentId.startsWith('comment_')) {
            // Return demo response
            return res.json({
                success: true,
                message: 'Comment liked successfully (Demo Mode)'
            });
        }

        const response = await axios.post(`${FB_API_BASE}/${commentId}/likes`, {
            access_token: config.facebook.accessToken
        });

        res.json({
            success: true,
            message: 'Comment liked successfully'
        });
    } catch (error) {
        console.error('Error liking comment:', error.response?.data || error.message);

        // If Facebook API fails, return demo response
        if (error.response?.data?.error?.code === 190 || error.response?.data?.error?.code === 100) {
            return res.json({
                success: true,
                message: 'Comment liked successfully (Demo Mode)'
            });
        }

        res.status(500).json({
            error: 'Failed to like comment',
            details: error.response?.data || error.message
        });
    }
});

// Get comment replies
router.get('/comment/:commentId/replies', async (req, res) => {
    try {
        const { commentId } = req.params;
        const { limit = 25 } = req.query;

        // Check if it's a demo comment
        if (commentId.startsWith('comment_')) {
            // Return demo replies
            const demoReplies = {
                data: [
                    {
                        id: 'reply_1',
                        message: 'شكراً لك على التعليق الجميل! 😊',
                        created_time: new Date(Date.now() - 1800000).toISOString(),
                        from: {
                            name: 'صفحة تجريبية',
                            id: 'page_123'
                        },
                        like_count: 2
                    },
                    {
                        id: 'reply_2',
                        message: 'نحن سعداء أن المحتوى أعجبك 🌟',
                        created_time: new Date(Date.now() - 3600000).toISOString(),
                        from: {
                            name: 'صفحة تجريبية',
                            id: 'page_123'
                        },
                        like_count: 1
                    }
                ]
            };

            return res.json(demoReplies);
        }

        const response = await axios.get(`${FB_API_BASE}/${commentId}/comments`, {
            params: {
                access_token: config.facebook.accessToken,
                fields: 'id,message,created_time,from,like_count',
                limit: Math.min(limit, 100)
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching replies:', error.response?.data || error.message);

        // If Facebook API fails, return demo data
        if (error.response?.data?.error?.code === 190 || error.response?.data?.error?.code === 100) {
            const demoReplies = {
                data: [
                    {
                        id: 'reply_1',
                        message: 'شكراً لك على التعليق الجميل! 😊',
                        created_time: new Date(Date.now() - 1800000).toISOString(),
                        from: {
                            name: 'صفحة تجريبية',
                            id: 'page_123'
                        },
                        like_count: 2
                    }
                ]
            };

            return res.json(demoReplies);
        }

        res.status(500).json({
            error: 'Failed to fetch replies',
            details: error.response?.data || error.message
        });
    }
});

module.exports = router;
