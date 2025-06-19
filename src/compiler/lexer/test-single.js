/**
 * 词法分析器单个测试脚本 - test-single.js
 * @description 用于快速测试单个代码片段的词法分析
 * @module compiler/lexer/test-single
 * @author poboll
 * @date 2025
 * @version 1.0
 */

const Lexer = require('./lexer.js');

/**
 * 测试单个代码片段
 * @param {string} sourceCode - 要分析的源代码
 * @param {string} description - 测试描述
 */
function testSingleCode(sourceCode, description = '自定义测试') {
    console.log('='.repeat(60));
    console.log(`词法分析测试: ${description}`);
    console.log('='.repeat(60));

    // 显示源代码
    console.log('\n源代码:');
    console.log('-'.repeat(40));
    const lines = sourceCode.split('\n');
    lines.forEach((line, index) => {
        console.log(`${(index + 1).toString().padStart(2)}: ${line}`);
    });
    console.log('-'.repeat(40));

    // 创建词法分析器
    const lexer = new Lexer(sourceCode);

    console.log('\n开始词法分析...');
    const startTime = Date.now();

    // 执行分析
    const tokens = lexer.tokenize();
    const errors = lexer.getErrors();

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`词法分析完成 (耗时: ${duration}ms)`);

    // 输出结果
    console.log('\nToken序列:');
    console.log('-'.repeat(55));
    console.log('序号  类型         值              位置      详情');
    console.log('-'.repeat(55));

    tokens.forEach((token, index) => {
        const typeStr = token.type.padEnd(12);
        const valueStr = (token.value || 'null').toString().padEnd(15);
        const posStr = `[${token.line}:${token.column}]`.padEnd(8);
        let detail = '';

        // 添加详细信息
        switch (token.type) {
            case 'KEYWORD':
                detail = '关键字';
                break;
            case 'IDENTIFIER':
                detail = '标识符';
                break;
            case 'NUMBER':
                detail = '数字字面量';
                break;
            case 'STRING':
                detail = '字符串字面量';
                break;
            case 'OPERATOR':
                detail = '操作符';
                break;
            case 'EOF':
                detail = '文件结束';
                break;
            case 'UNKNOWN':
                detail = '未知字符';
                break;
            default:
                detail = token.type;
        }

        console.log(`${index.toString().padStart(3)}:  ${typeStr} ${valueStr} ${posStr} ${detail}`);
    });

    // 统计信息
    console.log('\n=== 统计信息 ===');
    const tokenStats = {};
    tokens.forEach(token => {
        tokenStats[token.type] = (tokenStats[token.type] || 0) + 1;
    });

    console.log('Token类型分布:');
    Object.entries(tokenStats).forEach(([type, count]) => {
        console.log(`  ${type.padEnd(12)}: ${count}`);
    });

    console.log(`\n总Token数量: ${tokens.length}`);
    console.log(`分析耗时: ${duration}ms`);

    // 错误信息
    if (errors.length > 0) {
        console.log(`\n=== 错误信息 (${errors.length}个) ===`);
        errors.forEach((error, index) => {
            console.log(`${index + 1}. [行${error.line}, 列${error.column}] ${error.message}`);
            if (error.value) {
                console.log(`   问题字符: '${error.value}'`);
            }
        });
    } else {
        console.log('\n✓ 词法分析成功，无错误');
    }

    return { tokens, errors, duration };
}

// 默认测试代码
const defaultTestCode = `
// 这是一个简单的测试程序
function calculateSum(a, b) {
    let result = a + b;
    if (result > 100) {
        console.log("结果很大: " + result);
    }
    return result;
}

let x = 10;
let y = 20;
let sum = calculateSum(x, y);
`;

// 主函数
function main() {
    console.log('词法分析器单个测试工具');
    console.log('作者: poboll');
    console.log(`测试时间: ${new Date().toLocaleString()}\n`);

    // 检查命令行参数
    const args = process.argv.slice(2);

    if (args.length > 0) {
        // 如果提供了参数，将其作为源代码
        const sourceCode = args.join(' ');
        testSingleCode(sourceCode, '命令行输入');
    } else {
        // 使用默认测试代码
        testSingleCode(defaultTestCode, '默认测试代码');

        console.log('\n使用说明:');
        console.log('1. 直接运行: node test-single.js');
        console.log('2. 测试自定义代码: node test-single.js "let x = 10;"');
        console.log('3. 在代码中调用: testSingleCode("your code here", "description")');
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

// 导出函数
module.exports = {
    testSingleCode,
    main
};