<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="100px">
      <el-form-item label="数据库名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入数据库名称"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="数据库类型" prop="dbType" >
        <el-select v-model="queryParams.dbType" placeholder="请选择数据库类型" clearable style="width: 240px">
          <el-option
            v-for="dict in database_type"
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
          v-hasPermi="['api_databases:api_databases:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['api_databases:api_databases:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['api_databases:api_databases:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['api_databases:api_databases:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="api_databasesList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="数据库ID" align="center" prop="id" />
      <el-table-column label="数据库名称" align="center" prop="name" />
      <el-table-column label="数据库类型" align="center" prop="dbType">
        <template #default="scope">
            <dict-tag :options="database_type" :value="scope.row.dbType"/>
        </template>
      </el-table-column>
      <el-table-column label="数据库主机" align="center" prop="host" />
      <!-- <el-table-column label="数据库端口" align="center" prop="port" /> -->
      <!-- <el-table-column label="数据库用户名" align="center" prop="username" /> -->
      <!-- <el-table-column label="数据库密码" align="center" prop="password" /> -->
      <!-- <el-table-column label="所属项目ID" align="center" prop="projectId" /> -->
      <!-- <el-table-column label="备注" align="center" prop="remark" /> -->
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button
            link
            type="success"
            icon="Connection"
            :loading="isTestingConnection(scope.row.id)"
            @click="handleTestConnection(scope.row)"
          >
            测试连接
          </el-button>
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['api_databases:api_databases:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['api_databases:api_databases:remove']">删除</el-button>
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

    <!-- 添加或修改数据库配置对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="api_databasesRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item v-if="renderField(true, true)" label="数据库名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入数据库名称" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="数据库类型" prop="dbType">
        <el-select v-model="form.dbType" placeholder="请选择数据库类型">
          <el-option
            v-for="dict in database_type"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="数据库主机" prop="host">
        <el-input v-model="form.host" placeholder="请输入数据库主机" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="数据库端口" prop="port">
        <el-input v-model="form.port" placeholder="请输入数据库端口" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="数据库用户名" prop="username">
        <el-input v-model="form.username" placeholder="请输入数据库用户名" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="数据库密码" prop="password">
        <el-input v-model="form.password" placeholder="请输入数据库密码" />
      </el-form-item>

      <el-form-item v-if="renderField(true, true)" label="备注" prop="remark">
        <el-input v-model="form.remark" placeholder="请输入备注" />
      </el-form-item>

      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button
            type="success"
            icon="Connection"
            :loading="testLoading"
            @click="handleTestConnection()"
          >
            保存并测试连接
          </el-button>
          <div style="flex: 1;"></div>
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Api_databases">
import { listApi_databases, getApi_databases, delApi_databases, addApi_databases, updateApi_databases, testApi_databases } from "@/api/api_databases/api_databases";

const { proxy } = getCurrentInstance();
const { database_type } = proxy.useDict('database_type');

const api_databasesList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");
const testLoading = ref(false); // 测试连接加载状态
const testingIds = ref(new Set()); // 正在测试的数据库ID集合

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    name: null,
    dbType: null,
  },
  rules: {
    name: [
      { required: true, message: "数据库名称不能为空", trigger: "blur" }
    ],
    dbType: [
      { required: true, message: "数据库类型不能为空", trigger: "change" }
    ],
    host: [
      { required: true, message: "数据库主机不能为空", trigger: "blur" }
    ],
    port: [
      { required: true, message: "数据库端口不能为空", trigger: "blur" }
    ],
    projectId: [
      { required: true, message: "所属项目ID不能为空", trigger: "blur" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询数据库配置列表 */
function getList() {
  loading.value = true;
  listApi_databases(queryParams.value).then(response => {
    api_databasesList.value = response.rows;
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
    dbType: null,
    host: null,
    port: null,
    username: null,
    password: null,
    projectId: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    remark: null,
    description: null,
    sortNo: null,
    delFlag: null,
  };
  proxy.resetForm("api_databasesRef");
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
  title.value = "添加数据库配置";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _id = row.id || ids.value;
  getApi_databases(_id).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改数据库配置";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["api_databasesRef"].validate(valid => {
    if (valid) {
      if (form.value.id != null) {
        updateApi_databases(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addApi_databases(form.value).then(response => {
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
  proxy.$modal.confirm('是否确认删除数据库配置编号为"' + _ids + '"的数据项？').then(function() {
    return delApi_databases(_ids);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}


/** 导出按钮操作 */
function handleExport() {
  proxy.download('api_databases/api_databases/export', {
    ...queryParams.value
  }, `api_databases_${new Date().getTime()}.xlsx`);
}

/** 测试数据库连接 */
async function handleTestConnection(row) {
  // 如果是从表格行调用（有row参数），直接测试
  if (row) {
    const dbId = row.id;

    // 防止重复测试
    if (testingIds.value.has(dbId)) {
      return;
    }

    testingIds.value.add(dbId);

    try {
      const response = await testApi_databases(dbId);
      if (response && response.code === 200) {
        proxy.$modal.msgSuccess('数据库连接成功');
      } else {
        proxy.$modal.msgError(response?.msg || '数据库连接失败');
      }
    } catch (error) {
      console.error('测试数据库连接失败:', error);
      proxy.$modal.msgError('测试数据库连接失败: ' + (error.message || '未知错误'));
    } finally {
      testingIds.value.delete(dbId);
    }
    return;
  }

  // 如果是从对话框调用（无row参数），需要先保存再测试
  testLoading.value = true;

  try {
    // 先验证表单
    await proxy.$refs["api_databasesRef"].validate();

    // 保存配置
    let saveResponse;
    if (form.value.id != null) {
      // 修改模式
      saveResponse = await updateApi_databases(form.value);
      proxy.$modal.msgSuccess("配置已保存");
    } else {
      // 新增模式
      saveResponse = await addApi_databases(form.value);
      proxy.$modal.msgSuccess("配置已保存");
      // 新增后需要获取返回的ID
      if (saveResponse.data && saveResponse.data.id) {
        form.value.id = saveResponse.data.id;
      }
    }

    // 刷新列表
    await getList();

    // 保存成功后进行测试
    if (form.value.id) {
      const testResponse = await testApi_databases(form.value.id);
      if (testResponse && testResponse.code === 200) {
        proxy.$modal.msgSuccess('数据库连接成功');
      } else {
        proxy.$modal.msgError(testResponse?.msg || '数据库连接失败');
      }
    }
  } catch (error) {
    console.error('保存或测试失败:', error);
    if (error.message) {
      proxy.$modal.msgError(error.message);
    }
  } finally {
    testLoading.value = false;
  }
}

/** 判断是否正在测试某个数据库 */
function isTestingConnection(id) {
  return testingIds.value.has(id);
}

/** 是否渲染字段 */
function renderField(insert, edit) {
  return form.value.id == null ? insert : edit;
}

getList();
</script>

<style scoped>
.dialog-footer {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>