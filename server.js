require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_cyber_key_2026';

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Вспомогательная функция генерации JWT
function generateToken(userData) {
    return jwt.sign(userData, JWT_SECRET, { expiresIn: '24h' });
}

/* API: Проверка и валидация токена (Auto-Login) */
app.post('/api/verify-token', (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(401).json({ valid: false });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ valid: true, user: decoded });
    } catch (err) {
        res.status(401).json({ valid: false });
    }
});

/* API: Ручной вход / Регистрация */
app.post('/api/auth/login', (req, res) => {
    const { email } = req.body;
    const userData = {
        id: 'usr_' + Math.random().toString(36).substr(2, 9),
        name: email.split('@')[0].toUpperCase(),
        email: email,
        provider: 'cyberauth',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=' + email,
        clearance: 'LEVEL 3'
    };
    const token = generateToken(userData);
    res.json({ success: true, token, user: userData });
});

/* GOOGLE OAUTH CALLBACK */
app.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    try {
        const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: `http://localhost:${PORT}/auth/google/callback`
        });

        const userRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenRes.data.access_token}` }
        });

        const userData = {
            id: userRes.data.id,
            name: userRes.data.name,
            email: userRes.data.email,
            provider: 'google',
            avatar: userRes.data.picture,
            clearance: 'LEVEL 4'
        };

        sendAuthSuccess(res, userData, generateToken(userData));
    } catch (err) {
        sendAuthError(res, 'Google');
    }
});

/* GITHUB OAUTH CALLBACK */
app.get('/auth/github/callback', async (req, res) => {
    const { code } = req.query;
    try {
        const tokenRes = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code
        }, { headers: { Accept: 'application/json' } });

        const userRes = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${tokenRes.data.access_token}` }
        });

        const userData = {
            id: userRes.data.id,
            name: userRes.data.name || userRes.data.login,
            email: userRes.data.email || `${userRes.data.login}@github.com`,
            provider: 'github',
            avatar: userRes.data.avatar_url,
            clearance: 'LEVEL 4'
        };

        sendAuthSuccess(res, userData, generateToken(userData));
    } catch (err) {
        sendAuthError(res, 'GitHub');
    }
});

/* DISCORD OAUTH CALLBACK */
app.get('/auth/discord/callback', async (req, res) => {
    const { code } = req.query;
    try {
        const params = new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID,
            client_secret: process.env.DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code,
            redirect_uri: `http://localhost:${PORT}/auth/discord/callback`
        });

        const tokenRes = await axios.post('https://discord.com/api/oauth2/token', params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const userRes = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${tokenRes.data.access_token}` }
        });

        const avatarUrl = userRes.data.avatar 
            ? `https://cdn.discordapp.com/avatars/${userRes.data.id}/${userRes.data.avatar}.png`
            : 'https://cdn.discordapp.com/embed/avatars/0.png';

        const userData = {
            id: userRes.data.id,
            name: userRes.data.global_name || userRes.data.username,
            email: userRes.data.email,
            provider: 'discord',
            avatar: avatarUrl,
            clearance: 'LEVEL 4'
        };

        sendAuthSuccess(res, userData, generateToken(userData));
    } catch (err) {
        sendAuthError(res, 'Discord');
    }
});

function sendAuthSuccess(res, userData, token) {
    res.send(`
        <script>
            if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_SUCCESS', user: ${JSON.stringify(userData)}, token: '${token}' }, '*');
                window.close();
            } else {
                window.location.href = '/';
            }
        </script>
    `);
}

function sendAuthError(res, provider) {
    res.send(`
        <script>
            if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_ERROR', provider: '${provider}' }, '*');
                window.close();
            } else {
                window.location.href = '/';
            }
        </script>
    `);
}

app.listen(PORT, () => console.log(`🚀 CyberAuth System active on http://localhost:${PORT}`));