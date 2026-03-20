<template>
  <div class="skill-page">
    <header class="skill-header">
      <div class="header-top">
        <div class="header-copy">
          <p class="header-kicker">Skill Library</p>
          <h1 class="header-title">技能中心</h1>
          <p class="header-desc">查看、筛选和导入技能包，快速搭建你的技能能力集</p>
        </div>
        <div class="header-stats">
          <div class="stat-chip">
            <span class="stat-value">{{ total }}</span>
            <span class="stat-label">总技能</span>
          </div>
          <div class="stat-chip stat-chip--success">
            <span class="stat-value">{{ enabledCount }}</span>
            <span class="stat-label">已启用</span>
          </div>
          <div class="stat-chip stat-chip--info">
            <span class="stat-value">{{ importedCount }}</span>
            <span class="stat-label">已导入</span>
          </div>
        </div>
      </div>

      <div class="header-toolbar">
        <div class="toolbar-left">
          <el-input
            v-model="queryParams.skillName"
            class="search-input"
            placeholder="搜索技能名称…"
            clearable
            @keyup.enter="handleQuery"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-select
            v-model="queryParams.enabled"
            class="status-select"
            placeholder="全部状态"
            clearable
            @change="handleQuery"
          >
            <el-option label="已启用" :value="true" />
            <el-option label="已禁用" :value="false" />
          </el-select>
          <el-button text class="reset-btn" @click="resetQuery">
            <el-icon><RefreshRight /></el-icon>
            重置
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-button class="action-btn action-btn--secondary" @click="openImport">
            <el-icon><Upload /></el-icon>
            导入
          </el-button>
          <el-button class="action-btn action-btn--primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新建技能
          </el-button>
        </div>
      </div>
    </header>

    <div v-loading="loading" class="skill-grid">
      <template v-if="skillList.length">
        <article
          v-for="skill in skillList"
          :key="skill.skillId"
          class="skill-card"
          :class="{ 'is-disabled': !skill.enabled }"
        >
          <div class="card-head">
            <div class="card-icon" :class="getIconClass(skill.sourceType)">
              <el-icon><Tools /></el-icon>
            </div>
            <div class="card-head-right">
              <span class="status-dot" :class="skill.enabled ? 'is-active' : 'is-inactive'" />
              <el-dropdown trigger="click" @command="(cmd) => handleCardAction(cmd, skill)">
                <el-button link class="card-menu">
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
          </div>

          <h3 class="card-title">{{ skill.displayName || skill.skillName }}</h3>
          <p class="card-desc">{{ skill.description || '暂无描述' }}</p>

          <div class="card-foot">
            <el-tag
              :type="getSourceTagType(skill.sourceType)"
              size="small"
              effect="plain"
              round
              class="source-tag"
            >
              {{ getSourceLabel(skill.sourceType) }}
            </el-tag>
            <span class="card-time">{{ skill.updateTime ? formatTime(skill.updateTime) : '-' }}</span>
          </div>
        </article>
      </template>

      <div v-else-if="!loading" class="skill-empty">
        <div class="empty-visual">
          <el-icon class="empty-icon"><FolderOpened /></el-icon>
        </div>
        <p class="empty-title">暂无技能</p>
        <p class="empty-desc">点击「新建技能」或「导入」开始添加</p>
        <div class="empty-actions">
          <el-button class="action-btn action-btn--primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新建技能
          </el-button>
        </div>
      </div>
    </div>

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

    <!-- 新建/编辑 Dialog -->
    <el-dialog
      v-model="open"
      :title="dialogTitle"
      width="560px"
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
            placeholder="例如：my-skill"
            :disabled="!!form.skillId"
          />
          <span class="form-hint">技能唯一标识，创建后不可修改</span>
        </el-form-item>

        <el-form-item label="显示名称" prop="displayName">
          <el-input v-model="form.displayName" placeholder="例如：我的技能" />
        </el-form-item>

        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="简要描述技能用途"
          />
        </el-form-item>

        <div class="form-row">
          <el-form-item label="是否启用" class="form-row-item">
            <el-switch v-model="form.enabled" />
          </el-form-item>
          <el-form-item label="排序号" class="form-row-item">
            <el-input-number v-model="form.sortNo" :min="0" :max="9999" controls-position="right" />
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancel" class="cancel-btn">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitLoading" class="action-btn action-btn--primary">
            {{ form.skillId ? '保存' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 导入 Dialog -->
    <el-dialog
      v-model="importOpen"
      title="导入技能"
      width="520px"
      class="skill-dialog"
      :close-on-click-modal="false"
    >
      <el-tabs v-model="importType" class="import-tabs">
        <el-tab-pane label="上传 ZIP 包" name="zip">
          <el-upload
            ref="uploadRef"
            class="skill-upload"
            drag
            :auto-upload="false"
            :limit="1"
            accept=".zip"
            :on-change="onZipFileChange"
            :on-remove="onZipFileRemove"
          >
            <el-icon class="upload-icon"><UploadFilled /></el-icon>
            <div class="upload-text">
              <p>拖拽文件到此处或<em>点击上传</em></p>
              <p class="upload-hint">仅支持 .zip 文件，建议不超过 50MB</p>
            </div>
          </el-upload>
          <div class="dialog-footer import-footer">
            <el-button @click="cancelImport" class="cancel-btn">取消</el-button>
            <el-button
              type="primary"
              @click="handleZipImport"
              :loading="submitLoading"
              :disabled="!zipFile"
              class="action-btn action-btn--primary"
            >
              导入
            </el-button>
          </div>
        </el-tab-pane>

        <el-tab-pane label="从 URL 导入" name="url">
          <el-form
            ref="importFormRef"
            :model="importForm"
            :rules="importRules"
            label-position="top"
            class="skill-form"
          >
            <el-form-item label="技能包 URL" prop="url">
              <el-input
                v-model="importForm.url"
                placeholder="https://example.com/skill.zip"
                clearable
              />
              <span class="form-hint">请输入可访问的 ZIP 包地址</span>
            </el-form-item>
            <el-form-item label="技能名称（可选）">
              <el-input
                v-model="importForm.skillName"
                placeholder="留空则使用包内名称"
                clearable
              />
            </el-form-item>
          </el-form>
          <div class="dialog-footer import-footer">
            <el-button @click="cancelImport" class="cancel-btn">取消</el-button>
            <el-button
              type="primary"
              @click="handleUrlImport"
              :loading="submitLoading"
              :disabled="!importForm.url"
              class="action-btn action-btn--primary"
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
import { onMounted, computed, ref } from 'vue'
import {
  Search, Plus, Upload, FolderOpened, Tools, MoreFilled,
  Edit, Switch, Delete, UploadFilled, RefreshRight
} from '@element-plus/icons-vue'
import { useSkillManagement } from './index.js'

const {
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
  queryParams,
  form,
  rules,
  importForm,
  importRules,
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

const enabledCount = computed(() => skillList.value.filter(item => item.enabled).length)
const importedCount = computed(() => skillList.value.filter(item => ['upload', 'url'].includes(item.sourceType)).length)

const uploadRef = ref()
const zipFile = ref(null)

const onZipFileChange = (file) => {
  zipFile.value = file
}

const onZipFileRemove = () => {
  zipFile.value = null
}

const handleZipImport = async () => {
  if (!zipFile.value) return
  await handleUpload(zipFile.value)
  zipFile.value = null
  uploadRef.value?.clearFiles()
}

const getIconClass = (sourceType) => {
  const map = { manual: 'icon--blue', upload: 'icon--green', url: 'icon--amber' }
  return map[sourceType] || 'icon--blue'
}

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
    default:
      break
  }
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
@import './index.css';
</style>
