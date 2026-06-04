#!/bin/bash

# HG Web 部署脚本
# 使用方法: ./scripts/deploy.sh

set -e

echo "🚀 开始部署 HG Web..."

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

# 检查 Node.js 版本
check_node() {
  if ! command -v node &> /dev/null; then
    print_error "Node.js 未安装"
    exit 1
  fi

  NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
  if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js 版本需要 >= 18，当前版本: $(node -v)"
    exit 1
  fi

  print_success "Node.js 版本检查通过: $(node -v)"
}

# 检查 PM2
check_pm2() {
  if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 未安装，正在安装..."
    npm install -g pm2
  fi

  print_success "PM2 已就绪: $(pm2 -v)"
}

# 安装依赖
install_deps() {
  print_warning "正在安装依赖..."
  npm ci --production=false
  print_success "依赖安装完成"
}

# 生成 Prisma Client
generate_prisma() {
  print_warning "正在生成 Prisma Client..."
  npm run db:generate
  print_success "Prisma Client 生成完成"
}

# 构建项目
build_project() {
  print_warning "正在构建项目..."
  npm run build
  print_success "项目构建完成"
}

# 同步数据库
sync_database() {
  print_warning "正在同步数据库..."
  npm run db:push
  print_success "数据库同步完成"
}

# 启动 PM2
start_pm2() {
  print_warning "正在启动 PM2..."

  # 检查是否已有进程
  if pm2 list | grep -q "hg-web"; then
    print_warning "发现已有 hg-web 进程，正在重载..."
    npm run pm2:reload
  else
    npm run pm2:start
  fi

  print_success "PM2 启动完成"
}

# 保存 PM2 进程列表
save_pm2() {
  pm2 save
  print_success "PM2 进程列表已保存"
}

# 显示状态
show_status() {
  echo ""
  echo "=========================================="
  echo "🎉 部署完成！"
  echo "=========================================="
  echo ""
  pm2 status
  echo ""
  echo "常用命令："
  echo "  npm run pm2:status  # 查看状态"
  echo "  npm run pm2:logs    # 查看日志"
  echo "  npm run pm2:monit   # 监控面板"
  echo "  npm run pm2:restart # 重启应用"
  echo "  npm run pm2:stop    # 停止应用"
  echo ""
}

# 主流程
main() {
  echo "=========================================="
  echo "  HG Web 部署脚本"
  echo "=========================================="
  echo ""

  check_node
  check_pm2
  install_deps
  generate_prisma
  build_project
  sync_database
  start_pm2
  save_pm2
  show_status
}

# 执行主流程
main
