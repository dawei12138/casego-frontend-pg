<template>
  <div class="cookies">
    <el-tabs v-model="activeTab" type="border-card" @tab-click="handleClickTab">
      <el-tab-pane label="全部" name="all"></el-tab-pane>
      <el-tab-pane label="会话" name="session"></el-tab-pane>
      <el-tab-pane label="本地" name="local"></el-tab-pane>
      <el-tab-pane label="第三方" name="third-party"></el-tab-pane>
    </el-tabs>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'

const activeTab = ref('all')

const handleClickTab = (tab: string) => {
  activeTab.value = tab
}
</script>
<style scoped>
.cookies {
  height: 100%;
}
</style>
