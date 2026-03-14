<template>
  <el-card
    shadow="hover"
    :body-style="{ padding: '15px 20px 15px 10px' }"
    class="device-card"
  >
    <template #header>
      <div style="display: flex; justify-content: space-between; align-items: center">
        <span style="white-space: nowrap; text-overflow: ellipsis; overflow: hidden; font-weight: bold">
          {{ device.nickName || device.chiName || device.model || '未知设备' }}
        </span>
        <el-tag
          :type="getStatusType(device.status)"
          size="small"
          style="cursor: pointer"
          @click="handleStopDebug"
        >
          <el-icon v-if="device.status === 'TESTING'" class="is-loading" style="margin-right: 4px">
            <Loading />
          </el-icon>
          {{ device.status === 'DEBUGGING' ? (device.user + ' ') : '' }}{{ getStatusText(device.status) }}
        </el-tag>
      </div>
    </template>

    <el-row>
      <el-col :span="10">
        <div style="text-align: center">
          <el-image
            style="height: 160px"
            fit="contain"
            :src="getPhoneImg(device.model, device.imgUrl)"
            :preview-src-list="[getPhoneImg(device.model, device.imgUrl)]"
            hide-on-click-modal
          >
            <template #error>
              <div class="image-slot">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
        </div>
      </el-col>
      <el-col :span="14">
        <el-form
          label-position="left"
          class="device-form"
          label-width="60px"
          style="margin: 0 0 15px 10px; white-space: nowrap"
        >
          <el-form-item label="型号">
            <div>{{ device.model }}</div>
          </el-form-item>
          <el-form-item label="制造商">
            <span>{{ device.manufacturer }}</span>
          </el-form-item>
          <el-form-item label="系统">
            <div style="display: flex; align-items: center">
              <el-tag v-if="device.platform === 1 && device.isHm === 0" type="success" size="small">Android</el-tag>
              <el-tag v-else-if="device.platform === 1 && device.isHm === 1" type="warning" size="small">Harmony</el-tag>
              <el-tag v-else-if="device.platform === 2" type="primary" size="small">iOS</el-tag>
              <span style="margin-left: 6px">{{ device.version }}</span>
            </div>
          </el-form-item>
          <el-form-item label="电量">
            <div :style="{ display: 'flex', alignItems: 'center', color: getBatteryColor(device) }">
              <el-icon v-if="isDeviceOnline(device.status) && device.level !== 0" style="margin-right: 5px">
                <component :is="getBatteryIcon(device.level)" />
              </el-icon>
              {{ getBatteryText(device) }}
            </div>
          </el-form-item>
          <el-form-item label="温度">
            <div :style="{ display: 'flex', alignItems: 'center', color: getTemperatureColor(device) }">
              <el-icon v-if="isDeviceOnline(device.status) && device.temperature !== 0" style="margin-right: 5px">
                <Sunny />
              </el-icon>
              {{ getTemperatureText(device) }}
            </div>
          </el-form-item>
          <el-form-item label="Agent">
            <div>{{ findAgentById(device.agentId) }}</div>
          </el-form-item>
        </el-form>
      </el-col>
    </el-row>

    <div style="text-align: center">
      <el-button
        type="primary"
        size="small"
        :disabled="device.status !== 'ONLINE'"
        @click="handleUseDevice"
      >
        立即使用
      </el-button>
      <el-popover placement="top" width="360px" trigger="hover">
        <el-form
          v-if="device.id"
          label-position="left"
          label-width="80px"
          style="margin-left: 10px; word-break: break-all"
        >
          <el-form-item label="设备图片">
            <el-upload
              action=""
              :before-upload="beforeAvatarUpload"
              :http-request="handleUpload"
              :show-file-list="false"
            >
              <el-button type="primary" size="small">上传图片</el-button>
            </el-upload>
          </el-form-item>
          <el-form-item label="昵称">
            <el-input
              v-model="device.nickName"
              size="small"
              placeholder="设置设备昵称"
              maxlength="30"
              show-word-limit
            >
              <template #append>
                <el-button size="small" @click="handleSaveDetail">保存</el-button>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="名称">
            <span>{{ device.name }}</span>
          </el-form-item>
          <el-form-item label="型号">
            <span>{{ device.model }}</span>
          </el-form-item>
          <el-form-item label="设备ID">
            <span>{{ device.udId }}</span>
          </el-form-item>
          <el-form-item label="尺寸">
            <span>{{ device.size }}</span>
          </el-form-item>
          <el-form-item label="CPU">
            <span>{{ device.cpu }}</span>
          </el-form-item>
          <el-form-item label="电压">
            <div :style="{ display: 'flex', alignItems: 'center', color: getVoltageColor(device) }">
              {{ getVoltageText(device) }}
            </div>
          </el-form-item>
          <el-form-item v-if="device.platform !== 2" label="密码">
            <el-input
              v-model="device.password"
              size="small"
              placeholder="设置设备密码"
              maxlength="30"
              show-word-limit
            >
              <template #append>
                <el-button size="small" @click="handleSaveDetail">保存</el-button>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="操作">
            <el-popconfirm
              title="确认要重启设备吗？"
              @confirm="handleReboot"
            >
              <template #reference>
                <el-button
                  type="danger"
                  size="small"
                  :disabled="!isDeviceOnline(device.status) && device.status !== 'ERROR'"
                >
                  重启
                </el-button>
              </template>
            </el-popconfirm>
            <el-popconfirm
              title="确认要删除设备吗？"
              @confirm="handleDelete"
            >
              <template #reference>
                <el-button
                  type="danger"
                  size="small"
                  :disabled="isDeviceOnline(device.status)"
                >
                  删除
                </el-button>
              </template>
            </el-popconfirm>
          </el-form-item>
        </el-form>
        <template #reference>
          <el-button size="small">更多详情</el-button>
        </template>
      </el-popover>
    </div>
  </el-card>
</template>

<script setup>
import { ElMessage } from 'element-plus'
import { Sunny, Picture, Loading, CircleCheckFilled } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import {
  saveDeviceDetail,
  deleteDevice,
  rebootDevice,
  updateDeviceImg,
  stopDebug
} from '@/api/app/devices'
import { uploadFile } from '@/api/app/upload'

const router = useRouter()

const props = defineProps({
  device: {
    type: Object,
    required: true
  },
  agentList: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['flush', 'use'])

// 状态相关
const statusConfig = {
  ONLINE: { type: 'success', text: '空闲' },
  DEBUGGING: { type: 'warning', text: '调试中' },
  TESTING: { type: 'warning', text: '测试中' },
  DISCONNECTED: { type: 'info', text: '已断开' },
  OFFLINE: { type: 'info', text: '离线' },
  UNAUTHORIZED: { type: 'danger', text: '未授权' },
  ERROR: { type: 'danger', text: '异常' }
}

const getStatusType = (status) => {
  return statusConfig[status]?.type || 'info'
}

const getStatusText = (status) => {
  return statusConfig[status]?.text || status
}

const isDeviceOnline = (status) => {
  return ['ONLINE', 'DEBUGGING', 'TESTING'].includes(status)
}

// 设备图片
const getPhoneImg = (name, url) => {
  if (url && url.length > 0) {
    return url
  }
  // 默认占位图
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5peg5Zu+54mHPC90ZXh0Pjwvc3ZnPg=='
}

// 电池相关
const getBatteryColor = (device) => {
  if (device.level === 0 || !isDeviceOnline(device.status)) {
    return '#606266'
  }
  if (device.level <= 30) return '#F56C6C'
  if (device.level <= 70) return '#E6A23C'
  return '#67C23A'
}

const getBatteryIcon = (level) => {
  return CircleCheckFilled
}

const getBatteryText = (device) => {
  if (device.level === 0 || !isDeviceOnline(device.status)) {
    return '未知'
  }
  return `${device.level}%`
}

// 温度相关
const getTemperatureColor = (device) => {
  if (!isDeviceOnline(device.status)) {
    return '#606266'
  }
  if (device.temperature < 300) return '#67C23A'
  if (device.temperature < 350) return '#E6A23C'
  return '#F56C6C'
}

const getTemperatureText = (device) => {
  if (device.temperature === 0 || !isDeviceOnline(device.status)) {
    return '未知'
  }
  return `${(device.temperature / 10).toFixed(1)} ℃`
}

// 电压相关
const getVoltageColor = (device) => {
  if (device.voltage === 0 || !isDeviceOnline(device.status)) {
    return '#606266'
  }
  return '#67C23A'
}

const getVoltageText = (device) => {
  if (device.voltage === 0 || !isDeviceOnline(device.status)) {
    return '未知'
  }
  return `${(device.voltage / 1000).toFixed(2)} V`
}

// 查找Agent名称
const findAgentById = (id) => {
  const agent = props.agentList.find(a => a.id === id)
  return agent ? agent.name : '未知'
}

// 停止调试
const handleStopDebug = async () => {
  if (props.device.status !== 'DEBUGGING') return
  try {
    const resp = await stopDebug(props.device.udId)
    if (resp.code === 200) {
      ElMessage.success(resp.msg || '操作成功')
    }
  } catch (error) {
    console.error('停止调试失败:', error)
  }
}

// 立即使用
const handleUseDevice = () => {
  const { id, platform } = props.device
  const path = platform === 1 ? `/app/android-remote/${id}` : `/app/ios-remote/${id}`
  window.open(router.resolve(path).href, '_blank')
}

// 上传图片
const beforeAvatarUpload = (file) => {
  const isValid = file.name.endsWith('.jpg') || file.name.endsWith('.png')
  if (!isValid) {
    ElMessage.error('只支持 jpg/png 格式的图片')
    return false
  }
  return true
}

const handleUpload = async (options) => {
  try {
    const formData = new FormData()
    formData.append('file', options.file)
    formData.append('type', 'keepFiles')

    const resp = await uploadFile(formData)
    if (resp.code === 200) {
      await updateDeviceImg({ id: props.device.id, imgUrl: resp.data || resp.url })
      ElMessage.success('图片上传成功')
      emit('flush')
    }
  } catch (error) {
    ElMessage.error('图片上传失败')
  }
}

// 保存设备详情
const handleSaveDetail = async () => {
  try {
    const resp = await saveDeviceDetail({
      id: props.device.id,
      password: props.device.password,
      nickName: props.device.nickName
    })
    if (resp.code === 200) {
      ElMessage.success(resp.msg || '保存成功')
    }
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

// 重启设备
const handleReboot = async () => {
  try {
    const resp = await rebootDevice(props.device.id)
    if (resp.code === 200) {
      ElMessage.success(resp.msg || '重启命令已发送')
    }
  } catch (error) {
    ElMessage.error('重启失败')
  }
}

// 删除设备
const handleDelete = async () => {
  try {
    const resp = await deleteDevice(props.device.id)
    if (resp.code === 200) {
      ElMessage.success(resp.msg || '删除成功')
      emit('flush')
    }
  } catch (error) {
    ElMessage.error('删除失败')
  }
}
</script>

<style scoped>
.device-card {
  height: 100%;
}

.device-card :deep(.el-card__header) {
  padding: 12px 15px;
}

.device-form :deep(.el-form-item) {
  margin-bottom: 8px;
}

.device-form :deep(.el-form-item__label) {
  font-size: 12px;
  color: #909399;
}

.device-form :deep(.el-form-item__content) {
  font-size: 13px;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 160px;
  background: #f5f7fa;
  color: #909399;
  font-size: 30px;
}
</style>
