<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="bulk-edit-container">
      <!-- 模式选择 -->
      <div class="mode-selection">
        <span class="mode-label">导入模式：</span>
        <el-radio-group v-model="importMode" size="small">
          <el-radio-button value="comma">逗号模式</el-radio-button>
          <el-radio-button value="colon">冒号模式</el-radio-button>
          <el-radio-button value="equals">等号模式</el-radio-button>
        </el-radio-group>
        <el-button
          size="small"
          type="info"
          text
          @click="showFormatHelp = !showFormatHelp"
        >
          格式说明
        </el-button>
      </div>

      <!-- 格式说明 -->
      <el-alert
        v-if="showFormatHelp"
        :closable="true"
        type="info"
        class="format-help"
        @close="showFormatHelp = false"
      >
        <template #title>
          <div class="help-content">
            <div v-if="importMode === 'comma'" class="help-section">
              <div class="help-title">逗号模式格式：</div>
              <div class="help-example">ID,启用状态,键名,键值,数据类型,必填状态,描述</div>
              <div class="help-note">示例（已存在）：1,true,token,m2333,string,true,访问令牌</div>
              <div class="help-note">示例（新增）：,true,demo,2222,string,false,测试数据</div>
              <div class="help-note">注意：每行一个条目，字段之间用逗号分隔</div>
              <div class="help-note">ID: 留空表示新增，有值表示更新已有数据</div>
              <div class="help-note">启用状态和必填状态: true/false 或 1/0</div>
              <div class="help-note">数据类型: string/integer/boolean/number/array</div>
            </div>
            <div v-else-if="importMode === 'colon'" class="help-section">
              <div class="help-title">冒号模式格式：</div>
              <div class="help-example">键名:键值</div>
              <div class="help-note">示例：token:m2333</div>
              <div class="help-note">注意：每行一个条目，默认启用，数据类型为string</div>
              <div class="help-note">此模式下所有数据视为新增</div>
            </div>
            <div v-else-if="importMode === 'equals'" class="help-section">
              <div class="help-title">等号模式格式：</div>
              <div class="help-example">键名=键值</div>
              <div class="help-note">示例：token=m2333</div>
              <div class="help-note">注意：每行一个条目，默认启用，数据类型为string</div>
              <div class="help-note">此模式下所有数据视为新增</div>
            </div>
          </div>
        </template>
      </el-alert>

      <!-- 数据编辑区 -->
      <div class="edit-area">
        <div class="edit-header">
          <span class="edit-label">数据内容：</span>
          <div class="edit-actions">
            <el-button size="small" @click="clearContent">清空</el-button>
          </div>
        </div>
        <el-input
          v-model="editContent"
          type="textarea"
          :rows="15"
          placeholder="在此粘贴或编辑数据..."
          class="edit-textarea"
        />
        <div class="edit-footer">
          <span class="line-count">共 {{ lineCount }} 行</span>
          <span v-if="parseError" class="parse-error">
            <el-icon><WarningFilled /></el-icon>
            {{ parseError }}
          </span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :disabled="!!parseError">
          确定导入
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { WarningFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '批量编辑'
  },
  data: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

// 状态
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const importMode = ref('comma')
const editContent = ref('')
const showFormatHelp = ref(false)
const parseError = ref('')

// 计算行数
const lineCount = computed(() => {
  return editContent.value.split('\n').filter(line => line.trim()).length
})

// 转换布尔值/数字为标准格式
const normalizeBooleanValue = (value) => {
  if (value === true || value === 1 || value === '1' || value === 'true') {
    return 1
  }
  return 0
}

// 获取ID字段名（根据不同的数据类型）
const getIdFieldName = (item) => {
  if (item.paramId !== undefined) return 'paramId'
  if (item.headerId !== undefined) return 'headerId'
  if (item.cookieId !== undefined) return 'cookieId'
  if (item.formdataId !== undefined) return 'formdataId'
  return null
}

// 获取ID值
const getIdValue = (item) => {
  const fieldName = getIdFieldName(item)
  return fieldName ? item[fieldName] : ''
}

// 转换数据到逗号模式格式（包含ID）
const dataToCommaFormat = (data) => {
  return data
    .filter(item => item.delFlag !== '1')
    .map(item => {
      const id = getIdValue(item) || ''
      const isRun = normalizeBooleanValue(item.isRun) === 1 ? 'true' : 'false'
      const isRequired = normalizeBooleanValue(item.isRequired) === 1 ? 'true' : 'false'
      return `${id},${isRun},${item.key || ''},${item.value || ''},${item.dataType || 'string'},${isRequired},${item.description || ''}`
    })
    .join('\n')
}

// 转换数据到冒号模式格式
const dataToColonFormat = (data) => {
  return data
    .filter(item => item.delFlag !== '1' && item.key)
    .map(item => `${item.key}:${item.value || ''}`)
    .join('\n')
}

// 转换数据到等号模式格式
const dataToEqualsFormat = (data) => {
  return data
    .filter(item => item.delFlag !== '1' && item.key)
    .map(item => `${item.key}=${item.value || ''}`)
    .join('\n')
}

// 自动加载当前数据（内部方法）
const loadCurrentData = (forceMode = null) => {
  if (!props.data || props.data.length === 0) {
    editContent.value = ''
    return
  }

  const mode = forceMode || importMode.value

  if (mode === 'comma') {
    editContent.value = dataToCommaFormat(props.data)
  } else if (mode === 'colon') {
    editContent.value = dataToColonFormat(props.data)
  } else if (mode === 'equals') {
    editContent.value = dataToEqualsFormat(props.data)
  }
}

// 将当前编辑内容从一种模式转换为另一种模式
const convertBetweenModes = (fromMode, toMode) => {
  if (!editContent.value.trim()) {
    return
  }

  // 先解析当前模式的数据
  let parsedData = null
  if (fromMode === 'comma') {
    const result = parseCommaMode(editContent.value)
    parsedData = result.data
  } else if (fromMode === 'colon') {
    const result = parseColonMode(editContent.value)
    parsedData = result.data
  } else if (fromMode === 'equals') {
    const result = parseEqualsMode(editContent.value)
    parsedData = result.data
  }

  if (!parsedData || parsedData.length === 0) {
    // 如果解析失败，加载原始数据
    loadCurrentData(toMode)
    return
  }

  // 转换为目标模式
  if (toMode === 'comma') {
    editContent.value = dataToCommaFormat(parsedData)
  } else if (toMode === 'colon') {
    editContent.value = dataToColonFormat(parsedData)
  } else if (toMode === 'equals') {
    editContent.value = dataToEqualsFormat(parsedData)
  }
}

// 清空内容
const clearContent = () => {
  editContent.value = ''
  parseError.value = ''
}

// 解析逗号模式（包含ID字段）
const parseCommaMode = (content) => {
  const lines = content.split('\n').filter(line => line.trim())
  const result = []
  const errors = []

  lines.forEach((line, index) => {
    const parts = line.split(',').map(p => p.trim())

    // 新格式：ID,启用状态,键名,键值,数据类型,必填状态,描述
    if (parts.length < 4) {
      errors.push(`第${index + 1}行：格式错误，至少需要4个字段（ID,启用状态,键名,键值）`)
      return
    }

    const [idStr, isRunStr, key, value, dataType = 'string', isRequiredStr = 'false', description = ''] = parts

    if (!key) {
      errors.push(`第${index + 1}行：键名不能为空`)
      return
    }

    // 解析布尔值
    const parseBoolean = (val) => {
      return val === 'true' || val === '1' || val === true || val === 1 ? 1 : 0
    }

    // 解析ID（如果有的话）
    const id = idStr && idStr !== '' ? parseInt(idStr) : null

    const item = {
      key,
      value,
      dataType: dataType || 'string',
      isRequired: parseBoolean(isRequiredStr),
      isRun: parseBoolean(isRunStr),
      description: description || '',
      delFlag: '0',
      sortNo: index + 1
    }

    // 如果有ID，则保留ID（根据数据来源自动判断ID字段名）
    if (id && id > 0) {
      item._originalId = id
    }

    result.push(item)
  })

  return { data: result, errors }
}

// 解析冒号模式
const parseColonMode = (content) => {
  const lines = content.split('\n').filter(line => line.trim())
  const result = []
  const errors = []

  lines.forEach((line, index) => {
    const colonIndex = line.indexOf(':')

    if (colonIndex === -1) {
      errors.push(`第${index + 1}行：格式错误，应为"键名:键值"`)
      return
    }

    const key = line.substring(0, colonIndex).trim()
    const value = line.substring(colonIndex + 1).trim()

    if (!key) {
      errors.push(`第${index + 1}行：键名不能为空`)
      return
    }

    result.push({
      key,
      value,
      dataType: 'string',
      isRequired: 0,
      isRun: 1,
      description: '',
      delFlag: '0',
      sortNo: index + 1
    })
  })

  return { data: result, errors }
}

// 解析等号模式
const parseEqualsMode = (content) => {
  const lines = content.split('\n').filter(line => line.trim())
  const result = []
  const errors = []

  lines.forEach((line, index) => {
    const equalsIndex = line.indexOf('=')

    if (equalsIndex === -1) {
      errors.push(`第${index + 1}行：格式错误，应为"键名=键值"`)
      return
    }

    const key = line.substring(0, equalsIndex).trim()
    const value = line.substring(equalsIndex + 1).trim()

    if (!key) {
      errors.push(`第${index + 1}行：键名不能为空`)
      return
    }

    result.push({
      key,
      value,
      dataType: 'string',
      isRequired: 0,
      isRun: 1,
      description: '',
      delFlag: '0',
      sortNo: index + 1
    })
  })

  return { data: result, errors }
}

// 解析数据
const parseData = () => {
  parseError.value = ''

  if (!editContent.value.trim()) {
    parseError.value = '内容不能为空'
    return null
  }

  let result
  if (importMode.value === 'comma') {
    result = parseCommaMode(editContent.value)
  } else if (importMode.value === 'colon') {
    result = parseColonMode(editContent.value)
  } else if (importMode.value === 'equals') {
    result = parseEqualsMode(editContent.value)
  }

  if (result.errors.length > 0) {
    parseError.value = result.errors[0]
    return null
  }

  return result.data
}

// 监听内容变化，实时验证
watch(editContent, () => {
  if (editContent.value.trim()) {
    parseData()
  } else {
    parseError.value = ''
  }
})

// 监听模式变化，自动转换格式
let previousMode = ref(importMode.value)
watch(importMode, (newMode, oldMode) => {
  parseError.value = ''

  // 如果有内容，则进行格式转换
  if (editContent.value.trim()) {
    convertBetweenModes(oldMode, newMode)
  }

  previousMode.value = newMode
})

// 监听弹窗打开，自动加载数据
watch(dialogVisible, (visible) => {
  if (visible) {
    // 弹窗打开时自动加载当前数据
    loadCurrentData()
  }
})

// 确认导入
const handleConfirm = () => {
  const parsedData = parseData()

  if (!parsedData) {
    ElMessage.error('数据解析失败，请检查格式')
    return
  }

  if (parsedData.length === 0) {
    ElMessage.warning('没有有效的数据可导入')
    return
  }

  // 确保所有导入的数据都是启用状态
  // 保留 _originalId 字段，让各组件自己处理ID映射
  const processedData = parsedData.map(item => {
    return {
      ...item,
      isRun: 1, // 强制设置为启用
      delFlag: '0'
      // 保留 _originalId 字段传递给组件
    }
  })

  emit('confirm', processedData)
  ElMessage.success(`成功导入 ${processedData.length} 条数据`)
  handleClose()
}

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false
  editContent.value = ''
  parseError.value = ''
  showFormatHelp.value = false
}
</script>

<style scoped>
.bulk-edit-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mode-selection {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background-color: var(--el-fill-color-extra-light);
  border-radius: 4px;
}

.mode-label {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.format-help {
  margin: 0;
}

.help-content {
  font-size: 13px;
}

.help-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.help-title {
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.help-example {
  padding: 8px 12px;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
  font-family: monospace;
  color: var(--el-color-primary);
}

.help-note {
  color: var(--el-text-color-secondary);
  padding-left: 12px;
}

.edit-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.edit-label {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.edit-actions {
  display: flex;
  gap: 8px;
}

.edit-textarea {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
}

.edit-textarea :deep(textarea) {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  line-height: 1.6;
}

.edit-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: var(--el-fill-color-extra-light);
  border-radius: 4px;
  font-size: 13px;
}

.line-count {
  color: var(--el-text-color-secondary);
}

.parse-error {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--el-color-danger);
  font-weight: 500;
}

.parse-error .el-icon {
  font-size: 16px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
