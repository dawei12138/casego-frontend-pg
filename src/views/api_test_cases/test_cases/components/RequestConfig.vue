<template>
  <div class="request-config">
    <!-- HTTP方法、URL和操作按钮 -->
    <div class="config-row">
      <div class="request-line">
        <el-select
          v-model="internalCaseData.method"
          placeholder="方法"
          style="width: 120px"
          :disabled="saveLoading || sendLoading"
        >
          <el-option label="GET" value="GET" />
          <el-option label="POST" value="POST" />
          <el-option label="PUT" value="PUT" />
          <el-option label="DELETE" value="DELETE" />
          <el-option label="PATCH" value="PATCH" />
          <el-option label="HEAD" value="HEAD" />
          <el-option label="OPTIONS" value="OPTIONS" />
        </el-select>
        
        <el-input
          v-model="internalCaseData.path"
          placeholder="请输入请求URL"
          class="url-input"
          :disabled="saveLoading || sendLoading"
        />
        
        <!-- 操作按钮 -->
        <div class="action-buttons">
          <!-- 发送按钮 -->
          <el-button
            type="primary"
            :loading="sendLoading"
            :disabled="saveLoading || sendLoading"
            @click="handleSend"
          >
            <el-icon v-if="!sendLoading"><Position /></el-icon>
            {{ getButtonText() }}
          </el-button>
          
          <!-- 保存按钮组 - 接口类型显示下拉，用例类型显示普通按钮 -->
          <el-button-group v-if="isApiType">
            <el-button 
              :loading="saveLoading"
              :disabled="saveLoading || sendLoading"
              @click="handleSave"
            >
              <el-icon v-if="!saveLoading"><DocumentChecked /></el-icon>
              {{ saveLoading ? '保存中...' : '保存' }}
            </el-button>
            <el-dropdown @command="handleSaveCommand" :disabled="saveLoading || sendLoading" placement="bottom-end">
              <el-button 
                :loading="saveLoading"
                :disabled="saveLoading || sendLoading"
                style="padding: 8px 8px;"
              >
                <el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="save-to-case">
                    <el-icon><DocumentCopy /></el-icon>
                    保存为用例
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </el-button-group>
          
          <!-- 非接口类型的普通保存按钮 -->
          <el-button 
            v-else
            :loading="saveLoading"
            :disabled="saveLoading || sendLoading"
            @click="handleSave"
          >
            <el-icon v-if="!saveLoading"><DocumentChecked /></el-icon>
            {{ saveLoading ? '保存中...' : '保存' }}
          </el-button>
          
          <!-- 更多操作 -->
          <el-dropdown @command="handleMoreAction" :disabled="saveLoading || sendLoading">
            <el-button text :disabled="saveLoading || sendLoading">
              更多操作
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="duplicate" :disabled="!props.caseData?.caseId">
                  <el-icon><DocumentCopy /></el-icon>
                  复制用例
                </el-dropdown-item>
                <el-dropdown-item command="export">
                  <el-icon><Download /></el-icon>
                  导出用例
                </el-dropdown-item>
                <el-dropdown-item divided command="generate-code">
                  <el-icon><Document /></el-icon>
                  生成代码
                </el-dropdown-item>
                <el-dropdown-item command="run-collection">
                  <el-icon><VideoPlay /></el-icon>
                  批量运行
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          
          <!-- 历史记录按钮 -->
          <el-button text @click="handleHistory" :disabled="saveLoading || sendLoading">
            <el-icon :size="20"><Clock /></el-icon>
          </el-button>
        </div>
      </div>
    </div>
    
    <!-- 保存为用例对话框 -->
    <el-dialog
      v-model="showSaveToCaseDialog"
      title="保存为用例"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="formData" label-width="80px">
        <el-form-item label="用例名称">
          <el-row :gutter="8" style="width: 100%;">
            <el-col :span="8">
              <el-select v-model="formData.prefix" placeholder="选择前缀" style="width: 100%;">
                <el-option label="成功  " value="成功  " />
                <el-option label="失败  " value="失败  " />
                <el-option label="缺少参数  " value="缺少参数  " />
                <el-option label="参数有误  " value="参数有误  " />
                <el-option label="记录不存在  " value="记录不存在  " />
                <el-option label="已登录  " value="已登录  " />
                <el-option label="未登录  " value="未登录  " />
                <el-option label="没有权限  " value="没有权限  " />
                <el-option label="数据为空  " value="数据为空  " />
              </el-select>
            </el-col>
            <el-col :span="16">
              <el-input v-model="formData.customName" placeholder="请输入自定义内容（可选）" />
            </el-col>
          </el-row>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showSaveToCaseDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveToCaseConfirm" :loading="saveLoading">
          确认保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, inject } from 'vue'
import {
  Position,
  DocumentChecked,
  ArrowDown,
  DocumentCopy,
  Download,
  Document,
  VideoPlay,
  Clock,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { copyTestCase } from '../composables/caseService'

const props = defineProps({
  caseData: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['send-request', 'save-case', 'save-then-copy-to-case', 'history'])
const globalState = inject('globalState')

const saveLoading = ref(false)
const sendLoading = ref(false)
const copyLoading = ref(false)
const showSaveToCaseDialog = ref(false)

const internalCaseData = reactive({
  method: 'GET',
  path: '',
  name: '',
  description: ''
})

const formData = reactive({
  prefix: '成功  ',
  customName: ''
})

// 判断是否为接口类型（caseType为"1"表示接口）
const isApiType = computed(() => {
  return props.caseData?.caseType === "1"
})

const getButtonText = () => {
  if (sendLoading.value) {
    // 发送按钮 loading 时显示"发送中..."
    // 注意：实际上会先保存再发送，但为了避免用户混淆，统一显示"发送中..."
    return '发送中...'
  }
  return '发送'
}

const initializeData = () => {
  Object.assign(internalCaseData, {
    method: props.caseData.method || 'GET',
    path: props.caseData.path || '',
    name: props.caseData.name || '',
    description: props.caseData.description || ''
  })
}

// 处理保存命令
const handleSaveCommand = (command) => {
  if (saveLoading.value || sendLoading.value) return
  
  switch (command) {
    case 'save-to-case':
      showSaveToCaseDialog.value = true
      // 重置表单数据
      formData.prefix = '成功  '
      formData.customName = ''
      break
  }
}

// 处理保存为用例确认 - 修改为先保存再复制
const handleSaveToCaseConfirm = async () => {
  if (!props.caseData?.caseId) {
    ElMessage.error('用例ID不存在，无法保存')
    return
  }
  
  // 构建用例名称：前缀 + 自定义内容（如果有的话）
  let caseName = formData.prefix
  if (formData.customName && formData.customName.trim()) {
    caseName += formData.customName.trim()
  }
  
  if (!caseName) {
    ElMessage.error('用例名称不能为空')
    return
  }
  
  // 通过事件流先保存当前用例，然后执行保存为用例的逻辑
  emit('save-then-copy-to-case', {
    caseName,
    originalCaseId: props.caseData.caseId,
    moduleId: props.caseData.moduleId
  })
  
  showSaveToCaseDialog.value = false
}

// 复制用例逻辑
const handleCopyCase = async () => {
  if (!props.caseData?.caseId || copyLoading.value) {
    if (!props.caseData?.caseId) {
      ElMessage.error('无法复制用例：用例ID不存在')
    }
    return
  }

  copyLoading.value = true

  try {
    const response = await copyTestCase(props.caseData.caseId)
    
    if (response && response.code === 200) {
      ElMessage.success(`复制用例成功：${props.caseData.name || '未命名用例'}`)
      
      // 只发出一个事件，避免多次刷新
      if (globalState && globalState.eventBus) {
        globalState.eventBus.emit('refresh-tree-after-copy', {
          originalCaseId: props.caseData.caseId,
          newCaseId: response.caseId,
          moduleId: props.caseData.moduleId
        })
      }
    } else {
      throw new Error(response?.msg || '复制用例失败')
    }
  } catch (error) {
    console.error('Copy case error:', error)
    ElMessage.error(`复制用例失败: ${error.message}`)
  } finally {
    copyLoading.value = false
  }
}

const handleSave = async () => {
  if (saveLoading.value || sendLoading.value) return
  emit('save-case')
}

const handleSend = async () => {
  if (saveLoading.value || sendLoading.value) return
  emit('send-request')
}

const handleMoreAction = (command) => {
  if (saveLoading.value || sendLoading.value) return
  
  switch (command) {
    case 'duplicate':
      handleCopyCase()
      break
    case 'export':
      ElMessage.info('导出用例功能开发中...')
      break
    case 'generate-code':
      ElMessage.info('生成代码功能开发中...')
      break
    case 'run-collection':
      ElMessage.info('批量运行功能开发中...')
      break
  }
}

const handleHistory = () => {
  if (saveLoading.value || sendLoading.value) return
  emit('history')
}

const handleSettings = () => {
  if (saveLoading.value || sendLoading.value) return
  ElMessage.info('执行历史功能开发中...')
}

const getConfigData = () => {
  return {
    method: internalCaseData.method,
    path: internalCaseData.path,
    // name: internalCaseData.name,
    description: internalCaseData.description
  }
}

const validate = () => {
  const errors = []
  
  if (!internalCaseData.method) {
    errors.push('请求方法不能为空')
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  }
}

const resetData = () => {
  initializeData()
}

const setLoadingState = (type, loading) => {
  if (type === 'save') {
    saveLoading.value = loading
  } else if (type === 'send') {
    sendLoading.value = loading
  }
}

defineExpose({
  getConfigData,
  validate,
  resetData,
  setLoadingState
})

initializeData()
</script>

<style scoped>
.request-config {
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-bg-color-page);
}

.config-row {
  display: flex;
  align-items: center;
}

.request-line {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.url-input {
  flex: 1;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 12px;
  flex-shrink: 0;
}

/* 发送按钮特殊样式 */
.action-buttons .el-button--primary {
  font-weight: 600;
  padding: 8px 20px;
  min-width: 100px;
}

/* 加载状态下的按钮样式 */
.action-buttons .el-button.is-loading {
  pointer-events: none;
}

.action-buttons .el-button.is-disabled,
.action-buttons .el-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

/* 按钮组样式 */
:deep(.el-button-group) {
  display: inline-flex;
}

:deep(.el-button-group .el-button:first-child) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-right: none;
}

:deep(.el-button-group .el-button:last-child) {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  border-left: 1px solid var(--el-border-color);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .request-line {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .action-buttons {
    margin-left: 0;
    order: 3;
    width: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .request-line {
    flex-direction: column;
    align-items: stretch;
  }
  
  .action-buttons {
    justify-content: center;
  }
}

/* 下拉菜单样式 */
:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.el-dropdown-menu__item .el-icon) {
  margin-right: 0;
}

/* 对话框样式优化 */
:deep(.el-dialog__body) {
  padding: 20px;
}

:deep(.el-form-item__label) {
  font-weight: 600;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-input__inner) {
  border-radius: 6px;
}

:deep(.el-select .el-input__wrapper) {
  border-radius: 6px;
}

:deep(.el-button) {
  border-radius: 6px;
}
</style>