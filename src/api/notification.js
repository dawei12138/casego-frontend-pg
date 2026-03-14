import request from '@/utils/request'

/**
 * 获取通知列表
 */
export function getNotificationList(query) {
  return request({
    url: '/task_notification/notification/list',
    method: 'get',
    params: query
  })
}

/**
 * 标记通知为已读
 */
export function markAsRead(notificationId) {
  return request({
    url: '/task_notification/notification',
    method: 'put',
    data: { notificationId, isRead: true }
  })
}

/**
 * 全部标记已读
 */
export function markAllAsRead() {
  return request({
    url: '/task_notification/notification/readall',
    method: 'get'
  })
}

/**
 * 删除通知
 */
export function deleteNotification(notificationIds) {
  return request({
    url: '/task_notification/notification/' + notificationIds,
    method: 'delete'
  })
}
