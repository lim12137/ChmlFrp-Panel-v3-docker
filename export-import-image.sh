#!/bin/bash
# ChmlFrp Docker 镜像导出/导入脚本
# Author: linluo
# Copyright: 2025
# 防盗标识: linluo

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 镜像信息
IMAGE_NAME="ghcr.io/linluo208/chmlfrp-panel:latest"
IMAGE_FILE="chmlfrp-panel.tar"
CONTAINER_NAME="chmlfrp-panel"

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

# 检查Docker环境
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装！请先安装Docker。"
        echo "安装方法："
        echo "  Ubuntu/Debian: apt update && apt install docker.io"
        echo "  CentOS/RHEL: yum install docker"
        echo "  或参考: https://docs.docker.com/install/"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker服务未运行！请先启动Docker服务。"
        echo "启动方法："
        echo "  systemctl start docker"
        echo "  systemctl enable docker"
        exit 1
    fi
}

# 构建镜像函数
build_image() {
    log_step "开始构建Docker镜像..."
    
    # 检查是否存在Dockerfile
    if [ ! -f "Dockerfile" ]; then
        log_error "未找到Dockerfile！请确保在项目根目录运行此脚本。"
        exit 1
    fi
    
    # 构建镜像
    log_info "正在构建镜像 $IMAGE_NAME ..."
    docker build -t "$IMAGE_NAME" .
    
    if docker images | grep -q "ghcr.io/linluo208/chmlfrp-panel"; then
        log_info "✅ 镜像构建成功！"
        docker images | grep chmlfrp
    else
        log_error "镜像构建失败！"
        exit 1
    fi
}

# 导出镜像函数
export_image() {
    log_step "开始导出Docker镜像..."
    
    # 检查镜像是否存在
    if ! docker images | grep -q "ghcr.io/linluo208/chmlfrp-panel"; then
        log_warn "镜像 $IMAGE_NAME 不存在！"
        read -p "是否现在构建镜像？(y/N): " -r
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            build_image
        else
            log_error "请先构建镜像: docker build -t $IMAGE_NAME ."
            exit 1
        fi
    fi
    
    # 删除旧的导出文件
    if [ -f "$IMAGE_FILE" ]; then
        log_warn "发现已存在的镜像文件，正在删除..."
        rm -f "$IMAGE_FILE"
    fi
    
    # 导出镜像
    log_info "正在导出镜像到 $IMAGE_FILE ..."
    docker save -o "$IMAGE_FILE" "$IMAGE_NAME"
    
    # 检查文件大小和MD5
    if [ -f "$IMAGE_FILE" ]; then
        FILE_SIZE=$(ls -lh "$IMAGE_FILE" | awk '{print $5}')
        FILE_MD5=$(md5sum "$IMAGE_FILE" | awk '{print $1}')
        
        log_info "✅ 镜像导出成功！"
        echo ""
        echo "=================================="
        echo "📦 文件信息:"
        echo "   文件名: $IMAGE_FILE"
        echo "   大小: $FILE_SIZE"
        echo "   MD5: $FILE_MD5"
        echo "=================================="
        echo ""
        log_info "传输方法："
        echo "  1. 宝塔文件管理器："
        echo "     - 进入宝塔面板 → 文件 → 上传文件"
        echo "     - 选择 $IMAGE_FILE 上传到 /root/ 目录"
        echo ""
        echo "  2. SCP传输："
        echo "     scp $IMAGE_FILE root@你的服务器IP:/root/"
        echo ""
        echo "  3. FTP/SFTP工具："
        echo "     - 使用FileZilla、WinSCP等工具"
        echo "     - 上传到服务器 /root/ 目录"
        echo ""
        echo "  4. 网盘中转："
        echo "     - 上传到百度网盘/阿里云盘等"
        echo "     - 在服务器上下载"
        echo ""
        log_info "上传完成后，在服务器运行："
        echo "  bash export-import-image.sh import"
        
        # 创建导入说明文件
        cat > "导入说明.txt" << EOF
ChmlFrp Docker 镜像导入说明
================================

1. 上传文件到服务器
   将 $IMAGE_FILE 上传到服务器的 /root/ 目录

2. 上传脚本到服务器
   将 export-import-image.sh 也上传到服务器

3. 在服务器执行导入
   chmod +x export-import-image.sh
   ./export-import-image.sh import

4. 运行容器
   ./export-import-image.sh run

文件信息:
- 文件名: $IMAGE_FILE
- 大小: $FILE_SIZE
- MD5: $FILE_MD5

如有问题，请运行: ./export-import-image.sh 进入交互模式
EOF
        
        log_info "📄 已生成 '导入说明.txt' 文件"
        
    else
        log_error "导出失败！请检查磁盘空间和权限。"
        exit 1
    fi
}

# 导入镜像函数
import_image() {
    log_step "开始导入Docker镜像..."
    
    # 检查文件是否存在
    if [ ! -f "$IMAGE_FILE" ]; then
        log_error "镜像文件 $IMAGE_FILE 不存在！"
        echo ""
        log_info "请确保文件已上传到当前目录"
        echo "当前目录: $(pwd)"
        echo "当前文件列表:"
        ls -la *.tar 2>/dev/null || echo "  未找到 .tar 文件"
        echo ""
        log_info "如果文件在其他位置，请："
        echo "  1. 移动文件: mv /path/to/$IMAGE_FILE ./"
        echo "  2. 或指定路径: IMAGE_FILE=/path/to/$IMAGE_FILE ./export-import-image.sh import"
        exit 1
    fi
    
    # 显示文件信息
    FILE_SIZE=$(ls -lh "$IMAGE_FILE" | awk '{print $5}')
    FILE_MD5=$(md5sum "$IMAGE_FILE" | awk '{print $1}')
    
    echo ""
    echo "=================================="
    echo "📦 准备导入的文件:"
    echo "   文件名: $IMAGE_FILE"
    echo "   大小: $FILE_SIZE"
    echo "   MD5: $FILE_MD5"
    echo "=================================="
    echo ""
    
    # 确认导入
    read -p "确认导入此镜像文件？(y/N): " -r
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "取消导入"
        exit 0
    fi
    
    # 导入镜像
    log_info "正在从 $IMAGE_FILE 导入镜像..."
    docker load -i "$IMAGE_FILE"
    
    # 验证导入
    if docker images | grep -q "ghcr.io/linluo208/chmlfrp-panel"; then
        log_info "✅ 镜像导入成功！"
        
        # 显示镜像信息
        echo ""
        echo "=================================="
        echo "🐳 镜像信息:"
        docker images | head -n 1
        docker images | grep chmlfrp
        echo "=================================="
        
        echo ""
        log_info "🚀 现在可以运行容器了！"
        echo "  快速启动: ./export-import-image.sh run"
        echo "  或手动启动: docker run -d --name chmlfrp-panel -p 8888:80 $IMAGE_NAME"
        
        # 询问是否立即运行
        echo ""
        read -p "是否立即启动容器？(y/N): " -r
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            run_container
        fi
        
    else
        log_error "导入失败！请检查文件完整性。"
        echo "建议："
        echo "  1. 重新下载镜像文件"
        echo "  2. 检查文件MD5值"
        echo "  3. 检查磁盘空间: df -h"
        exit 1
    fi
}

# 一键运行函数
run_container() {
    log_step "正在启动ChmlFrp管理面板..."
    
    # 检查镜像是否存在
    if ! docker images | grep -q "ghcr.io/linluo208/chmlfrp-panel"; then
        log_error "镜像不存在，请先导入镜像！"
        echo "运行: ./export-import-image.sh import"
        exit 1
    fi
    
    # 检查端口占用
    if netstat -tuln 2>/dev/null | grep -q ":8888 " || ss -tuln 2>/dev/null | grep -q ":8888 "; then
        log_warn "端口 8888 已被占用！"
        read -p "是否使用其他端口？输入端口号 (留空取消): " -r PORT
        if [ -z "$PORT" ]; then
            log_info "取消启动"
            exit 0
        fi
        FRONTEND_PORT="$PORT"
    else
        FRONTEND_PORT="8888"
    fi
    
    # 停止并删除已存在的容器
    if docker ps -a | grep -q "$CONTAINER_NAME"; then
        log_warn "发现已存在的容器，正在停止并删除..."
        docker stop "$CONTAINER_NAME" 2>/dev/null || true
        docker rm "$CONTAINER_NAME" 2>/dev/null || true
    fi
    
    # 创建数据目录
    DATA_DIR="/opt/chmlfrp-data"
    if [ ! -d "$DATA_DIR" ]; then
        log_info "创建数据目录: $DATA_DIR"
        mkdir -p "$DATA_DIR"/{data,configs,logs}
    fi
    
    # 运行新容器
    log_info "正在启动容器..."
    docker run -d \
        --name "$CONTAINER_NAME" \
        --restart unless-stopped \
        -p "$FRONTEND_PORT:80" \
        -p "3001:3001" \
        -p "7000:7000" \
        -p "7400:7400" \
        -p "7500:7500" \
        -v "$DATA_DIR/data:/app/data" \
        -v "$DATA_DIR/configs:/app/configs" \
        -v "$DATA_DIR/logs:/app/logs" \
        -e NODE_ENV=production \
        -e TZ=Asia/Shanghai \
        "$IMAGE_NAME"
    
    # 等待容器启动
    log_info "等待容器启动..."
    sleep 5
    
    # 检查容器状态
    if docker ps | grep -q "$CONTAINER_NAME"; then
        log_info "✅ 容器启动成功！"
        
        # 获取服务器IP
        SERVER_IP=$(curl -s ipinfo.io/ip 2>/dev/null || curl -s ifconfig.me 2>/dev/null || echo "你的服务器IP")
        
        echo ""
        echo "=================================="
        echo "🎉 ChmlFrp 管理面板已启动！"
        echo "=================================="
        echo "🌐 访问地址:"
        echo "   外网访问: http://$SERVER_IP:$FRONTEND_PORT"
        echo "   本地访问: http://localhost:$FRONTEND_PORT"
        echo ""
        echo "🔧 管理命令:"
        echo "   查看日志: docker logs $CONTAINER_NAME"
        echo "   停止服务: docker stop $CONTAINER_NAME"
        echo "   重启服务: docker restart $CONTAINER_NAME"
        echo "   删除容器: docker rm -f $CONTAINER_NAME"
        echo ""
        echo "📁 数据目录: $DATA_DIR"
        echo "=================================="
        
        # 检查健康状态
        log_info "正在检查服务健康状态..."
        sleep 3
        
        if curl -f -s "http://localhost:$FRONTEND_PORT" > /dev/null 2>&1; then
            log_info "✅ 前端服务正常"
        else
            log_warn "⚠️  前端服务可能需要更多时间启动"
        fi
        
        if curl -f -s "http://localhost:3001/api/health" > /dev/null 2>&1; then
            log_info "✅ 后端API服务正常"
        else
            log_warn "⚠️  后端API服务可能需要更多时间启动"
        fi
        
    else
        log_error "容器启动失败！"
        echo ""
        log_info "错误排查："
        echo "  1. 查看容器日志: docker logs $CONTAINER_NAME"
        echo "  2. 检查端口占用: netstat -tuln | grep $FRONTEND_PORT"
        echo "  3. 检查镜像状态: docker images | grep chmlfrp"
        echo "  4. 手动测试: docker run --rm -p $FRONTEND_PORT:80 $IMAGE_NAME"
        exit 1
    fi
}

# 查看状态函数
show_status() {
    log_step "系统状态检查"
    
    echo ""
    echo "=================================="
    echo "🐳 Docker环境"
    echo "=================================="
    docker --version
    echo "Docker服务状态: $(systemctl is-active docker 2>/dev/null || echo "未知")"
    echo ""
    
    echo "=================================="
    echo "📦 镜像状态"
    echo "=================================="
    if docker images | grep -q "chmlfrp-panel"; then
        docker images | head -n 1
        docker images | grep chmlfrp
    else
        echo "未找到ChmlFrp镜像"
    fi
    echo ""
    
    echo "=================================="
    echo "🔄 容器状态"
    echo "=================================="
    if docker ps -a | grep -q "$CONTAINER_NAME"; then
        docker ps -a | head -n 1
        docker ps -a | grep chmlfrp
        
        if docker ps | grep -q "$CONTAINER_NAME"; then
            echo ""
            log_info "容器正在运行中"
            
            # 获取端口信息
            PORTS=$(docker port "$CONTAINER_NAME" 2>/dev/null || echo "端口信息获取失败")
            if [ "$PORTS" != "端口信息获取失败" ]; then
                echo "端口映射:"
                echo "$PORTS" | sed 's/^/  /'
            fi
        else
            echo ""
            log_warn "容器已停止"
        fi
    else
        echo "容器不存在"
    fi
    echo ""
    
    echo "=================================="
    echo "📁 文件状态"
    echo "=================================="
    if [ -f "$IMAGE_FILE" ]; then
        FILE_SIZE=$(ls -lh "$IMAGE_FILE" | awk '{print $5}')
        echo "镜像文件: $IMAGE_FILE ($FILE_SIZE)"
    else
        echo "镜像文件: 不存在"
    fi
    
    # 检查数据目录
    DATA_DIR="/opt/chmlfrp-data"
    if [ -d "$DATA_DIR" ]; then
        DISK_USAGE=$(du -sh "$DATA_DIR" 2>/dev/null | awk '{print $1}')
        echo "数据目录: $DATA_DIR ($DISK_USAGE)"
    else
        echo "数据目录: 不存在"
    fi
    echo ""
    
    # 检查端口占用
    echo "=================================="
    echo "🔌 端口占用情况"
    echo "=================================="
    for port in 8888 3001 7000 7400 7500; do
        if netstat -tuln 2>/dev/null | grep -q ":$port " || ss -tuln 2>/dev/null | grep -q ":$port "; then
            echo "端口 $port: 已占用"
        else
            echo "端口 $port: 空闲"
        fi
    done
}

# 停止服务函数
stop_service() {
    log_step "停止ChmlFrp服务"
    
    if docker ps | grep -q "$CONTAINER_NAME"; then
        log_info "正在停止容器..."
        docker stop "$CONTAINER_NAME"
        log_info "✅ 容器已停止"
    else
        log_warn "容器未运行"
    fi
}

# 删除服务函数
remove_service() {
    log_step "删除ChmlFrp服务"
    
    # 停止容器
    if docker ps | grep -q "$CONTAINER_NAME"; then
        log_info "正在停止容器..."
        docker stop "$CONTAINER_NAME"
    fi
    
    # 删除容器
    if docker ps -a | grep -q "$CONTAINER_NAME"; then
        log_info "正在删除容器..."
        docker rm "$CONTAINER_NAME"
        log_info "✅ 容器已删除"
    else
        log_warn "容器不存在"
    fi
    
    # 询问是否删除镜像
    read -p "是否同时删除镜像？(y/N): " -r
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if docker images | grep -q "ghcr.io/linluo208/chmlfrp-panel"; then
            docker rmi "$IMAGE_NAME"
            log_info "✅ 镜像已删除"
        fi
    fi
    
    # 询问是否删除数据
    read -p "是否删除数据目录？(y/N): " -r
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        DATA_DIR="/opt/chmlfrp-data"
        if [ -d "$DATA_DIR" ]; then
            rm -rf "$DATA_DIR"
            log_info "✅ 数据目录已删除"
        fi
    fi
}

# 更新服务函数
update_service() {
    log_step "更新ChmlFrp服务"
    
    log_info "此功能需要重新导入新版本的镜像文件"
    echo "更新步骤："
    echo "  1. 获取最新的镜像文件"
    echo "  2. 运行: ./export-import-image.sh import"
    echo "  3. 运行: ./export-import-image.sh run"
    echo ""
    
    read -p "如果已有新镜像文件，是否现在更新？(y/N): " -r
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        import_image
        run_container
    fi
}

# 主菜单
show_menu() {
    echo ""
    echo "=================================================="
    echo "🐳 ChmlFrp Docker 镜像管理工具"
    echo "=================================================="
    echo "📦 镜像管理:"
    echo "  1. 构建镜像 (在源码目录运行)"
    echo "  2. 导出镜像 (生成传输文件)"
    echo "  3. 导入镜像 (从文件导入)"
    echo ""
    echo "🚀 服务管理:"
    echo "  4. 运行容器"
    echo "  5. 停止服务"
    echo "  6. 删除服务"
    echo "  7. 更新服务"
    echo ""
    echo "📊 状态查看:"
    echo "  8. 查看状态"
    echo "  9. 查看日志"
    echo ""
    echo "  0. 退出"
    echo "=================================================="
    echo -n "请选择操作 [0-9]: "
}

# 查看日志函数
show_logs() {
    if ! docker ps | grep -q "$CONTAINER_NAME"; then
        log_error "容器未运行！"
        return 1
    fi
    
    echo ""
    echo "=================================="
    echo "📋 容器日志 (按 Ctrl+C 退出)"
    echo "=================================="
    docker logs -f "$CONTAINER_NAME"
}

# 主程序
main() {
    # 检查Docker环境
    check_docker
    
    # 如果有参数，直接执行对应功能
    case "$1" in
        "build")
            build_image
            exit 0
            ;;
        "export")
            export_image
            exit 0
            ;;
        "import")
            import_image
            exit 0
            ;;
        "run")
            run_container
            exit 0
            ;;
        "stop")
            stop_service
            exit 0
            ;;
        "remove")
            remove_service
            exit 0
            ;;
        "status")
            show_status
            exit 0
            ;;
        "logs")
            show_logs
            exit 0
            ;;
        "update")
            update_service
            exit 0
            ;;
        "--help"|"-h")
            echo "ChmlFrp Docker 镜像管理工具"
            echo ""
            echo "用法: $0 [命令]"
            echo ""
            echo "命令:"
            echo "  build   - 构建镜像"
            echo "  export  - 导出镜像文件"
            echo "  import  - 导入镜像文件"
            echo "  run     - 运行容器"
            echo "  stop    - 停止服务"
            echo "  remove  - 删除服务"
            echo "  status  - 查看状态"
            echo "  logs    - 查看日志"
            echo "  update  - 更新服务"
            echo ""
            echo "示例:"
            echo "  $0 export   # 导出镜像"
            echo "  $0 import   # 导入镜像"
            echo "  $0 run      # 运行容器"
            echo ""
            echo "不带参数运行将进入交互模式"
            exit 0
            ;;
    esac
    
    # 交互式菜单
    while true; do
        show_menu
        read -r choice
        
        case $choice in
            1)
                build_image
                ;;
            2)
                export_image
                ;;
            3)
                import_image
                ;;
            4)
                run_container
                ;;
            5)
                stop_service
                ;;
            6)
                remove_service
                ;;
            7)
                update_service
                ;;
            8)
                show_status
                ;;
            9)
                show_logs
                ;;
            0)
                log_info "退出程序"
                break
                ;;
            *)
                log_error "无效选择，请输入 0-9"
                ;;
        esac
        
        echo ""
        echo "按Enter键继续..."
        read -r
    done
}

# 运行主程序
main "$@"
