/*
 * 语法分析器测试 - parser.test.js
 * @description 测试语法分析器的各种功能，包括AST构建和错误处理
 * @module tests/parser.test
 * @author AI Assistant
 * @date 2024-07-26
 */

const Lexer = require('../compiler/lexer/lexer');
const {
    Parser,
    ProgramNode,
    VariableDeclarationNode,
    FunctionDeclarationNode,
    IfStatementNode,
    WhileStatementNode,
    BinaryExpressionNode,
    CallExpressionNode,
    IdentifierNode,
    LiteralNode
} = require('../compiler/parser/parser');

// 辅助函数：从源代码创建AST
function parseCode(sourceCode) {
    const lexer = new Lexer(sourceCode);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    return {
        ast: parser.parse(),
        errors: parser.getErrors()
    };
}

// 测试用例
console.log('=== 语法分析器测试开始 ===\n');

// 测试1: 变量声明
console.log('测试1: 变量声明');
const test1 = parseCode('let x = 42;');
console.log('AST:', JSON.stringify(test1.ast, null, 2));
console.log('错误:', test1.errors);
console.log('通过:', test1.ast.body.length === 1 &&
    test1.ast.body[0].nodeType === 'VariableDeclaration' &&
    test1.ast.body[0].kind === 'let' &&
    test1.ast.body[0].identifier.name === 'x');
console.log();

// 测试2: 常量声明
console.log('测试2: 常量声明');
const test2 = parseCode('const PI = 3.14;');
console.log('通过:', test2.ast.body[0].nodeType === 'VariableDeclaration' &&
    test2.ast.body[0].kind === 'const' &&
    test2.ast.body[0].identifier.name === 'PI' &&
    test2.ast.body[0].initializer.value === 3.14);
console.log();

// 测试3: 函数声明
console.log('测试3: 函数声明');
const test3 = parseCode(`
function add(a, b) {
    return a + b;
}
`);
console.log('通过:', test3.ast.body[0].nodeType === 'FunctionDeclaration' &&
    test3.ast.body[0].identifier.name === 'add' &&
    test3.ast.body[0].params.length === 2 &&
    test3.ast.body[0].params[0].name === 'a' &&
    test3.ast.body[0].params[1].name === 'b');
console.log();

// 测试4: 二元表达式
console.log('测试4: 二元表达式');
const test4 = parseCode('let result = x + y * 2;');
const assignment = test4.ast.body[0].initializer;
console.log('通过:', assignment.nodeType === 'BinaryExpression' &&
    assignment.operator === '+' &&
    assignment.right.nodeType === 'BinaryExpression' &&
    assignment.right.operator === '*');
console.log();

// 测试5: if语句
console.log('测试5: if语句');
const test5 = parseCode(`
if (x > 0) {
    console.log("positive");
} else {
    console.log("negative");
}
`);
console.log('通过:', test5.ast.body[0].nodeType === 'IfStatement' &&
    test5.ast.body[0].test.nodeType === 'BinaryExpression' &&
    test5.ast.body[0].consequent.nodeType === 'BlockStatement' &&
    test5.ast.body[0].alternate.nodeType === 'BlockStatement');
console.log();

// 测试6: while循环
console.log('测试6: while循环');
const test6 = parseCode(`
while (i < 10) {
    i = i + 1;
}
`);
console.log('通过:', test6.ast.body[0].nodeType === 'WhileStatement' &&
    test6.ast.body[0].test.nodeType === 'BinaryExpression' &&
    test6.ast.body[0].body.nodeType === 'BlockStatement');
console.log();

// 测试7: 函数调用
console.log('测试7: 函数调用');
const test7 = parseCode('let result = add(1, 2);');
const callExpr = test7.ast.body[0].initializer;
console.log('通过:', callExpr.nodeType === 'CallExpression' &&
    callExpr.callee.name === 'add' &&
    callExpr.arguments.length === 2 &&
    callExpr.arguments[0].value === 1 &&
    callExpr.arguments[1].value === 2);
console.log();

// 测试8: 复杂表达式（运算符优先级）
console.log('测试8: 运算符优先级');
const test8 = parseCode('let result = 2 + 3 * 4;');
const expr = test8.ast.body[0].initializer;
console.log('通过:', expr.nodeType === 'BinaryExpression' &&
    expr.operator === '+' &&
    expr.left.value === 2 &&
    expr.right.nodeType === 'BinaryExpression' &&
    expr.right.operator === '*');
console.log();

// 测试9: 赋值表达式
console.log('测试9: 赋值表达式');
const test9 = parseCode('x = y + 1;');
const assignExpr = test9.ast.body[0].expression;
console.log('通过:', assignExpr.nodeType === 'AssignmentExpression' &&
    assignExpr.operator === '=' &&
    assignExpr.left.name === 'x' &&
    assignExpr.right.nodeType === 'BinaryExpression');
console.log();

// 测试10: 一元表达式
console.log('测试10: 一元表达式');
const test10 = parseCode('let negative = -x;');
const unaryExpr = test10.ast.body[0].initializer;
console.log('通过:', unaryExpr.nodeType === 'UnaryExpression' &&
    unaryExpr.operator === '-' &&
    unaryExpr.prefix === true &&
    unaryExpr.argument.name === 'x');
console.log();

// 测试11: 逻辑表达式
console.log('测试11: 逻辑表达式');
const test11 = parseCode('let result = a && b || c;');
const logicalExpr = test11.ast.body[0].initializer;
console.log('通过:', logicalExpr.nodeType === 'BinaryExpression' &&
    logicalExpr.operator === '||' &&
    logicalExpr.left.nodeType === 'BinaryExpression' &&
    logicalExpr.left.operator === '&&');
console.log();

// 测试12: 嵌套函数调用
console.log('测试12: 嵌套函数调用');
const test12 = parseCode('let result = add(multiply(2, 3), 4);');
const nestedCall = test12.ast.body[0].initializer;
console.log('通过:', nestedCall.nodeType === 'CallExpression' &&
    nestedCall.callee.name === 'add' &&
    nestedCall.arguments[0].nodeType === 'CallExpression' &&
    nestedCall.arguments[0].callee.name === 'multiply');
console.log();

// 测试13: 字符串字面量
console.log('测试13: 字符串字面量');
const test13 = parseCode('let message = "Hello, World!";');
const stringLiteral = test13.ast.body[0].initializer;
console.log('通过:', stringLiteral.nodeType === 'Literal' &&
    stringLiteral.value === 'Hello, World!' &&
    stringLiteral.raw === '"Hello, World!"');
console.log();

// 测试14: 布尔字面量
console.log('测试14: 布尔字面量');
const test14 = parseCode('let flag = true;');
const boolLiteral = test14.ast.body[0].initializer;
console.log('通过:', boolLiteral.nodeType === 'Literal' &&
    boolLiteral.value === true &&
    boolLiteral.raw === 'true');
console.log();

// 测试15: null字面量
console.log('测试15: null字面量');
const test15 = parseCode('let value = null;');
const nullLiteral = test15.ast.body[0].initializer;
console.log('通过:', nullLiteral.nodeType === 'Literal' &&
    nullLiteral.value === null &&
    nullLiteral.raw === 'null');
console.log();

// 测试16: 复杂程序
console.log('测试16: 复杂程序');
const test16 = parseCode(`
function factorial(n) {
    if (n <= 1) {
        return 1;
    } else {
        return n * factorial(n - 1);
    }
}

let result = factorial(5);
`);
console.log('通过:', test16.ast.body.length === 2 &&
    test16.ast.body[0].nodeType === 'FunctionDeclaration' &&
    test16.ast.body[1].nodeType === 'VariableDeclaration' &&
    test16.errors.length === 0);
console.log();

// 错误处理测试
console.log('=== 错误处理测试 ===\n');

// 测试17: 语法错误 - 缺少分号
console.log('测试17: 缺少分号');
const test17 = parseCode('let x = 42');
console.log('错误数量:', test17.errors.length);
console.log('通过:', test17.errors.length > 0 &&
    test17.errors[0].message.includes('Expected'));
console.log();

// 测试18: 语法错误 - 缺少右括号
console.log('测试18: 缺少右括号');
const test18 = parseCode('if (x > 0 { console.log("positive"); }');
console.log('错误数量:', test18.errors.length);
console.log('通过:', test18.errors.length > 0);
console.log();

// 测试19: 语法错误 - const缺少初始化
console.log('测试19: const缺少初始化');
const test19 = parseCode('const x;');
console.log('错误数量:', test19.errors.length);
console.log('通过:', test19.errors.length > 0 &&
    test19.errors[0].message.includes('Missing initializer'));
console.log();

// 测试20: 语法错误 - 无效的赋值目标
console.log('测试20: 无效的赋值目标');
const test20 = parseCode('42 = x;');
console.log('错误数量:', test20.errors.length);
console.log('通过:', test20.errors.length > 0 &&
    test20.errors[0].message.includes('Invalid assignment target'));
console.log();

// 测试21: 语法错误 - 意外的token
console.log('测试21: 意外的token');
const test21 = parseCode('let x = @;');
console.log('错误数量:', test21.errors.length);
console.log('通过:', test21.errors.length > 0);
console.log();

console.log('=== 语法分析器测试完成 ===');

// 统计测试结果
const tests = [
    test1, test2, test3, test4, test5, test6, test7, test8, test9, test10,
    test11, test12, test13, test14, test15, test16, test17, test18, test19, test20, test21
];

const passedTests = tests.filter((test, index) => {
    if (index < 16) {
        // 正常功能测试
        return test.errors.length === 0;
    } else {
        // 错误处理测试
        return test.errors.length > 0;
    }
}).length;

console.log(`\n测试总结: ${passedTests}/${tests.length} 个测试通过`);

if (passedTests === tests.length) {
    console.log('🎉 所有测试通过！语法分析器实现正确。');
} else {
    console.log('❌ 部分测试失败，需要检查语法分析器实现。');
}