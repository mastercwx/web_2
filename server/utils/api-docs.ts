/**
 * API 文档工具函数
 * 提供 API 端点文档生成和管理功能
 */

export interface ApiEndpoint {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  summary: string
  description: string
  tags: string[]
  parameters?: ApiParameter[]
  requestBody?: ApiRequestBody
  responses: ApiResponse[]
  authentication: boolean
  rateLimit?: string
}

export interface ApiParameter {
  name: string
  in: 'query' | 'path' | 'header'
  required: boolean
  type: string
  description: string
  example?: string | number | boolean
}

export interface ApiRequestBody {
  contentType: string
  schema: Record<string, unknown>
  example: Record<string, unknown>
}

export interface ApiResponse {
  status: number
  description: string
  schema?: Record<string, unknown>
  example?: Record<string, unknown>
}

export interface ApiTag {
  name: string
  description: string
  endpoints: ApiEndpoint[]
}

export interface ApiDocsConfig {
  title: string
  version: string
  description: string
  baseUrl: string
  contact: {
    name: string
    email: string
  }
}

/**
 * 获取 API 文档配置
 */
export function getApiDocsConfig(): ApiDocsConfig {
  return {
    title: 'Self HG API',
    version: '1.0.0',
    description: 'Self HG 博客系统 API 文档',
    baseUrl: '/api',
    contact: {
      name: 'Self HG Team',
      email: 'support@selfhg.com',
    },
  }
}

/**
 * 获取所有 API 端点文档
 */
export function getAllApiEndpoints(): ApiEndpoint[] {
  return [
    // 认证相关
    {
      path: '/auth/login',
      method: 'POST',
      summary: '用户登录',
      description: '使用用户名和密码进行登录，返回 JWT token',
      tags: ['认证'],
      requestBody: {
        contentType: 'application/json',
        schema: {
          username: 'string',
          password: 'string',
        },
        example: {
          username: 'admin',
          password: 'password123',
        },
      },
      responses: [
        {
          status: 200,
          description: '登录成功',
          example: {
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            user: { id: 1, username: 'admin', role: 'admin' },
          },
        },
        {
          status: 401,
          description: '用户名或密码错误',
        },
      ],
      authentication: false,
      rateLimit: '5次/分钟',
    },
    {
      path: '/auth/register',
      method: 'POST',
      summary: '用户注册',
      description: '注册新用户账号',
      tags: ['认证'],
      requestBody: {
        contentType: 'application/json',
        schema: {
          username: 'string',
          email: 'string',
          password: 'string',
        },
        example: {
          username: 'newuser',
          email: 'user@example.com',
          password: 'securePassword123',
        },
      },
      responses: [
        {
          status: 201,
          description: '注册成功',
          example: {
            id: 1,
            username: 'newuser',
            email: 'user@example.com',
          },
        },
        {
          status: 400,
          description: '请求参数错误',
        },
        {
          status: 409,
          description: '用户名或邮箱已存在',
        },
      ],
      authentication: false,
      rateLimit: '3次/小时',
    },
    {
      path: '/auth/logout',
      method: 'POST',
      summary: '用户登出',
      description: '登出当前用户，使 token 失效',
      tags: ['认证'],
      responses: [
        {
          status: 200,
          description: '登出成功',
        },
      ],
      authentication: true,
    },
    {
      path: '/auth/refresh',
      method: 'POST',
      summary: '刷新 Token',
      description: '使用当前 token 获取新的 token',
      tags: ['认证'],
      responses: [
        {
          status: 200,
          description: '刷新成功',
          example: {
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      ],
      authentication: true,
    },

    // 用户相关
    {
      path: '/users',
      method: 'GET',
      summary: '获取用户列表',
      description: '获取所有用户列表（管理员权限）',
      tags: ['用户'],
      parameters: [
        {
          name: 'page',
          in: 'query',
          required: false,
          type: 'number',
          description: '页码',
          example: 1,
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          type: 'number',
          description: '每页数量',
          example: 10,
        },
        {
          name: 'search',
          in: 'query',
          required: false,
          type: 'string',
          description: '搜索关键词',
          example: 'admin',
        },
      ],
      responses: [
        {
          status: 200,
          description: '获取成功',
          example: {
            users: [
              { id: 1, username: 'admin', role: 'admin' },
              { id: 2, username: 'user1', role: 'user' },
            ],
            total: 100,
            page: 1,
            limit: 10,
          },
        },
      ],
      authentication: true,
    },
    {
      path: '/users/{id}',
      method: 'GET',
      summary: '获取用户详情',
      description: '获取指定用户的详细信息',
      tags: ['用户'],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          type: 'number',
          description: '用户 ID',
          example: 1,
        },
      ],
      responses: [
        {
          status: 200,
          description: '获取成功',
          example: {
            id: 1,
            username: 'admin',
            email: 'admin@example.com',
            role: 'admin',
            avatar: null,
            bio: '管理员账号',
            createdAt: '2024-01-01T00:00:00Z',
          },
        },
        {
          status: 404,
          description: '用户不存在',
        },
      ],
      authentication: true,
    },
    {
      path: '/users/{id}',
      method: 'PUT',
      summary: '更新用户信息',
      description: '更新指定用户的信息（管理员或本人）',
      tags: ['用户'],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          type: 'number',
          description: '用户 ID',
          example: 1,
        },
      ],
      requestBody: {
        contentType: 'application/json',
        schema: {
          username: 'string',
          email: 'string',
          bio: 'string',
          avatar: 'string',
        },
        example: {
          username: 'updateduser',
          bio: '更新后的个人简介',
        },
      },
      responses: [
        {
          status: 200,
          description: '更新成功',
        },
        {
          status: 400,
          description: '请求参数错误',
        },
        {
          status: 403,
          description: '权限不足',
        },
        {
          status: 404,
          description: '用户不存在',
        },
      ],
      authentication: true,
    },
    {
      path: '/users/{id}',
      method: 'DELETE',
      summary: '删除用户',
      description: '删除指定用户（管理员权限）',
      tags: ['用户'],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          type: 'number',
          description: '用户 ID',
          example: 1,
        },
      ],
      responses: [
        {
          status: 200,
          description: '删除成功',
        },
        {
          status: 403,
          description: '权限不足',
        },
        {
          status: 404,
          description: '用户不存在',
        },
      ],
      authentication: true,
    },

    // 文章相关
    {
      path: '/posts',
      method: 'GET',
      summary: '获取文章列表',
      description: '获取文章列表，支持分页和筛选',
      tags: ['文章'],
      parameters: [
        {
          name: 'page',
          in: 'query',
          required: false,
          type: 'number',
          description: '页码',
          example: 1,
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          type: 'number',
          description: '每页数量',
          example: 10,
        },
        {
          name: 'tag',
          in: 'query',
          required: false,
          type: 'string',
          description: '标签筛选',
          example: 'javascript',
        },
        {
          name: 'search',
          in: 'query',
          required: false,
          type: 'string',
          description: '搜索关键词',
          example: 'vue',
        },
      ],
      responses: [
        {
          status: 200,
          description: '获取成功',
          example: {
            posts: [
              {
                id: 1,
                title: '示例文章',
                slug: 'example-post',
                excerpt: '文章摘要...',
                author: { id: 1, username: 'admin' },
                tags: ['vue', 'javascript'],
                createdAt: '2024-01-01T00:00:00Z',
              },
            ],
            total: 50,
            page: 1,
            limit: 10,
          },
        },
      ],
      authentication: false,
    },
    {
      path: '/posts/{slug}',
      method: 'GET',
      summary: '获取文章详情',
      description: '根据 slug 获取文章详细内容',
      tags: ['文章'],
      parameters: [
        {
          name: 'slug',
          in: 'path',
          required: true,
          type: 'string',
          description: '文章 slug',
          example: 'example-post',
        },
      ],
      responses: [
        {
          status: 200,
          description: '获取成功',
          example: {
            id: 1,
            title: '示例文章',
            slug: 'example-post',
            content: '文章内容...',
            author: { id: 1, username: 'admin' },
            tags: ['vue', 'javascript'],
            views: 1000,
            likes: 50,
            createdAt: '2024-01-01T00:00:00Z',
          },
        },
        {
          status: 404,
          description: '文章不存在',
        },
      ],
      authentication: false,
    },
    {
      path: '/posts',
      method: 'POST',
      summary: '创建文章',
      description: '创建新文章（需要登录）',
      tags: ['文章'],
      requestBody: {
        contentType: 'application/json',
        schema: {
          title: 'string',
          content: 'string',
          excerpt: 'string',
          tags: 'string[]',
          status: 'draft | published',
        },
        example: {
          title: '新文章标题',
          content: '文章内容...',
          excerpt: '文章摘要',
          tags: ['vue', 'typescript'],
          status: 'draft',
        },
      },
      responses: [
        {
          status: 201,
          description: '创建成功',
          example: {
            id: 1,
            title: '新文章标题',
            slug: 'xin-wen-zhang-biao-ti',
            status: 'draft',
          },
        },
        {
          status: 400,
          description: '请求参数错误',
        },
      ],
      authentication: true,
    },
    {
      path: '/posts/{id}',
      method: 'PUT',
      summary: '更新文章',
      description: '更新文章内容（作者或管理员）',
      tags: ['文章'],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          type: 'number',
          description: '文章 ID',
          example: 1,
        },
      ],
      requestBody: {
        contentType: 'application/json',
        schema: {
          title: 'string',
          content: 'string',
          excerpt: 'string',
          tags: 'string[]',
          status: 'draft | published',
        },
        example: {
          title: '更新后的标题',
          content: '更新后的内容...',
        },
      },
      responses: [
        {
          status: 200,
          description: '更新成功',
        },
        {
          status: 400,
          description: '请求参数错误',
        },
        {
          status: 403,
          description: '权限不足',
        },
        {
          status: 404,
          description: '文章不存在',
        },
      ],
      authentication: true,
    },
    {
      path: '/posts/{id}',
      method: 'DELETE',
      summary: '删除文章',
      description: '删除文章（作者或管理员）',
      tags: ['文章'],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          type: 'number',
          description: '文章 ID',
          example: 1,
        },
      ],
      responses: [
        {
          status: 200,
          description: '删除成功',
        },
        {
          status: 403,
          description: '权限不足',
        },
        {
          status: 404,
          description: '文章不存在',
        },
      ],
      authentication: true,
    },

    // 评论相关
    {
      path: '/posts/{postId}/comments',
      method: 'GET',
      summary: '获取文章评论',
      description: '获取指定文章的所有评论',
      tags: ['评论'],
      parameters: [
        {
          name: 'postId',
          in: 'path',
          required: true,
          type: 'number',
          description: '文章 ID',
          example: 1,
        },
        {
          name: 'page',
          in: 'query',
          required: false,
          type: 'number',
          description: '页码',
          example: 1,
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          type: 'number',
          description: '每页数量',
          example: 20,
        },
      ],
      responses: [
        {
          status: 200,
          description: '获取成功',
          example: {
            comments: [
              {
                id: 1,
                content: '评论内容',
                author: { id: 2, username: 'user1' },
                createdAt: '2024-01-01T00:00:00Z',
              },
            ],
            total: 50,
            page: 1,
            limit: 20,
          },
        },
      ],
      authentication: false,
    },
    {
      path: '/posts/{postId}/comments',
      method: 'POST',
      summary: '发表评论',
      description: '在指定文章下发表评论（需要登录）',
      tags: ['评论'],
      parameters: [
        {
          name: 'postId',
          in: 'path',
          required: true,
          type: 'number',
          description: '文章 ID',
          example: 1,
        },
      ],
      requestBody: {
        contentType: 'application/json',
        schema: {
          content: 'string',
          parentId: 'number | null',
        },
        example: {
          content: '这是一条评论',
          parentId: null,
        },
      },
      responses: [
        {
          status: 201,
          description: '评论成功',
        },
        {
          status: 400,
          description: '请求参数错误',
        },
        {
          status: 404,
          description: '文章不存在',
        },
      ],
      authentication: true,
    },
    {
      path: '/comments/{id}',
      method: 'DELETE',
      summary: '删除评论',
      description: '删除评论（作者或管理员）',
      tags: ['评论'],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          type: 'number',
          description: '评论 ID',
          example: 1,
        },
      ],
      responses: [
        {
          status: 200,
          description: '删除成功',
        },
        {
          status: 403,
          description: '权限不足',
        },
        {
          status: 404,
          description: '评论不存在',
        },
      ],
      authentication: true,
    },

    // 标签相关
    {
      path: '/tags',
      method: 'GET',
      summary: '获取标签列表',
      description: '获取所有标签及其文章数量',
      tags: ['标签'],
      responses: [
        {
          status: 200,
          description: '获取成功',
          example: {
            tags: [
              { id: 1, name: 'javascript', count: 25 },
              { id: 2, name: 'vue', count: 18 },
            ],
          },
        },
      ],
      authentication: false,
    },
    {
      path: '/tags/{name}',
      method: 'GET',
      summary: '获取标签下的文章',
      description: '获取指定标签下的所有文章',
      tags: ['标签'],
      parameters: [
        {
          name: 'name',
          in: 'path',
          required: true,
          type: 'string',
          description: '标签名称',
          example: 'javascript',
        },
        {
          name: 'page',
          in: 'query',
          required: false,
          type: 'number',
          description: '页码',
          example: 1,
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          type: 'number',
          description: '每页数量',
          example: 10,
        },
      ],
      responses: [
        {
          status: 200,
          description: '获取成功',
        },
        {
          status: 404,
          description: '标签不存在',
        },
      ],
      authentication: false,
    },

    // 点赞相关
    {
      path: '/posts/{id}/like',
      method: 'POST',
      summary: '点赞/取消点赞',
      description: '切换文章的点赞状态（需要登录）',
      tags: ['互动'],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          type: 'number',
          description: '文章 ID',
          example: 1,
        },
      ],
      responses: [
        {
          status: 200,
          description: '操作成功',
          example: {
            liked: true,
            likesCount: 51,
          },
        },
      ],
      authentication: true,
    },

    // 收藏相关
    {
      path: '/posts/{id}/favorite',
      method: 'POST',
      summary: '收藏/取消收藏',
      description: '切换文章的收藏状态（需要登录）',
      tags: ['互动'],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          type: 'number',
          description: '文章 ID',
          example: 1,
        },
      ],
      responses: [
        {
          status: 200,
          description: '操作成功',
          example: {
            favorited: true,
            favoritesCount: 25,
          },
        },
      ],
      authentication: true,
    },

    // 关注相关
    {
      path: '/users/{id}/follow',
      method: 'POST',
      summary: '关注/取消关注',
      description: '切换用户的关注状态（需要登录）',
      tags: ['互动'],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          type: 'number',
          description: '用户 ID',
          example: 2,
        },
      ],
      responses: [
        {
          status: 200,
          description: '操作成功',
          example: {
            following: true,
            followersCount: 100,
          },
        },
      ],
      authentication: true,
    },

    // 通知相关
    {
      path: '/notifications',
      method: 'GET',
      summary: '获取通知列表',
      description: '获取当前用户的通知列表（需要登录）',
      tags: ['通知'],
      parameters: [
        {
          name: 'page',
          in: 'query',
          required: false,
          type: 'number',
          description: '页码',
          example: 1,
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          type: 'number',
          description: '每页数量',
          example: 20,
        },
        {
          name: 'unreadOnly',
          in: 'query',
          required: false,
          type: 'boolean',
          description: '只显示未读通知',
          example: true,
        },
      ],
      responses: [
        {
          status: 200,
          description: '获取成功',
          example: {
            notifications: [
              {
                id: 1,
                type: 'like',
                message: '用户 user1 点赞了你的文章',
                read: false,
                createdAt: '2024-01-01T00:00:00Z',
              },
            ],
            total: 50,
            unreadCount: 10,
          },
        },
      ],
      authentication: true,
    },
    {
      path: '/notifications/read',
      method: 'POST',
      summary: '标记通知为已读',
      description: '标记指定通知或所有通知为已读',
      tags: ['通知'],
      requestBody: {
        contentType: 'application/json',
        schema: {
          ids: 'number[] | null',
          all: 'boolean',
        },
        example: {
          ids: [1, 2, 3],
          all: false,
        },
      },
      responses: [
        {
          status: 200,
          description: '操作成功',
        },
      ],
      authentication: true,
    },

    // 举报相关
    {
      path: '/reports',
      method: 'POST',
      summary: '提交举报',
      description: '举报文章或评论（需要登录）',
      tags: ['举报'],
      requestBody: {
        contentType: 'application/json',
        schema: {
          type: 'post | comment',
          targetId: 'number',
          reason: 'string',
          description: 'string',
        },
        example: {
          type: 'post',
          targetId: 1,
          reason: 'spam',
          description: '这是垃圾内容',
        },
      },
      responses: [
        {
          status: 201,
          description: '举报成功',
        },
        {
          status: 400,
          description: '请求参数错误',
        },
      ],
      authentication: true,
    },

    // 管理员相关
    {
      path: '/admin/posts',
      method: 'GET',
      summary: '获取所有文章',
      description: '管理员获取所有文章（包括草稿）',
      tags: ['管理员'],
      parameters: [
        {
          name: 'status',
          in: 'query',
          required: false,
          type: 'string',
          description: '文章状态筛选',
          example: 'draft',
        },
        {
          name: 'authorId',
          in: 'query',
          required: false,
          type: 'number',
          description: '作者 ID 筛选',
          example: 1,
        },
        {
          name: 'page',
          in: 'query',
          required: false,
          type: 'number',
          description: '页码',
          example: 1,
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          type: 'number',
          description: '每页数量',
          example: 20,
        },
      ],
      responses: [
        {
          status: 200,
          description: '获取成功',
        },
      ],
      authentication: true,
    },
    {
      path: '/admin/users',
      method: 'GET',
      summary: '获取所有用户',
      description: '管理员获取所有用户列表',
      tags: ['管理员'],
      parameters: [
        {
          name: 'role',
          in: 'query',
          required: false,
          type: 'string',
          description: '角色筛选',
          example: 'admin',
        },
        {
          name: 'page',
          in: 'query',
          required: false,
          type: 'number',
          description: '页码',
          example: 1,
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          type: 'number',
          description: '每页数量',
          example: 20,
        },
      ],
      responses: [
        {
          status: 200,
          description: '获取成功',
        },
      ],
      authentication: true,
    },
    {
      path: '/admin/stats',
      method: 'GET',
      summary: '获取系统统计',
      description: '获取系统整体统计数据',
      tags: ['管理员'],
      responses: [
        {
          status: 200,
          description: '获取成功',
          example: {
            totalUsers: 1000,
            totalPosts: 5000,
            totalComments: 20000,
            totalViews: 1000000,
          },
        },
      ],
      authentication: true,
    },

    // 媒体相关
    {
      path: '/media/upload',
      method: 'POST',
      summary: '上传媒体文件',
      description: '上传图片或其他媒体文件',
      tags: ['媒体'],
      requestBody: {
        contentType: 'multipart/form-data',
        schema: {
          file: 'File',
        },
        example: {
          file: '(binary)',
        },
      },
      responses: [
        {
          status: 200,
          description: '上传成功',
          example: {
            url: '/uploads/image.jpg',
            filename: 'image.jpg',
            size: 1024000,
          },
        },
        {
          status: 400,
          description: '文件格式不支持',
        },
        {
          status: 413,
          description: '文件过大',
        },
      ],
      authentication: true,
      rateLimit: '10次/分钟',
    },

    // 搜索相关
    {
      path: '/search',
      method: 'GET',
      summary: '全局搜索',
      description: '搜索文章、用户、标签',
      tags: ['搜索'],
      parameters: [
        {
          name: 'q',
          in: 'query',
          required: true,
          type: 'string',
          description: '搜索关键词',
          example: 'vue',
        },
        {
          name: 'type',
          in: 'query',
          required: false,
          type: 'string',
          description: '搜索类型：posts, users, tags, all',
          example: 'posts',
        },
      ],
      responses: [
        {
          status: 200,
          description: '搜索成功',
          example: {
            posts: [],
            users: [],
            tags: [],
          },
        },
      ],
      authentication: false,
    },

    // Webhook 相关
    {
      path: '/admin/webhooks',
      method: 'GET',
      summary: '获取 Webhook 列表',
      description: '获取所有 Webhook 配置',
      tags: ['Webhook'],
      responses: [
        {
          status: 200,
          description: '获取成功',
        },
      ],
      authentication: true,
    },
    {
      path: '/admin/webhooks',
      method: 'POST',
      summary: '创建 Webhook',
      description: '创建新的 Webhook 配置',
      tags: ['Webhook'],
      requestBody: {
        contentType: 'application/json',
        schema: {
          url: 'string',
          events: 'string[]',
          secret: 'string',
        },
        example: {
          url: 'https://example.com/webhook',
          events: ['post.created', 'comment.created'],
          secret: 'webhook_secret',
        },
      },
      responses: [
        {
          status: 201,
          description: '创建成功',
        },
      ],
      authentication: true,
    },

    // A/B 测试相关
    {
      path: '/admin/experiments',
      method: 'GET',
      summary: '获取实验列表',
      description: '获取所有 A/B 测试实验',
      tags: ['实验'],
      responses: [
        {
          status: 200,
          description: '获取成功',
        },
      ],
      authentication: true,
    },
    {
      path: '/experiments/{name}/variant',
      method: 'GET',
      summary: '获取实验变体',
      description: '获取用户在指定实验中的变体',
      tags: ['实验'],
      parameters: [
        {
          name: 'name',
          in: 'path',
          required: true,
          type: 'string',
          description: '实验名称',
          example: 'button-color-test',
        },
      ],
      responses: [
        {
          status: 200,
          description: '获取成功',
          example: {
            variant: 'control',
            config: { color: 'blue' },
          },
        },
      ],
      authentication: false,
    },

    // 系统相关
    {
      path: '/health',
      method: 'GET',
      summary: '健康检查',
      description: '检查系统是否正常运行',
      tags: ['系统'],
      responses: [
        {
          status: 200,
          description: '系统正常',
          example: {
            status: 'ok',
            timestamp: '2024-01-01T00:00:00Z',
          },
        },
      ],
      authentication: false,
    },
  ]
}

/**
 * 按标签分组获取 API 端点
 */
export function getApiEndpointsByTag(): ApiTag[] {
  const endpoints = getAllApiEndpoints()
  const tagMap = new Map<string, ApiEndpoint[]>()

  for (const endpoint of endpoints) {
    for (const tag of endpoint.tags) {
      if (!tagMap.has(tag)) {
        tagMap.set(tag, [])
      }
      tagMap.get(tag)!.push(endpoint)
    }
  }

  const tagDescriptions: Record<string, string> = {
    认证: '用户认证和授权相关接口',
    用户: '用户信息管理接口',
    文章: '文章内容管理接口',
    评论: '评论管理接口',
    标签: '标签管理接口',
    互动: '点赞、收藏、关注等互动接口',
    通知: '通知管理接口',
    举报: '举报管理接口',
    管理员: '管理员专用接口',
    媒体: '媒体文件管理接口',
    搜索: '搜索功能接口',
    Webhook: 'Webhook 管理接口',
    实验: 'A/B 测试实验接口',
    系统: '系统状态接口',
  }

  return Array.from(tagMap.entries()).map(([name, endpoints]) => ({
    name,
    description: tagDescriptions[name] || `${name}相关接口`,
    endpoints,
  }))
}

/**
 * 搜索 API 端点
 */
export function searchApiEndpoints(query: string): ApiEndpoint[] {
  const endpoints = getAllApiEndpoints()
  const lowerQuery = query.toLowerCase()

  return endpoints.filter((endpoint) => {
    return (
      endpoint.path.toLowerCase().includes(lowerQuery) ||
      endpoint.summary.toLowerCase().includes(lowerQuery) ||
      endpoint.description.toLowerCase().includes(lowerQuery) ||
      endpoint.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    )
  })
}

/**
 * 获取 API 端点详情
 */
export function getApiEndpointDetail(path: string, method: string): ApiEndpoint | null {
  const endpoints = getAllApiEndpoints()
  return endpoints.find((e) => e.path === path && e.method === method.toUpperCase()) || null
}

/**
 * 生成 OpenAPI 规范
 */
export function generateOpenApiSpec(): Record<string, unknown> {
  const config = getApiDocsConfig()
  const endpoints = getAllApiEndpoints()

  const paths: Record<string, Record<string, unknown>> = {}

  for (const endpoint of endpoints) {
    const pathKey = endpoint.path.replace(/\{(\w+)\}/g, '{$1}')

    if (!paths[pathKey]) {
      paths[pathKey] = {}
    }

    const operation: Record<string, unknown> = {
      summary: endpoint.summary,
      description: endpoint.description,
      tags: endpoint.tags,
      responses: {},
    }

    if (endpoint.parameters) {
      operation.parameters = endpoint.parameters.map((p) => ({
        name: p.name,
        in: p.in,
        required: p.required,
        schema: { type: p.type },
        description: p.description,
        example: p.example,
      }))
    }

    if (endpoint.requestBody) {
      operation.requestBody = {
        content: {
          [endpoint.requestBody.contentType]: {
            schema: endpoint.requestBody.schema,
            example: endpoint.requestBody.example,
          },
        },
      }
    }

    for (const response of endpoint.responses) {
      ;(operation.responses as Record<string, unknown>)[response.status.toString()] = {
        description: response.description,
        ...(response.example && {
          content: {
            'application/json': {
              example: response.example,
            },
          },
        }),
      }
    }

    if (endpoint.authentication) {
      operation.security = [{ bearerAuth: [] }]
    }

    paths[pathKey][endpoint.method.toLowerCase()] = operation
  }

  return {
    openapi: '3.0.0',
    info: {
      title: config.title,
      version: config.version,
      description: config.description,
      contact: config.contact,
    },
    servers: [
      {
        url: config.baseUrl,
        description: 'API Server',
      },
    ],
    paths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  }
}

/**
 * 生成 cURL 示例
 */
export function generateCurlExample(endpoint: ApiEndpoint): string {
  const config = getApiDocsConfig()
  let curl = `curl -X ${endpoint.method} "${config.baseUrl}${endpoint.path}"`

  if (endpoint.authentication) {
    curl += ' \\\n  -H "Authorization: Bearer YOUR_TOKEN"'
  }

  if (endpoint.requestBody) {
    curl += ' \\\n  -H "Content-Type: application/json"'
    curl += ` \\\n  -d '${JSON.stringify(endpoint.requestBody.example, null, 2)}'`
  }

  return curl
}

/**
 * 生成 JavaScript fetch 示例
 */
export function generateFetchExample(endpoint: ApiEndpoint): string {
  const config = getApiDocsConfig()
  let code = `const response = await fetch('${config.baseUrl}${endpoint.path}', {\n`
  code += `  method: '${endpoint.method}',\n`

  if (endpoint.authentication) {
    code += `  headers: {\n`
    code += `    'Authorization': 'Bearer YOUR_TOKEN',\n`
    if (endpoint.requestBody) {
      code += `    'Content-Type': 'application/json',\n`
    }
    code += `  },\n`
  }

  if (endpoint.requestBody) {
    code += `  body: JSON.stringify(${JSON.stringify(endpoint.requestBody.example, null, 4)}),\n`
  }

  code += `});\n\n`
  code += `const data = await response.json();`

  return code
}
