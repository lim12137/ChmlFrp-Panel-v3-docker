<template>
    <n-back-top :right="100" />
    <n-card>
        <div style="display: flex; align-items: center">
            <div style="margin-left: 10px">
                <n-h1 prefix="bar">ChmlFrp-下载中心</n-h1>
                <div>
                    <n-p>
                        请选择您要下载的客户端类型。图形客户端更适合新手使用，具有友好的操作UI；而核心程序适合在服务器端或需要自动化的场景使用。
                    </n-p>
                </div>
                <n-button
                    v-if="!isHidden"
                    text
                    tag="a"
                    target="_blank"
                    type="primary"
                    href="https://docs.chmlfrp.net/docs/use/mapping.html"
                >
                    如果您是初次使用，请点击此链接查看教程！
                </n-button>
            </div>
        </div>

        <n-tabs type="line" animated style="margin-top: 20px">
            <n-tab-pane name="launcher" tab="图形客户端 (推荐)">
                <n-grid :x-gap="20" :y-gap="20" cols="1 s:2 m:3" style="margin-top: 12px" responsive="screen">
                    <n-grid-item v-for="os in launcherOsList" :key="os.name">
                        <n-card
                            style="text-align: center"
                            @click="showLauncherCard(os.name)"
                            :class="{ 'card-selected': selectedLauncherOS === os.name }"
                            hoverable
                        >
                            <n-icon :size="60" :component="os.icon" :color="os.color" />
                            <n-divider></n-divider>
                            <h2>{{ os.label }}</h2>
                        </n-card>
                    </n-grid-item>
                </n-grid>

                <n-skeleton
                    v-if="launcherLoading"
                    v-for="i in 3"
                    :key="i"
                    style="margin-top: 20px; height: 64px; border-radius: 10px"
                    :sharp="false"
                    size="medium"
                />
                <div v-else-if="selectedLauncherOSData.length">
                    <div style="margin-top: 20px">
                        <n-alert type="info" :show-icon="false" style="margin-bottom: 20px">
                            <strong>最新版本：{{ launcherVersion }}</strong>
                            <span style="margin-left: 10px; color: #909399">{{ launcherTime }}</span>
                            <div style="margin-top: 10px; white-space: pre-wrap; font-size: 13px">
                                {{ launcherNotes }}
                            </div>
                        </n-alert>
                    </div>
                    <n-card style="margin-top: 20px" v-for="item in selectedLauncherOSData" :key="item.platform">
                        <n-icon
                            :size="18"
                            style="top: 4px"
                            :component="osIcon[selectedLauncherOS]"
                            :color="osColors[selectedLauncherOS]"
                        />
                        <n-divider vertical />
                        <span>{{ item.platform }}</span>
                        <n-button
                            text
                            tag="a"
                            target="_blank"
                            type="primary"
                            :href="item.url"
                            style="float: right; padding: 3px 0"
                        >
                            下载
                        </n-button>
                    </n-card>
                </div>
            </n-tab-pane>

            <n-tab-pane name="core" tab="核心程序 (Frpc)">
                <n-grid :x-gap="20" :y-gap="20" cols="1 s:2 m:4" style="margin-top: 12px" responsive="screen">
                    <n-grid-item v-for="os in osList" :key="os.name">
                        <n-card
                            style="text-align: center"
                            @click="showCard(os.name)"
                            :class="{ 'card-selected': selectedOS === os.name }"
                            hoverable
                        >
                            <n-icon :size="60" :component="os.icon" :color="os.color" />
                            <n-divider></n-divider>
                            <h2>{{ os.label }}</h2>
                        </n-card>
                    </n-grid-item>
                </n-grid>
                <n-infinite-scroll v-if="loading" :distance="1" @load="handleLoad">
                    <n-skeleton
                        v-for="i in count"
                        :key="i"
                        style="margin-top: 20px; height: 64px; border-radius: 10px"
                        :sharp="false"
                        size="medium"
                    />
                </n-infinite-scroll>
                <div v-else-if="selectedOSData.length" :loading="loading">
                    <n-card style="margin-top: 20px" v-for="item in selectedOSData" :key="item.route">
                        <n-icon
                            :size="18"
                            style="top: 4px"
                            :component="osIcon[selectedOS]"
                            :color="osColors[selectedOS]"
                        />
                        <n-divider vertical />
                        <span>{{ item.architecture }}</span>
                        <n-divider vertical v-if="!isHidden" />
                        <span style="color: #909399" v-if="!isHidden">{{ time }}</span>
                        <n-button
                            v-if="!isHidden"
                            text
                            tag="a"
                            target="_blank"
                            type="primary"
                            :href="link + item.route"
                            style="float: right; padding: 3px 0"
                        >
                            {{ link }}{{ item.route }}
                        </n-button>
                        <n-button
                            v-else
                            text
                            tag="a"
                            target="_blank"
                            type="primary"
                            :href="link + item.route"
                            style="float: right; padding: 3px 0"
                            >下载</n-button
                        >
                    </n-card>
                </div>
            </n-tab-pane>
        </n-tabs>
    </n-card>
</template>

<script lang="ts" setup>
import { LogoWindows, LogoApple, LogoTux } from '@vicons/ionicons5';
import { Freebsd } from '@vicons/fa';
import { ref, onMounted, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useScreenStore } from '@/stores/useScreen';
import { getDownloadInfo, getLauncherUpdateInfo } from '@/api/v2/panel/panel';

// 基础的手机端适配
const screenStore = useScreenStore();
const { isHidden } = storeToRefs(screenStore);

// 无限滚动
const count = ref(6);
const handleLoad = () => {
    count.value += 1;
};

// 检测操作系统
const detectOS = (): string => {
    const platform = navigator.platform.toLowerCase();
    const userAgent = navigator.userAgent.toLowerCase();

    if (platform.includes('win') || userAgent.includes('windows')) {
        return 'Windows';
    } else if (platform.includes('mac') || userAgent.includes('mac')) {
        return 'Darwin';
    } else if (platform.includes('linux') || userAgent.includes('linux')) {
        return 'Linux';
    } else if (platform.includes('freebsd') || userAgent.includes('freebsd')) {
        return 'freeBSD';
    }
    return 'Windows';
};

const selectedOS = ref<string>(detectOS());
const link = ref<string>('');
const time = ref<string>('');
const Windows = ref<Array<{ route: string; architecture: string }>>([]);
const Linux = ref<Array<{ route: string; architecture: string }>>([]);
const freeBSD = ref<Array<{ route: string; architecture: string }>>([]);
const Darwin = ref<Array<{ route: string; architecture: string }>>([]);
const loading = ref<boolean>(true);

// 图形客户端相关
const selectedLauncherOS = ref<string>(detectOS() === 'freeBSD' ? 'Windows' : detectOS());
const launcherLoading = ref<boolean>(true);
const launcherVersion = ref<string>('');
const launcherTime = ref<string>('');
const launcherNotes = ref<string>('');
const launcherWindows = ref<Array<{ platform: string; url: string }>>([]);
const launcherLinux = ref<Array<{ platform: string; url: string }>>([]);
const launcherDarwin = ref<Array<{ platform: string; url: string }>>([]);

const osList = [
    { name: 'Windows', label: 'Windows', icon: LogoWindows, color: '#409EFF' },
    { name: 'Linux', label: 'Linux', icon: LogoTux, color: '#e69824' },
    { name: 'freeBSD', label: 'freeBSD', icon: Freebsd, color: '#F56C6C' },
    { name: 'Darwin', label: 'Darwin', icon: LogoApple, color: '#909399' },
];

const launcherOsList = [
    { name: 'Windows', label: 'Windows', icon: LogoWindows, color: '#409EFF' },
    { name: 'Linux', label: 'Linux', icon: LogoTux, color: '#e69824' },
    { name: 'Darwin', label: 'Darwin', icon: LogoApple, color: '#909399' },
];

const osIcon: Record<string, typeof LogoWindows | typeof LogoApple | typeof LogoTux | typeof Freebsd> = {
    Windows: LogoWindows,
    Linux: LogoTux,
    freeBSD: Freebsd,
    Darwin: LogoApple,
};

const osColors: Record<string, string> = {
    Windows: '#409EFF',
    Linux: '#e69824',
    freeBSD: '#F56C6C',
    Darwin: '#909399',
};

const selectedOSData = computed(() => {
    return selectedOS.value === 'Windows'
        ? Windows.value
        : selectedOS.value === 'Linux'
          ? Linux.value
          : selectedOS.value === 'freeBSD'
            ? freeBSD.value
            : Darwin.value;
});

const selectedLauncherOSData = computed(() => {
    return selectedLauncherOS.value === 'Windows'
        ? launcherWindows.value
        : selectedLauncherOS.value === 'Linux'
          ? launcherLinux.value
          : launcherDarwin.value;
});

onMounted(async () => {
    // 核心程序下载信息
    getDownloadInfo()
        .then((response) => {
            Windows.value = response.data.system.windows;
            Linux.value = response.data.system.linux;
            freeBSD.value = response.data.system.freebsd;
            Darwin.value = response.data.system.darwin;
            time.value = response.data.update_time;
            link.value = response.data.link;
        })
        .catch((error) => {
            console.error('下载列表 API 调用失败：', error);
        })
        .finally(() => {
            loading.value = false;
        });

    // 图形客户端更新信息
    getLauncherUpdateInfo()
        .then((response) => {
            launcherVersion.value = response.version;
            launcherTime.value = new Date(response.pub_date).toLocaleString();
            launcherNotes.value = response.notes;

            const platforms = response.platforms;
            for (const [key, value] of Object.entries(platforms)) {
                const item = { platform: key, url: value.url };
                if (key.startsWith('windows')) {
                    launcherWindows.value.push(item);
                } else if (key.startsWith('linux')) {
                    launcherLinux.value.push(item);
                } else if (key.startsWith('darwin')) {
                    launcherDarwin.value.push(item);
                }
            }
        })
        .catch((error) => {
            console.error('图形客户端更新 API 调用失败：', error);
        })
        .finally(() => {
            launcherLoading.value = false;
        });
});

const showCard = (os: string) => {
    selectedOS.value = os;
};

const showLauncherCard = (os: string) => {
    selectedLauncherOS.value = os;
};
</script>

<style lang="scss" scoped>
.custom-card {
    display: flex;
    justify-content: center;
    align-items: center;
}

.content {
    text-align: center;
}

.card-selected {
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
}
</style>
