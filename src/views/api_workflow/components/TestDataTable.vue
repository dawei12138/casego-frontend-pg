<template>
  <div class="test-data-table">
    <div class="table-header">
      <div class="table-title">
        <span class="title-text">{{ datasetName || '数据集详情' }}</span>
        <el-tag v-if="total > 0" type="primary" size="small">{{ total }} 行数据</el-tag>
      </div>
      <div class="table-actions">
        <el-button
          :icon="Plus"
          size="small"
          type="success"
          @click="handleAddRow"
        >
          添加行
        </el-button>
        <el-button
          :icon="Plus"
          size="small"
          type="primary"
          @click="handleAddColumn"
        >
          添加列
        </el-button>
        <el-button
          :icon="Refresh"
          size="small"
          @click="handleRefresh"
        >
          刷新
        </el-button>
      </div>
    </div>

    <div class="table-content">
      <el-table
        v-if="hasData"
        :data="displayData"
        :loading="loading"
        stripe
        border
        style="width: 100%; height: 100%"
      >
        <!-- groupName 列（最左边，可编辑） -->
        <el-table-column
          prop="_groupName"
          label="分组名称"
          width="150"
          align="center"
          fixed
        >
          <template #default="{ row }">
            <div
              v-if="!isEditingCell(row._keyId, '_groupName')"
              class="cell-content editable-cell"
              @click="handleCellEdit(row, '_groupName')"
            >
              <span>{{ row._groupName || '-' }}</span>
            </div>
            <div v-else class="cell-content">
              <el-input
                v-model="editingData[row._keyId]._groupName"
                size="small"
                @blur="handleCellSave(row._keyId, '_groupName')"
                @keyup.enter="handleCellSave(row._keyId, '_groupName')"
              />
            </div>
          </template>
        </el-table-column>

        <!-- 动态列 -->
        <el-table-column
          v-for="column in columns"
          :key="column"
          :prop="column"
          min-width="150"
          show-overflow-tooltip
        >
          <template #header>
            <div class="column-header">
              <span class="column-name">{{ column }}</span>
              <div class="column-actions">
                <el-button
                  :icon="Edit"
                  size="small"
                  text
                  type="primary"
                  class="column-action-btn"
                  @click="handleEditColumn(column)"
                />
                <el-button
                  :icon="Delete"
                  size="small"
                  text
                  type="danger"
                  class="column-action-btn"
                  @click="handleDeleteColumn(column)"
                />
              </div>
            </div>
          </template>
          <template #default="{ row }">
            <div
              v-if="!isEditingCell(row._keyId, column)"
              class="cell-content editable-cell"
              @click="handleCellEdit(row, column)"
            >
              <span>{{ row[column] || '' }}</span>
            </div>
            <div v-else class="cell-content">
              <el-input
                v-model="editingData[row._keyId][column]"
                size="small"
                @blur="handleCellSave(row._keyId, column)"
                @keyup.enter="handleCellSave(row._keyId, column)"
              />
            </div>
          </template>
        </el-table-column>

        <!-- 操作列 -->
        <el-table-column
          label="操作"
          width="80"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              :icon="Delete"
              size="small"
              text
              type="danger"
              @click="handleDeleteRow(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty
        v-else
        description="暂无数据"
        :image-size="120"
      >
        <el-button type="primary" :icon="Plus" @click="handleAddRow">
          添加第一行数据
        </el-button>
      </el-empty>
    </div>

    <!-- 分页 -->
    <div v-if="total > 0" class="table-footer">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[5, 10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>

    <!-- 添加列对话框 -->
    <el-dialog
      v-model="addColumnDialogVisible"
      title="添加列"
      width="400px"
    >
      <el-form>
        <el-form-item label="列名">
          <el-input
            v-model="newColumnName"
            placeholder="请输入列名"
            @keyup.enter="handleConfirmAddColumn"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addColumnDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="addingColumn" @click="handleConfirmAddColumn">确定</el-button>
      </template>
    </el-dialog>

    <!-- 编辑列对话框 -->
    <el-dialog
      v-model="editColumnDialogVisible"
      title="编辑列名"
      width="400px"
    >
      <el-form>
        <el-form-item label="列名">
          <el-input
            v-model="editingColumnName"
            placeholder="请输入新的列名"
            @keyup.enter="handleConfirmEditColumn"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editColumnDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editingColumnLoading" @click="handleConfirmEditColumn">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Plus, Refresh, Edit, Delete } from '@element-plus/icons-vue'
import { batchUpdateTestDataRows } from '../api/testData'

const props = defineProps({
  dataset: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['refresh', 'add-row', 'update-row', 'delete-row', 'page-change'])

// 分页状态
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 新行状态（已废弃，保留用于兼容）
const newRowData = ref(null)

// 添加列对话框
const addColumnDialogVisible = ref(false)
const newColumnName = ref('')

// 编辑列对话框
const editColumnDialogVisible = ref(false)
const editingColumnName = ref('')
const editingColumnOldName = ref('')
const editingColumnLoading = ref(false)

// 单元格编辑状态
const editingCells = ref({}) // { keyId: { column: true } }
const editingData = ref({}) // { keyId: { column: value, _groupName: value } }

// 添加loading状态
const addingRow = ref(false)
const addingColumn = ref(false)
const deletingColumn = ref(false)

// 计算属性
const datasetName = computed(() => props.dataset?.name || '')
const items = computed(() => props.dataset?.items || [])
const hasData = computed(() => items.value.length > 0)

// 提取列名
const columns = computed(() => {
  if (!hasData.value) return []

  const columnSet = new Set()

  // 从现有数据提取列
  items.value.forEach(row => {
    if (row.item && typeof row.item === 'object') {
      Object.keys(row.item).forEach(key => columnSet.add(key))
    }
  })

  return Array.from(columnSet)
})

// 格式化表格数据
const tableData = computed(() => {
  if (!hasData.value) return []

  return items.value.map((row) => ({
    _keyId: row.keyId,
    _groupName: row.groupName || '',
    _sortNo: row.sortNo || 0,
    ...row.item
  }))
})

// 显示的数据
const displayData = computed(() => {
  return tableData.value
})

// 监听数据集变化，更新分页信息
watch(() => props.dataset, (newDataset) => {
  if (newDataset) {
    total.value = newDataset.total || items.value.length
    currentPage.value = newDataset.pageNum || 1
    pageSize.value = newDataset.pageSize || 10
  }
  // 清除编辑状态
  editingCells.value = {}
  editingData.value = {}
  newRowData.value = null
}, { immediate: true })

// 判断单元格是否处于编辑状态
const isEditingCell = (keyId, column) => {
  return editingCells.value[keyId]?.[column] === true
}

// 单元格编辑
const handleCellEdit = (row, column) => {
  const keyId = row._keyId
  if (!editingCells.value[keyId]) {
    editingCells.value[keyId] = {}
    editingData.value[keyId] = {
      _groupName: row._groupName,
      ...row
    }
  }
  editingCells.value[keyId][column] = true

  // 等待DOM更新后自动聚焦
  nextTick(() => {
    // 查找最后一个聚焦的input（刚渲染的）
    const inputs = document.querySelectorAll('.el-table .el-input__inner')
    if (inputs.length > 0) {
      const lastInput = inputs[inputs.length - 1]
      lastInput.focus()
      // 选中所有文本，方便用户直接输入
      lastInput.select()
    }
  })
}

// 保存单元格编辑
const handleCellSave = (keyId, column) => {
  if (!editingCells.value[keyId]) return

  editingCells.value[keyId][column] = false

  const editedRowData = editingData.value[keyId]
  const originalRow = tableData.value.find(r => r._keyId === keyId)

  if (!originalRow) return

  // 判断是否有变化
  let hasChanged = false
  if (column === '_groupName') {
    hasChanged = originalRow._groupName !== editedRowData._groupName
  } else {
    hasChanged = originalRow[column] !== editedRowData[column]
  }

  if (hasChanged) {
    // 构建更新数据
    const item = {}
    columns.value.forEach(col => {
      item[col] = editedRowData[col] || ''
    })

    emit('update-row', {
      keyId: keyId,
      groupName: editedRowData._groupName,
      item: item
    })
  }
}

// 刷新
const handleRefresh = () => {
  emit('refresh')
}

// 分页变化
const handlePageChange = (page) => {
  emit('page-change', { pageNum: page, pageSize: pageSize.value })
}

const handleSizeChange = (size) => {
  pageSize.value = size
  emit('page-change', { pageNum: currentPage.value, pageSize: size })
}

// 添加行
const handleAddRow = async () => {
  if (addingRow.value) {
    return
  }

  try {
    addingRow.value = true

    // 生成分组名称：数据集-{行号}
    const rowNumber = total.value + 1
    const groupName = `数据集-${rowNumber}`

    // 构建 item 数据，所有列都为空字符串
    const item = {}
    columns.value.forEach(col => {
      item[col] = ''
    })

    // 调用添加行接口
    emit('add-row', {
      parameterizationId: props.dataset.parameterizationId,
      groupName: groupName,
      item: item
    })
  } catch (error) {
    console.error('添加行失败:', error)
    ElMessage.error('添加行失败')
  } finally {
    addingRow.value = false
  }
}

// 删除行
const handleDeleteRow = (row) => {
  emit('delete-row', row._keyId)
}

// 添加列
const handleAddColumn = () => {
  newColumnName.value = ''
  addColumnDialogVisible.value = true
}

// 编辑列
const handleEditColumn = (columnName) => {
  editingColumnOldName.value = columnName
  editingColumnName.value = columnName
  editColumnDialogVisible.value = true
}

// 确认编辑列
const handleConfirmEditColumn = async () => {
  if (editingColumnLoading.value) {
    return
  }

  const newName = editingColumnName.value.trim()
  const oldName = editingColumnOldName.value

  if (!newName) {
    ElMessage.warning('请输入列名')
    return
  }

  if (newName === oldName) {
    ElMessage.info('列名没有改变')
    editColumnDialogVisible.value = false
    return
  }

  if (columns.value.includes(newName)) {
    ElMessage.warning('列名重复，无法修改')
    return
  }

  // 检查是否有数据行
  if (!hasData.value) {
    ElMessage.warning('没有数据行')
    editColumnDialogVisible.value = false
    return
  }

  try {
    editingColumnLoading.value = true

    // 构建所有行的数据，修改列名
    const updateData = items.value.map(row => {
      const newItem = {}

      // 遍历原item的所有key
      Object.keys(row.item).forEach(key => {
        if (key === oldName) {
          // 将旧列名改为新列名
          newItem[newName] = row.item[key]
        } else {
          newItem[key] = row.item[key]
        }
      })

      return {
        item: newItem,
        group_name: row.groupName,
        parameterization_id: props.dataset.parameterizationId,
        keyId: row.keyId
      }
    })

    // 调用批量更新接口
    await batchUpdateTestDataRows(updateData)
    ElMessage.success('修改列名成功')

    // 关闭对话框并刷新数据
    editColumnDialogVisible.value = false
    editingColumnName.value = ''
    editingColumnOldName.value = ''
    emit('refresh')
  } catch (error) {
    console.error('修改列名失败:', error)
    ElMessage.error('修改列名失败')
  } finally {
    editingColumnLoading.value = false
  }
}

// 确认添加列
const handleConfirmAddColumn = async () => {
  if (addingColumn.value) {
    return
  }

  const columnName = newColumnName.value.trim()

  if (!columnName) {
    ElMessage.warning('请输入列名')
    return
  }

  if (columns.value.includes(columnName)) {
    ElMessage.warning('列名重复，无法创建')
    return
  }

  // 检查是否有数据行
  if (!hasData.value) {
    ElMessage.warning('请先添加数据行')
    addColumnDialogVisible.value = false
    newColumnName.value = ''
    return
  }

  try {
    addingColumn.value = true

    // 构建所有行的数据，添加新列
    const updateData = items.value.map(row => {
      const newItem = {
        ...row.item,
        [columnName]: '' // 新列的值为空字符串
      }

      return {
        item: newItem,
        group_name: row.groupName,
        parameterization_id: props.dataset.parameterizationId,
        keyId: row.keyId
      }
    })

    // 调用批量更新接口
    await batchUpdateTestDataRows(updateData)
    ElMessage.success('添加列成功')

    // 关闭对话框并刷新数据
    addColumnDialogVisible.value = false
    newColumnName.value = ''
    emit('refresh')
  } catch (error) {
    console.error('添加列失败:', error)
    ElMessage.error('添加列失败')
  } finally {
    addingColumn.value = false
  }
}

// 删除列
const handleDeleteColumn = async (column) => {
  if (deletingColumn.value) {
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除列 "${column}" 吗？删除后所有行的该列数据将被移除。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 检查是否有数据行
    if (!hasData.value) {
      ElMessage.warning('没有数据行')
      return
    }

    deletingColumn.value = true

    // 构建所有行的数据，删除指定列
    const updateData = items.value.map(row => {
      const newItem = {}

      // 遍历原item的所有key，排除要删除的列
      Object.keys(row.item).forEach(key => {
        if (key !== column) {
          newItem[key] = row.item[key]
        }
      })

      return {
        item: newItem,
        group_name: row.groupName,
        parameterization_id: props.dataset.parameterizationId,
        keyId: row.keyId
      }
    })

    // 调用批量更新接口
    await batchUpdateTestDataRows(updateData)
    ElMessage.success('删除列成功')

    // 刷新数据
    emit('refresh')
  } catch (error) {
    if (error === 'cancel') {
      // 用户取消
      return
    }
    console.error('删除列失败:', error)
    ElMessage.error('删除列失败')
  } finally {
    deletingColumn.value = false
  }
}
</script>

<style scoped>
.test-data-table {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--el-bg-color);
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
}

.table-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.table-actions {
  display: flex;
  gap: 8px;
}

.table-content {
  flex: 1;
  overflow: hidden;
  padding: 12px;
  min-height: 0;
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  border-top: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
}

.cell-content {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  min-height: 32px;
  width: 100%;
}

.cell-content > span {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.editable-cell {
  cursor: pointer;
  padding: 8px 11px;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 40px;
  margin: -8px -11px;
}

.editable-cell:hover {
  background-color: var(--el-fill-color-light);
}

.editable-cell > span {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
}

.column-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.column-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.3s;
  flex-shrink: 0;
}

.column-header:hover .column-actions {
  opacity: 1;
}

.column-action-btn {
  padding: 4px !important;
  width: 24px !important;
  height: 24px !important;
  font-size: 12px !important;
}

.column-action-btn .el-icon {
  font-size: 12px !important;
}

:deep(.el-table) {
  font-size: 13px;
}

:deep(.el-table th) {
  background-color: var(--el-fill-color-light);
  font-weight: 600;
}

:deep(.el-table td) {
  padding: 8px 0;
}

:deep(.el-table .el-table__cell) {
  padding: 8px;
}

:deep(.el-pagination) {
  justify-content: flex-end;
}
</style>
