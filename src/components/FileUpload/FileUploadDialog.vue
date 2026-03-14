<template>
  <el-dialog 
    :title="title" 
    v-model="dialogVisible" 
    width="700px" 
    append-to-body 
    @close="handleClose"
  >
    <!-- 上传区域 -->
    <div class="upload-section">
      <el-upload
        ref="uploadRef"
        :action="uploadAction"
        :multiple="multiple"
        :accept="accept"
        :limit="maxCount"
        :file-list="[]"
        :show-file-list="false"
        :auto-upload="false"
        :before-upload="handleBeforeUpload"
        :on-change="handleChange"
        :on-exceed="handleExceed"
        :headers="uploadHeaders"
        :disabled="uploading"
        drag
        class="upload-dragger"
      >
        <el-icon class="el-icon--upload" size="48">
          <UploadFilled />
        </el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            {{ multiple ? '支持批量上传' : '仅支持单文件上传' }}
            {{ acceptText ? `，支持格式：${acceptText}` : '' }}
            {{ maxSize ? `，单文件最大${maxSize}MB` : '' }}
          </div>
        </template>
      </el-upload>
    </div>

    <!-- 文件列表 -->
    <div v-if="fileList.length > 0" class="file-list-section">
      <div class="file-list-header">
        <span>已选择文件 ({{ fileList.length }})</span>
        <el-button 
          type="danger" 
          size="small" 
          plain 
          @click="clearAllFiles"
          :disabled="uploading"
        >
          清空全部
        </el-button>
      </div>
      
      <transition-group 
        class="file-list el-upload-list el-upload-list--text" 
        name="el-fade-in-linear" 
        tag="ul"
      >
        <li 
          v-for="(file, index) in fileList" 
          :key="file.uid"
          class="el-upload-list__item file-list-item"
          :class="{ 'is-uploading': file.status === 'uploading', 'is-success': file.status === 'success', 'is-error': file.status === 'error' }"
        >
          <div class="file-item-content">
            <div class="file-info">
              <el-icon class="file-icon">
                <Document />
              </el-icon>
              <span class="file-name">{{ file.name }}</span>
              <span class="file-size">{{ formatFileSize(file.size) }}</span>
            </div>
            
            <div class="file-actions">
              <el-tag 
                :type="getStatusType(file.status)" 
                size="small"
                class="file-status"
              >
                {{ getStatusText(file.status) }}
              </el-tag>
              
              <el-button 
                type="danger" 
                size="small" 
                link
                @click="removeFile(index)"
                :disabled="uploading && file.status === 'uploading'"
              >
                删除
              </el-button>
            </div>
          </div>
          
          <!-- 上传进度条 -->
          <el-progress 
            v-if="file.status === 'uploading'" 
            :percentage="file.percentage || 0"
            :stroke-width="2"
            :show-text="false"
          />
        </li>
      </transition-group>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose" :disabled="uploading">取 消</el-button>
        <el-button 
          type="primary" 
          @click="handleBatchUpload"
          :loading="uploading"
          :disabled="fileList.length === 0 || !hasReadyFiles"
        >
          确认上传 ({{ readyFilesCount }})
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { UploadFilled, Document } from '@element-plus/icons-vue'
import { getToken } from "@/utils/auth"
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '文件上传'
  },
  multiple: {
    type: Boolean,
    default: true
  },
  accept: {
    type: String,
    default: '*/*'
  },
  acceptText: {
    type: String,
    default: ''
  },
  maxSize: {
    type: Number,
    default: 50
  },
  maxCount: {
    type: Number,
    default: 100
  },
  uploadApi: {
    type: Function,
    required: true
  },
  fileFieldName: {
    type: String,
    default: 'files'
  }
})

const emit = defineEmits(['update:modelValue', 'upload-success', 'upload-error'])

const uploadRef = ref(null)
const fileList = ref([])
const uploading = ref(false)
const uploadAction = ref('#') // el-upload需要action属性，但我们使用自定义上传
const uploadHeaders = ref({ Authorization: "Bearer " + getToken() })

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const hasReadyFiles = computed(() => {
  return fileList.value.some(file => file.status === 'ready')
})

const readyFilesCount = computed(() => {
  return fileList.value.filter(file => file.status === 'ready').length
})

/** 上传前验证 */
function handleBeforeUpload(file) {
  // 检查文件大小
  if (props.maxSize && file.size > props.maxSize * 1024 * 1024) {
    ElMessage.error(`文件 ${file.name} 大小超过 ${props.maxSize}MB`)
    return false
  }
  
  // 检查文件类型
  if (props.accept !== '*/*' && !isFileTypeAllowed(file)) {
    ElMessage.error(`文件 ${file.name} 格式不支持`)
    return false
  }
  
  // 检查重复文件
  if (fileList.value.some(f => f.name === file.name && f.size === file.size)) {
    ElMessage.warning(`文件 ${file.name} 已存在`)
    return false
  }
  
  return true
}

/** 文件状态改变时的钩子 */
function handleChange(file, uploadFiles) {
  console.log('文件状态改变:', file, uploadFiles)
  
  // 只处理新添加的文件
  if (file.status === 'ready') {
    const fileItem = {
      uid: file.uid,
      file: file.raw,
      name: file.name,
      size: file.size,
      type: file.raw?.type || '',
      status: 'ready',
      percentage: 0
    }
    
    // 单文件模式只保留最后一个
    if (!props.multiple) {
      fileList.value = [fileItem]
    } else {
      // 检查是否已存在（避免重复添加）
      const exists = fileList.value.some(f => f.uid === file.uid)
      if (!exists) {
        fileList.value.push(fileItem)
      }
    }
    
    console.log('添加文件到列表:', fileItem)
  }
}

/** 检查文件类型是否允许 */
function isFileTypeAllowed(file) {
  if (props.accept === '*/*') return true
  
  const acceptTypes = props.accept.split(',').map(type => type.trim())
  return acceptTypes.some(type => {
    if (type.startsWith('.')) {
      return file.name.toLowerCase().endsWith(type.toLowerCase())
    } else if (type.endsWith('/*')) {
      return file.type.startsWith(type.slice(0, -1))
    } else {
      return file.type === type
    }
  })
}

/** 文件数量超限 */
function handleExceed() {
  ElMessage.error(`最多只能上传 ${props.maxCount} 个文件`)
}

/** 移除文件 */
function removeFile(index) {
  fileList.value.splice(index, 1)
}

/** 清空所有文件 */
function clearAllFiles() {
  fileList.value = []
  // 清空 el-upload 的文件列表
  uploadRef.value?.clearFiles()
}

/** 批量上传处理 */
async function handleBatchUpload() {
  const readyFiles = fileList.value.filter(item => item.status === 'ready')
  
  if (readyFiles.length === 0) {
    ElMessage.warning('没有需要上传的文件')
    return
  }
  
  uploading.value = true
  let progressInterval
  
  try {
    // 设置所有待上传文件为上传中状态
    readyFiles.forEach(fileItem => {
      fileItem.status = 'uploading'
      fileItem.percentage = 0
    })
    
    const formData = new FormData()
    
    // 添加所有文件到FormData
    readyFiles.forEach(fileItem => {
      formData.append(props.fileFieldName, fileItem.file, fileItem.file.name)
    })
    
    console.log('开始批量上传，文件数量:', readyFiles.length)
    
    // 模拟上传进度
    progressInterval = setInterval(() => {
      readyFiles.forEach(fileItem => {
        if (fileItem.status === 'uploading' && fileItem.percentage < 90) {
          fileItem.percentage += Math.random() * 20
        }
      })
    }, 200)
    
    // 调用上传API
    const response = await props.uploadApi(formData)
    
    // 清除进度条定时器
    clearInterval(progressInterval)
    
    // 设置所有文件为成功状态
    readyFiles.forEach(fileItem => {
      fileItem.status = 'success'
      fileItem.percentage = 100
    })
    
    // 处理不同的响应格式
    let successFiles = []
    if (response.data && response.data.uploadedFiles) {
      // 批量上传的响应格式
      successFiles = response.data.uploadedFiles.map(uploadedFile => ({
        fileItem: readyFiles.find(f => f.name === uploadedFile.original_name) || readyFiles[0],
        response: {
          ...response,
          data: uploadedFile  // 单个文件的数据
        }
      }))
    } else {
      // 单文件上传的响应格式
      successFiles = readyFiles.map(fileItem => ({ fileItem, response }))
    }
    
    emit('upload-success', successFiles)
    ElMessage.success(`上传成功！共上传 ${readyFiles.length} 个文件`)
    
    // 延迟关闭弹窗，让用户看到成功状态
    setTimeout(() => {
      handleClose()
    }, 1500)
    
  } catch (error) {
    console.error('上传错误:', error)
    
    // 清除进度条定时器
    if (progressInterval) {
      clearInterval(progressInterval)
    }
    
    // 设置所有文件为失败状态
    readyFiles.forEach(fileItem => {
      fileItem.status = 'error'
      fileItem.percentage = 0
    })
    
    const errorFiles = readyFiles.map(fileItem => ({ fileItem, error }))
    emit('upload-error', errorFiles)
    ElMessage.error(`上传失败: ${error.message || '未知错误'}`)
    
  } finally {
    uploading.value = false
  }
}

/** 获取状态类型 */
function getStatusType(status) {
  const statusMap = {
    ready: '',
    uploading: 'warning',
    success: 'success',
    error: 'danger'
  }
  return statusMap[status] || ''
}

/** 获取状态文本 */
function getStatusText(status) {
  const textMap = {
    ready: '待上传',
    uploading: '上传中',
    success: '成功',
    error: '失败'
  }
  return textMap[status] || '未知'
}

/** 格式化文件大小 */
function formatFileSize(size) {
  if (!size) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let index = 0
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index++
  }
  return Math.round(size * 100) / 100 + ' ' + units[index]
}

/** 关闭弹窗 */
function handleClose() {
  if (uploading.value) {
    ElMessageBox.confirm('正在上传中，确定要关闭吗？', '提示').then(() => {
      fileList.value = []
      uploadRef.value?.clearFiles()
      dialogVisible.value = false
    }).catch(() => {})
  } else {
    fileList.value = []
    uploadRef.value?.clearFiles()
    dialogVisible.value = false
  }
}
</script>

<style scoped>
.upload-section {
  margin-bottom: 20px;
}

.upload-dragger {
  width: 100%;
}

.upload-dragger :deep(.el-upload-dragger) {
  width: 100%;
  height: 180px;
}

.file-list-section {
  margin-top: 20px;
}

.file-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 500;
}

.file-list {
  max-height: 300px;
  overflow-y: auto;
}

.file-list-item {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  margin-bottom: 8px;
  padding: 12px;
  transition: all 0.3s;
}

.file-list-item.is-uploading {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.file-list-item.is-success {
  border-color: #67c23a;
  background-color: #f0f9ff;
}

.file-list-item.is-error {
  border-color: #f56c6c;
  background-color: #fef0f0;
}

.file-item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.file-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.file-icon {
  margin-right: 8px;
  color: #606266;
}

.file-name {
  margin-right: 12px;
  font-weight: 500;
  color: #303133;
}

.file-size {
  font-size: 12px;
  color: #909399;
}

.file-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-status {
  margin-right: 8px;
}

.dialog-footer {
  text-align: right;
}
</style>