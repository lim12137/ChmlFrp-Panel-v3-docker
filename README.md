# ChmlFrp Docker 管理面板

<div align="center">

![ChmlFrp Logo](https://img.shields.io/badge/ChmlFrp-Docker-blue)
![Docker](https://img.shields.io/badge/Docker-Compose-blue)
![React](https://img.shields.io/badge/React-18+-green)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

**功能完整的 ChmlFrp 内网穿透 Docker 管理面板**

</div>

## 🌟 项目特色

- 🐳 **一键部署** - Docker Compose 快速启动
- 🔄 **断线重连** - 智能监控，自动重启异常隧道
- 🌐 **域名管理** - 集成多家DNS服务商API，自动配置域名解析
- 📊 **实时监控** - 隧道状态、流量统计、节点监控
- 🔐 **安全认证** - Token失效自动检测，多端登录保护
- 🎨 **现代界面** - 基于Ant Design的美观UI
- ⚡ **高性能** - 并发隧道管理，资源优化

## 📦 快速开始

### 环境要求

- Docker & Docker Compose
- 2GB+ 内存
- ChmlFrp 账户和Token

### 一键部署

```bash
# 拉取镜像
docker pull ghcr.io/lim12137/chmlfrp-panel:latest

# 创建数据目录
mkdir -p /www/chmlfrp/{data,logs,configs}

# 启动容器
docker run -d \
  --name chmlfrp-panel \
  --restart unless-stopped \
  -p 8888:80 \
  -p 3001:3001 \
  -p 7000:7000 \
  -p 7400:7400 \
  -p 7500:7500 \
  -v /www/chmlfrp/data:/app/data \
  -v /www/chmlfrp/logs:/app/logs \
  -v /www/chmlfrp/configs:/app/configs \
  -e TZ=Asia/Shanghai \
  ghcr.io/lim12137/chmlfrp-panel:latest
```

### 访问面板

- **管理面板**: http://localhost:8888
- **后端API**: http://localhost:3001

### 更新镜像

```bash
docker pull ghcr.io/lim12137/chmlfrp-panel:latest
docker rm -f chmlfrp-panel
docker run -d --name chmlfrp-panel --restart unless-stopped -p 8888:80 -p 3001:3001 -p 7000:7000 -p 7400:7400 -p 7500:7500 -v /www/chmlfrp/data:/app/data -v /www/chmlfrp/logs:/app/logs -v /www/chmlfrp/configs:/app/configs -e TZ=Asia/Shanghai ghcr.io/lim12137/chmlfrp-panel:latest
```

默认会自动打开浏览器访问管理面板。

> 💡 **宝塔面板用户**: 如需在宝塔面板中部署，请查看 [宝塔详细部署教程](BAOTA_DEPLOY.md)

## 🛠️ 功能特性

### 🎯 核心功能

| 功能 | 说明 | 状态 |
|------|------|------|
| 隧道管理 | 创建、编辑、删除隧道 | ✅ |
| 实时状态 | 隧道运行状态监控 | ✅ |
| 流量统计 | 实时流量和历史数据 | ✅ |
| 节点选择 | 支持所有ChmlFrp节点 | ✅ |
| 域名绑定 | 自定义域名和免费二级域名 | ✅ |

### 🚀 高级功能

| 功能 | 说明 | 状态 |
|------|------|------|
| 断线重连 | 网络断线自动重连机制 | ✅ |
| DNS自动配置 | 支持阿里云、腾讯云等DNS API | ✅ |
| 批量操作 | 一键启停多个隧道 | ✅ |
| 配置导出 | 导出FRP配置文件 | ✅ |
| 日志查看 | 实时查看运行日志 | ✅ |

### 🔐 安全特性

| 功能 | 说明 | 状态 |
|------|------|------|
| Token管理 | 安全的Token存储和验证 | ✅ |
| 自动退出 | Token失效自动退出登录 | ✅ |
| 多端保护 | 其他设备Token重置检测 | ✅ |
| 请求代理 | 后端代理所有API请求 | ✅ |

## 📋 使用指南

### 1. 登录系统

支持两种登录方式：
- **用户名密码登录**: 使用ChmlFrp账号密码
- **Token登录**: 直接使用ChmlFrp Token

### 2. 隧道管理

#### 创建隧道
1. 点击"新建隧道"按钮
2. 填写隧道基本信息：
   - 隧道名称（唯一标识）
   - 本地IP地址（默认127.0.0.1）
   - 本地端口
   - 协议类型（TCP/UDP/HTTP/HTTPS）
3. 选择节点（显示在线状态和VIP标识）
4. 配置高级选项：
   - 数据加密
   - 数据压缩
   - 自定义域名

#### 域名配置
- **免费二级域名**: 自动从可用列表选择
- **自定义域名**: 支持DNS自动配置
- **CNAME记录**: 自动更新DNS解析

#### 隧道操作
- **启动/停止**: 单个隧道控制
- **批量操作**: 选择多个隧道统一操作
- **状态监控**: 实时查看运行状态
- **流量统计**: 查看进出流量数据

### 3. DNS管理

#### 支持的DNS服务商
- 阿里云DNS
- 腾讯云DNS
- CloudFlare
- 华为云DNS

#### 配置步骤
1. 进入"域名管理"页面
2. 添加DNS服务商配置：
   - 选择服务商类型
   - 输入API凭证
   - 测试连接
3. 选择要管理的域名
4. 系统自动配置CNAME记录

### 4. 系统监控

#### 仪表盘
- 系统运行时间
- 用户信息概览
- 隧道统计
- 流量使用情况

#### 节点状态
- 节点在线率
- 带宽使用情况
- VIP节点标识
- 支持建站标识

## ⚙️ 配置说明

### 环境变量

```bash
# ChmlFrp API配置
CHMLFRP_API_BASE=http://cf-v1.uapis.cn

# 端口配置
FRONTEND_PORT=8888
BACKEND_PORT=3001

# 日志级别
LOG_LEVEL=info
```

### Docker配置

```yaml
services:
  chmlfrp-panel:
    image: ghcr.io/lim12137/chmlfrp-panel:latest
    ports:
      - "${FRONTEND_PORT:-8888}:80"
      - "${BACKEND_PORT:-3001}:3001"
    volumes:
      - frp-data:/app/data
    restart: unless-stopped

volumes:
  frp-data:
```

### 断线重连配置

```javascript
// 重连参数
{
  "autoReconnectEnabled": true,      // 启用自动重连
  "reconnectInterval": 5000,         // 重连间隔5秒
  "maxReconnectAttempts": 10,        // 最大重连次数
  "monitoringInterval": 30000,       // 监控间隔30秒
  "heartbeatInterval": 20,           // 心跳间隔20秒
  "heartbeatTimeout": 60             // 心跳超时60秒
}
```

## 🔧 开发指南

### 项目结构

```
ChmlFrp-Panel-v3-docker/
├── frontend/                 # React前端
│   ├── src/
│   │   ├── components/      # React组件
│   │   ├── utils/          # 工具函数
│   │   └── App.js          # 主应用
│   └── package.json
├── backend/                 # Node.js后端
│   ├── frp-manager.js      # FRP管理器
│   ├── dns-providers.js    # DNS服务商
│   ├── index.js           # 主服务器
│   └── package.json
├── docker-compose.yml      # Docker编排
├── Dockerfile.frontend     # 前端镜像
├── Dockerfile.backend      # 后端镜像
└── nginx.conf             # Nginx配置
```

### 本地开发

#### 后端开发
```bash
cd backend
npm install
npm run dev
```

#### 前端开发
```bash
cd frontend
npm install
npm start
```

### API文档

#### 隧道管理API
```javascript
// 获取隧道列表
GET /api/tunnel?token={token}

// 创建隧道
POST /api/create_tunnel
{
  "token": "user_token",
  "tunnelname": "my-tunnel",
  "node": "node-name",
  "porttype": "tcp",
  "localport": 8080,
  "encryption": false,
  "compression": false
}

// 启动单个隧道
POST /api/frp/start-tunnel
{
  "tunnel": {...},
  "userToken": "user_token"
}
```

#### DNS管理API
```javascript
// 获取域名列表
POST /api/dns/domains
{
  "provider": "aliyun",
  "accessKeyId": "key",
  "accessKeySecret": "secret"
}

// 创建DNS记录
POST /api/dns/records/create
{
  "provider": "aliyun",
  "domain": "example.com",
  "record": "api",
  "value": "1.2.3.4",
  "type": "A"
}
```

### 扩展开发

#### 添加新的DNS服务商
1. 编辑 `backend/dns-providers.js`
2. 实现标准接口：
   ```javascript
   {
     getDomains: async (config) => {...},
     getRecords: async (config, domain) => {...},
     createRecord: async (config, domain, record) => {...},
     updateRecord: async (config, domain, record) => {...},
     deleteRecord: async (config, domain, recordId) => {...}
   }
   ```

#### 自定义前端组件
1. 在 `frontend/src/components/` 创建新组件
2. 遵循Ant Design设计规范
3. 使用统一的API调用方式

## 📊 性能优化

### 前端优化
- ✅ 组件懒加载
- ✅ API请求缓存
- ✅ 图片资源优化
- ✅ 代码分割

### 后端优化
- ✅ 并发隧道管理
- ✅ 请求代理缓存
- ✅ 资源池管理
- ✅ 错误重试机制

### Docker优化
- ✅ 多阶段构建
- ✅ 镜像体积优化
- ✅ 数据持久化
- ✅ 容器重启策略

## 🐛 故障排除

### 常见问题

#### 1. 容器启动失败
```bash
# 查看日志
docker-compose logs chmlfrp-panel

# 重新拉取并启动
docker-compose down
docker-compose pull
docker-compose up -d
```

#### 2. 隧道连接失败
- 检查FRP配置是否正确
- 确认节点状态是否在线
- 查看隧道日志: `docker exec -it chmlfrp-panel cat /app/frpc.log`

#### 3. DNS配置失败
- 验证API凭证是否正确
- 检查域名是否在DNS服务商管理
- 确认网络连接是否正常

#### 4. Token失效问题
- 检查Token是否已过期
- 确认在其他设备是否重置了Token
- 重新登录获取新Token

### 日志查看

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend

# 查看FRP日志
docker exec chmlfrp_docker-backend-1 tail -f /app/frpc.log
```

### 数据备份

```bash
# 备份配置数据
docker cp chmlfrp_docker-backend-1:/app/configs ./backup/

# 备份日志
docker cp chmlfrp_docker-backend-1:/app/frpc.log ./backup/
```

## 🤝 贡献指南

### 报告问题
- 使用GitHub Issues报告bug
- 提供详细的错误信息和复现步骤
- 包含环境信息（操作系统、Docker版本等）

### 提交代码
1. Fork项目到你的GitHub
2. 创建功能分支: `git checkout -b feature/new-feature`
3. 提交更改: `git commit -am 'Add new feature'`
4. 推送分支: `git push origin feature/new-feature`
5. 创建Pull Request

### 开发规范
- 遵循现有代码风格
- 添加适当的注释
- 更新相关文档
- 确保功能测试通过

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源协议。

## 🙏 致谢

- [ChmlFrp](https://www.chmlfrp.cn/) - 提供优质的内网穿透服务
- [FRP](https://github.com/fatedier/frp) - 强大的内网穿透工具
- [Ant Design](https://ant.design/) - 优秀的React UI组件库
- [Docker](https://www.docker.com/) - 容器化技术支持

## 📞 联系方式

- **GitHub**: [项目地址](https://github.com/lim12137/ChmlFrp-Panel-v3-docker)
- **Issues**: [问题反馈](https://github.com/lim12137/ChmlFrp-Panel-v3-docker/issues)
- **Discussions**: [交流讨论](https://github.com/lim12137/ChmlFrp-Panel-v3-docker/discussions)

---

<div align="center">

**如果这个项目对你有帮助，请给个 ⭐ Star 支持一下！**

Made with ❤️ by linluo

</div>
