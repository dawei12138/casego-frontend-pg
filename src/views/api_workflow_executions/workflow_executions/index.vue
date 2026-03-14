<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="执行器ID" prop="workflowId">
        <el-input
          v-model="queryParams.workflowId"
          placeholder="请输入执行器ID"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="执行名称" prop="workflowName">
        <el-input
          v-model="queryParams.workflowName"
          placeholder="请输入执行名称"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="开始时间" prop="startTime">
        <el-date-picker
          v-model="queryParams.startTime"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="请选择开始时间"
          clearable
          style="width: 240px"
        />
      </el-form-item>
      <el-form-item label="结束时间" prop="endTime">
        <el-date-picker
          v-model="queryParams.endTime"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="请选择结束时间"
          clearable
          style="width: 240px"
        />
      </el-form-item>
      <el-form-item label="执行时长(秒)" prop="duration">
        <el-input
          v-model="queryParams.duration"
          placeholder="请输入执行时长(秒)"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="总节点数" prop="totalNodes">
        <el-input
          v-model="queryParams.totalNodes"
          placeholder="请输入总节点数"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="成功节点数" prop="successNodes">
        <el-input
          v-model="queryParams.successNodes"
          placeholder="请输入成功节点数"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="失败节点数" prop="failedNodes">
        <el-input
          v-model="queryParams.failedNodes"
          placeholder="请输入失败节点数"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="跳过节点数" prop="skippedNodes">
        <el-input
          v-model="queryParams.skippedNodes"
          placeholder="请输入跳过节点数"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input
          v-model="queryParams.description"
          placeholder="请输入描述"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="排序值" prop="sortNo">
        <el-input
          v-model="queryParams.sortNo"
          placeholder="请输入排序值"
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
          v-hasPermi="['api_workflow_executions:workflow_executions:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['api_workflow_executions:workflow_executions:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['api_workflow_executions:workflow_executions:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['api_workflow_executions:workflow_executions:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="workflow_executionsList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="执行记录ID" align="center" prop="workflowExecutionId" />
      <el-table-column label="执行器ID" align="center" prop="workflowId" />
      <el-table-column label="执行名称" align="center" prop="workflowName" />
      <el-table-column label="执行状态" align="center" prop="status" />
      <el-table-column label="开始时间" align="center" prop="startTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.startTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="结束时间" align="center" prop="endTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.endTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="执行时长(秒)" align="center" prop="duration" />
      <el-table-column label="输入数据" align="center" prop="inputData" />
      <el-table-column label="输出数据" align="center" prop="outputData" />
      <el-table-column label="上下文数据" align="center" prop="contextData" />
      <el-table-column label="总节点数" align="center" prop="totalNodes" />
      <el-table-column label="成功节点数" align="center" prop="successNodes" />
      <el-table-column label="失败节点数" align="center" prop="failedNodes" />
      <el-table-column label="跳过节点数" align="center" prop="skippedNodes" />
      <el-table-column label="错误信息" align="center" prop="errorMessage" />
      <el-table-column label="错误详情" align="center" prop="errorDetails" />
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column label="描述" align="center" prop="description" />
      <el-table-column label="排序值" align="center" prop="sortNo" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['api_workflow_executions:workflow_executions:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['api_workflow_executions:workflow_executions:remove']">删除</el-button>
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

    <!-- 添加或修改执行器执行记录对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="workflow_executionsRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item v-if="renderField(true, true)" label="执行器ID" prop="workflowId">
        <el-input v-model="form.workflowId" placeholder="请输入执行器ID" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="执行名称" prop="workflowName">
        <el-input v-model="form.workflowName" placeholder="请输入执行名称" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="执行状态" prop="status">
        <el-input v-model="form.status" type="textarea" placeholder="请输入内容" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="开始时间" prop="startTime">
        <el-date-picker clearable
          v-model="form.startTime"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="请选择开始时间">
        </el-date-picker>
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="结束时间" prop="endTime">
        <el-date-picker clearable
          v-model="form.endTime"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="请选择结束时间">
        </el-date-picker>
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="执行时长(秒)" prop="duration">
        <el-input v-model="form.duration" placeholder="请输入执行时长(秒)" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="总节点数" prop="totalNodes">
        <el-input v-model="form.totalNodes" placeholder="请输入总节点数" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="成功节点数" prop="successNodes">
        <el-input v-model="form.successNodes" placeholder="请输入成功节点数" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="失败节点数" prop="failedNodes">
        <el-input v-model="form.failedNodes" placeholder="请输入失败节点数" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="跳过节点数" prop="skippedNodes">
        <el-input v-model="form.skippedNodes" placeholder="请输入跳过节点数" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="错误信息" prop="errorMessage">
        <el-input v-model="form.errorMessage" type="textarea" placeholder="请输入内容" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="错误详情" prop="errorDetails">
        <el-input v-model="form.errorDetails" type="textarea" placeholder="请输入内容" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="备注" prop="remark">
        <el-input v-model="form.remark" placeholder="请输入备注" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="描述" prop="description">
        <el-input v-model="form.description" placeholder="请输入描述" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="排序值" prop="sortNo">
        <el-input v-model="form.sortNo" placeholder="请输入排序值" />
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

<script setup name="Workflow_executions">
import { listWorkflow_executions, getWorkflow_executions, delWorkflow_executions, addWorkflow_executions, updateWorkflow_executions } from "@/api/api_workflow_executions/workflow_executions";

const { proxy } = getCurrentInstance();

const workflow_executionsList = ref([]);
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
    workflowId: null,
    workflowName: null,
    status: null,
    startTime: null,
    endTime: null,
    duration: null,
    inputData: null,
    outputData: null,
    contextData: null,
    totalNodes: null,
    successNodes: null,
    failedNodes: null,
    skippedNodes: null,
    errorMessage: null,
    errorDetails: null,
    description: null,
    sortNo: null,
  },
  rules: {
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询执行器执行记录列表 */
function getList() {
  loading.value = true;
  listWorkflow_executions(queryParams.value).then(response => {
    workflow_executionsList.value = response.rows;
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
    workflowExecutionId: null,
    workflowId: null,
    workflowName: null,
    status: null,
    startTime: null,
    endTime: null,
    duration: null,
    inputData: null,
    outputData: null,
    contextData: null,
    totalNodes: null,
    successNodes: null,
    failedNodes: null,
    skippedNodes: null,
    errorMessage: null,
    errorDetails: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    remark: null,
    description: null,
    sortNo: null,
    delFlag: null,
  };
  proxy.resetForm("workflow_executionsRef");
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
  ids.value = selection.map(item => item.workflowExecutionId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加执行器执行记录";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _workflowExecutionId = row.workflowExecutionId || ids.value;
  getWorkflow_executions(_workflowExecutionId).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改执行器执行记录";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["workflow_executionsRef"].validate(valid => {
    if (valid) {
      if (form.value.workflowExecutionId != null) {
        updateWorkflow_executions(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addWorkflow_executions(form.value).then(response => {
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
  const _workflowExecutionIds = row.workflowExecutionId || ids.value;
  proxy.$modal.confirm('是否确认删除执行器执行记录编号为"' + _workflowExecutionIds + '"的数据项？').then(function() {
    return delWorkflow_executions(_workflowExecutionIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}


/** 导出按钮操作 */
function handleExport() {
  proxy.download('api_workflow_executions/workflow_executions/export', {
    ...queryParams.value
  }, `workflow_executions_${new Date().getTime()}.xlsx`);
}

/** 是否渲染字段 */
function renderField(insert, edit) {
  return form.value.workflowExecutionId == null ? insert : edit;
}

getList();
</script>