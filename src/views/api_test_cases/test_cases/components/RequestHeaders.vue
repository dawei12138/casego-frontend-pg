<template>
  <div class="request-headers">
    <div class="headers-header">
      <div class="header-actions">
        <el-button size="small" type="primary" @click="addHeader">
          <el-icon><Plus /></el-icon>
          添加请求头
        </el-button>
        <el-button size="small" @click="addCommonHeaders">常用请求头</el-button>
        <el-button size="small" @click="openBulkEdit">
          <el-icon><Edit /></el-icon>
          批量编辑
        </el-button>
      </div>
    </div>
    
    <div class="headers-table">
      <el-table :data="displayHeadersList" style="width: 100%" max-height="400">
        <el-table-column width="50">
          <template #header>
            <el-checkbox
              v-model="allSelected"
              :indeterminate="isIndeterminate"
              @change="handleSelectAll"
            />
          </template>
          <template #default="{ row, $index }">
            <el-checkbox
              :model-value="row.isRun === true || row.isRun === 1"
              @change="(value) => handleCheckboxChange(row, value)"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="请求头名称" width="180">
          <template #default="{ row, $index }">
            <el-autocomplete
              v-model="row.key"
              :fetch-suggestions="getHeaderSuggestions"
              placeholder="请求头名称"
              size="small"
              style="width: 100%"
              :class="{ 'error-input': !row.key && (row.value || row.description) }"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="请求头值" min-width="200">
          <template #default="{ row, $index }">
            <el-input
              v-model="row.value"
              placeholder="请求头值"
              size="small"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="数据类型" width="120">
          <template #default="{ row, $index }">
            <el-select
              v-model="row.dataType"
              placeholder="类型"
              size="small"
              style="width: 100%"
            >
              <el-option
                v-for="type in dataTypeOptions"
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
        
        <el-table-column label="描述" width="180">
          <template #default="{ row, $index }">
            <el-input
              v-model="row.description"
              placeholder="请求头描述"
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
              @click="removeHeader(row)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <div class="headers-footer" v-if="displayHeadersList.length === 0">
      <el-empty description="暂无请求头" />
    </div>

    <!-- 批量编辑弹窗 -->
    <BulkEditDialog
      v-model="bulkEditVisible"
      title="批量编辑请求头"
      :data="internalHeadersList"
      @confirm="handleBulkEditConfirm"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Plus, Delete, Edit } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import BulkEditDialog from './BulkEditDialog.vue'

// Props
const props = defineProps({
  headersList: {
    type: Array,
    default: () => []
  },
  caseId: {
    type: [Number, String],
    default: null
  }
})

// 数据类型选项（请求头不包含file类型）
const dataTypeOptions = [
  { label: '字符串', value: 'string' },
  { label: '整数', value: 'integer' },
  { label: '布尔值', value: 'boolean' },
  { label: '数字', value: 'number' },
  { label: '数组', value: 'array' }
]

// 内部数据管理
const internalHeadersList = ref([])

// 批量编辑弹窗可见性
const bulkEditVisible = ref(false)

// 计算属性：只显示未删除的请求头
const displayHeadersList = computed(() => {
  return internalHeadersList.value.filter(header => header.delFlag !== '1')
})

// 常用请求头
const commonHeaders = [
  'Accept',
  'Accept-Encoding',
  'Accept-Language',
  'Authorization',
  'Cache-Control',
  'Content-Type',
  'Cookie',
  'Host',
  'Origin',
  'Referer',
  'User-Agent',
  'X-Requested-With'
]

// 初始化内部数据
const initializeData = () => {
  internalHeadersList.value = props.headersList.map(header => ({ 
    ...header,
    headerId: header.headerId,
    caseId: props.caseId,
    dataType: header.dataType || 'string',
    isRequired: header.isRequired || 0
  }))
}

// 计算全选状态
const allSelected = computed({
  get() {
    const validHeaders = displayHeadersList.value.filter(header => header.key)
    if (validHeaders.length === 0) return false
    return validHeaders.every(header => header.isRun === true || header.isRun === 1)
  },
  set(value) {}
})

const isIndeterminate = computed(() => {
  const validHeaders = displayHeadersList.value.filter(header => header.key)
  if (validHeaders.length === 0) return false
  const checkedCount = validHeaders.filter(header => header.isRun === true || header.isRun === 1).length
  return checkedCount > 0 && checkedCount < validHeaders.length
})

// 方法
const addHeader = () => {
  const newHeader = {
    caseId: props.caseId,
    key: '',
    value: '',
    description: '',
    dataType: 'string',
    isRequired: 0,
    isRun: 1,
    sortNo: internalHeadersList.value.filter(h => h.delFlag !== '1').length + 1,
    delFlag: '0'
  }
  
  internalHeadersList.value.push(newHeader)
}

const removeHeader = (header) => {
  if (header.isNew && !header.headerId) {
    const index = internalHeadersList.value.findIndex(headerItem => headerItem === header)
    if (index > -1) {
      internalHeadersList.value.splice(index, 1)
    }
  } else {
    header.delFlag = '1'
  }
  ElMessage.success('请求头已删除')
}

const addCommonHeaders = () => {
  const newHeaders = [
    { key: 'Content-Type', value: 'application/json', description: 'JSON格式请求', dataType: 'string', isRequired: 0 },
    { key: 'Accept', value: 'application/json', description: '接受JSON响应', dataType: 'string', isRequired: 0 },
    { key: 'User-Agent', value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', description: '', dataType: 'string', isRequired: 0 }
  ]
  
  newHeaders.forEach(header => {
    internalHeadersList.value.push({
      caseId: props.caseId,
      ...header,
      isRun: 1,
      sortNo: internalHeadersList.value.filter(h => h.delFlag !== 1).length + 1,
      delFlag: '0'
    })
  })
  
  ElMessage.success('已添加常用请求头')
}

const handleCheckboxChange = (row, value) => {
  row.isRun = value ? 1 : 0
}

const handleSelectAll = (value) => {
  displayHeadersList.value.forEach(header => {
    if (header.key) {
      header.isRun = value ? 1 : 0
    }
  })
}

const getHeaderSuggestions = (queryString, cb) => {
  const suggestions = commonHeaders
    .filter(header => header.toLowerCase().includes(queryString.toLowerCase()))
    .map(header => ({ value: header }))
  cb(suggestions)
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
  // 1. 创建原有数据的映射（通过ID和key）
  const originalIdMap = new Map()  // headerId -> item
  const originalKeyMap = new Map()  // key -> item

  internalHeadersList.value.forEach(item => {
    if (item.headerId) {
      originalIdMap.set(item.headerId, item)
    }
    if (item.key) {
      originalKeyMap.set(item.key, item)
    }
  })

  // 2. 创建导入数据的key和ID集合
  const importedKeySet = new Set()
  const importedIdSet = new Set()

  importedData.forEach(item => {
    if (item.key) importedKeySet.add(item.key)
    if (item._originalId) importedIdSet.add(item._originalId)
  })

  const result = []

  // 3. 处理原有数据：标记那些不在导入数据中的为删除
  internalHeadersList.value.forEach(item => {
    // 判断该项是否应该保留
    let shouldKeep = false

    if (item.headerId && importedIdSet.has(item.headerId)) {
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
  importedData.forEach((item, index) => {
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
      newItem.headerId = originalItem.headerId
      if (originalItem.createTime) newItem.createTime = originalItem.createTime
      if (originalItem.createBy) newItem.createBy = originalItem.createBy
      if (originalItem.updateBy) newItem.updateBy = originalItem.updateBy
      if (originalItem.updateTime) newItem.updateTime = originalItem.updateTime
    }
    // 否则是新增数据（没有headerId）

    result.push(newItem)
  })

  internalHeadersList.value = result
  ElMessage.success(`已导入 ${importedData.length} 条请求头`)
}

// 验证请求头
const validate = () => {
  const errors = []
  
  displayHeadersList.value.forEach((header, index) => {
    if ((header.value || header.description) && !header.key) {
      errors.push(`第${index + 1}行请求头名称不能为空`)
    }
  })
  
  return {
    isValid: errors.length === 0,
    errors: errors
  }
}

// 获取数据
const getData = () => {
  return internalHeadersList.value
}

// 获取有效请求头
const getValidHeaders = () => {
  return internalHeadersList.value.filter(header => 
    header.key && header.delFlag !== '1'
  )
}

// 重置数据
const resetData = () => {
  initializeData()
}

// 无感同步数据（根据后端返回数据完全替换本地数据，而非仅同步ID）
const syncIds = async (latestDataList) => {
  console.log('RequestHeaders: syncIds called with:', latestDataList)

  if (!Array.isArray(latestDataList)) {
    console.log('RequestHeaders: invalid data to sync')
    return
  }

  try {
    // 完全替换本地数据为后端返回的数据
    internalHeadersList.value = latestDataList.map(item => ({
      ...item,
      headerId: item.headerId,
      caseId: props.caseId,
      dataType: item.dataType || 'string',
      isRequired: item.isRequired || 0
    }))

    console.log('RequestHeaders: data synced successfully, count:', internalHeadersList.value.length)
  } catch (error) {
    console.error('RequestHeaders: Error syncing data:', error)
  }
}

// 获取启用的请求头数量（用于badge显示）
const getEnabledCount = () => {
  return internalHeadersList.value.filter(item =>
    item.isRun === 1 && item.key && item.delFlag !== '1'
  ).length
}

// 暴露方法给父组件
defineExpose({
  validate,
  getData,
  getValidHeaders,
  resetData,
  syncIds,
  getEnabledCount
})

// 监听caseId变化 - 只在切换用例时才重新初始化，不监听headersList内容变化
watch(() => props.caseId, (newCaseId, oldCaseId) => {
  if (newCaseId !== oldCaseId) {
    console.log('RequestHeaders: caseId changed from', oldCaseId, 'to', newCaseId, '- reinitializing')
    initializeData()
  }
}, { immediate: false })

// 生命周期
onMounted(() => {
  initializeData()
})
</script>

<style scoped>
.request-headers {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.headers-header {
  margin-bottom: 16px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.headers-table {
  flex: 1;
  overflow: hidden;
}

.headers-footer {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
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

:deep(.el-autocomplete) {
  width: 100%;
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