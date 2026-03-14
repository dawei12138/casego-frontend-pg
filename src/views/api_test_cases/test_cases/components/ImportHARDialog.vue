<template>
  <el-dialog
    v-model="dialogVisible"
    :title="currentStep === 'config' ? '导入 HAR 文件' : '预览导入内容'"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <!-- 步骤1: 配置参数 -->
    <div v-if="currentStep === 'config'" class="import-config">
      <el-form :model="configForm" label-width="100px" class="config-form">
        <!-- 文件上传 -->
        <el-form-item label="HAR 文件">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :file-list="fileList"
            accept=".har"
            drag
            class="upload-dragger"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              拖拽 HAR 文件到此处或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持浏览器导出的 .har 文件（Chrome/Firefox/Edge 开发者工具导出）
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <!-- 目标模块 -->
        <el-form-item label="目标模块">
          <el-tree-select
            v-model="configForm.targetModuleId"
            :data="moduleTreeOptions"
            :props="{ label: 'name', value: 'moduleId' }"
            placeholder="选择目标模块（留空创建新模块）"
            clearable
            check-strictly
            style="width: 100%"
          />
        </el-form-item>

        <!-- 新模块名称 -->
        <el-form-item v-if="!configForm.targetModuleId" label="模块名称">
          <el-input
            v-model="configForm.moduleName"
            :placeholder="defaultModuleName"
            clearable
          />
          <div class="form-tip">留空将自动生成模块名称</div>
        </el-form-item>

        <!-- 过滤选项折叠面板 -->
        <el-divider content-position="left">
          <span class="divider-text" @click="showFilterOptions = !showFilterOptions">
            过滤选项
            <el-icon :class="{ 'is-rotated': showFilterOptions }">
              <CaretRight />
            </el-icon>
          </span>
        </el-divider>

        <el-collapse-transition>
          <div v-show="showFilterOptions" class="filter-options">
            <!-- 过滤静态资源 -->
            <el-form-item label="">
              <el-checkbox v-model="configForm.filterStatic">
                过滤静态资源（图片、CSS、JS、字体等）
              </el-checkbox>
            </el-form-item>

            <!-- 允许的HTTP方法 -->
            <el-form-item label="允许方法">
              <el-checkbox-group v-model="configForm.allowedMethods">
                <el-checkbox label="GET">GET</el-checkbox>
                <el-checkbox label="POST">POST</el-checkbox>
                <el-checkbox label="PUT">PUT</el-checkbox>
                <el-checkbox label="DELETE">DELETE</el-checkbox>
                <el-checkbox label="PATCH">PATCH</el-checkbox>
                <el-checkbox label="HEAD">HEAD</el-checkbox>
                <el-checkbox label="OPTIONS">OPTIONS</el-checkbox>
              </el-checkbox-group>
              <div class="form-tip">不选择表示允许全部方法</div>
            </el-form-item>

            <!-- 域名过滤 -->
            <el-form-item label="域名过滤">
              <el-select
                v-model="configForm.includeDomains"
                multiple
                filterable
                allow-create
                default-first-option
                :reserve-keyword="false"
                placeholder="输入域名后按回车添加（留空表示全部）"
                style="width: 100%"
              >
              </el-select>
              <div class="form-tip">只导入指定域名的请求，留空表示全部</div>
            </el-form-item>

            <!-- URL 关键词过滤 -->
            <el-form-item label="URL关键词">
              <el-select
                v-model="configForm.urlKeywords"
                multiple
                filterable
                allow-create
                default-first-option
                :reserve-keyword="false"
                placeholder="输入关键词后按回车添加（留空表示全部）"
                style="width: 100%"
              >
              </el-select>
              <div class="form-tip">只导入 URL 包含指定关键词的请求，留空表示全部</div>
            </el-form-item>
          </div>
        </el-collapse-transition>

        <!-- 导入选项折叠面板 -->
        <el-divider content-position="left">
          <span class="divider-text" @click="showImportOptions = !showImportOptions">
            导入选项
            <el-icon :class="{ 'is-rotated': showImportOptions }">
              <CaretRight />
            </el-icon>
          </span>
        </el-divider>

        <el-collapse-transition>
          <div v-show="showImportOptions" class="import-options">
            <el-form-item label="导入内容">
              <el-checkbox-group v-model="configForm.importOptions">
                <el-checkbox label="headers">Headers</el-checkbox>
                <el-checkbox label="params">Params</el-checkbox>
                <el-checkbox label="body">请求体</el-checkbox>
                <el-checkbox label="cookies">Cookies</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </div>
        </el-collapse-transition>
      </el-form>
    </div>

    <!-- 步骤2: 预览 -->
    <div v-else class="import-preview">
      <!-- 统计信息 -->
      <div class="preview-info">
        <div class="info-header">
          <el-icon><Document /></el-icon>
          <span class="file-name">{{ previewData.info?.fileName || 'HAR文件' }}</span>
        </div>
        <div class="statistics">
          <span class="stat-item">
            <el-icon><Document /></el-icon>
            {{ previewData.info?.totalApis || 0 }} 个接口
          </span>
          <span class="stat-divider">|</span>
          <span class="stat-item">
            域名: {{ (previewData.info?.domains || []).join(', ') || '无' }}
          </span>
        </div>
        <div class="method-stats">
          <el-tag
            v-for="(count, method) in (previewData.info?.methods || {})"
            :key="method"
            :type="getMethodTagType(method)"
            size="small"
            class="method-stat-tag"
          >
            {{ method }}: {{ count }}
          </el-tag>
        </div>
      </div>

      <!-- 批量操作 -->
      <div class="batch-actions">
        <el-button size="small" @click="handleSelectAll">全选</el-button>
        <el-button size="small" @click="handleSelectNone">全不选</el-button>
        <el-select
          v-model="filterDomain"
          placeholder="按域名筛选"
          clearable
          size="small"
          style="width: 180px; margin-left: 8px"
          @change="handleFilterChange"
        >
          <el-option
            v-for="domain in (previewData.info?.domains || [])"
            :key="domain"
            :label="domain"
            :value="domain"
          />
        </el-select>
        <el-select
          v-model="filterMethod"
          placeholder="按方法筛选"
          clearable
          size="small"
          style="width: 120px; margin-left: 8px"
          @change="handleFilterChange"
        >
          <el-option
            v-for="method in Object.keys(previewData.info?.methods || {})"
            :key="method"
            :label="method"
            :value="method"
          />
        </el-select>
      </div>

      <!-- 接口列表 -->
      <div class="api-list-container">
        <el-checkbox-group v-model="checkedApis">
          <div
            v-for="api in filteredApiList"
            :key="api.id"
            class="api-item"
          >
            <el-checkbox :label="api.id" class="api-checkbox">
              <span class="method-tag" :class="api.method?.toLowerCase()">
                {{ api.method }}
              </span>
              <span class="api-path" :title="api.path">{{ api.path }}</span>
              <span class="api-name">{{ api.name }}</span>
              <el-tag type="success" size="small" class="status-tag">新增</el-tag>
            </el-checkbox>
          </div>
        </el-checkbox-group>
        <el-empty v-if="filteredApiList.length === 0" description="没有匹配的接口" />
      </div>

      <!-- 选中统计 -->
      <div class="selection-info">
        已选择: <strong>{{ checkedApis.length }}</strong> 个接口
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          v-if="currentStep === 'preview'"
          @click="handleBack"
        >
          上一步
        </el-button>
        <el-button
          type="primary"
          :loading="loading"
          @click="handleNext"
        >
          {{ currentStep === 'config' ? '下一步：预览' : '确认导入' }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  UploadFilled,
  CaretRight,
  Document
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  previewHARFromFile,
  importHARFromFile
} from '@/api/api_test_cases/test_cases'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  moduleTreeOptions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:visible', 'import-success'])

// 对话框可见性
const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

// 当前步骤
const currentStep = ref('config')

// 加载状态
const loading = ref(false)

// 显示折叠面板状态
const showFilterOptions = ref(false)
const showImportOptions = ref(true)

// 上传组件引用
const uploadRef = ref()

// 文件列表
const fileList = ref([])
const uploadedFile = ref(null)

// 默认模块名称
const defaultModuleName = computed(() => {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '')
  return `HAR导入_${dateStr}_${timeStr}`
})

// 配置表单
const configForm = ref({
  targetModuleId: null,
  moduleName: '',
  filterStatic: true,
  allowedMethods: [],
  includeDomains: [],
  urlKeywords: [],
  importOptions: ['headers', 'params', 'body', 'cookies']
})

// 预览数据
const previewData = ref({
  info: {},
  rows: []
})

// 勾选的接口
const checkedApis = ref([])

// 筛选条件
const filterDomain = ref('')
const filterMethod = ref('')

// 筛选后的接口列表
const filteredApiList = computed(() => {
  let list = previewData.value.rows || []
  if (filterDomain.value) {
    list = list.filter(api => api.domain === filterDomain.value)
  }
  if (filterMethod.value) {
    list = list.filter(api => api.method === filterMethod.value)
  }
  return list
})

// 获取方法标签类型
const getMethodTagType = (method) => {
  const map = {
    GET: 'success',
    POST: '',
    PUT: 'warning',
    DELETE: 'danger',
    PATCH: 'info'
  }
  return map[method] || 'info'
}

// 处理文件变化
const handleFileChange = (file) => {
  uploadedFile.value = file.raw
  fileList.value = [file]
}

// 处理文件移除
const handleFileRemove = () => {
  uploadedFile.value = null
  fileList.value = []
}

// 全选
const handleSelectAll = () => {
  checkedApis.value = filteredApiList.value.map(api => api.id)
}

// 全不选
const handleSelectNone = () => {
  checkedApis.value = []
}

// 筛选变化时重置选择
const handleFilterChange = () => {
  // 保留仍然在筛选列表中的选择
  const filteredIds = filteredApiList.value.map(api => api.id)
  checkedApis.value = checkedApis.value.filter(id => filteredIds.includes(id))
}

// 生成 selectedApis 参数
const generateSelectedApis = () => {
  const rows = previewData.value.rows || []
  const selected = rows.filter(api => checkedApis.value.includes(api.id))
  if (selected.length === 0) return null
  return selected.map(api => `${api.name}::${api.method}`).join(',')
}

// 下一步/确认导入
const handleNext = async () => {
  if (loading.value) return

  if (currentStep.value === 'config') {
    await handlePreview()
  } else {
    await handleImport()
  }
}

// 预览
const handlePreview = async () => {
  // 验证
  if (!uploadedFile.value) {
    ElMessage.warning('请选择要上传的 HAR 文件')
    return
  }

  loading.value = true

  try {
    const params = {
      targetModuleId: configForm.value.targetModuleId,
      moduleName: configForm.value.moduleName || null,
      filterStatic: configForm.value.filterStatic,
      allowedMethods: configForm.value.allowedMethods.length > 0
        ? configForm.value.allowedMethods.join(',')
        : null,
      includeDomains: configForm.value.includeDomains.length > 0
        ? configForm.value.includeDomains.join(',')
        : null,
      urlKeywords: configForm.value.urlKeywords.length > 0
        ? configForm.value.urlKeywords.join(',')
        : null,
      importHeaders: configForm.value.importOptions.includes('headers'),
      importParams: configForm.value.importOptions.includes('params'),
      importBody: configForm.value.importOptions.includes('body'),
      importCookies: configForm.value.importOptions.includes('cookies')
    }

    const response = await previewHARFromFile(uploadedFile.value, params)

    if (response && response.code === 200) {
      previewData.value = response.data || { info: {}, rows: [] }
      currentStep.value = 'preview'

      // 默认全选
      setTimeout(() => {
        handleSelectAll()
      }, 100)
    } else {
      throw new Error(response?.msg || '预览失败')
    }
  } catch (error) {
    console.error('预览失败:', error)
    ElMessage.error(`预览失败: ${error.message}`)
  } finally {
    loading.value = false
  }
}

// 导入
const handleImport = async () => {
  if (checkedApis.value.length === 0) {
    ElMessage.warning('请至少选择一个接口')
    return
  }

  loading.value = true

  try {
    const params = {
      targetModuleId: configForm.value.targetModuleId,
      moduleName: configForm.value.moduleName || null,
      filterStatic: configForm.value.filterStatic,
      allowedMethods: configForm.value.allowedMethods.length > 0
        ? configForm.value.allowedMethods.join(',')
        : null,
      includeDomains: configForm.value.includeDomains.length > 0
        ? configForm.value.includeDomains.join(',')
        : null,
      urlKeywords: configForm.value.urlKeywords.length > 0
        ? configForm.value.urlKeywords.join(',')
        : null,
      importHeaders: configForm.value.importOptions.includes('headers'),
      importParams: configForm.value.importOptions.includes('params'),
      importBody: configForm.value.importOptions.includes('body'),
      importCookies: configForm.value.importOptions.includes('cookies')
    }

    const selectedApis = generateSelectedApis()
    const response = await importHARFromFile(uploadedFile.value, params, selectedApis)

    if (response && response.code === 200) {
      const data = response.data || {}
      const message = data.moduleCreated
        ? `导入成功：创建模块 "${data.moduleName}"，新增 ${data.apisCreated || 0} 个接口`
        : `导入成功：新增 ${data.apisCreated || 0} 个接口`

      ElMessage.success(message)
      emit('import-success')
      handleClose()
    } else {
      throw new Error(response?.msg || '导入失败')
    }
  } catch (error) {
    console.error('导入失败:', error)
    ElMessage.error(`导入失败: ${error.message}`)
  } finally {
    loading.value = false
  }
}

// 返回上一步
const handleBack = () => {
  currentStep.value = 'config'
}

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false
  resetForm()
}

// 重置表单
const resetForm = () => {
  currentStep.value = 'config'
  configForm.value = {
    targetModuleId: null,
    moduleName: '',
    filterStatic: true,
    allowedMethods: [],
    includeDomains: [],
    urlKeywords: [],
    importOptions: ['headers', 'params', 'body', 'cookies']
  }
  uploadedFile.value = null
  fileList.value = []
  previewData.value = { info: {}, rows: [] }
  checkedApis.value = []
  filterDomain.value = ''
  filterMethod.value = ''
  showFilterOptions.value = false
  showImportOptions.value = true
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
}

// 监听对话框关闭
watch(() => props.visible, (newVal) => {
  if (!newVal) {
    resetForm()
  }
})
</script>

<style scoped>
.import-config {
  padding: 10px 0;
}

.config-form {
  max-width: 100%;
}

.upload-dragger {
  width: 100%;
}

.upload-dragger :deep(.el-upload-dragger) {
  width: 100%;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.divider-text {
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 4px;
  color: #909399;
}

.divider-text:hover {
  color: #409eff;
}

.divider-text .el-icon {
  transition: transform 0.3s;
}

.divider-text .el-icon.is-rotated {
  transform: rotate(90deg);
}

.filter-options,
.import-options {
  padding: 10px 0;
}

/* 预览样式 */
.import-preview {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-info {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
}

.file-name {
  color: #303133;
}

.statistics {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-divider {
  color: #dcdfe6;
}

.method-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.method-stat-tag {
  margin: 0;
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.api-list-container {
  max-height: 350px;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 8px;
}

.api-item {
  padding: 8px 4px;
  border-bottom: 1px solid #f0f0f0;
}

.api-item:last-child {
  border-bottom: none;
}

.api-checkbox {
  display: flex;
  align-items: center;
  width: 100%;
}

.api-checkbox :deep(.el-checkbox__label) {
  display: flex;
  align-items: center;
  flex: 1;
  overflow: hidden;
}

.method-tag {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  min-width: 50px;
  text-align: center;
  margin-right: 8px;
  flex-shrink: 0;
}

.method-tag.get {
  background: #67c23a;
  color: white;
}

.method-tag.post {
  background: #409eff;
  color: white;
}

.method-tag.put {
  background: #e6a23c;
  color: white;
}

.method-tag.delete {
  background: #f56c6c;
  color: white;
}

.method-tag.patch {
  background: #909399;
  color: white;
}

.method-tag.head,
.method-tag.options {
  background: #909399;
  color: white;
}

.api-path {
  font-family: monospace;
  color: #606266;
  font-size: 12px;
  margin-right: 8px;
  max-width: 350px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.api-name {
  color: #909399;
  font-size: 12px;
  flex-shrink: 0;
}

.status-tag {
  margin-left: auto;
  flex-shrink: 0;
}

.selection-info {
  text-align: right;
  font-size: 13px;
  color: #606266;
}

.selection-info strong {
  color: #409eff;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
