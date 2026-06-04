// https://commitlint.js.org/
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 类型枚举
    'type-enum': [
      2,
      'always',
      [
        'feat', // 新功能
        'fix', // 修复
        'docs', // 文档
        'style', // 格式
        'refactor', // 重构
        'perf', // 性能
        'test', // 测试
        'build', // 构建
        'ci', // CI
        'chore', // 杂项
        'revert', // 回退
      ],
    ],
    // scope 枚举（可选，按需扩展）
    'scope-enum': [
      2,
      'always',
      [
        'auth', // 认证
        'user', // 用户
        'common', // 公共
        'config', // 配置
        'deps', // 依赖
        'init', // 初始化
        'ui', // UI
        'api', // API
        'test', // 测试
        'build', // 构建
      ],
    ],
    // subject 最大长度
    'subject-max-length': [2, 'always', 100],
    // body 最大长度
    'body-max-line-length': [2, 'always', 200],
  },
}
