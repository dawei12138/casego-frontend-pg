<template>
  <div class="request-section">
    <!-- 基本配置（包含操作按钮） -->
    <RequestConfig
      ref="requestConfigRef"
      :case-data="caseData"
      :env-id="envId"
      @send-request="handleSend"
      @save-case="handleSave"
      @save-then-copy-to-case="handleSaveThenCopyToCase"
      @history="handleHistory"
    />
    
    <!-- 请求参数标签页 -->
    <RequestTabs
      ref="requestTabsRef"
      :case-data="caseData"
      :env-id="envId"
    />
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import RequestConfig from './RequestConfig.vue'
import RequestTabs from './RequestTabs.vue'

// Props
const props = defineProps({
  caseData: {
    type: Object,
    required: true
  },
  envId: {
    type: [Number, String],
    default: null
  }
})

// Emits
const emit = defineEmits(['send-request', 'save-case', 'save-then-copy-to-case', 'history'])

// 子组件引用
const requestConfigRef = ref(null)
const requestTabsRef = ref(null)

// 从所有子组件收集数据
const collectAllData = async () => {
  try {
    const allData = {}
    
    // 从RequestTabs收集所有标签页数据
    if (requestTabsRef.value && requestTabsRef.value.getAllTabsData) {
      const tabsData = await requestTabsRef.value.getAllTabsData()
      Object.assign(allData, tabsData)
    }
    
    // 从RequestConfig收集基础配置数据
    if (requestConfigRef.value && requestConfigRef.value.getConfigData) {
      const configData = await requestConfigRef.value.getConfigData()
      Object.assign(allData, configData)
    }
    
    return allData
  } catch (error) {
    console.error('Error collecting data from tabs:', error)
    throw error
  }
}

// 验证所有标签页数据
const validateAllTabs = async () => {
  const errors = []
  
  try {
    // 验证基本配置
    if (requestConfigRef.value && requestConfigRef.value.validate) {
      const configValidation = requestConfigRef.value.validate()
      if (!configValidation.isValid) {
        errors.push(...configValidation.errors)
      }
    }
    
    // 验证RequestTabs中的所有标签页
    if (requestTabsRef.value && requestTabsRef.value.validateAllTabs) {
      const tabsValidation = await requestTabsRef.value.validateAllTabs()
      if (!tabsValidation.isValid) {
        errors.push(...tabsValidation.errors)
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    }
  } catch (error) {
    console.error('Validation error:', error)
    return {
      isValid: false,
      errors: ['验证过程中发生错误']
    }
  }
}

// 重新加载所有组件数据 - 关键方法，确保保存后数据同步
const reloadAllComponents = async (newCaseData) => {
  console.log('RequestSection: reloading all components with new data:', newCaseData)
  
  try {
    // 等待下一个tick确保props已更新
    await nextTick()
    
    // 强制刷新RequestTabs中的所有子组件
    if (requestTabsRef.value && requestTabsRef.value.reloadAllSubComponents) {
      await requestTabsRef.value.reloadAllSubComponents(newCaseData)
    }
    
    // 强制刷新RequestConfig
    if (requestConfigRef.value && requestConfigRef.value.resetData) {
      requestConfigRef.value.resetData()
    }
    
    console.log('RequestSection: all components reloaded successfully')
  } catch (error) {
    console.error('Error reloading components:', error)
  }
}

// 更新子组件中的caseId
const updateComponentsCaseId = (newCaseId) => {
  console.log('RequestSection: updateComponentsCaseId called with:', newCaseId)
  if (requestTabsRef.value && requestTabsRef.value.updateComponentsCaseId) {
    requestTabsRef.value.updateComponentsCaseId(newCaseId)
  }
}

// 无感同步数据到子组件（只更新 ID，不触发重新渲染）
const syncIdsToComponents = async (syncedData) => {
  console.log('RequestSection: syncIdsToComponents called with:', syncedData)

  try {
    // 等待下一个tick确保数据已更新
    await nextTick()

    // 通知 RequestTabs 同步 ID 到各个子组件
    if (requestTabsRef.value && requestTabsRef.value.syncIdsToSubComponents) {
      await requestTabsRef.value.syncIdsToSubComponents(syncedData)
    }

    console.log('RequestSection: IDs synced to all components')
  } catch (error) {
    console.error('Error syncing IDs to components:', error)
  }
}

// 设置RequestConfig组件的loading状态
const setConfigLoadingState = (type, loading) => {
  if (requestConfigRef.value && requestConfigRef.value.setLoadingState) {
    requestConfigRef.value.setLoadingState(type, loading)
  }
}

// 事件处理
const handleSend = () => {
  emit('send-request')
}

const handleSave = () => {
  emit('save-case')
}

const handleSaveThenCopyToCase = (data) => {
  emit('save-then-copy-to-case', data)
}

const handleHistory = () => {
  emit('history')
}

// 监听caseData变化，确保子组件同步更新
watch(() => props.caseData, async (newCaseData, oldCaseData) => {
  // 只有当caseId发生变化时才重新加载组件
  if (newCaseData?.caseId !== oldCaseData?.caseId) {
    console.log('RequestSection: caseData changed, reloading components')
    await nextTick()
    await reloadAllComponents(newCaseData)
  }
}, { deep: true, immediate: false })

// 暴露方法给父组件
defineExpose({
  collectAllData,
  validateAllTabs,
  updateComponentsCaseId,
  syncIdsToComponents,
  setConfigLoadingState,
  reloadAllComponents
})
</script>

<style scoped>
.request-section {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
  min-height: 0; /* 确保 flex 容器可以正确收缩 */
  overflow: hidden; /* 让子组件自己处理滚动 */
}
</style>