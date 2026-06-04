/**
 * API 请求 composable
 * 封装统一的请求逻辑和错误处理
 */
export function useApi() {
  const config = useRuntimeConfig()

  const baseURL = config.public.apiBase as string

  async function get<T>(endpoint: string): Promise<T> {
    return $fetch<T>(endpoint, {
      baseURL,
      method: 'GET',
    }) as Promise<T>
  }

  async function post<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
    return $fetch<T>(endpoint, {
      baseURL,
      method: 'POST',
      body,
    }) as Promise<T>
  }

  async function put<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
    return $fetch<T>(endpoint, {
      baseURL,
      method: 'PUT',
      body,
    }) as Promise<T>
  }

  async function del<T>(endpoint: string): Promise<T> {
    return $fetch<T>(endpoint, {
      baseURL,
      method: 'DELETE',
    }) as Promise<T>
  }

  return {
    get,
    post,
    put,
    del,
  }
}
