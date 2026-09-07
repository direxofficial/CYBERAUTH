// Конфигурация Client ID (Замените на свои реальные ID)
const OAUTH_CONFIG = {
    google: {
        clientId: '622462788942-jke9peg1jpk9fii2u0furdtjvqhko20m.apps.googleusercontent.com',
        redirectUri: 'http://127.0.0.1:5500/defoult.html/auth/google/callback',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        scope: 'email profile'
    },
    github: {
        clientId: 'Ov23liCllAt2UDccf4Je',
        redirectUri: 'http://127.0.0.1:5500/defoult.html/auth/github/callback',
        authUrl: 'https://github.com/login/oauth/authorize',
        scope: 'user:email'
    },
    discord: {
        clientId: '1546514835943071784',
        redirectUri: 'http://127.0.0.1:5500/defoult.html/auth/discord/callback',
        authUrl: 'https://discord.com/api/oauth2/authorize',
        scope: 'identify email'
    }
};

function oauthLogin(provider) {
    playSound('click');
    const config = OAUTH_CONFIG[provider];

    if (!config || config.clientId.includes('YOUR_')) {
        showToast(`Укажите реальный Client ID для ${provider.toUpperCase()}`, true);
        playSound('error');
        return;
    }

    // Формирование ссылки для редиректа на страницу входа сервиса
    let url = '';
    if (provider === 'google') {
        url = `${config.authUrl}?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&response_type=code&scope=${encodeURIComponent(config.scope)}`;
    } else if (provider === 'github') {
        url = `${config.authUrl}?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&scope=${encodeURIComponent(config.scope)}`;
    } else if (provider === 'discord') {
        url = `${config.authUrl}?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&response_type=code&scope=${encodeURIComponent(config.scope)}`;
    }

    // Открытие окна авторизации (popup или редирект)
    window.location.href = url;
}