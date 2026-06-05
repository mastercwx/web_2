#!/bin/bash

# ===========================================
# HG Web 生产环境部署脚本
# 使用方法: ./scripts/deploy.sh [选项]
# ===========================================

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 配置变量
APP_NAME="hg-web"
APP_DIR="/var/www/web_2"
LOG_DIR="${APP_DIR}/logs"
BACKUP_DIR="/backup/${APP_NAME}"

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

# 显示帮助信息
show_help() {
  echo "HG Web 部署脚本"
  echo ""
  echo "使用方法: ./scripts/deploy.sh [选项]"
  echo ""
  echo "选项:"
  echo "  --full          完整部署（包括系统依赖）"
  echo "  --app           仅部署应用"
  echo "  --db            仅更新数据库"
  echo "  --nginx         仅配置 Nginx"
  echo "  --ssl           仅安装 SSL 证书"
  echo "  --backup        仅运行备份"
  echo "  --monitor       显示监控面板"
  echo "  --help          显示此帮助信息"
  echo ""
  echo "示例:"
  echo "  ./scripts/deploy.sh --full    # 完整部署"
  echo "  ./scripts/deploy.sh --app     # 仅更新应用"
  echo "  ./scripts/deploy.sh --monitor # 查看监控"
  echo ""
}

# 检查是否为 root 用户
check_root() {
  if [ "$EUID" -ne 0 ]; then
    print_error "请使用 root 用户运行此脚本"
    exit 1
  fi
}

# 检查 Node.js 版本
check_node() {
  print_header "检查 Node.js"

  if ! command -v node &> /dev/null; then
    print_error "Node.js 未安装"
    print_info "正在安装 Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
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
  print_header "检查 PM2"

  if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 未安装，正在安装..."
    npm install -g pm2
  fi

  print_success "PM2 已就绪: $(pm2 -v)"
}

# 安装系统依赖
install_system_deps() {
  print_header "安装系统依赖"

  apt update
  apt install -y \
    git \
    curl \
    wget \
    build-essential \
    nginx \
    mysql-server \
    certbot \
    python3-certbot-nginx \
    logrotate \
    cron

  print_success "系统依赖安装完成"
}

# 配置防火墙
setup_firewall() {
  print_header "配置防火墙"

  if command -v ufw &> /dev/null; then
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
    print_success "防火墙配置完成"
  else
    print_warning "UFW 未安装，跳过防火墙配置"
  fi
}

# 创建应用目录
create_app_directory() {
  print_header "创建应用目录"

  mkdir -p ${APP_DIR}
  mkdir -p ${LOG_DIR}
  mkdir -p ${APP_DIR}/uploads
  mkdir -p ${BACKUP_DIR}

  # 设置权限
  chown -R www-data:www-data ${APP_DIR}
  chmod -R 755 ${APP_DIR}

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
    git pull origin master
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
    print_warning "请编辑 .env 文件配置数据库等信息"
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

# 填充初始数据
seed_database() {
  print_header "填充初始数据"

  cd ${APP_DIR}
  npx prisma db seed
  print_success "初始数据填充完成"
}

# 配置 Nginx
setup_nginx() {
  print_header "配置 Nginx"

  # 获取域名
  read -p "请输入域名 (例: example.com): " DOMAIN

  if [ -z "$DOMAIN" ]; then
    DOMAIN="localhost"
    print_warning "未输入域名，使用 localhost"
  fi

  # 创建 Nginx 配置
  cat > /etc/nginx/sites-available/${APP_NAME} <<EOF
# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    return 301 https://\$server_name\$request_uri;
}

# HTTPS 配置
server {
    listen 443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};

    # SSL 证书（Certbot 会自动配置）
    # ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/json application/xml;

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
        add_header Cache-Control "public";
    }

    # WebSocket 支持
    location /ws/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    # API 和主应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
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

# 安装 SSL 证书
install_ssl() {
  print_header "安装 SSL 证书"

  read -p "请输入域名 (例: example.com): " DOMAIN

  if [ -z "$DOMAIN" ]; then
    print_error "请输入域名"
    exit 1
  fi

  # 获取证书
  certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos --email admin@${DOMAIN}

  # 设置自动续期
  (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

  print_success "SSL 证书安装完成"
  print_info "证书将自动续期"
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

# 配置日志轮转
setup_logrotate() {
  print_header "配置日志轮转"

  cat > /etc/logrotate.d/${APP_NAME} <<EOF
${LOG_DIR}/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reload ${APP_NAME}
    endscript
}
EOF

  print_success "日志轮转配置完成"
}

# 配置备份
setup_backup() {
  print_header "配置备份"

  # 创建备份脚本
  cat > /usr/local/bin/backup-${APP_NAME}.sh <<EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)

# 备份数据库
mysqldump -u root ${APP_NAME} > ${BACKUP_DIR}/db_\${DATE}.sql

# 备份上传文件
tar -czf ${BACKUP_DIR}/uploads_\${DATE}.tar.gz ${APP_DIR}/uploads

# 删除 30 天前的备份
find ${BACKUP_DIR} -name "*.sql" -mtime +30 -delete
find ${BACKUP_DIR} -name "*.tar.gz" -mtime +30 -delete

echo "备份完成: \${DATE}"
EOF

  chmod +x /usr/local/bin/backup-${APP_NAME}.sh

  # 设置定时备份（每天凌晨 2 点）
  (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-${APP_NAME}.sh") | crontab -

  print_success "备份配置完成"
}

# 运行备份
run_backup() {
  print_header "运行备份"

  if [ -f "/usr/local/bin/backup-${APP_NAME}.sh" ]; then
    /usr/local/bin/backup-${APP_NAME}.sh
    print_success "备份完成"
  else
    print_error "备份脚本不存在，请先运行完整部署"
  fi
}

# 显示监控面板
show_monitor() {
  print_header "监控面板"

  pm2 monit
}

# 显示状态
show_status() {
  print_header "部署状态"

  echo -e "${GREEN}部署信息:${NC}"
  echo -e "  应用名称: ${APP_NAME}"
  echo -e "  应用目录: ${APP_DIR}"
  echo -e "  日志目录: ${LOG_DIR}"
  echo -e "  备份目录: ${BACKUP_DIR}"
  echo ""

  pm2 status
  echo ""

  echo -e "${YELLOW}常用命令:${NC}"
  echo -e "  pm2 status              # 查看状态"
  echo -e "  pm2 logs ${APP_NAME}    # 查看日志"
  echo -e "  pm2 monit               # 监控面板"
  echo -e "  pm2 restart ${APP_NAME} # 重启应用"
  echo -e "  pm2 stop ${APP_NAME}    # 停止应用"
  echo -e "  pm2 reload ${APP_NAME}  # 重载应用"
  echo ""
}

# 完整部署
full_deploy() {
  print_header "开始完整部署 HG Web"

  check_root
  install_system_deps
  setup_firewall
  check_node
  check_pm2
  create_app_directory
  clone_or_update_code
  install_deps
  setup_environment
  generate_prisma
  build_project
  sync_database
  seed_database
  setup_nginx
  install_ssl
  start_pm2
  setup_logrotate
  setup_backup
  show_status

  print_header "🎉 部署完成！"
  echo -e "${GREEN}请访问你的网站验证部署${NC}"
  echo ""
}

# 仅部署应用
app_deploy() {
  print_header "更新应用"

  check_node
  check_pm2
  clone_or_update_code
  install_deps
  generate_prisma
  build_project
  sync_database
  start_pm2
  show_status

  print_header "🎉 应用更新完成！"
}

# 仅更新数据库
db_update() {
  print_header "更新数据库"

  cd ${APP_DIR}
  generate_prisma
  sync_database
  seed_database

  print_success "数据库更新完成"
}

# 主函数
main() {
  case "${1}" in
    --full)
      full_deploy
      ;;
    --app)
      app_deploy
      ;;
    --db)
      db_update
      ;;
    --nginx)
      check_root
      setup_nginx
      ;;
    --ssl)
      check_root
      install_ssl
      ;;
    --backup)
      run_backup
      ;;
    --monitor)
      show_monitor
      ;;
    --help)
      show_help
      ;;
    *)
      show_help
      ;;
  esac
}

# 执行主函数
main "$@"
