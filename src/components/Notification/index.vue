<template>
  <div class="notification-wrapper">
    <el-popover
      placement="bottom"
      :width="380"
      trigger="click"
      @show="handlePopoverShow"
      v-model:visible="popoverVisible"
    >
      <template #reference>
        <div class="notification-trigger">
          <svg-icon icon-class="message" class="notification-icon" />
          <span v-if="unreadCount > 0" class="notification-dot">
            {{ unreadCount > 99 ? '99+' : unreadCount }}
          </span>
        </div>
      </template>

      <div class="notification-panel">
        <div class="notification-header">
          <span class="title">消息通知</span>
          <el-button
            v-if="unreadCount > 0"
            type="primary"
            link
            size="small"
            @click="handleMarkAllRead"
          >
            全部已读
          </el-button>
        </div>

        <el-scrollbar max-height="360px">
          <div v-if="loading" class="notification-loading">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>加载中...</span>
          </div>

          <div v-else-if="notifications.length === 0" class="notification-empty">
            <el-empty description="暂无消息" :image-size="80" />
          </div>

          <div v-else class="notification-list">
            <div
              v-for="item in notifications"
              :key="item.notificationId"
              class="notification-item"
              :class="{ unread: !item.isRead }"
              @click="handleClickItem(item)"
            >
              <div class="item-icon" :class="'type-' + item.notificationType">
                <el-icon>
                  <component :is="getIcon(item.notificationType)" />
                </el-icon>
              </div>
              <div class="item-content">
                <div class="item-title" v-if="item.title">{{ item.title }}</div>
                <div class="item-desc">{{ item.message }}</div>
                <div class="item-time">{{ formatTime(item.createTime) }}</div>
              </div>
              <el-button
                class="item-close"
                type="danger"
                link
                :icon="Delete"
                @click.stop="handleDelete(item)"
              />
            </div>
          </div>
        </el-scrollbar>

        <!-- 分页 -->
        <div v-if="total > 0" class="notification-pagination">
          <el-button
            size="small"
            :disabled="pageNum <= 1"
            @click="handlePrevPage"
          >
            上一页
          </el-button>
          <span class="page-info">{{ pageNum }} / {{ totalPages }}</span>
          <el-button
            size="small"
            :disabled="!hasNext"
            @click="handleNextPage"
          >
            下一页
          </el-button>
        </div>

        <div class="notification-footer">
          <el-button type="primary" link @click="handleViewAll">查看全部</el-button>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Loading, Delete, SuccessFilled, WarningFilled, CircleCloseFilled, InfoFilled } from '@element-plus/icons-vue'
import { ElMessage, ElNotification } from 'element-plus'
import { getNotificationList, markAsRead, markAllAsRead, deleteNotification } from '@/api/notification'
import wsService from '@/utils/websocket'

const router = useRouter()

const props = defineProps({
  channel: {
    type: String,
    default: 'notification'
  }
})

const loading = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const popoverVisible = ref(false)
const pageNum = ref(1)
const pageSize = ref(5)
const total = ref(0)
const hasNext = ref(false)

const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1)

// 获取通知图标
const getIcon = (type) => {
  const icons = {
    success: SuccessFilled,
    warning: WarningFilled,
    error: CircleCloseFilled,
    info: InfoFilled
  }
  return icons[type] || InfoFilled
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  return `${date.getMonth() + 1}-${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 获取通知列表
const fetchNotifications = async () => {
  loading.value = true
  try {
    const res = await getNotificationList({ pageNum: pageNum.value, pageSize: pageSize.value })
    if (res.code === 200) {
      notifications.value = res.rows || []
      total.value = res.total || 0
      hasNext.value = res.hasNext || false
      unreadCount.value = res.totalUnRead || 0
    }
  } catch (error) {
    console.error('获取通知列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 弹出框显示时加载数据
const handlePopoverShow = () => {
  pageNum.value = 1
  fetchNotifications()
}

// 上一页
const handlePrevPage = () => {
  if (pageNum.value > 1) {
    pageNum.value--
    fetchNotifications()
  }
}

// 下一页
const handleNextPage = () => {
  if (hasNext.value) {
    pageNum.value++
    fetchNotifications()
  }
}

// 点击通知项
const handleClickItem = async (item) => {
  if (!item.isRead) {
    try {
      await markAsRead(item.notificationId)
      item.isRead = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }
}

// 全部标记已读
const handleMarkAllRead = async () => {
  try {
    await markAllAsRead()
    // 刷新列表
    fetchNotifications()
    ElMessage.success('已全部标记为已读')
  } catch (error) {
    console.error('标记全部已读失败:', error)
    ElMessage.error('操作失败')
  }
}

// 删除通知
const handleDelete = async (item) => {
  try {
    await deleteNotification(item.notificationId)
    // 刷新列表
    fetchNotifications()
    ElMessage.success('删除成功')
  } catch (error) {
    console.error('删除通知失败:', error)
    ElMessage.error('删除失败')
  }
}

// 查看全部
const handleViewAll = () => {
  popoverVisible.value = false
  router.push('/api-management/notification')
}

// WebSocket 消息处理
const handleWsMessage = (data) => {
  // 忽略连接成功消息和pong消息
  if (data.type === 'connected' || data.type === 'pong') {
    return
  }

  // 处理通知消息
  if (data.message) {
    const notificationType = data.notificationType || data.type || 'info'

    // 映射通知类型
    const elType = { success: 'success', warning: 'warning', error: 'error' }[notificationType] || 'info'

    // 弹出通知
    ElNotification({
      title: data.title || '新消息',
      message: data.message,
      type: elType,
      duration: 4500,
      position: 'top-right'
    })

    // 浏览器通知
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(data.title || '新消息', { body: data.message, icon: '/favicon.ico' })
    }

    // 刷新数据
    fetchNotifications()
  }
}

// 初始化
onMounted(() => {
  // 初始获取未读数
  getNotificationList({ pageNum: 1, pageSize: 1 }).then(res => {
    if (res.code === 200) {
      unreadCount.value = res.totalUnRead || 0
    }
  })

  // WebSocket
  wsService.on('message', handleWsMessage)
  wsService.connect(props.channel)

  // 浏览器通知权限
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
})

onUnmounted(() => {
  wsService.off('message', handleWsMessage)
})
</script>

<style lang="scss" scoped>
.notification-wrapper {
  display: flex;
  align-items: center;
}

.notification-trigger {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0 4px;
}

.notification-icon {
  font-size: 20px;
  color: var(--navbar-text, #5a5e66);
  transition: color 0.3s;

  &:hover {
    color: var(--el-color-primary);
  }
}

.notification-dot {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-size: 11px;
  font-weight: 500;
  line-height: 16px;
  text-align: center;
  color: #fff;
  background-color: var(--el-color-danger);
  border-radius: 8px;
}

.notification-panel {
  margin: -12px;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);

  .title {
    font-size: 16px;
    font-weight: 500;
  }
}

.notification-loading,
.notification-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: var(--el-text-color-secondary);

  .is-loading {
    font-size: 24px;
    margin-bottom: 8px;
    animation: rotating 2s linear infinite;
  }
}

@keyframes rotating {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.notification-list {
  .notification-item {
    display: flex;
    align-items: flex-start;
    padding: 10px 16px;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: var(--el-fill-color-light);
    }

    &.unread {
      background-color: var(--el-color-primary-light-9);

      .item-desc {
        font-weight: 500;
        color: var(--el-text-color-primary);
      }
    }

    .item-icon {
      flex-shrink: 0;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      margin-right: 10px;
      font-size: 16px;

      &.type-success {
        color: var(--el-color-success);
        background-color: var(--el-color-success-light-9);
      }

      &.type-error {
        color: var(--el-color-danger);
        background-color: var(--el-color-danger-light-9);
      }

      &.type-warning {
        color: var(--el-color-warning);
        background-color: var(--el-color-warning-light-9);
      }

      &.type-info {
        color: var(--el-color-info);
        background-color: var(--el-color-info-light-9);
      }
    }

    .item-content {
      flex: 1;
      min-width: 0;

      .item-title {
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 2px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .item-desc {
        font-size: 13px;
        color: var(--el-text-color-secondary);
        margin-bottom: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .item-time {
        font-size: 12px;
        color: var(--el-text-color-placeholder);
      }
    }

    .item-close {
      flex-shrink: 0;
      margin-left: 8px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    &:hover .item-close {
      opacity: 1;
    }
  }
}

.notification-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-top: 1px solid var(--el-border-color-lighter);

  .page-info {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
}

.notification-footer {
  display: flex;
  justify-content: center;
  padding: 10px;
  border-top: 1px solid var(--el-border-color-lighter);
}
</style>
