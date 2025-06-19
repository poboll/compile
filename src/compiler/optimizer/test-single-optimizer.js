#!/usr/bin/env node
/**
 * 代码优化器单个代码片段测试工具 - test-single-optimizer.js
 * @description 快速测试单个代码片段的优化功能
 * @module compiler/optimizer/test-single-optimizer
 * @author poboll
 * @date 2025
 * @version 1.0
 * 
 * 主要功能：
 * 1. 快速测试单个代码片段的优化
 * 2. 显示优化前后的对比
 * 3. 展示具体的优化步骤
 * 4. 提供优化效果统计
 * 5. 支持命令行参数输入
 * 6. 生成简洁的优化报告
 */

const Lexer = require('../lexer/lexer');
const { Parser } = require('../parser/parser');
const Optimizer = require('./optimizer');
const { ConstantFolder } = require('./constant-folder');
const { DeadCodeEliminator } = require('./dead-code-eliminator');

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
            result = node.body.map(child => simplifyAST(child, depth)).join('\n');
            break;
        case 'VariableDeclaration':
            const id = node.identifier ? node.identifier.name : 'unknown';
            const init = node.initializer ? ` = ${simplifyAST(node.initializer)}` : '';
            result = `${indent}${node.kind} ${id}${init}`;
            break;
        case 'FunctionDeclaration':
            const funcName = node.identifier ? node.identifier.name : 'anonymous';
            const params = node.params ? node.params.map(p => p.name || 'param').join(', ') : '';
            result = `${indent}function ${funcName}(${params}) { ... }`;
            break;
        case 'BinaryExpression':
            const left = simplifyAST(node.left);
            const right = simplifyAST(node.right);
            result = `(${left} ${node.operator} ${right})`;
            break;
        case 'Literal':
            result = JSON.stringify(node.value);
            break;
        case 'Identifier':
            result = node.name;
            break;
        case 'ExpressionStatement':
            result = `${indent}${simplifyAST(node.expression)}`;
            break;
        case 'CallExpression':
            const callee = simplifyAST(node.callee);
            const args = node.arguments ? node.arguments.map(arg => simplifyAST(arg)).join(', ') : '';
            result = `${callee}(${args})`;
            break;
        case 'IfStatement':
            result = `${indent}if (${simplifyAST(node.test)}) { ... }`;
            break;
        case 'WhileStatement':
            result = `${indent}while (${simplifyAST(node.test)}) { ... }`;
            break;
        default:
            result = `${indent}${node.nodeType}`;
    }

    return result;
}

/**
 * 计算AST节点数量
 * @param {Object} node - AST节点
 * @returns {number} - 节点数量
 */
function countNodes(node) {
    if (!node || typeof node !== 'object') return 0;

    let count = 1;

    for (const key of Object.keys(node)) {
        const value = node[key];
        if (Array.isArray(value)) {
            value.forEach(child => {
                if (child && typeof child === 'object' && child.nodeType) {
                    count += countNodes(child);
                }
            });
        } else if (value && typeof value === 'object' && value.nodeType) {
            count += countNodes(value);
        }
    }

    return count;
}

/**
 * 显示优化统计
 * @param {Object} stats - 统计信息
 */
function displayStats(stats) {
    console.log('\n📊 优化统计:');
    console.log(`  节点数变化: ${stats.originalNodes} → ${stats.optimizedNodes}`);
    console.log(`  节点减少: ${stats.originalNodes - stats.optimizedNodes} (${stats.reductionPercentage.toFixed(1)}%)`);
    console.log(`  常量折叠: ${stats.constantFolds} 次`);
    console.log(`  死代码消除: ${stats.deadCodeEliminations} 次`);
    console.log(`  优化耗时: ${stats.duration}ms`);
}

/**
 * 测试单个代码片段的优化
 * @param {string} code - 源代码
 * @returns {Object} - 优化结果
 */
function testSingleCode(code) {
    console.log('🚀 代码优化测试');
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
        const originalAST = parser.parse();

        if (parser.errors.length > 0) {
            console.log(`   ❌ 语法错误 ${parser.errors.length} 个:`);
            parser.errors.forEach(error => console.log(`     ${error}`));
            return { success: false, stage: 'parser', errors: parser.errors };
        } else {
            console.log('   ✅ 语法分析通过');
        }

        // 3. 代码优化
        console.log('\n3️⃣ 代码优化...');

        const stats = {
            originalNodes: countNodes(originalAST),
            optimizedNodes: 0,
            constantFolds: 0,
            deadCodeEliminations: 0,
            duration: 0,
            reductionPercentage: 0
        };

        console.log('\n📋 优化前AST:');
        console.log(simplifyAST(originalAST));

        // 基本优化
        const optimizer = new Optimizer(originalAST);
        let optimizedAST = optimizer.optimize();

        // 常量折叠
        console.log('\n🔧 执行常量折叠...');
        const constantFolder = new ConstantFolder();
        optimizedAST = constantFolder.fold(optimizedAST);
        stats.constantFolds = constantFolder.foldCount || 0;

        if (stats.constantFolds > 0) {
            console.log(`   ✅ 折叠了 ${stats.constantFolds} 个常量表达式`);
        } else {
            console.log('   📝 未发现可折叠的常量表达式');
        }

        // 死代码消除
        console.log('\n🗑️  执行死代码消除...');
        const deadCodeEliminator = new DeadCodeEliminator();
        optimizedAST = deadCodeEliminator.eliminate(optimizedAST);
        stats.deadCodeEliminations = deadCodeEliminator.eliminatedCount || 0;

        if (stats.deadCodeEliminations > 0) {
            console.log(`   ✅ 消除了 ${stats.deadCodeEliminations} 个死代码块`);
        } else {
            console.log('   📝 未发现死代码');
        }

        const endTime = Date.now();
        stats.duration = endTime - startTime;
        stats.optimizedNodes = countNodes(optimizedAST);
        stats.reductionPercentage = ((stats.originalNodes - stats.optimizedNodes) / stats.originalNodes) * 100;

        console.log('\n📋 优化后AST:');
        console.log(simplifyAST(optimizedAST));

        // 显示统计信息
        displayStats(stats);

        // 优化效果评估
        console.log('\n🎯 优化效果评估:');
        if (stats.reductionPercentage > 10) {
            console.log('   🌟 显著优化：代码复杂度大幅降低');
        } else if (stats.reductionPercentage > 0) {
            console.log('   ✅ 轻微优化：代码有所改善');
        } else if (stats.reductionPercentage === 0) {
            console.log('   📝 无变化：代码已经很优化了');
        } else {
            console.log('   ⚠️  复杂度增加：可能是优化过程的中间步骤');
        }

        // 总结
        console.log('\n' + '='.repeat(40));
        const totalOptimizations = stats.constantFolds + stats.deadCodeEliminations;
        console.log(`📋 优化完成 - 总优化次数: ${totalOptimizations}`);
        console.log(`⏱️  总耗时: ${stats.duration}ms`);

        return {
            success: true,
            originalAST,
            optimizedAST,
            stats,
            lexerErrors: lexer.errors,
            parserErrors: parser.errors
        };

    } catch (error) {
        console.error('\n💥 优化过程中发生错误:', error.message);
        console.error('错误堆栈:', error.stack);
        return { success: false, stage: 'optimizer', error: error.message };
    }
}

/**
 * 显示使用说明
 */
function showUsage() {
    console.log('\n📖 使用说明:');
    console.log('  node test-single-optimizer.js                    # 使用默认代码测试');
    console.log('  node test-single-optimizer.js "let x = 5 + 3;"   # 测试常量折叠');
    console.log('  node test-single-optimizer.js "if(false){...}"   # 测试死代码消除');
    console.log('\n💡 提示: 使用引号包围代码以避免shell解析问题');
    console.log('\n🎯 优化类型:');
    console.log('  • 常量折叠: 计算编译时可确定的表达式');
    console.log('  • 死代码消除: 移除永远不会执行的代码');
    console.log('  • 表达式简化: 简化数学和逻辑表达式');
}

// 默认测试代码
const defaultCode = `
let x = 5 + 3; // 常量折叠
let y = x * 1; // 表达式简化

if (false) {
    let unused = 100; // 死代码
    console.log(unused);
}

if (true) {
    console.log(x, y);
}

let z = 10 - 0; // 表达式简化
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
    countNodes,
    displayStats
};