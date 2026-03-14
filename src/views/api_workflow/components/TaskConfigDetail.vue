<template>
  <div class="task-config-detail">
    <!-- 任务类型信息 -->
    <div class="task-type-info">
      <span class="task-type-label">任务类型:</span>
      <el-tag :type="getTaskTypeTagType(taskConfig.task_type)" size="small">
        {{ getTaskTypeLabel(taskConfig.task_type) }}
      </el-tag>
    </div>

    <!-- 等待时间任务 -->
    <div v-if="taskConfig.task_type === 'wait'" class="config-section">
      <h5 class="config-title">等待时间配置</h5>
      <div class="config-grid">
        <div class="config-item">
          <span class="config-label">等待时间:</span>
          <span class="config-value">{{ taskConfig.wait_time || 0 }} 秒</span>
        </div>
      </div>
    </div>

    <!-- 自定义脚本任务 -->
    <div v-else-if="taskConfig.task_type === 'custom'" class="config-section">
      <h5 class="config-title">自定义脚本配置</h5>
      <div class="config-grid">
        <div class="config-item full-width">
          <span class="config-label">脚本内容:</span>
          <div class="script-content">
            <pre v-if="taskConfig.custom_script">{{ taskConfig.custom_script }}</pre>
            <span v-else class="empty-value">未设置脚本内容</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 公共脚本任务 -->
    <div v-else-if="taskConfig.task_type === 'public_script'" class="config-section">
      <h5 class="config-title">公共脚本配置</h5>
      <div class="config-grid">
        <div class="config-item">
          <span class="config-label">公共脚本ID:</span>
          <span class="config-value">{{ taskConfig.publicscript || '未设置' }}</span>
        </div>
      </div>
    </div>

    <!-- 数据库操作任务 -->
    <div v-else-if="taskConfig.task_type === 'db_operation'" class="config-section">
      <h5 class="config-title">数据库操作配置</h5>
      <DbOperationEditor
        :model-db-id="taskConfig.db_operation_id"
        :model-script="taskConfig.db_operation_script"
        :readonly="false"
        :editor-height="200"
      />
    </div>

    <!-- API测试用例类型 -->
    <div v-else-if="taskConfig.task_type === 'api_case'" class="config-section">
      <h6 class="section-title">API测试用例配置</h6>
      <div class="config-content">
        <div class="config-item">
          <span class="label">用例ID:</span>
          <span class="value">{{ taskConfig.case_id }}</span>
        </div>
        <div class="config-item">
          <span class="label">用例名称:</span>
          <span class="value">{{ taskConfig.case_name || '未设置' }}</span>
        </div>
        <div class="config-item">
          <span class="label">环境ID:</span>
          <span class="value">{{ taskConfig.env_id || '默认环境' }}</span>
        </div>
        <div class="config-item">
          <span class="label">超时时间:</span>
          <span class="value">{{ taskConfig.timeout || 30 }}秒</span>
        </div>
        <div class="config-item">
          <span class="label">重试次数:</span>
          <span class="value">{{ taskConfig.retry_count || 0 }}次</span>
        </div>
      </div>
      
      <!-- 测试用例详情展示 -->
      <div class="test-case-display">
        <CaseEditor 
          :case-data="caseData"
          :tab-id="`task-${taskConfig.case_id}`"
          :env-id="taskConfig.env_id"
          readonly
        />
      </div>
    </div>

    <!-- API接口类型 -->
    <div v-else-if="taskConfig.task_type === 'api'" class="config-section">
      <h6 class="section-title">API接口配置</h6>
      <div class="config-content">
        <div class="config-item">
          <span class="label">接口ID:</span>
          <span class="value">{{ taskConfig.api_id }}</span>
        </div>
        <div class="config-item">
          <span class="label">接口名称:</span>
          <span class="value">{{ taskConfig.api_name || '未设置' }}</span>
        </div>
        <div class="config-item">
          <span class="label">环境ID:</span>
          <span class="value">{{ taskConfig.env_id || '默认环境' }}</span>
        </div>
        <div class="config-item">
          <span class="label">超时时间:</span>
          <span class="value">{{ taskConfig.timeout || 30 }}秒</span>
        </div>
        <div class="config-item">
          <span class="label">重试次数:</span>
          <span class="value">{{ taskConfig.retry_count || 0 }}次</span>
        </div>
      </div>
      
      <!-- API接口详情展示 -->
      <div class="test-case-display">
        <CaseEditor 
          :case-data="apiCaseData"
          :tab-id="`api-${taskConfig.api_id}`"
          :env-id="taskConfig.env_id"
          readonly
        />
      </div>
    </div>

    <!-- Web用例任务 -->
    <div v-else-if="taskConfig.task_type === 'web_case'" class="config-section">
      <h5 class="config-title">Web用例配置</h5>
      <div class="config-grid">
        <div class="config-item">
          <span class="config-label">Web用例ID:</span>
          <span class="config-value">{{ taskConfig.web_case_id || '未设置' }}</span>
        </div>
      </div>
    </div>

    <!-- 未知任务类型 -->
    <div v-else class="config-section">
      <h5 class="config-title">未知任务类型</h5>
      <div class="config-grid">
        <div class="config-item">
          <span class="config-label">任务类型:</span>
          <span class="config-value error">{{ taskConfig.task_type }}</span>
        </div>
      </div>
    </div>

    <!-- 通用等待时间配置 -->
    <div v-if="taskConfig.task_type !== 'wait' && taskConfig.wait_time > 0" class="config-section">
      <h5 class="config-title">执行后等待</h5>
      <div class="config-grid">
        <div class="config-item">
          <span class="config-label">等待时间:</span>
          <span class="config-value">{{ taskConfig.wait_time }} 秒</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { ref, reactive, watch } from 'vue'
import CaseEditor from '@/views/api_test_cases/test_cases/components/CaseEditor.vue'
import DbOperationEditor from './DbOperationEditor.vue'
import { getTestCase } from '@/views/api_test_cases/test_cases/composables/caseService'

const props = defineProps({
  taskConfig: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['open-test-case', 'open-api-interface'])

const router = useRouter()

// 响应式数据
const caseData = ref(null)
const apiCaseData = ref(null)

// 加载测试用例数据
const loadCaseData = async (caseId) => {
  if (!caseId) return
  
  try {
    const response = await getTestCase(caseId)
    console.log('TaskConfigDetail - 加载测试用例数据:', response)
    
    // 处理响应数据
    if (response && response.code === 200 && response.data) {
      caseData.value = response.data
    } else if (response && response.data) {
      caseData.value = response.data
    } else {
      caseData.value = response
    }
  } catch (error) {
    console.error('加载测试用例数据失败:', error)
    caseData.value = null
  }
}

// 加载API接口数据
const loadApiCaseData = async (apiId) => {
  if (!apiId) return
  
  try {
    const response = await getTestCase(apiId)
    console.log('TaskConfigDetail - 加载API接口数据:', response)
    
    // 处理响应数据
    if (response && response.code === 200 && response.data) {
      apiCaseData.value = response.data
    } else if (response && response.data) {
      apiCaseData.value = response.data
    } else {
      apiCaseData.value = response
    }
  } catch (error) {
    console.error('加载API接口数据失败:', error)
    apiCaseData.value = null
  }
}

// 监听taskConfig变化
watch(() => props.taskConfig, (newConfig) => {
  if (newConfig) {
    if (newConfig.task_type === 'api_case' && newConfig.case_id) {
      loadCaseData(newConfig.case_id)
    }
    if (newConfig.task_type === 'api' && newConfig.api_id) {
      loadApiCaseData(newConfig.api_id)
    }
  }
}, { immediate: true })

// 任务类型枚举映射
const getTaskTypeLabel = (taskType) => {
  const typeMap = {
    'wait': '等待时间',
    'custom': '自定义脚本',
    'public_script': '公共脚本',
    'db_operation': '数据库操作',
    'api_case': 'API用例',
    'api': 'API接口',
    'web_case': 'Web用例'
  }
  return typeMap[taskType] || taskType
}

const getTaskTypeTagType = (taskType) => {
  const typeMap = {
    'wait': 'info',
    'custom': 'warning',
    'public_script': 'success',
    'db_operation': 'danger',
    'api_case': 'primary',
    'api': 'primary',
    'web_case': 'success'
  }
  return typeMap[taskType] || 'default'
}

// 打开测试用例
const openTestCase = (caseId) => {
  if (!caseId) {
    ElMessage.warning('用例ID不存在')
    return
  }
  
  try {
    // 使用 Vue Router 跳转到测试用例页面
    // 根据项目结构，直接跳转到测试用例页面并传递参数
    const routeData = router.resolve({
      path: '/api_test_cases/test_cases',
      query: { caseId: caseId }
    })
    window.open(routeData.href, '_blank')
  } catch (error) {
    console.error('跳转到测试用例页面失败:', error)
    ElMessage.error('跳转到测试用例页面失败')
  }
}

// 打开API接口配置
const openApiInterface = (apiId) => {
  if (!apiId) {
    ElMessage.warning('接口ID不存在')
    return
  }
  
  try {
    // 使用 Vue Router 跳转到API接口配置页面
    const routeData = router.resolve({
      path: '/api_test_cases/test_cases',
      query: { apiId: apiId }
    })
    window.open(routeData.href, '_blank')
  } catch (error) {
    console.error('跳转到API接口页面失败:', error)
    ElMessage.error('跳转到API接口页面失败')
  }
}
</script>

<style scoped>
.task-config-detail {
  width: 100%;
}

.task-type-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 12px;
  background: var(--el-fill-color-extra-light);
  border-radius: 6px;
  border-left: 3px solid var(--el-color-primary);
}

.task-type-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.config-section {
  margin-bottom: 16px;
}

.config-section:last-child {
  margin-bottom: 0;
}

.config-title {
  margin: 0 0 8px 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  padding-bottom: 4px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 8px;
}

.config-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.config-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.config-item.full-width {
  grid-column: 1 / -1;
}

.config-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.label {
  min-width: 80px;
  font-weight: 500;
  color: #606266;
  margin-right: 12px;
}

.config-value {
  font-size: 13px;
  color: var(--el-text-color-primary);
  word-break: break-all;
}

.value {
  color: #303133;
  flex: 1;
}

.config-value.error {
  color: var(--el-color-danger);
  font-weight: 500;
}

.empty-value {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  font-style: italic;
}

.script-content {
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  padding: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.script-content pre {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-primary);
  white-space: pre-wrap;
  word-break: break-all;
}

.test-case-display {
  margin-top: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fafafa;
  min-height: 200px;
  max-height: 600px;
  overflow: hidden;
}

.case-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

@media (max-width: 768px) {
  .config-grid {
    grid-template-columns: 1fr;
  }
}
</style>
