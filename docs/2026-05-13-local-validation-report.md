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
