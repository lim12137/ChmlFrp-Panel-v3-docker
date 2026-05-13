# 2026-05-13 本地验证测试报告

## 环境前提

- 工作区：`M:\AI\1work\ChmlFrp`
- 仓库目录：`M:\AI\1work\ChmlFrp\ChmlFrp-Panel-v3-docker`
- 系统 Shell：PowerShell
- Node.js：`v24.15.0`
- npm：`11.12.1`
- Docker CLI：`Docker version 28.1.1, build 4eba377`
- Docker Compose：`v2.35.1-desktop.1`
- Docker Desktop Linux Engine：测试时不可连接，报错为 `open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.`

## 官方/仓库说明确认

- `README.md`、`DOCKER.md`、`DEVELOPMENT.md`、`CONTRIBUTING.md` 均说明项目主要以 Docker / Docker Compose 运行。
- 开发方式：
  - 后端：`cd backend && npm install && npm run dev` 或 `npm start`
  - 前端：`cd frontend && npm install && npm start`
- 测试入口：
  - `CONTRIBUTING.md` 写明后端测试命令为 `cd backend && npm test`，但 `backend/package.json` 未定义 `test` 脚本。
  - `frontend/package.json` 定义 `test` 脚本为 `react-scripts test`。
  - `DEVELOPMENT.md` 写明 Docker 构建测试入口为 `docker-compose build` / `docker-compose ps`。

## 测试命令与结果摘要

| 序号 | 命令 | 结果摘要 |
| --- | --- | --- |
| 1 | `git clone https://github.com/lim12137/ChmlFrp-Panel-v3-docker.git ChmlFrp-Panel-v3-docker` | 成功，仓库已拉取到独立子目录。 |
| 2 | `node --version` | 成功，输出 `v24.15.0`。 |
| 3 | `npm --version` | 成功，输出 `11.12.1`。 |
| 4 | `docker --version` | 成功，Docker CLI 输出 `Docker version 28.1.1, build 4eba377`。 |
| 5 | `docker compose version` | 成功，输出 `Docker Compose version v2.35.1-desktop.1`。 |
| 6 | `cd backend; npm ci` | 成功，安装 122 个包。 |
| 7 | `cd frontend; npm ci` | 成功，安装 1615 个包；存在若干 npm deprecated 警告。 |
| 8 | `cd frontend; npm run build` | 成功，React 生产构建完成；存在 ESLint 警告与 Browserslist 数据过期提示。 |
| 9 | `cd frontend; npm test -- --watchAll=false` | 失败，未发现测试文件，退出码 1；提示可用 `--passWithNoTests` 改为无测试时成功退出。 |
| 10 | `docker compose build` | 命令返回成功，但当前 `docker-compose.yml` 仅引用远程镜像 `ghcr.io/lim12137/chmlfrp-panel:latest`，没有本地 `build:` 配置，因此未实际构建源码镜像。 |
| 11 | `docker build -t chmlfrp-panel-local-test -f Dockerfile .` | 失败，Docker Desktop Linux Engine 不可连接：`open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.` |
| 12 | 后台启动 `cd backend; npm start` 后请求 `http://127.0.0.1:3001/api/check_login_status` | 成功，HTTP 200，响应 `{"code":200,"state":"success","msg":"未登录","data":{"isLoggedIn":false,"username":null,"hasAutoLogin":false}}`。 |

## 失败原因与阻塞点

- 前端测试失败不是代码运行错误，而是仓库当前没有匹配 `src/**/__tests__/**/*.{js,jsx,ts,tsx}` 或 `src/**/*.{spec,test}.{js,jsx,ts,tsx}` 的测试文件。
- 后端官方文档提到 `npm test`，但 `backend/package.json` 未配置 `test` 脚本，因此未执行后端单元测试。
- Docker 源码镜像构建被本机 Docker 引擎状态阻塞；Docker CLI 与 Compose 已安装，但 Docker Desktop Linux Engine 管道不存在或未启动。
- `docker compose build` 虽返回成功，但 Compose 文件未包含本地构建配置，不能作为源码构建验证。

## 清理说明

- 为避免保留大体积临时产物，已清理本次验证生成的 `backend/node_modules`、`frontend/node_modules`、`frontend/build`。

## 结论

- 本地源码级验证中，前端生产构建通过，后端可启动并通过基础健康接口验证。
- 自动化测试覆盖不足：前端无测试文件，后端无 `test` 脚本。
- Docker 路径需先启动/修复 Docker Desktop Linux Engine 后，再执行 `docker build -t chmlfrp-panel-local-test -f Dockerfile .` 或改用带 `build:` 的 Compose 配置进行完整容器验证。

---

## 追加记录：本地开发服务拉起（不用镜像）

### 本次要求

- 不使用 Docker / 镜像。
- 基于源码安装依赖并启动后端、前端本地开发服务。
- 服务尽量保持后台运行，并记录访问地址、进程信息、日志文件路径。
- 验证后端健康/登录状态接口、前端首页可达性。

### 启动命令

| 步骤 | 命令 | 结果摘要 |
| --- | --- | --- |
| 1 | `cd backend; npm ci` | 成功，安装 122 个包。 |
| 2 | `cd frontend; npm ci` | 成功，安装 1615 个包；存在 npm deprecated 警告。 |
| 3 | `cd backend; npm run dev` | 成功，后端开发服务通过 `nodemon index.js` 后台运行，监听 `3001`。 |
| 4 | `cd frontend; npm start` | 首次带 `HOST=127.0.0.1` 启动失败，报 `options.allowedHosts[0] should be a non-empty string`；清除 `HOST` 后重启成功，监听 `3000`。 |

### 可访问地址

- 后端 API：`http://localhost:3001`
- 后端健康接口：`http://localhost:3001/api/health`
- 后端登录状态接口：`http://localhost:3001/api/check_login_status`
- 前端首页：`http://localhost:3000/`

### 验证命令与结果

| 验证项 | 命令 | 结果摘要 |
| --- | --- | --- |
| 后端健康接口 | `Invoke-WebRequest -Uri http://localhost:3001/api/health -UseBasicParsing -TimeoutSec 20` | HTTP `200`，返回 `ChmlFrp Docker Dashboard API运行正常`。 |
| 后端登录状态 | `Invoke-WebRequest -Uri http://localhost:3001/api/check_login_status -UseBasicParsing -TimeoutSec 20` | HTTP `200`，返回 `未登录`，`isLoggedIn=false`，符合未配置登录信息的本地状态。 |
| 前端首页 | `Invoke-WebRequest -Uri http://localhost:3000/ -UseBasicParsing -TimeoutSec 20` | HTTP `200`，返回 React 首页 HTML，页面可达。 |

### 进程与端口

| 服务 | 端口 | 监听地址 | 进程 |
| --- | --- | --- | --- |
| 后端 | `3001` | `::` | `node.exe` PID `7380` 监听端口；`nodemon` PID `7884`；父级 `cmd.exe` PID `16140`；`npm run dev` PID `19024` / `12520`。 |
| 前端 | `3000` | `0.0.0.0` | `node.exe` PID `5368` 监听端口；`react-scripts` PID `2908`；父级 `cmd.exe` PID `5084`；`npm start` PID `12568`。 |

### 日志文件

- 后端标准输出：`M:\AI\1work\ChmlFrp\ChmlFrp-Panel-v3-docker\logs\backend-dev.out.log`
- 后端错误输出：`M:\AI\1work\ChmlFrp\ChmlFrp-Panel-v3-docker\logs\backend-dev.err.log`
- 前端标准输出：`M:\AI\1work\ChmlFrp\ChmlFrp-Panel-v3-docker\logs\frontend-dev.out.log`
- 前端错误输出：`M:\AI\1work\ChmlFrp\ChmlFrp-Panel-v3-docker\logs\frontend-dev.err.log`

### 如何停止服务

```powershell
Stop-Process -Id 7380,7884,16140,19024,12520,5368,2908,5084,12568 -Force
```

如进程号变化，可按端口查找后停止：

```powershell
Get-NetTCPConnection -State Listen -LocalPort 3000,3001 | Select-Object LocalPort,OwningProcess
Stop-Process -Id <OwningProcess> -Force
```

### 结论

- 本次按源码本地开发方式完成拉起，未使用 Docker / 镜像。
- 后端健康接口、后端登录状态接口、前端首页均验证通过。
- 服务当前保持后台运行，可直接访问 `http://localhost:3000/`。
