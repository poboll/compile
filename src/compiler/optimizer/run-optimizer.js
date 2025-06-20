#!/usr/bin/env node
/**
 * 代码优化器独立测试工具 - run-optimizer.js
 * @description 提供代码优化器的完整测试套件和交互式测试功能
 * @module compiler/optimizer/run-optimizer
 * @author 编译系统课程设计
 * @date 2025
 * @version 1.0
 * 
 * 主要功能：
 * 1. 运行完整的代码优化测试套件
 * 2. 展示优化前后的AST对比
 * 3. 统计各种优化效果
 * 4. 提供详细的优化分析报告
 * 5. 支持自定义优化测试用例
 * 6. 测量优化性能和效果
 */

const path = require('path');
const Lexer = require('../lexer/lexer');
const { Parser } = require('../parser/parser');
const Optimizer = require('./optimizer');
const { ConstantFolder } = require('./constant-folder');
const { DeadCodeEliminator } = require('./dead-code-eliminator');

/**
 * 格式化AST节点显示
 * @param {Object} node - AST节点
 * @param {number} depth - 缩进深度
 * @returns {string} - 格式化的AST字符串
 */
function formatASTNode(node, depth = 0) {
    if (!node) return '';

    const indent = '  '.repeat(depth);
    let result = `${indent}${node.nodeType}`;

    // 添加节点特定信息
    switch (node.nodeType) {
        case 'Literal':
            result += ` (${typeof node.value}: ${JSON.stringify(node.value)})`;
            break;
        case 'Identifier':
            result += ` (${node.name})`;
            break;
        case 'BinaryExpression':
            result += ` (${node.operator})`;
            break;
        case 'VariableDeclaration':
            result += ` (${node.kind})`;
            break;
    }

    result += '\n';

    // 递归处理子节点
    for (const key of Object.keys(node)) {
        const value = node[key];
        if (key === 'nodeType' || key === 'line' || key === 'column') continue;

        if (Array.isArray(value)) {
            if (value.length > 0) {
                result += `${indent}  ${key}:\n`;
                value.forEach(child => {
                    if (child && typeof child === 'object' && child.nodeType) {
                        result += formatASTNode(child, depth + 2);
                    }
                });
            }
        } else if (value && typeof value === 'object' && value.nodeType) {
            result += `${indent}  ${key}:\n`;
            result += formatASTNode(value, depth + 2);
        }
    }

    return result;
}

/**
 * 格式化优化统计信息
 * @param {Object} stats - 统计信息
 * @returns {string} - 格式化的统计信息
 */
function formatOptimizerStats(stats) {
    return `\n=== 优化统计 ===
优化轮次: ${stats.passes}
常量折叠: ${stats.constantFolds}
死代码消除: ${stats.deadCodeEliminations}
表达式简化: ${stats.expressionSimplifications}
控制流优化: ${stats.controlFlowOptimizations}
AST节点数变化: ${stats.originalNodes} → ${stats.optimizedNodes} (减少 ${stats.originalNodes - stats.optimizedNodes})
优化耗时: ${stats.duration}ms
优化效果: ${stats.reductionPercentage.toFixed(2)}%`;
}

/**
 * 计算AST节点数量
 * @param {Object} node - AST节点
 * @returns {number} - 节点数量
 */
function countASTNodes(node) {
    if (!node || typeof node !== 'object') return 0;

    let count = 1; // 当前节点

    for (const key of Object.keys(node)) {
        const value = node[key];
        if (Array.isArray(value)) {
            value.forEach(child => {
                if (child && typeof child === 'object' && child.nodeType) {
                    count += countASTNodes(child);
                }
            });
        } else if (value && typeof value === 'object' && value.nodeType) {
            count += countASTNodes(value);
        }
    }

    return count;
}

/**
 * 执行代码优化
 * @param {string} code - 源代码
 * @param {string} testName - 测试名称
 * @returns {Object} - 优化结果
 */
function performOptimization(code, testName = '未命名测试') {
    console.log(`\n🚀 开始代码优化: ${testName}`);
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
        const originalAST = parser.parse();

        if (parser.errors.length > 0) {
            console.log('\n❌ 语法分析错误:');
            parser.errors.forEach(error => console.log(`  ${error}`));
            return { success: false, stage: 'parser', errors: parser.errors };
        }

        // 优化统计
        const stats = {
            passes: 0,
            constantFolds: 0,
            deadCodeEliminations: 0,
            expressionSimplifications: 0,
            controlFlowOptimizations: 0,
            originalNodes: countASTNodes(originalAST),
            optimizedNodes: 0,
            duration: 0,
            reductionPercentage: 0
        };

        console.log('\n📊 优化前AST:');
        console.log(formatASTNode(originalAST));

        // 代码优化
        const optimizer = new Optimizer(originalAST, {
            onEnter: (node) => {
                // 可以在这里添加进入节点时的统计
            },
            onExit: (node) => {
                // 可以在这里添加退出节点时的统计
            }
        });

        const optimizedAST = optimizer.optimize();
        stats.passes = 1; // 简化统计，实际可能有多轮优化

        // 常量折叠优化
        const constantFolder = new ConstantFolder();
        const constantFoldedAST = constantFolder.fold(optimizedAST);
        stats.constantFolds = constantFolder.foldCount || 0;

        // 死代码消除优化
        const deadCodeEliminator = new DeadCodeEliminator();
        const finalAST = deadCodeEliminator.eliminate(constantFoldedAST);
        stats.deadCodeEliminations = deadCodeEliminator.eliminatedCount || 0;

        const endTime = Date.now();
        stats.duration = endTime - startTime;
        stats.optimizedNodes = countASTNodes(finalAST);
        stats.reductionPercentage = ((stats.originalNodes - stats.optimizedNodes) / stats.originalNodes) * 100;

        console.log('\n📊 优化后AST:');
        console.log(formatASTNode(finalAST));

        // 显示结果
        console.log('\n✅ 代码优化完成');

        // 显示统计信息
        console.log(formatOptimizerStats(stats));

        // 优化效果分析
        if (stats.reductionPercentage > 0) {
            console.log(`\n🎯 优化效果: 代码复杂度降低了 ${stats.reductionPercentage.toFixed(2)}%`);
        } else if (stats.reductionPercentage === 0) {
            console.log('\n📝 优化效果: 代码结构未发生变化');
        } else {
            console.log('\n⚠️  优化效果: 代码复杂度略有增加（可能由于优化过程中的中间步骤）');
        }

        return {
            success: true,
            originalAST,
            optimizedAST: finalAST,
            stats,
            constantFolder,
            deadCodeEliminator
        };

    } catch (error) {
        console.error('\n💥 优化过程中发生错误:', error.message);
        return { success: false, stage: 'optimizer', error: error.message };
    }
}

/**
 * 测试用例集合
 */
const testCases = [
    {
        name: '常量折叠 - 算术运算',
        code: `
let x = 5 + 3;
let y = 10 * 2;
let z = 15 - 7;
let w = 20 / 4;
console.log(x, y, z, w);`
    },
    {
        name: '常量折叠 - 逻辑运算',
        code: `
let a = true && false;
let b = true || false;
let c = !true;
let d = 5 > 3;
console.log(a, b, c, d);`
    },
    {
        name: '常量折叠 - 字符串操作',
        code: `
let greeting = "Hello" + " " + "World";
let message = "Count: " + (5 + 3);
console.log(greeting, message);`
    },
    {
        name: '死代码消除 - 不可达代码',
        code: `
let x = 10;
if (false) {
    let y = 20; // 死代码
    console.log(y);
}
console.log(x);`
    },
    {
        name: '死代码消除 - 未使用变量',
        code: `
let used = 10;
let unused = 20; // 未使用的变量
let alsoUnused = 30; // 未使用的变量
console.log(used);`
    },
    {
        name: '表达式简化',
        code: `
let x = 10;
let y = x + 0; // 可简化为 x
let z = x * 1; // 可简化为 x
let w = x - 0; // 可简化为 x
console.log(y, z, w);`
    },
    {
        name: '复合优化',
        code: `
let a = 5 + 3; // 常量折叠
let b = a * 1; // 表达式简化
if (true) {
    console.log(b);
} else {
    let unused = 100; // 死代码
    console.log(unused);
}`
    },
    {
        name: '循环优化',
        code: `
for (let i = 0; i < 3; i++) {
    let constant = 5 + 3; // 循环不变量
    console.log(i, constant);
}

while (false) {
    console.log("never executed"); // 死代码
}`
    }
];

/**
 * 运行所有测试用例
 */
function runAllTests() {
    console.log('🚀 开始运行代码优化测试套件');
    console.log('='.repeat(60));

    const results = [];
    const startTime = Date.now();

    testCases.forEach((testCase, index) => {
        console.log(`\n📋 测试 ${index + 1}/${testCases.length}: ${testCase.name}`);
        const result = performOptimization(testCase.code, testCase.name);
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
        passed: results.filter(r => r.result.success).length,
        failed: results.filter(r => !r.result.success).length,
        totalOptimizations: results.reduce((sum, r) => {
            if (r.result.success && r.result.stats) {
                return sum + r.result.stats.constantFolds + r.result.stats.deadCodeEliminations;
            }
            return sum;
        }, 0),
        averageReduction: 0,
        totalTime
    };

    // 计算平均优化效果
    const successfulTests = results.filter(r => r.result.success && r.result.stats);
    if (successfulTests.length > 0) {
        summary.averageReduction = successfulTests.reduce((sum, r) => sum + r.result.stats.reductionPercentage, 0) / successfulTests.length;
    }

    console.log(`总测试数: ${summary.total}`);
    console.log(`通过测试: ${summary.passed}`);
    console.log(`失败测试: ${summary.failed}`);
    console.log(`总优化次数: ${summary.totalOptimizations}`);
    console.log(`平均优化效果: ${summary.averageReduction.toFixed(2)}%`);
    console.log(`总耗时: ${summary.totalTime}ms`);

    // 详细错误报告
    const failedTests = results.filter(r => !r.result.success);
    if (failedTests.length > 0) {
        console.log('\n❌ 失败测试详情:');
        failedTests.forEach(test => {
            console.log(`\n  ${test.name}:`);
            console.log(`    阶段: ${test.result.stage}`);
            if (test.result.errors) {
                test.result.errors.forEach(error => console.log(`    ${error}`));
            } else if (test.result.error) {
                console.log(`    ${test.result.error}`);
            }
        });
    }

    console.log('\n✅ 代码优化测试套件运行完成');
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
        performOptimization(customCode, '自定义测试');
    }
}

// 导出函数供其他模块使用
module.exports = {
    performOptimization,
    runAllTests,
    formatASTNode,
    formatOptimizerStats,
    countASTNodes,
    testCases
};