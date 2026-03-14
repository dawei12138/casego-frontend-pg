<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="用例名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入用例名称"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="设计者" prop="designer">
        <el-input
          v-model="queryParams.designer"
          placeholder="请输入设计者"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="所属项目ID" prop="projectId">
        <el-input
          v-model="queryParams.projectId"
          placeholder="请输入所属项目ID"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="所属模块ID" prop="moduleId">
        <el-input
          v-model="queryParams.moduleId"
          placeholder="请输入所属模块ID"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="版本号" prop="version">
        <el-input
          v-model="queryParams.version"
          placeholder="请输入版本号"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="最后编辑时间" prop="editTime">
        <el-date-picker
          v-model="queryParams.editTime"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="请选择最后编辑时间"
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
          v-hasPermi="['app:cases:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['app:cases:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['app:cases:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['app:cases:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="casesList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="主键ID" align="center" prop="id" />
      <el-table-column label="用例名称" align="center" prop="name" />
      <el-table-column label="用例描述" align="center" prop="des" />
      <el-table-column label="设计者" align="center" prop="designer" />
      <el-table-column label="平台类型" align="center" prop="platform" />
      <el-table-column label="所属项目ID" align="center" prop="projectId" />
      <el-table-column label="所属模块ID" align="center" prop="moduleId" />
      <el-table-column label="版本号" align="center" prop="version" />
      <el-table-column label="最后编辑时间" align="center" prop="editTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.editTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column label="描述" align="center" prop="description" />
      <el-table-column label="排序值" align="center" prop="sortNo" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['app:cases:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['app:cases:remove']">删除</el-button>
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

    <!-- 添加或修改测试用例对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="casesRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item v-if="renderField(true, true)" label="用例名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入用例名称" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="用例描述" prop="des">
        <el-input v-model="form.des" type="textarea" placeholder="请输入内容" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="设计者" prop="designer">
        <el-input v-model="form.designer" placeholder="请输入设计者" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="所属项目ID" prop="projectId">
        <el-input v-model="form.projectId" placeholder="请输入所属项目ID" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="所属模块ID" prop="moduleId">
        <el-input v-model="form.moduleId" placeholder="请输入所属模块ID" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="版本号" prop="version">
        <el-input v-model="form.version" placeholder="请输入版本号" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="最后编辑时间" prop="editTime">
        <el-date-picker clearable
          v-model="form.editTime"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="请选择最后编辑时间">
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

<script setup name="Cases">
import { listCases, getCases, delCases, addCases, updateCases } from "@/api/app/cases";

const { proxy } = getCurrentInstance();

const casesList = ref([]);
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
    des: null,
    designer: null,
    platform: null,
    projectId: null,
    moduleId: null,
    version: null,
    editTime: null,
    description: null,
    sortNo: null,
  },
  rules: {
    name: [
      { required: true, message: "用例名称不能为空", trigger: "blur" }
    ],
    platform: [
      { required: true, message: "平台类型不能为空", trigger: "blur" }
    ],
    projectId: [
      { required: true, message: "所属项目ID不能为空", trigger: "blur" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询测试用例列表 */
function getList() {
  loading.value = true;
  listCases(queryParams.value).then(response => {
    casesList.value = response.rows;
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
    id: null,
    name: null,
    des: null,
    designer: null,
    platform: null,
    projectId: null,
    moduleId: null,
    version: null,
    editTime: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    remark: null,
    description: null,
    sortNo: null,
    delFlag: null,
  };
  proxy.resetForm("casesRef");
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
  ids.value = selection.map(item => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加测试用例";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _id = row.id || ids.value;
  getCases(_id).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改测试用例";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["casesRef"].validate(valid => {
    if (valid) {
      if (form.value.id != null) {
        updateCases(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addCases(form.value).then(response => {
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
  const _ids = row.id || ids.value;
  proxy.$modal.confirm('是否确认删除测试用例编号为"' + _ids + '"的数据项？').then(function() {
    return delCases(_ids);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}


/** 导出按钮操作 */
function handleExport() {
  proxy.download('app/cases/export', {
    ...queryParams.value
  }, `cases_${new Date().getTime()}.xlsx`);
}

/** 是否渲染字段 */
function renderField(insert, edit) {
  return form.value.id == null ? insert : edit;
}

getList();
</script>