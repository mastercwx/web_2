/**
 * 通用类型定义
 */

/** 分页参数 */
export interface PaginationParams {
  page: number
  pageSize: number
}

/** 分页响应 */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** API 响应结构 */
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

/** 用户信息 */
export interface User {
  id: number
  username: string
  email: string
  avatar?: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

/** 用户角色 */
export type UserRole = 'admin' | 'user' | 'guest'

/** 登录请求 */
export interface LoginRequest {
  username: string
  password: string
}

/** 登录响应 */
export interface LoginResponse {
  token: string
  user: User
}
