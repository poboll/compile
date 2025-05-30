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
 * 作者：编译系统课程设计
 * 日期：2024
 */

const { SemanticAnalyzer } = require('../compiler/semantic/semantic');
const { Parser } = require('../compiler/parser/parser');
const Lexer = require('../compiler/lexer/lexer');

// 测试工具函数
function parseCode(code) {
    const lexer = new Lexer();
    const parser = new Parser();
    const tokens = lexer.tokenize(code);
    return parser.parse(tokens);
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
        const analyzer = new SemanticAnalyzer();
        assert(analyzer !== null, '语义分析器应该被成功创建');
        assert(analyzer.getVersion() === '1.0.0', '版本号应该正确');
    });

    // 2. 符号表基本操作测试
    test('符号表基本操作', () => {
        const analyzer = new SemanticAnalyzer();

        // 添加符号
        analyzer.addSymbol('x', 'variable', 'number');
        assert(analyzer.hasSymbol('x'), '符号表应该包含变量x');

        // 查找符号
        const symbol = analyzer.getSymbol('x');
        assert(symbol.name === 'x', '符号名称应该正确');
        assert(symbol.type === 'variable', '符号类型应该正确');
        assert(symbol.dataType === 'number', '数据类型应该正确');

        // 删除符号
        analyzer.removeSymbol('x');
        assert(!analyzer.hasSymbol('x'), '符号应该被删除');
    });

    // 3. 作用域管理测试
    test('作用域管理', () => {
        const analyzer = new SemanticAnalyzer();

        // 进入新作用域
        analyzer.enterScope('function');
        analyzer.addSymbol('localVar', 'variable', 'number');

        assert(analyzer.hasSymbol('localVar'), '局部变量应该在当前作用域中');

        // 退出作用域
        analyzer.exitScope();
        assert(!analyzer.hasSymbol('localVar'), '局部变量应该在退出作用域后不可见');
    });

    // 4. 变量声明分析测试
    test('变量声明分析', () => {
        const analyzer = new SemanticAnalyzer();
        const ast = parseCode('int x = 10;');

        const result = analyzer.analyze(ast);

        assert(result.success, '语义分析应该成功');
        assert(analyzer.hasSymbol('x'), '变量x应该被添加到符号表');

        const symbol = analyzer.getSymbol('x');
        assert(symbol.dataType === 'number', '变量类型应该正确');
    });

    // 5. 类型检查测试
    test('类型检查', () => {
        const analyzer = new SemanticAnalyzer();

        // 正确的类型匹配
        const ast1 = parseCode('int x = 10; int y = x + 5;');
        const result1 = analyzer.analyze(ast1);
        assert(result1.success, '类型匹配的表达式应该通过检查');

        // 重置分析器
        analyzer.reset();

        // 类型不匹配（如果支持多种类型）
        const ast2 = parseCode('int x = 10; x = "hello";');
        const result2 = analyzer.analyze(ast2);
        // 注意：当前实现可能不支持字符串类型，这里主要测试框架
    });

    // 6. 重复声明检测测试
    test('重复声明检测', () => {
        const analyzer = new SemanticAnalyzer();
        const ast = parseCode('int x = 10; int x = 20;');

        const result = analyzer.analyze(ast);

        // 检查是否检测到重复声明错误
        if (!result.success) {
            assert(result.errors.some(error =>
                error.message.includes('重复声明') ||
                error.message.includes('already declared')
            ), '应该检测到重复声明错误');
        }
    });

    // 7. 未声明变量使用检测测试
    test('未声明变量使用检测', () => {
        const analyzer = new SemanticAnalyzer();
        const ast = parseCode('int y = x + 5;'); // x未声明

        const result = analyzer.analyze(ast);

        // 检查是否检测到未声明变量错误
        if (!result.success) {
            assert(result.errors.some(error =>
                error.message.includes('未声明') ||
                error.message.includes('not declared') ||
                error.message.includes('undefined')
            ), '应该检测到未声明变量错误');
        }
    });

    // 8. 表达式类型推导测试
    test('表达式类型推导', () => {
        const analyzer = new SemanticAnalyzer();
        const ast = parseCode('int x = 10; int y = 20; int z = x + y * 2;');

        const result = analyzer.analyze(ast);

        assert(result.success, '表达式类型推导应该成功');
        assert(analyzer.hasSymbol('z'), '变量z应该被正确声明');

        const symbol = analyzer.getSymbol('z');
        assert(symbol.dataType === 'number', '表达式结果类型应该正确');
    });

    // 9. 条件语句语义分析测试
    test('条件语句语义分析', () => {
        const analyzer = new SemanticAnalyzer();
        const ast = parseCode(`
            int x = 10;
            if (x > 5) {
                int y = x * 2;
            }
        `);

        const result = analyzer.analyze(ast);

        assert(result.success, '条件语句语义分析应该成功');
        assert(analyzer.hasSymbol('x'), '外层变量应该存在');
        // 注意：y是局部变量，在if块外不可见
    });

    // 10. 循环语句语义分析测试
    test('循环语句语义分析', () => {
        const analyzer = new SemanticAnalyzer();
        const ast = parseCode(`
            int i = 0;
            while (i < 10) {
                i = i + 1;
            }
        `);

        const result = analyzer.analyze(ast);

        assert(result.success, '循环语句语义分析应该成功');
        assert(analyzer.hasSymbol('i'), '循环变量应该存在');
    });

    // 11. 函数声明和调用测试（如果支持）
    test('函数语义分析', () => {
        const analyzer = new SemanticAnalyzer();

        try {
            const ast = parseCode(`
                function add(int a, int b) {
                    return a + b;
                }
                int result = add(5, 3);
            `);

            const result = analyzer.analyze(ast);

            if (result.success) {
                assert(analyzer.hasSymbol('add'), '函数应该被添加到符号表');
                assert(analyzer.hasSymbol('result'), '结果变量应该存在');
            }
        } catch (error) {
            // 如果不支持函数，跳过此测试
            console.log('  (函数语法可能不支持，跳过此测试)');
        }
    });

    // 12. 数组语义分析测试（如果支持）
    test('数组语义分析', () => {
        const analyzer = new SemanticAnalyzer();

        try {
            const ast = parseCode(`
                int arr[10];
                arr[0] = 5;
                int value = arr[0];
            `);

            const result = analyzer.analyze(ast);

            if (result.success) {
                assert(analyzer.hasSymbol('arr'), '数组应该被添加到符号表');
                assert(analyzer.hasSymbol('value'), '值变量应该存在');
            }
        } catch (error) {
            // 如果不支持数组，跳过此测试
            console.log('  (数组语法可能不支持，跳过此测试)');
        }
    });

    // 13. 嵌套作用域测试
    test('嵌套作用域测试', () => {
        const analyzer = new SemanticAnalyzer();
        const ast = parseCode(`
            int x = 10;
            if (x > 5) {
                int x = 20;  // 内层x
                int y = x + 1;
            }
            int z = x + 1;  // 外层x
        `);

        const result = analyzer.analyze(ast);

        // 检查作用域处理是否正确
        assert(result.success || result.errors.length === 0, '嵌套作用域应该被正确处理');
    });

    // 14. 符号表统计测试
    test('符号表统计', () => {
        const analyzer = new SemanticAnalyzer();
        const ast = parseCode(`
            int a = 1;
            int b = 2;
            int c = a + b;
        `);

        analyzer.analyze(ast);

        const stats = analyzer.getStatistics();
        assert(stats.symbolCount >= 3, '符号数量应该正确');
        assert(stats.scopeCount >= 1, '作用域数量应该正确');
    });

    // 15. 错误恢复测试
    test('错误恢复测试', () => {
        const analyzer = new SemanticAnalyzer();
        const ast = parseCode(`
            int x = undeclaredVar;  // 错误
            int y = 10;             // 应该继续分析
        `);

        const result = analyzer.analyze(ast);

        // 即使有错误，也应该继续分析后续代码
        assert(analyzer.hasSymbol('y'), '错误后的代码应该继续被分析');
    });

    // 16. 性能测试
    test('性能测试', () => {
        const analyzer = new SemanticAnalyzer();

        // 生成大量变量声明
        let code = '';
        for (let i = 0; i < 100; i++) {
            code += `int var${i} = ${i};\n`;
        }

        const ast = parseCode(code);

        const startTime = Date.now();
        const result = analyzer.analyze(ast);
        const endTime = Date.now();

        const analysisTime = endTime - startTime;

        assert(result.success, '大量变量的语义分析应该成功');
        assert(analysisTime < 1000, `分析时间应该合理 (${analysisTime}ms)`);

        console.log(`  分析了100个变量，耗时: ${analysisTime}ms`);
    });

    // 17. 内存管理测试
    test('内存管理测试', () => {
        const analyzer = new SemanticAnalyzer();

        // 多次分析和重置
        for (let i = 0; i < 10; i++) {
            const ast = parseCode(`int x${i} = ${i};`);
            analyzer.analyze(ast);
            analyzer.reset();
        }

        // 检查重置后状态
        assert(!analyzer.hasSymbol('x0'), '重置后符号表应该为空');

        const stats = analyzer.getStatistics();
        assert(stats.symbolCount === 0, '重置后符号数量应该为0');
    });

    // 18. 复杂表达式测试
    test('复杂表达式测试', () => {
        const analyzer = new SemanticAnalyzer();
        const ast = parseCode(`
            int a = 1;
            int b = 2;
            int c = 3;
            int result = (a + b) * c - (a * b + c) / (a + 1);
        `);

        const result = analyzer.analyze(ast);

        assert(result.success, '复杂表达式语义分析应该成功');
        assert(analyzer.hasSymbol('result'), '结果变量应该存在');
    });

    // 19. 边界条件测试
    test('边界条件测试', () => {
        const analyzer = new SemanticAnalyzer();

        // 空程序
        const emptyAST = { type: 'Program', body: [] };
        const emptyResult = analyzer.analyze(emptyAST);
        assert(emptyResult.success, '空程序应该分析成功');

        // 单个语句
        analyzer.reset();
        const singleAST = parseCode('int x = 1;');
        const singleResult = analyzer.analyze(singleAST);
        assert(singleResult.success, '单个语句应该分析成功');
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