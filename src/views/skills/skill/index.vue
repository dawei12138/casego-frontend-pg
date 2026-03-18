<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="技能目录名" prop="skillName">
        <el-input
          v-model="queryParams.skillName"
          placeholder="请输入技能目录名"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="技能显示名称" prop="displayName">
        <el-input
          v-model="queryParams.displayName"
          placeholder="请输入技能显示名称"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="来源类型: manual / upload / url" prop="sourceType">
        <el-select v-model="queryParams.sourceType" placeholder="请选择来源类型: manual / upload / url" clearable style="width: 240px">
          <el-option label="请选择字典生成" value="" />
        </el-select>
      </el-form-item>
      <el-form-item label="URL导入源地址" prop="sourceUrl">
        <el-input
          v-model="queryParams.sourceUrl"
          placeholder="请输入URL导入源地址"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="允许的工具列表" prop="allowedTools">
        <el-input
          v-model="queryParams.allowedTools"
          placeholder="请输入允许的工具列表"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="许可证信息" prop="licenseInfo">
        <el-input
          v-model="queryParams.licenseInfo"
          placeholder="请输入许可证信息"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="" prop="description">
        <el-input
          v-model="queryParams.description"
          placeholder="请输入"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="" prop="sortNo">
        <el-input
          v-model="queryParams.sortNo"
          placeholder="请输入"
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
          v-hasPermi="['skills:skill:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['skills:skill:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['skills:skill:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['skills:skill:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="skillList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="技能唯一标识符(UUID)" align="center" prop="skillId" />
      <el-table-column label="技能目录名" align="center" prop="skillName" />
      <el-table-column label="技能显示名称" align="center" prop="displayName" />
      <el-table-column label="是否启用" align="center" prop="enabled" />
      <el-table-column label="来源类型: manual / upload / url" align="center" prop="sourceType" />
      <el-table-column label="URL导入源地址" align="center" prop="sourceUrl" />
      <el-table-column label="允许的工具列表" align="center" prop="allowedTools" />
      <el-table-column label="许可证信息" align="center" prop="licenseInfo" />
      <el-table-column label="" align="center" prop="remark" />
      <el-table-column label="" align="center" prop="description" />
      <el-table-column label="" align="center" prop="sortNo" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['skills:skill:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['skills:skill:remove']">删除</el-button>
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

    <!-- 添加或修改AI技能配置对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="skillRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item v-if="renderField(true, true)" label="技能目录名" prop="skillName">
        <el-input v-model="form.skillName" placeholder="请输入技能目录名" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="技能显示名称" prop="displayName">
        <el-input v-model="form.displayName" placeholder="请输入技能显示名称" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="来源类型: manual / upload / url" prop="sourceType">
        <el-select v-model="form.sourceType" placeholder="请选择来源类型: manual / upload / url">
          <el-option label="请选择字典生成" value="" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="URL导入源地址" prop="sourceUrl">
        <el-input v-model="form.sourceUrl" placeholder="请输入URL导入源地址" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="允许的工具列表" prop="allowedTools">
        <el-input v-model="form.allowedTools" placeholder="请输入允许的工具列表" />
      </el-form-item>
      <el-form-item v-if="renderField(true, true)" label="许可证信息" prop="licenseInfo">
        <el-input v-model="form.licenseInfo" placeholder="请输入许可证信息" />
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

<script setup name="Skill">
import { listSkill, getSkill, delSkill, addSkill, updateSkill } from "@/api/skills/skill";

const { proxy } = getCurrentInstance();

const skillList = ref([]);
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
    skillName: null,
    displayName: null,
    enabled: null,
    sourceType: null,
    sourceUrl: null,
    allowedTools: null,
    licenseInfo: null,
    description: null,
    sortNo: null,
  },
  rules: {
    skillName: [
      { required: true, message: "技能目录名不能为空", trigger: "blur" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询AI技能配置列表 */
function getList() {
  loading.value = true;
  listSkill(queryParams.value).then(response => {
    skillList.value = response.rows;
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
    skillId: null,
    skillName: null,
    displayName: null,
    enabled: null,
    sourceType: null,
    sourceUrl: null,
    allowedTools: null,
    licenseInfo: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    remark: null,
    description: null,
    sortNo: null,
    delFlag: null,
  };
  proxy.resetForm("skillRef");
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
  ids.value = selection.map(item => item.skillId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加AI技能配置";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _skillId = row.skillId || ids.value;
  getSkill(_skillId).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改AI技能配置";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["skillRef"].validate(valid => {
    if (valid) {
      if (form.value.skillId != null) {
        updateSkill(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addSkill(form.value).then(response => {
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
  const _skillIds = row.skillId || ids.value;
  proxy.$modal.confirm('是否确认删除AI技能配置编号为"' + _skillIds + '"的数据项？').then(function() {
    return delSkill(_skillIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}


/** 导出按钮操作 */
function handleExport() {
  proxy.download('skills/skill/export', {
    ...queryParams.value
  }, `skill_${new Date().getTime()}.xlsx`);
}

/** 是否渲染字段 */
function renderField(insert, edit) {
  return form.value.skillId == null ? insert : edit;
}

getList();
</script>