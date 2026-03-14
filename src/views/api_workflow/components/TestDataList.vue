<template>
  <div class="test-data-list">
    <div class="list-header">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索数据集..."
        :prefix-icon="Search"
        clearable
        size="small"
      />
      <el-button
        type="primary"
        :icon="Plus"
        size="small"
        style="margin-top: 8px; width: 100%;"
        @click="handleCreate"
      >
        新建数据集
      </el-button>
    </div>

    <div class="list-content">
      <el-scrollbar v-if="hasFilteredDatasets" height="100%">
        <div
          v-for="dataset in filteredDatasets"
          :key="dataset.parameterizationId"
          class="dataset-item"
          :class="{ 'is-active': selectedDatasetId === dataset.parameterizationId }"
          @click="handleSelect(dataset)"
        >
          <div class="dataset-info">
            <div class="dataset-name">{{ dataset.name }}</div>
            <div v-if="dataset.description" class="dataset-desc">{{ dataset.description }}</div>
            <div class="dataset-meta">
              <el-tag size="small" type="info">ID: {{ dataset.parameterizationId }}</el-tag>
            </div>
          </div>
          <div class="dataset-actions">
            <el-button
              :icon="Edit"
              size="small"
              text
              @click.stop="handleEdit(dataset)"
            />
            <el-button
              :icon="Delete"
              size="small"
              text
              type="danger"
              @click.stop="handleDelete(dataset)"
            />
          </div>
        </div>
      </el-scrollbar>

      <el-empty
        v-else
        description="暂无测试数据集"
        :image-size="80"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessageBox } from 'element-plus'
import { Search, Plus, Edit, Delete } from '@element-plus/icons-vue'

const props = defineProps({
  datasets: {
    type: Array,
    default: () => []
  },
  selectedDatasetId: {
    type: Number,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select', 'create', 'edit', 'delete'])

// 搜索关键词
const searchKeyword = ref('')

// 过滤后的数据集列表
const filteredDatasets = computed(() => {
  if (!searchKeyword.value) {
    return props.datasets
  }

  const keyword = searchKeyword.value.toLowerCase()
  return props.datasets.filter(dataset =>
    dataset.name?.toLowerCase().includes(keyword) ||
    dataset.description?.toLowerCase().includes(keyword)
  )
})

const hasFilteredDatasets = computed(() => filteredDatasets.value.length > 0)

// 选择数据集
const handleSelect = (dataset) => {
  emit('select', dataset)
}

// 创建数据集
const handleCreate = () => {
  emit('create')
}

// 编辑数据集
const handleEdit = (dataset) => {
  emit('edit', dataset)
}

// 删除数据集
const handleDelete = async (dataset) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除数据集 "${dataset.name}" 吗？此操作将删除该数据集的所有数据。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    emit('delete', dataset)
  } catch {
    // 用户取消
  }
}
</script>

<style scoped>
.test-data-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--el-bg-color);
}

.list-header {
  padding: 12px;
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
}

.list-content {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.dataset-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  margin: 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  background-color: var(--el-bg-color);
}

.dataset-item:hover {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
  transform: translateX(4px);
}

.dataset-item.is-active {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.dataset-info {
  flex: 1;
  min-width: 0;
  margin-right: 8px;
}

.dataset-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dataset-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dataset-meta {
  display: flex;
  gap: 4px;
  margin-top: 6px;
}

.dataset-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s;
}

.dataset-item:hover .dataset-actions {
  opacity: 1;
}

.dataset-item.is-active .dataset-actions {
  opacity: 1;
}
</style>
