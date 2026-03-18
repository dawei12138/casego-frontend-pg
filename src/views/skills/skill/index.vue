<template>
  <div class="skill-container">
    <!-- Header -->
    <div class="skill-header">
      <div class="skill-header-left">
        <h1 class="skill-title">AI Skills</h1>
        <p class="skill-subtitle">管理和配置 AI 技能目录</p>
      </div>
      <div class="skill-header-right">
        <el-input
          v-model="queryParams.skillName"
          placeholder="搜索技能名称"
          class="skill-search"
          clearable
          @keyup.enter="handleQuery"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button class="skill-btn-primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新建技能
        </el-button>
        <el-button class="skill-btn-secondary" @click="openImport">
          <el-icon><Upload /></el-icon>
          导入
        </el-button>
      </div>
    </div>

    <!-- Filters -->
    <div class="skill-filters">
      <div class="skill-filter-item">
        <span class="skill-filter-label">状态</span>
        <el-select v-model="queryParams.enabled" placeholder="全部" clearable class="skill-filter-select" @change="handleQuery">
          <el-option label="已启用" :value="true" />
          <el-option label="已禁用" :value="false" />
        </el-select>
      </div>
      <el-button link class="skill-filter-reset" @click="resetQuery">重置筛选</el-button>
    </div>

    <!-- Skill Cards Grid -->
    <div v-loading="loading" class="skill-grid">
      <div
        v-for="skill in skillList"
        :key="skill.skillId"
        class="skill-card"
      >
        <div class="skill-card-header">
          <div class="skill-card-icon">
            <el-icon><Tools /></el-icon>
          </div>
          <el-dropdown trigger="click" @command="(cmd) => handleCardAction(cmd, skill)">
            <el-button link class="skill-card-more">
              <el-icon><MoreFilled /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="edit">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-dropdown-item>
                <el-dropdown-item command="toggle">
                  <el-icon><Switch /></el-icon>
                  {{ skill.enabled ? '禁用' : '启用' }}
                </el-dropdown-item>
                <el-dropdown-item command="delete" divided>
                  <el-icon><Delete /></el-icon>
                  删除
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <div class="skill-card-body">
          <h3 class="skill-card-title">{{ skill.displayName || skill.skillName }}</h3>
          <p class="skill-card-desc">{{ skill.description || '暂无描述' }}</p>
          <div class="skill-card-meta">
            <el-tag :type="getSourceTagType(skill.sourceType)" size="small" class="skill-card-tag">
              {{ getSourceLabel(skill.sourceType) }}
            </el-tag>
            <span class="skill-card-status" :class="{ 'skill-status-enabled': skill.enabled }">
              {{ skill.enabled ? '已启用' : '已禁用' }}
            </span>
          </div>
          <div class="skill-card-footer" v-if="skill.updateTime">
            <span class="skill-card-time">{{ formatTime(skill.updateTime) }}</span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && skillList.length === 0" class="skill-empty">
        <el-icon class="skill-empty-icon"><FolderOpened /></el-icon>
        <p class="skill-empty-text">暂无技能</p>
        <p class="skill-empty-hint">点击"新建技能"或"导入"开始添加</p>
      </div>
    </div>

    <!-- Pagination -->
    <div class="skill-pagination" v-if="total > 0">
      <el-pagination
        v-model:current-page="queryParams.pageNum"
        v-model:page-size="queryParams.pageSize"
        :total="total"
        :page-sizes="[12, 24, 48, 96]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="getList"
        @current-change="getList"
      />
    </div>

    <!-- Add/Edit Dialog -->
    <el-dialog
      v-model="open"
      :title="dialogTitle"
      width="600px"
      class="skill-dialog"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        class="skill-form"
      >
        <el-form-item label="技能目录名" prop="skillName">
          <el-input
            v-model="form.skillName"
            placeholder="例如: my-skill"
            :disabled="!!form.skillId"
          />
          <span class="skill-form-hint">技能的唯一标识符，创建后不可修改</span>
        </el-form-item>

        <el-form-item label="显示名称" prop="displayName">
          <el-input v-model="form.displayName" placeholder="例如: 我的技能" />
        </el-form-item>

        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="简要描述该技能的功能和用途"
          />
        </el-form-item>

        <el-form-item label="是否启用">
          <el-switch v-model="form.enabled" />
        </el-form-item>

        <el-form-item label="排序号">
          <el-input-number v-model="form.sortNo" :min="0" :max="9999" controls-position="right" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="skill-dialog-footer">
          <el-button @click="cancel" class="skill-btn-cancel">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitLoading" class="skill-btn-primary">
            {{ form.skillId ? '保存' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Import Dialog -->
    <el-dialog
      v-model="importOpen"
      title="导入技能"
      width="500px"
      class="skill-dialog"
      :close-on-click-modal="false"
    >
      <el-tabs v-model="importType" class="skill-import-tabs">
        <el-tab-pane label="上传 ZIP 包" name="zip">
          <el-upload
            class="skill-upload"
            drag
            :auto-upload="false"
            :limit="1"
            accept=".zip"
            :before-upload="handleUpload"
          >
            <el-icon class="skill-upload-icon"><UploadFilled /></el-icon>
            <div class="skill-upload-text">
              <p>拖拽文件到此处或<em>点击上传</em></p>
              <p class="skill-upload-hint">仅支持 .zip 格式，最大 50MB</p>
            </div>
          </el-upload>
        </el-tab-pane>

        <el-tab-pane label="从 URL 导入" name="url">
          <el-form ref="importFormRef" :model="importForm" :rules="importRules" label-position="top" class="skill-form">
            <el-form-item label="技能包 URL" prop="url">
              <el-input
                v-model="importForm.url"
                placeholder="https://example.com/skill.zip"
                clearable
              />
              <span class="skill-form-hint">输入技能包的下载地址（ZIP 格式）</span>
            </el-form-item>
            <el-form-item label="技能名称（可选）">
              <el-input
                v-model="importForm.skillName"
                placeholder="留空则使用包内默认名称"
                clearable
              />
            </el-form-item>
          </el-form>
          <div class="skill-dialog-footer" style="margin-top: 20px;">
            <el-button @click="cancelImport" class="skill-btn-cancel">取消</el-button>
            <el-button
              type="primary"
              @click="handleUrlImport"
              :loading="submitLoading"
              :disabled="!importForm.url"
              class="skill-btn-primary"
            >
              导入
            </el-button>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup name="Skill">
import { onMounted } from 'vue'
import { Search, Plus, Upload, FolderOpened, Tools, MoreFilled, Edit, Switch, Delete, UploadFilled } from '@element-plus/icons-vue'
import { useSkillManagement } from './index.js'

const {
  // State
  skillList,
  loading,
  submitLoading,
  total,
  open,
  dialogTitle,
  importOpen,
  importType,
  formRef,
  importFormRef,
  // Data
  queryParams,
  form,
  rules,
  importForm,
  importRules,
  // Methods
  getSourceLabel,
  getSourceTagType,
  getList,
  handleQuery,
  resetQuery,
  cancel,
  handleAdd,
  handleUpdate,
  submitForm,
  handleDelete,
  openImport,
  cancelImport,
  handleUpload,
  handleUrlImport,
  handleToggleEnabled,
  formatTime
} = useSkillManagement()

// Card action handler
const handleCardAction = (command, skill) => {
  switch (command) {
    case 'edit':
      handleUpdate(skill)
      break
    case 'toggle':
      handleToggleEnabled(skill)
      break
    case 'delete':
      handleDelete(skill)
      break
  }
}

// Initialize
onMounted(() => {
  getList()
})
</script>

<style scoped>
@import './index.css';
</style>
