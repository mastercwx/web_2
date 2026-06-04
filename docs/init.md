# 项目初始化记录

## 1. Git 仓库初始化

**日期**: 2026-06-04

### 分支策略

| 分支        | 用途               |
| ----------- | ------------------ |
| `master`    | 主分支（生产环境） |
| `develop`   | 开发分支           |
| `feature/*` | 功能分支           |
| `hotfix/*`  | 热修复分支         |

### 工作流程

```
开发功能:
  develop → git checkout -b feature/xxx → 开发 → 自审 → merge 回 develop

发布版本:
  develop → 自审 → merge 到 master → git tag vx.x.x

紧急修复:
  master → git checkout -b hotfix/xxx → 修复 → merge 到 master + develop
```

### Commit 规范

采用 Conventional Commits：

| 类型       | 用途   |
| ---------- | ------ |
| `feat`     | 新功能 |
| `fix`      | 修复   |
| `docs`     | 文档   |
| `style`    | 格式   |
| `refactor` | 重构   |
| `perf`     | 性能   |
| `test`     | 测试   |
| `build`    | 构建   |
| `ci`       | CI     |
| `chore`    | 杂项   |
| `revert`   | 回退   |
| `merge`    | 合并   |

Scope 枚举: `auth`, `user`, `common`, `config`, `deps`, `init`, `ui`, `api`, `test`, `build`

---

## 2. Nuxt 3 项目初始化

**日期**: 2026-06-04

### 技术栈

- Nuxt 3.16.2
- Vue 3.5.35
- TypeScript 5.8.3
- Pinia 3.0.2
- Tailwind CSS 6.13.2

### 工程化配置

| 工具        | 用途       | 命令                                |
| ----------- | ---------- | ----------------------------------- |
| ESLint      | 代码检查   | `npm run lint` / `npm run lint:fix` |
| Prettier    | 代码格式化 | `npm run format`                    |
| TypeScript  | 类型检查   | `npm run typecheck`                 |
| Vitest      | 单元测试   | `npm run test`                      |
| commitlint  | 提交规范   | 自动触发（husky）                   |
| lint-staged | 提交时检查 | 自动触发（husky）                   |

### 项目结构

```
web_2/
├── assets/css/          # 样式资源
├── components/          # 组件
├── composables/         # 组合式函数
├── layouts/             # 布局
├── pages/               # 页面
├── server/api/          # 服务端 API
├── stores/              # Pinia 状态
├── tests/               # 测试
├── types/               # 类型定义
├── utils/               # 工具函数
├── public/              # 静态资源
├── prisma/              # 数据库 (待配置)
└── ...
```

### 验证结果

- ✓ ESLint 检查通过
- ✓ TypeScript 类型检查通过
- ✓ 单元测试通过（7/7）
- ✓ 生产构建成功

---

## 3. MySQL 数据库配置

**日期**: 2026-06-04

### 数据库信息

| 项目   | 值               |
| ------ | ---------------- |
| 主机   | `localhost`      |
| 端口   | `3306`           |
| 数据库 | `hg_web`         |
| 用户名 | `hg_user`        |
| 密码   | `Hg@2026!Secure` |
| 字符集 | `utf8mb4`        |
| 版本   | MySQL 8.0.45     |

### 连接字符串

```
DATABASE_URL="mysql://hg_user:Hg@2026!Secure@localhost:3306/hg_web"
```

### 验证结果

- ✓ MySQL 8.0.45 已安装并启动
- ✓ 数据库 `hg_web` 已创建
- ✓ 用户 `hg_user` 已创建并授权
- ✓ 连接测试通过

---

## 4. 待办事项

- [ ] 安装 Prisma ORM
- [ ] 配置 `.env` 文件
- [ ] 创建初始数据模型（用户表等）
- [ ] 配置 Prisma Client 单例

---

## 5. Git 提交历史

```
* chore: 合并 feature/init-nuxt 分支
|\
| * feat(init): 初始化 Nuxt 3 项目
|/
* chore: 初始化项目
```
