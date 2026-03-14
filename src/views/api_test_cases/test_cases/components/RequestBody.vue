<template>
  <div class="request-body">
    <div class="body-header">
      <el-radio-group v-model="bodyType" @change="handleBodyTypeChange">
        <el-radio-button value="NONE">NONE</el-radio-button>
        <el-radio-button value="Form_Data">Form Data</el-radio-button>
        <el-radio-button value="x_www_form_urlencoded">x-www-form-urlencoded</el-radio-button>
        <el-radio-button value="JSON">JSON</el-radio-button>
        <el-radio-button value="XML">XML</el-radio-button>
        <el-radio-button value="Raw">Raw</el-radio-button>
        <el-radio-button value="Binary">Binary</el-radio-button>
      </el-radio-group>
    </div>
    
    <div class="body-content">
      <!-- NONE - 空状态 -->
      <div v-if="bodyType === 'NONE'" class="none-content">
        <el-empty description="未选择请求体类型" />
      </div>
      
      <!-- Form Data 和 x-www-form-urlencoded - 键值对表格 -->
      <div v-else-if="bodyType === 'Form_Data' || bodyType === 'x_www_form_urlencoded'" class="form-data-content">
        <div class="form-data-header">
          <el-button size="small" type="primary" @click="addFormItem">
            <el-icon><Plus /></el-icon>
            添加参数
          </el-button>
          <el-button size="small" @click="openBulkEdit">
            <el-icon><Edit /></el-icon>
            批量编辑
          </el-button>
        </div>
        
        <el-table :data="filteredDisplayFormDataList" style="width: 100%" max-height="300">
          <el-table-column width="50">
            <template #header>
              <el-checkbox
                v-model="allFormSelected"
                :indeterminate="isFormIndeterminate"
                @change="handleSelectAllForm"
              />
            </template>
            <template #default="{ row, $index }">
              <el-checkbox
                :model-value="row.isRun === true || row.isRun === 1"
                @change="(value) => handleFormCheckboxChange(row, value)"
              />
            </template>
          </el-table-column>
          
          <el-table-column label="键名" width="160">
            <template #default="{ row, $index }">
              <el-input
                v-model="row.key"
                placeholder="键名"
                size="small"
                :class="{ 'error-input': !row.key && (row.value || row.description) }"
              />
            </template>
          </el-table-column>
          
          <el-table-column label="键值" min-width="200">
            <template #default="{ row, $index }">
              <div class="value-cell">
                <el-input
                  v-if="row.dataType !== 'file'"
                  v-model="row.value"
                  placeholder="键值"
                  size="small"
                />
                <div v-else class="file-value-container-vertical">
                   <div class="file-display-area-vertical">
                     <div v-if="row.selectedFiles && row.selectedFiles.length > 0" class="selected-files-vertical">
                       <div
                         v-for="(file, fileIndex) in row.selectedFiles"
                         :key="file.id"
                         class="file-item-vertical"
                       >
                         <el-button
                           size="small"
                           type="danger"
                           :icon="Delete"
                           circle
                           @click="removeSelectedFile(row, fileIndex)"
                           class="file-delete-button"
                         />
                         <span class="file-name-display">{{ file.originalName }}</span>
                       </div>
                     </div>
                     <span v-else class="no-files-placeholder-vertical">请选择文件</span>
                   </div>
                   <el-button
                     size="small"
                     type="primary"
                     @click="openFileManager(row)"
                     class="select-button-vertical"
                   >
                     选择文件
                   </el-button>
                 </div>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="数据类型" width="120">
            <template #default="{ row, $index }">
              <el-select
                v-model="row.dataType"
                placeholder="类型"
                size="small"
                style="width: 100%"
                @change="(value) => handleDataTypeChange(row, value)"
              >
                <el-option
                  v-for="type in filteredDataTypeOptions"
                  :key="type.value"
                  :label="type.label"
                  :value="type.value"
                />
              </el-select>
            </template>
          </el-table-column>
          
          <el-table-column label="必填" width="60">
            <template #default="{ row, $index }">
              <el-tooltip
                :content="row.isRequired === 1 ? '必填项' : '非必填项'"
                placement="right"
              >
                <el-button
                  text
                  size="small"
                  @click="toggleRequired(row)"
                  class="required-btn"
                >
                  <span 
                    class="required-star"
                    :class="{ 'is-required': row.isRequired === 1 }"
                  >
                    *
                  </span>
                </el-button>
              </el-tooltip>
            </template>
          </el-table-column>
          
          <el-table-column label="描述" width="140">
            <template #default="{ row, $index }">
              <el-input
                v-model="row.description"
                placeholder="描述"
                size="small"
              />
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="80">
            <template #default="{ row, $index }">
              <el-button
                size="small"
                text
                type="danger"
                @click="removeFormItem(row)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <!-- JSON, XML, Raw - Monaco Editor 文本编辑器 -->
      <div v-else-if="['JSON', 'XML', 'Raw'].includes(bodyType)" class="text-editor">
        <!-- 工具栏 -->
        <div class="editor-toolbar json-toolbar">
          <div class="left-actions">
            <el-button size="small" @click="formatJsonEditor" v-if="bodyType === 'JSON'">格式化</el-button>
            <el-button size="small" @click="compressJsonEditor" v-if="bodyType === 'JSON'">压缩</el-button>
            <el-button size="small" @click="convertToXml" v-if="bodyType === 'JSON'">转XML</el-button>
            <el-button size="small" @click="formatXmlEditor" v-if="bodyType === 'XML'">格式化</el-button>
            <el-button size="small" @click="convertToJson" v-if="bodyType === 'XML'">转JSON</el-button>
            <el-button size="small" @click="clearJsonEditor">清空</el-button>
          </div>
          <div class="right-actions">
            <!-- 错误提示 -->
            <el-tooltip
              v-if="hasValidationError"
              :content="`${validationErrors.length} 个错误`"
              placement="top"
            >
              <el-button
                size="small"
                type="danger"
                circle
                @click="jumpToError(validationErrors[0])"
              >
                <el-icon><WarningFilled /></el-icon>
              </el-button>
            </el-tooltip>
            <el-button size="small" :icon="isEditorFullscreen ? Close : FullScreen" @click="toggleEditorFullscreen">
              {{ isEditorFullscreen ? '退出全屏' : '全屏' }}
            </el-button>
          </div>
        </div>

        <!-- Monaco Editor 容器 -->
        <div class="monaco-editor-wrapper" :class="{ 'is-fullscreen': isEditorFullscreen }">
          <div v-if="isEditorFullscreen" class="monaco-fullscreen-toolbar">
            <el-button size="small" :icon="Close" @click="toggleEditorFullscreen">
              退出全屏
            </el-button>
          </div>
          <div class="monaco-editor-container" :ref="setMonacoEditorRef"></div>
        </div>

        <!-- 错误列表 -->
        <div v-if="validationErrors.length > 0" class="error-list">
          <div
            v-for="(error, index) in validationErrors"
            :key="index"
            class="error-item"
            @click="jumpToError(error)"
          >
            <el-icon class="error-icon"><WarningFilled /></el-icon>
            <span class="error-line">第 {{ error.line }} 行:</span>
            <span class="error-message">{{ error.message }}</span>
          </div>
        </div>
      </div>
      
      <!-- Binary - 文件上传 -->
      <div v-else-if="bodyType === 'Binary'" class="binary-file-upload">
        <div class="binary-file-container">
          <div class="binary-file-display">
            <div v-if="binaryFileConfig" class="selected-binary-file">
              <el-tag
                closable
                size="large"
                @close="clearBinaryFile"
                class="binary-file-tag"
              >
                {{ binaryFileConfig.fileName }}
              </el-tag>
              <div class="file-info">
                <span class="file-size">大小: {{ formatFileSize(binaryFileConfig.fileSize) }}</span>
                <span class="file-type">类型: {{ binaryFileConfig.mimeType }}</span>
              </div>
            </div>
            <div v-else class="no-binary-file">
              <el-icon class="upload-icon"><UploadFilled /></el-icon>
              <span>请选择文件</span>
            </div>
          </div>
          <el-button
            type="primary"
            @click="openBinaryFileManager"
            class="binary-select-button"
          >
            {{ binaryFileConfig ? '重新选择' : '选择文件' }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 文件管理对话框 -->
    <FileManagerDialog
      v-model="fileManagerVisible"
      :allow-multiple="true"
      @save="handleFileManagerSave"
    />
    
    <!-- Binary文件管理对话框 -->
    <FileManagerDialog
      v-model="binaryFileManagerVisible"
      :allow-multiple="false"
      @save="handleBinaryFileManagerSave"
    />

    <!-- 批量编辑弹窗 -->
    <BulkEditDialog
      v-model="bulkEditVisible"
      :title="bodyType === 'Form_Data' ? '批量编辑 Form Data' : '批量编辑 x-www-form-urlencoded'"
      :data="formDataList"
      @confirm="handleBulkEditConfirm"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick, onUnmounted, onBeforeUnmount, toRaw } from 'vue'

// Monaco Editor imports（从全局配置导入，确保 Worker 已配置）
import { monaco } from '@/utils/monaco-setup'

import { UploadFilled, Delete, Plus, ArrowUp, ArrowDown, Close, WarningFilled, FullScreen, Edit } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import FileManagerDialog from '@/components/FileUpload/FileManagerDialog.vue'
import BulkEditDialog from './BulkEditDialog.vue'

// 使用普通 Map 存储 Monaco 实例，避免 Vue 响应式代理导致卡死
let monacoEditorInstance = null
let monacoEditorContainer = null

// Props
const props = defineProps({
  jsonData: {
    type: [String, Object],
    default: ''
  },
  formdata: {
    type: Array,
    default: () => []
  },
  filePath: {
    type: String,
    default: ''
  },
  caseFileConfig: {
    type: Object,
    default: null
  },
  requestType: {
    type: String,
    default: 'NONE'
  },
  bodyType: {
    type: String,
    default: 'NONE'
  },
  caseId: {
    type: [Number, String],
    default: null
  }
})

// Form Data专用的数据类型选项（包含file类型）
const dataTypeOptions = [
  { label: '字符串', value: 'string' },
  { label: '整数', value: 'integer' },
  { label: '布尔值', value: 'boolean' },
  { label: '数字', value: 'number' },
  { label: '数组', value: 'array' },
  { label: '文件', value: 'file' }
]

// 响应式数据
const bodyType = ref('NONE')
const textData = ref('')
const monacoContainerRef = ref(null) // Monaco Editor 容器引用
const isEditorFullscreen = ref(false)

// Monaco Editor 错误状态
const validationErrors = ref([])
const hasValidationError = computed(() => validationErrors.value.length > 0)

// 获取 Monaco 语言模式
const getMonacoLanguage = (type) => {
  switch (type) {
    case 'JSON':
      return 'json'
    case 'XML':
      return 'xml'
    case 'Raw':
    default:
      return 'plaintext'
  }
}

// 初始化 Monaco Editor
const initMonacoEditor = () => {
  if (!monacoContainerRef.value || monacoEditorInstance) return

  monacoEditorContainer = monacoContainerRef.value

  monacoEditorInstance = monaco.editor.create(monacoContainerRef.value, {
    value: textData.value || '',
    language: getMonacoLanguage(bodyType.value),
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: true },
    fontSize: 14,
    tabSize: 2,
    insertSpaces: true,
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    renderWhitespace: 'selection',
    bracketPairColorization: { enabled: true },
    folding: true,
    foldingStrategy: 'indentation',
    // 错误标记在滚动条上显示
    overviewRulerLanes: 3,
    overviewRulerBorder: false,
    scrollbar: {
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10
    }
  })

  // 监听内容变化
  monacoEditorInstance.onDidChangeModelContent(() => {
    const rawEditor = toRaw(monacoEditorInstance)
    textData.value = rawEditor.getValue()
    // 验证内容
    validateContent()
  })

  // 初始验证
  validateContent()
}

// 销毁 Monaco Editor
const destroyMonacoEditor = () => {
  if (monacoEditorInstance) {
    try {
      toRaw(monacoEditorInstance).dispose()
    } catch (e) {
      // 忽略销毁时的错误
    }
    monacoEditorInstance = null
    monacoEditorContainer = null
  }
}

// 切换全屏
const toggleEditorFullscreen = () => {
  isEditorFullscreen.value = !isEditorFullscreen.value
  nextTick(() => {
    if (monacoEditorInstance) {
      setTimeout(() => {
        toRaw(monacoEditorInstance).layout()
      }, 50)
    }
  })
}

// 设置编辑器引用
const setMonacoEditorRef = (el) => {
  if (!el) return

  // 如果容器变化了，需要重新创建编辑器
  if (monacoEditorContainer && monacoEditorContainer !== el) {
    destroyMonacoEditor()
  }

  monacoContainerRef.value = el

  if (!monacoEditorInstance) {
    nextTick(() => {
      initMonacoEditor()
    })
  }
}

// 验证内容并设置错误标记
const validateContent = () => {
  if (!monacoEditorInstance) return

  const rawEditor = toRaw(monacoEditorInstance)
  const model = rawEditor.getModel()
  if (!model) return

  const content = rawEditor.getValue()
  const markers = []
  validationErrors.value = []

  if (bodyType.value === 'JSON' && content && content.trim()) {
    try {
      // 预处理：将 {{...}} 模板语法替换为 null，以忽略这种特殊用法的验证错误
      // 这是系统的函数替换语法，不应该被视为 JSON 错误
      const processedContent = content.replace(/\{\{[^}]*\}\}/g, 'null')
      JSON.parse(processedContent)
    } catch (e) {
      // 解析错误位置
      const match = e.message.match(/position (\d+)/)
      const pos = match ? parseInt(match[1]) : 0
      const position = model.getPositionAt(pos)

      const error = {
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: position.lineNumber,
        endColumn: position.column + 1,
        message: e.message,
        severity: monaco.MarkerSeverity.Error
      }
      markers.push(error)
      validationErrors.value.push({
        line: position.lineNumber,
        message: e.message
      })
    }
  } else if (bodyType.value === 'XML' && content && content.trim()) {
    try {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(content, 'application/xml')
      const parserError = xmlDoc.querySelector('parsererror')

      if (parserError) {
        const errorText = parserError.textContent
        const lineMatch = errorText.match(/line (\d+)/)
        const line = lineMatch ? parseInt(lineMatch[1]) : 1
        const colMatch = errorText.match(/column (\d+)/)
        const col = colMatch ? parseInt(colMatch[1]) : 1

        const error = {
          startLineNumber: line,
          startColumn: col,
          endLineNumber: line,
          endColumn: col + 10,
          message: errorText.split('\n')[0] || 'XML 格式错误',
          severity: monaco.MarkerSeverity.Error
        }
        markers.push(error)
        validationErrors.value.push({
          line: line,
          message: errorText.split('\n')[0] || 'XML 格式错误'
        })
      }
    } catch (e) {
      const error = {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 2,
        message: e.message,
        severity: monaco.MarkerSeverity.Error
      }
      markers.push(error)
      validationErrors.value.push({
        line: 1,
        message: e.message
      })
    }
  }

  // 设置错误标记
  monaco.editor.setModelMarkers(model, 'validation', markers)
}

// 跳转到错误位置
const jumpToError = (error) => {
  if (!monacoEditorInstance) return
  const rawEditor = toRaw(monacoEditorInstance)
  rawEditor.revealLineInCenter(error.line)
  rawEditor.setPosition({ lineNumber: error.line, column: 1 })
  rawEditor.focus()
}

const formDataList = ref([])
const binaryFilePath = ref(props.filePath || '')
const binaryFileConfig = ref(props.caseFileConfig || null)
const fileList = ref([])
const fileInputRef = ref(null)
const currentFileRow = ref(null)
const fileManagerVisible = ref(false)
const currentFormDataRow = ref(null)
const binaryFileManagerVisible = ref(false)

// 批量编辑弹窗可见性
const bulkEditVisible = ref(false)

// 计算属性：只显示未删除的FormData项
const displayFormDataList = computed(() => {
  return formDataList.value.filter(item => item.delFlag !== '1')
})

// 过滤显示列表，在x-www-form-urlencoded模式下隐藏文件类型行
const filteredDisplayFormDataList = computed(() => {
  if (bodyType.value === 'x_www_form_urlencoded') {
    return displayFormDataList.value.filter(item => item.dataType !== 'file')
  }
  return displayFormDataList.value
})

// 检查是否允许文件上传（x-www-form-urlencoded不允许）
const allowFileUpload = computed(() => {
  return bodyType.value === 'Form_Data'
})

// 过滤数据类型选项，当bodyType为x-www-form-urlencoded时隐藏file类型
const filteredDataTypeOptions = computed(() => {
  if (bodyType.value === 'x_www_form_urlencoded') {
    return dataTypeOptions.filter(option => option.value !== 'file')
  }
  return dataTypeOptions
})

// 检查是否应该显示文件类型行
const shouldShowFileRows = computed(() => {
  return bodyType.value !== 'x_www_form_urlencoded'
})

// 新增：处理JSON数据格式化的工具函数
const formatJsonData = (data) => {
  if (!data) return ''
  
  if (typeof data === 'string') {
    try {
      // 尝试解析字符串，如果是有效JSON则格式化显示
      const parsed = JSON.parse(data)
      return JSON.stringify(parsed, null, 2)
    } catch {
      // 如果不是有效JSON，直接返回字符串
      return data
    }
  } else if (typeof data === 'object') {
    // 如果是对象，格式化为JSON字符串
    return JSON.stringify(data, null, 2)
  }
  
  return String(data)
}

// 新增：解析文本数据为对象
const parseJsonData = (text) => {
  if (!text || text.trim() === '') return null
  
  try {
    return JSON.parse(text)
  } catch (error) {
    console.warn('Invalid JSON format:', error)
    return text // 如果解析失败，返回原始字符串
  }
}

// 初始化数据
const initializeData = () => {
  console.log('Initializing data with props:', props)

  // 正确处理jsonData，无论是字符串还是对象
  if (props.jsonData) {
    textData.value = formatJsonData(props.jsonData)
  }

  if (props.formdata && Array.isArray(props.formdata)) {
    formDataList.value = props.formdata.map(item => {
      const formItem = {
        formdataId: item.formdataId || null,
        caseId: item.caseId || props.caseId,
        key: item.key || '',
        value: item.value || '',
        description: item.description || '',
        dataType: item.dataType || 'string',
        isRequired: item.isRequired || 0,
        filePath: null,
        selectedFiles: [],
        isRun: item.isRun === true || item.isRun === 1 ? 1 : 0,
        sortNo: item.sortNo || 1,
        delFlag: item.delFlag || '0',
        createBy: item.createBy,
        updateBy: item.updateBy,
        createTime: item.createTime,
        updateTime: item.updateTime,
        remark: item.remark
      }

      // 如果是文件类型且有formFileConfig，从中初始化selectedFiles
      if (formItem.dataType === 'file' && item.formFileConfig && Array.isArray(item.formFileConfig)) {
        formItem.selectedFiles = item.formFileConfig.map(fileConfig => ({
          fileId: fileConfig.fileId,
          originalName: fileConfig.fileName,
          fileUrl: fileConfig.filePath,
          mimeType: fileConfig.mimeType,
          fileSize: fileConfig.fileSize
        }))

        // 更新value字段显示文件名
        const fileNames = formItem.selectedFiles.map(file => file.originalName).join(', ')
        formItem.value = fileNames
      }

      return formItem
    })
  } else {
    formDataList.value = []
  }

  binaryFilePath.value = props.filePath || ''
  binaryFileConfig.value = props.caseFileConfig || null

  const backendRequestType = props.requestType || props.bodyType
  if (backendRequestType && backendRequestType !== 'NONE') {
    bodyType.value = backendRequestType
  } else {
    bodyType.value = 'NONE'
  }

  // 如果是编辑器类型，更新编辑器内容
  if (['JSON', 'XML', 'Raw'].includes(bodyType.value) && monacoEditorInstance) {
    const rawEditor = toRaw(monacoEditorInstance)
    rawEditor.setValue(textData.value || '')
    // 更新语言模式
    const model = rawEditor.getModel()
    if (model) {
      monaco.editor.setModelLanguage(model, getMonacoLanguage(bodyType.value))
    }
    validateContent()
  }
}

// Form Data 全选状态
const allFormSelected = computed({
  get() {
    const validItems = filteredDisplayFormDataList.value.filter(item => item.key)
    if (validItems.length === 0) return false
    return validItems.every(item => item.isRun === true || item.isRun === 1)
  },
  set(value) {}
})

const isFormIndeterminate = computed(() => {
  const validItems = filteredDisplayFormDataList.value.filter(item => item.key)
  if (validItems.length === 0) return false
  const checkedCount = validItems.filter(item => item.isRun === true || item.isRun === 1).length
  return checkedCount > 0 && checkedCount < validItems.length
})

// 方法
const handleBodyTypeChange = () => {
  console.log('Body type changed to:', bodyType.value)
}

const addFormItem = () => {
  const newItem = {
    caseId: props.caseId,
    key: '',
    value: '',
    description: '',
    dataType: 'string',
    isRequired: 0,
    selectedFiles: [],
    isRun: 1,
    sortNo: getNextSortNo(),
    delFlag: '0',
    createBy: null,
    updateBy: null,
    createTime: null,
    updateTime: null,
    remark: null,
    isNew: true
  }
  formDataList.value.push(newItem)
}

const removeFormItem = (item) => {
  if (item.isNew && !item.formdataId) {
    const index = formDataList.value.findIndex(formItem => formItem === item)
    if (index > -1) {
      formDataList.value.splice(index, 1)
    }
  } else {
    item.delFlag = '1'
  }
  ElMessage.success('表单项已删除')
}

// 处理数据类型变化
const handleDataTypeChange = (row, newType) => {
  if (newType !== 'file') {
    // 如果不是文件类型，清空文件相关数据
    row.selectedFiles = []
    row.value = ''
  } else {
    // 如果切换为文件类型，初始化文件相关字段
    row.value = ''
    if (!row.selectedFiles) {
      row.selectedFiles = []
    }
  }
}

// 监听bodyType变化，处理编辑器激活和文件类型数据
watch(bodyType, (newType, oldType) => {
  console.log('bodyType changed from', oldType, 'to', newType)

  if (newType === 'x_www_form_urlencoded') {
    console.log('切换到x-www-form-urlencoded模式，隐藏文件类型行')
  } else if (oldType === 'x_www_form_urlencoded' && newType === 'Form_Data') {
    console.log('切换到Form_Data模式，显示文件类型行')
  }

  // 当切换到编辑器类型时，更新 Monaco Editor
  if (['JSON', 'XML', 'Raw'].includes(newType)) {
    nextTick(() => {
      if (monacoEditorInstance) {
        const rawEditor = toRaw(monacoEditorInstance)
        // 更新语言模式
        const model = rawEditor.getModel()
        if (model) {
          monaco.editor.setModelLanguage(model, getMonacoLanguage(newType))
        }
        rawEditor.layout()
        validateContent()
      }
    })
  } else {
    // 离开编辑器模式时销毁编辑器
    destroyMonacoEditor()
  }
})

// 打开文件管理器
const openFileManager = (row) => {
  currentFormDataRow.value = row
  fileManagerVisible.value = true
}

// 处理文件选择保存
const handleFileManagerSave = (selectedFiles) => {
  if (currentFormDataRow.value && selectedFiles) {
    const files = Array.isArray(selectedFiles) ? selectedFiles : [selectedFiles]
    
    // 确保selectedFiles数组存在
    if (!currentFormDataRow.value.selectedFiles) {
      currentFormDataRow.value.selectedFiles = []
    }
    
    // 合并新选择的文件（支持多次选择）
    currentFormDataRow.value.selectedFiles = [...currentFormDataRow.value.selectedFiles, ...files]
    
    // 在键值列显示文件名
    const fileNames = currentFormDataRow.value.selectedFiles.map(file => file.originalName).join(', ')
    currentFormDataRow.value.value = fileNames
    
    ElMessage.success(`已选择 ${files.length} 个文件，当前共 ${currentFormDataRow.value.selectedFiles.length} 个文件`)
  }
  fileManagerVisible.value = false
  currentFormDataRow.value = null
}

// 删除选中的文件
const removeSelectedFile = (row, fileIndex) => {
  if (row.selectedFiles && row.selectedFiles.length > fileIndex) {
    row.selectedFiles.splice(fileIndex, 1)
    
    // 更新键值列显示
    const fileNames = row.selectedFiles.map(file => file.originalName).join(', ')
    row.value = fileNames
    
    ElMessage.success('文件已删除')
  }
}

const getNextSortNo = () => {
  const validItems = formDataList.value.filter(item => item.delFlag !== '1')
  const maxSort = Math.max(0, ...validItems.map(item => item.sortNo || 0))
  return maxSort + 1
}

const handleFormCheckboxChange = (row, value) => {
  row.isRun = value ? 1 : 0
}

const handleSelectAllForm = (value) => {
  filteredDisplayFormDataList.value.forEach(item => {
    if (item.key) {
      item.isRun = value ? 1 : 0
    }
  })
}

// 切换必填状态
const toggleRequired = (row) => {
  row.isRequired = row.isRequired === 1 ? 0 : 1
}

// 打开批量编辑弹窗
const openBulkEdit = () => {
  bulkEditVisible.value = true
}

// 处理批量编辑确认
const handleBulkEditConfirm = (importedData) => {
  // 过滤掉文件类型（如果是 x-www-form-urlencoded 模式）
  let filteredData = importedData
  if (bodyType.value === 'x_www_form_urlencoded') {
    filteredData = importedData.filter(item => item.dataType !== 'file')
  }

  // 1. 创建原有数据的映射（通过ID和key）
  const originalIdMap = new Map()  // formdataId -> item
  const originalKeyMap = new Map()  // key -> item

  formDataList.value.forEach(item => {
    if (item.formdataId) {
      originalIdMap.set(item.formdataId, item)
    }
    if (item.key) {
      originalKeyMap.set(item.key, item)
    }
  })

  // 2. 创建导入数据的key和ID集合
  const importedKeySet = new Set()
  const importedIdSet = new Set()

  filteredData.forEach(item => {
    if (item.key) importedKeySet.add(item.key)
    if (item._originalId) importedIdSet.add(item._originalId)
  })

  const result = []

  // 3. 处理原有数据：标记那些不在导入数据中的为删除
  formDataList.value.forEach(item => {
    // 判断该项是否应该保留
    let shouldKeep = false

    if (item.formdataId && importedIdSet.has(item.formdataId)) {
      // 通过ID匹配到了（逗号模式）
      shouldKeep = true
    } else if (item.key && importedKeySet.has(item.key)) {
      // 通过key匹配到了（等号/冒号模式）
      shouldKeep = true
    }

    if (!shouldKeep) {
      // 不在导入数据中
      if (item.delFlag !== '1') {
        // 未删除的，现在标记删除
        result.push({ ...item, delFlag: '1' })
      } else {
        // 已删除的，保持删除状态
        result.push(item)
      }
    }
  })

  // 4. 处理导入数据
  filteredData.forEach((item, index) => {
    let originalItem = null

    // 尝试通过_originalId匹配（逗号模式）
    if (item._originalId && originalIdMap.has(item._originalId)) {
      originalItem = originalIdMap.get(item._originalId)
    }
    // 尝试通过key匹配（等号/冒号模式）
    else if (item.key && originalKeyMap.has(item.key)) {
      originalItem = originalKeyMap.get(item.key)
    }

    const newItem = {
      key: item.key || '',
      value: item.value || '',
      description: item.description || '',
      dataType: item.dataType || 'string',
      isRequired: item.isRequired || 0,
      isRun: 1,
      caseId: props.caseId,
      sortNo: index + 1,
      delFlag: '0'
    }

    if (originalItem) {
      // 更新已有数据，保留ID和元数据
      newItem.formdataId = originalItem.formdataId
      if (originalItem.createTime) newItem.createTime = originalItem.createTime
      if (originalItem.createBy) newItem.createBy = originalItem.createBy
      if (originalItem.updateBy) newItem.updateBy = originalItem.updateBy
      if (originalItem.updateTime) newItem.updateTime = originalItem.updateTime

      // 保留文件相关字段
      if (originalItem.selectedFiles) newItem.selectedFiles = originalItem.selectedFiles
    } else {
      // 新增数据，初始化文件相关字段
      if (item.dataType === 'file') {
        newItem.selectedFiles = []
      }
    }

    result.push(newItem)
  })

  formDataList.value = result
  ElMessage.success(`已导入 ${filteredData.length} 条数据`)
}

const formatJson = () => {
  try {
    if (textData.value) {
      const parsed = parseJsonData(textData.value)
      if (parsed && typeof parsed === 'object') {
        textData.value = JSON.stringify(parsed, null, 2)
        ElMessage.success('JSON格式化成功')
      } else {
        ElMessage.warning('当前内容不是有效的JSON格式')
      }
    }
  } catch (error) {
    ElMessage.error('JSON格式错误，无法格式化')
  }
}

const compressJson = () => {
  try {
    if (textData.value) {
      const parsed = parseJsonData(textData.value)
      if (parsed && typeof parsed === 'object') {
        textData.value = JSON.stringify(parsed)
        ElMessage.success('JSON压缩成功')
      } else {
        ElMessage.warning('当前内容不是有效的JSON格式')
      }
    }
  } catch (error) {
    ElMessage.error('JSON格式错误，无法压缩')
  }
}

const clearText = () => {
  textData.value = ''
  if (monacoEditorInstance) {
    toRaw(monacoEditorInstance).setValue('')
  }
  ElMessage.success('已清空内容')
}

const handleFileChange = (file) => {
  binaryFilePath.value = file.name
  fileList.value = [file]
}

const clearFile = () => {
  binaryFilePath.value = ''
  fileList.value = []
}

// Binary文件管理方法
const openBinaryFileManager = () => {
  binaryFileManagerVisible.value = true
}

const handleBinaryFileManagerSave = (selectedFile) => {
  if (selectedFile) {
    binaryFileConfig.value = {
      fileId: selectedFile.fileId,
      fileName: selectedFile.originalName,
      filePath: selectedFile.fileUrl,
      fileSize: selectedFile.fileSize,
      mimeType: selectedFile.mimeType
    }
    ElMessage.success('文件选择成功')
  }
  binaryFileManagerVisible.value = false
}

const clearBinaryFile = () => {
  binaryFileConfig.value = null
  ElMessage.success('文件已清除')
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getPlaceholder = () => {
  switch (bodyType.value) {
    case 'JSON':
      return '请输入JSON数据'
    case 'XML':
      return '请输入XML数据'
    case 'Raw':
      return '请输入原始数据'
    default:
      return '请输入数据'
  }
}

// 验证请求体
const validate = () => {
  const errors = []

  if (bodyType.value === 'Form_Data' || bodyType.value === 'x_www_form_urlencoded') {
    const listToValidate = bodyType.value === 'x_www_form_urlencoded' ?
      filteredDisplayFormDataList.value : displayFormDataList.value

    listToValidate.forEach((item, index) => {
      if ((item.value || item.description) && !item.key) {
        errors.push(`第${index + 1}行键名不能为空`)
      }
      if (item.dataType === 'file' && (!item.selectedFiles || item.selectedFiles.length === 0)) {
        errors.push(`第${index + 1}行文件类型必须选择文件`)
      }
    })
  } else if (bodyType.value === 'JSON' && textData.value) {
    try {
      parseJsonData(textData.value)
    } catch {
      errors.push('JSON格式错误')
    }
  } else if (bodyType.value === 'XML' && textData.value) {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(textData.value, 'application/xml')
    if (xmlDoc.querySelector('parsererror')) {
      errors.push('XML格式错误')
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  }
}

// 获取数据 - 修复：正确处理JSON数据
const getData = () => {
  const result = {
    requestType: bodyType.value,
    bodyType: bodyType.value,
    jsonData: '',
    formdata: [],
    caseFileConfig: binaryFileConfig.value
  }
  
  // 根据bodyType正确处理jsonData
  if (bodyType.value === 'JSON' && textData.value) {
    // JSON类型解析文本内容
    const parsed = parseJsonData(textData.value)
    result.jsonData = parsed
  } else {
    // 其他类型保持字符串
    result.jsonData = textData.value || ''
  }
  
  if (formDataList.value.length > 0) {
    result.formdata = formDataList.value.map(item => {
      const { isNew, selectedFiles, filePath, ...itemData } = item
      
      if (!itemData.caseId) {
        itemData.caseId = props.caseId
      }
      
      // 如果是文件类型且有选中的文件，添加formFileConfig到当前formdata项
      if (item.dataType === 'file' && item.selectedFiles && item.selectedFiles.length > 0) {
        itemData.formFileConfig = item.selectedFiles.map(file => ({
          fileId: file.fileId,
          fileName: file.originalName,
          filePath: file.fileUrl,
          mimeType: file.mimeType,
          fileSize: file.fileSize
        }))
      }
      
      return itemData
    })
  }

  return result
}

const formatJsonEditor = () => {
  try {
    const parsed = parseJsonData(textData.value)
    if (parsed && typeof parsed === 'object') {
      const formatted = JSON.stringify(parsed, null, 2)
      textData.value = formatted
      if (monacoEditorInstance) {
        toRaw(monacoEditorInstance).setValue(formatted)
      }
      ElMessage.success('JSON格式化成功')
    } else {
      ElMessage.warning('当前内容不是有效的JSON格式')
    }
  } catch (e) {
    ElMessage.error('JSON格式错误，无法格式化')
  }
}

const compressJsonEditor = () => {
  try {
    const parsed = parseJsonData(textData.value)
    if (parsed && typeof parsed === 'object') {
      const compressed = JSON.stringify(parsed)
      textData.value = compressed
      if (monacoEditorInstance) {
        toRaw(monacoEditorInstance).setValue(compressed)
      }
      ElMessage.success('JSON压缩成功')
    } else {
      ElMessage.warning('当前内容不是有效的JSON格式')
    }
  } catch (e) {
    ElMessage.error('JSON格式错误，无法压缩')
  }
}

const clearJsonEditor = () => {
  textData.value = ''
  if (monacoEditorInstance) {
    toRaw(monacoEditorInstance).setValue('')
  }
  validationErrors.value = []
  ElMessage.success('已清空内容')
}

// XML格式化方法
const formatXmlEditor = () => {
  try {
    if (!textData.value || textData.value.trim() === '') {
      ElMessage.warning('内容为空')
      return
    }

    // 使用DOMParser验证和格式化XML
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(textData.value, 'application/xml')
    const parserError = xmlDoc.querySelector('parsererror')

    if (parserError) {
      ElMessage.error('XML格式错误，无法格式化')
      return
    }

    // 格式化XML
    const serializer = new XMLSerializer()
    const xmlString = serializer.serializeToString(xmlDoc)

    // 美化格式
    const formatted = formatXmlString(xmlString)
    textData.value = formatted
    if (monacoEditorInstance) {
      toRaw(monacoEditorInstance).setValue(formatted)
    }
    ElMessage.success('XML格式化成功')
  } catch (e) {
    ElMessage.error('XML格式化失败: ' + e.message)
  }
}

// XML字符串格式化辅助函数
const formatXmlString = (xml) => {
  let formatted = ''
  let indent = ''
  const tab = '  ' // 使用2个空格缩进

  xml.split(/>\s*</).forEach((node) => {
    if (node.match(/^\/\w/)) {
      // 结束标签，减少缩进
      indent = indent.substring(tab.length)
    }

    formatted += indent + '<' + node + '>\n'

    if (node.match(/^<?\w[^>]*[^\/]$/) && !node.startsWith('?')) {
      // 开始标签，增加缩进
      indent += tab
    }
  })

  return formatted.substring(1, formatted.length - 2)
}

// JSON转XML方法
const convertToXml = () => {
  try {
    if (!textData.value || textData.value.trim() === '') {
      ElMessage.warning('内容为空')
      return
    }

    const parsed = parseJsonData(textData.value)
    if (!parsed || typeof parsed !== 'object') {
      ElMessage.warning('当前内容不是有效的JSON格式')
      return
    }

    // JSON转XML的递归函数
    const convertValue = (key, value) => {
      if (value === null || value === undefined) {
        return `<${key}/>`
      } else if (Array.isArray(value)) {
        return value.map(item => convertValue(key, item)).join('\n')
      } else if (typeof value === 'object') {
        let innerXml = ''
        for (const [k, v] of Object.entries(value)) {
          innerXml += convertValue(k, v)
        }
        return `<${key}>\n${innerXml}</${key}>\n`
      } else {
        // XML特殊字符转义
        let strValue = String(value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;')
        return `<${key}>${strValue}</${key}>\n`
      }
    }

    let xmlResult = ''
    const keys = Object.keys(parsed)

    // 如果JSON只有一个根键，直接使用该键作为XML根节点
    if (!Array.isArray(parsed) && keys.length === 1) {
      const rootKey = keys[0]
      const rootValue = parsed[rootKey]
      if (typeof rootValue === 'object' && rootValue !== null && !Array.isArray(rootValue)) {
        // 根值是对象，展开其内容
        let innerXml = ''
        for (const [k, v] of Object.entries(rootValue)) {
          innerXml += convertValue(k, v)
        }
        xmlResult = `<${rootKey}>\n${innerXml}</${rootKey}>`
      } else {
        // 根值不是对象，正常处理
        xmlResult = convertValue(rootKey, rootValue)
      }
    } else if (Array.isArray(parsed)) {
      // 数组需要包装
      const items = parsed.map(item => convertValue('item', item)).join('')
      xmlResult = `<root>\n${items}</root>`
    } else {
      // 多个根键，需要包装
      let innerXml = ''
      for (const [key, value] of Object.entries(parsed)) {
        innerXml += convertValue(key, value)
      }
      xmlResult = `<root>\n${innerXml}</root>`
    }

    const formattedXml = formatXmlString(xmlResult)

    // 切换到XML模式
    bodyType.value = 'XML'
    textData.value = formattedXml

    nextTick(() => {
      if (monacoEditorInstance) {
        const rawEditor = toRaw(monacoEditorInstance)
        rawEditor.setValue(formattedXml)
        const model = rawEditor.getModel()
        if (model) {
          monaco.editor.setModelLanguage(model, 'xml')
        }
        validateContent()
      }
    })

    ElMessage.success('JSON已转换为XML')
  } catch (e) {
    ElMessage.error('转换失败: ' + e.message)
  }
}

// XML转JSON方法
const convertToJson = () => {
  try {
    if (!textData.value || textData.value.trim() === '') {
      ElMessage.warning('内容为空')
      return
    }

    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(textData.value, 'application/xml')
    const parserError = xmlDoc.querySelector('parsererror')

    if (parserError) {
      ElMessage.warning('当前内容不是有效的XML格式')
      return
    }

    // XML转JSON的递归函数
    const xmlToJson = (node) => {
      const result = {}

      // 处理属性
      if (node.attributes && node.attributes.length > 0) {
        result['@attributes'] = {}
        for (let i = 0; i < node.attributes.length; i++) {
          const attr = node.attributes[i]
          result['@attributes'][attr.nodeName] = attr.nodeValue
        }
      }

      // 处理子节点
      if (node.hasChildNodes()) {
        for (let i = 0; i < node.childNodes.length; i++) {
          const child = node.childNodes[i]

          if (child.nodeType === Node.TEXT_NODE) {
            const text = child.nodeValue.trim()
            if (text) {
              // 如果只有文本内容
              if (node.childNodes.length === 1 && !node.attributes.length) {
                return text
              }
              result['#text'] = text
            }
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            const childName = child.nodeName
            const childValue = xmlToJson(child)

            if (result[childName] !== undefined) {
              // 如果已存在同名元素，转换为数组
              if (!Array.isArray(result[childName])) {
                result[childName] = [result[childName]]
              }
              result[childName].push(childValue)
            } else {
              result[childName] = childValue
            }
          }
        }
      }

      // 如果结果为空对象，返回空字符串
      if (Object.keys(result).length === 0) {
        return ''
      }

      return result
    }

    const jsonResult = xmlToJson(xmlDoc.documentElement)
    const rootName = xmlDoc.documentElement.nodeName

    // 如果根节点是'root'且内容是对象，直接返回内容不包装
    // 否则保留原有的根节点名称
    let finalResult
    if (rootName === 'root' && typeof jsonResult === 'object' && jsonResult !== null) {
      finalResult = jsonResult
    } else {
      finalResult = { [rootName]: jsonResult }
    }

    const jsonString = JSON.stringify(finalResult, null, 2)

    // 切换到JSON模式
    bodyType.value = 'JSON'
    textData.value = jsonString

    nextTick(() => {
      if (monacoEditorInstance) {
        const rawEditor = toRaw(monacoEditorInstance)
        rawEditor.setValue(jsonString)
        const model = rawEditor.getModel()
        if (model) {
          monaco.editor.setModelLanguage(model, 'json')
        }
        validateContent()
      }
    })

    ElMessage.success('XML已转换为JSON')
  } catch (e) {
    ElMessage.error('转换失败: ' + e.message)
  }
}

// 重置数据
const resetData = () => {
  initializeData()
}

// 无感同步数据（根据后端返回数据完全替换本地formdata数据）
const syncIds = async (latestFormdata) => {
  console.log('RequestBody: syncIds called with:', latestFormdata)

  if (!Array.isArray(latestFormdata)) {
    console.log('RequestBody: invalid formdata to sync')
    return
  }

  try {
    // 完全替换本地formdata数据为后端返回的数据
    formDataList.value = latestFormdata.map(item => ({
      ...item,
      formdataId: item.formdataId,
      caseId: props.caseId,
      dataType: item.dataType || 'string',
      isRequired: item.isRequired || 0
    }))

    console.log('RequestBody: formdata synced successfully, count:', formDataList.value.length)
  } catch (error) {
    console.error('RequestBody: Error syncing formdata:', error)
  }
}

// 暴露方法给父组件
defineExpose({
  validate,
  getData,
  resetData,
  syncIds
})

// 监听caseId变化 - 只在切换用例时才重新初始化
watch(() => props.caseId, (newCaseId, oldCaseId) => {
  if (newCaseId !== oldCaseId) {
    console.log('RequestBody: caseId changed from', oldCaseId, 'to', newCaseId, '- reinitializing')
    initializeData()
  }
}, { immediate: false })

// 监听bodyType/requestType变化 - bodyType变化需要重新初始化
watch(() => [props.requestType, props.bodyType], ([newRequestType, newBodyType]) => {
  const newType = newRequestType || newBodyType
  if (newType && newType !== bodyType.value) {
    console.log('RequestBody: bodyType changed to', newType)
    bodyType.value = newType
  }
}, { immediate: false })

// 生命周期
onMounted(() => {
  console.log('RequestBody mounted')
  initializeData()
})

onBeforeUnmount(() => {
  console.log('RequestBody unmounting')
  // 销毁 Monaco Editor
  destroyMonacoEditor()
})
</script>

<style scoped>
.request-body {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.body-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.body-content {
  flex: 1;
  overflow: hidden; /* 改为hidden，让内部元素控制滚动 */
  min-height: 0; /* 允许子元素在 flex 容器中正确伸展 */
  display: flex;
  flex-direction: column;
}

.none-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-data-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.form-data-header {
  margin-bottom: 12px;
}

.text-editor {
  /* 使用 flex 方式占满剩余空间 */
  flex: 1;
  min-height: 0; /* 关键：允许flex子元素收缩 */
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-toolbar {
  margin-bottom: 12px;
  display: flex;
  gap: 8px;
}

.file-upload {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.upload-demo {
  width: 100%;
  max-width: 400px;
}

.current-file {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: var(--el-fill-color-extra-light);
  border-radius: 4px;
}

.value-cell {
  width: 100%;
}

.file-value-container {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
}

.file-display-area {
  flex: 1;
  min-height: 32px;
  display: flex;
  align-items: center;
}

.selected-files {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
  width: 100%;
}

.file-item {
  width: 100%;
}

/* 竖向排列的文件上传样式 */
.file-value-container-vertical {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  min-height: 60px;
}

.file-display-area-vertical {
  flex: 1;
  min-height: 40px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.selected-files-vertical {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.file-item-vertical {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  width: 100%;
}

.file-delete-button {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
}

.file-name-display {
  flex: 1;
  font-size: 13px;
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background-color: var(--el-fill-color-extra-light);
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color-lighter);
}

.no-files-placeholder-vertical {
  color: var(--el-text-color-placeholder);
  font-size: 13px;
  text-align: center;
  padding: 8px;
  border: 1px dashed var(--el-border-color-lighter);
  border-radius: 4px;
  background-color: var(--el-fill-color-extra-light);
}

.select-button-vertical {
  align-self: flex-start;
  margin-top: 4px;
}

.file-tag {
  display: inline-flex !important;
  align-items: center;
  max-width: 100%;
  width: auto;
}

.file-tag .el-tag__content {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
  max-width: calc(100% - 24px);
}

.file-tag .el-tag__close {
  flex-shrink: 0;
  margin-left: 4px;
  min-width: 16px;
}

.no-files-placeholder {
  color: var(--el-text-color-placeholder);
  font-size: 14px;
}

.select-button {
  flex-shrink: 0;
}

/* Binary文件上传样式 */
.binary-file-upload {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.binary-file-container {
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
}

.binary-file-display {
  width: 100%;
  min-height: 120px;
  border: 2px dashed var(--el-border-color);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  transition: all 0.3s ease;
  background-color: var(--el-fill-color-extra-light);
}

.binary-file-display:hover {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.selected-binary-file {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.binary-file-tag {
  font-size: 14px;
  padding: 8px 12px;
  max-width: 100%;
}

.binary-file-tag .el-tag__content {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.file-size, .file-type {
  padding: 2px 8px;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
}

.no-binary-file {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--el-text-color-placeholder);
}

.upload-icon {
  font-size: 48px;
  color: var(--el-color-info-light-5);
}

.binary-select-button {
  padding: 10px 24px;
  font-size: 14px;
}

.required-btn {
  padding: 0;
  min-width: auto;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.required-star {
  font-size: 16px;
  font-weight: bold;
  color: #c0c4cc;
  transition: color 0.3s ease;
  cursor: pointer;
}

.required-star.is-required {
  color: #f56c6c;
}

/* 错误输入框样式 */
.error-input :deep(.el-input__inner) {
  border-color: var(--el-color-danger) !important;
  background-color: var(--el-color-danger-light-9) !important;
}

/* 文本域样式 */
:deep(.el-textarea__inner) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  resize: none;
}

/* JSON编辑器特殊样式 */
.text-editor :deep(.el-textarea__inner) {
  background-color: var(--el-fill-color-extra-light);
}

/* Monaco Editor 容器样式 */
.monaco-editor-container {
  width: 100%;
  flex: 1;
  min-height: 200px; /* 保证最小可用高度 */
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  border: 1px solid var(--el-border-color);
}

/* Monaco Editor 包装器样式 */
.monaco-editor-wrapper {
  position: relative;
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* Monaco Editor 全屏工具栏 */
.monaco-fullscreen-toolbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 8px 0;
  gap: 8px;
  min-height: 32px;
}

/* 全屏模式样式 */
.monaco-editor-wrapper.is-fullscreen {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 9999 !important;
  background-color: #1e1e1e !important;
  padding: 16px !important;
  box-sizing: border-box !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
}

.monaco-editor-wrapper.is-fullscreen .monaco-fullscreen-toolbar {
  flex: 0 0 40px !important;
  height: 40px !important;
  max-height: 40px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: flex-end !important;
  padding: 0 16px !important;
  background-color: #252526 !important;
  border-radius: 4px !important;
  margin-bottom: 8px !important;
}

.monaco-editor-wrapper.is-fullscreen .monaco-editor-container {
  flex: 1 1 0 !important;
  height: 0 !important;
  min-height: 0 !important;
  max-height: none !important;
  position: relative !important;
  overflow: hidden !important;
}

.monaco-editor-wrapper.is-fullscreen .monaco-editor-container .monaco-editor {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100% !important;
  height: 100% !important;
}

/* 错误列表样式 */
.error-list {
  margin-top: 8px;
  max-height: 100px;
  overflow-y: auto;
  background: var(--el-color-danger-light-9);
  border: 1px solid var(--el-color-danger-light-5);
  border-radius: 4px;
}

.error-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s;
}

.error-item:hover {
  background: var(--el-color-danger-light-8);
}

.error-icon {
  color: var(--el-color-danger);
  font-size: 14px;
  flex-shrink: 0;
}

.error-line {
  color: var(--el-color-danger);
  font-weight: 600;
  flex-shrink: 0;
}

.error-message {
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
<style>
.json-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.json-toolbar .left-actions,
.json-toolbar .right-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 上传组件样式 */
:deep(.el-upload-dragger) {
  width: 100%;
  height: 200px;
}

/* 单选按钮组样式 */
:deep(.el-radio-button__inner) {
  padding: 8px 12px;
  font-size: 12px;
}

/* 表格样式优化 */
:deep(.el-table) {
  font-size: 14px;
}

:deep(.el-table th) {
  background-color: var(--el-fill-color-extra-light);
  font-weight: 600;
}

:deep(.el-table td) {
  padding: 8px 0;
}

:deep(.el-input__inner) {
  border: none;
  background-color: transparent;
  transition: all 0.3s ease;
}

:deep(.el-input__inner:focus) {
  border: 1px solid var(--el-color-primary);
  background-color: var(--el-bg-color);
}

:deep(.el-select .el-input__wrapper) {
  border: none;
  background-color: transparent;
}

:deep(.el-select .el-input__wrapper.is-focus) {
  border: 1px solid var(--el-color-primary);
  background-color: var(--el-bg-color);
}

/* 表头复选框样式 */
:deep(.el-table th .el-checkbox) {
  margin-right: 0;
}

:deep(.el-checkbox__input.is-indeterminate .el-checkbox__inner) {
  background-color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

:deep(.el-checkbox__input.is-indeterminate .el-checkbox__inner::before) {
  content: '';
  position: absolute;
  display: block;
  background-color: var(--el-color-white);
  height: 2px;
  transform: scale(0.5);
  left: 0;
  right: 0;
  top: 5px;
}
</style>
