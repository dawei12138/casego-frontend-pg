<template>
  <div class="skill-ide">
    <!-- Slim header bar -->
    <header class="ide-header">
      <div class="header-left">
        <h1 class="ide-title">技能编辑器</h1>
        <div class="header-stats">
          <span class="stat-item">{{ total }} 技能</span>
          <span class="stat-sep">·</span>
          <span class="stat-item stat-enabled">{{ enabledCount }} 启用</span>
        </div>
      </div>
      <div class="header-actions">
        <el-button size="small" class="header-btn" @click="openImport">
          <el-icon><Upload /></el-icon>
          导入
        </el-button>
        <el-button size="small" class="header-btn" type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新建技能
        </el-button>
        <el-button size="small" class="header-btn" type="warning" plain :loading="syncingAll" @click="triggerSyncAll">
          <el-icon><Refresh /></el-icon>
          全量同步
        </el-button>
      </div>
    </header>

    <!-- IDE body: skill list | file editor (tree + monaco) -->
    <div class="ide-body">
      <!-- Left: skill list panel -->
      <aside class="skill-list-panel" v-loading="loading">
        <div class="panel-search">
          <el-input
            v-model="queryParams.skillName"
            placeholder="搜索技能…"
            clearable
            size="small"
            @keyup.enter="handleQuery"
            @clear="handleQuery"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <el-scrollbar class="skill-scroll">
          <div class="skill-items">
            <div
              v-for="skill in skillList"
              :key="skill.skillId"
              class="skill-item"
              :class="{
                'is-active': selectedSkillId === skill.skillId,
                'is-disabled': !skill.enabled
              }"
              @click="selectSkill(skill)"
            >
              <div class="skill-item-main">
                <span class="skill-status-dot" :class="skill.enabled ? 'is-on' : 'is-off'" />
                <span class="skill-item-name">{{ skill.displayName || skill.skillName }}</span>
              </div>
              <div class="skill-item-sub">
                <span class="skill-item-code">{{ skill.skillName }}</span>
                <el-dropdown trigger="click" size="small" @command="(cmd) => handleCardAction(cmd, skill)">
                  <span class="skill-item-more" @click.stop>
                    <el-icon><MoreFilled /></el-icon>
                  </span>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="edit">
                        <el-icon><Edit /></el-icon>
                        编辑属性
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

            <div v-if="!loading && skillList.length === 0" class="skill-empty-hint">
              暂无技能
            </div>
          </div>
        </el-scrollbar>

        <!-- Pagination -->
        <div v-if="total > queryParams.pageSize" class="skill-list-pager">
          <el-pagination
            v-model:current-page="queryParams.pageNum"
            :page-size="queryParams.pageSize"
            :total="total"
            layout="prev, next"
            small
            @current-change="getList"
          />
        </div>
      </aside>

      <!-- Right: file editor -->
      <SkillFileEditor ref="editorRef" :skill-id="selectedSkillId" />
    </div>

    <!-- Create/Edit skill dialog -->
    <el-dialog
      v-model="open"
      :title="dialogTitle"
      width="520px"
      class="skill-dialog"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="skill-form">
        <el-form-item label="技能目录名" prop="skillName">
          <el-input v-model="form.skillName" placeholder="例如：my-skill" :disabled="!!form.skillId" />
          <span class="form-hint">技能唯一标识，创建后不可修改</span>
        </el-form-item>
        <el-form-item label="显示名称" prop="displayName">
          <el-input v-model="form.displayName" placeholder="例如：我的技能" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="简要描述技能用途" />
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
          <el-button @click="cancel">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitLoading">
            {{ form.skillId ? '保存' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Import dialog -->
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
            <el-button @click="cancelImport">取消</el-button>
            <el-button type="primary" @click="handleZipImport" :loading="submitLoading" :disabled="!zipFile">
              导入
            </el-button>
          </div>
        </el-tab-pane>

        <el-tab-pane label="从 URL 导入" name="url">
          <el-form ref="importFormRef" :model="importForm" :rules="importRules" label-position="top" class="skill-form">
            <el-form-item label="技能包 URL" prop="url">
              <el-input v-model="importForm.url" placeholder="https://example.com/skill.zip" clearable />
            </el-form-item>
            <el-form-item label="技能名称（可选）">
              <el-input v-model="importForm.skillName" placeholder="留空则使用包内名称" clearable />
            </el-form-item>
          </el-form>
          <div class="dialog-footer import-footer">
            <el-button @click="cancelImport">取消</el-button>
            <el-button type="primary" @click="handleUrlImport" :loading="submitLoading" :disabled="!importForm.url">
              导入
            </el-button>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup name="Skill">
import { onMounted, computed, ref, nextTick } from 'vue'
import {
  Search, Plus, Upload, MoreFilled,
  Edit, Switch, Delete, UploadFilled, Refresh
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useSkillManagement } from './index.js'
import { syncAllSkills } from '@/api/skills/skill'
import SkillFileEditor from './components/SkillFileEditor.vue'

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
  getList,
  handleQuery,
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
} = useSkillManagement()

const enabledCount = computed(() => skillList.value.filter(item => item.enabled).length)

const selectedSkillId = ref('')
const editorRef = ref()
const uploadRef = ref()
const zipFile = ref(null)
const syncingAll = ref(false)

const selectSkill = async (skill) => {
  if (selectedSkillId.value === skill.skillId) return

  // Check if editor has unsaved changes
  if (editorRef.value?.dirtyCount > 0 && selectedSkillId.value) {
    try {
      await ElMessageBox.confirm(
        '当前技能有未保存内容，切换后将丢失本地修改，是否继续？',
        '切换确认',
        { type: 'warning', confirmButtonText: '继续切换', cancelButtonText: '取消' }
      )
    } catch {
      return
    }
  }

  selectedSkillId.value = skill.skillId
}

const handleCardAction = (command, skill) => {
  switch (command) {
    case 'edit': handleUpdate(skill); break
    case 'toggle': handleToggleEnabled(skill); break
    case 'delete': handleDelete(skill).then(() => {
      if (selectedSkillId.value === skill.skillId) {
        selectedSkillId.value = ''
      }
    }); break
  }
}

const onZipFileChange = (file) => { zipFile.value = file }
const onZipFileRemove = () => { zipFile.value = null }

const handleZipImport = async () => {
  if (!zipFile.value) return
  await handleUpload(zipFile.value)
  zipFile.value = null
  uploadRef.value?.clearFiles()
}

const triggerSyncAll = async () => {
  if (syncingAll.value) return
  try {
    await ElMessageBox.confirm(
      '将触发所有启用技能的全量落盘同步，是否继续？',
      '同步确认',
      { type: 'warning', confirmButtonText: '立即同步', cancelButtonText: '取消' }
    )
  } catch { return }

  syncingAll.value = true
  try {
    const res = await syncAllSkills()
    const result = res.data || {}
    ElMessage.success(`全量同步完成：${result.synced ?? '-'}/${result.total ?? '-'}`)
  } catch {
    ElMessage.error('全量同步失败')
  } finally {
    syncingAll.value = false
  }
}

onMounted(() => {
  // 加载更多技能以填充列表
  queryParams.value.pageSize = 50
  getList()
})
</script>

<style scoped>
@import './index.css';
</style>
