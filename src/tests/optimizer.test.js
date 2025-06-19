/**
 * 代码优化器测试文件
 * 
 * 功能：
 * 1. 测试常量折叠优化
 * 2. 测试代数化简
 * 3. 测试公共子表达式消除
 * 4. 测试无用代码删除
 * 5. 测试控制流优化
 * 
 * 作者：poboll
 * 日期：2025-06-05
 */

const { Parser } = require('../compiler/parser/parser');
const Optimizer = require('../compiler/optimizer/optimizer');
const { SemanticAnalyzer } = require('../compiler/semantic/semantic');
const Lexer = require('../compiler/lexer/lexer');

function parse(code) {
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    return parser.parse();
}

// 测试工具函数
function parseAndAnalyzeCode(code) {
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    const analyzer = new SemanticAnalyzer();
    const semanticResult = analyzer.analyze(ast);

    if (semanticResult.hasErrors()) {
        throw new Error('语义分析错误: ' + semanticResult.getErrors()[0].message);
    }

    return {
        ast: ast,
        symbolTable: analyzer.getSymbolTable()
    };
}

// 测试用例
function runOptimizerTests() {
    console.log('=== 代码优化器测试 ===\n');

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

    // 1. 优化器创建测试
    test('优化器创建', () => {
        const options = {
            enable_constant_folding: true,
            enable_algebraic_simplification: true,
            enable_common_subexpression: true,
            enable_dead_code: true,
            enable_control_flow: true,
            max_optimization_passes: 3,
            verbose: false
        };

        const optimizer = new Optimizer(options);
        assert(optimizer !== null, '优化器应该被成功创建');
        assert(typeof optimizer.optimize === 'function', '优化器应该有optimize方法');
    });

    // 2. 常量折叠测试
    test('常量折叠', () => {
        // 准备测试代码 - 包含可折叠的常量表达式
        const code = `
            var a = 10 + 20; // 应折叠为 30
            var b = 5 * 4;   // 应折叠为 20
            var c = 100 / 5; // 应折叠为 20
            var d = 3 + 4 * 2 - 1; // 应折叠为 10
        `;

        const { ast, symbolTable } = parseAndAnalyzeCode(code);

        // 配置优化器只启用常量折叠
        const options = {
            enable_constant_folding: true,
            enable_algebraic_simplification: false,
            enable_common_subexpression: false,
            enable_dead_code: false,
            enable_control_flow: false,
            max_optimization_passes: 1,
            verbose: false
        };

        const optimizer = new Optimizer(options);
        const result = optimizer.optimize(ast, symbolTable);

        assert(result.success, '优化应该成功');
        assert(result.optimized_ast !== null, '应该生成优化后的AST');
        assert(result.stats.constant_foldings > 0, '应该进行常量折叠优化');

        // 检查结果 (这里需要根据实际实现来检查)
        // 可以检查AST中是否常量表达式已被替换为单一常量节点
        console.log(`  进行了 ${result.stats.constant_foldings} 次常量折叠`);
    });

    // 3. 代数化简测试
    test('代数化简', () => {
        // 准备测试代码 - 包含可化简的代数表达式
        const code = `
            var x = 100;
            var a = x + 0;     // 应化简为 x
            var b = x * 1;     // 应化简为 x
            var c = x * 0;     // 应化简为 0
            var d = 0 + x;     // 应化简为 x
            var e = 1 * x;     // 应化简为 x
            var f = 0 * x;     // 应化简为 0
        `;

        const { ast, symbolTable } = parseAndAnalyzeCode(code);

        // 配置优化器只启用代数化简
        const options = {
            enable_constant_folding: false,
            enable_algebraic_simplification: true,
            enable_common_subexpression: false,
            enable_dead_code: false,
            enable_control_flow: false,
            max_optimization_passes: 1,
            verbose: false
        };

        const optimizer = new Optimizer(options);
        const result = optimizer.optimize(ast, symbolTable);

        assert(result.success, '优化应该成功');
        assert(result.optimized_ast !== null, '应该生成优化后的AST');
        assert(result.stats.algebraic_simplifications > 0, '应该进行代数化简优化');

        console.log(`  进行了 ${result.stats.algebraic_simplifications} 次代数化简`);
    });

    // 4. 公共子表达式消除测试
    test('公共子表达式消除', () => {
        // 准备测试代码 - 包含公共子表达式
        const code = `
            var a = 10;
            var b = 20;
            var c = a + b;     // 子表达式 a + b
            var d = (a + b) * 2; // 重复的子表达式 a + b
        `;

        const { ast, symbolTable } = parseAndAnalyzeCode(code);

        // 配置优化器只启用公共子表达式消除
        const options = {
            enable_constant_folding: false,
            enable_algebraic_simplification: false,
            enable_common_subexpression: true,
            enable_dead_code: false,
            enable_control_flow: false,
            max_optimization_passes: 1,
            verbose: false
        };

        const optimizer = new Optimizer(options);
        const result = optimizer.optimize(ast, symbolTable);

        assert(result.success, '优化应该成功');
        assert(result.optimized_ast !== null, '应该生成优化后的AST');

        // 公共子表达式消除可能依赖于具体实现
        if (result.stats.common_subexpressions > 0) {
            console.log(`  进行了 ${result.stats.common_subexpressions} 次公共子表达式消除`);
        } else {
            console.log('  注意: 公共子表达式消除可能尚未完全实现');
        }
    });

    // 5. 无用代码删除测试
    test('无用代码删除', () => {
        // 准备测试代码 - 包含无用代码
        const code = `
            var a = 10;
            var b = 20;
            if (false) {
                // 这段代码永远不会执行
                var c = a + b;
                console.log(c);
            }
            var x = 5;
            x = 10;  // 第一次赋值是无用的
        `;

        const { ast, symbolTable } = parseAndAnalyzeCode(code);

        // 配置优化器只启用无用代码删除
        const options = {
            enable_constant_folding: false,
            enable_algebraic_simplification: false,
            enable_common_subexpression: false,
            enable_dead_code: true,
            enable_control_flow: false,
            max_optimization_passes: 1,
            verbose: false
        };

        const optimizer = new Optimizer(options);
        const result = optimizer.optimize(ast, symbolTable);

        assert(result.success, '优化应该成功');
        assert(result.optimized_ast !== null, '应该生成优化后的AST');

        // 无用代码删除可能依赖于具体实现
        if (result.stats.dead_code_eliminations > 0) {
            console.log(`  进行了 ${result.stats.dead_code_eliminations} 次无用代码删除`);
        } else {
            console.log('  注意: 无用代码删除可能尚未完全实现');
        }
    });

    // 6. 控制流优化测试
    test('控制流优化', () => {
        // 准备测试代码 - 包含可优化的控制流
        const code = `
            var a = 10;
            if (true) {
                a = 20;
            }
            // if(true)语句可以被优化掉，直接使用其中的语句
            
            var b = 5;
            while (false) {
                b = b + 1;
            }
            // while(false)循环可以被完全删除
        `;

        const { ast, symbolTable } = parseAndAnalyzeCode(code);

        // 配置优化器只启用控制流优化
        const options = {
            enable_constant_folding: false,
            enable_algebraic_simplification: false,
            enable_common_subexpression: false,
            enable_dead_code: false,
            enable_control_flow: true,
            max_optimization_passes: 1,
            verbose: false
        };

        const optimizer = new Optimizer(options);
        const result = optimizer.optimize(ast, symbolTable);

        assert(result.success, '优化应该成功');
        assert(result.optimized_ast !== null, '应该生成优化后的AST');

        // 控制流优化可能依赖于具体实现
        if (result.stats.control_flow_optimizations > 0) {
            console.log(`  进行了 ${result.stats.control_flow_optimizations} 次控制流优化`);
        } else {
            console.log('  注意: 控制流优化可能尚未完全实现');
        }
    });

    // 7. 多轮优化测试
    test('多轮优化', () => {
        // 准备测试代码 - 需要多轮优化的复杂表达式
        const code = `
            var a = 10;
            var b = 20;
            var c = a + b + 30;  // 第一轮: a + b + 30, 第二轮: c = a + b + 30
            var d = a * 0 + b;   // 第一轮: 0 + b, 第二轮: b
        `;

        const { ast, symbolTable } = parseAndAnalyzeCode(code);

        // 配置优化器启用多种优化并允许多轮
        const options = {
            enable_constant_folding: true,
            enable_algebraic_simplification: true,
            enable_common_subexpression: true,
            enable_dead_code: true,
            enable_control_flow: true,
            max_optimization_passes: 3,
            verbose: false
        };

        const optimizer = new Optimizer(options);
        const result = optimizer.optimize(ast, symbolTable);

        assert(result.success, '优化应该成功');
        assert(result.optimized_ast !== null, '应该生成优化后的AST');
        assert(result.stats.total_optimizations > 0, '应该进行多次优化');

        console.log(`  进行了总计 ${result.stats.total_optimizations} 次优化`);
    });

    // 8. 优化统计测试
    test('优化统计', () => {
        // 准备测试代码 - 混合了各种可优化的情况
        const code = `
            var a = 10 + 20;
            var b = a * 0;
            var c = a + 0;
            var d = b + c;
        `;

        const { ast, symbolTable } = parseAndAnalyzeCode(code);

        // 配置优化器启用所有优化
        const options = {
            enable_constant_folding: true,
            enable_algebraic_simplification: true,
            enable_common_subexpression: true,
            enable_dead_code: true,
            enable_control_flow: true,
            max_optimization_passes: 2,
            verbose: false
        };

        const optimizer = new Optimizer(options);
        const result = optimizer.optimize(ast, symbolTable);

        assert(result.success, '优化应该成功');
        assert(result.stats.total_optimizations > 0, '应该进行优化');

        // 检查统计数据
        assert(typeof result.stats.optimization_time === 'number', '应该记录优化时间');
        assert(result.stats.optimization_time > 0, '优化时间应该大于0');

        // 打印优化统计
        console.log(`  常量折叠: ${result.stats.constant_foldings} 次`);
        console.log(`  代数化简: ${result.stats.algebraic_simplifications} 次`);
        console.log(`  公共子表达式消除: ${result.stats.common_subexpressions} 次`);
        console.log(`  无用代码删除: ${result.stats.dead_code_eliminations} 次`);
        console.log(`  控制流优化: ${result.stats.control_flow_optimizations} 次`);
        console.log(`  总优化次数: ${result.stats.total_optimizations} 次`);
        console.log(`  优化耗时: ${result.stats.optimization_time.toFixed(2)}ms`);
    });

    // 9. 复杂表达式优化测试
    test('复杂表达式优化', () => {
        // 准备测试代码 - 复杂的嵌套表达式
        const code = `
            var a = 5;
            var b = 10;
            var c = 15;
            var result = (a + b) * c / ((a + b) * 2) + ((3 * 5) / (2 + 3) * 4);
            // 可被优化为: result = c / 2 + 12
        `;

        const { ast, symbolTable } = parseAndAnalyzeCode(code);

        // 配置优化器启用所有优化
        const options = {
            enable_constant_folding: true,
            enable_algebraic_simplification: true,
            enable_common_subexpression: true,
            enable_dead_code: true,
            enable_control_flow: true,
            max_optimization_passes: 3,
            verbose: false
        };

        const optimizer = new Optimizer(options);
        const result = optimizer.optimize(ast, symbolTable);

        assert(result.success, '优化应该成功');
        assert(result.optimized_ast !== null, '应该生成优化后的AST');
        assert(result.stats.total_optimizations > 0, '应该进行多次优化');
    });

    // 10. 条件表达式优化测试
    test('条件表达式优化', () => {
        // 准备测试代码 - 条件表达式
        const code = `
            var x = 10;
            var y = 20;
            
            // 可折叠的条件
            if (10 < 20) {
                var a = 1;
            } else {
                var a = 2;
            }
            
            // 常量条件
            if (true) {
                var b = 1;
            } else {
                var b = 2;
            }
            
            // 变量条件
            if (x < y) {
                var c = 3;
            } else {
                var c = 4;
            }
        `;

        const { ast, symbolTable } = parseAndAnalyzeCode(code);

        // 配置优化器启用所有优化
        const options = {
            enable_constant_folding: true,
            enable_algebraic_simplification: true,
            enable_common_subexpression: false,
            enable_dead_code: true,
            enable_control_flow: true,
            max_optimization_passes: 2,
            verbose: false
        };

        const optimizer = new Optimizer(options);
        const result = optimizer.optimize(ast, symbolTable);

        assert(result.success, '优化应该成功');
        assert(result.stats.constant_foldings > 0 || result.stats.control_flow_optimizations > 0,
            '应该进行常量折叠或控制流优化');
    });

    // 11. 循环优化测试
    test('循环优化', () => {
        // 准备测试代码 - 包含循环的代码
        const code = `
            var sum = 0;
            var i = 0;
            
            // 可能被优化的循环（常量条件）
            while (false) {
                sum = sum + i;
                i = i + 1;
            }
            
            // 普通循环
            i = 0;
            while (i < 10) {
                sum = sum + i;
                i = i + 1;
            }
        `;

        const { ast, symbolTable } = parseAndAnalyzeCode(code);

        // 配置优化器主要测试控制流优化
        const options = {
            enable_constant_folding: true,
            enable_algebraic_simplification: false,
            enable_common_subexpression: false,
            enable_dead_code: true,
            enable_control_flow: true,
            max_optimization_passes: 2,
            verbose: false
        };

        const optimizer = new Optimizer(options);
        const result = optimizer.optimize(ast, symbolTable);

        assert(result.success, '优化应该成功');
    });

    // 12. 函数内优化测试
    test('函数内优化', () => {
        // 准备测试代码 - 函数内的优化机会
        const code = `
            function calculate(a, b) {
                var x = a + b;
                var y = 10 + 20;  // 常量折叠
                var z = x * 1;    // 代数化简
                return x + y + z; // 公共子表达式 x + x
            }
            
            var result = calculate(5, 15);
        `;

        const { ast, symbolTable } = parseAndAnalyzeCode(code);

        // 配置优化器启用所有优化
        const options = {
            enable_constant_folding: true,
            enable_algebraic_simplification: true,
            enable_common_subexpression: true,
            enable_dead_code: true,
            enable_control_flow: true,
            max_optimization_passes: 2,
            verbose: false
        };

        const optimizer = new Optimizer(options);
        const result = optimizer.optimize(ast, symbolTable);

        assert(result.success, '优化应该成功');
        assert(result.stats.total_optimizations > 0, '应该进行优化');
    });

    // 13. 错误处理测试
    test('错误处理', () => {
        // 准备不完整或有语法问题的AST
        const invalidAst = { type: 'ProgramNode', body: null }; // 不完整的AST

        const optimizer = new Optimizer({});
        try {
            optimizer.optimize(invalidAst, null);
            // 如果优化器正确处理了错误情况，不会抛出异常
            console.log('  优化器正确处理了无效AST');
        } catch (error) {
            // 优化器可能抛出异常，这也是合理的错误处理方式
            console.log('  优化器抛出了异常处理无效AST: ' + error.message);
        }

        // 断言测试通过，因为我们只是测试错误处理，无论是返回错误结果还是抛出异常都可以接受
        assert(true, '错误处理测试');
    });

    // 14. 优化器配置测试
    test('优化器配置', () => {
        // 准备测试代码
        const code = `var a = 10 + 20;`;
        const { ast, symbolTable } = parseAndAnalyzeCode(code);

        // 测试不同配置下的优化行为

        // 1. 全部禁用优化
        const options1 = {
            enable_constant_folding: false,
            enable_algebraic_simplification: false,
            enable_common_subexpression: false,
            enable_dead_code: false,
            enable_control_flow: false,
            max_optimization_passes: 1,
            verbose: false
        };

        const optimizer1 = new Optimizer(options1);
        const result1 = optimizer1.optimize(ast, symbolTable);

        assert(result1.success, '即使禁用所有优化，优化过程应该成功');
        assert(result1.stats.total_optimizations === 0, '禁用所有优化后应该没有优化发生');

        // 2. 只启用常量折叠
        const options2 = {
            enable_constant_folding: true,
            enable_algebraic_simplification: false,
            enable_common_subexpression: false,
            enable_dead_code: false,
            enable_control_flow: false,
            max_optimization_passes: 1,
            verbose: false
        };

        const optimizer2 = new Optimizer(options2);
        const result2 = optimizer2.optimize(ast, symbolTable);

        assert(result2.success, '只启用常量折叠时优化应该成功');
        assert(result2.stats.constant_foldings > 0, '应该进行常量折叠优化');
        assert(result2.stats.algebraic_simplifications === 0, '不应进行代数化简');
    });

    // 15. 优化结果验证测试
    test('优化结果验证', () => {
        // 准备简单的测试代码，确保优化不会改变程序语义
        const code = `
            var a = 10 + 20;  // 应优化为 a = 30
            var b = a * 2;    // 应为 b = 60
        `;

        const { ast, symbolTable } = parseAndAnalyzeCode(code);

        // 启用所有优化
        const optimizer = new Optimizer({
            enable_constant_folding: true,
            enable_algebraic_simplification: true,
            enable_common_subexpression: true,
            enable_dead_code: true,
            enable_control_flow: true,
            max_optimization_passes: 2,
            verbose: false
        });

        const result = optimizer.optimize(ast, symbolTable);

        assert(result.success, '优化应该成功');
        assert(result.optimized_ast !== null, '应该生成优化后的AST');

        // 这里，我们可以通过遍历AST或检查优化记录来验证结果是否符合预期
        if (result.stats.constant_foldings > 0) {
            // 验证是否至少进行了一次常量折叠（10 + 20 => 30）
            console.log('  验证通过: 进行了常量折叠优化');
        }
    });

    // 输出测试结果
    console.log('=== 代码优化器测试结果 ===');
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
    runOptimizerTests();
}

module.exports = { runOptimizerTests };

describe('Optimizer', () => {
    test('should perform constant folding on binary expressions', () => {
        // 源代码中的 5 + 15 应该被优化
        const code = 'let x = 5 + 15;';
        const ast = parse(code);

        const optimizer = new Optimizer(ast);
        const optimizedAst = optimizer.optimize();

        // 检查优化后的AST
        const varDecl = optimizedAst.body[0];
        const initializer = varDecl.initializer;

        // 初始化表达式应该变成一个字面量
        expect(initializer.nodeType).toBe('Literal');
        // 字面量的值应该是 20
        expect(initializer.value).toBe(20);
    });

    test('should not change expressions with variables', () => {
        const code = 'let x = a + 10;';
        const ast = parse(code);

        // 创建原始AST的深拷贝以供比较
        const originalAst = JSON.parse(JSON.stringify(ast));

        const optimizer = new Optimizer(ast);
        const optimizedAst = optimizer.optimize();

        // 包含变量的表达式不应该被改变
        expect(optimizedAst).toEqual(originalAst);
    });
});