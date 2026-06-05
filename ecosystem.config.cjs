/**
 * PM2 配置文件
 * 文档: https://pm2.keymetrics.io/docs/usage/application-declaration/
 */
module.exports = {
  apps: [
    {
      name: 'hg-web',
      script: '.output/server/index.mjs',
      cwd: __dirname,

      // 实例配置
      instances: 'max', // 使用所有 CPU 核心
      exec_mode: 'cluster', // 集群模式

      // 环境变量
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // 日志配置
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      log_type: 'json',

      // 重启配置
      autorestart: true,
      watch: false, // 生产环境不监听文件变化
      max_memory_restart: '1G',

      // 优雅关闭
      kill_timeout: 5000,
      listen_timeout: 10000,
      shutdown_with_message: true,

      // 健康检查
      health_check: {
        enabled: true,
        url: 'http://localhost:3000/api/health',
        interval: 30000,
        timeout: 5000,
        max_restarts: 3,
      },
    },
  ],
}
