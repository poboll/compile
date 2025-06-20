#!/usr/bin/env node
/**
 * 代码生成器独立测试工具 - run-codegen.js
 * @description 提供代码生成器的完整测试套件和交互式测试功能
 * @module compiler/codegen/run-codegen
 * @author 编译系统课程设计
 * @date 2024
 * @version 1.0
 * 
 * 主要功能：
 * 1. 运行完整的代码生成测试套件
 * 2. 展示AST到目标代码的转换过程
 * 3. 支持多种目标代码格式
 * 4. 提供详细的生成统计信息
 * 5. 支持自定义代码生成测试用例
 * 6. 测量代码生成性能和质量
 */

const path = require('path');
const Lexer = require('../lexer/lexer');
const { Parser } = require('../parser/parser');
const { CodeGenerator } = require('./codegen');
const { Instruction } = require('./instruction');
const { TargetMachine } = require('./target-machine');

/**
 * 格式化生成的代码
 * @param {string} code - 生成的代码
 * @param {string} language - 目标语言
 * @returns {string} - 格式化的代码
 */
function formatGeneratedCode(code, language = 'javascript') {
    if (!code) return '(空代码)';
    
    // 简单的代码格式化
    const lines = code.split('\n');
    let indentLevel = 0;
    const formattedLines = [];
    
    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;
        
        // 减少缩进
        if (trimmed.includes('}') || trimmed.includes(']') || trimmed.includes(')'))
            indentLevel = Math.max(0, indentLevel - 1);
        
        // 添加缩进
        formattedLines.push('  '.repeat(indentLevel) + trimmed);
        
        // 增加缩进
        if (trimmed.includes('{') || trimmed.includes('[') || trimmed.includes('('))
            indentLevel++;
    });
    
    return formattedLines.join('\n');
}

/**
 * 格式化代码生成统计信息
 * @param {Object} stats - 统计信息
 * @returns {string} - 格式化的统计信息
 */
function formatCodegenStats(stats) {
    return `\n=== 代码生成统计 ===
目标平台: ${stats.targetPlatform}
生成的代码行数: ${stats.generatedLines}
生成的指令数: ${stats.instructionCount}
变量声明: ${stats.variableDeclarations}
函数声明: ${stats.functionDeclarations}
表达式语句: ${stats.expressionStatements}
控制流语句: ${stats.controlFlowStatements}
代码大小: ${stats.codeSize} 字符
生成耗时: ${stats.duration}ms
代码密度: ${(stats.instructionCount / stats.generatedLines).toFixed(2)} 指令/行`;
}

/**
 * 分析生成的代码
 * @param {string} code - 生成的代码
 * @returns {Object} - 代码分析结果
 */
function analyzeGeneratedCode(code) {
    if (!code) return { lines: 0, size: 0, complexity: 0 };
    
    const lines = code.split('\n').filter(line => line.trim().length > 0);
    const size = code.length;
    
    // 简单的复杂度计算（基于控制流关键字）
    const complexityKeywords = ['if', 'else', 'while', 'for', 'switch', 'case', 'try', 'catch'];
    let complexity = 1; // 基础复杂度
    
    complexityKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        const matches = code.match(regex);
        if (matches) complexity += matches.length;
    });
    
    return {
        lines: lines.length,
        size,
        complexity,
        avgLineLength: lines.length > 0 ? size / lines.length : 0
    };
}

/**
 * 执行代码生成
 * @param {string} code - 源代码
 * @param {string} testName - 测试名称
 * @param {string} targetPlatform - 目标平台
 * @returns {Object} - 生成结果
 */
function performCodeGeneration(code, testName = '未命名测试', targetPlatform = 'javascript') {
    console.log(`\n⚙️  开始代码生成: ${testName}`);
    console.log('=' .repeat(50));
    console.log('源代码:');
    console.log(code);
    console.log('=' .repeat(50));
    
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
        
        // 代码生成统计
        const stats = {
            targetPlatform,
            generatedLines: 0,
            instructionCount: 0,
            variableDeclarations: 0,
            functionDeclarations: 0,
            expressionStatements: 0,
            controlFlowStatements: 0,
            codeSize: 0,
            duration: 0
        };
        
        console.log('\n📊 输入AST结构:');
        console.log(JSON.stringify(ast, null, 2).substring(0, 500) + '...');
        
        // 代码生成
        const codeGenerator = new CodeGenerator(ast, {
            onEnter: (node) => {
                switch (node.nodeType) {
                    case 'VariableDeclaration':
                        stats.variableDeclarations++;
                        break;
                    case 'FunctionDeclaration':
                        stats.functionDeclarations++;
                        break;
                    case 'ExpressionStatement':
                        stats.expressionStatements++;
                        break;
                    case 'IfStatement':
                    case 'WhileStatement':
                    case 'ForStatement':
                        stats.controlFlowStatements++;
                        break;
                }
            },
            onExit: (node) => {
                // 可以在这里添加退出时的统计
            }
        });
        
        const generatedCode = codeGenerator.generate();
        
        const endTime = Date.now();
        stats.duration = endTime - startTime;
        
        // 分析生成的代码
        const codeAnalysis = analyzeGeneratedCode(generatedCode);
        stats.generatedLines = codeAnalysis.lines;
        stats.codeSize = codeAnalysis.size;
        stats.instructionCount = codeAnalysis.lines; // 简化统计
        
        // 显示生成的代码
        console.log('\n📄 生成的代码:');
        console.log('─'.repeat(40));
        console.log(formatGeneratedCode(generatedCode, targetPlatform));
        console.log('─'.repeat(40));
        
        // 显示结果
        console.log('\n✅ 代码生成完成');
        
        // 显示统计信息
        console.log(formatCodegenStats(stats));
        
        // 代码质量分析
        console.log('\n🔍 代码质量分析:');
        console.log(`  代码行数: ${codeAnalysis.lines}`);
        console.log(`  代码大小: ${codeAnalysis.size} 字符`);
        console.log(`  平均行长: ${codeAnalysis.avgLineLength.toFixed(1)} 字符/行`);
        console.log(`  圈复杂度: ${codeAnalysis.complexity}`);
        
        // 质量评估
        let qualityRating = '优秀';
        if (codeAnalysis.complexity > 10) qualityRating = '复杂';
        else if (codeAnalysis.complexity > 5) qualityRating = '中等';
        else if (codeAnalysis.avgLineLength > 100) qualityRating = '冗长';
        
        console.log(`  质量评级: ${qualityRating}`);
        
        return {
            success: true,
            ast,
            generatedCode,
            stats,
            codeAnalysis,
            qualityRating
        };
        
    } catch (error) {
        console.error('\n💥 代码生成过程中发生错误:', error.message);
        return { success: false, stage: 'codegen', error: error.message };
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
const message = "Hello, World!";
var flag = true;
console.log(x, message, flag);`
    },
    {
        name: '函数声明和调用',
        code: `
function add(a, b) {
    return a + b;
}

function greet(name) {
    return "Hello, " + name + "!";
}

let result = add(5, 3);
let greeting = greet("Alice");
console.log(result, greeting);`
    },
    {
        name: '条件语句',
        code: `
let x = 10;

if (x > 5) {
    console.log("x is greater than 5");
} else {
    console.log("x is not greater than 5");
}

let y = x > 0 ? "positive" : "non-positive";
console.log(y);`
    },
    {
        name: '循环语句',
        code: `
for (let i = 0; i < 5; i++) {
    console.log("Iteration:", i);
}

let j = 0;
while (j < 3) {
    console.log("While loop:", j);
    j++;
}`
    },
    {
        name: '复杂表达式',
        code: `
let a = 10;
let b = 20;
let c = 30;

let result1 = a + b * c;
let result2 = (a + b) * c;
let result3 = a > b ? a : b;
let result4 = a && b || c;

console.log(result1, result2, result3, result4);`
    },
    {
        name: '嵌套结构',
        code: `
function processArray(arr) {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] > 0) {
            if (arr[i] % 2 === 0) {
                console.log("Even positive:", arr[i]);
            } else {
                console.log("Odd positive:", arr[i]);
            }
        }
    }
}

processArray([1, 2, -3, 4, 5]);`
    },
    {
        name: '赋值和更新',
        code: `
let counter = 0;
counter = counter + 1;
counter += 5;
counter++;

let obj = { x: 10, y: 20 };
obj.x = obj.x * 2;
obj.y += obj.x;

console.log(counter, obj);`
    },
    {
        name: '混合语言特性',
        code: `
const PI = 3.14159;

function calculateArea(radius) {
    if (radius <= 0) {
        return 0;
    }
    return PI * radius * radius;
}

function processRadii(radii) {
    let totalArea = 0;
    for (let i = 0; i < radii.length; i++) {
        let area = calculateArea(radii[i]);
        totalArea += area;
        console.log("Radius:", radii[i], "Area:", area);
    }
    return totalArea;
}

let areas = processRadii([1, 2, 3, 4, 5]);
console.log("Total area:", areas);`
    }
];

/**
 * 运行所有测试用例
 */
function runAllTests(targetPlatform = 'javascript') {
    console.log('🚀 开始运行代码生成测试套件');
    console.log(`🎯 目标平台: ${targetPlatform}`);
    console.log('=' .repeat(60));
    
    const results = [];
    const startTime = Date.now();
    
    testCases.forEach((testCase, index) => {
        console.log(`\n📋 测试 ${index + 1}/${testCases.length}: ${testCase.name}`);
        const result = performCodeGeneration(testCase.code, testCase.name, targetPlatform);
        results.push({ ...testCase, result });
    });
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // 汇总统计
    console.log('\n' + '=' .repeat(60));
    console.log('📊 测试汇总统计');
    console.log('=' .repeat(60));
    
    const summary = {
        total: results.length,
        passed: results.filter(r => r.result.success).length,
        failed: results.filter(r => !r.result.success).length,
        totalLines: results.reduce((sum, r) => {
            return sum + (r.result.success ? r.result.stats.generatedLines : 0);
        }, 0),
        totalSize: results.reduce((sum, r) => {
            return sum + (r.result.success ? r.result.stats.codeSize : 0);
        }, 0),
        averageComplexity: 0,
        totalTime
    };
    
    // 计算平均复杂度
    const successfulTests = results.filter(r => r.result.success && r.result.codeAnalysis);
    if (successfulTests.length > 0) {
        summary.averageComplexity = successfulTests.reduce((sum, r) => sum + r.result.codeAnalysis.complexity, 0) / successfulTests.length;
    }
    
    console.log(`总测试数: ${summary.total}`);
    console.log(`通过测试: ${summary.passed}`);
    console.log(`失败测试: ${summary.failed}`);
    console.log(`生成代码总行数: ${summary.totalLines}`);
    console.log(`生成代码总大小: ${summary.totalSize} 字符`);
    console.log(`平均圈复杂度: ${summary.averageComplexity.toFixed(2)}`);
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
    
    // 质量分析
    const qualityDistribution = {};
    successfulTests.forEach(test => {
        const quality = test.result.qualityRating;
        qualityDistribution[quality] = (qualityDistribution[quality] || 0) + 1;
    });
    
    if (Object.keys(qualityDistribution).length > 0) {
        console.log('\n🏆 代码质量分布:');
        Object.entries(qualityDistribution).forEach(([quality, count]) => {
            console.log(`  ${quality}: ${count} 个测试`);
        });
    }
    
    console.log('\n✅ 代码生成测试套件运行完成');
    return summary;
}

// 主程序
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        // 运行所有测试
        runAllTests();
    } else if (args[0] === '--target' && args[1]) {
        // 指定目标平台
        runAllTests(args[1]);
    } else {
        // 运行自定义代码测试
        const customCode = args.join(' ');
        performCodeGeneration(customCode, '自定义测试');
    }
}

// 导出函数供其他模块使用
module.exports = {
    performCodeGeneration,
    runAllTests,
    formatGeneratedCode,
    formatCodegenStats,
    analyzeGeneratedCode,
    testCases
};