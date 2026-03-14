<template>
  <div class="request-tabs">
    <el-tabs v-model="activeTab" type="card" class="request-tabs-container">
      <!-- 查询参数 -->
      <el-tab-pane label="查询参数" name="params">
        <template #label>
          <span class="tab-label">
            查询参数
            <el-badge 
              v-if="enabledParamsCount > 0" 
              :value="enabledParamsCount" 
              class="tab-badge"
            />
          </span>
        </template>
        <RequestParams
          ref="requestParamsRef"
          :key="`params-${caseData.caseId || 'new'}-${componentKey}`"
          :params-list="caseData.paramsList || []"
          :case-id="caseData.caseId"
        />
      </el-tab-pane>
      
      <!-- 请求头 -->
      <el-tab-pane label="请求头" name="headers">
        <template #label>
          <span class="tab-label">
            请求头
            <el-badge 
              v-if="enabledHeadersCount > 0" 
              :value="enabledHeadersCount"
              class="tab-badge"
            />
          </span>
        </template>
        <RequestHeaders
          ref="requestHeadersRef"
          :key="`headers-${caseData.caseId || 'new'}-${componentKey}`"
          :headers-list="caseData.headersList || []"
          :case-id="caseData.caseId" 
        />
      </el-tab-pane>
      
      <!-- Cookies -->
      <el-tab-pane label="Cookies" name="cookies">
        <template #label>
          <span class="tab-label">
            Cookies
            <el-badge 
              v-if="enabledCookiesCount > 0" 
              :value="enabledCookiesCount" 
              class="tab-badge"
            />
          </span>
        </template>
        <RequestCookies
          ref="requestCookiesRef"
          :key="`cookies-${caseData.caseId || 'new'}-${componentKey}`"
          :cookies-list="caseData.cookiesList || []"
          :case-id="caseData.caseId" 
        />
      </el-tab-pane>
      
      <!-- 请求体 -->
      <el-tab-pane label="请求体" name="body">
        <RequestBody
          ref="requestBodyRef"
          :key="`body-${caseData.caseId || 'new'}-${componentKey}`"
          :json-data="caseData.jsonData"
          :formdata="caseData.formdata"
          :file-path="caseData.filePath"
          :case-file-config="caseData.caseFileConfig"
          :request-type="caseData.requestType || 'NONE'"
          :body-type="caseData.bodyType || 'NONE'"
          :case-id="caseData.caseId"
        />
      </el-tab-pane>
      
      <!-- 前置脚本 -->
      <el-tab-pane label="前置脚本" name="pre-scripts">
        <template #label>
          <span class="tab-label">
            前置脚本
            <el-badge 
              v-if="enabledSetupCount > 0" 
              :value="enabledSetupCount" 
              class="tab-badge"
            />
          </span>
        </template>
        <PreRequestScripts
          ref="preRequestScriptsRef"
          :key="`setup-${caseData.caseId || 'new'}-${componentKey}`"
          :setup-list="caseData.setupList || []"
          :case-id="caseData.caseId"
          :env-id="envId"
        />
      </el-tab-pane>
      
      <!-- 后置脚本 -->
      <el-tab-pane label="后置脚本" name="post-scripts">
        <template #label>
          <span class="tab-label">
            后置脚本
            <el-badge 
              v-if="enabledTeardownCount > 0" 
              :value="enabledTeardownCount" 
              class="tab-badge"
            />
          </span>
        </template>
        <PostResponseScripts
          ref="postResponseScriptsRef"
          :key="`teardown-${caseData.caseId || 'new'}-${componentKey}`"
          :teardown-list="caseData.teardownList || []"
          :case-id="caseData.caseId"
          :env-id="envId"
        />
      </el-tab-pane>
      
      <!-- 断言 -->
      <el-tab-pane label="断言" name="assertions">
        <template #label>
          <span class="tab-label">
            断言
            <el-badge 
              v-if="enabledAssertionsCount > 0" 
              :value="enabledAssertionsCount" 
              class="tab-badge"
            />
          </span>
        </template>
        <Assertions
          ref="assertionsRef"
          :key="`assertions-${caseData.caseId || 'new'}-${componentKey}`"
          :assertion-list="caseData.assertionList || []"
          :case-id="caseData.caseId"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import RequestParams from './RequestParams.vue'
import RequestHeaders from './RequestHeaders.vue'
import RequestCookies from './RequestCookies.vue'
import RequestBody from './RequestBody.vue'
import PreRequestScripts from './PreRequestScripts.vue'
import PostResponseScripts from './PostResponseScripts.vue'
import Assertions from './Assertions.vue'

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

// 调试日志：检查传入的caseData
console.log('RequestTabs - caseData received:', props.caseData)
console.log('RequestTabs - caseData.caseId:', props.caseData?.caseId)
console.log('RequestTabs - caseData.requestType:', props.caseData?.requestType)

const activeTab = ref('params')

// 组件强制刷新key
const componentKey = ref(0)

// Badge刷新触发器（用于强制computed重新计算）
const badgeRefreshTrigger = ref(0)

// 子组件引用
const requestParamsRef = ref(null)
const requestHeadersRef = ref(null)
const requestCookiesRef = ref(null)
const requestBodyRef = ref(null)
const preRequestScriptsRef = ref(null)
const postResponseScriptsRef = ref(null)
const assertionsRef = ref(null)

// 计算各标签页的启用项数量 - 优先从子组件获取，否则从props获取
// 使用badgeRefreshTrigger强制在数据同步后重新计算
const enabledParamsCount = computed(() => {
  // 引用trigger以建立响应式依赖
  const _ = badgeRefreshTrigger.value
  // 尝试从子组件获取
  if (requestParamsRef.value?.getEnabledCount) {
    return requestParamsRef.value.getEnabledCount()
  }
  // 回退到props
  return props.caseData.paramsList?.filter(item => item.isRun === "1" && item.key && item.delFlag !== "1")?.length || 0
})

const enabledHeadersCount = computed(() => {
  const _ = badgeRefreshTrigger.value
  if (requestHeadersRef.value?.getEnabledCount) {
    return requestHeadersRef.value.getEnabledCount()
  }
  return props.caseData.headersList?.filter(item => item.isRun === 1 && item.key && item.delFlag !== "1")?.length || 0
})

const enabledCookiesCount = computed(() => {
  const _ = badgeRefreshTrigger.value
  if (requestCookiesRef.value?.getEnabledCount) {
    return requestCookiesRef.value.getEnabledCount()
  }
  return props.caseData.cookiesList?.filter(item => item.isRun === 1 && item.key && item.delFlag !== "1")?.length || 0
})

const enabledSetupCount = computed(() => {
  const _ = badgeRefreshTrigger.value
  if (preRequestScriptsRef.value?.getEnabledCount) {
    return preRequestScriptsRef.value.getEnabledCount()
  }
  return props.caseData.setupList?.filter(item => item.isRun === 1 && item.name && item.delFlag !== "1")?.length || 0
})

const enabledTeardownCount = computed(() => {
  const _ = badgeRefreshTrigger.value
  if (postResponseScriptsRef.value?.getEnabledCount) {
    return postResponseScriptsRef.value.getEnabledCount()
  }
  return props.caseData.teardownList?.filter(item => item.isRun === 1 && item.name && item.delFlag !== "1")?.length || 0
})

const enabledAssertionsCount = computed(() => {
  const _ = badgeRefreshTrigger.value
  if (assertionsRef.value?.getEnabledCount) {
    return assertionsRef.value.getEnabledCount()
  }
  return props.caseData.assertionList?.filter(item => item.isRun === 1 && item.jsonpath && item.delFlag !== "1")?.length || 0
})

// 刷新所有badge计数
const refreshBadgeCounts = async () => {
  await nextTick()
  // 增加trigger值以强制computed重新计算
  badgeRefreshTrigger.value++
  console.log('RequestTabs: badge counts refreshed, trigger:', badgeRefreshTrigger.value)
}

// 从所有标签页收集数据 - 通过ref调用，不依赖事件
const getAllTabsData = async () => {
  try {
    const allData = {}
    
    // 收集查询参数
    if (requestParamsRef.value?.getData) {
      allData.paramsList = requestParamsRef.value.getData()
    }
    
    // 收集请求头
    if (requestHeadersRef.value?.getData) {
      allData.headersList = requestHeadersRef.value.getData()
    }
    
    // 收集Cookies
    if (requestCookiesRef.value?.getData) {
      allData.cookiesList = requestCookiesRef.value.getData()
    }
    
    // 收集请求体
    if (requestBodyRef.value?.getData) {
      const bodyData = requestBodyRef.value.getData()
      Object.assign(allData, bodyData)
    }
    
    // 收集前置脚本 - 静默获取数据，不触发更新
    if (preRequestScriptsRef.value?.getData) {
      allData.setupList = preRequestScriptsRef.value.getData()
    }
    
    // 收集后置脚本 - 静默获取数据，不触发更新
    if (postResponseScriptsRef.value?.getData) {
      allData.teardownList = postResponseScriptsRef.value.getData()
    }
    
    // 收集断言
    if (assertionsRef.value?.getData) {
      allData.assertionList = assertionsRef.value.getData()
    }
    
    return allData
  } catch (error) {
    console.error('Error collecting tabs data:', error)
    throw error
  }
}

// 验证所有标签页
const validateAllTabs = async () => {
  const errors = []
  
  try {
    const componentsToValidate = [
      { ref: requestParamsRef, name: '查询参数' },
      { ref: requestHeadersRef, name: '请求头' },
      { ref: requestCookiesRef, name: 'Cookies' },
      { ref: requestBodyRef, name: '请求体' },
      { ref: preRequestScriptsRef, name: '前置脚本' },
      { ref: postResponseScriptsRef, name: '后置脚本' },
      { ref: assertionsRef, name: '断言' }
    ]
    
    for (const component of componentsToValidate) {
      if (component.ref.value?.validate) {
        const validation = component.ref.value.validate()
        if (!validation.isValid) {
          errors.push(`${component.name}: ${validation.errors.join(', ')}`)
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    }
  } catch (error) {
    console.error('Tabs validation error:', error)
    return {
      isValid: false,
      errors: ['标签页验证过程中发生错误']
    }
  }
}

// 重新加载所有子组件 - 关键方法，确保保存后所有组件数据同步
const reloadAllSubComponents = async (newCaseData) => {
  console.log('RequestTabs: reloading all sub-components with new data:', newCaseData)
  
  try {
    // 强制刷新所有组件（通过增加key值）
    componentKey.value++
    
    // 等待下一个tick确保组件重新渲染
    await nextTick()
    
    console.log('RequestTabs: all sub-components reloaded with componentKey:', componentKey.value)
  } catch (error) {
    console.error('Error reloading sub-components:', error)
  }
}

// 更新所有子组件的caseId
const updateComponentsCaseId = (newCaseId) => {
  console.log('RequestTabs: updateComponentsCaseId called with:', newCaseId)

  // 对于新用例，通过强制刷新组件来确保数据同步
  if (newCaseId && (!props.caseData.caseId || props.caseData.caseId !== newCaseId)) {
    console.log('RequestTabs: forcing component reload due to caseId change')
    componentKey.value++
  }
}

// 无感同步 ID 到所有子组件（关键方法：只更新 ID，不触发组件重新渲染）
const syncIdsToSubComponents = async (syncedData) => {
  console.log('RequestTabs: syncIdsToSubComponents called with:', syncedData)

  try {
    // 定义需要同步的组件和对应的数据字段
    const componentsToSync = [
      { ref: requestParamsRef, field: 'paramsList', method: 'syncIds' },
      { ref: requestHeadersRef, field: 'headersList', method: 'syncIds' },
      { ref: requestCookiesRef, field: 'cookiesList', method: 'syncIds' },
      { ref: requestBodyRef, field: 'formdata', method: 'syncIds' },
      { ref: preRequestScriptsRef, field: 'setupList', method: 'syncIds' },
      { ref: postResponseScriptsRef, field: 'teardownList', method: 'syncIds' },
      { ref: assertionsRef, field: 'assertionList', method: 'syncIds' }
    ]

    // 遍历每个组件，调用其 syncIds 方法（如果存在）
    for (const component of componentsToSync) {
      if (component.ref.value && component.ref.value[component.method]) {
        const dataToSync = syncedData[component.field]
        if (dataToSync) {
          console.log(`Syncing IDs for ${component.field}:`, dataToSync)
          await component.ref.value[component.method](dataToSync)
        }
      } else {
        console.log(`Component ${component.field} does not have ${component.method} method, skipping`)
      }
    }

    // 同步完成后刷新badge计数
    await refreshBadgeCounts()

    console.log('RequestTabs: All IDs synced to sub-components without re-rendering')
  } catch (error) {
    console.error('Error syncing IDs to sub-components:', error)
  }
}

// 监听caseData的caseId变化，确保组件同步
watch(() => props.caseData.caseId, (newCaseId, oldCaseId) => {
  if (newCaseId !== oldCaseId) {
    console.log('RequestTabs: caseId changed from', oldCaseId, 'to', newCaseId, '- forcing reload')
    componentKey.value++
  }
}, { immediate: false })

// 暴露方法给父组件
defineExpose({
  getAllTabsData,
  validateAllTabs,
  updateComponentsCaseId,
  syncIdsToSubComponents,
  reloadAllSubComponents,
  refreshBadgeCounts
})
</script>

<style scoped>
.request-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0; /* 允许内部内容在纵向上充分伸展 */
}

.request-tabs-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0; /* 防止高度计算被父级溢出限制 */
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab-badge {
  transform: scale(0.8);
}

:deep(.el-tabs__header) {
  margin: 0;
  border-bottom: 1px solid var(--el-border-color);
  background-color: var(--el-bg-color-page);
  padding: 0 16px;
}

:deep(.el-tabs__nav) {
  border: none;
}

:deep(.el-tabs__item) {
  border: none;
  border-radius: 4px 4px 0 0;
  margin-right: 4px;
  padding: 0 16px;
  height: 36px;
  line-height: 36px;
  background-color: transparent;
  color: var(--el-text-color-regular);
  transition: all 0.3s ease;
}

:deep(.el-tabs__item:hover) {
  background-color: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

:deep(.el-tabs__item.is-active) {
  background-color: var(--el-bg-color);
  color: var(--el-color-primary);
  border-bottom: 2px solid var(--el-color-primary);
  font-weight: 600;
}

:deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
  padding: 0;
}

:deep(.el-tab-pane) {
  height: 100%;
  overflow: auto;
}

:deep(.el-badge) {
  vertical-align: baseline;
}

:deep(.el-badge__content) {
  font-size: 10px;
  height: 16px;
  line-height: 16px;
  padding: 0 4px;
  min-width: 16px;
}

:deep(.el-tab-pane)::-webkit-scrollbar {
  width: 6px;
}

:deep(.el-tab-pane)::-webkit-scrollbar-track {
  background: var(--el-fill-color-lighter);
}

:deep(.el-tab-pane)::-webkit-scrollbar-thumb {
  background: var(--el-fill-color-dark);
  border-radius: 3px;
}

:deep(.el-tab-pane)::-webkit-scrollbar-thumb:hover {
  background: var(--el-fill-color-darker);
}
</style>
