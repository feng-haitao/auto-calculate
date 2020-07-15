const salaryFormulas = [
    '[EndowmentInsurance] = [BaseSalary] * 0.09', //养老保险 = 固定工资 * 0.09
    '[HousingFund] = [BaseSalary] * 0.12',  //住房公积金 = 固定工资 * 0.12
    '[IndividualIncomeTax] = ([BaseSalary] - [EndowmentInsurance] - [HousingFund]) * 0.05',  //个人所得税 = （固定工资 - 养老保险 - 住房公积金） * 0.05
    '[NetSalary] = [BaseSalary] + [Bonus] + [PhoneAllowance] - [EndowmentInsurance] - [HousingFund] - [IndividualIncomeTax]',  //实发工资 = 固定工资 + 奖金 + 通讯补贴 - 养老保险 - 住房公积金 - 个人所得税
];
export default salaryFormulas;