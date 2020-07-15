<template>
  <div class="home">
    <el-table :data="tableData" style="width: 100%">
      <el-table-column label="Row No" prop="RowNo" width="60" align="center"/>
      <el-table-column label="Item Name" prop="ItemName" width="130"/>
      <el-table-column label="Formula" prop="Formula" width="150"/>
      <el-table-column label="Month1" width="120" align="right">
        <template slot-scope="scope">
          <el-input-number v-model="scope.row.Month1" :controls="false" :disabled="isDisabled('Month1', scope.row)" @change="handleChange"></el-input-number>
        </template>
      </el-table-column>
      <el-table-column label="Month2" width="120" align="right">
        <template slot-scope="scope">
          <el-input-number v-model="scope.row.Month2" :controls="false" :disabled="isDisabled('Month2', scope.row)" @change="handleChange"></el-input-number>
        </template>
      </el-table-column>
      <el-table-column label="Month3" width="120" align="right">
        <template slot-scope="scope">
          <el-input-number v-model="scope.row.Month3" :controls="false" :disabled="isDisabled('Month3', scope.row)" @change="handleChange"></el-input-number>
        </template>
      </el-table-column>
      <el-table-column label="Month4" width="120" align="right">
        <template slot-scope="scope">
          <el-input-number v-model="scope.row.Month4" :controls="false" :disabled="isDisabled('Month4', scope.row)" @change="handleChange"></el-input-number>
        </template>
      </el-table-column>
      <el-table-column label="Month5" width="120" align="right">
        <template slot-scope="scope">
          <el-input-number v-model="scope.row.Month5" :controls="false" :disabled="isDisabled('Month5', scope.row)" @change="handleChange"></el-input-number>
        </template>
      </el-table-column>
      <el-table-column label="Month6" width="120" align="right">
        <template slot-scope="scope">
          <el-input-number v-model="scope.row.Month6" :controls="false" :disabled="isDisabled('Month6', scope.row)" @change="handleChange"></el-input-number>
        </template>
      </el-table-column>
      <el-table-column label="Month7" width="120" align="right">
        <template slot-scope="scope">
          <el-input-number v-model="scope.row.Month7" :controls="false" :disabled="isDisabled('Month7', scope.row)" @change="handleChange"></el-input-number>
        </template>
      </el-table-column>
      <el-table-column label="Month8" width="120" align="right">
        <template slot-scope="scope">
          <el-input-number v-model="scope.row.Month8" :controls="false" :disabled="isDisabled('Month8', scope.row)" @change="handleChange"></el-input-number>
        </template>
      </el-table-column>
      <el-table-column label="Month9" width="120" align="right">
        <template slot-scope="scope">
          <el-input-number v-model="scope.row.Month9" :controls="false" :disabled="isDisabled('Month9', scope.row)" @change="handleChange"></el-input-number>
        </template>
      </el-table-column>
      <el-table-column label="Month10" width="120" align="right">
        <template slot-scope="scope">
          <el-input-number v-model="scope.row.Month10" :controls="false" :disabled="isDisabled('Month10', scope.row)" @change="handleChange"></el-input-number>
        </template>
      </el-table-column>
      <el-table-column label="Month11" width="120" align="right">
        <template slot-scope="scope">
          <el-input-number v-model="scope.row.Month11" :controls="false" :disabled="isDisabled('Month11', scope.row)" @change="handleChange"></el-input-number>
        </template>
      </el-table-column>
      <el-table-column label="Month12" width="120" align="right">
        <template slot-scope="scope">
          <el-input-number v-model="scope.row.Month12" :controls="false" :disabled="isDisabled('Month12', scope.row)" @change="handleChange"></el-input-number>
        </template>
      </el-table-column>
      <el-table-column label="Year Total" prop="YearTotal" width="120" align="right"/>
    </el-table>
    <el-divider content-position="left">公式</el-divider>
    <el-input v-model="formulas" type="textarea" :rows="50" :readonly="true"></el-input>
  </div>
</template>

<script>
import payableTax from '../data/payableTax';
import AutoCalculate from '../components/AutoCalculate';
import payableTaxFormulas from '../formulas/payableTaxFormulas.js';
export default {
  name: 'Home',
  data() {
    return {
      tableData: payableTax
    }
  },
  computed: {
    formulas() {
      return payableTaxFormulas.join('\n');
    }
  },
  methods: {
    handleChange() {
      let autoCal = new AutoCalculate(payableTaxFormulas);
      autoCal.cal(this.tableData, 'RowNo');
    },
    isDisabled(fieldName, row) {
      if(['Month1','Month2','Month3','Month4','Month5','Month6','Month7','Month8','Month9','Month10'].includes(fieldName)) {
        if([2, 4, 5, 6, 7].includes(row.RowNo))
          return false;

        if(fieldName === 'Month1' && [8, 11].includes(row.RowNo))
          return false;
      }
      return true;
    }
  }
}
</script>
