/// <reference types="vite/client" />

interface Window {
    __APP_CONFIG__?: {
        apiBaseUrl?: string;
        panelOrigin?: string;
        siteOrigin?: string;
    };
}

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string;
    readonly VITE_PANEL_ORIGIN?: string;
    readonly VITE_SITE_ORIGIN?: string;
}

declare module '*.vue' {
    import { DefineComponent } from 'vue';
    const component: DefineComponent<{}, {}, any>;
    export default component;
}
