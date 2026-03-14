<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="关联的测试用例ID" prop="caseId">
        <el-input
          v-model="queryParams.caseId"
          placeholder="请输入关联的测试用例ID"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="JSONPath表达式OR提取方法" prop="jsonpath">
        <el-input
          v-model="queryParams.jsonpath"
          placeholder="请输入JSONPath表达式OR提取方法"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="JSONPath提取索引" prop="jsonpathIndex">
        <el-input
          v-model="queryParams.jsonpathIndex"
          placeholder="请输入JSONPath提取索引"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="断言 (==, !=, >等)" prop="assertionMethod">
        <el-input
          v-model="queryParams.assertionMethod"
          placeholder="请输入断言 (==, !=, >等)"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="预期值" prop="value">
        <el-input
          v-model="queryParams.value"
          placeholder="请输入预期值"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="断言类型 (可选)" prop="assertType">
        <el-input
          v-model="queryParams.assertType"
          placeholder="请输入断言类型 (可选)"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="是否执行该断言" prop="isRun">
        <el-input
          v-model="queryParams.isRun"
          placeholder="请输入是否执行该断言"
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
          v-hasPermi="['api_assertions:assertions:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['api_assertions:assertions:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['api_assertions:assertions:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['api_assertions:assertions:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="assertionsList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="断言ID" align="center" prop="assertionId" />
      <el-table-column label="关联的测试用例ID" align="center" prop="caseId" />
      <el-table-column label="JSONPath表达式OR提取方法" align="center" prop="jsonpath" />
      <el-table-column label="JSONPath提取索引" align="center" prop="jsonpathIndex" />
      <el-table-column label="断言 (==, !=, >等)" align="center" prop="assertionMethod" />
      <el-table-column label="预期值" align="center" prop="value" />
      <el-table-column label="断言类型 (可选)" align="center" prop="assertType" />
      <el-table-column label="是否执行该断言" align="center" prop="isRun" />
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column label="描述" align="center" prop="description" />
      <el-table-column label="排序值" align="center" prop="sortNo" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['api_assertions:assertions:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['api_assertions:assertions:remove']">删除</el-button>
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

    <!-- 添加或修改接口断言对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="assertionsRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item v-if="renderField(true, true)" label="关联的测试用例ID" prop="caseId">
        <el-input v-model="form.caseId" placeholder="请输入关联的测试用例ID" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="JSONPath表达式OR提取方法" prop="jsonpath">
        <el-input v-model="form.jsonpath" placeholder="请输入JSONPath表达式OR提取方法" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="JSONPath提取索引" prop="jsonpathIndex">
        <el-input v-model="form.jsonpathIndex" placeholder="请输入JSONPath提取索引" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="断言 (==, !=, >等)" prop="assertionMethod">
        <el-input v-model="form.assertionMethod" placeholder="请输入断言 (==, !=, >等)" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="预期值" prop="value">
        <el-input v-model="form.value" placeholder="请输入预期值" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="断言类型 (可选)" prop="assertType">
        <el-input v-model="form.assertType" placeholder="请输入断言类型 (可选)" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="是否执行该断言" prop="isRun">
        <el-input v-model="form.isRun" placeholder="请输入是否执行该断言" />
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

<script setup name="Assertions">
import { listAssertions, getAssertions, delAssertions, addAssertions, updateAssertions } from "@/api/api_assertions/assertions";

const { proxy } = getCurrentInstance();

const assertionsList = ref([]);
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
    caseId: null,
    jsonpath: null,
    jsonpathIndex: null,
    assertionMethod: null,
    value: null,
    assertType: null,
    isRun: null,
    description: null,
    sortNo: null,
  },
  rules: {
    caseId: [
      { required: true, message: "关联的测试用例ID不能为空", trigger: "blur" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询接口断言列表 */
function getList() {
  loading.value = true;
  listAssertions(queryParams.value).then(response => {
    assertionsList.value = response.rows;
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
    assertionId: null,
    caseId: null,
    jsonpath: null,
    jsonpathIndex: null,
    assertionMethod: null,
    value: null,
    assertType: null,
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
  proxy.resetForm("assertionsRef");
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
  ids.value = selection.map(item => item.assertionId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加接口断言";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _assertionId = row.assertionId || ids.value;
  getAssertions(_assertionId).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改接口断言";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["assertionsRef"].validate(valid => {
    if (valid) {
      if (form.value.assertionId != null) {
        updateAssertions(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addAssertions(form.value).then(response => {
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
  const _assertionIds = row.assertionId || ids.value;
  proxy.$modal.confirm('是否确认删除接口断言编号为"' + _assertionIds + '"的数据项？').then(function() {
    return delAssertions(_assertionIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}


/** 导出按钮操作 */
function handleExport() {
  proxy.download('api_assertions/assertions/export', {
    ...queryParams.value
  }, `assertions_${new Date().getTime()}.xlsx`);
}

/** 是否渲染字段 */
function renderField(insert, edit) {
  return form.value.assertionId == null ? insert : edit;
}

getList();
</script>