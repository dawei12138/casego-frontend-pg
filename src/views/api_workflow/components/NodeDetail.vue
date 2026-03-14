<template>
  <div class="node-detail-panel">
    <div v-if="!nodeData" class="empty-state">
      <el-icon class="empty-icon">
        <Document />
      </el-icon>
      <p class="empty-text">请选择一个节点查看详情</p>
    </div>
    
    <div v-else class="node-content">
      <div v-if="showHeader" class="node-header">
        <h3 class="node-title">{{ nodeData.name }}</h3>
        <el-tag :type="getNodeTypeColor(nodeData.type)" size="small">
          {{ getNodeTypeText(nodeData.type) }}
        </el-tag>
      </div>
      
      <!-- 测试用例显示区域 (API和API_CASE类型) -->
      <div v-if="shouldShowTestCase && caseData" class="test-case-container">
        <CaseEditor
          ref="caseEditorRef"
          :key="`case-editor-${nodeData.nodeId}-${caseData.caseId || 'new'}`"
          :case-data="caseData"
          :tab-id="`node-${nodeData.nodeId}`"
          :env-id="envId"
          @case-save="handleCaseSave"
          @case-send="handleCaseSend"
          @case-reload-needed="handleCaseReloadNeeded"
        />
      </div>
      
      <!-- 加载状态 -->
      <div v-else-if="shouldShowTestCase && loading" class="loading-state">
        <el-icon class="is-loading">
          <Loading />
        </el-icon>
        <p>加载测试用例中...</p>
      </div>
      
      <!-- 等待节点配置 -->
      <div v-else-if="isWaitNode" class="node-config-container">
        <div class="config-section">
          <div class="config-header">
            <h4 class="config-title">等待配置</h4>
            <el-button type="primary" size="small" @click="saveNodeConfig" :loading="saveLoading">保存配置</el-button>
          </div>
          <el-form :model="nodeConfig" label-width="120px" class="config-form">
            <el-form-item label="等待时间(秒)">
              <el-input-number
                v-model="nodeConfig.waitTime"
                :min="0"
                :step="1"
                placeholder="请输入等待时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- 公共脚本节点配置 -->
      <div v-else-if="isPublicScriptNode" class="node-config-container">
        <div class="config-section">
          <div class="config-header">
            <h4 class="config-title">公共脚本配置</h4>
            <el-button type="primary" size="small" @click="saveNodeConfig" :loading="saveLoading">保存配置</el-button>
          </div>
          <el-form :model="nodeConfig" label-width="120px" class="config-form">
            <el-form-item label="节点名称">
              <el-input v-model="nodeConfig.name" placeholder="请输入节点名称" />
            </el-form-item>
            <el-form-item label="选择公共脚本">
              <el-select
                v-model="nodeConfig.publicscript"
                placeholder="请选择公共脚本"
                clearable
                filterable
                :loading="scriptListLoading"
                @change="handleScriptChange"
                style="width: 100%"
              >
                <el-option
                  v-for="script in publicScriptList"
                  :key="script.scriptId"
                  :label="`${script.scriptName} (${script.scriptType})`"
                  :value="String(script.scriptId)"
                >
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>{{ script.scriptName }}</span>
                    <el-tag :type="script.scriptType === 'python' ? 'success' : 'warning'" size="small">
                      {{ script.scriptType === 'python' ? 'Python' : 'JavaScript' }}
                    </el-tag>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="脚本内容">
              <div class="script-editor-wrapper">
                <div class="editor-toolbar">
                  <div class="toolbar-left">
                    <el-tag v-if="currentScriptType" :type="currentScriptType === 'python' ? 'success' : 'warning'" size="small">
                      {{ currentScriptType === 'python' ? 'Python' : 'JavaScript' }}
                    </el-tag>
                  </div>
                  <div class="toolbar-right">
                    <el-button size="small" :icon="publicScriptFullscreen ? Close : FullScreen" @click="togglePublicScriptFullscreen">
                      {{ publicScriptFullscreen ? '退出全屏' : '全屏' }}
                    </el-button>
                    <el-button
                      size="small"
                      type="primary"
                      :loading="publicScriptDebugLoading"
                      :disabled="!nodeConfig.publicscript"
                      @click="handleDebugPublicScript"
                    >
                      <el-icon><VideoPlay /></el-icon>
                      调试执行
                    </el-button>
                  </div>
                </div>
                <div class="monaco-editor-wrapper" :class="{ 'is-fullscreen': publicScriptFullscreen }">
                  <div v-if="publicScriptFullscreen" class="monaco-fullscreen-toolbar">
                    <el-button size="small" :icon="Close" @click="togglePublicScriptFullscreen">
                      退出全屏
                    </el-button>
                  </div>
                  <div
                    ref="publicScriptEditorContainer"
                    class="monaco-editor-container"
                  ></div>
                </div>
              </div>
            </el-form-item>

            <!-- 调试结果展示 -->
            <el-form-item v-if="publicScriptDebugResult" label="执行结果">
              <div class="debug-result">
                <div class="result-header">
                  <el-tag :type="publicScriptDebugResult.success ? 'success' : 'danger'" size="small">
                    {{ publicScriptDebugResult.success ? '执行成功' : '执行失败' }}
                  </el-tag>
                  <el-button size="small" text type="info" @click="publicScriptDebugResult = null">
                    <el-icon><Close /></el-icon>
                    关闭
                  </el-button>
                </div>
                <div class="result-content">
                  <div v-if="publicScriptDebugResult.logs" class="result-output">
                    <div class="output-label">执行日志:</div>
                    <pre class="output-text">{{ publicScriptDebugResult.logs }}</pre>
                  </div>
                  <div v-if="publicScriptDebugResult.error" class="result-error">
                    <div class="output-label">错误信息:</div>
                    <el-alert :title="publicScriptDebugResult.error" type="error" :closable="false" show-icon />
                  </div>
                  <div v-if="publicScriptDebugResult.result !== null && publicScriptDebugResult.result !== undefined" class="result-return">
                    <div class="output-label">返回值:</div>
                    <pre class="output-text">{{ formatDebugReturnValue(publicScriptDebugResult.result) }}</pre>
                  </div>
                </div>
              </div>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- 自定义脚本节点配置 -->
      <div v-else-if="isCustomScriptNode" class="node-config-container">
        <div class="config-section">
          <div class="config-header">
            <h4 class="config-title">自定义脚本配置</h4>
            <el-button type="primary" size="small" @click="saveNodeConfig" :loading="saveLoading">保存配置</el-button>
          </div>
          <el-form :model="nodeConfig" label-width="120px" class="config-form">
            <el-form-item label="节点名称">
              <el-input v-model="nodeConfig.name" placeholder="请输入节点名称" />
            </el-form-item>
            <el-form-item label="自定义脚本">
              <div class="script-editor-wrapper">
                <div class="editor-toolbar">
                  <div class="toolbar-left">
                    <el-button size="small" @click="insertCustomScriptTemplate">
                      <el-icon><DocumentCopy /></el-icon>
                      插入模板
                    </el-button>
                    <el-button size="small" @click="clearCustomScriptContent">
                      <el-icon><Delete /></el-icon>
                      清空
                    </el-button>
                  </div>
                  <div class="toolbar-right">
                    <el-button size="small" :icon="customScriptFullscreen ? Close : FullScreen" @click="toggleCustomScriptFullscreen">
                      {{ customScriptFullscreen ? '退出全屏' : '全屏' }}
                    </el-button>
                    <el-button
                      size="small"
                      type="primary"
                      :loading="customScriptDebugLoading"
                      :disabled="!nodeConfig.customScript"
                      @click="handleDebugCustomScript"
                    >
                      <el-icon><VideoPlay /></el-icon>
                      调试执行
                    </el-button>
                  </div>
                </div>
                <div class="monaco-editor-wrapper" :class="{ 'is-fullscreen': customScriptFullscreen }">
                  <div v-if="customScriptFullscreen" class="monaco-fullscreen-toolbar">
                    <el-button size="small" :icon="Close" @click="toggleCustomScriptFullscreen">
                      退出全屏
                    </el-button>
                  </div>
                  <div
                    ref="customScriptEditorContainer"
                    class="monaco-editor-container"
                  ></div>
                </div>
              </div>
            </el-form-item>

            <!-- 调试结果展示 -->
            <el-form-item v-if="customScriptDebugResult" label="执行结果">
              <div class="debug-result">
                <div class="result-header">
                  <el-tag :type="customScriptDebugResult.success ? 'success' : 'danger'" size="small">
                    {{ customScriptDebugResult.success ? '执行成功' : '执行失败' }}
                  </el-tag>
                  <el-button size="small" text type="info" @click="customScriptDebugResult = null">
                    <el-icon><Close /></el-icon>
                    关闭
                  </el-button>
                </div>
                <div class="result-content">
                  <div v-if="customScriptDebugResult.logs" class="result-output">
                    <div class="output-label">执行日志:</div>
                    <pre class="output-text">{{ customScriptDebugResult.logs }}</pre>
                  </div>
                  <div v-if="customScriptDebugResult.error" class="result-error">
                    <div class="output-label">错误信息:</div>
                    <el-alert :title="customScriptDebugResult.error" type="error" :closable="false" show-icon />
                  </div>
                  <div v-if="customScriptDebugResult.result !== null && customScriptDebugResult.result !== undefined" class="result-return">
                    <div class="output-label">返回值:</div>
                    <pre class="output-text">{{ formatDebugReturnValue(customScriptDebugResult.result) }}</pre>
                  </div>
                </div>
              </div>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- 数据库操作节点配置 -->
      <div v-else-if="isDbOperationNode" class="node-config-container">
        <div class="config-section">
          <div class="config-header">
            <h4 class="config-title">数据库操作配置</h4>
            <el-button type="primary" size="small" @click="saveNodeConfig" :loading="saveLoading">保存配置</el-button>
          </div>
          <el-form :model="nodeConfig" label-width="100px" class="config-form">
            <el-form-item label="节点名称">
              <el-input v-model="nodeConfig.name" placeholder="请输入节点名称" />
            </el-form-item>
          </el-form>
          <DbOperationEditor
            ref="dbEditorRef"
            v-model:model-db-id="nodeConfig.dbOperationId"
            v-model:model-script="nodeConfig.dbOperationScript"
            :editor-height="250"
            @change="handleDbEditorChange"
          />
        </div>
      </div>

      <!-- IF节点配置 -->
      <div v-else-if="isIfNode" class="node-config-container">
        <div class="config-section">
          <div class="config-header">
            <h4 class="config-title">条件判断配置</h4>
            <el-button type="primary" size="small" @click="saveNodeConfig" :loading="saveLoading">保存配置</el-button>
          </div>
          <el-form :model="nodeConfig" label-width="120px" class="config-form">
            <el-form-item label="实际值表达式">
              <el-input 
                v-model="nodeConfig.actual_value" 
                placeholder="请输入实际值表达式"
              />
            </el-form-item>
            <el-form-item label="比较条件">
              <el-select v-model="nodeConfig.condition" placeholder="请选择比较条件" style="width: 100%">
                <el-option label="等于" value="=" />
                <el-option label="不等于" value="!=" />
                <el-option label="存在" value="exist" />
                <el-option label="不存在" value="not_exist" />
                <el-option label="大于" value=">" />
                <el-option label="大于等于" value=">=" />
                <el-option label="小于" value="<" />
                <el-option label="小于等于" value="<=" />
                <el-option label="正则匹配" value="REGULAR_TYPE" />
                <el-option label="包含" value="contain" />
                <el-option label="不包含" value="not_contain" />
                <el-option label="为空" value="is_null" />
                <el-option label="不为空" value="is_not_null" />
                <el-option label="属于集合" value="belong_to_set" />
                <el-option label="不属于集合" value="not_belong_to_set" />
              </el-select>
            </el-form-item>
            <el-form-item v-if="shouldShowExpectedValue" label="期望值">
              <el-input 
                v-model="nodeConfig.expected_value" 
                placeholder="请输入期望值"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- ELSE节点配置
      <div v-else-if="isElseNode" class="node-config-container">
        <div class="config-section">
          <h4 class="config-title">Else节点配置</h4>
          <el-form :model="nodeConfig" label-width="120px" class="config-form">
            <el-form-item label="绑定的IF节点ID">
              <el-input-number 
                v-model="nodeConfig.bind_if_node_id" 
                :min="1"
                placeholder="请输入绑定的IF节点ID"
                style="width: 100%"
              />
            </el-form-item>
          </el-form>
          <div class="config-actions">
            <el-button type="primary" @click="saveNodeConfig">保存配置</el-button>
          </div>
        </div>
      </div> -->
      
      <!-- FOR节点配置 -->
      <div v-else-if="isForNode" class="node-config-container">
        <div class="config-section">
          <div class="config-header">
            <h4 class="config-title">For循环配置</h4>
            <el-button type="primary" size="small" @click="saveNodeConfig" :loading="saveLoading">保存配置</el-button>
          </div>
          <el-form :model="nodeConfig" label-width="120px" class="config-form">
            <el-form-item label="循环次数">
              <el-input-number 
                v-model="nodeConfig.loop_count" 
                :min="1"
                placeholder="请输入循环次数"
                style="width: 100%"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- FOREACH节点配置 -->
      <div v-else-if="isForeachNode" class="node-config-container">
        <div class="config-section">
          <div class="config-header">
            <h4 class="config-title">Foreach循环配置</h4>
            <el-button type="primary" size="small" @click="saveNodeConfig" :loading="saveLoading">保存配置</el-button>
          </div>
          <el-form :model="nodeConfig" label-width="120px" class="config-form">
            <el-form-item label="遍历数组">
              <el-input 
                v-model="loopArrayText" 
                type="textarea"
                :rows="4"
                placeholder="请输入数组元素，每行一个"
                @keydown.enter.prevent="handleEnterKey"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- GROUP节点配置 -->
      <div v-else-if="isGroupNode" class="node-config-container">
        <div class="config-section">
          <div class="config-header">
            <h4 class="config-title">分组节点配置</h4>
            <el-button type="primary" size="small" @click="saveNodeConfig" :loading="saveLoading">保存配置</el-button>
          </div>
          <el-form :model="nodeConfig" label-width="120px" class="config-form">
            <el-form-item label="节点名称">
              <el-input v-model="nodeConfig.name" placeholder="请输入节点名称" />
            </el-form-item>
            <el-form-item label="节点类型">
              <el-input value="分组节点" disabled />
            </el-form-item>
            <el-form-item label="描述">
              <el-input
                v-model="nodeConfig.description"
                type="textarea"
                :rows="3"
                placeholder="分组节点用于组织和管理其他节点，本身不包含具体的执行逻辑。"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>
      
      <!-- 其他类型节点的空状态 -->
      <div v-else class="empty-test-case">
        <el-icon class="empty-icon">
          <InfoFilled />
        </el-icon>
        <p class="empty-text">此节点类型暂不支持配置显示</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick, toRaw, onBeforeUnmount, onMounted } from 'vue'
import { Document, InfoFilled, Loading, VideoPlay, FullScreen, Close, DocumentCopy } from '@element-plus/icons-vue'
import CaseEditor from '@/views/api_test_cases/test_cases/components/CaseEditor.vue'
import DbOperationEditor from './DbOperationEditor.vue'
import { getTestCase } from '@/views/api_test_cases/test_cases/composables/caseService'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import { listScript_library, getScript_library, updateScript_library } from '@/api/api_script_library/script_library'
import * as monaco from 'monaco-editor'

const props = defineProps({
  nodeData: {
    type: Object,
    required: true
  },
  envId: {
    type: [Number, String],
    default: null
  },
  showHeader: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['close', 'edit', 'node-saved'])

// 响应式数据
const loading = ref(false)
const saveLoading = ref(false)
const caseData = ref(null)
const caseEditorRef = ref(null)  // CaseEditor组件引用
const nodeConfig = ref({})
const initialNodeConfig = ref({})  // 存储初始配置用于脏数据检测
const dbEditorRef = ref(null)

// 公共脚本相关状态
const publicScriptList = ref([])
const scriptListLoading = ref(false)
const currentScriptType = ref(null)
const currentScriptContent = ref('')  // 存储当前脚本内容
const currentScriptData = ref(null)  // 存储完整的脚本数据
const publicScriptEditorContainer = ref(null)
const publicScriptEditorInstance = ref(null)
const publicScriptFullscreen = ref(false)
const publicScriptDebugLoading = ref(false)
const publicScriptDebugResult = ref(null)

// 自定义脚本相关状态
const customScriptEditorContainer = ref(null)
const customScriptEditorInstance = ref(null)
const customScriptFullscreen = ref(false)
const customScriptDebugLoading = ref(false)
const customScriptDebugResult = ref(null)

// 节点类型相关函数
const getNodeTypeColor = (type) => {
  const typeMap = {
    'task': 'primary',
    'condition': 'warning',
    'loop': 'info',
    'parallel': 'success'
  }
  return typeMap[type] || 'default'
}

const getNodeTypeText = (type) => {
  const typeMap = {
    'task': '任务节点',
    'condition': '条件节点',
    'loop': '循环节点',
    'parallel': '并行节点'
  }
  return typeMap[type] || '未知类型'
}

// 节点类型判断 - 根据实际数据结构
const getTaskType = computed(() => {
  return props.nodeData?.config?.taskConfig?.taskType
})

const getNodeType = computed(() => {
  return props.nodeData?.type
})

// 是否应该显示测试用例
const shouldShowTestCase = computed(() => {
  const taskType = getTaskType.value
  console.log('NodeDetail shouldShowTestCase - taskType:', taskType)
  return taskType === 'api' || taskType === 'api_case'
})

// 各种节点类型判断 - 基于节点的type字段和taskConfig
const isWaitNode = computed(() => getTaskType.value === 'wait')
const isPublicScriptNode = computed(() => getTaskType.value === 'public_script')
const isCustomScriptNode = computed(() => getTaskType.value === 'custom')
const isDbOperationNode = computed(() => getTaskType.value === 'db_operation')
const isIfNode = computed(() => getNodeType.value === 'if')
const isElseNode = computed(() => getNodeType.value === 'else')
const isForNode = computed(() => getNodeType.value === 'for')
const isForeachNode = computed(() => getNodeType.value === 'foreach')
const isGroupNode = computed(() => getNodeType.value === 'group')

// 判断是否需要显示期望值字段
const shouldShowExpectedValue = computed(() => {
  const condition = nodeConfig.value.condition
  return condition && !['exist', 'not_exist', 'is_null', 'is_not_null'].includes(condition)
})

// 用于处理foreach节点的数组文本
const loopArrayText = computed({
  get() {
    const array = nodeConfig.value.loop_array
    return Array.isArray(array) ? array.join('\n') : ''
  },
  set(value) {
    const lines = value.split('\n').filter(line => line.trim())
    nodeConfig.value.loop_array = lines.map(line => {
      const trimmed = line.trim()
      // 尝试转换为数字，如果失败则保持字符串
      const num = Number(trimmed)
      return isNaN(num) ? trimmed : num
    })
  }
})

// 获取 case_id
const getCaseId = computed(() => {
  const taskConfig = props.nodeData?.config?.taskConfig
  console.log('NodeDetail getCaseId - taskConfig:', taskConfig)
  if (taskConfig?.taskType === 'api_case' && taskConfig.caseId) {
    console.log('NodeDetail getCaseId - returning caseId:', taskConfig.caseId)
    return taskConfig.caseId
  }
  return null
})

// 获取 api_id
const getApiId = computed(() => {
  const taskConfig = props.nodeData?.config?.taskConfig
  console.log('NodeDetail getApiId - taskConfig:', taskConfig)
  // 对于 api_case 类型，如果没有 caseId，则使用 apiId
  // 对于 api 类型，直接使用 apiId
  if ((taskConfig?.taskType === 'api_case' && !taskConfig.caseId && taskConfig.apiId) ||
      (taskConfig?.taskType === 'api' && taskConfig.apiId)) {
    console.log('NodeDetail getApiId - returning apiId:', taskConfig.apiId)
    return taskConfig.apiId
  }
  return null
})

// 加载测试用例数据
const loadCaseData = async () => {
  if (!shouldShowTestCase.value) {
    caseData.value = null
    return
  }

  const caseId = getCaseId.value
  const apiId = getApiId.value
  
  if (!caseId && !apiId) {
    console.log('NodeDetail: No caseId or apiId found')
    caseData.value = null
    return
  }

  try {
    loading.value = true
    console.log('NodeDetail: Loading case data with caseId:', caseId, 'apiId:', apiId)
    
    const response = await getTestCase(caseId || apiId)
    console.log('NodeDetail: API response:', response)
    
    // 检查响应结构并提取数据
    if (response && response.code === 200 && response.data) {
      console.log('NodeDetail: Case data extracted:', response.data)
      caseData.value = response.data
    } else if (response && response.data) {
      // 兼容不同的响应格式
      console.log('NodeDetail: Using response data directly:', response.data)
      caseData.value = response.data
    } else {
      console.warn('NodeDetail: Invalid response format:', response)
      caseData.value = null
    }
  } catch (error) {
    console.error('NodeDetail: Failed to load case data:', error)
    caseData.value = null
  } finally {
    loading.value = false
  }
}

// 初始化节点配置
const initNodeConfig = () => {
  if (!props.nodeData) {
    nodeConfig.value = {}
    initialNodeConfig.value = {}
    return
  }

  const taskType = getTaskType.value
  const nodeType = getNodeType.value
  const config = props.nodeData.config || {}

  // 根据节点类型获取配置
  if (nodeType === 'if') {
    nodeConfig.value = {
      expected_value: config.expectedValue || '',
      actual_value: config.actualValue || '',
      condition: config.condition || 'EQUAL',
      else_node_id: config.elseNodeId || null
    }
  } else if (nodeType === 'else') {
    nodeConfig.value = {
      bind_if_node_id: config.bindIfNodeId || null
    }
  } else if (nodeType === 'for') {
    nodeConfig.value = {
      loop_count: config.loopCount || 1
    }
  } else if (nodeType === 'foreach') {
    nodeConfig.value = {
      loop_array: config.loopArray || []
    }
  } else if (nodeType === 'group') {
    nodeConfig.value = {
      name: props.nodeData.name || '',
      description: config.description || ''
    }
  } else if (config.taskConfig) {
    // 处理基于taskConfig的节点类型
    const taskConfig = config.taskConfig
    switch (taskType) {
      case 'wait':
        nodeConfig.value = {
          waitTime: taskConfig.waitTime || 0
        }
        break
      case 'public_script':
        nodeConfig.value = {
          name: props.nodeData.name || '',
          publicscript: taskConfig.publicscript ? String(taskConfig.publicscript) : null,  // 确保是字符串
          taskType: 'public_script'  // 保留taskType
        }
        // 如果有脚本ID，加载脚本详情
        if (taskConfig.publicscript) {
          loadPublicScriptDetail(String(taskConfig.publicscript))
        }
        break
      case 'custom':
        nodeConfig.value = {
          name: props.nodeData.name || '',
          customScript: taskConfig.customScript || ''
        }
        // 编辑器会在节点展开时初始化，这里不需要初始化
        break
      case 'db_operation':
        nodeConfig.value = {
          name: props.nodeData.name || '',
          dbOperationId: taskConfig.dbOperationId || null,
          dbOperationScript: taskConfig.dbOperationScript || ''
        }
        break
      default:
        nodeConfig.value = {}
    }
  } else {
    nodeConfig.value = {}
  }

  // 保存初始配置的深拷贝用于脏数据检测
  initialNodeConfig.value = JSON.parse(JSON.stringify(nodeConfig.value))
}

// 检测是否有未保存的更改
const hasUnsavedChanges = () => {
  try {
    const currentConfigStr = JSON.stringify(nodeConfig.value)
    const initialConfigStr = JSON.stringify(initialNodeConfig.value)
    return currentConfigStr !== initialConfigStr
  } catch (error) {
    console.error('Error checking unsaved changes:', error)
    return false
  }
}

// 保存节点配置
const saveNodeConfig = async () => {
  if (!props.nodeData || !nodeConfig.value) return

  try {
    saveLoading.value = true
    const nodeId = props.nodeData.nodeId
    const taskType = getTaskType.value
    const nodeType = getNodeType.value

    if (!nodeId) {
      ElMessage.error('节点ID不存在')
      return
    }

    // 如果是公共脚本节点，先保存脚本内容
    if (taskType === 'public_script' && nodeConfig.value.publicscript && currentScriptData.value) {
      try {
        await updateScript_library({
          scriptId: nodeConfig.value.publicscript,
          scriptName: currentScriptData.value.scriptName,
          scriptType: currentScriptData.value.scriptType,
          scriptContent: currentScriptContent.value,
          status: currentScriptData.value.status
        })
        ElMessage.success('公共脚本内容已更新')
      } catch (error) {
        console.error('Failed to update script:', error)
        ElMessage.error('更新脚本内容失败：' + (error.message || '未知错误'))
        return
      }
    }
    
    // 构建基础节点数据，排除children
    const baseNodeData = {
      nodeId: props.nodeData.nodeId,
      id: props.nodeData.id,
      name: props.nodeData.name,
      type: props.nodeData.type,
      workflowId: props.nodeData.workflowId,
      position: props.nodeData.position,
      // 排除children字段
    }
    
    let updateData = {}
    
    // 根据节点类型构建更新数据
    if (nodeType === 'if') {
      updateData = {
        ...baseNodeData,
        config: {
          ...props.nodeData.config,
          expectedValue: nodeConfig.value.expected_value,
          actualValue: nodeConfig.value.actual_value,
          condition: nodeConfig.value.condition,
          elseNodeId: nodeConfig.value.else_node_id
        }
      }
    } else if (nodeType === 'else') {
      updateData = {
        ...baseNodeData,
        config: {
          ...props.nodeData.config,
          bindIfNodeId: nodeConfig.value.bind_if_node_id
        }
      }
    } else if (nodeType === 'for') {
      updateData = {
        ...baseNodeData,
        config: {
          ...props.nodeData.config,
          loopCount: nodeConfig.value.loop_count
        }
      }
    } else if (nodeType === 'foreach') {
      updateData = {
        ...baseNodeData,
        config: {
          ...props.nodeData.config,
          loopArray: nodeConfig.value.loop_array
        }
      }
    } else if (nodeType === 'group') {
      // 分组节点：名称保存到节点的name属性，描述保存到config
      updateData = {
        ...baseNodeData,
        name: nodeConfig.value.name || props.nodeData.name,
        config: {
          ...props.nodeData.config,
          description: nodeConfig.value.description
        }
      }
    } else {
      // 处理基于taskConfig的节点类型（脚本节点等）
      const { name, ...taskConfigData } = nodeConfig.value

      // 确保 publicscript 是字符串类型
      if (taskConfigData.publicscript) {
        taskConfigData.publicscript = String(taskConfigData.publicscript)
      }

      updateData = {
        ...baseNodeData,
        name: name || props.nodeData.name, // 名称保存到节点的name属性
        config: {
          ...props.nodeData.config,
          taskConfig: {
            ...props.nodeData.config.taskConfig,
            ...taskConfigData // 合并taskConfigData，确保包含taskType和publicscript
          }
        }
      }
    }

    console.log('Saving node config (without children):', updateData)

    const response = await request({
      url: `/api_worknodes/worknodes`,
      method: 'put',
      data: updateData
    })

    if (response.code === 200) {
      ElMessage.success('配置保存成功')
      // 更新本地数据
      if (nodeType === 'if' || nodeType === 'else' || nodeType === 'for' || nodeType === 'foreach') {
        Object.assign(props.nodeData.config, updateData.config)
      } else if (nodeType === 'group') {
        // 分组节点：更新名称和描述
        props.nodeData.name = updateData.name
        Object.assign(props.nodeData.config, updateData.config)
      } else {
        // 脚本节点等：更新名称和taskConfig
        if (updateData.name) {
          props.nodeData.name = updateData.name
        }
        const { name, ...taskConfigData } = nodeConfig.value
        Object.assign(props.nodeData.config.taskConfig, taskConfigData)
      }

      // 更新初始配置，表示已保存
      initialNodeConfig.value = JSON.parse(JSON.stringify(nodeConfig.value))

      // 发出事件通知父组件刷新节点树
      emit('node-saved', props.nodeData)
    } else {
      ElMessage.error(response.msg || '保存失败')
    }
  } catch (error) {
    console.error('Save node config error:', error)
    ElMessage.error('保存失败：' + (error.message || '未知错误'))
  } finally {
    saveLoading.value = false
  }
}

// 处理回车键事件
const handleEnterKey = (event) => {
  const textarea = event.target
  const cursorPosition = textarea.selectionStart
  const currentValue = loopArrayText.value

  // 在光标位置插入换行符
  const newValue = currentValue.slice(0, cursorPosition) + '\n' + currentValue.slice(cursorPosition)
  loopArrayText.value = newValue

  // 设置光标位置到新行
  nextTick(() => {
    textarea.selectionStart = textarea.selectionEnd = cursorPosition + 1
  })
}

// 处理数据库编辑器变化
const handleDbEditorChange = ({ dbOperationId, dbOperationScript }) => {
  // 自动更新节点名称
  if (dbOperationId && dbEditorRef.value && nodeConfig.value.name === '数据库查询') {
    const dbName = dbEditorRef.value.getSelectedDbName()
    if (dbName) {
      nodeConfig.value.name = `查询_${dbName}`
    }
  }
}

// 公共脚本相关方法

// 加载公共脚本列表
const loadPublicScriptList = async () => {
  try {
    scriptListLoading.value = true
    const response = await listScript_library({
      status: 1, // 只加载启用状态的脚本
      pageNum: 1,
      pageSize: 1000
    })
    if (response && response.rows) {
      publicScriptList.value = response.rows
    }
  } catch (error) {
    console.error('Failed to load public script list:', error)
    ElMessage.error('加载公共脚本列表失败')
  } finally {
    scriptListLoading.value = false
  }
}

// 加载公共脚本详情
const loadPublicScriptDetail = async (scriptId) => {
  if (!scriptId) return

  try {
    const response = await getScript_library(scriptId)
    if (response && response.data) {
      const scriptData = response.data
      currentScriptType.value = scriptData.scriptType
      currentScriptContent.value = scriptData.scriptContent || ''
      currentScriptData.value = scriptData  // 保存完整数据

      // 初始化Monaco Editor
      nextTick(() => {
        initPublicScriptEditor()
      })
    }
  } catch (error) {
    console.error('Failed to load script detail:', error)
    ElMessage.error('加载脚本详情失败')
  }
}

// 处理脚本选择变化
const handleScriptChange = async (scriptId) => {
  if (!scriptId) {
    currentScriptType.value = null
    currentScriptContent.value = ''
    currentScriptData.value = null
    if (publicScriptEditorInstance.value) {
      toRaw(publicScriptEditorInstance.value).setValue('')
    }
    return
  }

  // 确保 scriptId 是字符串
  nodeConfig.value.publicscript = String(scriptId)
  await loadPublicScriptDetail(String(scriptId))
}

// 初始化Monaco Editor
const initPublicScriptEditor = () => {
  if (!publicScriptEditorContainer.value) return

  // 清理旧实例
  if (publicScriptEditorInstance.value) {
    toRaw(publicScriptEditorInstance.value).dispose()
    publicScriptEditorInstance.value = null
  }

  const language = currentScriptType.value === 'python' ? 'python' : 'javascript'

  const instance = monaco.editor.create(publicScriptEditorContainer.value, {
    value: currentScriptContent.value || '',
    language: language,
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 13,
    tabSize: 2,
    insertSpaces: true,
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    renderWhitespace: 'selection',
    bracketPairColorization: { enabled: true },
    readOnly: false  // 可编辑模式
  })

  publicScriptEditorInstance.value = instance

  // 监听内容变化
  instance.onDidChangeModelContent(() => {
    const rawEditor = toRaw(instance)
    currentScriptContent.value = rawEditor.getValue()
  })
}

// 切换全屏
const togglePublicScriptFullscreen = () => {
  publicScriptFullscreen.value = !publicScriptFullscreen.value
  nextTick(() => {
    if (publicScriptEditorInstance.value) {
      setTimeout(() => {
        toRaw(publicScriptEditorInstance.value).layout()
      }, 50)
    }
  })
}

// 调试公共脚本
const handleDebugPublicScript = async () => {
  if (!nodeConfig.value.publicscript) {
    ElMessage.warning('请先选择公共脚本')
    return
  }

  if (!props.envId) {
    ElMessage.warning('请先选择环境')
    return
  }

  publicScriptDebugLoading.value = true
  publicScriptDebugResult.value = null

  try {
    // 使用环境ID进行调试
    const response = await request({
      url: '/api_script_library/script_library/debug',
      method: 'post',
      data: {
        scriptId: String(nodeConfig.value.publicscript),
        envId: props.envId
      }
    })

    publicScriptDebugResult.value = {
      success: response.data?.success ?? false,
      logs: response.data?.logs || '',
      error: response.data?.error || '',
      result: response.data?.result
    }
  } catch (error) {
    publicScriptDebugResult.value = {
      success: false,
      error: error.message || '执行脚本失败',
      logs: ''
    }
  } finally {
    publicScriptDebugLoading.value = false
  }
}

// 格式化调试返回值
const formatDebugReturnValue = (value) => {
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}

// 自定义脚本相关方法

// 初始化自定义脚本编辑器
const initCustomScriptEditor = () => {
  if (!customScriptEditorContainer.value) return

  // 清理旧实例
  if (customScriptEditorInstance.value) {
    toRaw(customScriptEditorInstance.value).dispose()
    customScriptEditorInstance.value = null
  }

  const instance = monaco.editor.create(customScriptEditorContainer.value, {
    value: nodeConfig.value.customScript || '',
    language: 'python',  // 固定使用Python
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 13,
    tabSize: 2,
    insertSpaces: true,
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    renderWhitespace: 'selection',
    bracketPairColorization: { enabled: true }
  })

  customScriptEditorInstance.value = instance

  // 监听内容变化
  instance.onDidChangeModelContent(() => {
    const rawEditor = toRaw(instance)
    nodeConfig.value.customScript = rawEditor.getValue()
  })
}

// 插入自定义脚本模板
const insertCustomScriptTemplate = () => {
  const pythonTemplate = `# 自定义Python脚本
# 可用变量: context (上下文)、variables (环境变量)

def execute(context, variables):
    """
    执行自定义逻辑
    :param context: 执行上下文
    :param variables: 环境变量
    :return: 执行结果
    """
    # 在这里编写你的逻辑
    result = "Hello, CaseGo!"

    return {
        "status": "success",
        "data": result
    }
`

  if (customScriptEditorInstance.value) {
    toRaw(customScriptEditorInstance.value).setValue(pythonTemplate)
  } else {
    nodeConfig.value.customScript = pythonTemplate
  }
}

// 清空自定义脚本内容
const clearCustomScriptContent = () => {
  nodeConfig.value.customScript = ''
  if (customScriptEditorInstance.value) {
    toRaw(customScriptEditorInstance.value).setValue('')
  }
}

// 切换自定义脚本全屏
const toggleCustomScriptFullscreen = () => {
  customScriptFullscreen.value = !customScriptFullscreen.value
  nextTick(() => {
    if (customScriptEditorInstance.value) {
      setTimeout(() => {
        toRaw(customScriptEditorInstance.value).layout()
      }, 50)
    }
  })
}

// 调试自定义脚本
const handleDebugCustomScript = async () => {
  if (!nodeConfig.value.customScript) {
    ElMessage.warning('请先输入脚本内容')
    return
  }

  if (!props.envId) {
    ElMessage.warning('请先选择环境')
    return
  }

  customScriptDebugLoading.value = true
  customScriptDebugResult.value = null

  try {
    const response = await request({
      url: '/api_script_library/script_library/debug',
      method: 'post',
      data: {
        scriptType: 'python',  // 固定使用Python
        scriptContent: nodeConfig.value.customScript,
        envId: props.envId
      }
    })

    customScriptDebugResult.value = {
      success: response.data?.success ?? false,
      logs: response.data?.logs || '',
      error: response.data?.error || '',
      result: response.data?.result
    }
  } catch (error) {
    customScriptDebugResult.value = {
      success: false,
      error: error.message || '执行脚本失败',
      logs: ''
    }
  } finally {
    customScriptDebugLoading.value = false
  }
}

// 监听节点数据变化
watch(() => props.nodeData, (newNodeData, oldNodeData) => {
  console.log('NodeDetail: nodeData prop changed', { newNodeData, oldNodeData })

  // 清空之前的数据，确保界面刷新
  caseData.value = null

  // 清理公共脚本编辑器
  if (publicScriptEditorInstance.value) {
    toRaw(publicScriptEditorInstance.value).dispose()
    publicScriptEditorInstance.value = null
  }
  publicScriptFullscreen.value = false
  publicScriptDebugResult.value = null

  // 清理自定义脚本编辑器
  if (customScriptEditorInstance.value) {
    toRaw(customScriptEditorInstance.value).dispose()
    customScriptEditorInstance.value = null
  }
  customScriptFullscreen.value = false
  customScriptDebugResult.value = null

  // 初始化节点配置
  initNodeConfig()

  // 如果是公共脚本节点，加载脚本列表
  if (isPublicScriptNode.value) {
    loadPublicScriptList()
  }

  // 如果是自定义脚本节点，初始化编辑器
  if (isCustomScriptNode.value) {
    nextTick(() => {
      setTimeout(() => {
        initCustomScriptEditor()
      }, 100)
    })
  }

  // 加载新的数据
  loadCaseData()
}, { immediate: true })

// 事件处理
const handleCaseSave = (data) => {
  console.log('NodeDetail: Case saved:', data)
}

const handleCaseSend = (data) => {
  console.log('NodeDetail: Case sent:', data)
}

const handleCaseReloadNeeded = () => {
  console.log('NodeDetail: Case reload needed')
  loadCaseData()
}

// Ctrl+S 快捷键监听
const handleKeyDown = async (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault()

    // 如果是API或API_CASE类型节点，先保存用例信息
    if (shouldShowTestCase.value && caseEditorRef.value) {
      try {
        // 先保存用例信息（不显示加载状态和消息，因为后面还要保存节点配置）
        await caseEditorRef.value.executeUnifiedSave?.({
          showLoading: false,
          showMessage: false,
          skipReload: true
        })
      } catch (error) {
        console.error('Failed to save case:', error)
        ElMessage.error('保存用例失败：' + (error.message || '未知错误'))
        return // 如果用例保存失败，不继续保存节点配置
      }
    }

    // 保存节点配置
    await saveNodeConfig()
  }
}

// 组件挂载时添加快捷键监听
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

// 组件卸载前清理
onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeyDown)

  if (publicScriptEditorInstance.value) {
    toRaw(publicScriptEditorInstance.value).dispose()
    publicScriptEditorInstance.value = null
  }
  if (customScriptEditorInstance.value) {
    toRaw(customScriptEditorInstance.value).dispose()
    customScriptEditorInstance.value = null
  }
})

// 暴露方法给父组件
defineExpose({
  hasUnsavedChanges,
  saveNodeConfig
})
</script>

<style scoped>
.node-detail-panel {
  height: 100%;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.node-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.node-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.node-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.node-info {
  margin-bottom: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
}

.node-info p {
  margin: 4px 0;
  font-size: 14px;
  color: #606266;
}

.test-case-container {
  flex: 1;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  overflow: auto;
  min-height: 0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: #909399;
}

.loading-state .is-loading {
  font-size: 24px;
  margin-bottom: 12px;
}

.empty-state,
.empty-test-case {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: #909399;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #c0c4cc;
}

.empty-text {
  font-size: 14px;
  margin: 0;
}

/* 节点配置容器样式 */
.node-config-container {
  flex: 1;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  overflow-y: auto;
  min-height: 0;
}

.config-section {
  background: #fff;
  border-radius: 6px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  min-height: fit-content;
}

/* 配置头部样式 */
.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 8px;
  border-bottom: 2px solid #409eff;
}

.config-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.config-form {
  margin-bottom: 20px;
}

.config-form .el-form-item {
  margin-bottom: 18px;
}

.config-form .el-form-item__label {
  font-weight: 500;
  color: #606266;
}

/* GROUP节点信息样式 */
.group-info {
  padding: 16px;
  background: #f0f9ff;
  border-radius: 6px;
  border-left: 4px solid #409eff;
}

.group-info p {
  margin: 8px 0;
  font-size: 14px;
  color: #606266;
}

.group-info strong {
  color: #303133;
}

.group-description {
  font-style: italic;
  color: #909399 !important;
  margin-top: 12px !important;
}

/* 滚动条样式 */
.node-config-container::-webkit-scrollbar,
.test-case-container::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.node-config-container::-webkit-scrollbar-thumb,
.test-case-container::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
}

.node-config-container::-webkit-scrollbar-thumb:hover,
.test-case-container::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

.node-config-container::-webkit-scrollbar-track,
.test-case-container::-webkit-scrollbar-track {
  background: #f5f7fa;
  border-radius: 3px;
}

/* 公共脚本编辑器样式 */
.script-editor-wrapper {
  width: 100%;
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.monaco-editor-wrapper {
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* Monaco Editor 全屏工具栏 */
.monaco-fullscreen-toolbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 8px;
  gap: 8px;
  min-height: 40px;
  background-color: #252526;
  border-radius: 4px;
  margin-bottom: 8px;
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
  border-radius: 0 !important;
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

.monaco-editor-container {
  height: 300px;
  min-height: 300px;
}

/* 调试结果样式 */
.debug-result {
  width: 100%;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  padding: 12px;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.result-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-output,
.result-return {
  background: #fff;
  border-radius: 4px;
  padding: 8px 12px;
}

.output-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.output-text {
  margin: 0;
  padding: 8px;
  background: var(--el-fill-color-extra-light);
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 150px;
  overflow: auto;
}

.result-error {
  margin-top: 8px;
}
</style>