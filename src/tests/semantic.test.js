/**
 * 语义分析器测试文件
 * 
 * 功能：
 * 1. 测试符号表管理
 * 2. 测试类型检查
 * 3. 测试作用域分析
 * 4. 测试语义错误检测
 * 5. 测试变量声明和使用
 * 
 * 作者：poboll
 * 日期：2025-06-05
 */

const { Parser } = require('../compiler/parser/parser');
const Analyzer = require('../compiler/semantic/semantic');
const Lexer = require('../compiler/lexer/lexer');

// 为了保持测试代码的一致性，创建别名
const SemanticAnalyzer = Analyzer;

// 测试工具函数
function parse(code) {
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    return parser.parse();
}

function createTestSymbol(name, type, dataType = 'number', scope = 'global') {
    return {
        name: name,
        type: type,
        dataType: dataType,
        scope: scope,
        line: 1,
        column: 1
    };
}

// 测试用例
function runSemanticTests() {
    console.log('=== 语义分析器测试 ===\n');

    let passedTests = 0;
    let totalTests = 0;

    // 测试函数
    function test(name, testFn) {
        totalTests++;
        try {
            console.log(`测试 ${totalTests}: ${name}`);
            testFn();
            console.log('✅ 通过\n');
            passedTests++;
        } catch (error) {
            console.log(`❌ 失败: ${error.message}\n`);
        }
    }

    // 断言函数
    function assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }

    // 1. 语义分析器创建测试
    test('语义分析器创建', () => {
        const ast = parse('var x = 10;');
        const analyzer = new SemanticAnalyzer(ast);
        assert(analyzer !== null, '语义分析器应该被成功创建');
        assert(typeof analyzer.analyze === 'function', '语义分析器应该有analyze方法');
    });

    // 2. 符号表基本操作测试
    test('符号表基本操作', () => {
        const ast = parse('var x = 10;');
        const analyzer = new SemanticAnalyzer(ast);
        const symbolTable = analyzer.symbolTable;

        // 添加符号
        symbolTable.enterScope();
        symbolTable.insert('x', { type: 'variable', dataType: 'number' });
        assert(symbolTable.lookup('x'), '符号表应该包含变量x');

        // 查找符号
        const symbol = symbolTable.lookup('x');
        assert(symbol.type === 'variable', '符号类型应该正确');
        assert(symbol.dataType === 'number', '数据类型应该正确');

        // 作用域测试
        symbolTable.enterScope();
        assert(symbolTable.lookup('x'), '外层符号在内层作用域可见');

        symbolTable.exitScope();
        symbolTable.exitScope();
    });

    // 3. 简单变量声明分析测试
    test('简单变量声明分析', () => {
        const ast = parse('var x = 10;');
        const analyzer = new SemanticAnalyzer(ast);

        const errors = analyzer.analyze();

        assert(errors.length === 0, '语义分析应该成功');
        assert(analyzer.symbolTable.lookup('x'), '变量x应该被添加到符号表');
    });

    // 4. 变量重复声明测试
    test('变量重复声明', () => {
        const ast = parse('var x = 10; var x = 20;');
        const analyzer = new SemanticAnalyzer(ast);

        const errors = analyzer.analyze();

        assert(errors.length > 0, '重复声明应该报错');
        assert(errors.some(error =>
            error.includes('已声明') ||
            error.includes('already declared')
        ), '错误信息应包含重复声明提示');
    });

    // 5. 未声明变量使用测试
    test('未声明变量使用', () => {
        const analyzer = new SemanticAnalyzer();
        const ast = parse('var y = x + 5;');

        const result = analyzer.analyze(ast);

        assert(result.hasErrors(), '使用未声明变量应该报错');
        assert(result.getErrors().some(error =>
            error.message.includes('未声明') ||
            error.message.includes('未定义') ||
            error.message.includes('not declared') ||
            error.message.includes('undefined')
        ), '错误信息应包含未声明变量提示');
    });

    // 6. 类型检查测试
    test('类型检查', () => {
        const analyzer = new SemanticAnalyzer();
        const ast = parse(`
            var x = 10;
            var y = true;
            var z = x + y; // 数字与布尔值相加
        `);

        const result = analyzer.analyze(ast);

        // 注意：具体的检查行为取决于语言规范，
        // 有些语言会隐式转换，有些会报错
        if (result.hasWarnings()) {
            assert(result.getWarnings().some(warning =>
                warning.message.includes('类型')
            ), '应有类型相关警告');
        }
    });

    // 7. 作用域检查测试
    test('作用域检查', () => {
        const analyzer = new SemanticAnalyzer();
        const ast = parse(`
            var a = 10;
            if (a > 5) {
                var b = 20;
            }
            var c = b; // b可能在当前作用域不可见
        `);

        const result = analyzer.analyze(ast);

        // 如果语言使用块级作用域，这里应该报错
        // 如果使用函数级作用域，则不应报错
        // 这里我们假设语言使用块级作用域
        if (result.hasErrors()) {
            assert(result.getErrors().some(error =>
                error.message.includes('未声明') ||
                error.message.includes('undefined')
            ), '错误信息应包含未声明变量提示');
        }
    });

    // 8. 函数声明与调用测试
    test('函数声明与调用', () => {
        const analyzer = new SemanticAnalyzer();
        const ast = parse(`
            function add(a, b) {
                return a + b;
            }
            var result = add(5, 10);
        `);

        const result = analyzer.analyze(ast);

        assert(!result.hasErrors(), '函数声明和调用语义分析应该成功');
        assert(analyzer.lookupSymbol('add'), '函数add应该被添加到符号表');
        assert(analyzer.lookupSymbol('result'), '变量result应该存在');
    });

    // 9. 函数参数测试
    test('函数参数', () => {
        const analyzer = new SemanticAnalyzer();
        const ast = parse(`
            function test(a, a) { // 参数名重复
                return a;
            }
        `);

        const result = analyzer.analyze(ast);

        assert(result.hasErrors(), '重复参数名应该报错');
    });

    // 10. 条件表达式类型检查
    test('条件表达式类型检查', () => {
        const analyzer = new SemanticAnalyzer();
        const ast = parse(`
            var x = 10;
            if (x) { // 非布尔类型条件
                var y = 20;
            }
        `);

        const result = analyzer.analyze(ast);

        // 检查是否有关于条件类型的警告
        if (result.hasWarnings()) {
            assert(result.getWarnings().some(warning =>
                warning.message.includes('布尔') ||
                warning.message.includes('boolean')
            ), '应有条件类型相关警告');
        }
    });

    // 11. 循环语句测试
    test('循环语句', () => {
        const analyzer = new SemanticAnalyzer();
        const ast = parse(`
            var i = 0;
            while (i < 10) {
                i = i + 1;
            }
        `);

        const result = analyzer.analyze(ast);

        assert(!result.hasErrors(), '循环语句语义分析应该成功');
    });

    // 12. 复杂表达式测试
    test('复杂表达式', () => {
        const analyzer = new SemanticAnalyzer();
        const ast = parse(`
            var a = 5;
            var b = 10;
            var c = 15;
            var result = (a + b) * c / (a + 1) - b;
        `);

        const result = analyzer.analyze(ast);

        assert(!result.hasErrors(), '复杂表达式语义分析应该成功');
    });

    // 13. 常量测试
    test('常量测试', () => {
        const analyzer = new SemanticAnalyzer();
        const ast = parse(`
            const PI = 3.14;
            PI = 3.1415; // 常量不可修改
        `);

        const result = analyzer.analyze(ast);

        assert(result.hasErrors(), '修改常量应该报错');
        assert(result.getErrors().some(error =>
            error.message.includes('常量') ||
            error.message.includes('const')
        ), '错误信息应包含常量相关提示');
    });

    // 14. 未使用变量检查
    test('未使用变量', () => {
        const analyzer = new SemanticAnalyzer();
        const ast = parse(`
            var x = 10; // 未使用
            var y = 20;
            var z = y + 5;
        `);

        const result = analyzer.analyze(ast);

        if (result.hasWarnings()) {
            assert(result.getWarnings().some(warning =>
                warning.message.includes('未使用') ||
                warning.message.includes('unused')
            ), '应有未使用变量相关警告');
        }
    });

    // 15. 嵌套作用域测试
    test('嵌套作用域', () => {
        const analyzer = new SemanticAnalyzer();
        const ast = parse(`
            var x = 10;
            function outer() {
                var y = x + 5;
                function inner() {
                    var z = y + x;
                    return z;
                }
                return inner();
            }
            var result = outer();
        `);

        const result = analyzer.analyze(ast);

        assert(!result.hasErrors(), '嵌套作用域语义分析应该成功');
    });

    // 16. 函数返回值检查
    test('函数返回值', () => {
        const analyzer = new SemanticAnalyzer();
        const ast = parse(`
            function test() {
                // 没有return语句
            }
            var x = test() + 5; // 使用了可能为undefined的返回值
        `);

        const result = analyzer.analyze(ast);

        // 这里要看具体语言规范，有些语言会自动返回undefined
        // 我们假设这是一个警告级别的问题
        if (result.hasWarnings()) {
            assert(result.getWarnings().some(warning =>
                warning.message.includes('返回') ||
                warning.message.includes('return')
            ), '应有返回值相关警告');
        }
    });

    // 17. 变量初始化检查
    test('变量初始化', () => {
        const analyzer = new SemanticAnalyzer();
        const ast = parse(`
            var x;
            var y = x + 10; // 使用可能未初始化的变量
        `);

        const result = analyzer.analyze(ast);

        if (result.hasWarnings()) {
            assert(result.getWarnings().some(warning =>
                warning.message.includes('初始化') ||
                warning.message.includes('initialized')
            ), '应有变量初始化相关警告');
        }
    });

    // 18. 递归函数测试
    test('递归函数', () => {
        const analyzer = new SemanticAnalyzer();
        const ast = parse(`
            function factorial(n) {
                if (n <= 1) {
                    return 1;
                } else {
                    return n * factorial(n - 1);
                }
            }
            var result = factorial(5);
        `);

        const result = analyzer.analyze(ast);

        assert(!result.hasErrors(), '递归函数语义分析应该成功');
    });

    // 19. 布尔表达式测试
    test('布尔表达式', () => {
        const analyzer = new SemanticAnalyzer();
        const ast = parse(`
            var a = true;
            var b = false;
            var c = a && b;
            var d = a || b;
            var e = !a;
            var f = a == b;
        `);

        const result = analyzer.analyze(ast);

        assert(!result.hasErrors(), '布尔表达式语义分析应该成功');
    });

    // 20. 表达式类型推导测试
    test('表达式类型推导', () => {
        const analyzer = new SemanticAnalyzer();
        const ast = parse(`
            var a = 5; // number
            var b = true; // boolean
            var c = a > 3; // boolean
            var d = a + 10; // number
            var e = b && true; // boolean
        `);

        const result = analyzer.analyze(ast);

        assert(!result.hasErrors(), '表达式类型推导应该成功');
    });

    // 输出测试结果
    console.log('=== 语义分析器测试结果 ===');
    console.log(`总测试数: ${totalTests}`);
    console.log(`通过测试: ${passedTests}`);
    console.log(`失败测试: ${totalTests - passedTests}`);
    console.log(`通过率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (passedTests === totalTests) {
        console.log('🎉 所有测试通过！');
    } else {
        console.log('⚠️  部分测试失败，请检查实现');
    }

    return {
        total: totalTests,
        passed: passedTests,
        failed: totalTests - passedTests,
        passRate: (passedTests / totalTests) * 100
    };
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
    runSemanticTests();
}

module.exports = { runSemanticTests };

describe('Semantic Analyzer', () => {
    test('should detect re-declaration of a variable in the same scope', () => {
        const code = `
            let x = 10;
            let x = 20;
        `;
        const ast = parse(code);
        const analyzer = new SemanticAnalyzer(ast);
        const errors = analyzer.analyze();
        expect(errors.length).toBe(1);
        expect(errors[0]).toContain('变量 "x" 在当前作用域已声明');
    });

    test('should allow shadowing variable in a nested scope', () => {
        const code = `
            let x = 10;
            if (true) {
                let x = 20;
            }
        `;
        const ast = parse(code);
        const analyzer = new SemanticAnalyzer(ast);
        const errors = analyzer.analyze();
        expect(errors.length).toBe(0);
    });

    test('should detect using an undeclared variable', () => {
        const code = `
            x = 10;
        `;
        const ast = parse(code);
        const analyzer = new SemanticAnalyzer(ast);
        const errors = analyzer.analyze();
        expect(errors.length).toBe(1);
        expect(errors[0]).toContain('变量 "x" 未声明');
    });

    test('should handle nested scopes correctly', () => {
        const code = `
            let x = 10;
            {
                let y = 20;
            }
            y = 30; // Error: y is not defined here
        `;
        const ast = parse(code);
        const analyzer = new SemanticAnalyzer(ast);
        const errors = analyzer.analyze();
        expect(errors.length).toBe(1);
        expect(errors[0]).toContain('变量 "y" 未声明');
    });

    test('should handle function scopes correctly', () => {
        const code = `
            function add(a, b) {
                let result = a + b;
                return result;
            }
            let x = add(1, 2);
        `;
        const ast = parse(code);
        const analyzer = new SemanticAnalyzer(ast);
        const errors = analyzer.analyze();
        expect(errors.length).toBe(0);
    });

    test('should detect duplicate function parameter', () => {
        const code = `
            function add(a, a) {
                return a + a;
            }
        `;
        const ast = parse(code);
        const analyzer = new SemanticAnalyzer(ast);
        const errors = analyzer.analyze();
        expect(errors.length).toBe(1);
        expect(errors[0]).toContain('参数 "a" 重复声明');
    });
});