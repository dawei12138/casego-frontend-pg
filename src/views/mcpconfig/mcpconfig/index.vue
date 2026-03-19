<template>
  <div class="app-container mcpconfig-page">

    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="table-header">
          <div class="table-title">
            <span>配置列表</span>
            <el-tag size="small" type="info">{{ total }} 条</el-tag>
          </div>
          <div class="table-actions">
            <div v-show="showSearch" class="table-filter">
              <el-form
                ref="queryRef"
                :model="queryParams"
                :inline="true"
                label-width="84px"
                class="filter-form"
              >
                <el-form-item label="服务器" prop="serverName" class="filter-item">
                  <el-input
                    v-model="queryParams.serverName"
                    placeholder="作为工具名前缀"
                    clearable
                    style="width: 220px"
                    @keyup.enter="handleQuery"
                  />
                </el-form-item>
              </el-form>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </div>
            <el-button
              type="primary"
              icon="Plus"
              @click="handleAdd"
              v-hasPermi="['mcpconfig:mcpconfig:add']"
            >新增</el-button>
            <el-button
              type="success"
              icon="Edit"
              :disabled="single"
              @click="handleUpdate"
              v-hasPermi="['mcpconfig:mcpconfig:edit']"
            >修改</el-button>
            <el-button
              type="danger"
              icon="Delete"
              :disabled="multiple"
              @click="handleDelete"
              v-hasPermi="['mcpconfig:mcpconfig:remove']"
            >删除</el-button>
            <el-button
              type="warning"
              icon="Download"
              @click="handleExport"
              v-hasPermi="['mcpconfig:mcpconfig:export']"
            >导出</el-button>
            <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="mcpconfigList"
        row-key="configId"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="48" align="center" />
        <el-table-column label="服务器" prop="serverName" min-width="160" show-overflow-tooltip />
        <el-table-column label="状态" prop="enabled" width="100" align="center">
          <template #default="scope">
            <el-tag :type="isEnabled(scope.row.enabled) ? 'success' : 'info'" size="small">
              {{ isEnabled(scope.row.enabled) ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="传输类型" prop="transport" width="160" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.transport" :type="transportTagType(scope.row.transport)" size="small">
              {{ scope.row.transport }}
            </el-tag>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="命令/URL" min-width="260" show-overflow-tooltip>
          <template #default="scope">
            <span>{{ scope.row.command || scope.row.url || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="超时(ms)" prop="timeout" width="120" align="center" />
        <el-table-column label="备注" prop="remark" min-width="160" show-overflow-tooltip />
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="scope">
            <el-button
              link
              type="primary"
              icon="Edit"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['mcpconfig:mcpconfig:edit']"
            >修改</el-button>
            <el-button
              link
              type="danger"
              icon="Delete"
              @click="handleDelete(scope.row)"
              v-hasPermi="['mcpconfig:mcpconfig:remove']"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="total > 0"
        :total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </el-card>

    <el-dialog :title="title" v-model="open" width="760px" append-to-body>
      <el-form ref="mcpconfigRef" :model="form" :rules="rules" label-width="110px" class="dialog-form">
        <el-divider content-position="left">基础信息</el-divider>
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12">
            <el-form-item label="服务器" prop="serverName">
              <el-input v-model="form.serverName" placeholder="作为工具名前缀" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="启用状态" prop="enabled">
              <el-switch v-model="form.enabled" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="传输类型" prop="transport">
              <el-select v-model="form.transport" placeholder="请选择传输类型" clearable>
                <el-option
                  v-for="item in transportOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="排序号" prop="sortNo">
              <el-input-number v-model="form.sortNo" :min="0" :step="1" controls-position="right" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-collapse v-model="collapseActive" class="config-collapse" accordion>
          <el-collapse-item name="stdio">
            <template #title>stdio 配置</template>
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item label="可执行文件" prop="command">
                  <el-input v-model="form.command" placeholder="例如：/usr/bin/node" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="工作目录" prop="cwd">
                  <el-input v-model="form.cwd" placeholder="子进程工作目录" />
                </el-form-item>
              </el-col>
              <el-col :xs="24">
                <el-form-item label="命令参数" prop="args">
                  <el-input v-model="form.args" type="textarea" :rows="3" placeholder="例如：-port 8080" />
                </el-form-item>
              </el-col>
              <el-col :xs="24">
                <el-form-item label="环境变量" prop="env">
                  <el-input v-model="form.env" type="textarea" :rows="3" placeholder="JSON 格式环境变量" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-collapse-item>

          <el-collapse-item name="remote">
            <template #title>远程连接</template>
            <el-row :gutter="16">
              <el-col :xs="24">
                <el-form-item label="服务地址" prop="url">
                  <el-input v-model="form.url" placeholder="https://example.com/mcp" />
                </el-form-item>
              </el-col>
              <el-col :xs="24">
                <el-form-item label="请求头" prop="headers">
                  <el-input v-model="form.headers" type="textarea" :rows="3" placeholder="JSON 格式请求头" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-collapse-item>

          <el-collapse-item name="timeouts">
            <template #title>超时与会话</template>
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item label="请求超时(ms)" prop="timeout">
                  <el-input-number v-model="form.timeout" :min="0" controls-position="right" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="SSE 读取超时(ms)" prop="sseReadTimeout">
                  <el-input-number v-model="form.sseReadTimeout" :min="0" controls-position="right" />
                </el-form-item>
              </el-col>
              <el-col :xs="24">
                <el-form-item label="Session 参数" prop="sessionKwargs">
                  <el-input v-model="form.sessionKwargs" type="textarea" :rows="3" placeholder="JSON 格式参数" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-collapse-item>

          <el-collapse-item name="extra">
            <template #title>备注与描述</template>
            <el-row :gutter="16">
              <el-col :xs="24">
                <el-form-item label="备注" prop="remark">
                  <el-input v-model="form.remark" type="textarea" :rows="2" />
                </el-form-item>
              </el-col>
              <el-col :xs="24">
                <el-form-item label="描述" prop="description">
                  <el-input v-model="form.description" type="textarea" :rows="3" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-collapse-item>
        </el-collapse>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确定</el-button>
          <el-button @click="cancel">取消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Mcpconfig">
import { listMcpconfig, getMcpconfig, delMcpconfig, addMcpconfig, updateMcpconfig } from "@/api/mcpconfig/mcpconfig";

const { proxy } = getCurrentInstance();

const mcpconfigList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");
const collapseActive = ref("stdio");

const transportOptions = [
  { label: "stdio", value: "stdio" },
  { label: "streamable_http", value: "streamable_http" },
  { label: "sse", value: "sse" },
  { label: "websocket", value: "websocket" },
];

const transportTagMap = {
  stdio: "info",
  streamable_http: "success",
  sse: "warning",
  websocket: "danger",
};

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    serverName: null,
  },
  rules: {
    serverName: [
      { required: true, message: "服务器不能为空", trigger: "blur" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

function isEnabled(value) {
  return value === 1 || value === "1" || value === true;
}

function transportTagType(value) {
  return transportTagMap[value] || "info";
}

/** 查询MCP服务配置列表 */
function getList() {
  loading.value = true;
  listMcpconfig(queryParams.value).then(response => {
    mcpconfigList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

/** 取消按钮 */
function cancel() {
  open.value = false;
  reset();
}

/** 表单重置 */
function reset() {
  form.value = {
    configId: null,
    serverName: null,
    enabled: 1,
    transport: null,
    command: null,
    args: null,
    env: null,
    cwd: null,
    url: null,
    headers: null,
    timeout: null,
    sseReadTimeout: null,
    sessionKwargs: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    remark: null,
    description: null,
    sortNo: null,
    delFlag: null,
  };
  proxy.resetForm("mcpconfigRef");
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef");
  handleQuery();
}

/** 多选框选中数据  */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.configId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "新增 MCP 服务配置";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _configId = row.configId || ids.value;
  getMcpconfig(_configId).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改 MCP 服务配置";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["mcpconfigRef"].validate(valid => {
    if (valid) {
      if (form.value.configId != null) {
        updateMcpconfig(form.value).then(() => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addMcpconfig(form.value).then(() => {
          proxy.$modal.msgSuccess("新增成功");
          open.value = false;
          getList();
        });
      }
    }
  });
}

/** 删除按钮操作 */
function handleDelete(row) {
  const _configIds = row.configId || ids.value;
  proxy.$modal.confirm(`是否确认删除 MCP 服务配置编号为"${_configIds}"的数据项？`).then(function() {
    return delMcpconfig(_configIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('mcpconfig/mcpconfig/export', {
    ...queryParams.value
  }, `mcpconfig_${new Date().getTime()}.xlsx`);
}

getList();
</script>

<style scoped>
.mcpconfig-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-card,
.table-card {
  border-radius: 12px;
  border: 1px solid #eef2f7;
}

.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-title,
.table-title {
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
}

.filter-form {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin: 0;
}

.filter-form :deep(.el-form-item) {
  margin: 0 12px 0 0;
}

.filter-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.table-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 1 auto;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.table-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 1 auto;
  min-width: 280px;
  margin-right: auto;
  flex-wrap: wrap;
}

.table-card :deep(.el-card__header) {
  padding: 14px 20px;
  border-bottom: 1px solid #eef2f7;
  background: #f9fafb;
  border-radius: 12px 12px 0 0;
}

.filter-card :deep(.el-card__body) {
  padding: 12px 16px;
}

.table-card :deep(.el-card__body) {
  padding: 16px 20px 20px;
}

.table-card :deep(.el-table) {
  border-radius: 10px;
  overflow: hidden;
}

.table-card :deep(.el-table__header-wrapper) {
  background: #f8fafc;
}

.table-card :deep(.el-pagination) {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.config-collapse {
  margin-top: 12px;
}

.dialog-form :deep(.el-divider__text) {
  color: #6b7280;
  font-size: 13px;
}

.dialog-form :deep(.el-input-number) {
  width: 100%;
}

.text-muted {
  color: #9ca3af;
}
</style>