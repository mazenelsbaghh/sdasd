module.exports = {
    // Facebook API Configuration
    facebook: {
        appId: process.env.FACEBOOK_APP_ID || 'your_facebook_app_id',
        appSecret: process.env.FACEBOOK_APP_SECRET || 'your_facebook_app_secret',
        accessToken: process.env.FACEBOOK_ACCESS_TOKEN || 'your_facebook_access_token',
        apiVersion: 'v18.0'
    },

    // Server Configuration
    server: {
        port: process.env.PORT || 3000,
        env: process.env.NODE_ENV || 'development'
    },

    // Security
    security: {
        sessionSecret: process.env.SESSION_SECRET || 'your_session_secret_key',
        rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS || 900000,
        rateLimitMaxRequests: process.env.RATE_LIMIT_MAX_REQUESTS || 100
    }
};
