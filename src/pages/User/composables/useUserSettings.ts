import { ref, markRaw } from 'vue';
import { useRouter } from 'vue-router';
import { useDialog, useMessage } from 'naive-ui';
import { useUserStore } from '@/stores/user';
import api from '@/api';
import {
    KeyOutline,
    CodeDownloadOutline,
} from '@vicons/ionicons5';

/**
 * 用户设置 composable
 */
export function useUserSettings() {
    const router = useRouter();
    const dialog = useDialog();
    const message = useMessage();
    const userStore = useUserStore();

    const loadingOfflineAllTunnels = ref(false);

    const resetToken = () => {
        dialog.warning({
            title: '警告',
            content:
                '重置TOKEN后旧的配置文件均无法使用，这代表着您的所有隧道需要重新获取配置文件再启动（图形客户端不受影响）',
            positiveText: '确定',
            negativeText: '取消',
            onPositiveClick: async () => {
                try {
                    await api.v2.user.resetToken();
                    message.success('TOKEN已重置，请重新登录');
                    userStore.clearUser();
                    router.push('/sign');
                } catch (error) {
                    message.error('重置Token失败: ' + (error as Error).message);
                }
            },
        });
    };

    const offlineAllTunnels = () => {
        const d = dialog.warning({
            title: '警告',
            content:
                '此操作将会停止运行所有您正在运行中的隧道，且frp进程将会自动关闭。请确定此操作是您预期内的。（注意！仅FRP核心版本0.51.2_251023版本才支持此功能）',
            positiveText: '确定',
            negativeText: '取消',
            onPositiveClick: async () => {
                d.loading = true;
                loadingOfflineAllTunnels.value = true;
                try {
                    const response = await api.v2.user.offlineUserNodes();

                    const { totalNodes, successCount, failCount, results } = response.data;
                    let messageText = `下线完成！总计: ${totalNodes} 个节点，成功: ${successCount} 个，失败: ${failCount} 个`;

                    if (Object.keys(results).length > 0) {
                        const resultDetails = Object.entries(results)
                            .map(([node, status]) => `${node}: ${status}`)
                            .join('\n');
                        messageText += `\n\n详细结果:\n${resultDetails}`;
                    }

                    dialog.success({
                        title: '下线完成',
                        content: messageText,
                        positiveText: '好的',
                    });
                } catch (error) {
                    console.error('下线所有隧道失败:', error);
                    message.error('下线所有隧道失败: ' + (error as Error).message);
                } finally {
                    loadingOfflineAllTunnels.value = false;
                }
            },
        });
    };

    const openAccountConsole = () => {
        window.location.href = 'https://account.qzhua.net';
    };

    return {
        loadingOfflineAllTunnels,
        resetToken,
        offlineAllTunnels,
        openAccountConsole,
    };
}

/**
 * 创建设置卡片数据
 */
export function createSettingsCards(
    handlers: {
        resetToken: () => void;
        offlineAllTunnels: () => void;
    }
) {
    return [
        {
            title: '重置token',
            subtitle: '重置后需要重新获取配置文件',
            icon: markRaw(KeyOutline),
            click: handlers.resetToken,
        },
        {
            title: '下线所有隧道',
            subtitle: '一键下线所有运行中的隧道',
            icon: markRaw(CodeDownloadOutline),
            click: handlers.offlineAllTunnels,
        },
    ];
}
