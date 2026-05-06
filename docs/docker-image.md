# ChmlFrp Panel v3 Docker 化说明

## 目标

- 将前端面板构建为可直接部署的 Docker 镜像
- 通过 GitHub Actions 自动构建并推送到 GHCR
- 支持容器启动时注入运行配置，不强绑定官方域名

## 运行时环境变量

| 变量名 | 默认值 | 用途 |
| --- | --- | --- |
| `APP_API_BASE_URL` | `https://cf-v2.uapis.cn` | 面板请求后端 API 的根地址 |
| `APP_PANEL_ORIGIN` | `https://panel.chmlfrp.net` | SSO 回跳和当前面板来源地址 |
| `APP_SITE_ORIGIN` | `https://www.chmlfrp.net` | 主页、脚本下载等站点根地址 |

## 本地构建

```bash
docker build -t chmlfrp-panel-v3:local .
```

如需在国内网络环境构建，可指定镜像源：

```bash
docker build \
  --build-arg PNPM_REGISTRY=https://registry.npmmirror.com \
  -t chmlfrp-panel-v3:local .
```

## 本地运行

```bash
docker run --rm -p 8080:80 \
  -e APP_API_BASE_URL=https://your-api.example.com \
  -e APP_PANEL_ORIGIN=https://panel.example.com \
  -e APP_SITE_ORIGIN=https://www.example.com \
  chmlfrp-panel-v3:local
```

## GitHub Actions

- 工作流文件：`.github/workflows/docker-image.yml`
- 触发条件：
  - 手动触发
  - 推送到 `main`
  - 推送 `v*` 标签
- 推送目标：
  - `ghcr.io/<owner>/chmlfrp-panel-v3`

## 参考旧项目的点

- 多阶段构建，避免把 Node 构建环境带进最终镜像
- 使用 Nginx 承载前端静态文件
- 运行时写入 `config.js`，避免每次换 API 地址都重新打包
