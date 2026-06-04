# 项目初始化记录

## 1. Git 仓库初始化

**日期**: 2026-06-04

### 1.1 分支策略

| 分支        | 用途               |
| ----------- | ------------------ |
| `master`    | 主分支（生产环境） |
| `develop`   | 开发分支           |
| `feature/*` | 功能分支           |
| `hotfix/*`  | 热修复分支         |

### 1.2 工作流程

**开发功能**:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/xxx
# 开发完成后
git add .
git commit -m "feat: xxx"
git checkout develop
git merge feature/xxx
```

**发布版本**:

```bash
git checkout master
git merge develop
git tag v1.x.x
git push origin master
```

**紧急修复**:

```bash
git checkout master
git checkout -b hotfix/xxx
# 修复后
git checkout master
git merge hotfix/xxx
git checkout develop
git merge hotfix/xxx
```

### 1.3 Commit 规范

采用 Conventional Commits：

| 类型       | 用途               | 示例                         |
| ---------- | ------------------ | ---------------------------- |
| `feat`     | 新功能             | `feat: 添加用户登录功能`     |
| `fix`      | 修复 bug           | `fix: 修复登录token过期问题` |
| `docs`     | 文档               | `docs: 更新API文档`          |
| `style`    | 格式（不影响逻辑） | `style: 格式化代码`          |
| `refactor` | 重构               | `refactor: 重构认证模块`     |
| `perf`     | 性能优化           | `perf: 优化数据库查询`       |
| `test`     | 测试               | `test: 添加用户模块单元测试` |
| `build`    | 构建               | `build: 升级vue到3.5`        |
| `ci`       | CI                 | `ci: 添加GitHub Actions`     |
| `chore`    | 杂项               | `chore: 升级依赖`            |
| `revert`   | 回退               | `revert: 回退上次提交`       |
| `merge`    | 合并               | `merge: 合并feature分支`     |

Scope 枚举: `auth`, `user`, `common`, `config`, `deps`, `init`, `ui`, `api`, `test`, `build`

### 1.4 Git Hooks

**husky 配置**:

- `pre-commit`: 运行 lint-staged（ESLint + Prettier）
- `commit-msg`: 运行 commitlint 验证提交信息

**lint-staged 配置**:

```json
{
  "*.{js,ts,vue}": ["eslint --fix", "prettier --write"],
  "*.{css,scss,less,json,md}": ["prettier --write"]
}
```

---

## 2. Nuxt 3 项目初始化

**日期**: 2026-06-04

### 2.1 技术栈

| 技术         | 版本   | 用途           |
| ------------ | ------ | -------------- |
| Nuxt         | 3.16.2 | Vue 3 全栈框架 |
| Vue          | 3.5.35 | 前端框架       |
| TypeScript   | 5.8.3  | 类型安全       |
| Pinia        | 3.0.2  | 状态管理       |
| Tailwind CSS | 6.13.2 | 样式框架       |
| ESLint       | 9.39.4 | 代码检查       |
| Prettier     | 3.5.3  | 代码格式化     |
| Vitest       | 3.2.6  | 单元测试       |

### 2.2 项目结构

```
web_2/
├── assets/
│   └── css/
│       └── main.css           # Tailwind 入口文件
├── components/
│   └── FeatureCard.vue        # 示例组件
├── composables/
│   └── useApi.ts              # API 请求封装
├── layouts/
│   └── default.vue            # 默认布局
├── pages/
│   ├── index.vue              # 首页
│   └── about.vue              # 关于页
├── server/
│   └── api/
│       └── health.get.ts      # 健康检查接口
├── stores/
│   └── counter.ts             # 示例 Store
├── tests/
│   └── utils/
│       └── format.test.ts     # 工具函数测试
├── types/
│   └── common.ts              # 通用类型定义
├── utils/
│   └── format.ts              # 格式化工具函数
├── public/
│   └── favicon.ico            # 网站图标
├── prisma/                    # 数据库（待配置）
├── .husky/                    # Git Hooks
├── nuxt.config.ts             # Nuxt 配置
├── tsconfig.json              # TypeScript 配置
├── eslint.config.js           # ESLint 配置
├── .prettierrc                # Prettier 配置
├── commitlint.config.js       # commitlint 配置
├── tailwind.config.js         # Tailwind 配置
├── vitest.config.ts           # Vitest 配置
├── .lintstagedrc              # lint-staged 配置
├── .env.example               # 环境变量示例
└── package.json
```

### 2.3 配置文件说明

**nuxt.config.ts**:

- 启用 TypeScript 严格模式
- 集成 Pinia 状态管理
- 集成 Tailwind CSS
- 配置运行时环境变量

**tsconfig.json**:

- 继承 Nuxt 生成的配置
- 启用严格类型检查
- 排除 node_modules、dist、coverage 目录

**eslint.config.js**:

- 使用 Nuxt 官方 ESLint 配置
- 配置 Vue 和 TypeScript 规则
- 配置代码风格规则

**.prettierrc**:

- 不使用分号
- 使用单引号
- 2 空格缩进
- 100 字符行宽

### 2.4 遇到的问题及解决

**问题 1: ESLint 配置错误**

```
TypeError: Key "rules": Key "@typescript-eslint/prefer-const": Could not find "prefer-const" in plugin "@typescript-eslint"
```

**解决**: 移除 `@typescript-eslint/prefer-const`，使用 `prefer-const`

**问题 2: TypeScript 类型检查失败**

```
error TS2304: Cannot find name 'useRuntimeConfig'
```

**解决**: 从 tsconfig.json 的 exclude 中移除 `.nuxt` 目录

**问题 3: Vue TSC 缺失**

```
Error: Cannot find module 'vue-tsc/package.json'
```

**解决**: 安装 `vue-tsc` 依赖

**问题 4: 测试依赖缺失**

```
Error: Cannot find package '@nuxt/test-utils'
Error: Cannot find package 'happy-dom'
Error: Could not resolve "@vue/test-utils"
```

**解决**: 安装 `@nuxt/test-utils`、`happy-dom`、`@vue/test-utils`

### 2.5 验证结果

- ✓ ESLint 检查通过
- ✓ Prettier 格式化通过
- ✓ TypeScript 类型检查通过
- ✓ 单元测试通过（7/7）
- ✓ 生产构建成功

---

## 3. MySQL 数据库配置

**日期**: 2026-06-04

### 3.1 安装 MySQL

**系统环境**: Ubuntu 24.04.4 LTS

**安装命令**:

```bash
apt-get update
apt-get install -y mysql-server
```

**遇到的问题**:

```
dpkg: dependency problems prevent configuration of mysql-server:
 mysql-server depends on mysql-server-8.0; however:
  Package mysql-server-8.0 is not configured yet.
```

**问题原因**: MySQL 数据目录初始化失败，无法创建临时文件

**解决步骤**:

```bash
# 1. 清理数据目录
rm -rf /var/lib/mysql/*

# 2. 创建临时目录并设置权限
mkdir -p /tmp/mysql_tmp
chmod 777 /tmp/mysql_tmp

# 3. 初始化 MySQL（使用自定义临时目录）
TMPDIR=/tmp/mysql_tmp mysqld --initialize-insecure --user=mysql --datadir=/var/lib/mysql

# 4. 启动 MySQL 服务
service mysql start
```

### 3.2 创建数据库和用户

**SQL 命令**:

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS hg_web
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- 创建用户
CREATE USER IF NOT EXISTS 'hg_user'@'localhost'
IDENTIFIED BY 'Hg@2026!Secure';

-- 授权
GRANT ALL PRIVILEGES ON hg_web.* TO 'hg_user'@'localhost';

-- 刷新权限
FLUSH PRIVILEGES;
```

### 3.3 数据库信息

| 项目     | 值                   |
| -------- | -------------------- |
| 主机     | `localhost`          |
| 端口     | `3306`               |
| 数据库   | `hg_web`             |
| 用户名   | `hg_user`            |
| 密码     | `Hg@2026!Secure`     |
| 字符集   | `utf8mb4`            |
| 排序规则 | `utf8mb4_unicode_ci` |
| 版本     | MySQL 8.0.45         |

### 3.4 连接字符串

```
DATABASE_URL="mysql://hg_user:Hg@2026!Secure@localhost:3306/hg_web"
```

### 3.5 验证结果

```bash
# 测试连接
mysql -u hg_user -p'Hg@2026!Secure' -e "SELECT VERSION();"

# 结果
+---------------------------+
| VERSION()                 |
+---------------------------+
| 8.0.45-0ubuntu0.24.04.1  |
+---------------------------+
```

- ✓ MySQL 8.0.45 已安装并启动
- ✓ 数据库 `hg_web` 已创建（utf8mb4 字符集）
- ✓ 用户 `hg_user` 已创建并授权
- ✓ 连接测试通过

---

## 4. Git 提交历史

```
* docs(init): 添加项目初始化记录
* chore: 合并 feature/init-nuxt 分支
|\
| * feat(init): 初始化 Nuxt 3 项目
|/
* chore: 初始化项目
```

---

## 5. 待办事项

- [ ] 安装 Prisma ORM
- [ ] 配置 `.env` 文件
- [ ] 创建初始数据模型（用户表等）
- [ ] 配置 Prisma Client 单例
- [ ] 编写数据库迁移脚本
- [ ] 创建种子数据

---

## 6. 常用命令

```bash
# 开发
npm run dev              # 启动开发服务器
npm run build            # 构建生产版本
npm run preview          # 预览生产版本

# 代码质量
npm run lint             # ESLint 检查
npm run lint:fix         # ESLint 自动修复
npm run format           # Prettier 格式化
npm run format:check     # Prettier 检查
npm run typecheck        # TypeScript 类型检查

# 测试
npm run test             # 运行测试
npm run test:watch       # 监听模式运行测试

# 数据库（待配置）
npx prisma generate      # 生成 Prisma Client
npx prisma migrate dev   # 运行迁移
npx prisma db push       # 推送 schema 到数据库
npx prisma studio        # 打开 Prisma Studio
npx prisma db seed       # 运行种子数据
```
