/**
 * 语法分析器单代码片段测试工具 - test-single-parser.js
 * @description 快速测试单个代码片段的语法分析结果
 * @author AI Assistant
 * @date 2025
 */

const Lexer = require('../lexer/lexer');
const { Parser } = require('./parser');
const { formatASTNode, printParserStats } = require('./run-parser');

/**
 * 测试单个代码片段的语法分析
 * @param {string} sourceCode - 要分析的源代码
 */
function testSingleCode(sourceCode) {
    console.log('语法分析器 - 单代码片段测试');
    console.log('==============================');

    console.log('\n--- 源代码 ---');
    console.log(sourceCode);

    const startTime = Date.now();

    try {
        // 词法分析
        console.log('\n--- 词法分析阶段 ---');
        const lexer = new Lexer(sourceCode);
        const tokens = lexer.tokenize();
        const lexerErrors = lexer.getErrors();

        console.log(`Token数量: ${tokens.length}`);
        if (lexerErrors.length > 0) {
            console.log(`词法错误数: ${lexerErrors.length}`);
            lexerErrors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error.message}`);
            });
        } else {
            console.log('✅ 词法分析无错误');
        }

        // 显示Token列表（简化版）
        console.log('\nToken列表 (前10个):');
        const displayTokens = tokens.slice(0, 10);
        displayTokens.forEach((token, index) => {
            const pos = `${token.line}:${token.column}`;
            console.log(`  ${index + 1}. ${token.type.padEnd(12)} "${token.value}" (${pos})`);
        });
        if (tokens.length > 10) {
            console.log(`  ... 还有 ${tokens.length - 10} 个Token`);
        }

        // 语法分析
        console.log('\n--- 语法分析阶段 ---');
        const parser = new Parser(tokens);
        const ast = parser.parse();
        const parserErrors = parser.getErrors();

        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log('\n--- 抽象语法树 (AST) ---');
        console.log(formatASTNode(ast));

        // 统计信息
        printParserStats(ast, parserErrors, duration);

        // 总结
        const totalErrors = lexerErrors.length + parserErrors.length;
        console.log('\n--- 分析结果 ---');
        if (totalErrors === 0) {
            console.log('✅ 语法分析成功！代码语法正确。');
        } else {
            console.log(`❌ 发现 ${totalErrors} 个错误 (词法: ${lexerErrors.length}, 语法: ${parserErrors.length})`);
        }

        return {
            ast,
            tokens,
            lexerErrors,
            parserErrors,
            duration,
            success: totalErrors === 0
        };

    } catch (error) {
        console.error('\n❌ 运行时错误:', error.message);
        console.error('错误堆栈:', error.stack);
        return {
            error: error.message,
            success: false
        };
    }
}

/**
 * 主函数 - 处理命令行参数或使用默认测试代码
 */
function main() {
    // 获取命令行参数
    const args = process.argv.slice(2);

    let testCode;
    if (args.length > 0) {
        // 使用命令行参数作为测试代码
        testCode = args.join(' ');
    } else {
        // 使用默认测试代码
        testCode = `function fibonacci(n) {
    if (n <= 1) {
        return n;
    }
    return fibonacci(n - 1) + fibonacci(n - 2);
}

let result = fibonacci(10);
console.log("斐波那契数列第10项:", result);`;
    }

    testSingleCode(testCode);

    console.log('\n--- 使用说明 ---');
    console.log('1. 默认运行: node test-single-parser.js');
    console.log('2. 测试自定义代码: node test-single-parser.js "let x = 10; console.log(x);"');
    console.log('3. 在其他代码中使用: const { testSingleCode } = require("./test-single-parser");');
}

// 如果直接运行此脚本，则执行主函数
if (require.main === module) {
    main();
}

// 导出函数供其他模块使用
module.exports = {
    testSingleCode
};