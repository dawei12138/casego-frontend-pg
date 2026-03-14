import request from '@/utils/request'

// 查询通知消息列表
export function listNotification(query) {
  return request({
    url: '/task_notification/notification/list',
    method: 'get',
    params: query
  })
}

// 查询通知消息详细
export function getNotification(notificationId) {
  return request({
    url: '/task_notification/notification/' + notificationId,
    method: 'get'
  })
}

// 新增通知消息
export function addNotification(data) {
  return request({
    url: '/task_notification/notification',
    method: 'post',
    data: data
  })
}

// 修改通知消息
export function updateNotification(data) {
  return request({
    url: '/task_notification/notification',
    method: 'put',
    data: data
  })
}

// 删除通知消息
export function delNotification(notificationId) {
  return request({
    url: '/task_notification/notification/' + notificationId,
    method: 'delete'
  })
}
