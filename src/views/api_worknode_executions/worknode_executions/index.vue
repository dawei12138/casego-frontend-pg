<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="执行器执行记录ID" prop="workflowExecutionId">
        <el-input
          v-model="queryParams.workflowExecutionId"
          placeholder="请输入执行器执行记录ID"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="节点ID" prop="nodeId">
        <el-input
          v-model="queryParams.nodeId"
          placeholder="请输入节点ID"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="执行状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择执行状态" clearable style="width: 240px">
          <el-option label="请选择字典生成" value="" />
        </el-select>
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
      <el-form-item label="执行时长(毫秒)" prop="duration">
        <el-input
          v-model="queryParams.duration"
          placeholder="请输入执行时长(毫秒)"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="循环索引" prop="loopIndex">
        <el-input
          v-model="queryParams.loopIndex"
          placeholder="请输入循环索引"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="条件判断结果" prop="conditionResult">
        <el-input
          v-model="queryParams.conditionResult"
          placeholder="请输入条件判断结果"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="重试次数" prop="retryCount">
        <el-input
          v-model="queryParams.retryCount"
          placeholder="请输入重试次数"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="创建时间" prop="createdAt">
        <el-date-picker
          v-model="queryParams.createdAt"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="请选择创建时间"
          clearable
          style="width: 240px"
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
          v-hasPermi="['api_worknode_executions:worknode_executions:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['api_worknode_executions:worknode_executions:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['api_worknode_executions:worknode_executions:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['api_worknode_executions:worknode_executions:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="worknode_executionsList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="节点执行记录ID" align="center" prop="nodeExecutionId" />
      <el-table-column label="执行器执行记录ID" align="center" prop="workflowExecutionId" />
      <el-table-column label="节点ID" align="center" prop="nodeId" />
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
      <el-table-column label="执行时长(毫秒)" align="center" prop="duration" />
      <el-table-column label="输入数据" align="center" prop="inputData" />
      <el-table-column label="输出数据" align="center" prop="outputData" />
      <el-table-column label="执行时上下文快照" align="center" prop="contextSnapshot" />
      <el-table-column label="循环索引" align="center" prop="loopIndex" />
      <el-table-column label="循环项数据" align="center" prop="loopItem" />
      <el-table-column label="条件判断结果" align="center" prop="conditionResult" />
      <el-table-column label="错误信息" align="center" prop="errorMessage" />
      <el-table-column label="错误详情" align="center" prop="errorDetails" />
      <el-table-column label="重试次数" align="center" prop="retryCount" />
      <el-table-column label="创建时间" align="center" prop="createdAt" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createdAt, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column label="描述" align="center" prop="description" />
      <el-table-column label="排序值" align="center" prop="sortNo" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['api_worknode_executions:worknode_executions:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['api_worknode_executions:worknode_executions:remove']">删除</el-button>
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

    <!-- 添加或修改节点执行记录对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="worknode_executionsRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item v-if="renderField(true, true)" label="执行器执行记录ID" prop="workflowExecutionId">
        <el-input v-model="form.workflowExecutionId" placeholder="请输入执行器执行记录ID" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="节点ID" prop="nodeId">
        <el-input v-model="form.nodeId" placeholder="请输入节点ID" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="执行状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio label="请选择字典生成" value="" />
        </el-radio-group>
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
      <el-form-item v-if="renderField(true, true)" label="执行时长(毫秒)" prop="duration">
        <el-input v-model="form.duration" placeholder="请输入执行时长(毫秒)" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="循环索引" prop="loopIndex">
        <el-input v-model="form.loopIndex" placeholder="请输入循环索引" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="条件判断结果" prop="conditionResult">
        <el-input v-model="form.conditionResult" placeholder="请输入条件判断结果" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="错误信息" prop="errorMessage">
        <el-input v-model="form.errorMessage" type="textarea" placeholder="请输入内容" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="重试次数" prop="retryCount">
        <el-input v-model="form.retryCount" placeholder="请输入重试次数" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="创建时间" prop="createdAt">
        <el-date-picker clearable
          v-model="form.createdAt"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="请选择创建时间">
        </el-date-picker>
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

<script setup name="Worknode_executions">
import { listWorknode_executions, getWorknode_executions, delWorknode_executions, addWorknode_executions, updateWorknode_executions } from "@/api/api_worknode_executions/worknode_executions";

const { proxy } = getCurrentInstance();

const worknode_executionsList = ref([]);
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
    workflowExecutionId: null,
    nodeId: null,
    status: null,
    startTime: null,
    endTime: null,
    duration: null,
    inputData: null,
    outputData: null,
    contextSnapshot: null,
    loopIndex: null,
    loopItem: null,
    conditionResult: null,
    errorMessage: null,
    errorDetails: null,
    retryCount: null,
    createdAt: null,
    description: null,
    sortNo: null,
  },
  rules: {
    createdAt: [
      { required: true, message: "创建时间不能为空", trigger: "blur" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询节点执行记录列表 */
function getList() {
  loading.value = true;
  listWorknode_executions(queryParams.value).then(response => {
    worknode_executionsList.value = response.rows;
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
    nodeExecutionId: null,
    workflowExecutionId: null,
    nodeId: null,
    status: null,
    startTime: null,
    endTime: null,
    duration: null,
    inputData: null,
    outputData: null,
    contextSnapshot: null,
    loopIndex: null,
    loopItem: null,
    conditionResult: null,
    errorMessage: null,
    errorDetails: null,
    retryCount: null,
    createdAt: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    remark: null,
    description: null,
    sortNo: null,
    delFlag: null,
  };
  proxy.resetForm("worknode_executionsRef");
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
  ids.value = selection.map(item => item.nodeExecutionId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加节点执行记录";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _nodeExecutionId = row.nodeExecutionId || ids.value;
  getWorknode_executions(_nodeExecutionId).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改节点执行记录";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["worknode_executionsRef"].validate(valid => {
    if (valid) {
      if (form.value.nodeExecutionId != null) {
        updateWorknode_executions(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addWorknode_executions(form.value).then(response => {
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
  const _nodeExecutionIds = row.nodeExecutionId || ids.value;
  proxy.$modal.confirm('是否确认删除节点执行记录编号为"' + _nodeExecutionIds + '"的数据项？').then(function() {
    return delWorknode_executions(_nodeExecutionIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}


/** 导出按钮操作 */
function handleExport() {
  proxy.download('api_worknode_executions/worknode_executions/export', {
    ...queryParams.value
  }, `worknode_executions_${new Date().getTime()}.xlsx`);
}

/** 是否渲染字段 */
function renderField(insert, edit) {
  return form.value.nodeExecutionId == null ? insert : edit;
}

getList();
</script>