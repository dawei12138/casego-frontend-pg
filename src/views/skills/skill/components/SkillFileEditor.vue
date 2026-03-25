<template>
  <div class="skill-file-editor" v-loading="fileListLoading">
    <!-- Toolbar -->
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <el-input
          v-model.trim="fileKeyword"
          class="file-filter"
          placeholder="Filter files..."
          clearable
          size="small"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-tag size="small" effect="plain" class="file-count-tag">{{ fileCount }} files</el-tag>
      </div>

      <div class="toolbar-right">
        <el-button size="small" :disabled="!skillId" @click="openCreateFolderDialog">
          <el-icon><FolderAdd /></el-icon>
          New Folder
        </el-button>
        <el-button size="small" :disabled="!skillId" @click="openCreateFileDialog">
          <el-icon><Plus /></el-icon>
          New File
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
          Save & Sync
        </el-button>
        <el-button
          size="small"
          type="success"
          plain
          :disabled="dirtyCount === 0 || !skillId"
          :loading="savingBatch"
          @click="saveAllDrafts"
        >
          Save All ({{ dirtyCount }})
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
                  {{ data.isDir ? 'DIR' : getFileIcon(data.label) }}
                </span>
                <span class="node-label">{{ data.label }}</span>
                <span v-if="!data.isDir && isDirty(data.filePath)" class="dirty-dot" />
                <span class="node-actions" @click.stop>
                  <template v-if="data.isDir">
                    <el-icon class="node-action-btn" @click="openRenameFolderDialog(data)"><Edit /></el-icon>
                    <el-icon class="node-action-btn is-danger" @click="handleDeleteFolder(data)"><Delete /></el-icon>
                  </template>
                  <template v-else>
                    <el-icon class="node-action-btn" @click="openRenameDialog(data)"><Edit /></el-icon>
                    <el-icon class="node-action-btn is-danger" @click="handleDeleteFile(data)"><Delete /></el-icon>
                  </template>
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
              <el-tag v-if="isActiveDirty" type="warning" size="small" effect="plain" round>Modified</el-tag>
              <el-tag v-else type="success" size="small" effect="plain" round>Saved</el-tag>
            </div>
            <div class="tab-actions">
              <el-tooltip content="Toggle theme" placement="bottom">
                <el-button link size="small" @click="toggleTheme">
                  <el-icon><component :is="editorTheme === 'vs-dark' ? Sunny : Moon" /></el-icon>
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
            title="Current file is binary; text editing may be inaccurate."
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
            <p>Select a file to start editing</p>
          </div>
        </div>
      </main>
    </div>

    <div v-else class="editor-placeholder full-placeholder">
      <div class="placeholder-content">
        <el-icon class="placeholder-icon"><FolderOpened /></el-icon>
        <p>Select a skill to start editing</p>
      </div>
    </div>

    <!-- Create file dialog -->
    <el-dialog v-model="createFileDialogVisible" title="Create File" width="520px" append-to-body>
      <el-form ref="createFileFormRef" :model="createFileForm" :rules="createFileRules" label-position="top">
        <el-form-item label="File Path" prop="filePath">
          <el-input v-model.trim="createFileForm.filePath" placeholder="e.g. references/quickstart.md" />
        </el-form-item>
        <el-form-item label="Initial Content">
          <el-input v-model="createFileForm.content" type="textarea" :rows="6" placeholder="Optional" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createFileDialogVisible = false">Cancel</el-button>
        <el-button type="primary" :loading="creatingFile" @click="confirmCreateFile">Create & Open</el-button>
      </template>
    </el-dialog>

    <!-- Create folder dialog -->
    <el-dialog v-model="createFolderDialogVisible" title="Create Folder" width="520px" append-to-body>
      <el-form ref="createFolderFormRef" :model="createFolderForm" :rules="createFolderRules" label-position="top">
        <el-form-item label="Folder Path" prop="folderPath">
          <el-input v-model.trim="createFolderForm.folderPath" placeholder="references or references/sub" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createFolderDialogVisible = false">Cancel</el-button>
        <el-button type="primary" :loading="creatingFolder" @click="confirmCreateFolder">Create</el-button>
      </template>
    </el-dialog>

    <!-- Rename/move file dialog -->
    <el-dialog v-model="renameDialogVisible" title="Move / Rename File" width="520px" append-to-body>
      <el-form ref="renameFormRef" :model="renameForm" :rules="renameRules" label-position="top">
        <el-form-item label="New File Path" prop="filePath">
          <el-input v-model.trim="renameForm.filePath" placeholder="e.g. references/quickstart.md" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="renameDialogVisible = false">Cancel</el-button>
        <el-button type="primary" :loading="renamingFile" @click="confirmRenameFile">Confirm</el-button>
      </template>
    </el-dialog>

    <!-- Rename folder dialog -->
    <el-dialog v-model="renameFolderDialogVisible" title="Rename Folder" width="520px" append-to-body>
      <el-form ref="renameFolderFormRef" :model="renameFolderForm" :rules="renameFolderRules" label-position="top">
        <el-form-item label="New Folder Path" prop="folderPath">
          <el-input v-model.trim="renameFolderForm.folderPath" placeholder="references or docs" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="renameFolderDialogVisible = false">Cancel</el-button>
        <el-button type="primary" :loading="renamingFolder" @click="confirmRenameFolder">Confirm</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Plus,
  FolderAdd,
  RefreshRight,
  Document,
  FolderOpened,
  Sunny,
  Moon,
  Edit,
  Delete
} from '@element-plus/icons-vue'
import {
  getSkillFileContent,
  listSkillFiles,
  saveSkillFileContent,
  saveSkillFilesContent,
  moveSkillFile,
  delSkillFile,
  addSkillFolder,
  renameSkillFolder,
  delSkillFolder
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
const creatingFolder = ref(false)

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

const createFolderDialogVisible = ref(false)
const createFolderFormRef = ref()
const createFolderForm = reactive({ folderPath: '' })

const renameDialogVisible = ref(false)
const renameFormRef = ref()
const renameForm = reactive({ oldFilePath: '', filePath: '' })
const renamingFile = ref(false)

const renameFolderDialogVisible = ref(false)
const renameFolderFormRef = ref()
const renameFolderForm = reactive({ oldPath: '', folderPath: '' })
const renamingFolder = ref(false)

const treeProps = { children: 'children', label: 'label' }

const FILE_ICON_MAP = {
  md: 'MD',
  yaml: 'YAML',
  yml: 'YAML',
  json: 'JSON',
  js: 'JS',
  ts: 'TS',
  py: 'PY',
  sh: 'SH',
  html: 'HTML',
  css: 'CSS',
  xml: 'XML',
  svg: 'SVG'
}

const normalizeFilePath = (value) => String(value || '').trim().replace(/\\/g, '/')
const normalizeFolderPath = (value) => normalizeFilePath(value).replace(/^\/+/, '').replace(/\/+$/, '')

const isFolderEntry = (item) => {
  const type = String(item?.type || item?.entryType || '').toLowerCase()
  return Boolean(item?.isDir || item?.isDirectory || type === 'dir' || type === 'folder')
}

const resolveEntryPath = (item, asFolder = false) => {
  const rawPath = normalizeFilePath(item?.filePath || item?.path || item?.folderPath || '')
  return asFolder ? normalizeFolderPath(rawPath) : rawPath
}

const isPathInFolder = (path, folderPath) => {
  const normalizedPath = normalizeFilePath(path)
  const normalizedFolder = normalizeFolderPath(folderPath)
  if (!normalizedPath || !normalizedFolder) return false
  return normalizedPath === normalizedFolder || normalizedPath.startsWith(`${normalizedFolder}/`)
}

const validateFilePath = (value) => {
  const filePath = normalizeFilePath(value)
  if (!filePath) return { valid: false, message: 'Please enter a file path' }
  if (filePath.startsWith('/')) return { valid: false, message: 'File path cannot start with /' }
  if (filePath.endsWith('/')) return { valid: false, message: 'File path cannot end with /' }
  if (filePath.includes('..')) return { valid: false, message: 'File path cannot contain ..' }
  if (filePath.includes('//')) return { valid: false, message: 'File path cannot contain //' }
  if (/^[a-zA-Z]:/.test(filePath)) return { valid: false, message: 'Absolute disk path is not allowed' }
  return { valid: true, message: '' }
}

const validateFolderPath = (value) => {
  const folderPath = normalizeFolderPath(value)
  if (!folderPath) return { valid: false, message: 'Please enter a folder path' }
  if (folderPath.includes('..')) return { valid: false, message: 'Folder path cannot contain ..' }
  if (folderPath.includes('//')) return { valid: false, message: 'Folder path cannot contain //' }
  if (/^[a-zA-Z]:/.test(folderPath)) return { valid: false, message: 'Absolute disk path is not allowed' }
  return { valid: true, message: '' }
}

const createFileRules = {
  filePath: [{
    required: true,
    trigger: 'blur',
    validator: (_, value, callback) => {
      const { valid, message } = validateFilePath(value)
      if (!valid) {
        callback(new Error(message))
        return
      }
      callback()
    }
  }]
}

const createFolderRules = {
  folderPath: [{
    required: true,
    trigger: 'blur',
    validator: (_, value, callback) => {
      const { valid, message } = validateFolderPath(value)
      if (!valid) {
        callback(new Error(message))
        return
      }
      callback()
    }
  }]
}

const renameRules = {
  filePath: [{
    required: true,
    trigger: 'blur',
    validator: (_, value, callback) => {
      const { valid, message } = validateFilePath(value)
      if (!valid) {
        callback(new Error(message))
        return
      }
      if (normalizeFilePath(value) === renameForm.oldFilePath) {
        callback(new Error('New path is the same as old path'))
        return
      }
      callback()
    }
  }]
}

const renameFolderRules = {
  folderPath: [{
    required: true,
    trigger: 'blur',
    validator: (_, value, callback) => {
      const { valid, message } = validateFolderPath(value)
      if (!valid) {
        callback(new Error(message))
        return
      }
      if (normalizeFolderPath(value) === renameFolderForm.oldPath) {
        callback(new Error('New path is the same as old path'))
        return
      }
      callback()
    }
  }]
}

const getFileIcon = (name) => {
  const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : ''
  return FILE_ICON_MAP[ext] || 'FILE'
}

const getFileIconClass = (name) => {
  const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : ''
  if (['md', 'mdx'].includes(ext)) return 'is-md'
  if (['yaml', 'yml', 'json', 'toml'].includes(ext)) return 'is-config'
  if (['js', 'ts', 'py', 'sh', 'rb', 'go'].includes(ext)) return 'is-code'
  return 'is-file'
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

const buildFileTree = (entries) => {
  const root = []
  const nodeMap = new Map()

  const ensureNode = (nodeId, label, isDir, parent) => {
    let node = nodeMap.get(nodeId)
    if (!node) {
      node = { id: nodeId, label, isDir, filePath: isDir ? '' : nodeId, children: [] }
      nodeMap.set(nodeId, node)
      parent.push(node)
    }
    if (isDir && !node.isDir) {
      node.isDir = true
      node.filePath = ''
      if (!Array.isArray(node.children)) node.children = []
    }
    return node
  }

  entries.forEach((item) => {
    const entryIsDir = isFolderEntry(item)
    const entryPath = resolveEntryPath(item, entryIsDir)
    if (!entryPath) return

    const parts = entryPath.split('/').filter(Boolean)
    let parent = root
    let currentPath = ''

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      currentPath = currentPath ? `${currentPath}/${part}` : part
      const isLeaf = i === parts.length - 1
      const nodeShouldBeDir = !isLeaf || entryIsDir
      const node = ensureNode(currentPath, part, nodeShouldBeDir, parent)

      if (isLeaf) {
        node.isDir = nodeShouldBeDir
        node.filePath = nodeShouldBeDir ? '' : entryPath
        node.meta = item
        if (!nodeShouldBeDir) node.children = []
      }

      if (node.isDir) parent = node.children
    }
  })

  return sortTreeNodes(root)
}

const treeData = computed(() => buildFileTree(fileList.value))
const fileCount = computed(() => fileList.value.filter((item) => !isFolderEntry(item)).length)

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
    .filter((draft) => draft && (draft.content || '') !== (draft.originalContent || ''))
})

const dirtyCount = computed(() => dirtyEntries.value.length)

const canSaveCurrent = computed(() => {
  if (!props.skillId || !activeFilePath.value || !activeDraft.value) return false
  return isActiveDirty.value
})

const replaceSingleDraftPath = (oldPath, newPath) => {
  if (!oldPath || !newPath || oldPath === newPath) return
  const oldDraft = drafts[oldPath]
  if (oldDraft) {
    drafts[newPath] = { ...oldDraft, filePath: newPath }
    delete drafts[oldPath]
  }
  if (activeFilePath.value === oldPath) {
    activeFilePath.value = newPath
    activeContent.value = drafts[newPath]?.content || activeContent.value
  }
}

const replaceDraftFolderPrefix = (oldFolderPath, newFolderPath) => {
  if (!oldFolderPath || !newFolderPath || oldFolderPath === newFolderPath) return
  const oldPrefix = `${oldFolderPath}/`

  Object.keys(drafts)
    .filter((draftPath) => draftPath === oldFolderPath || draftPath.startsWith(oldPrefix))
    .forEach((draftPath) => {
      const suffix = draftPath.slice(oldFolderPath.length)
      const nextPath = `${newFolderPath}${suffix}`
      drafts[nextPath] = { ...drafts[draftPath], filePath: nextPath }
      delete drafts[draftPath]
    })

  if (activeFilePath.value && isPathInFolder(activeFilePath.value, oldFolderPath)) {
    const suffix = activeFilePath.value.slice(oldFolderPath.length)
    const nextPath = `${newFolderPath}${suffix}`
    activeFilePath.value = nextPath
    activeContent.value = drafts[nextPath]?.content || activeContent.value
  }
}

const removeDraftFolder = (folderPath) => {
  if (!folderPath) return
  Object.keys(drafts)
    .filter((draftPath) => isPathInFolder(draftPath, folderPath))
    .forEach((draftPath) => delete drafts[draftPath])

  if (activeFilePath.value && isPathInFolder(activeFilePath.value, folderPath)) {
    activeFilePath.value = ''
    activeContent.value = ''
  }
}

const getNodeFolderPath = (node) => normalizeFolderPath(node?.id || node?.filePath || '')

watch(fileKeyword, (keyword) => {
  treeRef.value?.filter(keyword)
})

watch(treeData, async () => {
  await nextTick()
  treeRef.value?.filter(fileKeyword.value)
})

watch(activeFilePath, async (value) => {
  await nextTick()
  treeRef.value?.setCurrentKey(value || null)
})

watch(activeContent, (value) => {
  if (!activeFilePath.value || !drafts[activeFilePath.value]) return
  drafts[activeFilePath.value].content = value ?? ''
})

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
  if (!props.skillId) {
    fileList.value = []
    clearDrafts()
    return
  }

  fileListLoading.value = true
  try {
    const res = await listSkillFiles(props.skillId)
    fileList.value = Array.isArray(res.data) ? res.data : []

    const pathSet = new Set(
      fileList.value
        .filter((item) => !isFolderEntry(item))
        .map((item) => resolveEntryPath(item, false))
        .filter(Boolean)
    )

    Object.keys(drafts).forEach((draftPath) => {
      if (!pathSet.has(draftPath)) delete drafts[draftPath]
    })

    if (activeFilePath.value && !pathSet.has(activeFilePath.value)) {
      activeFilePath.value = ''
      activeContent.value = ''
    }
  } catch {
    fileList.value = []
    ElMessage.error('Failed to load file list')
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
    drafts[filePath] = {
      filePath,
      content,
      originalContent: content,
      isBinary: Boolean(data.isBinary)
    }
    activeFilePath.value = filePath
    activeContent.value = content
  } catch {
    activeFilePath.value = ''
    activeContent.value = ''
    ElMessage.error(`Failed to load file content: ${filePath}`)
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
    ElMessage.success(res.msg || 'Saved successfully')
    await loadFileList()
  } catch {
    ElMessage.error('Failed to save current file')
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
      files: dirtyEntries.value.map((draft) => ({
        filePath: draft.filePath,
        content: draft.content || '',
        isBinary: Boolean(draft.isBinary)
      }))
    }
    const res = await saveSkillFilesContent(props.skillId, payload)
    dirtyEntries.value.forEach((draft) => {
      draft.originalContent = draft.content
    })
    ElMessage.success(res.msg || 'Saved all drafts')
    await loadFileList()
  } catch {
    ElMessage.error('Failed to save drafts')
  } finally {
    savingBatch.value = false
  }
}

const toggleTheme = () => {
  editorTheme.value = editorTheme.value === 'vs' ? 'vs-dark' : 'vs'
}

const openCreateFileDialog = () => {
  if (!props.skillId) {
    ElMessage.warning('Please select a skill first')
    return
  }

  const currentNode = treeRef.value?.getCurrentNode?.()
  if (currentNode?.isDir) {
    const folderPath = getNodeFolderPath(currentNode)
    createFileForm.filePath = folderPath ? `${folderPath}/` : ''
  } else {
    createFileForm.filePath = ''
  }

  createFileForm.content = ''
  createFileDialogVisible.value = true
}

const confirmCreateFile = async () => {
  if (!createFileFormRef.value || !props.skillId) return
  try {
    await createFileFormRef.value.validate()
  } catch {
    return
  }

  const filePath = normalizeFilePath(createFileForm.filePath)
  const existed = fileList.value.some((item) => {
    if (isFolderEntry(item)) return false
    return resolveEntryPath(item, false) === filePath
  })

  if (existed) {
    try {
      await ElMessageBox.confirm(
        `File ${filePath} already exists. Continue and overwrite?`,
        'Overwrite Confirmation',
        { type: 'warning', confirmButtonText: 'Overwrite', cancelButtonText: 'Cancel' }
      )
    } catch {
      return
    }
  }

  creatingFile.value = true
  try {
    await saveSkillFileContent(props.skillId, {
      filePath,
      content: createFileForm.content || '',
      isBinary: false,
      syncAll: false
    })

    drafts[filePath] = {
      filePath,
      content: createFileForm.content || '',
      originalContent: createFileForm.content || '',
      isBinary: false
    }

    createFileDialogVisible.value = false
    ElMessage.success(existed ? 'File overwritten' : 'File created')
    await loadFileList()
    await activateFile(filePath)
  } catch {
    ElMessage.error(existed ? 'Failed to overwrite file' : 'Failed to create file')
  } finally {
    creatingFile.value = false
  }
}

const openCreateFolderDialog = () => {
  if (!props.skillId) {
    ElMessage.warning('Please select a skill first')
    return
  }

  const currentNode = treeRef.value?.getCurrentNode?.()
  createFolderForm.folderPath = currentNode?.isDir ? getNodeFolderPath(currentNode) : ''
  createFolderDialogVisible.value = true
}

const confirmCreateFolder = async () => {
  if (!createFolderFormRef.value || !props.skillId) return
  try {
    await createFolderFormRef.value.validate()
  } catch {
    return
  }

  const folderPath = normalizeFolderPath(createFolderForm.folderPath)
  creatingFolder.value = true
  try {
    const res = await addSkillFolder(props.skillId, { folderPath })
    createFolderDialogVisible.value = false
    ElMessage.success(res.msg || 'Folder created')
    await loadFileList()
  } catch {
    ElMessage.error('Failed to create folder')
  } finally {
    creatingFolder.value = false
  }
}

const openRenameDialog = (node) => {
  renameForm.oldFilePath = normalizeFilePath(node.filePath)
  renameForm.filePath = normalizeFilePath(node.filePath)
  renameDialogVisible.value = true
}

const confirmRenameFile = async () => {
  if (!renameFormRef.value || !props.skillId) return
  try {
    await renameFormRef.value.validate()
  } catch {
    return
  }

  const oldPath = normalizeFilePath(renameForm.oldFilePath)
  const newPath = normalizeFilePath(renameForm.filePath)

  renamingFile.value = true
  try {
    await moveSkillFile(props.skillId, { oldPath, newPath })
    replaceSingleDraftPath(oldPath, newPath)
    renameDialogVisible.value = false
    ElMessage.success('File moved successfully')
    await loadFileList()
  } catch {
    ElMessage.error('Failed to move file')
  } finally {
    renamingFile.value = false
  }
}

const openRenameFolderDialog = (node) => {
  const folderPath = getNodeFolderPath(node)
  if (!folderPath) return

  renameFolderForm.oldPath = folderPath
  renameFolderForm.folderPath = folderPath
  renameFolderDialogVisible.value = true
}

const confirmRenameFolder = async () => {
  if (!renameFolderFormRef.value || !props.skillId) return
  try {
    await renameFolderFormRef.value.validate()
  } catch {
    return
  }

  const oldPath = normalizeFolderPath(renameFolderForm.oldPath)
  const newPath = normalizeFolderPath(renameFolderForm.folderPath)

  renamingFolder.value = true
  try {
    const res = await renameSkillFolder(props.skillId, { oldPath, newPath })
    replaceDraftFolderPrefix(oldPath, newPath)
    renameFolderDialogVisible.value = false
    ElMessage.success(res.msg || 'Folder renamed successfully')
    await loadFileList()
  } catch {
    ElMessage.error('Failed to rename folder')
  } finally {
    renamingFolder.value = false
  }
}

const handleDeleteFile = async (node) => {
  const fileId = node.meta?.fileId
  if (!fileId || !props.skillId) return

  try {
    await ElMessageBox.confirm(
      `Delete file ${node.filePath}?`,
      'Delete Confirmation',
      {
        type: 'warning',
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        confirmButtonClass: 'el-button--danger'
      }
    )
  } catch {
    return
  }

  try {
    await delSkillFile(props.skillId, fileId)
    if (drafts[node.filePath]) delete drafts[node.filePath]
    if (activeFilePath.value === node.filePath) {
      activeFilePath.value = ''
      activeContent.value = ''
    }
    ElMessage.success('File deleted')
    await loadFileList()
  } catch {
    ElMessage.error('Failed to delete file')
  }
}

const handleDeleteFolder = async (node) => {
  if (!props.skillId) return
  const folderPath = getNodeFolderPath(node)
  if (!folderPath) return

  try {
    await ElMessageBox.confirm(
      `Delete folder ${folderPath}?`,
      'Delete Confirmation',
      {
        type: 'warning',
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        confirmButtonClass: 'el-button--danger'
      }
    )
  } catch {
    return
  }

  try {
    const res = await delSkillFolder(props.skillId, { folderPath })
    removeDraftFolder(folderPath)
    ElMessage.success(res.msg || 'Folder deleted')
    await loadFileList()
  } catch {
    ElMessage.error('Failed to delete folder')
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
