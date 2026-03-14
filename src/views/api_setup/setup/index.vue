<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="操作名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入操作名称"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="关联的测试用例ID" prop="caseId">
        <el-input
          v-model="queryParams.caseId"
          placeholder="请输入关联的测试用例ID"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="操作类型 (db_connection, execute_script, wait_time)" prop="setupType">
        <el-select v-model="queryParams.setupType" placeholder="请选择操作类型 (db_connection, execute_script, wait_time)" clearable style="width: 240px">
          <el-option label="请选择字典生成" value="" />
        </el-select>
      </el-form-item>
      <el-form-item label="数据库连接ID" prop="dbConnectionId">
        <el-input
          v-model="queryParams.dbConnectionId"
          placeholder="请输入数据库连接ID"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="变量名称" prop="variableName">
        <el-input
          v-model="queryParams.variableName"
          placeholder="请输入变量名称"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="等待时间" prop="waitTime">
        <el-input
          v-model="queryParams.waitTime"
          placeholder="请输入等待时间"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="提取索引" prop="extractIndex">
        <el-input
          v-model="queryParams.extractIndex"
          placeholder="请输入提取索引"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="是否执行提取索引操作" prop="extractIndexIsRun">
        <el-input
          v-model="queryParams.extractIndexIsRun"
          placeholder="请输入是否执行提取索引操作"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="是否执行该前置操作" prop="isRun">
        <el-input
          v-model="queryParams.isRun"
          placeholder="请输入是否执行该前置操作"
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
          v-hasPermi="['api_setup:setup:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['api_setup:setup:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['api_setup:setup:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['api_setup:setup:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="setupList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="操作ID" align="center" prop="setupId" />
      <el-table-column label="操作名称" align="center" prop="name" />
      <el-table-column label="关联的测试用例ID" align="center" prop="caseId" />
      <el-table-column label="操作类型 (db_connection, execute_script, wait_time)" align="center" prop="setupType" />
      <el-table-column label="数据库连接ID" align="center" prop="dbConnectionId" />
      <el-table-column label="脚本语句" align="center" prop="script" />
      <el-table-column label="jsonpath提取表达式" align="center" prop="jsonpath" />
      <el-table-column label="变量名称" align="center" prop="variableName" />
      <el-table-column label="等待时间" align="center" prop="waitTime" />
      <el-table-column label="提取索引" align="center" prop="extractIndex" />
      <el-table-column label="是否执行提取索引操作" align="center" prop="extractIndexIsRun" />
      <el-table-column label="是否执行该前置操作" align="center" prop="isRun" />
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column label="描述" align="center" prop="description" />
      <el-table-column label="排序值" align="center" prop="sortNo" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['api_setup:setup:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['api_setup:setup:remove']">删除</el-button>
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

    <!-- 添加或修改接口前置操作对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="setupRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item v-if="renderField(true, true)" label="操作名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入操作名称" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="关联的测试用例ID" prop="caseId">
        <el-input v-model="form.caseId" placeholder="请输入关联的测试用例ID" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="操作类型 (db_connection, execute_script, wait_time)" prop="setupType">
        <el-select v-model="form.setupType" placeholder="请选择操作类型 (db_connection, execute_script, wait_time)">
          <el-option label="请选择字典生成" value="" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="数据库连接ID" prop="dbConnectionId">
        <el-input v-model="form.dbConnectionId" placeholder="请输入数据库连接ID" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="脚本语句" prop="script">
        <el-input v-model="form.script" type="textarea" placeholder="请输入内容" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="jsonpath提取表达式" prop="jsonpath">
        <el-input v-model="form.jsonpath" type="textarea" placeholder="请输入内容" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="变量名称" prop="variableName">
        <el-input v-model="form.variableName" placeholder="请输入变量名称" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="等待时间" prop="waitTime">
        <el-input v-model="form.waitTime" placeholder="请输入等待时间" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="提取索引" prop="extractIndex">
        <el-input v-model="form.extractIndex" placeholder="请输入提取索引" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="是否执行提取索引操作" prop="extractIndexIsRun">
        <el-input v-model="form.extractIndexIsRun" placeholder="请输入是否执行提取索引操作" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="是否执行该前置操作" prop="isRun">
        <el-input v-model="form.isRun" placeholder="请输入是否执行该前置操作" />
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
      <el-form-item v-if="renderField(true, false)" label="删除标志 0正常 1删除 2代表删除" prop="delFlag">
        <el-input v-model="form.delFlag" placeholder="请输入删除标志 0正常 1删除 2代表删除" />
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

<script setup name="Setup">
import { listSetup, getSetup, delSetup, addSetup, updateSetup } from "@/api/api_setup/setup";

const { proxy } = getCurrentInstance();

const setupList = ref([]);
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
    name: null,
    caseId: null,
    setupType: null,
    dbConnectionId: null,
    script: null,
    jsonpath: null,
    variableName: null,
    waitTime: null,
    extractIndex: null,
    extractIndexIsRun: null,
    isRun: null,
    description: null,
    sortNo: null,
  },
  rules: {
    caseId: [
      { required: true, message: "关联的测试用例ID不能为空", trigger: "blur" }
    ],
    setupType: [
      { required: true, message: "操作类型 (db_connection, execute_script, wait_time)不能为空", trigger: "change" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询接口前置操作列表 */
function getList() {
  loading.value = true;
  listSetup(queryParams.value).then(response => {
    setupList.value = response.rows;
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
    setupId: null,
    name: null,
    caseId: null,
    setupType: null,
    dbConnectionId: null,
    script: null,
    jsonpath: null,
    variableName: null,
    waitTime: null,
    extractIndex: null,
    extractIndexIsRun: null,
    isRun: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    remark: null,
    description: null,
    sortNo: null,
    delFlag: null,
  };
  proxy.resetForm("setupRef");
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
  ids.value = selection.map(item => item.setupId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加接口前置操作";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _setupId = row.setupId || ids.value;
  getSetup(_setupId).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改接口前置操作";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["setupRef"].validate(valid => {
    if (valid) {
      if (form.value.setupId != null) {
        updateSetup(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addSetup(form.value).then(response => {
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
  const _setupIds = row.setupId || ids.value;
  proxy.$modal.confirm('是否确认删除接口前置操作编号为"' + _setupIds + '"的数据项？').then(function() {
    return delSetup(_setupIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}


/** 导出按钮操作 */
function handleExport() {
  proxy.download('api_setup/setup/export', {
    ...queryParams.value
  }, `setup_${new Date().getTime()}.xlsx`);
}

/** 是否渲染字段 */
function renderField(insert, edit) {
  return form.value.setupId == null ? insert : edit;
}

getList();
</script>