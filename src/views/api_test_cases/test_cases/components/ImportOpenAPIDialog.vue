<template>
  <el-dialog
    v-model="dialogVisible"
    :title="currentStep === 'config' ? '导入 OpenAPI/Swagger 接口' : '预览导入内容'"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <!-- 步骤1: 配置参数 -->
    <div v-if="currentStep === 'config'" class="import-config">
      <!-- 数据源选择 -->
      <el-form :model="configForm" label-width="100px" class="config-form">
        <el-form-item label="数据源">
          <el-radio-group v-model="configForm.sourceType">
            <el-radio label="url">URL地址</el-radio>
            <el-radio label="file">文件上传</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- URL输入 -->
        <el-form-item v-if="configForm.sourceType === 'url'" label="URL地址">
          <el-autocomplete
            v-model="configForm.url"
            :fetch-suggestions="queryUrlHistory"
            placeholder="请输入 OpenAPI/Swagger 规范的 URL 地址"
            clearable
            style="width: 100%"
            :trigger-on-focus="true"
            popper-class="openapi-url-suggestions"
          >
            <template #default="{ item }">
              <div class="url-suggestion-item">
                <el-icon class="history-icon"><Clock /></el-icon>
                <span class="url-text">{{ item.value }}</span>
                <el-icon
                  class="delete-icon"
                  @click.stop="handleDeleteHistory(item.value)"
                >
                  <Close />
                </el-icon>
              </div>
            </template>
          </el-autocomplete>
        </el-form-item>

        <!-- 文件上传 -->
        <el-form-item v-else label="上传文件">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :file-list="fileList"
            accept=".json,.yaml,.yml"
            drag
            class="upload-dragger"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              拖拽文件到此处或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 .json / .yaml / .yml 格式
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
            placeholder="一级模块（根目录）"
            clearable
            check-strictly
            style="width: 100%"
          />
        </el-form-item>

        <!-- 高级选项折叠面板 -->
        <el-divider content-position="left">
          <span class="divider-text" @click="showAdvanced = !showAdvanced">
            高级选项
            <el-icon :class="{ 'is-rotated': showAdvanced }">
              <CaretRight />
            </el-icon>
          </span>
        </el-divider>

        <el-collapse-transition>
          <div v-show="showAdvanced" class="advanced-options">
            <!-- 模块策略 -->
            <el-form-item label="模块策略">
              <el-radio-group v-model="configForm.moduleStrategy">
                <el-radio-button label="auto_match">
                  <el-tooltip content="按名称匹配已有模块，不存在则创建新模块" placement="top">
                    <span>自动匹配</span>
                  </el-tooltip>
                </el-radio-button>
                <el-radio-button label="create_all">
                  <el-tooltip content="不匹配已有模块，全部创建为新模块" placement="top">
                    <span>全部创建</span>
                  </el-tooltip>
                </el-radio-button>
                <el-radio-button label="target_only">
                  <el-tooltip content="所有接口都导入到目标模块下" placement="top">
                    <span>仅目标模块</span>
                  </el-tooltip>
                </el-radio-button>
              </el-radio-group>
            </el-form-item>

            <!-- 冲突策略 -->
            <el-form-item label="冲突策略">
              <el-radio-group v-model="configForm.conflictStrategy">
                <el-radio-button label="skip">
                  <el-tooltip content="已存在的接口不做任何处理" placement="top">
                    <span>跳过</span>
                  </el-tooltip>
                </el-radio-button>
                <el-radio-button label="overwrite">
                  <el-tooltip content="删除原有数据后重新创建（断言/前置/后置会删除）" placement="top">
                    <span>覆盖</span>
                  </el-tooltip>
                </el-radio-button>
                <el-radio-button label="smart_merge">
                  <el-tooltip content="只更新有变化的字段，新增不存在的参数（保留断言/前置/后置）" placement="top">
                    <span>智能合并</span>
                  </el-tooltip>
                </el-radio-button>
              </el-radio-group>
            </el-form-item>

            <!-- 导入选项 -->
            <el-form-item label="导入选项">
              <el-checkbox-group v-model="configForm.importOptions">
                <el-checkbox label="headers">Headers</el-checkbox>
                <el-checkbox label="params">Params</el-checkbox>
                <el-checkbox label="body">请求体</el-checkbox>
                <el-checkbox label="cookies">Cookies</el-checkbox>
              </el-checkbox-group>
            </el-form-item>

            <!-- 包含废弃接口 -->
            <el-form-item label="">
              <el-checkbox v-model="configForm.includeDeprecated">
                包含废弃接口
              </el-checkbox>
            </el-form-item>
          </div>
        </el-collapse-transition>
      </el-form>
    </div>

    <!-- 步骤2: 预览 -->
    <div v-else class="import-preview">
      <!-- API 信息 -->
      <div class="preview-info">
        <div class="api-title">
          <el-icon><Document /></el-icon>
          <span>{{ previewData.info?.title || 'API' }}</span>
          <el-tag size="small" type="info">v{{ previewData.info?.version || '1.0' }}</el-tag>
          <el-tag size="small">{{ previewData.info?.openapiVersion || 'OpenAPI' }}</el-tag>
        </div>
        <div class="api-description" v-if="previewData.info?.description">
          {{ previewData.info.description }}
        </div>
        <div class="statistics">
          <span class="stat-item">
            <el-icon><Folder /></el-icon>
            {{ previewData.info?.totalModules || 0 }} 个模块
          </span>
          <span class="stat-item">
            <el-icon><Document /></el-icon>
            {{ previewData.info?.totalApis || 0 }} 个接口
          </span>
          <span class="stat-divider">|</span>
          <span class="stat-item stat-new">
            <el-tag type="success" size="small" effect="plain">新增 {{ previewData.info?.newApis || 0 }}</el-tag>
          </span>
          <span class="stat-item stat-update">
            <el-tag type="warning" size="small" effect="plain">更新 {{ previewData.info?.updateApis || 0 }}</el-tag>
          </span>
        </div>
      </div>

      <!-- 批量操作 -->
      <div class="batch-actions">
        <el-button size="small" @click="handleSelectAll">全选</el-button>
        <el-button size="small" @click="handleSelectNone">全不选</el-button>
        <el-button size="small" @click="handleSelectNew">仅选新增</el-button>
        <el-button size="small" @click="handleSelectUpdate">仅选更新</el-button>
      </div>

      <!-- 预览树 -->
      <div class="preview-tree-container">
        <el-tree
          ref="previewTreeRef"
          :data="previewTreeData"
          :props="previewTreeProps"
          show-checkbox
          node-key="nodeKey"
          :default-expand-all="true"
          @check="handleTreeCheck"
        >
          <template #default="{ node, data }">
            <span class="preview-tree-node">
              <!-- 模块图标 -->
              <span v-if="data.type === 'module'" class="node-icon module-icon">
                <el-icon><Folder /></el-icon>
              </span>
              <!-- API 方法标签 -->
              <span v-else class="method-tag" :class="data.method?.toLowerCase()">
                {{ data.method }}
              </span>

              <!-- 名称 -->
              <span class="node-name">{{ data.name }}</span>

              <!-- 路径（仅接口显示） -->
              <span v-if="data.type === 'api'" class="node-path">{{ data.path }}</span>

              <!-- 状态标签 -->
              <el-tag
                :type="getStatusType(data.status)"
                size="small"
                class="status-tag"
              >
                {{ getStatusText(data.status) }}
              </el-tag>

              <!-- 变更字段提示 -->
              <el-tooltip
                v-if="data.changes && data.changes.length > 0"
                :content="'变更字段: ' + data.changes.join(', ')"
                placement="top"
              >
                <el-icon class="changes-icon"><InfoFilled /></el-icon>
              </el-tooltip>

              <!-- 数量（仅模块显示） -->
              <span v-if="data.type === 'module' && data.count > 0" class="node-count">
                ({{ data.count }})
              </span>
            </span>
          </template>
        </el-tree>
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
  Folder,
  Document,
  InfoFilled,
  Clock,
  Close
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  previewOpenAPIFromUrl,
  previewOpenAPIFromFile,
  importOpenAPIFromUrl,
  importOpenAPIFromFile
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

// 显示高级选项
const showAdvanced = ref(false)

// 上传组件引用
const uploadRef = ref()
const previewTreeRef = ref()

// 文件列表
const fileList = ref([])
const uploadedFile = ref(null)

// localStorage key for URL history
const URL_HISTORY_KEY = 'openapi_import_url_history'
const MAX_HISTORY_COUNT = 10

// 获取 URL 历史记录
const getUrlHistory = () => {
  try {
    const history = localStorage.getItem(URL_HISTORY_KEY)
    return history ? JSON.parse(history) : []
  } catch {
    return []
  }
}

// 保存 URL 到历史记录
const saveUrlToHistory = (url) => {
  if (!url || typeof url !== 'string') return

  const history = getUrlHistory()
  // 移除已存在的相同 URL
  const filteredHistory = history.filter(item => item !== url)
  // 添加到最前面
  filteredHistory.unshift(url)
  // 限制数量
  const limitedHistory = filteredHistory.slice(0, MAX_HISTORY_COUNT)

  localStorage.setItem(URL_HISTORY_KEY, JSON.stringify(limitedHistory))
}

// 删除历史记录中的 URL
const handleDeleteHistory = (url) => {
  const history = getUrlHistory()
  const filteredHistory = history.filter(item => item !== url)
  localStorage.setItem(URL_HISTORY_KEY, JSON.stringify(filteredHistory))
}

// 查询 URL 历史记录（用于 autocomplete）
const queryUrlHistory = (queryString, cb) => {
  const history = getUrlHistory()
  const results = queryString
    ? history.filter(url => url.toLowerCase().includes(queryString.toLowerCase()))
    : history
  cb(results.map(url => ({ value: url })))
}

// 配置表单
const configForm = ref({
  sourceType: 'file',
  url: '',
  targetModuleId: null,
  moduleStrategy: 'auto_match',
  conflictStrategy: 'smart_merge',
  importOptions: ['headers', 'params', 'body', 'cookies'],
  includeDeprecated: false
})

// 预览数据
const previewData = ref({
  info: {},
  rows: []
})

// 预览树配置
const previewTreeProps = {
  children: 'children',
  label: 'name'
}

// 将预览数据转换为树形结构
const previewTreeData = computed(() => {
  return transformPreviewData(previewData.value.rows || [])
})

// 转换预览数据为树形结构
const transformPreviewData = (rows) => {
  return rows.map((module, moduleIndex) => {
    const moduleNode = {
      nodeKey: `module_${moduleIndex}_${module.name}`,
      name: module.name,
      type: 'module',
      status: module.status,
      moduleId: module.moduleId,
      matchedModuleId: module.matchedModuleId,
      count: module.count || (module.testCases?.length || 0),
      children: []
    }

    // 添加接口作为子节点
    if (module.testCases && module.testCases.length > 0) {
      moduleNode.children = module.testCases.map((api, apiIndex) => ({
        nodeKey: `api_${moduleIndex}_${apiIndex}_${module.name}::${api.name}::${api.method}`,
        name: api.name,
        method: api.method,
        path: api.path,
        type: 'api',
        status: api.status,
        caseId: api.caseId,
        matchedCaseId: api.matchedCaseId,
        changes: api.changes || [],
        moduleName: module.name
      }))
    }

    return moduleNode
  })
}

// 获取状态类型
const getStatusType = (status) => {
  const map = { new: 'success', match: 'warning', skip: 'info' }
  return map[status] || 'info'
}

// 获取状态文字
const getStatusText = (status) => {
  const map = { new: '新增', match: '更新', skip: '跳过' }
  return map[status] || status
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
  if (previewTreeRef.value) {
    const allKeys = getAllNodeKeys(previewTreeData.value)
    previewTreeRef.value.setCheckedKeys(allKeys)
  }
}

// 全不选
const handleSelectNone = () => {
  if (previewTreeRef.value) {
    previewTreeRef.value.setCheckedKeys([])
  }
}

// 仅选新增
const handleSelectNew = () => {
  if (previewTreeRef.value) {
    const newKeys = getNodeKeysByStatus(previewTreeData.value, 'new')
    previewTreeRef.value.setCheckedKeys(newKeys)
  }
}

// 仅选更新
const handleSelectUpdate = () => {
  if (previewTreeRef.value) {
    const updateKeys = getNodeKeysByStatus(previewTreeData.value, 'match')
    previewTreeRef.value.setCheckedKeys(updateKeys)
  }
}

// 获取所有节点key
const getAllNodeKeys = (nodes) => {
  const keys = []
  const traverse = (nodeList) => {
    nodeList.forEach(node => {
      keys.push(node.nodeKey)
      if (node.children && node.children.length > 0) {
        traverse(node.children)
      }
    })
  }
  traverse(nodes)
  return keys
}

// 根据状态获取节点key
const getNodeKeysByStatus = (nodes, status) => {
  const keys = []
  const traverse = (nodeList) => {
    nodeList.forEach(node => {
      if (node.status === status) {
        keys.push(node.nodeKey)
      }
      if (node.children && node.children.length > 0) {
        traverse(node.children)
      }
    })
  }
  traverse(nodes)
  return keys
}

// 处理树节点勾选
const handleTreeCheck = () => {
  // 可以在这里添加勾选后的逻辑
}

// 生成选中参数
const generateSelectedParams = () => {
  if (!previewTreeRef.value) {
    return { selectedModules: null, selectedApis: null }
  }

  const checkedNodes = previewTreeRef.value.getCheckedNodes()
  const selectedModules = []
  const selectedApis = []

  checkedNodes.forEach(node => {
    if (node.type === 'module') {
      selectedModules.push(node.name)
    } else if (node.type === 'api') {
      // 格式: 模块名::接口名::方法
      selectedApis.push(`${node.moduleName}::${node.name}::${node.method}`)
    }
  })

  return {
    selectedModules: selectedModules.length > 0 ? selectedModules.join(',') : null,
    selectedApis: selectedApis.length > 0 ? selectedApis.join(',') : null
  }
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
  if (configForm.value.sourceType === 'url') {
    if (!configForm.value.url) {
      ElMessage.warning('请输入 OpenAPI/Swagger 规范的 URL 地址')
      return
    }
  } else {
    if (!uploadedFile.value) {
      ElMessage.warning('请选择要上传的文件')
      return
    }
  }

  loading.value = true

  try {
    const params = {
      targetModuleId: configForm.value.targetModuleId,
      moduleStrategy: configForm.value.moduleStrategy,
      conflictStrategy: configForm.value.conflictStrategy,
      includeDeprecated: configForm.value.includeDeprecated
    }

    let response
    if (configForm.value.sourceType === 'url') {
      params.url = configForm.value.url
      response = await previewOpenAPIFromUrl(params)
    } else {
      response = await previewOpenAPIFromFile(uploadedFile.value, params)
    }

    if (response && response.code === 200) {
      previewData.value = response.data || { info: {}, rows: [] }
      currentStep.value = 'preview'

      // 预览成功后保存 URL 到历史记录
      if (configForm.value.sourceType === 'url' && configForm.value.url) {
        saveUrlToHistory(configForm.value.url)
      }

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
  loading.value = true

  try {
    const params = {
      targetModuleId: configForm.value.targetModuleId,
      moduleStrategy: configForm.value.moduleStrategy,
      conflictStrategy: configForm.value.conflictStrategy,
      includeDeprecated: configForm.value.includeDeprecated,
      importHeaders: configForm.value.importOptions.includes('headers'),
      importParams: configForm.value.importOptions.includes('params'),
      importBody: configForm.value.importOptions.includes('body'),
      importCookies: configForm.value.importOptions.includes('cookies')
    }

    const selectedParams = generateSelectedParams()

    let response
    if (configForm.value.sourceType === 'url') {
      params.url = configForm.value.url
      response = await importOpenAPIFromUrl(params, selectedParams)
    } else {
      response = await importOpenAPIFromFile(uploadedFile.value, params, selectedParams)
    }

    if (response && response.code === 200) {
      const data = response.data || {}
      ElMessage.success(
        `导入成功：创建 ${data.modulesCreated || 0} 个模块，` +
        `新增 ${data.apisCreated || 0} 个接口，` +
        `更新 ${data.apisUpdated || 0} 个接口，` +
        `跳过 ${data.apisSkipped || 0} 个接口`
      )
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
    sourceType: 'file',
    url: '',
    targetModuleId: null,
    moduleStrategy: 'auto_match',
    conflictStrategy: 'smart_merge',
    importOptions: ['headers', 'params', 'body', 'cookies'],
    includeDeprecated: false
  }
  uploadedFile.value = null
  fileList.value = []
  previewData.value = { info: {}, rows: [] }
  showAdvanced.value = false
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
  max-width: 600px;
}

.upload-dragger {
  width: 100%;
}

.upload-dragger :deep(.el-upload-dragger) {
  width: 100%;
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

.advanced-options {
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

.api-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
}

.api-description {
  color: #606266;
  font-size: 13px;
  margin-bottom: 12px;
}

.statistics {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #606266;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-divider {
  color: #dcdfe6;
}

.batch-actions {
  display: flex;
  gap: 8px;
}

.preview-tree-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 8px;
}

.preview-tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.node-icon {
  display: flex;
  align-items: center;
}

.module-icon {
  color: #e6a23c;
}

.method-tag {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  min-width: 50px;
  text-align: center;
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

.node-name {
  font-weight: 500;
}

.node-path {
  color: #909399;
  font-size: 12px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-tag {
  margin-left: auto;
}

.changes-icon {
  color: #909399;
  cursor: help;
}

.node-count {
  color: #909399;
  font-size: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* URL 历史记录下拉样式 */
.url-suggestion-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 4px 0;
}

.url-suggestion-item .history-icon {
  color: #909399;
  flex-shrink: 0;
}

.url-suggestion-item .url-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.url-suggestion-item .delete-icon {
  color: #909399;
  flex-shrink: 0;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s, color 0.2s;
}

.url-suggestion-item:hover .delete-icon {
  opacity: 1;
}

.url-suggestion-item .delete-icon:hover {
  color: #f56c6c;
}
</style>
