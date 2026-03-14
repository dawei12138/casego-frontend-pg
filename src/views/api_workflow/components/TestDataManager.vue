<template>
  <div class="test-data-manager">
    <splitpanes class="data-splitpanes">
      <!-- 左侧：数据集列表 -->
      <pane :size="30" :min-size="20" :max-size="40">
        <TestDataList
          :datasets="datasetList"
          :selected-dataset-id="selectedDatasetId"
          :loading="loading"
          @select="handleSelectDataset"
          @create="handleCreateDataset"
          @edit="handleEditDataset"
          @delete="handleDeleteDataset"
        />
      </pane>

      <!-- 右侧：数据表格 -->
      <pane :size="70" :min-size="60">
        <div v-if="!currentDataset" class="empty-state">
          <div class="empty-icon">
            <el-icon><Document /></el-icon>
          </div>
          <div class="empty-text">
            <h3>选择一个数据集查看详情</h3>
            <p>从左侧列表中选择一个测试数据集，或创建新的数据集</p>
          </div>
        </div>

        <TestDataTable
          v-else
          :dataset="currentDataset"
          :loading="detailLoading"
          @refresh="handleRefreshDetail"
          @add-row="handleAddRow"
          @update-row="handleUpdateRow"
          @delete-row="handleDeleteRow"
          @page-change="handlePageChange"
        />
      </pane>
    </splitpanes>

    <!-- 创建/编辑数据集对话框 -->
    <el-dialog
      v-model="datasetDialogVisible"
      :title="datasetDialogTitle"
      width="500px"
      @close="handleDatasetDialogClose"
    >
      <el-form
        ref="datasetFormRef"
        :model="datasetForm"
        :rules="datasetFormRules"
        label-width="100px"
      >
        <el-form-item label="数据集名称" prop="name">
          <el-input
            v-model="datasetForm.name"
            placeholder="请输入数据集名称"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="datasetForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入数据集描述"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="datasetDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="datasetSubmitting"
          @click="handleDatasetSubmit"
        >
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Document } from '@element-plus/icons-vue'
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import TestDataList from './TestDataList.vue'
import TestDataTable from './TestDataTable.vue'
import { useTestData } from '../composables/useTestData'

const props = defineProps({
  workflowId: {
    type: Number,
    required: true
  }
})

// 使用 composable
const {
  loading,
  detailLoading,
  datasetList,
  currentDataset,
  selectedDatasetId,
  loadDatasetList,
  loadDatasetDetail,
  createDataset,
  updateDataset,
  deleteDataset,
  addRow,
  updateRow,
  deleteRow
} = useTestData()

// 分页参数
const pageParams = ref({
  pageNum: 1,
  pageSize: 10
})

// 数据集对话框
const datasetDialogVisible = ref(false)
const datasetDialogMode = ref('create') // 'create' | 'edit'
const datasetFormRef = ref()
const datasetForm = ref({
  name: '',
  description: ''
})
const datasetFormRules = {
  name: [
    { required: true, message: '请输入数据集名称', trigger: 'blur' },
    { min: 1, max: 100, message: '长度在 1 到 100 个字符', trigger: 'blur' }
  ]
}
const datasetSubmitting = ref(false)
const editingDatasetId = ref(null)

const datasetDialogTitle = computed(() => {
  return datasetDialogMode.value === 'create' ? '创建测试数据集' : '编辑测试数据集'
})

// 加载数据集列表
const loadData = async () => {
  if (props.workflowId) {
    await loadDatasetList(props.workflowId)
  }
}

// 选择数据集
const handleSelectDataset = async (dataset) => {
  // 重置分页参数
  pageParams.value = {
    pageNum: 1,
    pageSize: 10
  }
  await loadDatasetDetail(dataset.parameterizationId, pageParams.value)
}

// 创建数据集
const handleCreateDataset = () => {
  datasetDialogMode.value = 'create'
  datasetForm.value = {
    name: '',
    description: ''
  }
  editingDatasetId.value = null
  datasetDialogVisible.value = true
}

// 编辑数据集
const handleEditDataset = (dataset) => {
  datasetDialogMode.value = 'edit'
  datasetForm.value = {
    name: dataset.name,
    description: dataset.description || ''
  }
  editingDatasetId.value = dataset.parameterizationId
  datasetDialogVisible.value = true
}

// 删除数据集
const handleDeleteDataset = async (dataset) => {
  const success = await deleteDataset(dataset.parameterizationId)
  if (success) {
    await loadData()
  }
}

// 提交数据集表单
const handleDatasetSubmit = async () => {
  try {
    await datasetFormRef.value.validate()

    datasetSubmitting.value = true
    let success = false

    if (datasetDialogMode.value === 'create') {
      success = await createDataset({
        workflowId: props.workflowId,
        name: datasetForm.value.name,
        description: datasetForm.value.description
      })
    } else {
      success = await updateDataset({
        parameterizationId: editingDatasetId.value,
        name: datasetForm.value.name,
        description: datasetForm.value.description
      })
    }

    if (success) {
      datasetDialogVisible.value = false
      await loadData()
    }
  } catch (error) {
    console.error('Form validation failed:', error)
  } finally {
    datasetSubmitting.value = false
  }
}

// 关闭数据集对话框
const handleDatasetDialogClose = () => {
  datasetForm.value = {
    name: '',
    description: ''
  }
  editingDatasetId.value = null
  datasetFormRef.value?.resetFields()
}

// 刷新详情
const handleRefreshDetail = async () => {
  if (selectedDatasetId.value) {
    await loadDatasetDetail(selectedDatasetId.value, pageParams.value)
  }
}

// 分页变化
const handlePageChange = async (params) => {
  pageParams.value = params
  if (selectedDatasetId.value) {
    await loadDatasetDetail(selectedDatasetId.value, pageParams.value)
  }
}

// 添加数据行
const handleAddRow = async (data) => {
  const success = await addRow(data)
  if (success) {
    await handleRefreshDetail()
  }
}

// 更新数据行
const handleUpdateRow = async (data) => {
  const success = await updateRow(data)
  if (success) {
    await handleRefreshDetail()
  }
}

// 删除数据行
const handleDeleteRow = async (keyId) => {
  const success = await deleteRow(keyId)
  if (success) {
    await handleRefreshDetail()
  }
}

// 监听 workflowId 变化
watch(() => props.workflowId, (newId) => {
  if (newId) {
    loadData()
  }
}, { immediate: true })

// 组件挂载时加载数据
onMounted(() => {
  loadData()
})

// 暴露刷新方法给父组件
defineExpose({
  refresh: loadData
})
</script>

<style scoped>
/* ==================== 测试数据管理器样式 (Apple Design) ==================== */

.test-data-manager {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #F2F2F7;
}

.data-splitpanes {
  height: 100%;
}

/* ==================== 空状态样式 (Apple Design) ==================== */

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 60px 30px;
  background: #FFFFFF;
}

.empty-icon {
  font-size: 64px;
  color: rgba(0, 0, 0, 0.15);
  margin-bottom: 24px;
}

.empty-text h3 {
  margin: 0 0 12px 0;
  color: rgba(0, 0, 0, 0.85);
  font-size: 22px;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', sans-serif;
  line-height: 1.2;
}

.empty-text p {
  margin: 0;
  color: rgba(0, 0, 0, 0.55);
  font-size: 15px;
  line-height: 1.6;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', sans-serif;
}

/* ==================== Splitpanes 样式 (Apple Design) ==================== */

:deep(.splitpanes__pane) {
  background: #FFFFFF;
  overflow: hidden;
  position: relative;
}

:deep(.splitpanes__splitter) {
  background-color: rgba(120, 120, 128, 0.2);
  position: relative;
  transition: background-color 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

:deep(.splitpanes__splitter:hover) {
  background-color: #007AFF;
}
</style>
