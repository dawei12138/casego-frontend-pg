import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getWorkflowTestDataList,
  getTestDataDetail,
  createTestData,
  updateTestData,
  deleteTestData,
  addTestDataRow,
  updateTestDataRow,
  deleteTestDataRow
} from '@/api/workflow/testData'

/**
 * 测试数据管理 Composable
 */
export function useTestData() {
  // 状态
  const loading = ref(false)
  const detailLoading = ref(false)
  const datasetList = ref([])
  const currentDataset = ref(null)
  const selectedDatasetId = ref(null)

  // 计算属性
  const hasDatasets = computed(() => datasetList.value.length > 0)
  const currentDatasetName = computed(() => currentDataset.value?.name || '')

  /**
   * 加载测试数据集列表
   */
  const loadDatasetList = async (workflowId) => {
    if (!workflowId) {
      datasetList.value = []
      return
    }

    if (loading.value) return

    loading.value = true
    try {
      const response = await getWorkflowTestDataList(workflowId)
      datasetList.value = response.rows || []
    } catch (error) {
      console.error('Failed to load dataset list:', error)
      ElMessage.error('加载测试数据集列表失败')
      datasetList.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * 加载测试数据集详情
   * @param {number} parameterizationId - 数据集ID
   * @param {Object} params - 查询参数（pageNum, pageSize）
   */
  const loadDatasetDetail = async (parameterizationId, params = {}) => {
    if (!parameterizationId) {
      currentDataset.value = null
      return
    }

    if (detailLoading.value) return

    detailLoading.value = true
    try {
      const response = await getTestDataDetail(parameterizationId, params)
      currentDataset.value = response.data || null
      selectedDatasetId.value = parameterizationId
    } catch (error) {
      console.error('Failed to load dataset detail:', error)
      ElMessage.error('加载测试数据集详情失败')
      currentDataset.value = null
    } finally {
      detailLoading.value = false
    }
  }

  /**
   * 创建测试数据集
   */
  const createDataset = async (data) => {
    try {
      await createTestData(data)
      ElMessage.success('创建测试数据集成功')
      return true
    } catch (error) {
      console.error('Failed to create dataset:', error)
      ElMessage.error('创建测试数据集失败')
      return false
    }
  }

  /**
   * 更新测试数据集
   */
  const updateDataset = async (data) => {
    try {
      await updateTestData(data)
      ElMessage.success('更新测试数据集成功')
      return true
    } catch (error) {
      console.error('Failed to update dataset:', error)
      ElMessage.error('更新测试数据集失败')
      return false
    }
  }

  /**
   * 删除测试数据集
   */
  const deleteDataset = async (parameterizationId) => {
    try {
      await deleteTestData(parameterizationId)
      ElMessage.success('删除测试数据集成功')

      // 如果删除的是当前选中的数据集，清空选择
      if (selectedDatasetId.value === parameterizationId) {
        currentDataset.value = null
        selectedDatasetId.value = null
      }

      return true
    } catch (error) {
      console.error('Failed to delete dataset:', error)
      ElMessage.error('删除测试数据集失败')
      return false
    }
  }

  /**
   * 添加数据行
   */
  const addRow = async (data) => {
    try {
      await addTestDataRow(data)
      ElMessage.success('添加数据行成功')
      return true
    } catch (error) {
      console.error('Failed to add row:', error)
      ElMessage.error('添加数据行失败')
      return false
    }
  }

  /**
   * 更新数据行
   */
  const updateRow = async (data) => {
    try {
      await updateTestDataRow(data)
      ElMessage.success('更新数据行成功')
      return true
    } catch (error) {
      console.error('Failed to update row:', error)
      ElMessage.error('更新数据行失败')
      return false
    }
  }

  /**
   * 删除数据行
   */
  const deleteRow = async (keyId) => {
    try {
      await deleteTestDataRow(keyId)
      ElMessage.success('删除数据行成功')
      return true
    } catch (error) {
      console.error('Failed to delete row:', error)
      ElMessage.error('删除数据行失败')
      return false
    }
  }

  /**
   * 提取表格列名（从items中提取唯一的字段名）
   */
  const extractColumns = (items) => {
    if (!items || items.length === 0) return []

    const columnSet = new Set()
    items.forEach(row => {
      if (row.item && typeof row.item === 'object') {
        Object.keys(row.item).forEach(key => columnSet.add(key))
      }
    })

    return Array.from(columnSet)
  }

  /**
   * 格式化表格数据（转换为适合el-table的格式）
   */
  const formatTableData = (items) => {
    if (!items || items.length === 0) return []

    return items.map((row, index) => ({
      _rowId: row.keyId || index,
      _groupName: row.groupName || '',
      _sortNo: row.sortNo || 0,
      ...row.item
    }))
  }

  /**
   * 重置状态
   */
  const reset = () => {
    datasetList.value = []
    currentDataset.value = null
    selectedDatasetId.value = null
    loading.value = false
    detailLoading.value = false
  }

  return {
    // 状态
    loading,
    detailLoading,
    datasetList,
    currentDataset,
    selectedDatasetId,

    // 计算属性
    hasDatasets,
    currentDatasetName,

    // 方法
    loadDatasetList,
    loadDatasetDetail,
    createDataset,
    updateDataset,
    deleteDataset,
    addRow,
    updateRow,
    deleteRow,
    extractColumns,
    formatTableData,
    reset
  }
}
