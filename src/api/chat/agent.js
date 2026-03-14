import request from '@/utils/request'

/**
 * 上传聊天附件
 */
export function uploadChatAttachments(threadId, files) {
  const formData = new FormData()
  files.forEach(file => formData.append('files', file))
  return request({
    url: '/chat/workspace/attachments/upload',
    method: 'post',
    params: { threadId },
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
      repeatSubmit: false
    }
  })
}

/**
 * 获取附件文件的 Blob URL（用于 img 标签渲染）
 */
export function fetchAttachmentBlob(threadId, storedName) {
  return request({
    url: '/chat/workspace/files/download',
    method: 'get',
    params: { threadId, path: storedName },
    responseType: 'blob'
  }).then(blob => URL.createObjectURL(blob))
}

/**
 * 终止正在进行的会话
 */
export function stopChatSession(threadId) {
  return request({
    url: '/chat/agent/stop',
    method: 'post',
    params: { thread_id: threadId }
  })
}

/**
 * 获取会话历史
 */
export function getChatHistory(params) {
  return request({
    url: '/chat/agent/history',
    method: 'get',
    params
  })
}

/**
 * 获取会话列表
 */
export function getThreadList() {
  return request({
    url: '/chat/thread/list',
    method: 'get'
  })
}

/**
 * 删除会话
 */
export function deleteThread(threadId) {
  return request({
    url: `/chat/thread/${threadId}`,
    method: 'delete'
  })
}
