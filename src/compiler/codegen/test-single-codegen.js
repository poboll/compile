#!/usr/bin/env node
/**
 * 代码生成器单个代码片段测试工具 - test-single-codegen.js
 * @description 快速测试单个代码片段的代码生成功能
 * @module compiler/codegen/test-single-codegen
 * @author poboll
 * @date 2024
 * @version 1.0
 * 
 * 主要功能：
 * 1. 快速测试单个代码片段的代码生成
 * 2. 显示AST到目标代码的转换过程
 * 3. 展示生成代码的质量分析
 * 4. 提供多种目标平台支持
 * 5. 支持命令行参数输入
 * 6. 生成简洁的代码生成报告
 */

const Lexer = require('../lexer/lexer');
const { Parser } = require('../parser/parser');
const { CodeGenerator } = require('./codegen');

/**
 * 简化的AST显示
 * @param {Object} node - AST节点
 * @param {number} depth - 缩进深度
 * @returns {string} - 简化的AST字符串
 */
function simplifyAST(node, depth = 0) {
    if (!node) return '';

    const indent = '  '.repeat(depth);
    let result = '';

    switch (node.nodeType) {
        case 'Program':
            result = `${indent}Program (${node.body ? node.body.length : 0} statements)`;
            break;
        case 'VariableDeclaration':
            const id = node.identifier ? node.identifier.name : 'unknown';
            result = `${indent}${node.kind} ${id}`;
            break;
        case 'FunctionDeclaration':
            const funcName = node.identifier ? node.identifier.name : 'anonymous';
            const paramCount = node.params ? node.params.length : 0;
            result = `${indent}function ${funcName}(${paramCount} params)`;
            break;
        case 'BinaryExpression':
            result = `${indent}BinaryExpr (${node.operator})`;
            break;
        case 'Literal':
            result = `${indent}Literal (${typeof node.value}: ${JSON.stringify(node.value)})`;
            break;
        case 'Identifier':
            result = `${indent}Identifier (${node.name})`;
            break;
        case 'ExpressionStatement':
            result = `${indent}ExpressionStatement`;
            break;
        case 'CallExpression':
            const argCount = node.arguments ? node.arguments.length : 0;
            result = `${indent}CallExpr (${argCount} args)`;
            break;
        case 'IfStatement':
            result = `${indent}IfStatement`;
            break;
        case 'WhileStatement':
            result = `${indent}WhileStatement`;
            break;
        case 'BlockStatement':
            const stmtCount = node.body ? node.body.length : 0;
            result = `${indent}Block (${stmtCount} statements)`;
            break;
        default:
            result = `${indent}${node.nodeType}`;
    }

    return result;
}

/**
 * 分析生成的代码
 * @param {string} code - 生成的代码
 * @returns {Object} - 代码分析结果
 */
function analyzeCode(code) {
    if (!code) return { lines: 0, size: 0, complexity: 0, keywords: {} };

    const lines = code.split('\n').filter(line => line.trim().length > 0);
    const size = code.length;

    // 关键字统计
    const keywords = {
        'let': (code.match(/\blet\b/g) || []).length,
        'const': (code.match(/\bconst\b/g) || []).length,
        'var': (code.match(/\bvar\b/g) || []).length,
        'function': (code.match(/\bfunction\b/g) || []).length,
        'if': (code.match(/\bif\b/g) || []).length,
        'else': (code.match(/\belse\b/g) || []).length,
        'while': (code.match(/\bwhile\b/g) || []).length,
        'for': (code.match(/\bfor\b/g) || []).length,
        'return': (code.match(/\breturn\b/g) || []).length
    };

    // 圈复杂度计算
    let complexity = 1;
    complexity += keywords.if + keywords.while + keywords.for;

    return {
        lines: lines.length,
        size,
        complexity,
        keywords,
        avgLineLength: lines.length > 0 ? size / lines.length : 0
    };
}

/**
 * 显示代码统计
 * @param {Object} stats - 统计信息
 */
function displayStats(stats) {
    console.log('\n📊 代码生成统计:');
    console.log(`  生成代码行数: ${stats.lines}`);
    console.log(`  代码大小: ${stats.size} 字符`);
    console.log(`  平均行长: ${stats.avgLineLength.toFixed(1)} 字符/行`);
    console.log(`  圈复杂度: ${stats.complexity}`);
    console.log(`  生成耗时: ${stats.duration}ms`);

    // 关键字统计
    const totalKeywords = Object.values(stats.keywords).reduce((sum, count) => sum + count, 0);
    if (totalKeywords > 0) {
        console.log('\n🔤 关键字统计:');
        Object.entries(stats.keywords).forEach(([keyword, count]) => {
            if (count > 0) {
                console.log(`  ${keyword}: ${count}`);
            }
        });
    }
}

/**
 * 测试单个代码片段的代码生成
 * @param {string} code - 源代码
 * @param {string} targetPlatform - 目标平台
 * @returns {Object} - 生成结果
 */
function testSingleCode(code, targetPlatform = 'javascript') {
    console.log('⚙️  代码生成测试');
    console.log(`🎯 目标平台: ${targetPlatform}`);
    console.log('='.repeat(40));
    console.log('代码:');
    console.log(code);
    console.log('='.repeat(40));

    const startTime = Date.now();

    try {
        // 1. 词法分析
        console.log('\n1️⃣ 词法分析...');
        const lexer = new Lexer(code);
        const tokens = lexer.tokenize();

        console.log(`   找到 ${tokens.length} 个标记`);

        if (lexer.errors.length > 0) {
            console.log(`   ❌ 词法错误 ${lexer.errors.length} 个:`);
            lexer.errors.forEach(error => console.log(`     ${error}`));
            return { success: false, stage: 'lexer', errors: lexer.errors };
        } else {
            console.log('   ✅ 词法分析通过');
        }

        // 2. 语法分析
        console.log('\n2️⃣ 语法分析...');
        const parser = new Parser(tokens);
        const ast = parser.parse();

        if (parser.errors.length > 0) {
            console.log(`   ❌ 语法错误 ${parser.errors.length} 个:`);
            parser.errors.forEach(error => console.log(`     ${error}`));
            return { success: false, stage: 'parser', errors: parser.errors };
        } else {
            console.log('   ✅ 语法分析通过');
        }

        // 3. 显示AST结构
        console.log('\n3️⃣ AST结构:');
        console.log(simplifyAST(ast));

        // 4. 代码生成
        console.log('\n4️⃣ 代码生成...');

        const codeGenerator = new CodeGenerator(ast, {
            onEnter: (node) => {
                // 可以在这里添加进入节点时的处理
            },
            onExit: (node) => {
                // 可以在这里添加退出节点时的处理
            }
        });

        const generatedCode = codeGenerator.generate();

        const endTime = Date.now();
        const duration = endTime - startTime;

        // 5. 分析生成的代码
        const codeAnalysis = analyzeCode(generatedCode);
        codeAnalysis.duration = duration;

        // 显示生成的代码
        console.log('\n📄 生成的代码:');
        console.log('─'.repeat(40));
        if (generatedCode) {
            console.log(generatedCode);
        } else {
            console.log('(空代码)');
        }
        console.log('─'.repeat(40));

        // 显示统计信息
        displayStats(codeAnalysis);

        // 质量评估
        console.log('\n🏆 代码质量评估:');
        let qualityScore = 100;
        let qualityIssues = [];

        if (codeAnalysis.complexity > 10) {
            qualityScore -= 20;
            qualityIssues.push('复杂度较高');
        }

        if (codeAnalysis.avgLineLength > 120) {
            qualityScore -= 10;
            qualityIssues.push('行长度过长');
        }

        if (codeAnalysis.lines === 0) {
            qualityScore = 0;
            qualityIssues.push('未生成代码');
        }

        let qualityRating = '优秀';
        if (qualityScore < 60) qualityRating = '需改进';
        else if (qualityScore < 80) qualityRating = '良好';

        console.log(`  质量评分: ${qualityScore}/100`);
        console.log(`  质量等级: ${qualityRating}`);

        if (qualityIssues.length > 0) {
            console.log(`  发现问题: ${qualityIssues.join(', ')}`);
        } else {
            console.log('  ✅ 未发现质量问题');
        }

        // 总结
        console.log('\n' + '='.repeat(40));
        console.log(`📋 代码生成完成 - 生成 ${codeAnalysis.lines} 行代码`);
        console.log(`⏱️  总耗时: ${duration}ms`);

        return {
            success: true,
            ast,
            generatedCode,
            codeAnalysis,
            qualityScore,
            qualityRating,
            lexerErrors: lexer.errors,
            parserErrors: parser.errors
        };

    } catch (error) {
        console.error('\n💥 代码生成过程中发生错误:', error.message);
        console.error('错误堆栈:', error.stack);
        return { success: false, stage: 'codegen', error: error.message };
    }
}

/**
 * 显示使用说明
 */
function showUsage() {
    console.log('\n📖 使用说明:');
    console.log('  node test-single-codegen.js                      # 使用默认代码测试');
    console.log('  node test-single-codegen.js "let x = 10;"        # 测试指定代码');
    console.log('  node test-single-codegen.js "function f() {}"    # 测试函数声明');
    console.log('  node test-single-codegen.js --target c "code"    # 指定目标平台');
    console.log('\n💡 提示: 使用引号包围代码以避免shell解析问题');
    console.log('\n🎯 支持的目标平台:');
    console.log('  • javascript (默认): 生成JavaScript代码');
    console.log('  • c: 生成C语言代码');
    console.log('  • python: 生成Python代码');
    console.log('  • java: 生成Java代码');
}

// 默认测试代码
const defaultCode = `
function fibonacci(n) {
    if (n <= 1) {
        return n;
    }
    return fibonacci(n - 1) + fibonacci(n - 2);
}

let result = fibonacci(10);
console.log("Fibonacci(10) =", result);

for (let i = 0; i < 5; i++) {
    console.log("fib(", i, ") =", fibonacci(i));
}
`;

// 主程序
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        // 使用默认代码
        console.log('🎯 使用默认测试代码:');
        testSingleCode(defaultCode);
    } else if (args[0] === '--help' || args[0] === '-h') {
        showUsage();
    } else if (args[0] === '--target' && args[1]) {
        // 指定目标平台
        const targetPlatform = args[1];
        const customCode = args.slice(2).join(' ') || defaultCode;
        console.log(`🎯 测试代码生成 (目标: ${targetPlatform}):`);
        testSingleCode(customCode, targetPlatform);
    } else {
        // 使用命令行参数提供的代码
        const customCode = args.join(' ');
        console.log('🎯 测试自定义代码:');
        testSingleCode(customCode);
    }

    showUsage();
}

// 导出函数供其他模块使用
module.exports = {
    testSingleCode,
    simplifyAST,
    analyzeCode,
    displayStats
};