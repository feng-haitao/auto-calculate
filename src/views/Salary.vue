<template>
  <div class="salary">
    <el-table :data="tableData" style="width: 100%">
      <el-table-column label="姓名" prop="Name" width="60"/>
      <el-table-column label="固定工资" width="120" align="right">
        <template slot-scope="scope">
          <el-input-number v-model="scope.row.BaseSalary" :controls="false" @change="reCal"></el-input-number>
        </template>
      </el-table-column>
      <el-table-column label="奖金" width="120" align="right">
        <template slot-scope="scope">
          <el-input-number v-model="scope.row.Bonus" :controls="false" @change="reCal"></el-input-number>
        </template>
      </el-table-column>
      <el-table-column label="通讯补贴" width="120" align="right">
        <template slot-scope="scope">
          <el-input-number v-model="scope.row.PhoneAllowance" :controls="false" @change="reCal"></el-input-number>
        </template>
      </el-table-column>
      <el-table-column label="养老保险" width="120" align="right">
        <template slot-scope="scope">
          <el-input-number v-model="scope.row.EndowmentInsurance" :controls="false" :disabled="true"></el-input-number>
        </template>
      </el-table-column>
      <el-table-column label="住房公积金" width="120" align="right">
        <template slot-scope="scope">
          <el-input-number v-model="scope.row.HousingFund" :controls="false" :disabled="true"></el-input-number>
        </template>
      </el-table-column>
      <el-table-column label="个人所得税" width="120" align="right">
        <template slot-scope="scope">
          <el-input-number v-model="scope.row.IndividualIncomeTax" :controls="false" :disabled="true"></el-input-number>
        </template>
      </el-table-column>
      <el-table-column label="实发工资" width="120" align="right">
        <template slot-scope="scope">
          <el-input-number v-model="scope.row.NetSalary" :controls="false" :disabled="true"></el-input-number>
        </template>
      </el-table-column>
    </el-table>
    <el-divider content-position="left">公式</el-divider>
    <pre>
      <span class="comment">//养老保险 = 固定工资 * 0.09</span>
      [EndowmentInsurance] = [BaseSalary] * 0.09
      <span class="comment">//住房公积金 = 固定工资 * 0.12</span>
      [HousingFund] = [BaseSalary] * 0.12
      <span class="comment">//个人所得税 = （固定工资 - 养老保险 - 住房公积金） * 0.05</span>
      [IndividualIncomeTax] = ([BaseSalary] - [EndowmentInsurance] - [HousingFund]) * 0.05
      <span class="comment">//实发工资 = 固定工资 + 奖金 + 通讯补贴 - 养老保险 - 住房公积金 - 个人所得税</span>
      [NetSalary] = [BaseSalary] + [Bonus] + [PhoneAllowance] - [EndowmentInsurance] - [HousingFund] - [IndividualIncomeTax]
    </pre>
  </div>
</template>

<script>
import salary from '../data/salary';
import AutoCalculate from '../components/AutoCalculate';
import salaryFormulas from '../formulas/salaryFormulas';
export default {
  name: 'Salary',
  data() {
    return {
      tableData: salary,
      autoCal: new AutoCalculate(salaryFormulas)
    }
  },
  mounted() {
    this.reCal();
  },
  methods: {
    reCal() {
        this.autoCal.cal(this.tableData, 'Id');
    }
  }
}
</script>

<style lang="scss">
.salary {
  pre {
    line-height: 1.7;
    .comment {
      color: green;
    }
  }
}
</style>
