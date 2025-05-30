/*
 * 代码优化器测试 - optimizer.test.js
 * @description 测试代码优化模块的各项功能
 * @module src/tests
 * @author 编译系统课程设计
 * @date 2024
 */

const { Optimizer, OptimizationResult } = require('../compiler/optimizer/optimizer.js');

// 测试辅助函数
function createNumericLiteral(value) {
    return {
        type: 'NumericLiteral',
        value: value.toString()
    };
}

function createIdentifier(name) {
    return {
        type: 'Identifier',
        name: name
    };
}

function createBinaryExpression(operator, left, right) {
    return {
        type: 'BinaryExpression',
        operator: operator,
        left: left,
        right: right
    };
}

function createProgram(body) {
    return {
        type: 'Program',
        body: body
    };
}

function createExpressionStatement(expression) {
    return {
        type: 'ExpressionStatement',
        expression: expression
    };
}

// 测试套件
class OptimizerTestSuite {
    constructor() {
        this.optimizer = new Optimizer();
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0
        };
    }

    // 运行单个测试
    runTest(testName, testFunction) {
        this.testResults.total++;
        try {
            console.log(`🧪 运行测试: ${testName}`);
            testFunction();
            console.log(`✅ 测试通过: ${testName}`);
            this.testResults.passed++;
        } catch (error) {
            console.log(`❌ 测试失败: ${testName}`);
            console.log(`   错误: ${error.message}`);
            this.testResults.failed++;
        }
    }

    // 断言函数
    assertEqual(actual, expected, message = '') {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(`断言失败 ${message}: 期望 ${JSON.stringify(expected)}, 实际 ${JSON.stringify(actual)}`);
        }
    }

    assertTrue(condition, message = '') {
        if (!condition) {
            throw new Error(`断言失败 ${message}: 期望为真`);
        }
    }

    // 常量折叠测试
    testConstantFolding() {
        console.log('\n📁 常量折叠测试');
        console.log('='.repeat(50));

        // 测试加法常量折叠
        this.runTest('加法常量折叠', () => {
            const ast = createBinaryExpression('+',
                createNumericLiteral(5),
                createNumericLiteral(3)
            );

            const result = new OptimizationResult();
            const optimized = this.optimizer.constantFolding(ast, result);

            this.assertEqual(optimized.type, 'NumericLiteral');
            this.assertEqual(optimized.value, '8');
            this.assertTrue(result.statistics.constantFoldings > 0);
        });

        // 测试减法常量折叠
        this.runTest('减法常量折叠', () => {
            const ast = createBinaryExpression('-',
                createNumericLiteral(10),
                createNumericLiteral(4)
            );

            const result = new OptimizationResult();
            const optimized = this.optimizer.constantFolding(ast, result);

            this.assertEqual(optimized.type, 'NumericLiteral');
            this.assertEqual(optimized.value, '6');
        });

        // 测试乘法常量折叠
        this.runTest('乘法常量折叠', () => {
            const ast = createBinaryExpression('*',
                createNumericLiteral(6),
                createNumericLiteral(7)
            );

            const result = new OptimizationResult();
            const optimized = this.optimizer.constantFolding(ast, result);

            this.assertEqual(optimized.type, 'NumericLiteral');
            this.assertEqual(optimized.value, '42');
        });

        // 测试除法常量折叠
        this.runTest('除法常量折叠', () => {
            const ast = createBinaryExpression('/',
                createNumericLiteral(15),
                createNumericLiteral(3)
            );

            const result = new OptimizationResult();
            const optimized = this.optimizer.constantFolding(ast, result);

            this.assertEqual(optimized.type, 'NumericLiteral');
            this.assertEqual(optimized.value, '5');
        });

        // 测试除零检测
        this.runTest('除零检测', () => {
            const ast = createBinaryExpression('/',
                createNumericLiteral(10),
                createNumericLiteral(0)
            );

            const result = new OptimizationResult();
            const optimized = this.optimizer.constantFolding(ast, result);

            // 应该保持原表达式不变
            this.assertEqual(optimized.type, 'BinaryExpression');
            this.assertTrue(result.warnings.length > 0);
        });

        // 测试取模运算
        this.runTest('取模常量折叠', () => {
            const ast = createBinaryExpression('%',
                createNumericLiteral(17),
                createNumericLiteral(5)
            );

            const result = new OptimizationResult();
            const optimized = this.optimizer.constantFolding(ast, result);

            this.assertEqual(optimized.type, 'NumericLiteral');
            this.assertEqual(optimized.value, '2');
        });
    }

    // 代数化简测试
    testAlgebraicSimplification() {
        console.log('\n🔢 代数化简测试');
        console.log('='.repeat(50));

        // 测试 x + 0 = x
        this.runTest('x + 0 化简', () => {
            const ast = createBinaryExpression('+',
                createIdentifier('x'),
                createNumericLiteral(0)
            );

            const result = new OptimizationResult();
            const optimized = this.optimizer.algebraicSimplification(ast, result);

            this.assertEqual(optimized.type, 'Identifier');
            this.assertEqual(optimized.name, 'x');
            this.assertTrue(result.statistics.algebraicSimplifications > 0);
        });

        // 测试 0 + x = x
        this.runTest('0 + x 化简', () => {
            const ast = createBinaryExpression('+',
                createNumericLiteral(0),
                createIdentifier('y')
            );

            const result = new OptimizationResult();
            const optimized = this.optimizer.algebraicSimplification(ast, result);

            this.assertEqual(optimized.type, 'Identifier');
            this.assertEqual(optimized.name, 'y');
        });

        // 测试 x - 0 = x
        this.runTest('x - 0 化简', () => {
            const ast = createBinaryExpression('-',
                createIdentifier('z'),
                createNumericLiteral(0)
            );

            const result = new OptimizationResult();
            const optimized = this.optimizer.algebraicSimplification(ast, result);

            this.assertEqual(optimized.type, 'Identifier');
            this.assertEqual(optimized.name, 'z');
        });

        // 测试 x * 1 = x
        this.runTest('x * 1 化简', () => {
            const ast = createBinaryExpression('*',
                createIdentifier('a'),
                createNumericLiteral(1)
            );

            const result = new OptimizationResult();
            const optimized = this.optimizer.algebraicSimplification(ast, result);

            this.assertEqual(optimized.type, 'Identifier');
            this.assertEqual(optimized.name, 'a');
        });

        // 测试 1 * x = x
        this.runTest('1 * x 化简', () => {
            const ast = createBinaryExpression('*',
                createNumericLiteral(1),
                createIdentifier('b')
            );

            const result = new OptimizationResult();
            const optimized = this.optimizer.algebraicSimplification(ast, result);

            this.assertEqual(optimized.type, 'Identifier');
            this.assertEqual(optimized.name, 'b');
        });

        // 测试 x * 0 = 0
        this.runTest('x * 0 化简', () => {
            const ast = createBinaryExpression('*',
                createIdentifier('c'),
                createNumericLiteral(0)
            );

            const result = new OptimizationResult();
            const optimized = this.optimizer.algebraicSimplification(ast, result);

            this.assertEqual(optimized.type, 'NumericLiteral');
            this.assertEqual(optimized.value, '0');
        });

        // 测试 x / 1 = x
        this.runTest('x / 1 化简', () => {
            const ast = createBinaryExpression('/',
                createIdentifier('d'),
                createNumericLiteral(1)
            );

            const result = new OptimizationResult();
            const optimized = this.optimizer.algebraicSimplification(ast, result);

            this.assertEqual(optimized.type, 'Identifier');
            this.assertEqual(optimized.name, 'd');
        });
    }

    // 无用代码删除测试
    testDeadCodeElimination() {
        console.log('\n🗑️ 无用代码删除测试');
        console.log('='.repeat(50));

        // 测试删除独立的数字字面量
        this.runTest('删除独立数字字面量', () => {
            const ast = createProgram([
                createExpressionStatement(createNumericLiteral(42)),
                createExpressionStatement(
                    createBinaryExpression('+',
                        createIdentifier('x'),
                        createNumericLiteral(1)
                    )
                )
            ]);

            const result = new OptimizationResult();
            const optimized = this.optimizer.deadCodeElimination(ast, result);

            // 应该只剩下一个语句
            this.assertEqual(optimized.body.length, 1);
            this.assertEqual(optimized.body[0].expression.type, 'BinaryExpression');
            this.assertTrue(result.statistics.deadCodeEliminations > 0);
        });
    }

    // 综合优化测试
    testComprehensiveOptimization() {
        console.log('\n🎯 综合优化测试');
        console.log('='.repeat(50));

        // 测试多种优化技术的组合
        this.runTest('多技术组合优化', () => {
            const ast = createProgram([
                // 5 + 3 (常量折叠)
                createExpressionStatement(
                    createBinaryExpression('+',
                        createNumericLiteral(5),
                        createNumericLiteral(3)
                    )
                ),
                // x * 1 (代数化简)
                createExpressionStatement(
                    createBinaryExpression('*',
                        createIdentifier('x'),
                        createNumericLiteral(1)
                    )
                ),
                // 独立的数字 (无用代码删除)
                createExpressionStatement(createNumericLiteral(99))
            ]);

            const result = this.optimizer.optimize(ast);

            this.assertTrue(result.success);
            this.assertTrue(result.statistics.totalOptimizations > 0);
            this.assertTrue(result.statistics.constantFoldings > 0);
            this.assertTrue(result.statistics.algebraicSimplifications > 0);
            this.assertTrue(result.statistics.deadCodeEliminations > 0);
        });

        // 测试嵌套表达式优化
        this.runTest('嵌套表达式优化', () => {
            const ast = createBinaryExpression('+',
                createBinaryExpression('*',
                    createNumericLiteral(2),
                    createNumericLiteral(3)
                ),
                createBinaryExpression('-',
                    createIdentifier('y'),
                    createNumericLiteral(0)
                )
            );

            const result = this.optimizer.optimize(ast);

            this.assertTrue(result.success);
            // 应该优化为 6 + y
            this.assertEqual(result.optimizedAST.type, 'BinaryExpression');
            this.assertEqual(result.optimizedAST.operator, '+');
            this.assertEqual(result.optimizedAST.left.type, 'NumericLiteral');
            this.assertEqual(result.optimizedAST.left.value, '6');
            this.assertEqual(result.optimizedAST.right.type, 'Identifier');
            this.assertEqual(result.optimizedAST.right.name, 'y');
        });
    }

    // 错误处理测试
    testErrorHandling() {
        console.log('\n⚠️ 错误处理测试');
        console.log('='.repeat(50));

        // 测试空输入
        this.runTest('空输入处理', () => {
            const result = this.optimizer.optimize(null);
            // 应该优雅地处理空输入
            this.assertTrue(result instanceof OptimizationResult);
        });

        // 测试无效AST
        this.runTest('无效AST处理', () => {
            const invalidAST = { type: 'InvalidNode' };
            const result = this.optimizer.optimize(invalidAST);
            // 应该不会崩溃
            this.assertTrue(result instanceof OptimizationResult);
        });
    }

    // 性能测试
    testPerformance() {
        console.log('\n⚡ 性能测试');
        console.log('='.repeat(50));

        this.runTest('大型AST优化性能', () => {
            // 生成一个较大的AST
            const largeAST = this.generateLargeAST(1000);

            const startTime = Date.now();
            const result = this.optimizer.optimize(largeAST);
            const endTime = Date.now();

            const optimizationTime = endTime - startTime;

            console.log(`   优化时间: ${optimizationTime}ms`);
            console.log(`   节点数量: 1000`);
            console.log(`   优化次数: ${result.statistics.totalOptimizations}`);

            this.assertTrue(result.success);
            this.assertTrue(optimizationTime < 5000); // 应该在5秒内完成
        });
    }

    // 生成大型AST用于性能测试
    generateLargeAST(nodeCount) {
        const statements = [];

        for (let i = 0; i < nodeCount; i++) {
            const expr = createBinaryExpression('+',
                createNumericLiteral(i),
                createNumericLiteral(i + 1)
            );
            statements.push(createExpressionStatement(expr));
        }

        return createProgram(statements);
    }

    // 运行所有测试
    runAllTests() {
        console.log('🚀 开始运行代码优化器测试套件');
        console.log('='.repeat(60));

        const startTime = Date.now();

        this.testConstantFolding();
        this.testAlgebraicSimplification();
        this.testDeadCodeElimination();
        this.testComprehensiveOptimization();
        this.testErrorHandling();
        this.testPerformance();

        const endTime = Date.now();
        const totalTime = endTime - startTime;

        console.log('\n' + '='.repeat(60));
        console.log('📊 测试结果汇总');
        console.log('='.repeat(60));
        console.log(`总测试数: ${this.testResults.total}`);
        console.log(`通过测试: ${this.testResults.passed}`);
        console.log(`失败测试: ${this.testResults.failed}`);
        console.log(`成功率: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(2)}%`);
        console.log(`总耗时: ${totalTime}ms`);

        if (this.testResults.failed === 0) {
            console.log('\n🎉 所有测试通过！代码优化器工作正常。');
        } else {
            console.log(`\n❌ 有 ${this.testResults.failed} 个测试失败，请检查代码。`);
        }

        return this.testResults.failed === 0;
    }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
    const testSuite = new OptimizerTestSuite();
    const success = testSuite.runAllTests();
    process.exit(success ? 0 : 1);
}

// 导出测试套件
module.exports = OptimizerTestSuite;