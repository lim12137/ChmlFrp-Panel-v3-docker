<template>
    <div>
        正在跳转到登录...
        <a :href="authorizeUrl">如果没有自动跳转，请点击这里</a>
    </div>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/api';

const apiBaseUrl = 'http://localhost:8111';
const returnUrl = 'http://localhost:5174/home';

const authorizeUrl = computed(() => `${apiBaseUrl}/sso/authorize?return_url=${encodeURIComponent(returnUrl)}`);

const router = useRouter();

onMounted(async () => {
    try {
        const res = await api.v2.user.getUserInfo();
        if (res?.data) {
            await router.replace('/home');
            return;
        }
    } catch {
        void 0;
    }

    const now = Date.now();
    const lastRedirectAt = Number(sessionStorage.getItem('sso_last_redirect_at') || 0);
    if (now - lastRedirectAt < 2000) {
        return;
    }
    sessionStorage.setItem('sso_last_redirect_at', String(now));
    window.location.replace(authorizeUrl.value);
});
</script>
