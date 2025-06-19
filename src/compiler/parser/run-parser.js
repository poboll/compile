/**
 * 语法分析器独立运行脚本 - run-parser.js
 * @description 独立运行语法分析器，提供详细的AST构建过程和错误信息
 * @author AI Assistant
 * @date 2025
 */

const Lexer = require('../lexer/lexer');
const { Parser } = require('./parser');

/**
 * 格式化AST节点输出
 * @param {Object} node - AST节点
 * @param {number} depth - 缩进深度
 * @returns {string} 格式化的AST字符串
 */
function formatASTNode(node, depth = 0) {
    if (!node) return 'null';

    const indent = '  '.repeat(depth);
    let result = `${indent}${node.nodeType}`;

    // 添加位置信息
    if (node.line !== undefined && node.column !== undefined) {
        result += ` (${node.line}:${node.column})`;
    }

    // 根据节点类型显示特定信息
    switch (node.nodeType) {
        case 'VariableDeclaration':
            result += ` [${node.kind}] ${node.identifier?.name || 'unknown'}`;
            if (node.initializer) {
                result += '\n' + formatASTNode(node.initializer, depth + 1);
            }
            break;

        case 'FunctionDeclaration':
            result += ` ${node.identifier?.name || 'anonymous'}`;
            if (node.params && node.params.length > 0) {
                result += ` (${node.params.map(p => p.name || 'param').join(', ')})`;
            } else {
                result += ' ()';
            }
            if (node.body) {
                result += '\n' + formatASTNode(node.body, depth + 1);
            }
            break;

        case 'BlockStatement':
            if (node.body && node.body.length > 0) {
                result += ` {${node.body.length} statements}`;
                node.body.forEach(stmt => {
                    result += '\n' + formatASTNode(stmt, depth + 1);
                });
            } else {
                result += ' {empty}';
            }
            break;

        case 'IfStatement':
            if (node.test) {
                result += '\n' + indent + '  test:';
                result += '\n' + formatASTNode(node.test, depth + 2);
            }
            if (node.consequent) {
                result += '\n' + indent + '  then:';
                result += '\n' + formatASTNode(node.consequent, depth + 2);
            }
            if (node.alternate) {
                result += '\n' + indent + '  else:';
                result += '\n' + formatASTNode(node.alternate, depth + 2);
            }
            break;

        case 'WhileStatement':
            if (node.test) {
                result += '\n' + indent + '  condition:';
                result += '\n' + formatASTNode(node.test, depth + 2);
            }
            if (node.body) {
                result += '\n' + indent + '  body:';
                result += '\n' + formatASTNode(node.body, depth + 2);
            }
            break;

        case 'BinaryExpression':
            result += ` [${node.operator || 'unknown'}]`;
            if (node.left) {
                result += '\n' + indent + '  left:';
                result += '\n' + formatASTNode(node.left, depth + 2);
            }
            if (node.right) {
                result += '\n' + indent + '  right:';
                result += '\n' + formatASTNode(node.right, depth + 2);
            }
            break;

        case 'UnaryExpression':
            result += ` [${node.operator || 'unknown'}]`;
            if (node.argument) {
                result += '\n' + formatASTNode(node.argument, depth + 1);
            }
            break;

        case 'CallExpression':
            if (node.callee) {
                result += ` ${node.callee.name || 'function'}`;
            }
            if (node.arguments && node.arguments.length > 0) {
                result += ` (${node.arguments.length} args)`;
                node.arguments.forEach((arg, i) => {
                    result += '\n' + indent + `  arg${i}:`;
                    result += '\n' + formatASTNode(arg, depth + 2);
                });
            } else {
                result += ' ()';
            }
            break;

        case 'AssignmentExpression':
            result += ` [${node.operator || '='}]`;
            if (node.left) {
                result += '\n' + indent + '  left:';
                result += '\n' + formatASTNode(node.left, depth + 2);
            }
            if (node.right) {
                result += '\n' + indent + '  right:';
                result += '\n' + formatASTNode(node.right, depth + 2);
            }
            break;

        case 'Identifier':
            result += ` "${node.name || 'unknown'}"`;
            break;

        case 'Literal':
            const valueStr = typeof node.value === 'string' ? `"${node.value}"` : String(node.value);
            result += ` ${valueStr}`;
            if (node.raw && node.raw !== String(node.value)) {
                result += ` (raw: ${node.raw})`;
            }
            break;

        case 'ExpressionStatement':
            if (node.expression) {
                result += '\n' + formatASTNode(node.expression, depth + 1);
            }
            break;

        case 'ReturnStatement':
            if (node.argument) {
                result += '\n' + formatASTNode(node.argument, depth + 1);
            }
            break;

        case 'Program':
            result += ` {${node.body?.length || 0} statements}`;
            if (node.body && node.body.length > 0) {
                node.body.forEach(stmt => {
                    result += '\n' + formatASTNode(stmt, depth + 1);
                });
            }
            break;

        default:
            // 对于未知节点类型，尝试显示一些通用属性
            const keys = Object.keys(node).filter(key =>
                key !== 'nodeType' && key !== 'line' && key !== 'column'
            );
            if (keys.length > 0) {
                result += ` {${keys.join(', ')}}`;
            }
            break;
    }

    return result;
}

/**
 * 打印语法分析统计信息
 * @param {Object} ast - 抽象语法树
 * @param {Array} errors - 错误列表
 * @param {number} duration - 分析耗时
 */
function printParserStats(ast, errors, duration) {
    console.log('\n=== 语法分析统计 ===');

    // 统计AST节点类型
    const nodeTypes = {};
    let totalNodes = 0;

    function countNodes(node) {
        if (!node || typeof node !== 'object') return;

        if (node.nodeType) {
            nodeTypes[node.nodeType] = (nodeTypes[node.nodeType] || 0) + 1;
            totalNodes++;
        }

        // 递归统计子节点
        Object.values(node).forEach(value => {
            if (Array.isArray(value)) {
                value.forEach(countNodes);
            } else if (value && typeof value === 'object') {
                countNodes(value);
            }
        });
    }

    countNodes(ast);

    console.log(`总节点数: ${totalNodes}`);
    console.log('节点类型分布:');
    Object.entries(nodeTypes)
        .sort(([, a], [, b]) => b - a)
        .forEach(([type, count]) => {
            console.log(`  ${type}: ${count}`);
        });

    console.log(`语法错误数: ${errors.length}`);
    console.log(`分析耗时: ${duration}ms`);

    if (errors.length > 0) {
        console.log('\n=== 语法错误详情 ===');
        errors.forEach((error, index) => {
            console.log(`${index + 1}. ${error.message} (行${error.line}, 列${error.column})`);
        });
    }
}

/**
 * 运行单个测试用例
 * @param {string} name - 测试用例名称
 * @param {string} code - 源代码
 */
function runTestCase(name, code) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`测试用例: ${name}`);
    console.log(`${'='.repeat(60)}`);

    console.log('\n--- 源代码 ---');
    console.log(code);

    const startTime = Date.now();

    try {
        // 词法分析
        const lexer = new Lexer(code);
        const tokens = lexer.tokenize();
        const lexerErrors = lexer.getErrors();

        console.log('\n--- 词法分析结果 ---');
        console.log(`Token数量: ${tokens.length}`);
        if (lexerErrors.length > 0) {
            console.log(`词法错误: ${lexerErrors.length}`);
            lexerErrors.forEach(error => {
                console.log(`  - ${error.message}`);
            });
        }

        // 语法分析
        const parser = new Parser(tokens);
        const ast = parser.parse();
        const parserErrors = parser.getErrors();

        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log('\n--- 抽象语法树 (AST) ---');
        console.log(formatASTNode(ast));

        printParserStats(ast, parserErrors, duration);

        const totalErrors = lexerErrors.length + parserErrors.length;
        if (totalErrors === 0) {
            console.log('\n✅ 语法分析成功！');
        } else {
            console.log(`\n❌ 发现 ${totalErrors} 个错误`);
        }

    } catch (error) {
        console.error('\n❌ 运行时错误:', error.message);
        console.error(error.stack);
    }
}

// 测试用例集合
const testCases = [
    {
        name: '变量声明',
        code: `let x = 42;
const PI = 3.14;
var name = "Hello";`
    },
    {
        name: '函数声明',
        code: `function add(a, b) {
    return a + b;
}

function greet(name) {
    console.log("Hello, " + name);
}`
    },
    {
        name: '条件语句',
        code: `if (x > 0) {
    console.log("正数");
} else if (x < 0) {
    console.log("负数");
} else {
    console.log("零");
}`
    },
    {
        name: '循环语句',
        code: `while (i < 10) {
    console.log(i);
    i = i + 1;
}

for (let j = 0; j < 5; j++) {
    console.log(j);
}`
    },
    {
        name: '复杂表达式',
        code: `let result = (a + b) * c - d / e;
let flag = x > 0 && y < 100 || z == null;
let obj = { name: "test", value: 123 };`
    },
    {
        name: '函数调用',
        code: `let sum = add(10, 20);
console.log("结果:", sum);
math.max(a, b, c);`
    },
    {
        name: '嵌套结构',
        code: `function factorial(n) {
    if (n <= 1) {
        return 1;
    } else {
        return n * factorial(n - 1);
    }
}`
    },
    {
        name: '语法错误测试',
        code: `let x = ;
function ( {
    return
}
if x > 0 {
    console.log("error");
`
    }
];

/**
 * 主函数
 */
function main() {
    console.log('语法分析器测试工具');
    console.log('==================');

    const startTime = Date.now();
    let totalTests = 0;
    let passedTests = 0;

    testCases.forEach(testCase => {
        totalTests++;
        try {
            runTestCase(testCase.name, testCase.code);
            passedTests++;
        } catch (error) {
            console.error(`测试用例 "${testCase.name}" 执行失败:`, error.message);
        }
    });

    const endTime = Date.now();
    const totalDuration = endTime - startTime;

    console.log('\n' + '='.repeat(60));
    console.log('总体统计');
    console.log('='.repeat(60));
    console.log(`总测试用例: ${totalTests}`);
    console.log(`执行成功: ${passedTests}`);
    console.log(`执行失败: ${totalTests - passedTests}`);
    console.log(`总耗时: ${totalDuration}ms`);
    console.log(`平均耗时: ${Math.round(totalDuration / totalTests)}ms/用例`);

    if (passedTests === totalTests) {
        console.log('\n🎉 所有测试用例执行完成！');
    } else {
        console.log(`\n⚠️  ${totalTests - passedTests} 个测试用例执行失败`);
    }
}

// 如果直接运行此脚本，则执行主函数
if (require.main === module) {
    main();
}

// 导出函数供其他模块使用
module.exports = {
    runTestCase,
    formatASTNode,
    printParserStats
};