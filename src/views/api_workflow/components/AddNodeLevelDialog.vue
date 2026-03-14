<template>
  <el-dialog
    v-model="visible"
    title="选择添加方式"
    width="480px"
    :close-on-click-modal="false"
    class="add-node-level-dialog"
    @close="handleClose"
  >
    <div class="dialog-content">
      <div class="dialog-description">
        <el-icon class="info-icon"><InfoFilled /></el-icon>
        <span>请选择新节点的添加位置</span>
      </div>

      <div class="level-options">
        <!-- 添加同级节点 -->
        <div
          class="level-option sibling-option"
          @click="handleSelect('sibling')"
        >
          <div class="option-header">
            <div class="option-icon sibling-icon">
              <el-icon><Rank /></el-icon>
            </div>
            <div class="option-title">添加同级节点</div>
          </div>
          <div class="option-description">
            在当前节点的同一层级添加新节点
          </div>
          <div class="option-preview">
            <div class="preview-tree">
              <div class="preview-node current">当前节点</div>
              <div class="preview-node new">→ 新节点（同级）</div>
            </div>
          </div>
        </div>

        <!-- 添加子节点 -->
        <div
          v-if="canAddChild"
          class="level-option child-option"
          @click="handleSelect('child')"
        >
          <div class="option-header">
            <div class="option-icon child-icon">
              <el-icon><FolderAdd /></el-icon>
            </div>
            <div class="option-title">添加子节点</div>
          </div>
          <div class="option-description">
            在当前节点内部添加子节点
          </div>
          <div class="option-preview">
            <div class="preview-tree">
              <div class="preview-node current">当前节点</div>
              <div class="preview-node new child">└─ 新节点（子级）</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { InfoFilled, Rank, FolderAdd } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  nodeData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'select'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 判断是否可以添加子节点（task类型节点不能添加子节点）
const canAddChild = computed(() => {
  return props.nodeData?.type !== 'task'
})

const handleSelect = (level) => {
  emit('select', level)
  visible.value = false
}

const handleClose = () => {
  visible.value = false
}
</script>

<style scoped>
@import '../styles/add-node-dialogs.css';
</style>
