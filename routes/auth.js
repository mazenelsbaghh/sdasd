const express = require('express');
const axios = require('axios');
const config = require('../config');
const router = express.Router();

// Exchange authorization code for access token
router.post('/exchange', async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Authorization code is required' });
        }

        // Exchange code for access token
        const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
            params: {
                client_id: config.facebook.appId,
                client_secret: config.facebook.appSecret,
                redirect_uri: `${req.protocol}://${req.get('host')}/auth/callback`,
                code: code
            }
        });

        const { access_token, token_type, expires_in } = tokenResponse.data;

        if (!access_token) {
            return res.status(400).json({ error: 'Failed to get access token' });
        }

        // Get user pages
        const pagesResponse = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
            params: {
                access_token: access_token
            }
        });

        // Return success with access token and pages
        res.json({
            success: true,
            access_token: access_token,
            token_type: token_type,
            expires_in: expires_in,
            pages: pagesResponse.data.data || []
        });

    } catch (error) {
        console.error('Error exchanging code for token:', error.response?.data || error.message);

        res.status(500).json({
            error: 'Failed to exchange authorization code',
            details: error.response?.data || error.message
        });
    }
});

// Get user pages
router.get('/pages', async (req, res) => {
    try {
        const { access_token } = req.query;

        if (!access_token) {
            return res.status(400).json({ error: 'Access token is required' });
        }

        const response = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
            params: {
                access_token: access_token
            }
        });

        res.json(response.data);

    } catch (error) {
        console.error('Error fetching user pages:', error.response?.data || error.message);

        res.status(500).json({
            error: 'Failed to fetch user pages',
            details: error.response?.data || error.message
        });
    }
});

// Get page access token
router.get('/page-token/:pageId', async (req, res) => {
    try {
        const { pageId } = req.params;
        const { access_token } = req.query;

        if (!access_token) {
            return res.status(400).json({ error: 'Access token is required' });
        }

        const response = await axios.get(`https://graph.facebook.com/v18.0/${pageId}`, {
            params: {
                access_token: access_token,
                fields: 'access_token'
            }
        });

        res.json(response.data);

    } catch (error) {
        console.error('Error fetching page access token:', error.response?.data || error.message);

        res.status(500).json({
            error: 'Failed to fetch page access token',
            details: error.response?.data || error.message
        });
    }
});

module.exports = router;
