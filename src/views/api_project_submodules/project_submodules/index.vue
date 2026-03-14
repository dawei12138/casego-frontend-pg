<template>
  <div class="testcase-tree-container">
    <el-row :gutter="20">
      <splitpanes
        :horizontal="appStore.device === 'mobile'"
        class="default-theme"
      >
        <!-- 接口用例树 -->
        <pane size="30">
          <el-col>
            <div class="head-container">
              <el-input
                v-model="filterText"
                placeholder="请输入模块/用例名称"
                clearable
                prefix-icon="Search"
                style="margin-bottom: 0px"
              />
            </div>
            <div class="head-container">
              <div class="tree-header">
                <span>接口用例管理</span>
                <el-button
                  type="primary"
                  size="small"
                  icon="Plus"
                  @click="handleAddModule"
                  v-hasPermi="['testcase:module:add']"
                  >新增模块</el-button
                >
              </div>
              <el-tree
                :data="treeData"
                :props="treeProps"
                :expand-on-click-node="false"
                :filter-node-method="filterNode"
                ref="treeRef"
                node-key="id"
                highlight-current
                default-expand-all
                @node-click="handleNodeClick"
                @node-contextmenu="handleNodeRightClick"
              >
                <template #default="{ node, data }">
                  <div class="tree-node">
                    <!-- 模块节点 -->
                    <template v-if="data.type === 'module'">
                      <span class="node-icon">
                        <el-icon color="#409eff">
                          <Folder />
                        </el-icon>
                      </span>
                      <span class="node-label">{{ data.name }}</span>
                    </template>
                    
                    <!-- API接口节点 - method在前，去掉图标 -->
                    <template v-else-if="data.type === 'api'">
                      <span 
                        :class="['method-tag', getMethodClass(data.method)]"
                      >
                        {{ data.method }}
                      </span>
                      <span class="node-label api-label">{{ data.name }}</span>
                    </template>
                    
                    <!-- Case节点 - 蓝色闪电图标，不显示method -->
                    <template v-else-if="data.type === 'case'">
                      <span class="node-icon">
                        <el-icon color="#1890ff" size="16">
                          <svg viewBox="0 0 1024 1024" width="16" height="16">
                            <path d="M569.6 243.2L256 563.2h153.6L358.4 780.8 672 460.8H518.4L569.6 243.2z" fill="currentColor"/>
                          </svg>
                        </el-icon>
                      </span>
                      <span class="node-label">{{ data.name }}</span>
                    </template>
                  </div>
                </template>
              </el-tree>
            </div>
          </el-col>
        </pane>
        
        <!-- 右侧内容区域 - 已清空，供放置其他组件 -->
        <pane size="70">
          <el-col>
            <div class="content-container">
              <!-- 这里可以放置其他组件 -->
              <div class="placeholder-content">
                <!-- 您可以在这里添加其他组件 -->
              </div>
            </div>
          </el-col>
        </pane>
      </splitpanes>
    </el-row>

    <!-- 右键菜单 -->
    <el-dropdown
      ref="contextMenuRef"
      trigger="contextmenu"
      :teleported="false"
      @visible-change="handleMenuVisibleChange"
    >
      <span></span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            v-if="contextMenuNode && contextMenuNode.type === 'module'"
            @click="handleAddTestCase"
            icon="Plus"
          >
            新增用例
          </el-dropdown-item>
          <el-dropdown-item
            v-if="contextMenuNode && contextMenuNode.type === 'module'"
            @click="handleAddSubModule"
            icon="FolderAdd"
          >
            新增子模块
          </el-dropdown-item>
          <el-dropdown-item @click="handleEdit" icon="Edit">
            编辑
          </el-dropdown-item>
          <el-dropdown-item @click="handleDelete" icon="Delete" divided>
            删除
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <!-- 编辑对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px" append-to-body>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input
            v-model="form.name"
            placeholder="请输入名称"
            maxlength="50"
          />
        </el-form-item>

      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancelForm">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="TestCaseTree">
import { Splitpanes, Pane } from "splitpanes";
import "splitpanes/dist/splitpanes.css";
import useAppStore from "@/store/modules/app";
import {
  getTestCaseTree,
  addModule,
  updateModule,
  delModule,
  addTestCase,
  updateTestCase,
  delTestCase,
} from "@/api/api_project_submodules/project_submodules";

const appStore = useAppStore();
const { proxy } = getCurrentInstance();

// 响应式数据
const treeData = ref([]);
const selectedNode = ref(null);
const contextMenuNode = ref(null);
const filterText = ref("");
const dialogVisible = ref(false);
const dialogTitle = ref("");
const loading = ref(false);

// HTTP方法枚举
const httpMethods = [
  'GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH', 
  'TRACE', 'CONNECT', 'COPY', 'LINK', 'UNLINK', 'PURGE', 
  'LOCK', 'UNLOCK', 'MKCOL', 'MOVE', 'PROPFIND', 'REPORT', 'VIEW'
];

// 树组件配置
const treeProps = {
  children: 'allChildren',
  label: 'name',
  disabled: false
};

// 表单数据
const form = ref({
  name: '',
  type: '',
  method: 'GET',
  moduleId: null,
  caseId: null,
  parentId: null
});

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '名称不能为空', trigger: 'blur' },
    { min: 1, max: 50, message: '名称长度必须介于 1 和 50 之间', trigger: 'blur' }
  ],
  method: [
    { required: true, message: '请求方法不能为空', trigger: 'change' }
  ]
};

// 处理树数据，合并模块、API接口和测试用例
const processTreeData = (data) => {
  return data.map(item => {
    const processedItem = { ...item };

    // 为每个节点添加唯一ID，根据类型区分
    if (item.type === 'module') {
      processedItem.id = `module_${item.moduleId}`;
    } else if (item.type === 'api') {
      processedItem.id = `api_${item.caseId}`;
    } else if (item.type === 'case') {
      processedItem.id = `case_${item.caseId}`;
    }

    // 合并所有子节点
    const allChildren = [];

    // 处理子模块（module类型的children）
    if (item.children && item.children.length > 0) {
      allChildren.push(...processTreeData(item.children));
    }

    // 处理测试用例（module类型下的testCases）
    if (item.testCases && item.testCases.length > 0) {
      const processedTestCases = item.testCases.map(testCase => {
        const processedTestCase = { ...testCase };

        // API类型或Case类型
        if (testCase.type === 'api') {
          processedTestCase.id = `api_${testCase.caseId}`;
        } else {
          processedTestCase.id = `case_${testCase.caseId}`;
        }

        // 递归处理子节点
        if (testCase.children && testCase.children.length > 0) {
          processedTestCase.allChildren = processTreeData(testCase.children);
        }

        return processedTestCase;
      });
      allChildren.push(...processedTestCases);
    }

    processedItem.allChildren = allChildren;
    return processedItem;
  });
};

// 获取树数据
const getTreeData = async () => {
  try {
    loading.value = true;
    const response = await getTestCaseTree();
    treeData.value = processTreeData(response.rows || []);
  } catch (error) {
    proxy.$modal.msgError('获取数据失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 过滤节点
const filterNode = (value, data) => {
  if (!value) return true;
  return data.name.indexOf(value) !== -1;
};

// 监听过滤文本变化
watch(filterText, (val) => {
  proxy.$refs.treeRef?.filter(val);
});

// 节点点击事件
const handleNodeClick = (data) => {
  selectedNode.value = data;
};

// 右键菜单事件
const handleNodeRightClick = (event, data) => {
  event.preventDefault();
  contextMenuNode.value = data;
  selectedNode.value = data;
};

// 菜单显示变化
const handleMenuVisibleChange = (visible) => {
  if (!visible) {
    contextMenuNode.value = null;
  }
};

// 获取请求方法样式类
const getMethodClass = (method) => {
  const methodMap = {
    GET: 'method-get',
    POST: 'method-post',
    PUT: 'method-put',
    DELETE: 'method-delete',
    PATCH: 'method-patch',
    OPTIONS: 'method-options',
    HEAD: 'method-head'
  };
  return methodMap[method] || 'method-default';
};

// 新增模块
const handleAddModule = () => {
  form.value = {
    name: '',
    type: '1',
    parentId: null
  };
  dialogTitle.value = '新增模块';
  dialogVisible.value = true;
};

// 新增子模块
const handleAddSubModule = () => {
  form.value = {
    name: '',
    type: 'module',
    parentId: contextMenuNode.value?.moduleId || selectedNode.value?.moduleId
  };
  dialogTitle.value = '新增子模块';
  dialogVisible.value = true;
};

// 新增测试用例
const handleAddTestCase = () => {
  form.value = {
    name: '',
    type: 'api',
    method: 'GET',
    moduleId: contextMenuNode.value?.moduleId || selectedNode.value?.moduleId
  };
  dialogTitle.value = '新增测试用例';
  dialogVisible.value = true;
};

// 编辑
const handleEdit = () => {
  const node = contextMenuNode.value || selectedNode.value;
  if (!node) return;
  
  if (node.type === 'module') {
    form.value = {
      moduleId: node.moduleId,
      name: node.name,
      type: 'module'
    };
    dialogTitle.value = '编辑模块';
  } else {
    form.value = {
      caseId: node.caseId,
      name: node.name,
      type: node.type,
      method: node.method
    };
    dialogTitle.value = '编辑测试用例';
  }
  
  dialogVisible.value = true;
};

// 删除
const handleDelete = () => {
  const node = contextMenuNode.value || selectedNode.value;
  if (!node) return;
  
  const name = node.name;
  const isModule = node.type === 'module';
  
  proxy.$modal.confirm(`是否确认删除${isModule ? '模块' : '测试用例'}"${name}"？`)
    .then(async () => {
      try {
        if (isModule) {
          await delModule(node.moduleId);
        } else {
          await delTestCase(node.caseId);
        }
        proxy.$modal.msgSuccess('删除成功');
        await getTreeData();
        selectedNode.value = null;
        contextMenuNode.value = null;
      } catch (error) {
        proxy.$modal.msgError('删除失败');
      }
    });
};

// 提交表单
const submitForm = () => {
  proxy.$refs.formRef.validate(async (valid) => {
    if (!valid) return;
    
    try {
      const isEdit = form.value.moduleId || form.value.caseId;
      
      if (form.value.type === 'module') {
        if (isEdit) {
          await updateModule(form.value);
        } else {
          await addModule(form.value);
        }
      } else {
        if (isEdit) {
          await updateTestCase(form.value);
        } else {
          await addTestCase(form.value);
        }
      }
      
      proxy.$modal.msgSuccess(`${isEdit ? '修改' : '新增'}成功`);
      dialogVisible.value = false;
      await getTreeData();
    } catch (error) {
      proxy.$modal.msgError(`${form.value.moduleId || form.value.caseId ? '修改' : '新增'}失败`);
    }
  });
};

// 取消表单
const cancelForm = () => {
  dialogVisible.value = false;
  form.value = {};
};

// 初始化
onMounted(() => {
  getTreeData();
});
</script>

<style scoped>
.testcase-tree-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.testcase-tree-container > .el-row {
  flex: 1;
  height: 100%;
}

.testcase-tree-container :deep(.splitpanes) {
  height: 100%;
}

.head-container {
  padding: 10px;
}

.tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-weight: bold;
}

.tree-node {
  display: flex;
  align-items: center;
  width: 100%;
}

.node-icon {
  margin-right: 8px;
  display: flex;
  align-items: center;
}

.node-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* API节点标签样式调整 */
.api-label {
  margin-left: 8px;
}

/* Method标签样式 - 用于API节点 */
.method-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
  margin-right: 8px;
  min-width: 40px;
  text-align: center;
}

.method-get { background-color: #67c23a; color: white; }
.method-post { background-color: #409eff; color: white; }
.method-put { background-color: #e6a23c; color: white; }
.method-delete { background-color: #f56c6c; color: white; }
.method-patch { background-color: #909399; color: white; }
.method-options { background-color: #606266; color: white; }
.method-head { background-color: #909399; color: white; }
.method-default { background-color: #dcdfe6; color: #606266; }

.content-container {
  padding: 20px;
  height: 100%;
}

.placeholder-content {
  height: 100%;
  /* 您可以在这里添加样式 */
}

:deep(.splitpanes__pane) {
  background-color: #fff;
}

:deep(.splitpanes__splitter) {
  background-color: #f0f2f5;
  border-left: 1px solid #e8eaec;
  border-right: 1px solid #e8eaec;
}
</style>