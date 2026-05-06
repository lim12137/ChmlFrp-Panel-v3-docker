# ChmlFrp Docker 管理面板 - 统一镜像
# Author: linluo
# 防盗标识: linluo

# ============ 前端构建阶段 ============
FROM node:18-alpine AS frontend-build

LABEL stage=frontend-build
WORKDIR /app
ENV GENERATE_SOURCEMAP=false

# 复制前端依赖文件
COPY frontend/package*.json ./
RUN npm install --production=false

# 复制前端源码并构建
COPY frontend/ .
RUN npm run build && find build -name '*.map' -delete

# ============ 后端准备阶段 ============
FROM node:18-alpine AS backend-build

LABEL stage=backend-build
WORKDIR /app

# 安装必要工具
RUN apk add --no-cache curl wget

# 下载FRP客户端
RUN wget https://github.com/fatedier/frp/releases/download/v0.52.3/frp_0.52.3_linux_amd64.tar.gz && \
    tar -xzf frp_0.52.3_linux_amd64.tar.gz && \
    mv frp_0.52.3_linux_amd64/frpc /usr/local/bin/ && \
    mv frp_0.52.3_linux_amd64/frps /usr/local/bin/ && \
    rm -rf frp_0.52.3_linux_amd64*

# 复制后端依赖文件
COPY backend/package*.json ./
RUN npm install --production

# 复制后端源码
COPY backend/ .

# ============ 最终生产镜像 ============
FROM nginx:alpine

# 镜像信息
LABEL maintainer="linluo <linluo208@gmail.com>"
LABEL description="ChmlFrp Docker Management Panel - 内网穿透管理面板"
LABEL version="1.0.0"
LABEL author="linluo"

# 安装Node.js和必要工具
RUN apk add --no-cache nodejs curl

# 创建应用目录
RUN mkdir -p /app/backend /app/data /app/configs /app/logs

# 复制前端构建结果
COPY --from=frontend-build /app/build /usr/share/nginx/html

# 复制后端应用
COPY --from=backend-build /app /app/backend
COPY --from=backend-build /usr/local/bin/frpc /app/frpc
COPY --from=backend-build /usr/local/bin/frps /app/frps

# 复制nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

# 删除supervisor配置，使用简单启动脚本

# 创建启动脚本
RUN echo '#!/bin/sh' > /usr/local/bin/start.sh && \
    echo '# ChmlFrp Docker 管理面板启动脚本' >> /usr/local/bin/start.sh && \
    echo '# Author: linluo' >> /usr/local/bin/start.sh && \
    echo '' >> /usr/local/bin/start.sh && \
    echo 'echo "🚀 启动 ChmlFrp 管理面板..."' >> /usr/local/bin/start.sh && \
    echo 'echo "📍 前端地址: http://localhost"' >> /usr/local/bin/start.sh && \
    echo 'echo "🔧 后端API: http://localhost:3001"' >> /usr/local/bin/start.sh && \
    echo 'echo "👨‍💻 作者: linluo"' >> /usr/local/bin/start.sh && \
    echo 'echo "🔒 防盗标识: linluo"' >> /usr/local/bin/start.sh && \
    echo '' >> /usr/local/bin/start.sh && \
    echo '# 确保目录权限' >> /usr/local/bin/start.sh && \
    echo 'chown -R nginx:nginx /usr/share/nginx/html' >> /usr/local/bin/start.sh && \
    echo 'chmod -R 755 /app' >> /usr/local/bin/start.sh && \
    echo 'chmod +x /app/frpc /app/frps' >> /usr/local/bin/start.sh && \
    echo '' >> /usr/local/bin/start.sh && \
    echo '# 启动后端服务' >> /usr/local/bin/start.sh && \
    echo 'cd /app/backend' >> /usr/local/bin/start.sh && \
    echo 'echo "正在启动后端服务..."' >> /usr/local/bin/start.sh && \
    echo 'node index.js &' >> /usr/local/bin/start.sh && \
    echo 'BACKEND_PID=$!' >> /usr/local/bin/start.sh && \
    echo '' >> /usr/local/bin/start.sh && \
    echo '# 等待后端服务启动' >> /usr/local/bin/start.sh && \
    echo 'echo "等待后端服务启动..."' >> /usr/local/bin/start.sh && \
    echo 'for i in $(seq 1 30); do' >> /usr/local/bin/start.sh && \
    echo '  if curl -f http://127.0.0.1:3001/api/health >/dev/null 2>&1; then' >> /usr/local/bin/start.sh && \
    echo '    echo "✅ 后端服务已启动"' >> /usr/local/bin/start.sh && \
    echo '    break' >> /usr/local/bin/start.sh && \
    echo '  elif curl -f http://127.0.0.1:3001/ >/dev/null 2>&1; then' >> /usr/local/bin/start.sh && \
    echo '    echo "✅ 后端服务已启动（无health端点）"' >> /usr/local/bin/start.sh && \
    echo '    break' >> /usr/local/bin/start.sh && \
    echo '  fi' >> /usr/local/bin/start.sh && \
    echo '  echo "等待后端服务... ($i/30)"' >> /usr/local/bin/start.sh && \
    echo '  sleep 1' >> /usr/local/bin/start.sh && \
    echo 'done' >> /usr/local/bin/start.sh && \
    echo '' >> /usr/local/bin/start.sh && \
    echo '# 启动nginx' >> /usr/local/bin/start.sh && \
    echo 'echo "启动nginx前端服务..."' >> /usr/local/bin/start.sh && \
    echo 'exec nginx -g "daemon off;"' >> /usr/local/bin/start.sh && \
    chmod +x /usr/local/bin/start.sh

# 暴露端口
EXPOSE 80 3001 7000 7400 7500

# 数据卷
VOLUME ["/app/data", "/app/configs", "/app/logs"]

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost/ && curl -f http://localhost:3001/api/health || exit 1

# 启动命令
ENTRYPOINT ["/usr/local/bin/start.sh"]
