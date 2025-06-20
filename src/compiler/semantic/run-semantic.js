#!/usr/bin/env node
/**
 * 语义分析器独立测试工具 - run-semantic.js
 * @description 提供语义分析器的完整测试套件和交互式测试功能
 * @module compiler/semantic/run-semantic
 * @author 编译系统课程设计
 * @date 2025
 * @version 1.0
 * 
 * 主要功能：
 * 1. 运行完整的语义分析测试套件
 * 2. 显示符号表和作用域信息
 * 3. 检测语义错误和类型错误
 * 4. 提供详细的分析统计信息
 * 5. 支持自定义测试用例
 * 6. 生成语义分析报告
 */

const path = require('path');
const Lexer = require('../lexer/lexer');
const { Parser } = require('../parser/parser');
const Analyzer = require('./semantic');
const SymbolTable = require('./symbol-table');
const { TypeChecker } = require('./type-checker');

/**
 * 格式化符号表显示
 * @param {SymbolTable} symbolTable - 符号表实例
 * @returns {string} - 格式化的符号表字符串
 */
function formatSymbolTable(symbolTable) {
    const scopes = symbolTable.scopeChain;
    let result = '\n=== 符号表信息 ===\n';

    scopes.forEach((scope, index) => {
        const scopeType = index === 0 ? '全局作用域' : `局部作用域 ${index}`;
        result += `\n${scopeType}:\n`;

        if (scope.size === 0) {
            result += '  (空)\n';
        } else {
            scope.forEach((symbol, name) => {
                result += `  ${name}: ${JSON.stringify(symbol)}\n`;
            });
        }
    });

    return result;
}

/**
 * 格式化语义分析统计信息
 * @param {Object} stats - 统计信息
 * @returns {string} - 格式化的统计信息
 */
function formatSemanticStats(stats) {
    return `\n=== 语义分析统计 ===
作用域层数: ${stats.scopeDepth}
符号总数: ${stats.symbolCount}
变量声明: ${stats.variableDeclarations}
函数声明: ${stats.functionDeclarations}
标识符引用: ${stats.identifierReferences}
类型检查次数: ${stats.typeChecks}
语义错误: ${stats.semanticErrors}
类型错误: ${stats.typeErrors}
分析耗时: ${stats.duration}ms`;
}

/**
 * 执行语义分析
 * @param {string} code - 源代码
 * @param {string} testName - 测试名称
 * @returns {Object} - 分析结果
 */
function performSemanticAnalysis(code, testName = '未命名测试') {
    console.log(`\n🔍 开始语义分析: ${testName}`);
    console.log('='.repeat(50));
    console.log('源代码:');
    console.log(code);
    console.log('='.repeat(50));

    const startTime = Date.now();

    try {
        // 词法分析
        const lexer = new Lexer(code);
        const tokens = lexer.tokenize();

        if (lexer.errors.length > 0) {
            console.log('\n❌ 词法分析错误:');
            lexer.errors.forEach(error => console.log(`  ${error}`));
            return { success: false, stage: 'lexer', errors: lexer.errors };
        }

        // 语法分析
        const parser = new Parser(tokens);
        const ast = parser.parse();

        if (parser.errors.length > 0) {
            console.log('\n❌ 语法分析错误:');
            parser.errors.forEach(error => console.log(`  ${error}`));
            return { success: false, stage: 'parser', errors: parser.errors };
        }

        // 语义分析统计
        const stats = {
            scopeDepth: 0,
            symbolCount: 0,
            variableDeclarations: 0,
            functionDeclarations: 0,
            identifierReferences: 0,
            typeChecks: 0,
            semanticErrors: 0,
            typeErrors: 0,
            duration: 0
        };

        // 语义分析
        const analyzer = new Analyzer(ast, {
            onEnter: (node) => {
                if (node.nodeType === 'VariableDeclaration') {
                    stats.variableDeclarations++;
                } else if (node.nodeType === 'FunctionDeclaration') {
                    stats.functionDeclarations++;
                } else if (node.nodeType === 'Identifier') {
                    stats.identifierReferences++;
                }
            },
            onExit: (node) => {
                // 可以在这里添加退出时的统计
            }
        });

        const semanticErrors = analyzer.analyze();

        // 类型检查
        const typeChecker = new TypeChecker();
        // 这里可以添加更详细的类型检查逻辑

        const endTime = Date.now();
        stats.duration = endTime - startTime;
        stats.scopeDepth = analyzer.symbolTable.scopeChain.length;
        stats.symbolCount = analyzer.symbolTable.scopeChain.reduce((total, scope) => total + scope.size, 0);
        stats.semanticErrors = semanticErrors.length;

        // 显示结果
        console.log('\n✅ 语义分析完成');

        if (semanticErrors.length > 0) {
            console.log('\n❌ 发现语义错误:');
            semanticErrors.forEach(error => console.log(`  ${error}`));
        } else {
            console.log('\n✅ 未发现语义错误');
        }

        // 显示符号表
        console.log(formatSymbolTable(analyzer.symbolTable));

        // 显示统计信息
        console.log(formatSemanticStats(stats));

        return {
            success: true,
            ast,
            symbolTable: analyzer.symbolTable,
            semanticErrors,
            typeChecker,
            stats
        };

    } catch (error) {
        console.error('\n💥 语义分析过程中发生错误:', error.message);
        return { success: false, stage: 'semantic', error: error.message };
    }
}

/**
 * 测试用例集合
 */
const testCases = [
    {
        name: '基本变量声明',
        code: `
let x = 10;
const y = "hello";
var z = true;
console.log(x, y, z);`
    },
    {
        name: '函数声明和调用',
        code: `
function add(a, b) {
    return a + b;
}

let result = add(5, 3);
console.log(result);`
    },
    {
        name: '作用域测试',
        code: `
let global = "global";

function outer() {
    let outerVar = "outer";
    
    function inner() {
        let innerVar = "inner";
        console.log(global, outerVar, innerVar);
    }
    
    inner();
}

outer();`
    },
    {
        name: '变量重复声明错误',
        code: `
let x = 10;
let x = 20; // 错误：重复声明
console.log(x);`
    },
    {
        name: '未声明变量使用错误',
        code: `
console.log(undeclaredVar); // 错误：未声明的变量
let y = undeclaredVar + 10;`
    },
    {
        name: '函数参数重复错误',
        code: `
function test(a, b, a) { // 错误：参数重复
    return a + b;
}

test(1, 2, 3);`
    },
    {
        name: '复杂表达式类型检查',
        code: `
let num = 42;
let str = "hello";
let bool = true;

let result1 = num + 10;
let result2 = str + " world";
let result3 = bool && false;
let result4 = num > 30;`
    },
    {
        name: '控制流语句',
        code: `
let x = 10;

if (x > 5) {
    let y = x * 2;
    console.log(y);
}

while (x > 0) {
    x = x - 1;
    if (x === 5) {
        break;
    }
}`
    }
];

/**
 * 运行所有测试用例
 */
function runAllTests() {
    console.log('🚀 开始运行语义分析测试套件');
    console.log('='.repeat(60));

    const results = [];
    const startTime = Date.now();

    testCases.forEach((testCase, index) => {
        console.log(`\n📋 测试 ${index + 1}/${testCases.length}: ${testCase.name}`);
        const result = performSemanticAnalysis(testCase.code, testCase.name);
        results.push({ ...testCase, result });
    });

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // 汇总统计
    console.log('\n' + '='.repeat(60));
    console.log('📊 测试汇总统计');
    console.log('='.repeat(60));

    const summary = {
        total: results.length,
        passed: results.filter(r => r.result.success && (!r.result.semanticErrors || r.result.semanticErrors.length === 0)).length,
        failed: results.filter(r => !r.result.success).length,
        withErrors: results.filter(r => r.result.success && r.result.semanticErrors && r.result.semanticErrors.length > 0).length,
        totalTime
    };

    console.log(`总测试数: ${summary.total}`);
    console.log(`通过测试: ${summary.passed}`);
    console.log(`失败测试: ${summary.failed}`);
    console.log(`有语义错误: ${summary.withErrors}`);
    console.log(`总耗时: ${summary.totalTime}ms`);

    // 详细错误报告
    const errorTests = results.filter(r => !r.result.success || (r.result.semanticErrors && r.result.semanticErrors.length > 0));
    if (errorTests.length > 0) {
        console.log('\n❌ 错误详情:');
        errorTests.forEach(test => {
            console.log(`\n  ${test.name}:`);
            if (!test.result.success) {
                console.log(`    阶段: ${test.result.stage}`);
                if (test.result.errors) {
                    test.result.errors.forEach(error => console.log(`    ${error}`));
                } else if (test.result.error) {
                    console.log(`    ${test.result.error}`);
                }
            } else if (test.result.semanticErrors) {
                test.result.semanticErrors.forEach(error => console.log(`    ${error}`));
            }
        });
    }

    console.log('\n✅ 语义分析测试套件运行完成');
    return summary;
}

// 主程序
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        // 运行所有测试
        runAllTests();
    } else {
        // 运行自定义代码测试
        const customCode = args.join(' ');
        performSemanticAnalysis(customCode, '自定义测试');
    }
}

// 导出函数供其他模块使用
module.exports = {
    performSemanticAnalysis,
    runAllTests,
    formatSymbolTable,
    formatSemanticStats,
    testCases
};