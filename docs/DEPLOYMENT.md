# 🚀 HG Web 生产环境部署指南

## 目录

- [环境要求](#环境要求)
- [快速部署](#快速部署)
- [详细部署步骤](#详细部署步骤)
- [配置说明](#配置说明)
- [SSL 证书配置](#ssl-证书配置)
- [数据库配置](#数据库配置)
- [PM2 配置](#pm2-配置)
- [Nginx 配置](#nginx-配置)
- [备份与恢复](#备份与恢复)
- [监控与日志](#监控与日志)
- [常见问题](#常见问题)

---

## 环境要求

### 服务器要求

| 项目     | 最低配置                | 推荐配置         |
| -------- | ----------------------- | ---------------- |
| 操作系统 | Ubuntu 20.04 / CentOS 7 | Ubuntu 22.04 LTS |
| CPU      | 1 核                    | 2 核+            |
| 内存     | 1 GB                    | 2 GB+            |
| 硬盘     | 20 GB                   | 50 GB+           |
| 带宽     | 1 Mbps                  | 5 Mbps+          |

### 软件要求

| 软件    | 版本                 |
| ------- | -------------------- |
| Node.js | 18+                  |
| MySQL   | 8.0+ / MariaDB 10.6+ |
| Nginx   | 1.18+                |
| PM2     | 5.0+                 |
| Git     | 2.0+                 |

---

## 快速部署

### 一键部署

```bash
# 1. 克隆代码
git clone https://github.com/mastercwx/web_2.git /var/www/web_2
cd /var/www/web_2

# 2. 运行部署脚本
chmod +x scripts/deploy.sh
./scripts/deploy.sh --full
```

### 仅更新应用

```bash
cd /var/www/web_2
./scripts/deploy.sh --app
```

---

## 详细部署步骤

### 1. 准备服务器

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装基础工具
sudo apt install -y git curl wget build-essential
```

### 2. 安装 Node.js

```bash
# 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -
sudo apt install -y nodejs

# 验证安装
node -v
npm -v

# 安装全局包
sudo npm install -g pm2 npx
```

### 3. 安装 MySQL

```bash
# 安装 MySQL
sudo apt install -y mysql-server

# 启动 MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# 安全配置
sudo mysql_secure_installation
```

#### 创建数据库

```bash
# 登录 MySQL
sudo mysql -u root -p

# 创建数据库和用户
CREATE DATABASE hg_web CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'hg_web'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON hg_web.* TO 'hg_web'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4. 安装 Nginx

```bash
# 安装 Nginx
sudo apt install -y nginx

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 5. 部署应用

```bash
# 克隆代码
sudo git clone https://github.com/mastercwx/web_2.git /var/www/web_2
cd /var/www/web_2

# 设置权限
sudo chown -R $USER:$USER /var/www/web_2

# 安装依赖
npm ci --production=false

# 配置环境变量
cp .env.example .env
nano .env
```

### 6. 配置环境变量

编辑 `.env` 文件：

```env
# 应用配置
NODE_ENV=production
PORT=3000
APP_NAME=HG Web
APP_URL=https://your-domain.com

# 数据库配置
DATABASE_URL=mysql://hg_web:your_password@localhost:3306/hg_web

# JWT 配置
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# Session 配置
SESSION_SECRET=your_session_secret_here

# 文件上传
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# 邮件配置（可选）
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password

# OAuth 配置（可选）
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 7. 初始化数据库

```bash
# 生成 Prisma Client
npx prisma generate

# 同步数据库结构
npx prisma db push

# 填充初始数据
npx prisma db seed
```

### 8. 构建应用

```bash
npm run build
```

### 9. 配置 PM2

```bash
# 启动应用
pm2 start ecosystem.config.cjs --env production

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
```

### 10. 配置 Nginx

创建 Nginx 配置文件：

```bash
sudo nano /etc/nginx/sites-available/hg-web
```

配置内容：

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL 证书
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

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
    }

    # 上传文件
    location /uploads/ {
        alias /var/www/web_2/uploads/;
        expires 30d;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 主应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用站点：

```bash
sudo ln -s /etc/nginx/sites-available/hg-web /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

---

## SSL 证书配置

### 使用 Let's Encrypt

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 设置自动续期
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 手动配置证书

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
}
```

---

## 数据库配置

### 数据库备份

```bash
# 手动备份
mysqldump -u root hg_web > backup_$(date +%Y%m%d).sql

# 自动备份（已配置）
./scripts/deploy.sh --backup
```

### 数据库恢复

```bash
# 恢复数据库
mysql -u root hg_web < backup.sql
```

### 数据库迁移

```bash
# 推送结构变更
npx prisma db push

# 重新生成 Client
npx prisma generate
```

---

## PM2 配置

### 常用命令

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs hg-web

# 监控面板
pm2 monit

# 重启应用
pm2 restart hg-web

# 重载应用（0 秒停机）
pm2 reload hg-web

# 停止应用
pm2 stop hg-web

# 删除应用
pm2 delete hg-web
```

### 集群模式

PM2 已配置为集群模式，会自动使用所有 CPU 核心：

```javascript
{
  instances: 'max',
  exec_mode: 'cluster'
}
```

### 内存限制

当内存超过 1GB 时自动重启：

```javascript
{
  max_memory_restart: '1G'
}
```

---

## Nginx 配置

### 性能优化

```nginx
# worker 进程数
worker_processes auto;

# 连接数
events {
    worker_connections 1024;
}

# 缓冲区
http {
    client_max_body_size 10M;
    client_body_buffer_size 128k;
    proxy_buffer_size 128k;
    proxy_buffers 4 256k;
}
```

### 安全配置

```nginx
# 隐藏版本号
server_tokens off;

# 安全头
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

---

## 备份与恢复

### 自动备份

已配置每日凌晨 2 点自动备份：

- 数据库备份：`/backup/hg-web/db_YYYYMMDD_HHMMSS.sql`
- 文件备份：`/backup/hg-web/uploads_YYYYMMDD_HHMMSS.tar.gz`
- 保留时间：30 天

### 手动备份

```bash
./scripts/deploy.sh --backup
```

### 恢复数据

```bash
# 恢复数据库
mysql -u root hg_web < /backup/hg-web/db_20240101_020000.sql

# 恢复上传文件
tar -xzf /backup/hg-web/uploads_20240101_020000.tar.gz -C /var/www/web_2/
```

---

## 监控与日志

### 查看日志

```bash
# PM2 日志
pm2 logs hg-web

# Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 应用日志
tail -f /var/www/web_2/logs/out.log
tail -f /var/www/web_2/logs/error.log
```

### 监控面板

```bash
# PM2 监控
pm2 monit

# 系统监控
htop
```

### 健康检查

```bash
# 检查应用状态
curl http://localhost:3000/api/health

# 检查 Nginx 状态
sudo systemctl status nginx

# 检查 MySQL 状态
sudo systemctl status mysql
```

---

## 常见问题

### 1. 应用无法启动

```bash
# 查看错误日志
pm2 logs hg-web --err

# 检查端口占用
lsof -i :3000

# 重启应用
pm2 restart hg-web
```

### 2. 数据库连接失败

```bash
# 检查 MySQL 状态
sudo systemctl status mysql

# 测试连接
mysql -u hg_web -p hg_web

# 检查 .env 配置
cat .env | grep DATABASE_URL
```

### 3. Nginx 502 错误

```bash
# 检查应用是否运行
pm2 status

# 检查 Nginx 配置
sudo nginx -t

# 查看错误日志
sudo tail -f /var/log/nginx/error.log
```

### 4. 权限问题

```bash
# 修复权限
sudo chown -R www-data:www-data /var/www/web_2
sudo chmod -R 755 /var/www/web_2
```

### 5. SSL 证书问题

```bash
# 检查证书状态
sudo certbot certificates

# 手动续期
sudo certbot renew

# 测试续期
sudo certbot renew --dry-run
```

---

## 更新应用

### 使用部署脚本

```bash
cd /var/www/web_2
./scripts/deploy.sh --app
```

### 手动更新

```bash
cd /var/www/web_2

# 拉取最新代码
git pull origin master

# 安装依赖
npm ci --production=false

# 更新数据库
npx prisma generate
npx prisma db push

# 重新构建
npm run build

# 重启应用
pm2 reload hg-web
```

---

## 性能优化

### 1. 启用缓存

```nginx
# Nginx 缓存
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=10g inactive=60m;
```

### 2. 优化数据库

```sql
-- 添加索引
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_comments_post_id ON comments(post_id);
```

### 3. 启用 CDN

在 `.env` 中配置：

```env
CDN_URL=https://cdn.your-domain.com
```

---

## 安全建议

1. **定期更新系统**

   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **配置防火墙**

   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

3. **使用强密码**
   - 数据库密码
   - JWT 密钥
   - Session 密钥

4. **定期备份**
   - 已配置自动备份
   - 定期检查备份文件

5. **监控日志**
   - 定期检查错误日志
   - 监控异常访问

---

## 联系支持

如有问题，请通过以下方式联系：

- GitHub Issues: https://github.com/mastercwx/web_2/issues
- 邮箱: support@example.com

---

**最后更新**: 2024-01-01
