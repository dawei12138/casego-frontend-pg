import request from '@/utils/request'

/**
 * 列出文件树
 */
export function listWorkspaceFiles(threadId) {
  return request({
    url: '/chat/workspace/files',
    method: 'get',
    params: { threadId }
  })
}

/**
 * 读取文件内容
 */
export function readWorkspaceFile(threadId, path) {
  return request({
    url: '/chat/workspace/files/content',
    method: 'get',
    params: { threadId, path }
  })
}

/**
 * 获取文件下载URL（不含认证，仅用于拼接）
 */
export function getWorkspaceFileDownloadUrl(threadId, path) {
  const baseURL = import.meta.env.VITE_APP_BASE_API
  return `${baseURL}/chat/workspace/files/download?threadId=${encodeURIComponent(threadId)}&path=${encodeURIComponent(path)}`
}

/**
 * 下载文件（通过系统请求，自动携带认证）
 */
export function downloadWorkspaceFile(threadId, path) {
  return request({
    url: '/chat/workspace/files/download',
    method: 'get',
    params: { threadId, path },
    responseType: 'blob'
  })
}

/**
 * 创建文件
 */
export function createWorkspaceFile(data) {
  return request({
    url: '/chat/workspace/files',
    method: 'post',
    data
  })
}

/**
 * 删除文件
 */
export function deleteWorkspaceFile(data) {
  return request({
    url: '/chat/workspace/files',
    method: 'delete',
    data
  })
}

/**
 * 创建文件夹
 */
export function createWorkspaceFolder(data) {
  return request({
    url: '/chat/workspace/folders',
    method: 'post',
    data
  })
}

/**
 * 删除文件夹
 */
export function deleteWorkspaceFolder(data) {
  return request({
    url: '/chat/workspace/folders',
    method: 'delete',
    data
  })
}
