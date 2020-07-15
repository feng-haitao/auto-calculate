function AutoCalculate(formulas, options) {
    this.regCell = /\[([^,\s]+),([^,\s]+)]/ig;
    this.regCellWithoutX = /\[([^,\s]+)]/ig;
    this.regExternalCell = /\[([^,\s]+),([^,\s]+),([^,\s]+)]/ig;
    this.regSumField = /<([^,\s]+)>/ig;

    this.getExp = '';
    this.setExp = '';

    //存储用户设置的公式
    this.formulas = formulas;
    //从用户设置的公式转换来的公式，键为单元格，值为运算公式
    this.allFormulas = {};
    //单元格改变后需要重新计算的公式
    this.involvedFormulas = {};
    //用于存储计算结果
    this.results = {};
    //存储小数位数
    this.decimalPlaces = {};
    //外部数据
    this.externalDatas = {};

    //将externalDatas转成键值对存储格式
    let name, refField, datas;
    if (options) {
        if (options.externalDatas) {
            for (let i = 0; i < options.externalDatas.length; ++i) {
                name = options.externalDatas[i].name;
                refField = options.externalDatas[i].refField;
                datas = options.externalDatas[i].datas;
                this.externalDatas[name] = {};
                for (let j = 0; j < datas.length; ++j) {
                    this.externalDatas[name][datas[j][refField]] = datas[j];
                }
            }
        }
    }
    let autoCal = this;
    this.log = {
        msgType: {
            findInvolvedFormulas: 'findInvolvedFormulas', //查找需要重新计算的公式
            calculate: 'calculate',       //计算过程
            calAndAssign: 'calAndAssign', //计算并赋值
            performance: 'performance',   //性能
            allResults: 'allResults'      //所有结果
        },
        allMsgs: {
            findInvolvedFormulas: { msg: '', count: 0, enable: false },
            calculate: { msg: '', count: 0, enable: false },
            calAndAssign: { msg: '', count: 0, enable: false },
            performance: { msg: '', count: 0, enable: true },
            allResults: { msg: '', count: 0, enable: false }
        },
        errMsg: '',
        info: function (message, msgType) {
            let msgObj = this.allMsgs[msgType];
            if (msgObj.enable) {
                ++msgObj.count;
                msgObj.msg += (msgObj.msg ? '\n' : '') + msgObj.count + '. ' + message;
            }
        },
        error: function (errMsg, strFomular, script) {
            if (!this.errMsg) {
                this.errMsg = '运行公式时出现错误\n';
                if (strFomular) 
                    this.errMsg += '原始公式：' + strFomular + '\n';
                if (script)
                    this.errMsg += '运行时公式：' + script + '\n';
                if (errMsg)
                    this.errMsg += '错误消息：' + errMsg;
            }
        },
        reset: function () {
            for (let key in this.allMsgs) {
                this.allMsgs[key].msg = '';
                this.allMsgs[key].count = 0;
            }
        },
        output: function (msgType) {
            let msgObj = this.allMsgs[msgType];
            if (msgType) {
                if (msgObj.enable) {
                    console.log(msgObj.msg);
                }
            }
            else {
                for (let key in this.allMsgs) {
                    if (this.allMsgs[key].enable) {
                        if (key == this.msgType.allResults) {
                            console.log('results:');
                            console.log(autoCal.results);
                            console.log('involvedFormulas:');
                            console.log(autoCal.involvedFormulas);
                            console.log('allFormulas:');
                            console.log(autoCal.allFormulas);
                            console.log('fieldRecordMap:');
                            console.log(autoCal.fieldRecordMap);
                        }
                        else if (this.allMsgs[key].msg) {
                            console.log(this.allMsgs[key].msg);
                        }
                    }
                }
            }
        },
        time: function (timeName) {
            if (this.allMsgs.performance.enable)
                console.time(timeName);
        },
        timeEnd: function (timeName) {
            if (this.allMsgs.performance.enable)
                console.timeEnd(timeName);
        }
    };

    //存储参考字段的值与记录的对应关系
    this.fieldRecordMap = {};
    
    if (this.isEmptyObject(this.allFormulas))
        this.resolveFormulas();
}

//查找单元格[x, y]改变后需要重新计算的公式
AutoCalculate.prototype.findInvolvedFormulas = function (y, x) {
    this.involvedFormulas = {};
    if (!y || !x) {
        this.involvedFormulas = this.allFormulas;
    }
    else {
        let cell = '[' + y + ',' + x + ']';
        this.findInvolvedFormulasRecursively(cell);
    }
};

//递归查找单元格[y,x]改变后需要重新计算的公式
//公式左边可能是[y,x]或[y], 公式右边可能是[y,x]或[y]或<y>
//传入的参数commonCell可能是[y,x]或[y]
AutoCalculate.prototype.findInvolvedFormulasRecursively = function (commonCell) {
    let me = this;
    let newKey, newValue, x, y;
    let regCommonCell = /\[([^,\s]+)(,([^,\s]+))?]/ig;
    regCommonCell.lastIndex = 0;
    let arr = regCommonCell.exec(commonCell);
    if (arr) {
        y = arr[1];
        x = arr[3];
    }
    let cell = x ? '[' + y + ',' + x + ']' : undefined;
    let cellWithoutX = '[' + y + ']';
    let sumField = '<' + y + '>';

    me.log.info('检查受' + (cell ? cell + '或' : '') + cellWithoutX + '或' + sumField + '影响的单元格', me.log.msgType.findInvolvedFormulas);

    //查找受[y,x]影响的单元格
    if (cell) {
        //如果x存在，则直接查找含有cell的公式，如commonCell：[Month1,1], 受影响公式：[Month3,1] = [Month1,1] + [Month2,1]
        for (let key in me.allFormulas) {
            me.log.info('检查公式是否受' + cell + '的影响: ' + key + ' = ' + me.allFormulas[key], me.log.msgType.findInvolvedFormulas);

            if (me.involvedFormulas[key] === undefined && me.allFormulas[key].indexOf(cell) >= 0) {
                me.involvedFormulas[key] = me.allFormulas[key];
                me.findInvolvedFormulasRecursively(key);
            }
        }
    }
    else {
        //如果x不存在，则查找含有[y,[^,\s]+]的公式，如commonCell：[Month1], 受影响公式：[Month3,1] = [Month1,1] + [Month2,1]
        let str = '\\[' + y + ',[^,\s]+]';
        let reg = new RegExp(str, 'gi');
        for (let key in me.allFormulas) {
            me.log.info('检查公式是否受[' + y + ',x]的影响: ' + key + ' = ' + me.allFormulas[key], me.log.msgType.findInvolvedFormulas);
            reg.lastIndex = 0;
            if (me.involvedFormulas[key] === undefined && reg.test(me.allFormulas[key])) {
                me.involvedFormulas[key] = me.allFormulas[key];
                me.findInvolvedFormulasRecursively(key);
            }
        }
    }
    //查找受[y]影响的单元格, 如果公式右边含有[y], 左边必定也为[y]
    for (let key in me.allFormulas) {
        me.log.info('检查公式是否受' + cellWithoutX + '的影响: ' + key + ' = ' + me.allFormulas[key], me.log.msgType.findInvolvedFormulas);

        if (x) {
            //如果x存在，需将公式[y]转成公式[y,x]，如commonCell：[Month1,1], 受影响公式：[Month3] = [Month1] + [Month2]
            newKey = key.replace(me.regCellWithoutX, '[$1,' + x + ']');
            if (me.involvedFormulas[newKey] === undefined && me.allFormulas[key].indexOf(cellWithoutX) >= 0) {
                newValue = me.allFormulas[key].replace(me.regCellWithoutX, '[$1,' + x + ']');
                me.involvedFormulas[newKey] = newValue;
                me.findInvolvedFormulasRecursively(newKey);
            }
        }
        else {
            //如果x不存在，递归，并传入参数[y]，如commonCell：[Month1], 受影响公式：[Month3] = [Month1] + [Month2]
            if (me.involvedFormulas[key] === undefined && me.allFormulas[key].indexOf(cellWithoutX) >= 0) {
                me.involvedFormulas[key] = me.allFormulas[key];
                me.findInvolvedFormulasRecursively(key);
            }
        }
    }
    //查找受<y>影响的单元格
    for (let key in me.allFormulas) {
        me.log.info('检查公式是否受' + sumField + '的影响: ' + key + ' = ' + me.allFormulas[key], me.log.msgType.findInvolvedFormulas);

        if (me.involvedFormulas[key] === undefined && me.allFormulas[key].indexOf(sumField) >= 0) {
            me.involvedFormulas[key] = me.allFormulas[key];
            me.findInvolvedFormulasRecursively(key);
        }
    }
};

//将区域公式转成单元格公式，并存储为键值对
AutoCalculate.prototype.resolveFormulas = function () {
    let me = this;
    let regField = /\s*\{(.+)}\s*/ig;
    let regFormula = /\s*([^=\s]+?)\s*(#([0-9]))?\s*=\s*(.+)/ig;
    let arrRegField, arrRegFormula;
    let arrFields;
    let formula;
    let key, value;
    for (let i = 0; i < me.formulas.length; ++i) {
        regField.lastIndex = 0;
        regFormula.lastIndex = 0;
        arrRegField = regField.exec(me.formulas[i]);
        if (arrRegField) {
            //如果是区域公式
            arrFields = arrRegField[1].split(',');
            formula = me.formulas[i].replace(arrRegField[0], '');
            arrRegFormula = regFormula.exec(formula);
            if (!arrRegFormula)
                throw '公式设置错误：' + me.formulas[i];
            for (let j = 0; j < arrFields.length; ++j) {
                arrFields[j] = me.trim(arrFields[j]);
                key = arrRegFormula[1].replace(/@/g, arrFields[j]);
                value = arrRegFormula[4].replace(/@/g, arrFields[j]);
                me.allFormulas[key] = value;
                //如果有指定小数位数
                if (arrRegFormula[3]) {
                    me.decimalPlaces[key] = arrRegFormula[3];
                }
            }
        }
        else {
            //如果是单元格公式
            formula = me.formulas[i];
            arrRegFormula = regFormula.exec(formula);
            if (!arrRegFormula)
                throw '公式设置错误：' + me.formulas[i];
            me.allFormulas[arrRegFormula[1]] = arrRegFormula[4];
            //如果有指定小数位数
            if (arrRegFormula[3]) {
                me.decimalPlaces[arrRegFormula[1]] = arrRegFormula[3];
            }
        }
    }
};

AutoCalculate.prototype.cal = function (gridDatas, refField) {
    let me = this;
    let rowData, result;
    for (let i = 0; i < gridDatas.length; ++i) {
        rowData = gridDatas[i];
        me.fieldRecordMap[rowData[refField]] = rowData;
    }
    me.getExp = "me.fieldRecordMap['$2']['$1']";
    me.setExp = "me.fieldRecordMap['$2']['$1'] = @";
    me.calculateInternal();
    result = JSON.stringify(gridDatas);
    return result;
};

//内部公用计算方法
AutoCalculate.prototype.calculateInternal = function (y, x) {
    let me = this;
    let script, newKey, newValue;

    me.log.reset();
    me.findInvolvedFormulas(y, x);
    me.results = {};

    try {
        for (let key in me.involvedFormulas) {
            me.regCellWithoutX.lastIndex = 0;
            if (me.regCellWithoutX.test(key)) {
                //如果是公式[y],转成n个公式[y,x]
                for (let fieldVal in me.fieldRecordMap) {
                    newKey = key.replace(me.regCellWithoutX, '[$1,' + fieldVal + ']');
                    newValue = me.involvedFormulas[key].replace(me.regCellWithoutX, '[$1,' + fieldVal + ']');
                    me.calculateFormula(newKey, newValue);
                }
            }
            else {
                //如果是公式[y,x]
                me.calculateFormula(key, me.involvedFormulas[key]);
            }
        }
    }
    catch (err) {
        me.log.error(err.message);
    }
    me.log.output();
    if (me.log.errMsg)
        throw me.log.errMsg;    
};

//计算一个公式等号右边的部分，并赋值给等号左边
AutoCalculate.prototype.calculateFormula = function (key, value) {
    let me = this;
    let strFomular = key + ' = ' + value;
    me.log.info('计算：' + strFomular, me.log.msgType.calculate);
    me.log.info('计算：' + strFomular, me.log.msgType.calAndAssign);

    //赋值给等号左边
    try {
        let script = key.replace(me.regCell, me.setExp.replace('@', me.calculateCell(key)));
        eval(script);
    }
    catch (err) {
        me.log.error(err.message, strFomular, script);
        throw '';
    }
};

//合计某一列
AutoCalculate.prototype.calculateSumField = function (field, fieldWithMark) {
    let me = this;
    let sum = 0;
    let cell;

    if (me.results[fieldWithMark] !== undefined) {
        me.log.info(fieldWithMark + ' = ' + me.results[fieldWithMark], me.log.msgType.calculate);
    }
    else {
        me.log.info('求合计列' + fieldWithMark, me.log.msgType.calculate);
        for (let fieldVal in me.fieldRecordMap) {
            cell = '[' + field + ',' + fieldVal + ']';
            sum += me.calculateCell(cell);
        }
        me.results[fieldWithMark] = sum;
    }    
    return me.results[fieldWithMark];
};

//计算某个单元格
AutoCalculate.prototype.calculateCell = function (cell) {
    let me = this;
    let x, y, newValue, script, strFomular;
    me.regCell.lastIndex = 0;
    let arr = me.regCell.exec(cell);
    if (arr) {
        y = arr[1];
        x = arr[2];
    }
    let cellWithoutX = '[' + y + ']'; 

    me.regExternalCell.lastIndex = 0;
    //有计算结果直接返回计算结果
    if (me.results[cell] !== undefined) {
        me.log.info(cell + ' = ' + me.results[cell], me.log.msgType.calculate);
    }
    //单元格包含[y,x]公式，递归
    else if (me.allFormulas[cell] !== undefined) {
        //如果单元格包含外部数据
        if (me.regExternalCell.test(me.allFormulas[cell])) {
            //如果初始化时没有传入外部数据，忽略这条公式，直接取单元格的值
            if (me.isEmptyObject(me.externalDatas)) {
                script = cell.replace(me.regCell, me.getExp);
                strFomular = '';
                me.log.info(cell + ' = ' + script, me.log.msgType.calculate);
            }
            //否则，取外部数据，计算公式
            else {
                script = me.allFormulas[cell].replace(me.regCell, "me.calculateCell('$&')");
                script = script.replace(me.regSumField, "me.calculateSumField('$1','$&')");
                script = script.replace(me.regExternalCell, "me.externalDatas['$1']['$3']['$2']");
                script = 'parseFloat((' + script + ').toFixed(' + me.getDecimalPlace(cell) + '))';
                strFomular = cell + ' = ' + me.allFormulas[cell];
                me.log.info(strFomular, me.log.msgType.calculate);
            }
        }
        //单元格不包含外部数据，只进行表内计算
        else {
            script = me.allFormulas[cell].replace(me.regCell, "me.calculateCell('$&')");
            script = script.replace(me.regSumField, "me.calculateSumField('$1','$&')");
            script = 'parseFloat((' + script + ').toFixed(' + me.getDecimalPlace(cell) + '))';
            strFomular = cell + ' = ' + me.allFormulas[cell];
            me.log.info(strFomular, me.log.msgType.calculate);
        }      
    }
    //单元格包含[y]公式，转成[y,x]公式，递归
    else if (me.allFormulas[cellWithoutX] !== undefined) {
        newValue = me.allFormulas[cellWithoutX].replace(me.regCellWithoutX, '[$1,' + x + ']');
        //如果单元格包含外部数据
        if (me.regExternalCell.test(newValue)) {
            //如果初始化时没有传入外部数据，忽略这条公式，直接取单元格的值
            if (me.isEmptyObject(me.externalDatas)) {
                script = cell.replace(me.regCell, me.getExp);
                strFomular = '';
                me.log.info(cell + ' = ' + script, me.log.msgType.calculate);
            }
            //否则，取外部数据，计算公式
            else {
                script = newValue.replace(me.regCell, "me.calculateCell('$&')");
                script = script.replace(me.regSumField, "me.calculateSumField('$1','$&')");
                script = script.replace(me.regExternalCell, "me.externalDatas['$1']['$3']['$2']");
                script = 'parseFloat((' + script + ').toFixed(' + me.getDecimalPlace(cellWithoutX) + '))';
                strFomular = cell + ' = ' + newValue;
                me.log.info(strFomular, me.log.msgType.calculate);
            }
        }
        //单元格不包含外部数据，只进行表内计算
        else {
            script = newValue.replace(me.regCell, "me.calculateCell('$&')");
            script = script.replace(me.regSumField, "me.calculateSumField('$1','$&')");
            script = 'parseFloat((' + script + ').toFixed(' + me.getDecimalPlace(cellWithoutX) + '))';
            strFomular = cell + ' = ' + newValue;
            me.log.info(strFomular, me.log.msgType.calculate);
        }
    }
    //单元格不包含公式, 取值并存储
    else {
        script = cell.replace(me.regCell, me.getExp);
        strFomular = '';
        me.log.info(cell + ' = ' + script, me.log.msgType.calculate);
    }
    try {
        if (script)
            me.results[cell] = eval(script);
    }
    catch (err) {
        me.log.error(err.message, strFomular, script);
        throw '';
    }
    return me.results[cell];
};

AutoCalculate.prototype.getDecimalPlace = function (key, isFindCellWithoutX) {
    let me = this;
    let decimalPlace = 2;

    if (me.decimalPlaces[key])
        decimalPlace = me.decimalPlaces[key];
    else if (isFindCellWithoutX) {
        let cellWithoutX = key.replace(me.regCell, '[$1]');
        if (me.decimalPlaces[cellWithoutX])
            decimalPlace = me.decimalPlaces[cellWithoutX];
    }
    return decimalPlace;
};
    
AutoCalculate.prototype.isEmptyObject = function (obj) {
    for (let key in obj) {
        return false
    };
    return true
};

AutoCalculate.prototype.trim = function (str) {
    return str.replace(/^\s*(.*?)\s*$/, '$1');
};

export default AutoCalculate;