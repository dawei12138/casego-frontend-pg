<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="720px"
    :close-on-click-modal="false"
    class="node-type-selector-dialog"
    @close="handleClose"
  >
    <div class="dialog-content">
      <div class="type-categories">
        <!-- 接口导入模块 -->
        <ApiImportSection @select="handleSelectType" />

        <!-- 控制流与脚本模块 -->
        <div class="type-category">
          <div class="category-header">
            <el-icon class="category-icon control-icon"><Operation /></el-icon>
            <h3 class="category-title">控制流与脚本</h3>
          </div>
          <div class="type-grid">
            <div
              class="type-card control-type"
              @click="handleSelectType('分组类别')"
            >
              <div class="card-icon">
                <el-icon><FolderOpened /></el-icon>
              </div>
              <div class="card-title">分组类别</div>
              <div class="card-desc">创建节点分组</div>
            </div>

            <div
              class="type-card control-type"
              @click="handleSelectType('条件分支')"
            >
              <div class="card-icon">
                <el-icon><QuestionFilled /></el-icon>
              </div>
              <div class="card-title">条件分支</div>
              <div class="card-desc">IF/ELSE条件判断</div>
            </div>

            <div
              class="type-card control-type"
              @click="handleSelectType('ForEach循环')"
            >
              <div class="card-icon">
                <el-icon><Sort /></el-icon>
              </div>
              <div class="card-title">ForEach循环</div>
              <div class="card-desc">遍历数组或对象</div>
            </div>

            <div
              class="type-card control-type"
              @click="handleSelectType('For循环')"
            >
              <div class="card-icon">
                <el-icon><RefreshRight /></el-icon>
              </div>
              <div class="card-title">For循环</div>
              <div class="card-desc">指定次数循环</div>
            </div>

            <div
              class="type-card script-type"
              @click="handleSelectType('公共脚本')"
            >
              <div class="card-icon">
                <el-icon><Document /></el-icon>
              </div>
              <div class="card-title">公共脚本</div>
              <div class="card-desc">引用公共脚本</div>
            </div>

            <div
              class="type-card script-type"
              @click="handleSelectType('自定义脚本')"
            >
              <div class="card-icon">
                <el-icon><EditPen /></el-icon>
              </div>
              <div class="card-title">自定义脚本</div>
              <div class="card-desc">编写自定义脚本</div>
            </div>

            <div
              class="type-card script-type"
              @click="handleSelectType('数据库脚本')"
            >
              <div class="card-icon">
                <el-icon><Coin /></el-icon>
              </div>
              <div class="card-title">数据库脚本</div>
              <div class="card-desc">执行数据库操作</div>
            </div>

            <div
              class="type-card utility-type"
              @click="handleSelectType('等待时间')"
            >
              <div class="card-icon">
                <el-icon><Timer /></el-icon>
              </div>
              <div class="card-title">等待时间</div>
              <div class="card-desc">延迟执行</div>
            </div>
          </div>
        </div>

        <!-- 测试场景模块 -->
        <div class="type-category">
          <div class="category-header">
            <el-icon class="category-icon scenario-icon"><Share /></el-icon>
            <h3 class="category-title">测试场景</h3>
          </div>
          <div class="type-grid">
            <div
              class="type-card scenario-type"
              @click="handleSelectType('从其他测试场景导入')"
            >
              <div class="card-icon">
                <el-icon><Upload /></el-icon>
              </div>
              <div class="card-title">导入测试场景</div>
              <div class="card-desc">从其他场景导入</div>
            </div>

            <div
              class="type-card scenario-type"
              @click="handleSelectType('引用其他测试场景')"
            >
              <div class="card-icon">
                <el-icon><Connection /></el-icon>
              </div>
              <div class="card-title">引用测试场景</div>
              <div class="card-desc">引用已有场景</div>
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
import {
  Operation,
  Share,
  FolderOpened,
  QuestionFilled,
  Sort,
  RefreshRight,
  Document,
  EditPen,
  Coin,
  Timer,
  Upload,
  Connection
} from '@element-plus/icons-vue'
import ApiImportSection from './ApiImportSection.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  addType: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'select'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const dialogTitle = computed(() => {
  const typeMap = {
    'root': '选择根节点类型',
    'sibling': '选择同级节点类型',
    'child': '选择子节点类型'
  }
  return typeMap[props.addType] || '选择节点类型'
})

const handleSelectType = (type) => {
  emit('select', type)
}

const handleClose = () => {
  visible.value = false
}
</script>

<style scoped>
@import '../styles/add-node-dialogs.css';
</style>
