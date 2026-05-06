#!/bin/bash
# ChmlFrp Docker 管理面板一键部署脚本
# Author: linluo
# Copyright: 2025
# 防盗标识: linluo

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 显示欢迎信息
show_welcome() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "   ChmlFrp Docker 管理面板 - 一键部署脚本"
    echo "   Author: linluo"
    echo "   Version: v1.0.0"
    echo "   防盗标识: linluo"
    echo "=================================================="
    echo -e "${NC}"
}

# 检查系统环境
check_environment() {
    log_step "检查系统环境..."
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    # 检查Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    log_info "✅ Docker 环境检查通过"
}

# 检查端口占用
check_ports() {
    log_step "检查端口占用..."
    
    local ports=(8888 3001 7000 7400 7500)
    local occupied_ports=()
    
    for port in "${ports[@]}"; do
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            occupied_ports+=($port)
        fi
    done
    
    if [ ${#occupied_ports[@]} -gt 0 ]; then
        log_warn "以下端口已被占用: ${occupied_ports[*]}"
        read -p "是否继续部署? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "部署已取消"
            exit 0
        fi
    fi
    
    log_info "✅ 端口检查完成"
}

# 创建部署目录
create_directory() {
    log_step "创建部署目录..."
    
    local deploy_dir="${1:-/opt/chmlfrp}"
    
    if [ ! -d "$deploy_dir" ]; then
        mkdir -p "$deploy_dir"
        log_info "创建目录: $deploy_dir"
    fi
    
    cd "$deploy_dir"
    log_info "✅ 工作目录: $(pwd)"
}

# 下载配置文件
download_config() {
    log_step "下载配置文件..."
    
    # 下载docker-compose.prod.yml
    if curl -fsSL https://raw.githubusercontent.com/lim12137/ChmlFrp-Panel-v3-docker/master/docker-compose.prod.yml -o docker-compose.yml; then
        log_info "✅ 配置文件下载成功"
    else
        log_error "配置文件下载失败"
        exit 1
    fi
}

# 拉取Docker镜像
pull_images() {
    log_step "拉取Docker镜像..."
    
    docker-compose pull
    log_info "✅ 镜像拉取完成"
}

# 启动服务
start_services() {
    log_step "启动服务..."
    
    docker-compose up -d
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 10
    
    # 检查服务状态
    if docker-compose ps | grep -q "Up"; then
        log_info "✅ 服务启动成功"
    else
        log_error "服务启动失败"
        docker-compose logs
        exit 1
    fi
}

# 显示部署结果
show_result() {
    local server_ip=$(curl -s ipinfo.io/ip 2>/dev/null || echo "your-server-ip")
    
    echo -e "${GREEN}"
    echo "=================================================="
    echo "🎉 ChmlFrp 管理面板部署完成!"
    echo ""
    echo "📍 访问地址:"
    echo "   管理面板: http://$server_ip:8888"
    echo "   后端API:  http://$server_ip:3001"
    echo ""
    echo "🔧 管理命令:"
    echo "   查看状态: docker-compose ps"
    echo "   查看日志: docker-compose logs -f"
    echo "   停止服务: docker-compose down"
    echo "   重启服务: docker-compose restart"
    echo "   更新镜像: docker-compose pull && docker-compose up -d"
    echo ""
    echo "📚 使用说明:"
    echo "   1. 打开浏览器访问管理面板"
    echo "   2. 使用 ChmlFrp 账户登录"
    echo "   3. 开始管理您的内网穿透隧道"
    echo ""
    echo "❓ 如遇问题，请查看项目文档或提交Issue"
    echo "🔗 GitHub: https://github.com/lim12137/ChmlFrp-Panel-v3-docker"
    echo "=================================================="
    echo -e "${NC}"
}

# 主函数
main() {
    show_welcome
    check_environment
    check_ports
    create_directory "$1"
    download_config
    pull_images
    start_services
    show_result
}

# 执行主函数
main "$@"
