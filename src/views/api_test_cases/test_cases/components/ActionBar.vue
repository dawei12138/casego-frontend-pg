<template>
  <div class="action-bar" data-testid="testcase.actionbar.root">
    <div class="action-left">
      <!-- 发送按钮 -->
      <el-button
        data-testid="testcase.actionbar.action.send"
        type="primary"
        :loading="loading"
        @click="handleSend"
      >
        <el-icon><Position /></el-icon>
        {{ loading ? '发送中...' : '发送' }}
      </el-button>
      
      <!-- 保存按钮 -->
      <el-button
        data-testid="testcase.actionbar.action.save"
        @click="handleSave"
      >
        <el-icon><DocumentChecked /></el-icon>
        保存
      </el-button>
      
      <!-- 重置按钮 -->
      <el-button
        data-testid="testcase.actionbar.action.reset"
        @click="handleReset"
      >
        <el-icon><RefreshLeft /></el-icon>
        重置
      </el-button>
    </div>
    
    <div class="action-right">
      <!-- 更多操作 -->
      <el-dropdown @command="handleMoreAction">
        <el-button text data-testid="testcase.actionbar.action.more">
          更多操作
          <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="duplicate" data-testid="testcase.actionbar.menu.duplicate">
              <el-icon><DocumentCopy /></el-icon>
              复制用例
            </el-dropdown-item>
            <el-dropdown-item command="export" data-testid="testcase.actionbar.menu.export">
              <el-icon><Download /></el-icon>
              导出用例
            </el-dropdown-item>
            <el-dropdown-item divided command="generate-code" data-testid="testcase.actionbar.menu.generate-code">
              <el-icon><Document /></el-icon>
              生成代码
            </el-dropdown-item>
            <el-dropdown-item command="run-collection" data-testid="testcase.actionbar.menu.run-collection">
              <el-icon><VideoPlay /></el-icon>
              批量运行
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      
      <!-- 历史记录按钮 -->
      <el-button
        data-testid="testcase.actionbar.action.history"
        text
        @click="handleHistory"
      >
        <el-icon><Clock /></el-icon>
        历史记录
      </el-button>
    </div>
  </div>
</template>

<script setup>
import {
  Position,
  DocumentChecked,
  RefreshLeft,
  ArrowDown,
  DocumentCopy,
  Download,
  Document,
  VideoPlay,
  Clock
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 引入外部CSS文件
import '../styles/action-bar.css'

// Props
const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['send', 'save', 'reset', 'history'])

// 事件处理
const handleSend = () => {
  emit('send')
}

const handleSave = () => {
  emit('save')
}

const handleReset = () => {
  emit('reset')
}

const handleMoreAction = (command) => {
  switch (command) {
    case 'duplicate':
      ElMessage.info('复制用例功能开发中...')
      break
    case 'export':
      ElMessage.info('导出用例功能开发中...')
      break
    case 'generate-code':
      ElMessage.info('生成代码功能开发中...')
      break
    case 'run-collection':
      ElMessage.info('批量运行功能开发中...')
      break
  }
}

const handleHistory = () => {
  emit('history')
}

const handleSettings = () => {
  ElMessage.info('执行历史功能开发中...')
}
</script>
