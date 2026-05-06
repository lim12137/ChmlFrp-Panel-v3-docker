# ChmlFrp Docker 镜像使用指南

## 🐳 GitHub 镜像

[![GitHub Release](https://img.shields.io/github/v/release/lim12137/ChmlFrp-Panel-v3-docker)](https://github.com/lim12137/ChmlFrp-Panel-v3-docker/releases)
[![GitHub Container Registry](https://img.shields.io/badge/GHCR-available-blue)](https://github.com/lim12137/ChmlFrp-Panel-v3-docker/pkgs/container/chmlfrp-panel)

## 🚀 快速开始

### 方法一：一键部署脚本（推荐）

```bash
curl -fsSL https://raw.githubusercontent.com/lim12137/ChmlFrp-Panel-v3-docker/master/deploy.sh | bash
```

### 方法二：Docker Run

```bash
docker run -d \
  --name chmlfrp-panel \
  --restart unless-stopped \
  -p 8888:80 \
  -p 3001:3001 \
  -p 7000:7000 \
  -p 7400:7400 \
  -p 7500:7500 \
  -v chmlfrp-data:/app/data \
  -v chmlfrp-configs:/app/configs \
  -v chmlfrp-logs:/app/logs \
  -e NODE_ENV=production \
  -e TZ=Asia/Shanghai \
  ghcr.io/linluo208/chmlfrp-panel:latest
```

### 方法三：离线部署（网络受限环境）

#### 选项1：下载GitHub Release
```bash
# 1. 下载镜像文件
wget https://github.com/lim12137/ChmlFrp-Panel-v3-docker/releases/latest/download/chmlfrp-panel.tar

# 2. 导入镜像
docker load -i chmlfrp-panel.tar

# 3. 运行容器
docker run -d --name chmlfrp-panel -p 8888:80 ghcr.io/linluo208/chmlfrp-panel:latest
```

#### 选项2：使用导入脚本
```bash
# 下载并运行脚本
wget https://raw.githubusercontent.com/lim12137/ChmlFrp-Panel-v3-docker/master/export-import-image.sh
chmod +x export-import-image.sh
./export-import-image.sh
```

### 方法四：Docker Compose

1. **下载配置文件**：
```bash
mkdir chmlfrp && cd chmlfrp
curl -fsSL https://raw.githubusercontent.com/lim12137/ChmlFrp-Panel-v3-docker/master/docker-compose.prod.yml -o docker-compose.yml
```

2. **启动服务**：
```bash
docker-compose up -d
```

## 📊 镜像信息

| 信息 | 值 |
|------|-----|
| **镜像名称** | `ghcr.io/linluo208/chmlfrp-panel` |
| **最新版本** | `latest` |
| **基础镜像** | `nginx:alpine` + `node:18-alpine` |
| **镜像大小** | ~200MB |
| **支持架构** | `linux/amd64`, `linux/arm64` |

## 🔧 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `NODE_ENV` | `production` | 运行环境 |
| `TZ` | `Asia/Shanghai` | 时区设置 |
| `LOG_LEVEL` | `info` | 日志级别 |
| `FRONTEND_PORT` | `8888` | 前端端口 |
| `BACKEND_PORT` | `3001` | 后端端口 |

## 📂 数据卷

| 路径 | 说明 |
|------|------|
| `/app/data` | 应用数据存储 |
| `/app/configs` | FRP配置文件 |
| `/app/logs` | 应用日志文件 |

## 🌐 端口说明

| 端口 | 说明 |
|------|------|
| `80` | 前端Web界面 |
| `3001` | 后端API接口 |
| `7000` | FRP服务器端口 |
| `7400` | FRP客户端管理端口 |
| `7500` | FRP服务器管理端口 |

## 🔍 健康检查

镜像内置健康检查：
```bash
# 检查服务状态
docker ps
# 查看健康状态
docker inspect --format='{{.State.Health.Status}}' chmlfrp-panel
```

## 📋 管理命令

### 基本操作
```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 更新镜像
```bash
# 拉取最新镜像
docker-compose pull

# 重新启动服务
docker-compose up -d
```

### 数据备份
```bash
# 备份数据卷
docker run --rm -v chmlfrp-data:/data -v $(pwd):/backup alpine tar czf /backup/chmlfrp-data.tar.gz -C /data .

# 恢复数据卷
docker run --rm -v chmlfrp-data:/data -v $(pwd):/backup alpine tar xzf /backup/chmlfrp-data.tar.gz -C /data
```

## 🛠️ 宝塔面板部署

### 1. 通过Docker管理器

1. **安装Docker管理器**（宝塔应用商店）
2. **拉取镜像**：`ghcr.io/linluo208/chmlfrp-panel:latest`
3. **创建容器**：
   - 容器名：`chmlfrp-panel`
   - 端口映射：`8888:80, 3001:3001, 7000:7000, 7400:7400, 7500:7500`
   - 数据卷：`/www/chmlfrp-data:/app/data`
   - 重启策略：`unless-stopped`

### 2. 通过终端命令

```bash
# 进入宝塔终端，执行一键部署
curl -fsSL https://raw.githubusercontent.com/lim12137/ChmlFrp-Panel-v3-docker/master/deploy.sh | bash
```

### 3. 反向代理设置

在宝塔面板中设置反向代理：
- **目标URL**：`http://127.0.0.1:8888`
- **发送域名**：`$host`

## 🔐 安全建议

1. **防火墙设置**：只开放必要端口
2. **反向代理**：使用Nginx反向代理并配置SSL
3. **定期更新**：保持镜像版本最新
4. **数据备份**：定期备份数据卷

## 📞 技术支持

- **GitHub Issues**：[https://github.com/lim12137/ChmlFrp-Panel-v3-docker/issues](https://github.com/lim12137/ChmlFrp-Panel-v3-docker/issues)
- **项目文档**：[https://github.com/lim12137/ChmlFrp-Panel-v3-docker](https://github.com/lim12137/ChmlFrp-Panel-v3-docker)
- **GHCR**：[https://github.com/lim12137/ChmlFrp-Panel-v3-docker/pkgs/container/chmlfrp-panel](https://github.com/lim12137/ChmlFrp-Panel-v3-docker/pkgs/container/chmlfrp-panel)

---

**⭐ 如果这个项目对你有帮助，请给个 Star 支持一下！**
