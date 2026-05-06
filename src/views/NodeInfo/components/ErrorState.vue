<template>
    <n-card>
        <n-result :status="status" :title="title" :description="description">
            <template #footer>
                <n-button tag="a" :href="appConfig.siteOrigin" target="_blank">返回主页</n-button>
            </template>
        </n-result>
    </n-card>
</template>

<script lang="ts" setup>
import { appConfig } from '@/config/appConfig';

interface Props {
    status: '404' | '500';
    title: string;
    description: string;
}

defineProps<Props>();
</script>
