<template>
  <div class="case-editor">
    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading">
        <Loading />
      </el-icon>
      <span>加载用例详情...</span>
    </div>
    
    <div v-else-if="!currentCaseData" class="empty-container">
      <el-icon class="empty-icon">
        <Document />
      </el-icon>
      <p class="empty-text">请从左侧选择一个用例</p>
    </div>

    <!-- 请求配置区域 -->
    <div v-else class="editor-container">
      <RequestSection
        ref="requestSectionRef"
        :case-data="currentCaseData"
        :env-id="envId"
        @send-request="handleSendRequest"
        @save-case="handleSaveCase"
        @save-then-copy-to-case="handleSaveThenCopyToCase"
        @history="handleHistory"
      />
      
      <!-- 响应抽屉 -->
      <el-drawer
        v-model="showResponseDrawer"
        title="响应结果"
        direction="rtl"
        size="65%"
        :before-close="handleDrawerClose"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
      >
        <template #header="{ titleId, titleClass }">
          <div class="drawer-header">
            <h3 :id="titleId" :class="titleClass">
              <el-icon><DataAnalysis /></el-icon>
              响应结果
            </h3>
            <div class="drawer-actions">
              <el-button size="small" @click="clearResponse">清空</el-button>
              <el-button size="small" type="primary" @click="showResponseDrawer = false">
                关闭
              </el-button>
            </div>
          </div>
        </template>
        
        <ResponseViewer
          :response-data="responseData"
          :loading="sendLoading"
          :case-id="currentCaseData?.caseId"
          drawer-mode
          @refresh-case="handleRefreshCase"
        />
      </el-drawer>
      
      <!-- 历史记录抽屉 -->
      <el-drawer
        v-model="showHistoryDrawer"
        direction="rtl"
        size="65%"
        class="history-drawer"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        :show-close="false"
        :with-header="false"
      >
        <ExecutionHistory
          v-if="showHistoryDrawer && currentCaseData?.caseId"
          :case-id="currentCaseData.caseId"
          @refresh-case="handleRefreshCase"
          @close="showHistoryDrawer = false"
        />
      </el-drawer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { Loading, Document, DataAnalysis } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import RequestSection from './RequestSection.vue'
import ResponseViewer from './ResponseViewer.vue'
import ExecutionHistory from './ExecutionHistory.vue'
import { getTestCase, saveTestCase, executeTestCase } from '../composables/caseService'
import request from '@/utils/request'

// 引入样式文件
import '../styles/case-editor.css'

// Props
const props = defineProps({
  caseData: {
    type: Object,
    default: null
  },
  tabId: {
    type: String,
    required: true
  },
  envId: {
    type: [Number, String],
    default: null
  }
})

// Emits
const emit = defineEmits(['case-save', 'case-send', 'case-reload-needed'])

// 注入全局状态
const globalState = inject('globalState')

// 响应式数据
const loading = ref(false)
const saveLoading = ref(false)
const sendLoading = ref(false)
const caseDetailData = ref(null)
const requestSectionRef = ref(null)
const responseData = ref(null)
const showResponseDrawer = ref(false)
const showHistoryDrawer = ref(false)

// 保存操作锁，防止并发保存
const isSaving = ref(false)

// 当前用例数据
const currentCaseData = computed(() => {
  return caseDetailData.value || props.caseData
})

// 加载用例详情
const loadCaseDetail = async (caseId, silent = false) => {
  if (!caseId) return
  
  if (!silent) {
    loading.value = true
  }
  
  try {
    console.log('Loading case detail for caseId:', caseId)
    const response = await getTestCase(caseId)
    
    if (response && response.code === 200) {
      caseDetailData.value = response.data
      console.log('Case detail loaded successfully:', response.data)
      
      // 数据加载完成后，确保所有子组件重新初始化
      await nextTick()
      if (requestSectionRef.value?.reloadAllComponents) {
        requestSectionRef.value.reloadAllComponents(response.data)
      }
    } else {
      throw new Error(response?.msg || '加载用例详情失败')
    }
  } catch (error) {
    console.error('Failed to load case detail:', error)
    if (!silent) {
      ElMessage.error(`加载用例详情失败: ${error.message}`)
    }
    
    if (props.caseData) {
      caseDetailData.value = { ...props.caseData }
    }
  } finally {
    if (!silent) {
      loading.value = false
    }
  }
}

// 智能数据同步：直接使用后端最新数据同步子组件
const syncDataSilently = async (latestData) => {
  if (!caseDetailData.value || !latestData) {
    console.warn('Cannot sync data: missing caseDetailData or latestData')
    return
  }

  console.log('Starting silent data sync with latestData:', latestData)

  // 1. 更新基础字段（caseId 必须更新）
  if (latestData.caseId) {
    caseDetailData.value.caseId = latestData.caseId
  }

  // 2. 更新其他可能需要同步的字段
  const simpleFields = ['updateTime', 'updateBy', 'method', 'url']
  simpleFields.forEach(field => {
    if (latestData[field] !== undefined) {
      caseDetailData.value[field] = latestData[field]
    }
  })

  // 3. 直接将后端返回的最新数据传给子组件进行无感同步
  //    不再在这里修改 caseDetailData.value 的列表数据，避免传递旧数据
  await nextTick()
  if (requestSectionRef.value?.syncIdsToComponents) {
    // 直接传 latestData，让子组件用最新数据替换本地数据
    await requestSectionRef.value.syncIdsToComponents(latestData)
  }

  console.log('Silent data sync completed. LatestData synced to subcomponents')
}

// 通过ref收集所有组件数据
const collectAllDataFromRefs = async () => {
  try {
    if (!requestSectionRef.value) {
      throw new Error('RequestSection ref not available')
    }

    const allData = await requestSectionRef.value.collectAllData()
    
    const completeData = {
      caseId: currentCaseData.value?.caseId,
      // name: currentCaseData.value?.name,
      method: currentCaseData.value?.method,
      path: currentCaseData.value?.path,
      description: currentCaseData.value?.description,
      ...allData
    }

    return completeData
  } catch (error) {
    console.error('Error collecting data from refs:', error)
    throw error
  }
}

// 验证所有组件数据
const validateAllComponents = async () => {
  try {
    if (!requestSectionRef.value) {
      return { isValid: false, errors: ['组件未初始化'] }
    }

    return await requestSectionRef.value.validateAllTabs()
  } catch (error) {
    console.error('Validation error:', error)
    return {
      isValid: false,
      errors: ['验证过程中发生错误']
    }
  }
}

// 统一的保存逻辑 - 所有保存操作都通过这里
const executeUnifiedSave = async (options = {}) => {
  const {
    showLoading = true,
    showMessage = true,
    skipReload = false
  } = options

  // 防止并发保存
  if (isSaving.value) {
    console.log('Save operation already in progress, skipping...')
    return { success: false, reason: 'already_saving' }
  }

  isSaving.value = true

  if (showLoading) {
    saveLoading.value = true
    if (requestSectionRef.value?.setConfigLoadingState) {
      requestSectionRef.value.setConfigLoadingState('save', true)
    }
  }

  try {
    console.log('=== Starting unified save operation ===')

    // 1. 验证数据
    const validation = await validateAllComponents()
    if (!validation.isValid) {
      const errorMsg = `数据验证失败: ${validation.errors.join(', ')}`
      if (showMessage) {
        ElMessage.error(errorMsg)
      }
      return { success: false, reason: 'validation_failed', errors: validation.errors }
    }

    // 2. 收集数据
    const saveData = await collectAllDataFromRefs()
    if (!saveData) {
      throw new Error('无法收集用例数据')
    }

    console.log('Save data before request:', saveData)

    // 3. 保存到后端
    const result = await saveTestCase(saveData)

    if (result.code !== 200) {
      throw new Error(result.msg || '保存失败')
    }

    const returnedCaseId = result.data?.caseId || result.caseId
    const finalCaseId = returnedCaseId || saveData.caseId

    console.log('Save successful. Returned caseId:', returnedCaseId, ', Using caseId:', finalCaseId)

    // 4. 处理新用例的ID更新
    const isNewCase = !saveData.caseId && finalCaseId
    if (isNewCase) {
      console.log('New case created, updating caseId from null to:', finalCaseId)

      // 更新当前组件的caseId
      if (caseDetailData.value) {
        caseDetailData.value.caseId = finalCaseId
      }
    }

    // 5. 数据刷新/同步（无感刷新）
    if (finalCaseId) {
      if (!skipReload) {
        // 需要从后端重新拉取，保证数据完全一致
        console.log('Reloading case detail after save to ensure data consistency, caseId:', finalCaseId)
        await loadCaseDetail(finalCaseId, true)
      } else {
        // 无感刷新：只更新必要的 ID 和字段，不触发组件重载
        console.log('Silent refresh: syncing IDs and essential fields without reload, caseId:', finalCaseId)
        try {
          const latestDataResponse = await getTestCase(finalCaseId)
          if (latestDataResponse && latestDataResponse.code === 200) {
            const latestData = latestDataResponse.data
            console.log('Fetched latest data from server:', latestData)

            // 智能合并数据：只更新 ID 等关键字段，保持其他字段不变
            await syncDataSilently(latestData)

            console.log('Silent refresh completed, IDs and essential fields synced')
          }
        } catch (error) {
          console.warn('Silent refresh failed, falling back to caseId propagation:', error)
          // 如果获取失败，至少传播 caseId
          if (caseDetailData.value) {
            caseDetailData.value.caseId = finalCaseId
          }
          if (requestSectionRef.value?.updateComponentsCaseId) {
            requestSectionRef.value.updateComponentsCaseId(finalCaseId)
          }
        }
      }

      // 通知父组件更新标签页数据（确保MainWorkspace中的tab数据拿到最新caseId）
      emit('case-reload-needed', {
        tabId: props.tabId,
        caseId: finalCaseId,
        updatedData: caseDetailData.value
      })
    }

    if (showMessage) {
      ElMessage.success('保存成功')
    }

    emit('case-save', props.tabId)
    console.log('=== Unified save operation completed successfully ===')

    return {
      success: true,
      caseId: finalCaseId,
      isNewCase,
      data: caseDetailData.value
    }

  } catch (error) {
    console.error('Unified save error:', error)
    if (showMessage) {
      ElMessage.error(`保存失败: ${error.message}`)
    }
    return { success: false, reason: 'save_failed', error: error.message }
  } finally {
    isSaving.value = false
    if (showLoading) {
      saveLoading.value = false
      if (requestSectionRef.value?.setConfigLoadingState) {
        requestSectionRef.value.setConfigLoadingState('save', false)
      }
    }
  }
}

// 发送请求
const sendRequest = async () => {
  try {
    console.log('=== Starting send request ===')
    
    if (!currentCaseData.value?.caseId) {
      throw new Error('用例ID不能为空')
    }
    
    if (!props.envId) {
      throw new Error('请先选择环境')
    }
    
    const requestData = {
      caseId: currentCaseData.value.caseId,
      envId: props.envId
    }
    
    console.log('Sending request with data:', requestData)
    
    const result = await executeTestCase(requestData)
    
    if (result.code !== 200) {
      throw new Error(result.msg || '发送请求失败')
    }
    
    // 设置响应数据并打开抽屉
    responseData.value = result.data
    showResponseDrawer.value = true
    
    ElMessage.success('请求发送成功')
    emit('case-send', props.tabId, result.data)
    console.log('=== Request send completed ===')
    
  } catch (error) {
    console.error('Send error:', error)
    ElMessage.error(`请求失败: ${error.message}`)
  }
}

// 保存为用例的逻辑
const executeSaveToCaseLogic = async (caseName, originalCaseId, moduleId) => {
  try {
    const requestData = {
      caseId: originalCaseId,
      name: caseName
    }
    
    console.log('Executing save to case with data:', requestData)
    
    const response = await request({
      url: '/api_test_cases/test_cases/copy_to_case',
      method: 'post',
      data: requestData
    })
    
    if (response && response.code === 200) {
      ElMessage.success('保存为用例成功')
      
      // 刷新用例树
      if (globalState && globalState.eventBus) {
        globalState.eventBus.emit('refresh-tree-after-copy', {
          originalCaseId: originalCaseId,
          newCaseId: response.caseId,
          moduleId: moduleId,
          caseName: caseName
        })
      }
      
      return { success: true, newCaseId: response.caseId }
    } else {
      throw new Error(response?.msg || '保存失败')
    }
  } catch (error) {
    console.error('Save to case error:', error)
    ElMessage.error(`保存为用例失败: ${error.message}`)
    return { success: false, error: error.message }
  }
}

// 清空响应数据
const clearResponse = () => {
  responseData.value = null
  ElMessage.success('响应数据已清空')
}

// 处理抽屉关闭
const handleDrawerClose = (done) => {
  done()
}

// 事件处理 - 统一保存接口
const handleSaveCase = async () => {
  console.log('handleSaveCase called - using unified save logic')
  await executeUnifiedSave({
    showLoading: true,
    showMessage: true,
    skipReload: false
  })
}

// 发送请求处理 - 先保存再发送
const handleSendRequest = async () => {
  console.log('handleSendRequest called - save then send')

  // 开始时立即设置 loading 状态，并保持直到整个流程结束
  sendLoading.value = true
  if (requestSectionRef.value?.setConfigLoadingState) {
    requestSectionRef.value.setConfigLoadingState('send', true)
  }

  try {
    // 1. 先执行统一保存（使用 skipReload=true 实现无感刷新）
    console.log('Step 1: Saving before send with silent refresh (skipReload=true)')
    const saveResult = await executeUnifiedSave({
      showLoading: false,  // 不显示单独的保存 loading，因为发送按钮已经在 loading 了
      showMessage: false,  // 不显示保存成功消息，避免消息冗余
      skipReload: true     // 使用无感刷新：获取最新数据并覆盖，但不触发组件重载
    })

    // 2. 检查保存是否成功
    if (!saveResult.success) {
      const errorMsg = saveResult.reason === 'validation_failed'
        ? `数据验证失败: ${saveResult.errors?.join(', ') || '未知错误'}`
        : `保存失败: ${saveResult.error || '未知错误'}，无法发送请求`
      ElMessage.error(errorMsg)
      return
    }

    console.log('Save completed successfully, case data synced')

    // 3. 确保 caseId 存在后再发送请求
    if (!saveResult.caseId && !currentCaseData.value?.caseId) {
      ElMessage.error('用例ID不存在，无法发送请求')
      return
    }

    // 4. 发送请求（loading 状态会持续到这里完成）
    console.log('Step 2: Sending request after successful save')
    await sendRequest()

  } catch (error) {
    console.error('handleSendRequest error:', error)
    ElMessage.error(`操作失败: ${error.message}`)
  } finally {
    // 只有在这里才结束 loading 状态，确保整个过程（保存+发送）都处于 loading 中
    sendLoading.value = false
    if (requestSectionRef.value?.setConfigLoadingState) {
      requestSectionRef.value.setConfigLoadingState('send', false)
    }
  }
}

// 新增：处理保存然后复制为用例的逻辑
const handleSaveThenCopyToCase = async (data) => {
  console.log('handleSaveThenCopyToCase called with data:', data)
  
  saveLoading.value = true
  if (requestSectionRef.value?.setConfigLoadingState) {
    requestSectionRef.value.setConfigLoadingState('save', true)
  }
  
  try {
    // 1. 先执行统一保存
    console.log('Step 1: Saving before copy to case')
    const saveResult = await executeUnifiedSave({
      showLoading: false,  // 使用外部loading状态
      showMessage: false,  // 最后统一显示成功消息
      skipReload: false    // 确保数据同步
    })
    
    if (!saveResult.success) {
      ElMessage.error('保存失败，无法执行保存为用例操作')
      return
    }
    
    // 2. 等待一小段时间确保数据同步完成
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // 3. 执行保存为用例的逻辑
    console.log('Step 2: Executing save to case after successful save')
    const copyResult = await executeSaveToCaseLogic(
      data.caseName, 
      data.originalCaseId, 
      data.moduleId
    )
    
    if (copyResult.success) {
      console.log('Save then copy to case completed successfully')
    }
    
  } catch (error) {
    console.error('handleSaveThenCopyToCase error:', error)
    ElMessage.error(`操作失败: ${error.message}`)
  } finally {
    saveLoading.value = false
    if (requestSectionRef.value?.setConfigLoadingState) {
      requestSectionRef.value.setConfigLoadingState('save', false)
    }
  }
}

// 处理历史记录
const handleHistory = () => {
  if (!currentCaseData.value?.caseId) {
    ElMessage.warning('请先选择一个用例')
    return
  }
  showHistoryDrawer.value = true
}

// 处理刷新用例（无感刷新）
const handleRefreshCase = async () => {
  if (!currentCaseData.value?.caseId) {
    console.warn('handleRefreshCase: caseId 为空，跳过刷新')
    return
  }

  console.log('触发无感刷新，caseId:', currentCaseData.value.caseId)
  // 使用 silent = true 进行无感刷新，不显示 loading
  await loadCaseDetail(currentCaseData.value.caseId, true)
}

// 处理全局组合键保存事件
const handleGlobalSaveEvent = async (tabId) => {
  console.log('Received global save event for tabId:', tabId, 'current tabId:', props.tabId)
  
  if (tabId === props.tabId) {
    console.log('Triggering unified save for current tab via hotkey')
    await executeUnifiedSave({
      showLoading: true,
      showMessage: true,
      skipReload: false
    })
  }
}

// 监听caseData prop变化 - 只在 caseId 变化时才重新加载，避免在数据同步时触发重载
watch(() => props.caseData?.caseId, (newCaseId, oldCaseId) => {
  console.log('CaseEditor: caseId changed from', oldCaseId, 'to', newCaseId)

  // 只有当 caseId 真正发生变化时才重新加载
  if (newCaseId !== oldCaseId) {
    if (newCaseId) {
      console.log('CaseEditor: Loading case detail for new caseId:', newCaseId)
      loadCaseDetail(newCaseId)
    } else {
      console.log('CaseEditor: Clearing case data (no caseId)')
      caseDetailData.value = null
    }
  } else {
    console.log('CaseEditor: caseId unchanged, skipping reload')
  }
}, { immediate: true })

// 监听 caseData 的其他变化（但不触发重新加载，只更新本地数据）
watch(() => props.caseData, (newCaseData) => {
  // 如果是新用例（没有 caseId）且 props.caseData 有数据，直接使用
  if (newCaseData && !newCaseData.caseId && !caseDetailData.value?.caseId) {
    console.log('CaseEditor: Using case data directly for new case (no reload)')
    caseDetailData.value = { ...newCaseData }
  }
  // 其他情况不做处理，避免触发重新加载
}, { immediate: false, deep: false })

// 生命周期
onMounted(() => {
  console.log('CaseEditor mounted with envId:', props.envId)
  console.log('CaseEditor mounted with caseData:', props.caseData)
  
  // 监听全局保存事件（组合键保存）
  if (globalState && globalState.eventBus) {
    globalState.eventBus.on('trigger-save-current-tab', handleGlobalSaveEvent)
  }
})

onBeforeUnmount(() => {
  if (globalState && globalState.eventBus) {
    globalState.eventBus.off('trigger-save-current-tab', handleGlobalSaveEvent)
  }
})

// 暴露统一保存方法给父组件
defineExpose({
  executeUnifiedSave,
  reloadCaseDetail: loadCaseDetail
})
</script>
