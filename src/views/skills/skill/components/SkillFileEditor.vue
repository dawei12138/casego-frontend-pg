<template>
  <div class="skill-file-editor" v-loading="fileListLoading">
    <!-- Toolbar -->
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <el-input
          v-model.trim="fileKeyword"
          class="file-filter"
          placeholder="过滤文件…"
          clearable
          size="small"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-tag size="small" effect="plain" class="file-count-tag">{{ fileCount }} 文件</el-tag>
      </div>

      <div class="toolbar-right">
        <el-button size="small" :disabled="!skillId" @click="openCreateFileDialog">
          <el-icon><Plus /></el-icon>
          新建文件
        </el-button>
        <el-button size="small" :disabled="!skillId" :loading="fileListLoading" @click="refreshFiles">
          <el-icon><RefreshRight /></el-icon>
        </el-button>
        <el-divider direction="vertical" />
        <el-button
          size="small"
          type="primary"
          :disabled="!canSaveCurrent"
          :loading="savingCurrent"
          @click="saveCurrentFile"
        >
          保存并同步
        </el-button>
        <el-button
          size="small"
          type="success"
          plain
          :disabled="dirtyCount === 0 || !skillId"
          :loading="savingBatch"
          @click="saveAllDrafts"
        >
          批量保存并同步({{ dirtyCount }})
        </el-button>
      </div>
    </div>

    <!-- Main content -->
    <div v-if="skillId" class="editor-body">
      <!-- File tree -->
      <aside class="file-tree-pane">
        <el-scrollbar class="tree-scroll">
          <el-tree
            ref="treeRef"
            :data="treeData"
            node-key="id"
            :props="treeProps"
            :expand-on-click-node="false"
            highlight-current
            default-expand-all
            :filter-node-method="filterTreeNode"
            @node-click="handleTreeNodeClick"
          >
            <template #default="{ data }">
              <span class="tree-node" :class="{ 'is-dirty': !data.isDir && isDirty(data.filePath) }">
                <span :class="['node-icon', data.isDir ? 'is-dir' : getFileIconClass(data.label)]">
                  {{ data.isDir ? '▸' : getFileIcon(data.label) }}
                </span>
                <span class="node-label">{{ data.label }}</span>
                <span v-if="!data.isDir && isDirty(data.filePath)" class="dirty-dot" />
                <span v-if="!data.isDir" class="node-actions" @click.stop>
                  <el-icon class="node-action-btn" @click="openRenameDialog(data)"><Edit /></el-icon>
                  <el-icon class="node-action-btn is-danger" @click="handleDeleteFile(data)"><Delete /></el-icon>
                </span>
              </span>
            </template>
          </el-tree>
        </el-scrollbar>
      </aside>

      <!-- Editor -->
      <main class="editor-pane">
        <template v-if="activeFilePath">
          <!-- Tab bar -->
          <div class="editor-tab-bar">
            <div class="tab-info">
              <span class="tab-path">{{ activeFilePath }}</span>
              <el-tag v-if="isActiveDirty" type="warning" size="small" effect="plain" round>已修改</el-tag>
              <el-tag v-else type="success" size="small" effect="plain" round>已保存</el-tag>
            </div>
            <div class="tab-actions">
              <el-tooltip content="切换主题" placement="bottom">
                <el-button link size="small" @click="toggleTheme">
                  <el-icon><component :is="editorTheme === 'vs-dark' ? 'Sunny' : 'Moon'" /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </div>

          <el-alert
            v-if="activeDraft?.isBinary"
            class="binary-alert"
            type="warning"
            show-icon
            :closable="false"
            title="当前文件为二进制格式，文本编辑可能不准确。"
          />

          <!-- Monaco editor -->
          <div class="editor-container" v-loading="fileContentLoading">
            <MonacoEditor
              v-model="activeContent"
              :file-path="activeFilePath"
              :theme="editorTheme"
              :read-only="!!activeDraft?.isBinary"
            />
          </div>
        </template>

        <div v-else class="editor-placeholder">
          <div class="placeholder-content">
            <el-icon class="placeholder-icon"><Document /></el-icon>
            <p>选择左侧文件开始编辑</p>
          </div>
        </div>
      </main>
    </div>

    <div v-else class="editor-placeholder full-placeholder">
      <div class="placeholder-content">
        <el-icon class="placeholder-icon"><FolderOpened /></el-icon>
        <p>选择一个技能开始编辑</p>
      </div>
    </div>

    <!-- Create file dialog -->
    <el-dialog v-model="createFileDialogVisible" title="新建文件" width="520px" append-to-body>
      <el-form ref="createFileFormRef" :model="createFileForm" :rules="createFileRules" label-position="top">
        <el-form-item label="文件路径" prop="filePath">
          <el-input v-model.trim="createFileForm.filePath" placeholder="例如：references/quickstart.md" />
        </el-form-item>
        <el-form-item label="初始内容">
          <el-input v-model="createFileForm.content" type="textarea" :rows="6" placeholder="可选，不填则创建空文件" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createFileDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="creatingFile" @click="confirmCreateFile">创建并打开</el-button>
      </template>
    </el-dialog>
    <!-- Rename file dialog -->
    <el-dialog v-model="renameDialogVisible" title="重命名文件" width="520px" append-to-body>
      <el-form ref="renameFormRef" :model="renameForm" :rules="renameRules" label-position="top">
        <el-form-item label="新文件路径" prop="filePath">
          <el-input v-model.trim="renameForm.filePath" placeholder="例如：references/quickstart.md" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="renameDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="renamingFile" @click="confirmRenameFile">确认重命名</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, RefreshRight, Document, FolderOpened, Sunny, Moon, Edit, Delete } from '@element-plus/icons-vue'
import {
  getSkillFileContent,
  listSkillFiles,
  saveSkillFileContent,
  saveSkillFilesContent,
  updateSkillFile,
  delSkillFile
} from '@/api/skills/skill'
import MonacoEditor from './MonacoEditor.vue'

const props = defineProps({
  skillId: { type: [String, Number], default: '' }
})

const treeRef = ref()
const fileListLoading = ref(false)
const fileContentLoading = ref(false)
const savingCurrent = ref(false)
const savingBatch = ref(false)
const creatingFile = ref(false)

const syncAfterSingleSave = ref(true)
const editorTheme = ref('vs')

const fileList = ref([])
const fileKeyword = ref('')
const activeFilePath = ref('')
const activeContent = ref('')
const drafts = reactive({})

const createFileDialogVisible = ref(false)
const createFileFormRef = ref()
const createFileForm = reactive({ filePath: '', content: '' })

const renameDialogVisible = ref(false)
const renameFormRef = ref()
const renameForm = reactive({ fileId: '', oldFilePath: '', filePath: '' })
const renamingFile = ref(false)

const renameRules = {
  filePath: [{
    required: true,
    trigger: 'blur',
    validator: (_, value, callback) => {
      const { valid, message } = validateFilePath(value)
      if (!valid) { callback(new Error(message)); return }
      if (normalizeFilePath(value) === renameForm.oldFilePath) {
        callback(new Error('新路径与原路径相同')); return
      }
      callback()
    }
  }]
}

const treeProps = { children: 'children', label: 'label' }

const FILE_ICON_MAP = {
  md: '📝', yaml: '⚙', yml: '⚙', json: '{}',
  js: 'JS', ts: 'TS', py: '🐍', sh: '▶',
  html: '◇', css: '◆', xml: '◇', svg: '◇'
}

const getFileIcon = (name) => {
  const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : ''
  return FILE_ICON_MAP[ext] || '◻'
}

const getFileIconClass = (name) => {
  const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : ''
  if (['md', 'mdx'].includes(ext)) return 'is-md'
  if (['yaml', 'yml', 'json', 'toml'].includes(ext)) return 'is-config'
  if (['js', 'ts', 'py', 'sh', 'rb', 'go'].includes(ext)) return 'is-code'
  return 'is-file'
}

const normalizeFilePath = (value) => String(value || '').trim().replace(/\\/g, '/')

const validateFilePath = (value) => {
  const filePath = normalizeFilePath(value)
  if (!filePath) return { valid: false, message: '请输入文件路径' }
  if (filePath.startsWith('/')) return { valid: false, message: '文件路径不能以 / 开头' }
  if (filePath.endsWith('/')) return { valid: false, message: '文件路径不能以 / 结尾' }
  if (filePath.includes('..')) return { valid: false, message: '文件路径不能包含 ..' }
  if (/^[a-zA-Z]:/.test(filePath)) return { valid: false, message: '文件路径不能使用盘符路径' }
  return { valid: true, message: '' }
}

const createFileRules = {
  filePath: [{
    required: true,
    trigger: 'blur',
    validator: (_, value, callback) => {
      const { valid, message } = validateFilePath(value)
      if (!valid) { callback(new Error(message)); return }
      callback()
    }
  }]
}

const sortTreeNodes = (nodes) => {
  return nodes
    .slice()
    .sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1
      return a.label.localeCompare(b.label)
    })
    .map((node) => ({
      ...node,
      children: node.children?.length ? sortTreeNodes(node.children) : []
    }))
}

const buildFileTree = (files) => {
  const root = []
  const nodeMap = new Map()

  const ensureNode = (nodeId, label, isDir, parent) => {
    let node = nodeMap.get(nodeId)
    if (!node) {
      node = { id: nodeId, label, isDir, filePath: isDir ? '' : nodeId, children: [] }
      nodeMap.set(nodeId, node)
      parent.push(node)
    }
    if (isDir) node.isDir = true
    return node
  }

  files.forEach((item) => {
    const filePath = normalizeFilePath(item.filePath)
    if (!filePath) return
    const parts = filePath.split('/').filter(Boolean)
    let parent = root
    let currentPath = ''
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      currentPath = currentPath ? `${currentPath}/${part}` : part
      const isLeaf = i === parts.length - 1
      const node = ensureNode(currentPath, part, !isLeaf, parent)
      if (isLeaf) {
        node.isDir = false
        node.filePath = filePath
        node.meta = item
        node.children = []
      } else {
        parent = node.children
      }
    }
  })

  return sortTreeNodes(root)
}

const treeData = computed(() => buildFileTree(fileList.value))
const fileCount = computed(() => fileList.value.length)

const activeDraft = computed(() => drafts[activeFilePath.value] || null)
const isActiveDirty = computed(() => {
  const draft = activeDraft.value
  if (!draft) return false
  return (draft.content || '') !== (draft.originalContent || '')
})

const isDirty = (filePath) => {
  const draft = drafts[filePath]
  if (!draft) return false
  return (draft.content || '') !== (draft.originalContent || '')
}

const dirtyEntries = computed(() => {
  return Object.keys(drafts)
    .map((fp) => drafts[fp])
    .filter((d) => d && (d.content || '') !== (d.originalContent || ''))
})

const dirtyCount = computed(() => dirtyEntries.value.length)

const canSaveCurrent = computed(() => {
  if (!props.skillId || !activeFilePath.value || !activeDraft.value) return false
  return isActiveDirty.value
})

watch(fileKeyword, (keyword) => { treeRef.value?.filter(keyword) })
watch(treeData, async () => { await nextTick(); treeRef.value?.filter(fileKeyword.value) })
watch(activeFilePath, async (value) => { await nextTick(); treeRef.value?.setCurrentKey(value || null) })

watch(activeContent, (value) => {
  if (!activeFilePath.value || !drafts[activeFilePath.value]) return
  drafts[activeFilePath.value].content = value ?? ''
})

// Watch skillId prop changes
watch(() => props.skillId, async (newId, oldId) => {
  if (!newId) {
    fileList.value = []
    clearDrafts()
    return
  }
  if (newId !== oldId) {
    clearDrafts()
    await loadFileList()
  }
}, { immediate: true })

const filterTreeNode = (value, data) => {
  if (!value) return true
  const keyword = String(value).toLowerCase()
  return String(data.filePath || data.id || '').toLowerCase().includes(keyword)
}

const clearDrafts = () => {
  Object.keys(drafts).forEach((key) => delete drafts[key])
  activeFilePath.value = ''
  activeContent.value = ''
}

const loadFileList = async () => {
  if (!props.skillId) { fileList.value = []; clearDrafts(); return }
  fileListLoading.value = true
  try {
    const res = await listSkillFiles(props.skillId)
    fileList.value = Array.isArray(res.data) ? res.data : []
    const pathSet = new Set(fileList.value.map((item) => normalizeFilePath(item.filePath)))
    Object.keys(drafts).forEach((fp) => { if (!pathSet.has(fp)) delete drafts[fp] })
    if (activeFilePath.value && !pathSet.has(activeFilePath.value)) {
      activeFilePath.value = ''
      activeContent.value = ''
    }
  } catch {
    fileList.value = []
    ElMessage.error('加载文件列表失败')
  } finally {
    fileListLoading.value = false
  }
}

const refreshFiles = () => loadFileList()

const activateFile = async (filePath) => {
  if (!props.skillId || !filePath) return
  if (drafts[filePath]) {
    activeFilePath.value = filePath
    activeContent.value = drafts[filePath].content || ''
    return
  }
  fileContentLoading.value = true
  try {
    const res = await getSkillFileContent(props.skillId, filePath)
    const data = res.data || {}
    const content = typeof data.content === 'string' ? data.content : ''
    drafts[filePath] = { filePath, content, originalContent: content, isBinary: Boolean(data.isBinary) }
    activeFilePath.value = filePath
    activeContent.value = content
  } catch {
    activeFilePath.value = ''
    activeContent.value = ''
    ElMessage.error(`加载文件内容失败: ${filePath}`)
  } finally {
    fileContentLoading.value = false
  }
}

const handleTreeNodeClick = async (node) => {
  if (node.isDir) return
  await activateFile(node.filePath)
}

const saveCurrentFile = async () => {
  if (!canSaveCurrent.value || !activeDraft.value) return
  savingCurrent.value = true
  try {
    const payload = {
      filePath: activeDraft.value.filePath,
      content: activeDraft.value.content || '',
      isBinary: Boolean(activeDraft.value.isBinary),
      syncAll: syncAfterSingleSave.value
    }
    const res = await saveSkillFileContent(props.skillId, payload)
    activeDraft.value.originalContent = activeDraft.value.content
    ElMessage.success(res.msg || '保存成功')
    await loadFileList()
  } catch {
    ElMessage.error('保存当前文件失败')
  } finally {
    savingCurrent.value = false
  }
}

const saveAllDrafts = async () => {
  if (!props.skillId || dirtyEntries.value.length === 0) return
  savingBatch.value = true
  try {
    const payload = {
      syncAll: syncAfterSingleSave.value,
      files: dirtyEntries.value.map((d) => ({
        filePath: d.filePath,
        content: d.content || '',
        isBinary: Boolean(d.isBinary)
      }))
    }
    const res = await saveSkillFilesContent(props.skillId, payload)
    dirtyEntries.value.forEach((d) => { d.originalContent = d.content })
    ElMessage.success(res.msg || '批量保存成功')
    await loadFileList()
  } catch {
    ElMessage.error('批量保存失败')
  } finally {
    savingBatch.value = false
  }
}

const toggleTheme = () => {
  editorTheme.value = editorTheme.value === 'vs' ? 'vs-dark' : 'vs'
}

const openCreateFileDialog = () => {
  if (!props.skillId) { ElMessage.warning('请先选择技能'); return }
  createFileForm.filePath = ''
  createFileForm.content = ''
  createFileDialogVisible.value = true
}

const confirmCreateFile = async () => {
  if (!createFileFormRef.value || !props.skillId) return
  try { await createFileFormRef.value.validate() } catch { return }

  const filePath = normalizeFilePath(createFileForm.filePath)
  const existed = fileList.value.some((item) => normalizeFilePath(item.filePath) === filePath)

  if (existed) {
    try {
      await ElMessageBox.confirm(`文件 ${filePath} 已存在，继续将覆盖其内容，是否继续？`, '覆盖确认', {
        type: 'warning', confirmButtonText: '继续覆盖', cancelButtonText: '取消'
      })
    } catch { return }
  }

  creatingFile.value = true
  try {
    await saveSkillFileContent(props.skillId, {
      filePath, content: createFileForm.content || '', isBinary: false, syncAll: false
    })
    drafts[filePath] = {
      filePath, content: createFileForm.content || '',
      originalContent: createFileForm.content || '', isBinary: false
    }
    createFileDialogVisible.value = false
    ElMessage.success(existed ? '文件已覆盖' : '文件已创建')
    await loadFileList()
    await activateFile(filePath)
  } catch {
    ElMessage.error(existed ? '覆盖文件失败' : '创建文件失败')
  } finally {
    creatingFile.value = false
  }
}

const openRenameDialog = (node) => {
  renameForm.fileId = node.meta?.fileId || ''
  renameForm.oldFilePath = node.filePath
  renameForm.filePath = node.filePath
  renameDialogVisible.value = true
}

const confirmRenameFile = async () => {
  if (!renameFormRef.value || !props.skillId) return
  try { await renameFormRef.value.validate() } catch { return }

  const newPath = normalizeFilePath(renameForm.filePath)
  renamingFile.value = true
  try {
    await updateSkillFile(props.skillId, {
      fileId: renameForm.fileId,
      filePath: newPath
    })
    // Update draft references
    const oldPath = renameForm.oldFilePath
    if (drafts[oldPath]) {
      drafts[newPath] = { ...drafts[oldPath], filePath: newPath }
      delete drafts[oldPath]
    }
    if (activeFilePath.value === oldPath) {
      activeFilePath.value = newPath
    }
    renameDialogVisible.value = false
    ElMessage.success('重命名成功')
    await loadFileList()
  } catch {
    ElMessage.error('重命名失败')
  } finally {
    renamingFile.value = false
  }
}

const handleDeleteFile = async (node) => {
  const fileId = node.meta?.fileId
  if (!fileId || !props.skillId) return
  try {
    await ElMessageBox.confirm(
      `确认删除文件「${node.filePath}」吗？`,
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消', confirmButtonClass: 'el-button--danger' }
    )
  } catch { return }

  try {
    await delSkillFile(props.skillId, fileId)
    // Clean up draft
    if (drafts[node.filePath]) delete drafts[node.filePath]
    if (activeFilePath.value === node.filePath) {
      activeFilePath.value = ''
      activeContent.value = ''
    }
    ElMessage.success('删除成功')
    await loadFileList()
  } catch {
    ElMessage.error('删除文件失败')
  }
}

defineExpose({ loadFileList, clearDrafts, dirtyCount })
</script>

<style scoped>
.skill-file-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px;
  background: #fafbfc;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.file-filter {
  width: 180px;
}

.file-filter :deep(.el-input__wrapper) {
  background: #fff;
  border: 1px solid #e5e7eb;
  box-shadow: none;
  border-radius: 6px;
}

.file-filter :deep(.el-input__inner) {
  color: #374151;
}

.file-filter :deep(.el-input__prefix .el-icon) {
  color: #9ca3af;
}

.file-count-tag {
  background: #f3f4f6;
  color: #6b7280;
  border-color: #e5e7eb;
}

.editor-body {
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
}

/* File tree */
.file-tree-pane {
  width: 240px;
  flex-shrink: 0;
  background: #fafbfc;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tree-scroll {
  flex: 1;
  padding: 4px 0;
}

.tree-node {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  position: relative;
  padding-right: 8px;
}

.tree-node.is-dirty .node-label {
  color: #d97706;
}

.node-icon {
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  flex-shrink: 0;
  border-radius: 3px;
}

.node-icon.is-dir { color: #b45309; }
.node-icon.is-md { color: #2563eb; }
.node-icon.is-config { color: #c2410c; }
.node-icon.is-code { color: #7c3aed; }
.node-icon.is-file { color: #0891b2; }

.node-label {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: #374151;
}

.dirty-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #d97706;
  flex-shrink: 0;
}

.node-actions {
  display: none;
  align-items: center;
  gap: 2px;
  margin-left: auto;
  flex-shrink: 0;
}

.tree-node:hover .node-actions {
  display: inline-flex;
}

.node-action-btn {
  width: 18px;
  height: 18px;
  border-radius: 3px;
  cursor: pointer;
  color: #9ca3af;
  font-size: 12px;
}

.node-action-btn:hover {
  color: #2563eb;
  background: #eef2ff;
}

.node-action-btn.is-danger:hover {
  color: #dc2626;
  background: #fef2f2;
}

.file-tree-pane :deep(.el-tree) {
  background: transparent;
  color: #374151;
  --el-tree-node-hover-bg-color: #f3f4f6;
}

.file-tree-pane :deep(.el-tree-node__content) {
  height: 28px;
  padding-left: 8px !important;
}

.file-tree-pane :deep(.el-tree--highlight-current .el-tree-node.is-current > .el-tree-node__content) {
  background: #eef2ff;
}

.file-tree-pane :deep(.el-tree-node__expand-icon) {
  color: #9ca3af;
}

/* Editor pane */
.editor-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.editor-tab-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 12px;
  background: #fafbfc;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.tab-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.tab-path {
  font-size: 12px;
  color: #374151;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tab-actions .el-button {
  color: #9ca3af;
}

.tab-actions .el-button:hover {
  color: #374151;
}

.binary-alert {
  margin: 8px 12px 0;
  flex-shrink: 0;
}

.editor-container {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* Placeholder */
.editor-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
}

.full-placeholder {
  min-height: 400px;
}

.placeholder-content {
  text-align: center;
  color: #9ca3af;
}

.placeholder-icon {
  font-size: 48px;
  color: #d1d5db;
  margin-bottom: 12px;
}

.placeholder-content p {
  margin: 8px 0 0;
  font-size: 14px;
}
</style>
