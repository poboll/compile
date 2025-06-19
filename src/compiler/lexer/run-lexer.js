/**
 * 词法分析器独立运行脚本 - run-lexer.js
 * @description 用于单独测试和运行词法分析器，包含详细的日志输出和测试数据
 * @module compiler/lexer/run-lexer
 * @author poboll
 * @date 2025
 * @version 1.0
 */

const Lexer = require('./lexer.js');

// 测试数据集
const testCases = [
    {
        name: '基本变量声明',
        code: `let x = 10;
const name = "hello";
var count = 0;`
    },
    {
        name: '函数定义',
        code: `function add(a, b) {
    return a + b;
}`
    },
    {
        name: '条件语句',
        code: `if (x > 0) {
    console.log("positive");
} else {
    console.log("negative");
}`
    },
    {
        name: '循环语句',
        code: `for (let i = 0; i < 10; i++) {
    console.log(i);
}

while (x > 0) {
    x--;
}`
    },
    {
        name: '复杂表达式',
        code: `let result = (a + b) * c / d - e;
let isValid = x >= 0 && y <= 100;
let message = "Hello, " + name + "!";`
    },
    {
        name: '注释测试',
        code: `// 单行注释
let x = 5; // 行末注释

/*
 * 多行注释
 * 第二行
 */
let y = 10;`
    },
    {
        name: '字符串和字符',
        code: `let str1 = "double quotes";
let str2 = 'single quotes';
let escaped = "He said \"Hello\"";
let multiline = "line1\nline2";`
    },
    {
        name: '数字类型',
        code: `let integer = 42;
let float = 3.14159;
let negative = -100;
let zero = 0;`
    },
    {
        name: '操作符测试',
        code: `let a = 1 + 2 - 3 * 4 / 5;
let b = x == y && z != w;
let c = a < b || c > d;
let d = !flag;`
    },
    {
        name: '错误处理测试',
        code: `let x = 10;
let invalid = @#$%;
let unterminated = "hello world`
    }
];

/**
 * 格式化输出Token信息
 * @param {Token} token - Token对象
 * @param {number} index - Token索引
 */
function formatToken(token, index) {
    const typeStr = token.type.padEnd(12);
    const valueStr = (token.value || 'null').toString().padEnd(15);
    const posStr = `[${token.line}:${token.column}]`.padEnd(8);
    return `  ${index.toString().padStart(3)}: ${typeStr} ${valueStr} ${posStr}`;
}

/**
 * 输出词法分析统计信息
 * @param {Array} tokens - Token数组
 * @param {Array} errors - 错误数组
 */
function printStatistics(tokens, errors) {
    console.log('\n=== 词法分析统计 ===');

    // Token类型统计
    const tokenStats = {};
    tokens.forEach(token => {
        tokenStats[token.type] = (tokenStats[token.type] || 0) + 1;
    });

    console.log('Token类型分布:');
    Object.entries(tokenStats).forEach(([type, count]) => {
        console.log(`  ${type.padEnd(12)}: ${count}`);
    });

    console.log(`\n总Token数量: ${tokens.length}`);
    console.log(`错误数量: ${errors.length}`);

    if (errors.length > 0) {
        console.log('\n错误详情:');
        errors.forEach((error, index) => {
            console.log(`  ${index + 1}. [${error.line}:${error.column}] ${error.message}`);
            if (error.value) {
                console.log(`     问题字符: '${error.value}'`);
            }
        });
    }
}

/**
 * 运行单个测试用例
 * @param {Object} testCase - 测试用例对象
 * @param {number} index - 测试用例索引
 */
function runTestCase(testCase, index) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`测试用例 ${index + 1}: ${testCase.name}`);
    console.log(`${'='.repeat(60)}`);

    console.log('\n源代码:');
    console.log('-'.repeat(40));
    // 显示带行号的源代码
    const lines = testCase.code.split('\n');
    lines.forEach((line, lineIndex) => {
        console.log(`${(lineIndex + 1).toString().padStart(2)}: ${line}`);
    });
    console.log('-'.repeat(40));

    // 创建词法分析器实例
    const lexer = new Lexer(testCase.code);

    console.log('\n开始词法分析...');
    const startTime = Date.now();

    // 执行词法分析
    const tokens = lexer.tokenize();
    const errors = lexer.getErrors();

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`\n词法分析完成 (耗时: ${duration}ms)`);

    // 输出Token序列
    console.log('\nToken序列:');
    console.log('-'.repeat(50));
    console.log('  序号  类型         值              位置');
    console.log('-'.repeat(50));

    tokens.forEach((token, tokenIndex) => {
        console.log(formatToken(token, tokenIndex));
    });

    // 输出统计信息
    printStatistics(tokens, errors);

    return {
        tokens,
        errors,
        duration,
        success: errors.length === 0
    };
}

/**
 * 主函数 - 运行所有测试用例
 */
function main() {
    console.log('词法分析器独立测试程序');
    console.log('作者: poboll');
    console.log('版本: 1.0');
    console.log(`开始时间: ${new Date().toLocaleString()}`);

    const results = [];

    // 运行所有测试用例
    testCases.forEach((testCase, index) => {
        const result = runTestCase(testCase, index);
        results.push({
            name: testCase.name,
            ...result
        });
    });

    // 输出总体统计
    console.log(`\n${'='.repeat(60)}`);
    console.log('总体测试结果');
    console.log(`${'='.repeat(60)}`);

    const totalTests = results.length;
    const successfulTests = results.filter(r => r.success).length;
    const totalTokens = results.reduce((sum, r) => sum + r.tokens.length, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`测试用例总数: ${totalTests}`);
    console.log(`成功用例数: ${successfulTests}`);
    console.log(`失败用例数: ${totalTests - successfulTests}`);
    console.log(`总Token数: ${totalTokens}`);
    console.log(`总错误数: ${totalErrors}`);
    console.log(`总耗时: ${totalDuration}ms`);
    console.log(`平均耗时: ${(totalDuration / totalTests).toFixed(2)}ms`);

    // 详细结果列表
    console.log('\n详细结果:');
    console.log('-'.repeat(60));
    console.log('序号  测试用例名称           状态    Token数  错误数  耗时(ms)');
    console.log('-'.repeat(60));

    results.forEach((result, index) => {
        const status = result.success ? '✓ 成功' : '✗ 失败';
        const name = result.name.padEnd(20);
        const tokenCount = result.tokens.length.toString().padStart(6);
        const errorCount = result.errors.length.toString().padStart(6);
        const duration = result.duration.toString().padStart(8);

        console.log(`${(index + 1).toString().padStart(2)}    ${name} ${status}  ${tokenCount}  ${errorCount}  ${duration}`);
    });

    console.log(`\n测试完成时间: ${new Date().toLocaleString()}`);
}

// 如果直接运行此脚本，则执行主函数
if (require.main === module) {
    main();
}

// 导出相关函数供其他模块使用
module.exports = {
    runTestCase,
    testCases,
    main
};