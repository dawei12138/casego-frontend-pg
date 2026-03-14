<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="所属执行器ID" prop="workflowId">
        <el-input
          v-model="queryParams.workflowId"
          placeholder="请输入所属执行器ID"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="父节点ID" prop="parentId">
        <el-input
          v-model="queryParams.parentId"
          placeholder="请输入父节点ID"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="节点名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入节点名称"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="节点类型" prop="type">
        <el-input
          v-model="queryParams.type"
          placeholder="请输入节点类型"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="是否启用执行" prop="isRun">
        <el-input
          v-model="queryParams.isRun"
          placeholder="请输入是否启用执行"
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
          v-hasPermi="['api_worknodes:worknodes:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['api_worknodes:worknodes:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['api_worknodes:worknodes:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['api_worknodes:worknodes:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="worknodesList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="节点ID" align="center" prop="nodeId" />
      <el-table-column label="所属执行器ID" align="center" prop="workflowId" />
      <el-table-column label="父节点ID" align="center" prop="parentId" />
      <el-table-column label="节点名称" align="center" prop="name" />
      <el-table-column label="节点类型" align="center" prop="type" />
      <el-table-column label="是否启用执行" align="center" prop="isRun" />
      <el-table-column label="子结点列表" align="center" prop="childrenIds" />
      <el-table-column label="节点配置信息" align="center" prop="config" />
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column label="描述" align="center" prop="description" />
      <el-table-column label="排序值" align="center" prop="sortNo" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['api_worknodes:worknodes:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['api_worknodes:worknodes:remove']">删除</el-button>
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

    <!-- 添加或修改执行器节点对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="worknodesRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item v-if="renderField(true, true)" label="所属执行器ID" prop="workflowId">
        <el-input v-model="form.workflowId" placeholder="请输入所属执行器ID" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="父节点ID" prop="parentId">
        <el-input v-model="form.parentId" placeholder="请输入父节点ID" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="节点名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入节点名称" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="节点类型" prop="type">
        <el-input v-model="form.type" placeholder="请输入节点类型" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="是否启用执行" prop="isRun">
        <el-input v-model="form.isRun" placeholder="请输入是否启用执行" />
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

<script setup name="Worknodes">
import { listWorknodes, getWorknodes, delWorknodes, addWorknodes, updateWorknodes } from "@/api/api_worknodes/worknodes";

const { proxy } = getCurrentInstance();

const worknodesList = ref([]);
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
    parentId: null,
    name: null,
    type: null,
    isRun: null,
    childrenIds: null,
    // config: null,
    description: null,
    sortNo: null,
  },
  rules: {
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询执行器节点列表 */
function getList() {
  loading.value = true;
  listWorknodes(queryParams.value).then(response => {
    worknodesList.value = response.rows;
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
    nodeId: null,
    workflowId: null,
    parentId: null,
    name: null,
    type: null,
    isRun: null,
    childrenIds: null,
    //config: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    remark: null,
    description: null,
    sortNo: null,
    delFlag: null,
  };
  proxy.resetForm("worknodesRef");
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
  ids.value = selection.map(item => item.nodeId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加执行器节点";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _nodeId = row.nodeId || ids.value;
  getWorknodes(_nodeId).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改执行器节点";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["worknodesRef"].validate(valid => {
    if (valid) {
      if (form.value.nodeId != null) {
        updateWorknodes(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addWorknodes(form.value).then(response => {
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
  const _nodeIds = row.nodeId || ids.value;
  proxy.$modal.confirm('是否确认删除执行器节点编号为"' + _nodeIds + '"的数据项？').then(function() {
    return delWorknodes(_nodeIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}


/** 导出按钮操作 */
function handleExport() {
  proxy.download('api_worknodes/worknodes/export', {
    ...queryParams.value
  }, `worknodes_${new Date().getTime()}.xlsx`);
}

/** 是否渲染字段 */
function renderField(insert, edit) {
  return form.value.nodeId == null ? insert : edit;
}

getList();
</script>