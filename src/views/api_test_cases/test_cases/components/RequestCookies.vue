<template>
  <div class="request-cookies">
    <div class="cookies-header">
      <div class="header-actions">
        <el-button size="small" type="primary" @click="addCookie">
          <el-icon><Plus /></el-icon>
          添加Cookie
        </el-button>
        <el-button size="small" @click="openBulkEdit">
          <el-icon><Edit /></el-icon>
          批量编辑
        </el-button>
      </div>
    </div>
    
    <div class="cookies-table">
      <el-table :data="displayCookiesList" style="width: 100%" max-height="400">
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
        
        <el-table-column label="Cookie名称" width="180">
          <template #default="{ row, $index }">
            <el-input
              v-model="row.key"
              placeholder="Cookie名称"
              size="small"
              :class="{ 'error-input': !row.key && (row.value || row.description) }"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="Cookie值" min-width="200">
          <template #default="{ row, $index }">
            <el-input
              v-model="row.value"
              placeholder="Cookie值"
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
              placeholder="Cookie描述"
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
              @click="removeCookie(row)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <div class="cookies-footer" v-if="displayCookiesList.length === 0">
      <el-empty description="暂无Cookie" />
    </div>

    <!-- 批量编辑弹窗 -->
    <BulkEditDialog
      v-model="bulkEditVisible"
      title="批量编辑Cookies"
      :data="internalCookiesList"
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
  cookiesList: {
    type: Array,
    default: () => []
  },
  caseId: {
    type: [Number, String],
    default: null
  }
})

// 数据类型选项（Cookie不包含file类型）
const dataTypeOptions = [
  { label: '字符串', value: 'string' },
  { label: '整数', value: 'integer' },
  { label: '布尔值', value: 'boolean' },
  { label: '数字', value: 'number' },
  { label: '数组', value: 'array' }
]

// 内部数据管理
const internalCookiesList = ref([])

// 批量编辑弹窗可见性
const bulkEditVisible = ref(false)

// 计算属性：只显示未删除的Cookies
const displayCookiesList = computed(() => {
  return internalCookiesList.value.filter(cookie => cookie.delFlag !== '1')
})

// 初始化内部数据
const initializeData = () => {
  internalCookiesList.value = props.cookiesList.map(cookie => ({ 
    ...cookie,
    cookieId: cookie.cookieId,
    caseId: props.caseId,
    dataType: cookie.dataType || 'string',
    isRequired: cookie.isRequired || 0
  }))
}

// 计算全选状态
const allSelected = computed({
  get() {
    const validCookies = displayCookiesList.value.filter(cookie => cookie.key)
    if (validCookies.length === 0) return false
    return validCookies.every(cookie => cookie.isRun === true || cookie.isRun === 1)
  },
  set(value) {}
})

const isIndeterminate = computed(() => {
  const validCookies = displayCookiesList.value.filter(cookie => cookie.key)
  if (validCookies.length === 0) return false
  const checkedCount = validCookies.filter(cookie => cookie.isRun === true || cookie.isRun === 1).length
  return checkedCount > 0 && checkedCount < validCookies.length
})

// 方法
const addCookie = () => {
  const newCookie = {
    caseId: props.caseId,
    key: '',
    value: '',
    description: '',
    dataType: 'string',
    isRequired: 0,
    isRun: 1,
    sortNo: internalCookiesList.value.filter(c => c.delFlag !== '1').length + 1,
    delFlag: '0'
  }
  
  internalCookiesList.value.push(newCookie)
}

const removeCookie = (cookie) => {
  if (cookie.isNew && !cookie.cookieId) {
    const index = internalCookiesList.value.findIndex(cookieItem => cookieItem === cookie)
    if (index > -1) {
      internalCookiesList.value.splice(index, 1)
    }
  } else {
    cookie.delFlag = '1'
  }
  ElMessage.success('Cookie已删除')
}

const handleCheckboxChange = (row, value) => {
  row.isRun = value ? 1 : 0
}

const handleSelectAll = (value) => {
  displayCookiesList.value.forEach(cookie => {
    if (cookie.key) {
      cookie.isRun = value ? 1 : 0
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
  // 1. 创建原有数据的映射（通过ID和key）
  const originalIdMap = new Map()  // cookieId -> item
  const originalKeyMap = new Map()  // key -> item

  internalCookiesList.value.forEach(item => {
    if (item.cookieId) {
      originalIdMap.set(item.cookieId, item)
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
  internalCookiesList.value.forEach(item => {
    // 判断该项是否应该保留
    let shouldKeep = false

    if (item.cookieId && importedIdSet.has(item.cookieId)) {
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
      newItem.cookieId = originalItem.cookieId
      if (originalItem.createTime) newItem.createTime = originalItem.createTime
      if (originalItem.createBy) newItem.createBy = originalItem.createBy
      if (originalItem.updateBy) newItem.updateBy = originalItem.updateBy
      if (originalItem.updateTime) newItem.updateTime = originalItem.updateTime
    }
    // 否则是新增数据（没有cookieId）

    result.push(newItem)
  })

  internalCookiesList.value = result
  ElMessage.success(`已导入 ${importedData.length} 条Cookie`)
}

// 验证Cookies
const validate = () => {
  const errors = []
  
  displayCookiesList.value.forEach((cookie, index) => {
    if ((cookie.value || cookie.description) && !cookie.key) {
      errors.push(`第${index + 1}行Cookie名称不能为空`)
    }
  })
  
  return {
    isValid: errors.length === 0,
    errors: errors
  }
}

// 获取数据
const getData = () => {
  return internalCookiesList.value
}

// 获取有效Cookies
const getValidCookies = () => {
  return internalCookiesList.value.filter(cookie => 
    cookie.key && cookie.delFlag !== '1'
  )
}

// 重置数据
const resetData = () => {
  initializeData()
}

// 无感同步数据（根据后端返回数据完全替换本地数据，而非仅同步ID）
const syncIds = async (latestDataList) => {
  console.log('RequestCookies: syncIds called with:', latestDataList)

  if (!Array.isArray(latestDataList)) {
    console.log('RequestCookies: invalid data to sync')
    return
  }

  try {
    // 完全替换本地数据为后端返回的数据
    internalCookiesList.value = latestDataList.map(item => ({
      ...item,
      cookieId: item.cookieId,
      caseId: props.caseId,
      dataType: item.dataType || 'string',
      isRequired: item.isRequired || 0
    }))

    console.log('RequestCookies: data synced successfully, count:', internalCookiesList.value.length)
  } catch (error) {
    console.error('RequestCookies: Error syncing data:', error)
  }
}

// 获取启用的Cookie数量（用于badge显示）
const getEnabledCount = () => {
  return internalCookiesList.value.filter(item =>
    item.isRun === 1 && item.key && item.delFlag !== '1'
  ).length
}

// 暴露方法给父组件
defineExpose({
  validate,
  getData,
  getValidCookies,
  resetData,
  syncIds,
  getEnabledCount
})

// 监听caseId变化 - 只在切换用例时才重新初始化，不监听cookiesList内容变化
watch(() => props.caseId, (newCaseId, oldCaseId) => {
  if (newCaseId !== oldCaseId) {
    console.log('RequestCookies: caseId changed from', oldCaseId, 'to', newCaseId, '- reinitializing')
    initializeData()
  }
}, { immediate: false })

// 生命周期
onMounted(() => {
  initializeData()
})
</script>

<style scoped>
.request-cookies {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.cookies-header {
  margin-bottom: 16px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.cookies-table {
  flex: 1;
  overflow: hidden;
}

.cookies-footer {
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