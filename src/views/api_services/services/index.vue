<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="服务名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入服务名称"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="服务地址" prop="url">
        <el-input
          v-model="queryParams.url"
          placeholder="请输入服务地址"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="所属环境ID" prop="environmentId">
        <el-input
          v-model="queryParams.environmentId"
          placeholder="请输入所属环境ID"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="是否为默认服务" prop="isDefault">
        <el-select v-model="queryParams.isDefault" placeholder="请选择是否为默认服务" clearable style="width: 240px">
          <el-option
            v-for="dict in user_is_defalut"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
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
          v-hasPermi="['api_services:services:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['api_services:services:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['api_services:services:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['api_services:services:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="servicesList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="服务ID" align="center" prop="id" />
      <el-table-column label="服务名称" align="center" prop="name" />
      <el-table-column label="服务地址" align="center" prop="url" />
      <el-table-column label="所属环境ID" align="center" prop="environmentId" />
      <el-table-column label="是否为默认服务" align="center" prop="isDefault">
        <template #default="scope">
            <dict-tag :options="user_is_defalut" :value="scope.row.isDefault"/>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['api_services:services:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['api_services:services:remove']">删除</el-button>
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

    <!-- 添加或修改环境服务地址对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="servicesRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item v-if="renderField(true, true)" label="服务名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入服务名称" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="服务地址" prop="url">
        <el-input v-model="form.url" placeholder="请输入服务地址" />
      </el-form-item>
      <el-form-item v-if="renderField(false, false)" label="所属环境ID" prop="environmentId">
        <el-input v-model="form.environmentId" placeholder="请输入所属环境ID" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="是否为默认服务" prop="isDefault">
        <el-select v-model="form.isDefault" placeholder="请选择是否为默认服务">
          <el-option
            v-for="dict in user_is_defalut"
            :key="dict.value"
            :label="dict.label"
            :value="parseInt(dict.value)"
          ></el-option>
        </el-select>
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

<script setup name="Services">
import { listServices, getServices, delServices, addServices, updateServices } from "@/api/api_services/services";

const { proxy } = getCurrentInstance();
const { user_is_defalut } = proxy.useDict('user_is_defalut');

const servicesList = ref([]);
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
    url: null,
    environmentId: null,
    isDefault: null,
  },
  rules: {
    name: [
      { required: true, message: "服务名称不能为空", trigger: "blur" }
    ],
    url: [
      { required: true, message: "服务地址不能为空", trigger: "blur" }
    ],

    isDefault: [
      { required: true, message: "是否为默认服务不能为空", trigger: "change" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询环境服务地址列表 */
function getList() {
  loading.value = true;
  listServices(queryParams.value).then(response => {
    servicesList.value = response.rows;
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
    url: null,
    environmentId: null,
    isDefault: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    remark: null,
    description: null,
    sortNo: null,
    delFlag: null,
  };
  proxy.resetForm("servicesRef");
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
  title.value = "添加环境服务地址";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _id = row.id || ids.value;
  getServices(_id).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改环境服务地址";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["servicesRef"].validate(valid => {
    if (valid) {
      if (form.value.id != null) {
        updateServices(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addServices(form.value).then(response => {
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
  proxy.$modal.confirm('是否确认删除环境服务地址编号为"' + _ids + '"的数据项？').then(function() {
    return delServices(_ids);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}


/** 导出按钮操作 */
function handleExport() {
  proxy.download('api_services/services/export', {
    ...queryParams.value
  }, `services_${new Date().getTime()}.xlsx`);
}

/** 是否渲染字段 */
function renderField(insert, edit) {
  return form.value.id == null ? insert : edit;
}

getList();
</script>