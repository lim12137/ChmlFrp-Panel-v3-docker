# Docker 化验收报告

日期：2026-05-06

## 本次目标

- 为 `ChmlFrp-Panel-v3` 增加 Docker 镜像构建能力
- 增加 GitHub Actions 自动构建与推送 GHCR
- 将关键地址改为可通过容器环境变量注入

## 执行命令

### 1. 安装依赖

```bash
npm install -g pnpm@10.11.0 --force --registry=https://registry.npmmirror.com
pnpm config set registry https://registry.npmmirror.com
pnpm install
```

结果摘要：

- 成功安装 `pnpm 10.11.0`
- 成功安装项目依赖

### 2. 前端生产构建

```bash
pnpm build
```

结果摘要：

- 构建成功
- 成功生成 `dist/`
- Vite 仅提示部分 chunk 体积较大，未阻断构建

### 3. Docker 镜像构建

```bash
docker build --build-arg PNPM_REGISTRY=https://registry.npmmirror.com -t chmlfrp-panel-v3:local .
```

结果摘要：

- 未完成验证
- 当前机器缺少可用的 Docker Linux 引擎，报错为：
  `open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.`

## 结论

- 代码层面的 Docker 化改造已完成
- 前端构建已通过
- GitHub Actions 工作流已就绪，适合在 GitHub 环境完成正式镜像构建
- 本机只差启动 Docker Desktop 或可用的 Linux 容器引擎，即可继续完成本地镜像验收
