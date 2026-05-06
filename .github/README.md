# ChmlFrp Docker 管理面板

<div align="center">

[![License](https://img.shields.io/github/license/lim12137/ChmlFrp-Panel-v3-docker)](https://github.com/lim12137/ChmlFrp-Panel-v3-docker/blob/master/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/lim12137/ChmlFrp-Panel-v3-docker?style=social)](https://github.com/lim12137/ChmlFrp-Panel-v3-docker/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/lim12137/ChmlFrp-Panel-v3-docker?style=social)](https://github.com/lim12137/ChmlFrp-Panel-v3-docker/network/members)

[![Docker](https://img.shields.io/badge/Docker-Supported-blue)](https://www.docker.com/)
[![React](https://img.shields.io/badge/React-18+-green)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![ChmlFrp](https://img.shields.io/badge/ChmlFrp-Compatible-orange)](https://www.chmlfrp.cn/)

**🚀 功能完整的 ChmlFrp 内网穿透 Docker 管理面板**

[🚀 快速开始](#-快速开始) • [🎯 功能特性](#-功能特性) • [📸 界面预览](#-界面预览) • [📚 文档](#-文档) • [🤝 贡献](#-贡献)

</div>

## ✨ 亮点特性

- 🐳 **一键部署** - Docker Compose 秒级启动
- 🔄 **智能重连** - 断线自动恢复，稳定可靠
- 🌐 **域名自动配置** - 集成主流DNS服务商
- 📊 **实时监控** - 隧道状态、流量统计一目了然
- 🔐 **安全管理** - Token失效检测，多端保护
- 🎨 **现代界面** - 美观易用的Web管理面板

## 🚀 快速开始

### 🐳 Docker Compose 部署（推荐）

```bash
# 一键启动
docker pull ghcr.io/lim12137/chmlfrp-panel:latest
docker run -d --name chmlfrp-panel --restart unless-stopped -p 8888:80 -p 3001:3001 -p 7000:7000 -p 7400:7400 -p 7500:7500 -v /www/chmlfrp/data:/app/data -v /www/chmlfrp/logs:/app/logs -v /www/chmlfrp/configs:/app/configs -e TZ=Asia/Shanghai ghcr.io/lim12137/chmlfrp-panel:latest

# 访问面板
open http://localhost:8888
```

### 📱 宝塔面板一键部署

**适用于宝塔面板用户，零门槛快速部署**

#### 步骤1：安装Docker
1. 宝塔面板 → **软件商店** → 搜索 **Docker管理器** → **安装**

#### 步骤2：拉取镜像
```bash
docker pull ghcr.io/lim12137/chmlfrp-panel:latest
```

#### 步骤3：创建容器
1. Docker管理器 → **镜像管理** → **拉取镜像**
2. 输入 `ghcr.io/lim12137/chmlfrp-panel:latest`

#### 步骤3.1：检查运行状态
```bash
docker ps | grep chmlfrp-panel
docker logs -f chmlfrp-panel
```

#### 步骤4：创建容器
**基础配置：**
- 容器名称：`chmlfrp-panel`
- 端口映射：`8888:80`（主要访问端口）

**数据卷挂载：**
```
/www/chmlfrp/data → /app/data     (配置数据)
/www/chmlfrp/logs → /app/logs     (日志文件)
/www/chmlfrp/configs → /app/configs (FRP配置)
```

**环境变量：**
```
TZ=Asia/Shanghai
```

#### 步骤5：开放端口
宝塔面板 → **安全** → 添加端口：`8888` (TCP)

#### 步骤6：访问面板
🎉 **部署完成！** 访问：`http://你的服务器IP:8888`

**一键命令部署：**
```bash
# 创建数据目录
mkdir -p /www/chmlfrp/{data,logs,configs}

# 运行容器
docker run -d \
  --name chmlfrp-panel \
  -p 8888:80 \
  -p 3001:3001 \
  -v /www/chmlfrp/data:/app/data \
  -v /www/chmlfrp/logs:/app/logs \
  -v /www/chmlfrp/configs:/app/configs \
  -e TZ=Asia/Shanghai \
  --restart unless-stopped \
  ghcr.io/lim12137/chmlfrp-panel:latest
```

## 📸 界面预览

<div align="center">
  <img src="https://wp-cdn.4ce.cn/v2/MjP2fFF.png" alt="仪表盘" width="45%">
  <img src="https://wp-cdn.4ce.cn/v2/rB8Npf5.png" alt="隧道管理" width="45%">
</div>

## 🎯 功能特性

### 🔧 隧道管理
- ✅ 创建、编辑、删除隧道
- ✅ 支持TCP/UDP/HTTP/HTTPS
- ✅ 批量操作和状态控制
- ✅ 实时流量监控

### 🌐 域名管理  
- ✅ 免费二级域名
- ✅ 自定义域名绑定
- ✅ DNS自动配置
- ✅ 多服务商支持

### 🔄 断线重连
- ✅ 智能监控机制
- ✅ 自动故障恢复
- ✅ 健康状态检查
- ✅ 可配置重连策略

### 🔐 安全特性
- ✅ Token安全管理
- ✅ 多端登录保护
- ✅ 自动失效检测
- ✅ 安全API代理

## 📚 文档

### 📖 部署指南
- [🚀 快速开始](#-快速开始) - Docker Compose 和宝塔面板部署
- [📱 宝塔详细教程](BAOTA_DEPLOY.md) - 宝塔面板完整部署指南
- [📖 完整用户手册](README.md) - 详细功能说明和配置

### 🔧 开发文档
- [👨‍💻 开发指南](DEVELOPMENT.md) - 本地开发环境搭建
- [🏗️ 架构说明](ARCHITECTURE.md) - 项目架构和设计理念
- [🤝 贡献指南](CONTRIBUTING.md) - 参与项目贡献

### 📋 其他
- [📝 更新日志](CHANGELOG.md) - 版本历史和变更记录
- [❓ 常见问题](FAQ.md) - 问题排查和解决方案
- [🔧 故障排除](TROUBLESHOOTING.md) - 技术支持指南

## 🛠️ 技术栈

| 组件 | 技术 |
|------|------|
| 前端 | React 18 + Ant Design 5 |
| 后端 | Node.js 18 + Express |
| 容器 | Docker + Docker Compose |
| 代理 | Nginx |

## 🌍 支持的DNS服务商

- 🔵 阿里云DNS
- 🔵 腾讯云DNS
- 🟠 CloudFlare
- 🟡 华为云DNS

## 📊 项目状态

![GitHub stars](https://img.shields.io/github/stars/lim12137/ChmlFrp-Panel-v3-docker)
![GitHub forks](https://img.shields.io/github/forks/lim12137/ChmlFrp-Panel-v3-docker)
![GitHub issues](https://img.shields.io/github/issues/lim12137/ChmlFrp-Panel-v3-docker)
![GitHub pull requests](https://img.shields.io/github/issues-pr/lim12137/ChmlFrp-Panel-v3-docker)

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 开源协议

本项目采用 [MIT License](https://github.com/lim12137/ChmlFrp-Panel-v3-docker/blob/master/LICENSE) 开源协议。

## 🙏 致谢

- [ChmlFrp](https://www.chmlfrp.cn/) - 优质的内网穿透服务
- [FRP](https://github.com/fatedier/frp) - 强大的内网穿透工具
- [Ant Design](https://ant.design/) - 优秀的React UI组件库

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=lim12137/ChmlFrp-Panel-v3-docker&type=Date)](https://star-history.com/#lim12137/ChmlFrp-Panel-v3-docker&Date)

---

<div align="center">

**如果这个项目对你有帮助，请给个 ⭐ Star 支持一下！**

Made with ❤️ by the ChmlFrp Docker community

</div>
