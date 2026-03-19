<template>
  <div class="skill-page">
    <section class="skill-hero">
      <div class="hero-copy">
        <p class="hero-kicker">Skill Library</p>
        <h1 class="hero-title">技能中心</h1>
        <p class="hero-desc">在这里查看、筛选和导入技能包，快速搭建你的技能能力集。</p>
      </div>
    </section>

    <div class="skill-shell">
      <section class="toolbar-card">
        <div class="toolbar-grid">
          <el-input
            v-model="queryParams.skillName"
            class="search-input"
            placeholder="搜索技能名称"
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
            placeholder="状态筛选"
            clearable
            @change="handleQuery"
          >
            <el-option label="已启用" :value="true" />
            <el-option label="已禁用" :value="false" />
          </el-select>
          <el-button text class="reset-btn" @click="resetQuery">重置筛选</el-button>
        </div>
      </section>

      <aside class="skill-side">
        <div class="side-card">
          <p class="side-title">快速操作</p>
          <div class="hero-actions">
            <el-button class="hero-btn hero-btn-import" @click="openImport">
              <el-icon><Upload /></el-icon>
              导入技能
            </el-button>
            <el-button class="hero-btn hero-btn-create" @click="handleAdd">
              <el-icon><Plus /></el-icon>
              新建技能
            </el-button>
          </div>
        </div>

        <div class="side-card">
          <p class="side-title">统计概览</p>
          <div class="hero-metrics">
            <div class="metric-item">
              <span class="metric-label">总技能</span>
              <span class="metric-value">{{ total }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">已启用</span>
              <span class="metric-value">{{ enabledCount }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">已导入</span>
              <span class="metric-value">{{ importedCount }}</span>
            </div>
          </div>
        </div>
      </aside>

      <div v-loading="loading" class="skill-grid">
        <template v-if="skillList.length">
        <article
          v-for="skill in skillList"
          :key="skill.skillId"
          class="skill-card"
          :class="{ 'is-disabled': !skill.enabled }"
        >
          <div class="card-head">
            <div class="card-icon">
              <el-icon><Tools /></el-icon>
            </div>
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

          <h3 class="card-title">{{ skill.displayName || skill.skillName }}</h3>
          <p class="card-description">{{ skill.description || '暂无描述' }}</p>

          <div class="card-meta">
            <el-tag :type="getSourceTagType(skill.sourceType)" size="small" class="source-tag">
              {{ getSourceLabel(skill.sourceType) }}
            </el-tag>
            <span class="status-pill" :class="skill.enabled ? 'enabled' : 'disabled'">
              {{ skill.enabled ? '已启用' : '已禁用' }}
            </span>
          </div>

          <div class="card-foot">
            <span class="skill-key">{{ skill.skillName }}</span>
            <span class="skill-time">{{ skill.updateTime ? formatTime(skill.updateTime) : '-' }}</span>
          </div>
        </article>
        </template>

        <div v-else-if="!loading" class="skill-empty">
          <el-icon class="empty-icon"><FolderOpened /></el-icon>
          <p class="empty-title">暂无技能</p>
          <p class="empty-desc">点击“新建技能”或“导入技能”开始添加</p>
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
    </div>

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
            placeholder="例如：my-skill"
            :disabled="!!form.skillId"
          />
          <span class="skill-form-hint">技能唯一标识，创建后不可修改</span>
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
          <el-button type="primary" @click="submitForm" :loading="submitLoading" class="hero-btn-create">
            {{ form.skillId ? '保存' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="importOpen"
      title="导入技能"
      width="520px"
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
              <p class="skill-upload-hint">仅支持 .zip 文件，建议不超过 50MB</p>
            </div>
          </el-upload>
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
              <span class="skill-form-hint">请输入可访问的 ZIP 包地址</span>
            </el-form-item>
            <el-form-item label="技能名称（可选）">
              <el-input
                v-model="importForm.skillName"
                placeholder="留空则使用包内名称"
                clearable
              />
            </el-form-item>
          </el-form>
          <div class="skill-dialog-footer import-footer">
            <el-button @click="cancelImport" class="skill-btn-cancel">取消</el-button>
            <el-button
              type="primary"
              @click="handleUrlImport"
              :loading="submitLoading"
              :disabled="!importForm.url"
              class="hero-btn-create"
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
import { onMounted, computed } from 'vue'
import { Search, Plus, Upload, FolderOpened, Tools, MoreFilled, Edit, Switch, Delete, UploadFilled } from '@element-plus/icons-vue'
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
