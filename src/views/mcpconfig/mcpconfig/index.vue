<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="服务器逻辑名称，作为工具名前缀" prop="serverName">
        <el-input
          v-model="queryParams.serverName"
          placeholder="请输入服务器逻辑名称，作为工具名前缀"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['mcpconfig:mcpconfig:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['mcpconfig:mcpconfig:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['mcpconfig:mcpconfig:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['mcpconfig:mcpconfig:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="mcpconfigList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="配置唯一标识符(UUID)" align="center" prop="configId" />
      <el-table-column label="服务器逻辑名称，作为工具名前缀" align="center" prop="serverName" />
      <el-table-column label="是否启用此服务器" align="center" prop="enabled" />
      <el-table-column label="传输类型: stdio / streamable_http / sse / websocket" align="center" prop="transport" />
      <el-table-column label="stdio模式: 可执行文件路径" align="center" prop="command" />
      <el-table-column label="stdio模式: 命令行参数列表，" align="center" prop="args" />
      <el-table-column label="stdio模式: 子进程环境变量字典" align="center" prop="env" />
      <el-table-column label="stdio模式: 子进程工作目录" align="center" prop="cwd" />
      <el-table-column label="streamable_http/sse/websocket模式: 远程服务器URL" align="center" prop="url" />
      <el-table-column label="streamable_http/sse模式: 附加HTTP请求头" align="center" prop="headers" />
      <el-table-column label="请求超时时间" align="center" prop="timeout" />
      <el-table-column label="SSE流读取超时时间" align="center" prop="sseReadTimeout" />
      <el-table-column label="传递给MCP ClientSession的额外参数" align="center" prop="sessionKwargs" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['mcpconfig:mcpconfig:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['mcpconfig:mcpconfig:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改MCP服务器配置对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="mcpconfigRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item v-if="renderField(true, true)" label="服务器逻辑名称，作为工具名前缀" prop="serverName">
        <el-input v-model="form.serverName" placeholder="请输入服务器逻辑名称，作为工具名前缀" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="传输类型: stdio / streamable_http / sse / websocket" prop="transport">
        <el-input v-model="form.transport" placeholder="请输入传输类型: stdio / streamable_http / sse / websocket" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="stdio模式: 可执行文件路径" prop="command">
        <el-input v-model="form.command" placeholder="请输入stdio模式: 可执行文件路径" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="stdio模式: 子进程工作目录" prop="cwd">
        <el-input v-model="form.cwd" placeholder="请输入stdio模式: 子进程工作目录" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="streamable_http/sse/websocket模式: 远程服务器URL" prop="url">
        <el-input v-model="form.url" placeholder="请输入streamable_http/sse/websocket模式: 远程服务器URL" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="请求超时时间" prop="timeout">
        <el-input v-model="form.timeout" placeholder="请输入请求超时时间" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="SSE流读取超时时间" prop="sseReadTimeout">
        <el-input v-model="form.sseReadTimeout" placeholder="请输入SSE流读取超时时间" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="" prop="remark">
        <el-input v-model="form.remark" placeholder="请输入" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="" prop="description">
        <el-input v-model="form.description" placeholder="请输入" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="" prop="sortNo">
        <el-input v-model="form.sortNo" placeholder="请输入" />
      </el-form-item>
      <el-form-item v-if="renderField(true, false)" label="" prop="delFlag">
        <el-input v-model="form.delFlag" placeholder="请输入" />
      </el-form-item>

      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
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

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    serverName: null,
  },
  rules: {
    serverName: [
      { required: true, message: "服务器逻辑名称，作为工具名前缀不能为空", trigger: "blur" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询MCP服务器配置列表 */
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
    enabled: null,
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
  title.value = "添加MCP服务器配置";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _configId = row.configId || ids.value;
  getMcpconfig(_configId).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改MCP服务器配置";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["mcpconfigRef"].validate(valid => {
    if (valid) {
      if (form.value.configId != null) {
        updateMcpconfig(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addMcpconfig(form.value).then(response => {
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
  proxy.$modal.confirm('是否确认删除MCP服务器配置编号为"' + _configIds + '"的数据项？').then(function() {
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

/** 是否渲染字段 */
function renderField(insert, edit) {
  return form.value.configId == null ? insert : edit;
}

getList();
</script>