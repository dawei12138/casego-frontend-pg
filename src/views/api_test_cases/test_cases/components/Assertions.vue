<template>
  <div class="assertions">
    <!-- 断言列表 -->
    <div v-if="internalAssertionList.filter(s => s.delFlag !== '1').length > 0" class="assertions-list">
      <draggable 
        v-model="internalAssertionList" 
        @change="handleDragChange"
        item-key="assertionId"
        handle=".drag-handle"
        :animation="200"
        ghost-class="sortable-ghost"
        chosen-class="sortable-chosen"
        drag-class="sortable-drag"
        :group="{ name: 'assertions', pull: false, put: false }"
      >
        <template #item="{ element: assertion, index }">
          <div v-show="assertion.delFlag !== '1'" class="assertion-item" :key="assertion.assertionId">
            <!-- 断言头部 -->
            <div class="assertion-header" @click="assertion.expanded = !assertion.expanded">
              <div class="assertion-info">
                <span class="drag-handle">⋮⋮</span>
                <div class="assertion-badge">
                  {{ getDisplayIndex(assertion) }}
                </div>
                <div class="assertion-details">
                  <span class="assertion-summary">{{ getAssertionSummary(assertion) }}</span>
                </div>
              </div>
              <div class="assertion-controls">
                <el-switch 
                  v-model="assertion.isRun" 
                  :active-value="true" 
                  :inactive-value="false" 
                  size="small" 
                  @click.stop 
                />
                <el-button size="small" text type="danger" @click.stop="removeAssertion(assertion)">
                  <el-icon><Delete /></el-icon>
                </el-button>
                <el-icon class="expand-icon" :class="{ 'is-expanded': assertion.expanded }">
                  <ArrowDown />
                </el-icon>
              </div>
            </div>
            
            <!-- 断言配置 -->
            <div v-show="assertion.expanded === true" class="assertion-config">
              <div class="config-content">
                <div class="config-row">
                  <label class="config-label">断言描述</label>
                  <el-input v-model="assertion.description" placeholder="请输入断言描述" size="small" />
                </div>
                
                <div class="config-row">
                  <label class="config-label">断言对象</label>
                  <el-select v-model="assertion.assertionMethod" size="small" style="width: 200px;">
                    <el-option label="响应文本" value="response_text" />
                    <el-option label="响应JSON" value="response_json" />
                    <el-option label="响应XML" value="response_xml" />
                    <el-option label="响应头" value="response_header" />
                    <el-option label="响应Cookie" value="response_cookie" />
                    <el-option label="状态码" value="response_status" />
                    <el-option label="环境变量" value="environment_cache" />
                  </el-select>
                </div>
                
                <div class="config-row" v-if="needsJsonPath(assertion.assertionMethod)">
                  <label class="config-label">{{ getJsonPathLabel(assertion.assertionMethod) }}</label>
                  <el-input
                    v-model="assertion.jsonpath"
                    :placeholder="getJsonPathPlaceholder(assertion.assertionMethod)"
                    size="small"
                  >
                    <template #append v-if="assertion.assertionMethod === 'response_json'">
                      <el-button size="small" @click="showJsonPathHelp">
                        <el-icon><QuestionFilled /></el-icon>
                      </el-button>
                    </template>
                  </el-input>
                </div>
                
                <div class="config-row">
                  <label class="config-label">断言类型</label>
                  <el-select v-model="assertion.assertType" size="small" style="width: 160px;">
                    <el-option label="等于 (=)" value="=" />
                    <el-option label="不等于 (!=)" value="!=" />
                    <el-option label="存在" value="exist" />
                    <el-option label="不存在" value="not_exist" />
                    <el-option label="大于 (>)" value=">" />
                    <el-option label="大于等于 (>=)" value=">=" />
                    <el-option label="小于 (<)" value="<" />
                    <el-option label="小于等于 (<=)" value="<=" />
                    <el-option label="正则匹配" value="REGULAR_TYPE" />
                    <el-option label="包含" value="contain" />
                    <el-option label="不包含" value="not_contain" />
                    <el-option label="为空" value="is_null" />
                    <el-option label="不为空" value="is_not_null" />
                    <el-option label="属于集合" value="belong_to_set" />
                    <el-option label="不属于集合" value="not_belong_to_set" />
                  </el-select>
                </div>

                <div class="config-row" v-if="needsExpectedValue(assertion.assertType)">
                  <label class="config-label">期望值</label>
                  <el-input 
                    v-model="assertion.value" 
                    :placeholder="getValuePlaceholder(assertion.assertType)" 
                    size="small" 
                  />
                </div>
                
                <div class="config-row" v-if="assertion.assertionMethod === 'response_json'">
                  <label class="config-label">提取索引</label>
                  <div class="index-config">
                    <el-switch
                      v-model="assertion.extractIndexIsRun"
                      size="small"
                    />
                    <span class="index-label">启用索引</span>
                    <el-input-number
                      v-if="assertion.extractIndexIsRun"
                      v-model="assertion.jsonpathIndex"
                      :min="0"
                      size="small"
                      style="width: 80px;"
                      placeholder="索引"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </draggable>
    </div>
    
    <!-- 添加按钮 -->
    <div class="add-section">
      <el-dropdown @command="addAssertion" placement="bottom-start">
        <div class="add-button">
          <el-icon><Plus /></el-icon>
          <span>添加断言</span>
          <el-icon class="arrow-icon"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu class="assertion-type-menu">
            <el-dropdown-item 
              v-for="type in assertionMethods" 
              :key="type.value" 
              :command="type.value"
              class="assertion-type-item"
            >
              <div class="type-icon assertion-icon"></div>
              <span>{{ type.label }}</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- JSONPath帮助对话框 -->
    <el-dialog v-model="showJsonPathDialog" title="JSONPath 语法帮助" width="600px">
      <div class="jsonpath-help">
        <h4>常用 JSONPath 表达式：</h4>
        <ul class="help-list">
          <li><code>$.data</code> - 获取根对象的 data 属性</li>
          <li><code>$.data.status</code> - 获取 data 对象的 status 属性</li>
          <li><code>$.items[0]</code> - 获取 items 数组的第一个元素</li>
          <li><code>$.items[*].name</code> - 获取 items 数组中所有元素的 name 属性</li>
          <li><code>$..name</code> - 递归搜索所有 name 属性</li>
          <li><code>$.items[?(@.price > 10)]</code> - 过滤条件：价格大于10</li>
        </ul>
      </div>
      <template #footer>
        <el-button @click="showJsonPathDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { Plus, Delete, ArrowDown, QuestionFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import draggable from 'vuedraggable'

// 引入样式文件
import '../styles/assertions.css'

const props = defineProps({
  assertionList: { type: Array, default: () => [] },
  caseId: {
    type: [Number, String],
    default: null
  }
})

const internalAssertionList = ref([])
const showJsonPathDialog = ref(false)

// 断言对象选项
const assertionMethods = [
  { label: '响应JSON', value: 'response_json' },
  { label: '响应文本', value: 'response_text' },
  { label: '响应XML', value: 'response_xml' },
  { label: '响应头', value: 'response_header' },
  { label: '响应Cookie', value: 'response_cookie' },
  { label: '状态码', value: 'response_status' },
  { label: '环境变量', value: 'environment_cache' }
]

// 判断是否需要JSONPath
const needsJsonPath = (method) => {
  return ['response_json', 'response_xml', 'response_header', 'response_cookie', 'environment_cache'].includes(method)
}

// 获取JSONPath标签文本
const getJsonPathLabel = (method) => {
  const labels = {
    'response_json': 'JSONPath',
    'response_xml': 'XPath',
    'response_header': '响应头名称',
    'response_cookie': 'Cookie名称',
    'environment_cache': '变量名'
  }
  return labels[method] || 'JSONPath'
}

// 获取JSONPath占位符
const getJsonPathPlaceholder = (method) => {
  const placeholders = {
    'response_json': '$.data.status',
    'response_xml': '//root/element',
    'response_header': 'Content-Type',
    'response_cookie': 'session_id',
    'environment_cache': '请输入环境变量名'
  }
  return placeholders[method] || '$.data.status'
}

// 判断是否需要期望值
const needsExpectedValue = (assertType) => {
  return !['exist', 'not_exist', 'is_null', 'is_not_null'].includes(assertType)
}

// 获取期望值占位符
const getValuePlaceholder = (assertType) => {
  const placeholders = {
    '=': '请输入期望的值',
    '!=': '请输入不期望的值',
    '>': '请输入数值',
    '>=': '请输入数值',
    '<': '请输入数值',
    '<=': '请输入数值',
    'REGULAR_TYPE': '请输入正则表达式',
    'contain': '请输入包含的内容',
    'not_contain': '请输入不包含的内容',
    'belong_to_set': '请输入集合值，用逗号分隔',
    'not_belong_to_set': '请输入集合值，用逗号分隔'
  }
  return placeholders[assertType] || '请输入期望值'
}

// 显示JSONPath帮助
const showJsonPathHelp = () => {
  showJsonPathDialog.value = true
}

// 字段映射函数
const mapBackendFields = (backendItem) => {
  return {
    caseId: props.caseId,
    assertionId: backendItem.assertionId,
    description: backendItem.description || '',
    assertionMethod: backendItem.assertionMethod || 'response_json',
    jsonpath: backendItem.jsonpath || '',
    assertType: backendItem.assertType || '=',
    value: backendItem.value || '',
    jsonpathIndex: backendItem.jsonpathIndex || 0,
    extractIndexIsRun: backendItem.extractIndexIsRun === true || backendItem.extractIndexIsRun === 1,
    isRun: backendItem.isRun === true || backendItem.isRun === 1,
    sortNo: backendItem.sortNo || 0,
    delFlag: backendItem.delFlag || '1',
    expanded: false,
    createTime: backendItem.createTime,
    updateTime: backendItem.updateTime,
    createBy: backendItem.createBy,
    updateBy: backendItem.updateBy,
    caseId: backendItem.caseId,
    remark: backendItem.remark
  }
}

// 排序函数
const sortInternalList = () => {
  internalAssertionList.value.sort((a, b) => {
    if (a.delFlag === '1' && b.delFlag !== '1') return '1'
    if (a.delFlag !== '1' && b.delFlag === '1') return '-1'
    if (a.delFlag === '1' && b.delFlag === '1') return '0'
    
    const sortNoA = a.sortNo || 999999
    const sortNoB = b.sortNo || 999999
    return sortNoA - sortNoB
  })
}

// 获取显示索引
const getDisplayIndex = (assertion) => {
  const validAssertions = internalAssertionList.value.filter(s => s.delFlag !== '1')
  const index = validAssertions.findIndex(s => s.assertionId === assertion.assertionId)
  return index + 1
}

// 获取断言对象标签
const getAssertionMethodLabel = (method) => {
  const found = assertionMethods.find(t => t.value === method)
  return found ? found.label : '未知'
}

// 获取断言类型标签
const getAssertTypeLabel = (assertType) => {
  const labels = {
    '=': '等于',
    '!=': '不等于',
    'exist': '存在',
    'not_exist': '不存在',
    '>': '大于',
    '>=': '大于等于',
    '<': '小于',
    '<=': '小于等于',
    'REGULAR_TYPE': '正则匹配',
    'contain': '包含',
    'not_contain': '不包含',
    'is_null': '为空',
    'is_not_null': '不为空',
    'belong_to_set': '属于集合',
    'not_belong_to_set': '不属于集合'
  }
  return labels[assertType] || assertType
}

// 获取断言摘要（一行显示）
const getAssertionSummary = (assertion) => {
  const methodLabel = getAssertionMethodLabel(assertion.assertionMethod)
  const assertTypeLabel = getAssertTypeLabel(assertion.assertType)

  // 构建摘要字符串的各个部分
  let summary = methodLabel

  // 添加变量名/JSONPath（如果有）
  if (assertion.jsonpath) {
    if (assertion.assertionMethod === 'environment_cache') {
      summary += ` [${assertion.jsonpath}]`
    } else if (needsJsonPath(assertion.assertionMethod)) {
      summary += ` [${assertion.jsonpath}]`
    }
  }

  // 添加断言类型
  summary += ` ${assertTypeLabel}`

  // 添加期望值（如果需要）
  if (needsExpectedValue(assertion.assertType)) {
    const value = assertion.value || '(未设置)'
    summary += ` ${value}`
  }

  return summary
}

// 初始化数据
const initializeData = () => {
  console.log('Assertions initializeData called with:', props.assertionList, props.caseId)
  if (props.assertionList && props.assertionList.length > 0) {
    const sortedList = [...props.assertionList].sort((a, b) => {
      const sortNoA = a.sortNo || 999999
      const sortNoB = b.sortNo || 999999
      return sortNoA - sortNoB
    })
    
    internalAssertionList.value = sortedList.map((item, index) => {
      const mapped = mapBackendFields(item)
      if (!mapped.sortNo || mapped.sortNo === 0) {
        mapped.sortNo = index + 1
      }
      return mapped
    })
    
    sortInternalList()
  } else {
    internalAssertionList.value = []
  }
}

// 添加断言
const addAssertion = (method) => {
  const newAssertion = {
    caseId: props.caseId,
    description: '',
    assertionMethod: method,
    jsonpath: '',
    assertType: '=',
    value: '',
    jsonpathIndex: 0,
    extractIndexIsRun: true,
    isRun: true,
    sortNo: getNextSortNo(),
    delFlag: '0',
    expanded: true,
    isNew: true
  }
  
  internalAssertionList.value.push(newAssertion)
  sortInternalList()
}

// 删除断言
const removeAssertion = async (assertion) => {
  try {
    await ElMessageBox.confirm('确定删除此断言？', '确认', { type: 'warning' })
    
    if (assertion.isNew) {
      const index = internalAssertionList.value.findIndex(s => s.assertionId === assertion.assertionId)
      if (index > -1) {
        internalAssertionList.value.splice(index, 1)
      }
    } else {
      assertion.delFlag = '1'
    }
    ElMessage.success('表单项已删除')
    ensureProperSorting()
    sortInternalList()
  } catch {}
}

// 拖拽处理
const handleDragChange = (evt) => {
  nextTick(() => {
    updateSortOrder()
    sortInternalList()
  })
}

// 获取下一个排序号
const getNextSortNo = () => {
  const validAssertions = internalAssertionList.value.filter(assertion => assertion.delFlag !== '1')
  const maxSort = Math.max(0, ...validAssertions.map(s => s.sortNo || 0))
  return maxSort + 1
}

// 更新排序
const updateSortOrder = () => {
  const validAssertions = internalAssertionList.value.filter(assertion => assertion.delFlag !== '1')
  validAssertions.forEach((assertion, index) => {
    assertion.sortNo = index + 1
  })
}

// 确保排序正确
const ensureProperSorting = () => {
  const validAssertions = internalAssertionList.value.filter(assertion => assertion.delFlag !== '1')
  validAssertions.forEach((assertion, index) => {
    assertion.sortNo = index + 1
  })
}

// 验证断言
const validate = () => {
  const errors = []
  
  internalAssertionList.value.forEach((assertion, index) => {
    if (assertion.delFlag === '1') return
  })
  
  return {
    isValid: errors.length === 0,
    errors: errors
  }
}

// 获取数据
const getData = () => {
  ensureProperSorting()
  sortInternalList()

  return internalAssertionList.value.map(assertion => {
    const { expanded, isNew, ...dataToSave } = assertion
    return dataToSave
  })
}

// 无感同步数据（根据后端返回数据完全替换本地数据，而非仅同步ID）
const syncIds = async (latestDataList) => {
  console.log('Assertions: syncIds called with:', latestDataList)

  if (!Array.isArray(latestDataList)) {
    console.log('Assertions: invalid data to sync')
    return
  }

  try {
    // 保存当前展开状态
    const expandedStates = new Map()
    internalAssertionList.value.forEach(item => {
      const key = item.assertionId || `${item.description}_${item.assertionMethod}`
      expandedStates.set(key, item.expanded)
    })

    // 完全替换本地数据为后端返回的数据
    internalAssertionList.value = latestDataList.map((item, index) => {
      const mapped = mapBackendFields(item)
      // 恢复展开状态
      const key = mapped.assertionId || `${mapped.description}_${mapped.assertionMethod}`
      if (expandedStates.has(key)) {
        mapped.expanded = expandedStates.get(key)
      }
      if (!mapped.sortNo || mapped.sortNo === 0) {
        mapped.sortNo = index + 1
      }
      return mapped
    })

    sortInternalList()
    console.log('Assertions: data synced successfully, count:', internalAssertionList.value.length)
  } catch (error) {
    console.error('Assertions: Error syncing data:', error)
  }
}

// 获取启用的断言数量（用于badge显示）
const getEnabledCount = () => {
  return internalAssertionList.value.filter(item =>
    item.isRun === true && item.jsonpath && item.delFlag !== '1'
  ).length
}

defineExpose({ validate, getData, syncIds, getEnabledCount })

// 监听caseId变化 - 只在切换用例时才重新初始化，不监听assertionList内容变化
watch(() => props.caseId, (newCaseId, oldCaseId) => {
  if (newCaseId !== oldCaseId) {
    console.log('Assertions: caseId changed from', oldCaseId, 'to', newCaseId, '- reinitializing')
    initializeData()
  }
}, { immediate: false })

onMounted(() => {
  initializeData()
})
</script>