const STORAGE_KEY = 'chmlfrp_auth_tokens';

interface StoredAuthTokens {
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: number | null;
}

interface SetAuthTokensOptions {
    accessToken?: string | null;
    refreshToken?: string | null;
    expiresAt?: number | null;
    expiresIn?: number | null;
}

const isClient = () => typeof window !== 'undefined';

const normalizeTokenValue = (value: string | null | undefined) => {
    if (typeof value !== 'string') {
        return value ?? null;
    }
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
};

const normalizeExpiresAt = (value: number | null | undefined) => {
    if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
        return null;
    }
    return Math.floor(value);
};

const readStoredTokens = (): StoredAuthTokens => {
    if (!isClient()) {
        return {
            accessToken: null,
            refreshToken: null,
            expiresAt: null,
        };
    }

    const rawValue = localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
        return {
            accessToken: null,
            refreshToken: null,
            expiresAt: null,
        };
    }

    try {
        const parsed = JSON.parse(rawValue) as Partial<StoredAuthTokens>;
        return {
            accessToken: normalizeTokenValue(parsed.accessToken),
            refreshToken: normalizeTokenValue(parsed.refreshToken),
            expiresAt: normalizeExpiresAt(parsed.expiresAt),
        };
    } catch {
        localStorage.removeItem(STORAGE_KEY);
        return {
            accessToken: null,
            refreshToken: null,
            expiresAt: null,
        };
    }
};

const persistTokens = (tokens: StoredAuthTokens) => {
    if (!isClient()) {
        return;
    }

    if (!tokens.accessToken && !tokens.refreshToken) {
        localStorage.removeItem(STORAGE_KEY);
        return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
};

export const setAuthTokens = (options: SetAuthTokensOptions) => {
    const current = readStoredTokens();
    const nextAccessToken = options.accessToken === undefined ? current.accessToken : normalizeTokenValue(options.accessToken);
    const nextRefreshToken = options.refreshToken === undefined ? current.refreshToken : normalizeTokenValue(options.refreshToken);

    let nextExpiresAt = current.expiresAt;
    if (options.expiresAt !== undefined) {
        nextExpiresAt = normalizeExpiresAt(options.expiresAt);
    } else if (options.expiresIn !== undefined) {
        nextExpiresAt = typeof options.expiresIn === 'number' && options.expiresIn > 0 ? Date.now() + options.expiresIn * 1000 : null;
    } else if (options.accessToken !== undefined && nextAccessToken !== current.accessToken) {
        nextExpiresAt = null;
    }

    if (!nextAccessToken) {
        nextExpiresAt = null;
    }

    persistTokens({
        accessToken: nextAccessToken,
        refreshToken: nextRefreshToken,
        expiresAt: nextExpiresAt,
    });
};

export const clearAuthTokens = () => {
    if (!isClient()) {
        return;
    }
    localStorage.removeItem(STORAGE_KEY);
};

export const getAccessToken = () => readStoredTokens().accessToken;

export const getRefreshToken = () => readStoredTokens().refreshToken;

export const getAccessTokenExpiresAt = () => readStoredTokens().expiresAt;

export const hasAuthTokens = () => {
    const tokens = readStoredTokens();
    return !!tokens.accessToken || !!tokens.refreshToken;
};

export const isAccessTokenExpired = (bufferMs = 30000) => {
    const accessToken = getAccessToken();
    const expiresAt = getAccessTokenExpiresAt();
    if (!accessToken) {
        return true;
    }
    if (!expiresAt) {
        return false;
    }
    return expiresAt <= Date.now() + bufferMs;
};

export const getAuthorizationHeaders = () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
        return {};
    }
    return {
        Authorization: `Bearer ${accessToken}`,
    };
};

export const consumeAuthTokensFromUrl = () => {
    if (!isClient()) {
        return false;
    }

    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
    if (!hash) {
        return false;
    }

    const params = new URLSearchParams(hash);
    const accessToken = normalizeTokenValue(params.get('access_token'));
    if (!accessToken) {
        return false;
    }

    const refreshToken = normalizeTokenValue(params.get('refresh_token'));
    const expiresAt = normalizeExpiresAt(Number(params.get('expires_at')));
    const expiresIn = Number(params.get('expires_in'));

    setAuthTokens({
        accessToken,
        refreshToken,
        expiresAt,
        expiresIn: Number.isNaN(expiresIn) ? undefined : expiresIn,
    });

    sessionStorage.removeItem('sso_last_redirect_at');
    window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
    return true;
};
