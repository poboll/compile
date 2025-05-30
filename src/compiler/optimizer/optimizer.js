/*
 * 代码优化器 - optimizer.js
 * @description 实现编译器的代码优化功能，包括常量折叠、代数化简、公共子表达式消除和无用代码删除
 * @module src/compiler/optimizer
 * @author 编译系统课程设计
 * @date 2024
 */

// 优化结果类
class OptimizationResult {
    constructor() {
        this.success = false;
        this.optimizedAST = null;
        this.optimizedCode = null;
        this.optimizations = [];
        this.statistics = {
            constantFoldings: 0,
            algebraicSimplifications: 0,
            commonSubexpressionEliminations: 0,
            deadCodeEliminations: 0,
            totalOptimizations: 0,
            optimizationTime: 0
        };
        this.errors = [];
        this.warnings = [];
    }

    addOptimization(type, description, node) {
        this.optimizations.push({
            type,
            description,
            node: node ? this.getNodeInfo(node) : null,
            timestamp: Date.now()
        });
        this.statistics[type]++;
        this.statistics.totalOptimizations++;
    }

    addError(error) {
        this.errors.push(error);
    }

    addWarning(warning) {
        this.warnings.push(warning);
    }

    getNodeInfo(node) {
        return {
            type: node.type,
            line: node.line || 0,
            column: node.column || 0
        };
    }
}

// 代码优化器主类
class Optimizer {
    constructor(options = {}) {
        this.options = {
            enableConstantFolding: true,
            enableAlgebraicSimplification: true,
            enableCommonSubexpressionElimination: true,
            enableDeadCodeElimination: true,
            maxOptimizationPasses: 3,
            generateOptimizationReport: true,
            ...options
        };

        // 优化统计
        this.optimizationCount = 0;
        this.currentPass = 0;
    }

    /**
     * 优化AST
     * @param {Object} ast - 抽象语法树
     * @returns {OptimizationResult} 优化结果
     */
    optimize(ast) {
        const result = new OptimizationResult();
        const startTime = Date.now();

        try {
            console.log('🔧 开始代码优化...');

            // 深拷贝AST以避免修改原始AST
            let optimizedAST = this.deepCloneAST(ast);
            let hasChanges = true;
            this.currentPass = 0;

            // 多轮优化直到没有更多优化或达到最大轮数
            while (hasChanges && this.currentPass < this.options.maxOptimizationPasses) {
                this.currentPass++;
                console.log(`🔄 优化轮次 ${this.currentPass}...`);

                const passStartCount = this.optimizationCount;
                optimizedAST = this.performOptimizationPass(optimizedAST, result);

                hasChanges = this.optimizationCount > passStartCount;

                if (hasChanges) {
                    console.log(`✅ 轮次 ${this.currentPass} 完成，进行了 ${this.optimizationCount - passStartCount} 项优化`);
                } else {
                    console.log(`✅ 轮次 ${this.currentPass} 完成，无更多优化`);
                }
            }

            result.optimizedAST = optimizedAST;
            result.success = true;

            const endTime = Date.now();
            result.statistics.optimizationTime = endTime - startTime;

            console.log(`🎉 代码优化完成！总共进行了 ${result.statistics.totalOptimizations} 项优化`);

            if (this.options.generateOptimizationReport) {
                this.generateOptimizationReport(result);
            }

        } catch (error) {
            console.error('💥 代码优化过程中发生错误:', error.message);
            result.addError({
                message: `Optimization error: ${error.message}`,
                line: 0,
                column: 0
            });
        }

        return result;
    }

    /**
     * 执行一轮优化
     * @param {Object} ast - AST节点
     * @param {OptimizationResult} result - 优化结果
     * @returns {Object} 优化后的AST
     */
    performOptimizationPass(ast, result) {
        let optimizedAST = ast;

        // 1. 常量折叠
        if (this.options.enableConstantFolding) {
            optimizedAST = this.constantFolding(optimizedAST, result);
        }

        // 2. 代数化简
        if (this.options.enableAlgebraicSimplification) {
            optimizedAST = this.algebraicSimplification(optimizedAST, result);
        }

        // 3. 公共子表达式消除
        if (this.options.enableCommonSubexpressionElimination) {
            optimizedAST = this.commonSubexpressionElimination(optimizedAST, result);
        }

        // 4. 无用代码删除
        if (this.options.enableDeadCodeElimination) {
            optimizedAST = this.deadCodeElimination(optimizedAST, result);
        }

        return optimizedAST;
    }

    /**
     * 常量折叠优化
     * @param {Object} node - AST节点
     * @param {OptimizationResult} result - 优化结果
     * @returns {Object} 优化后的节点
     */
    constantFolding(node, result) {
        if (!node || typeof node !== 'object') {
            return node;
        }

        // 递归处理子节点
        const optimizedNode = this.deepCloneNode(node);
        Object.keys(optimizedNode).forEach(key => {
            if (Array.isArray(optimizedNode[key])) {
                optimizedNode[key] = optimizedNode[key].map(child =>
                    this.constantFolding(child, result)
                );
            } else if (optimizedNode[key] && typeof optimizedNode[key] === 'object') {
                optimizedNode[key] = this.constantFolding(optimizedNode[key], result);
            }
        });

        // 常量折叠：处理二元表达式
        if (optimizedNode.type === 'BinaryExpression') {
            const left = optimizedNode.left;
            const right = optimizedNode.right;

            // 如果左右操作数都是数字字面量，进行常量折叠
            if (left.type === 'NumericLiteral' && right.type === 'NumericLiteral') {
                const leftValue = parseFloat(left.value);
                const rightValue = parseFloat(right.value);
                let resultValue;

                switch (optimizedNode.operator) {
                    case '+':
                        resultValue = leftValue + rightValue;
                        break;
                    case '-':
                        resultValue = leftValue - rightValue;
                        break;
                    case '*':
                        resultValue = leftValue * rightValue;
                        break;
                    case '/':
                        if (rightValue !== 0) {
                            resultValue = leftValue / rightValue;
                        } else {
                            result.addWarning('Division by zero detected during constant folding');
                            return optimizedNode;
                        }
                        break;
                    case '%':
                        if (rightValue !== 0) {
                            resultValue = leftValue % rightValue;
                        } else {
                            result.addWarning('Modulo by zero detected during constant folding');
                            return optimizedNode;
                        }
                        break;
                    default:
                        return optimizedNode;
                }

                // 创建新的数字字面量节点
                const foldedNode = {
                    type: 'NumericLiteral',
                    value: resultValue.toString(),
                    line: optimizedNode.line,
                    column: optimizedNode.column
                };

                result.addOptimization(
                    'constantFoldings',
                    `Folded constant expression: ${leftValue} ${optimizedNode.operator} ${rightValue} = ${resultValue}`,
                    optimizedNode
                );
                this.optimizationCount++;

                return foldedNode;
            }
        }

        return optimizedNode;
    }

    /**
     * 代数化简优化
     * @param {Object} node - AST节点
     * @param {OptimizationResult} result - 优化结果
     * @returns {Object} 优化后的节点
     */
    algebraicSimplification(node, result) {
        if (!node || typeof node !== 'object') {
            return node;
        }

        // 递归处理子节点
        const optimizedNode = this.deepCloneNode(node);
        Object.keys(optimizedNode).forEach(key => {
            if (Array.isArray(optimizedNode[key])) {
                optimizedNode[key] = optimizedNode[key].map(child =>
                    this.algebraicSimplification(child, result)
                );
            } else if (optimizedNode[key] && typeof optimizedNode[key] === 'object') {
                optimizedNode[key] = this.algebraicSimplification(optimizedNode[key], result);
            }
        });

        // 代数化简：处理二元表达式
        if (optimizedNode.type === 'BinaryExpression') {
            const left = optimizedNode.left;
            const right = optimizedNode.right;

            // x + 0 = x
            if (optimizedNode.operator === '+' && right.type === 'NumericLiteral' && parseFloat(right.value) === 0) {
                result.addOptimization(
                    'algebraicSimplifications',
                    'Simplified x + 0 to x',
                    optimizedNode
                );
                this.optimizationCount++;
                return left;
            }

            // 0 + x = x
            if (optimizedNode.operator === '+' && left.type === 'NumericLiteral' && parseFloat(left.value) === 0) {
                result.addOptimization(
                    'algebraicSimplifications',
                    'Simplified 0 + x to x',
                    optimizedNode
                );
                this.optimizationCount++;
                return right;
            }

            // x - 0 = x
            if (optimizedNode.operator === '-' && right.type === 'NumericLiteral' && parseFloat(right.value) === 0) {
                result.addOptimization(
                    'algebraicSimplifications',
                    'Simplified x - 0 to x',
                    optimizedNode
                );
                this.optimizationCount++;
                return left;
            }

            // x * 1 = x
            if (optimizedNode.operator === '*' && right.type === 'NumericLiteral' && parseFloat(right.value) === 1) {
                result.addOptimization(
                    'algebraicSimplifications',
                    'Simplified x * 1 to x',
                    optimizedNode
                );
                this.optimizationCount++;
                return left;
            }

            // 1 * x = x
            if (optimizedNode.operator === '*' && left.type === 'NumericLiteral' && parseFloat(left.value) === 1) {
                result.addOptimization(
                    'algebraicSimplifications',
                    'Simplified 1 * x to x',
                    optimizedNode
                );
                this.optimizationCount++;
                return right;
            }

            // x * 0 = 0
            if (optimizedNode.operator === '*' &&
                ((right.type === 'NumericLiteral' && parseFloat(right.value) === 0) ||
                    (left.type === 'NumericLiteral' && parseFloat(left.value) === 0))) {
                result.addOptimization(
                    'algebraicSimplifications',
                    'Simplified x * 0 to 0',
                    optimizedNode
                );
                this.optimizationCount++;
                return {
                    type: 'NumericLiteral',
                    value: '0',
                    line: optimizedNode.line,
                    column: optimizedNode.column
                };
            }

            // x / 1 = x
            if (optimizedNode.operator === '/' && right.type === 'NumericLiteral' && parseFloat(right.value) === 1) {
                result.addOptimization(
                    'algebraicSimplifications',
                    'Simplified x / 1 to x',
                    optimizedNode
                );
                this.optimizationCount++;
                return left;
            }
        }

        return optimizedNode;
    }

    /**
     * 公共子表达式消除
     * @param {Object} node - AST节点
     * @param {OptimizationResult} result - 优化结果
     * @returns {Object} 优化后的节点
     */
    commonSubexpressionElimination(node, result) {
        if (!node || typeof node !== 'object') {
            return node;
        }

        // 简单的公共子表达式消除实现
        // 在实际编译器中，这需要更复杂的数据流分析
        const expressionMap = new Map();

        const findCommonExpressions = (currentNode) => {
            if (!currentNode || typeof currentNode !== 'object') {
                return currentNode;
            }

            // 递归处理子节点
            Object.keys(currentNode).forEach(key => {
                if (Array.isArray(currentNode[key])) {
                    currentNode[key] = currentNode[key].map(child =>
                        findCommonExpressions(child)
                    );
                } else if (currentNode[key] && typeof currentNode[key] === 'object') {
                    currentNode[key] = findCommonExpressions(currentNode[key]);
                }
            });

            // 检查二元表达式
            if (currentNode.type === 'BinaryExpression') {
                const exprKey = this.getExpressionKey(currentNode);
                if (expressionMap.has(exprKey)) {
                    result.addOptimization(
                        'commonSubexpressionEliminations',
                        `Found common subexpression: ${exprKey}`,
                        currentNode
                    );
                    this.optimizationCount++;
                } else {
                    expressionMap.set(exprKey, currentNode);
                }
            }

            return currentNode;
        };

        return findCommonExpressions(this.deepCloneNode(node));
    }

    /**
     * 无用代码删除
     * @param {Object} node - AST节点
     * @param {OptimizationResult} result - 优化结果
     * @returns {Object} 优化后的节点
     */
    deadCodeElimination(node, result) {
        if (!node || typeof node !== 'object') {
            return node;
        }

        const optimizedNode = this.deepCloneNode(node);

        // 处理程序节点
        if (optimizedNode.type === 'Program' && optimizedNode.body) {
            const originalLength = optimizedNode.body.length;
            optimizedNode.body = optimizedNode.body.filter(stmt => {
                // 删除无用的表达式语句
                if (stmt.type === 'ExpressionStatement' &&
                    stmt.expression &&
                    stmt.expression.type === 'NumericLiteral') {
                    result.addOptimization(
                        'deadCodeEliminations',
                        'Removed dead code: standalone numeric literal',
                        stmt
                    );
                    this.optimizationCount++;
                    return false;
                }
                return true;
            });

            // 递归处理剩余的语句
            optimizedNode.body = optimizedNode.body.map(stmt =>
                this.deadCodeElimination(stmt, result)
            );
        } else {
            // 递归处理其他节点
            Object.keys(optimizedNode).forEach(key => {
                if (Array.isArray(optimizedNode[key])) {
                    optimizedNode[key] = optimizedNode[key].map(child =>
                        this.deadCodeElimination(child, result)
                    );
                } else if (optimizedNode[key] && typeof optimizedNode[key] === 'object') {
                    optimizedNode[key] = this.deadCodeElimination(optimizedNode[key], result);
                }
            });
        }

        return optimizedNode;
    }

    /**
     * 获取表达式的键值（用于公共子表达式消除）
     * @param {Object} expr - 表达式节点
     * @returns {string} 表达式键值
     */
    getExpressionKey(expr) {
        if (!expr || typeof expr !== 'object') {
            return String(expr);
        }

        if (expr.type === 'BinaryExpression') {
            const leftKey = this.getExpressionKey(expr.left);
            const rightKey = this.getExpressionKey(expr.right);
            return `${leftKey}${expr.operator}${rightKey}`;
        }

        if (expr.type === 'Identifier') {
            return expr.name;
        }

        if (expr.type === 'NumericLiteral') {
            return expr.value;
        }

        return expr.type;
    }

    /**
     * 深拷贝AST
     * @param {Object} ast - 原始AST
     * @returns {Object} 拷贝的AST
     */
    deepCloneAST(ast) {
        return JSON.parse(JSON.stringify(ast));
    }

    /**
     * 深拷贝节点
     * @param {Object} node - 原始节点
     * @returns {Object} 拷贝的节点
     */
    deepCloneNode(node) {
        return JSON.parse(JSON.stringify(node));
    }

    /**
     * 生成优化报告
     * @param {OptimizationResult} result - 优化结果
     */
    generateOptimizationReport(result) {
        console.log('\n' + '='.repeat(60));
        console.log('📊 代码优化报告');
        console.log('='.repeat(60));

        console.log(`优化状态: ${result.success ? '✅ 成功' : '❌ 失败'}`);
        console.log(`优化时间: ${result.statistics.optimizationTime}ms`);
        console.log(`优化轮次: ${this.currentPass}`);
        console.log(`总优化次数: ${result.statistics.totalOptimizations}`);

        console.log('\n📈 优化统计:');
        console.log(`  常量折叠: ${result.statistics.constantFoldings}`);
        console.log(`  代数化简: ${result.statistics.algebraicSimplifications}`);
        console.log(`  公共子表达式消除: ${result.statistics.commonSubexpressionEliminations}`);
        console.log(`  无用代码删除: ${result.statistics.deadCodeEliminations}`);

        if (result.optimizations.length > 0) {
            console.log('\n🔧 优化详情:');
            result.optimizations.forEach((opt, index) => {
                console.log(`  ${index + 1}. ${opt.description}`);
            });
        }

        if (result.warnings.length > 0) {
            console.log('\n⚠️ 优化警告:');
            result.warnings.forEach((warning, index) => {
                console.log(`  ${index + 1}. ${warning}`);
            });
        }

        if (result.errors.length > 0) {
            console.log('\n❌ 优化错误:');
            result.errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error.message}`);
            });
        }

        console.log('='.repeat(60));
    }

    /**
     * 设置优化选项
     * @param {Object} options - 优化选项
     */
    setOptions(options) {
        this.options = { ...this.options, ...options };
    }

    /**
     * 重置优化器状态
     */
    reset() {
        this.optimizationCount = 0;
        this.currentPass = 0;
    }

    /**
     * 获取优化器版本信息
     * @returns {Object} 版本信息
     */
    getVersion() {
        return {
            version: '1.0.0',
            name: 'Simple Code Optimizer',
            author: '编译系统课程设计',
            optimizations: [
                'Constant Folding',
                'Algebraic Simplification',
                'Common Subexpression Elimination',
                'Dead Code Elimination'
            ]
        };
    }
}

// 导出模块
module.exports = {
    Optimizer,
    OptimizationResult
};

// 如果直接运行此文件，执行演示
if (require.main === module) {
    console.log('🎯 代码优化器演示\n');

    const optimizer = new Optimizer();

    // 演示AST（包含可优化的表达式）
    const testAST = {
        type: 'Program',
        body: [
            {
                type: 'ExpressionStatement',
                expression: {
                    type: 'BinaryExpression',
                    operator: '+',
                    left: {
                        type: 'NumericLiteral',
                        value: '5'
                    },
                    right: {
                        type: 'NumericLiteral',
                        value: '3'
                    }
                }
            },
            {
                type: 'ExpressionStatement',
                expression: {
                    type: 'BinaryExpression',
                    operator: '*',
                    left: {
                        type: 'Identifier',
                        name: 'x'
                    },
                    right: {
                        type: 'NumericLiteral',
                        value: '1'
                    }
                }
            },
            {
                type: 'ExpressionStatement',
                expression: {
                    type: 'NumericLiteral',
                    value: '42'
                }
            }
        ]
    };

    console.log('📝 测试AST:');
    console.log(JSON.stringify(testAST, null, 2));
    console.log('\n' + '='.repeat(60));

    // 执行优化
    const result = optimizer.optimize(testAST);

    if (result.success) {
        console.log('\n🎉 代码优化演示成功!');
        console.log('\n📝 优化后的AST:');
        console.log(JSON.stringify(result.optimizedAST, null, 2));
    } else {
        console.log('\n❌ 代码优化演示失败!');
    }
}