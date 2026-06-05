#!/bin/bash

# HG Web 开发环境启动脚本
# 使用方法: ./scripts/start-dev.sh

set -e

echo "🚀 启动 HG Web 开发环境..."

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

# 检查 MySQL 服务
check_mysql() {
  if ! mysqladmin ping -h localhost -u root --silent 2>/dev/null; then
    print_warning "MySQL 服务未运行，正在启动..."
    service mysql start
  fi
  print_success "MySQL 服务已就绪"
}

# 检查数据库连接
check_database() {
  if mysql -u hg_user -p'Hg@2026!Secure' -e "USE hg_web" 2>/dev/null; then
    print_success "数据库连接正常"
  else
    print_warning "数据库连接失败，请检查配置"
    exit 1
  fi
}

# 启动开发服务器
start_dev() {
  print_warning "正在启动开发服务器..."
  npm run dev
}

# 主流程
main() {
  check_mysql
  check_database
  start_dev
}

main
