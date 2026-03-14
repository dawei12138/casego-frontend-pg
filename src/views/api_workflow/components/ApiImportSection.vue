<template>
  <div class="type-category">
    <div class="category-header">
      <el-icon class="category-icon api-icon"><Connection /></el-icon>
      <h3 class="category-title">接口导入</h3>
      <span class="category-badge">常用</span>
    </div>
    <div class="type-grid">
      <div
        class="type-card api-type"
        @click="handleSelect('从接口导入')"
      >
        <div class="card-icon">
          <el-icon><Document /></el-icon>
        </div>
        <div class="card-title">从接口导入</div>
        <div class="card-desc">导入API接口用例</div>
      </div>

      <div
        class="type-card api-type"
        @click="handleSelect('从接口测试用例导入')"
      >
        <div class="card-icon">
          <el-icon><Files /></el-icon>
        </div>
        <div class="card-title">从测试用例导入</div>
        <div class="card-desc">导入接口测试用例</div>
      </div>

      <div
        class="type-card api-type"
        @click="handleSelect('添加HTTP请求')"
      >
        <div class="card-icon">
          <el-icon><Link /></el-icon>
        </div>
        <div class="card-title">添加HTTP请求</div>
        <div class="card-desc">创建新的HTTP请求</div>
      </div>

      <div
        class="type-card api-type"
        @click="handleSelect('从CURL导入')"
      >
        <div class="card-icon">
          <el-icon><CopyDocument /></el-icon>
        </div>
        <div class="card-title">从CURL导入</div>
        <div class="card-desc">粘贴CURL命令导入</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  Connection,
  Document,
  Files,
  Link,
  CopyDocument
} from '@element-plus/icons-vue'

const emit = defineEmits(['select'])

const handleSelect = (type) => {
  emit('select', type)
}
</script>

<style scoped>
@import '../styles/add-node-dialogs.css';
</style>
