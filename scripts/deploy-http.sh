#!/bin/bash

# ===========================================
# HG Web HTTP 部署脚本（无 SSL）
# 使用方法: ./scripts/deploy-http.sh
# ===========================================

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 配置变量
APP_NAME="hg-web"
APP_DIR="/var/www/web_2"
LOG_DIR="${APP_DIR}/logs"

# 打印函数
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ $1${NC}"
}

print_header() {
  echo ""
  echo -e "${CYAN}==========================================${NC}"
  echo -e "${CYAN}  $1${NC}"
  echo -e "${CYAN}==========================================${NC}"
  echo ""
}

# 检查是否为 root 用户
check_root() {
  if [ "$EUID" -ne 0 ]; then
    print_error "请使用 root 用户运行此脚本"
    exit 1
  fi
}

# 安装 Nginx
install_nginx() {
  print_header "安装 Nginx"

  if command -v nginx &> /dev/null; then
    print_info "Nginx 已安装"
  else
    apt update
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
    print_success "Nginx 安装完成"
  fi
}

# 创建应用目录
create_app_directory() {
  print_header "创建应用目录"

  mkdir -p ${APP_DIR}
  mkdir -p ${LOG_DIR}
  mkdir -p ${APP_DIR}/uploads

  print_success "应用目录创建完成"
}

# 克隆或更新代码
clone_or_update_code() {
  print_header "克隆/更新代码"

  if [ -d "${APP_DIR}/.git" ]; then
    print_info "代码已存在，拉取最新版本..."
    cd ${APP_DIR}
    git fetch origin
    git reset --hard origin/master
  else
    print_info "克隆代码..."
    git clone https://github.com/mastercwx/web_2.git ${APP_DIR}
    cd ${APP_DIR}
  fi

  print_success "代码更新完成"
}

# 安装依赖
install_deps() {
  print_header "安装依赖"

  cd ${APP_DIR}
  npm ci --production=false
  print_success "依赖安装完成"
}

# 配置环境变量
setup_environment() {
  print_header "配置环境变量"

  cd ${APP_DIR}

  if [ ! -f ".env" ]; then
    cp .env.example .env

    # 生成随机密钥
    JWT_SECRET=$(openssl rand -hex 32)
    SESSION_SECRET=$(openssl rand -hex 32)

    sed -i "s/JWT_SECRET=.*/JWT_SECRET=${JWT_SECRET}/" .env
    sed -i "s/SESSION_SECRET=.*/SESSION_SECRET=${SESSION_SECRET}/" .env

    print_success "环境变量配置完成"
    print_warning "请编辑 /var/www/web_2/.env 文件配置数据库信息"
  else
    print_info "环境变量已存在，跳过配置"
  fi
}

# 生成 Prisma Client
generate_prisma() {
  print_header "生成 Prisma Client"

  cd ${APP_DIR}
  npx prisma generate
  print_success "Prisma Client 生成完成"
}

# 构建项目
build_project() {
  print_header "构建项目"

  cd ${APP_DIR}
  npm run build
  print_success "项目构建完成"
}

# 同步数据库
sync_database() {
  print_header "同步数据库"

  cd ${APP_DIR}
  npx prisma db push
  print_success "数据库同步完成"
}

# 启动 PM2
start_pm2() {
  print_header "启动 PM2"

  cd ${APP_DIR}

  # 检查是否已有进程
  if pm2 list | grep -q "${APP_NAME}"; then
    print_info "发现已有 ${APP_NAME} 进程，正在重载..."
    pm2 reload ecosystem.config.cjs --env production
  else
    pm2 start ecosystem.config.cjs --env production
  fi

  # 保存 PM2 配置
  pm2 save

  # 设置开机自启
  pm2 startup

  print_success "PM2 启动完成"
}

# 配置 Nginx（HTTP）
setup_nginx_http() {
  print_header "配置 Nginx（HTTP）"

  # 获取服务器 IP
  SERVER_IP=$(hostname -I | awk '{print $1}')

  # 创建 Nginx 配置
  cat > /etc/nginx/sites-available/${APP_NAME} <<EOF
server {
    listen 80;
    server_name ${SERVER_IP};

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json;

    # 静态文件缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff2|woff|ttf|svg)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        root ${APP_DIR}/public;
    }

    # 上传文件
    location /uploads/ {
        alias ${APP_DIR}/uploads/;
        expires 30d;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    # 主应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # 错误页面
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
EOF

  # 启用站点
  ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/
  rm -f /etc/nginx/sites-enabled/default

  # 测试配置
  nginx -t

  # 重启 Nginx
  systemctl restart nginx

  print_success "Nginx 配置完成"
}

# 显示部署信息
show_deployment_info() {
  print_header "🎉 部署完成！"

  SERVER_IP=$(hostname -I | awk '{print $1}')

  echo -e "${GREEN}访问地址:${NC}"
  echo -e "  🌐 网站: http://${SERVER_IP}"
  echo -e "  🔧 管理后台: http://${SERVER_IP}/admin"
  echo ""
  echo -e "${YELLOW}默认管理员账号:${NC}"
  echo -e"  用户名: admin"
  echo -e "  密码: admin123"
  echo ""
  echo -e "${RED}⚠️ 请立即修改默认密码！${NC}"
  echo ""
  echo -e "${BLUE}常用命令:${NC}"
  echo -e "  pm2 status              # 查看状态"
  echo -e "  pm2 logs ${APP_NAME}    # 查看日志"
  echo -e "  pm2 monit               # 监控面板"
  echo -e "  pm2 restart ${APP_NAME} # 重启应用"
  echo ""
  echo -e "${CYN}后续步骤:${NC}"
  echo -e "  1. 访问 http://${SERVER_IP} 验证部署"
  echo -e "  2. 编辑 /var/www/web_2/.env 配置数据库"
  echo -e "  3. 配置域名和 SSL 证书（可选）"
  echo ""
}

# 主函数
main() {
  print_header "开始部署 HG Web（HTTP 模式）"

  check_root
  install_nginx
  create_app_directory
  clone_or_update_code
  install_deps
  setup_environment
  generate_prisma
  build_project
  sync_database
  start_pm2
  setup_nginx_http
  show_deployment_info
}

# 运行主函数
main
