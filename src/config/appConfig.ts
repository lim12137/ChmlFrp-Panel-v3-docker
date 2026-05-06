const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const readRuntimeConfig = () => {
    if (typeof window === 'undefined' || !window.__APP_CONFIG__) {
        return {};
    }
    return window.__APP_CONFIG__;
};

const runtimeConfig = readRuntimeConfig();

const readConfig = (runtimeValue: string | undefined, envValue: string | undefined, fallback: string) => {
    const value = runtimeValue?.trim() || envValue?.trim() || fallback;
    return trimTrailingSlash(value);
};

export const appConfig = {
    apiBaseUrl: readConfig(runtimeConfig.apiBaseUrl, import.meta.env.VITE_API_BASE_URL, 'https://cf-v2.uapis.cn'),
    panelOrigin: readConfig(
        runtimeConfig.panelOrigin,
        import.meta.env.VITE_PANEL_ORIGIN,
        'https://panel.chmlfrp.net'
    ),
    siteOrigin: readConfig(runtimeConfig.siteOrigin, import.meta.env.VITE_SITE_ORIGIN, 'https://www.chmlfrp.net'),
};

export const buildUrl = (baseUrl: string, path: string) => {
    if (/^https?:\/\//i.test(path)) {
        return path;
    }
    return `${trimTrailingSlash(baseUrl)}/${path.replace(/^\/+/, '')}`;
};
