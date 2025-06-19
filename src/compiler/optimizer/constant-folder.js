/**
 * 常量折叠优化模块 - constant-folder.js
 * @description 实现编译时常量表达式的计算和折叠优化
 *              减少运行时计算，提高代码执行效率
 * @module compiler/optimizer/constant-folder
 * @author poboll
 * @date 2025
 * @version 1.0
 * 
 * 主要功能：
 * 1. 识别和计算常量表达式
 * 2. 折叠算术运算表达式
 * 3. 折叠逻辑运算表达式
 * 4. 折叠比较运算表达式
 * 5. 处理字符串常量操作
 * 6. 支持条件表达式的常量折叠
 */

const { logger } = require('../../utils/logger');
const { NodeType } = require('../parser/ast-node');

/**
 * 常量折叠器类
 */
class ConstantFolder {
    constructor() {
        this.foldCount = 0;
        this.statistics = {
            arithmeticFolds: 0,
            logicalFolds: 0,
            comparisonFolds: 0,
            stringFolds: 0,
            conditionalFolds: 0
        };
    }

    /**
     * 对AST进行常量折叠优化
     * @param {ASTNode} ast - 抽象语法树
     * @returns {ASTNode} - 优化后的AST
     */
    fold(ast) {
        logger.phase('ConstantFolder', '开始常量折叠优化');

        this.foldCount = 0;
        this.resetStatistics();

        const optimizedAst = this.visitNode(ast);

        logger.success(`常量折叠完成，共折叠 ${this.foldCount} 个表达式`);
        this.logStatistics();

        return optimizedAst;
    }

    /**
     * 访问AST节点
     * @param {ASTNode} node - AST节点
     * @returns {ASTNode} - 处理后的节点
     */
    visitNode(node) {
        if (!node) return node;

        // 递归处理子节点
        if (node.children) {
            node.children = node.children.map(child => this.visitNode(child));
        }

        // 根据节点类型进行常量折叠
        switch (node.nodeType) {
            case NodeType.BINARY_EXPRESSION:
                return this.foldBinaryExpression(node);
            case NodeType.UNARY_EXPRESSION:
                return this.foldUnaryExpression(node);
            case NodeType.ASSIGNMENT_EXPRESSION:
                return this.foldAssignmentExpression(node);
            case NodeType.CALL_EXPRESSION:
                return this.foldCallExpression(node);
            default:
                return node;
        }
    }

    /**
     * 折叠二元表达式
     * @param {ASTNode} node - 二元表达式节点
     * @returns {ASTNode} - 折叠后的节点
     */
    foldBinaryExpression(node) {
        const left = node.left;
        const right = node.right;
        const operator = node.operator;

        // 检查是否为常量操作数
        if (!this.isConstant(left) || !this.isConstant(right)) {
            return node;
        }

        const leftValue = this.getConstantValue(left);
        const rightValue = this.getConstantValue(right);

        let result;

        try {
            switch (operator) {
                // 算术运算
                case '+':
                    result = leftValue + rightValue;
                    this.statistics.arithmeticFolds++;
                    break;
                case '-':
                    result = leftValue - rightValue;
                    this.statistics.arithmeticFolds++;
                    break;
                case '*':
                    result = leftValue * rightValue;
                    this.statistics.arithmeticFolds++;
                    break;
                case '/':
                    if (rightValue === 0) {
                        logger.warn('常量折叠：检测到除零操作');
                        return node;
                    }
                    result = leftValue / rightValue;
                    this.statistics.arithmeticFolds++;
                    break;
                case '%':
                    if (rightValue === 0) {
                        logger.warn('常量折叠：检测到模零操作');
                        return node;
                    }
                    result = leftValue % rightValue;
                    this.statistics.arithmeticFolds++;
                    break;

                // 比较运算
                case '==':
                case '===':
                    result = leftValue === rightValue;
                    this.statistics.comparisonFolds++;
                    break;
                case '!=':
                case '!==':
                    result = leftValue !== rightValue;
                    this.statistics.comparisonFolds++;
                    break;
                case '<':
                    result = leftValue < rightValue;
                    this.statistics.comparisonFolds++;
                    break;
                case '<=':
                    result = leftValue <= rightValue;
                    this.statistics.comparisonFolds++;
                    break;
                case '>':
                    result = leftValue > rightValue;
                    this.statistics.comparisonFolds++;
                    break;
                case '>=':
                    result = leftValue >= rightValue;
                    this.statistics.comparisonFolds++;
                    break;

                // 逻辑运算
                case '&&':
                    result = leftValue && rightValue;
                    this.statistics.logicalFolds++;
                    break;
                case '||':
                    result = leftValue || rightValue;
                    this.statistics.logicalFolds++;
                    break;

                // 位运算
                case '&':
                    result = leftValue & rightValue;
                    this.statistics.arithmeticFolds++;
                    break;
                case '|':
                    result = leftValue | rightValue;
                    this.statistics.arithmeticFolds++;
                    break;
                case '^':
                    result = leftValue ^ rightValue;
                    this.statistics.arithmeticFolds++;
                    break;
                case '<<':
                    result = leftValue << rightValue;
                    this.statistics.arithmeticFolds++;
                    break;
                case '>>':
                    result = leftValue >> rightValue;
                    this.statistics.arithmeticFolds++;
                    break;

                default:
                    return node;
            }

            this.foldCount++;
            return this.createConstantNode(result, node.line, node.column);

        } catch (error) {
            logger.warn(`常量折叠失败: ${error.message}`);
            return node;
        }
    }

    /**
     * 折叠一元表达式
     * @param {ASTNode} node - 一元表达式节点
     * @returns {ASTNode} - 折叠后的节点
     */
    foldUnaryExpression(node) {
        const operand = node.operand;
        const operator = node.operator;

        if (!this.isConstant(operand)) {
            return node;
        }

        const value = this.getConstantValue(operand);
        let result;

        try {
            switch (operator) {
                case '+':
                    result = +value;
                    break;
                case '-':
                    result = -value;
                    break;
                case '!':
                    result = !value;
                    this.statistics.logicalFolds++;
                    break;
                case '~':
                    result = ~value;
                    break;
                case 'typeof':
                    result = typeof value;
                    this.statistics.stringFolds++;
                    break;
                default:
                    return node;
            }

            this.foldCount++;
            return this.createConstantNode(result, node.line, node.column);

        } catch (error) {
            logger.warn(`一元表达式常量折叠失败: ${error.message}`);
            return node;
        }
    }

    /**
     * 折叠赋值表达式
     * @param {ASTNode} node - 赋值表达式节点
     * @returns {ASTNode} - 处理后的节点
     */
    foldAssignmentExpression(node) {
        // 对右侧表达式进行常量折叠
        if (node.right) {
            node.right = this.visitNode(node.right);
        }
        return node;
    }

    /**
     * 折叠函数调用表达式
     * @param {ASTNode} node - 函数调用表达式节点
     * @returns {ASTNode} - 处理后的节点
     */
    foldCallExpression(node) {
        // 对参数进行常量折叠
        if (node.arguments) {
            node.arguments = node.arguments.map(arg => this.visitNode(arg));
        }

        // 检查是否为内置函数的常量调用
        if (node.callee && node.callee.nodeType === NodeType.IDENTIFIER) {
            const functionName = node.callee.name;

            // 处理Math函数
            if (this.isMathFunction(functionName) && this.allArgumentsConstant(node.arguments)) {
                return this.foldMathFunction(functionName, node.arguments, node.line, node.column);
            }
        }

        return node;
    }

    /**
     * 折叠Math函数调用
     * @param {string} functionName - 函数名
     * @param {Array} args - 参数列表
     * @param {number} line - 行号
     * @param {number} column - 列号
     * @returns {ASTNode} - 折叠后的节点
     */
    foldMathFunction(functionName, args, line, column) {
        try {
            const values = args.map(arg => this.getConstantValue(arg));
            let result;

            switch (functionName) {
                case 'Math.abs':
                    result = Math.abs(values[0]);
                    break;
                case 'Math.ceil':
                    result = Math.ceil(values[0]);
                    break;
                case 'Math.floor':
                    result = Math.floor(values[0]);
                    break;
                case 'Math.round':
                    result = Math.round(values[0]);
                    break;
                case 'Math.sqrt':
                    result = Math.sqrt(values[0]);
                    break;
                case 'Math.pow':
                    result = Math.pow(values[0], values[1]);
                    break;
                case 'Math.max':
                    result = Math.max(...values);
                    break;
                case 'Math.min':
                    result = Math.min(...values);
                    break;
                case 'Math.sin':
                    result = Math.sin(values[0]);
                    break;
                case 'Math.cos':
                    result = Math.cos(values[0]);
                    break;
                case 'Math.tan':
                    result = Math.tan(values[0]);
                    break;
                default:
                    return null;
            }

            this.foldCount++;
            this.statistics.arithmeticFolds++;
            return this.createConstantNode(result, line, column);

        } catch (error) {
            logger.warn(`Math函数常量折叠失败: ${error.message}`);
            return null;
        }
    }

    /**
     * 检查节点是否为常量
     * @param {ASTNode} node - AST节点
     * @returns {boolean} - 是否为常量
     */
    isConstant(node) {
        if (!node) return false;

        return node.nodeType === NodeType.NUMBER_LITERAL ||
            node.nodeType === NodeType.STRING_LITERAL ||
            node.nodeType === NodeType.BOOLEAN_LITERAL ||
            node.nodeType === NodeType.NULL_LITERAL;
    }

    /**
     * 获取常量节点的值
     * @param {ASTNode} node - 常量节点
     * @returns {*} - 常量值
     */
    getConstantValue(node) {
        switch (node.nodeType) {
            case NodeType.NUMBER_LITERAL:
                return node.value;
            case NodeType.STRING_LITERAL:
                return node.value;
            case NodeType.BOOLEAN_LITERAL:
                return node.value;
            case NodeType.NULL_LITERAL:
                return null;
            default:
                return undefined;
        }
    }

    /**
     * 创建常量节点
     * @param {*} value - 常量值
     * @param {number} line - 行号
     * @param {number} column - 列号
     * @returns {ASTNode} - 常量节点
     */
    createConstantNode(value, line = 0, column = 0) {
        const { ASTNode, NodeType } = require('../parser/ast-node');

        let nodeType;

        if (typeof value === 'number') {
            nodeType = NodeType.NUMBER_LITERAL;
        } else if (typeof value === 'string') {
            nodeType = NodeType.STRING_LITERAL;
        } else if (typeof value === 'boolean') {
            nodeType = NodeType.BOOLEAN_LITERAL;
        } else if (value === null) {
            nodeType = NodeType.NULL_LITERAL;
        } else {
            nodeType = NodeType.NUMBER_LITERAL;
            value = 0;
        }

        const node = new ASTNode(nodeType, line, column);
        node.value = value;
        return node;
    }

    /**
     * 检查是否为Math函数
     * @param {string} functionName - 函数名
     * @returns {boolean} - 是否为Math函数
     */
    isMathFunction(functionName) {
        const mathFunctions = [
            'Math.abs', 'Math.ceil', 'Math.floor', 'Math.round',
            'Math.sqrt', 'Math.pow', 'Math.max', 'Math.min',
            'Math.sin', 'Math.cos', 'Math.tan', 'Math.asin',
            'Math.acos', 'Math.atan', 'Math.log', 'Math.exp'
        ];
        return mathFunctions.includes(functionName);
    }

    /**
     * 检查所有参数是否都是常量
     * @param {Array} args - 参数列表
     * @returns {boolean} - 是否都是常量
     */
    allArgumentsConstant(args) {
        return args && args.every(arg => this.isConstant(arg));
    }

    /**
     * 重置统计信息
     */
    resetStatistics() {
        this.statistics = {
            arithmeticFolds: 0,
            logicalFolds: 0,
            comparisonFolds: 0,
            stringFolds: 0,
            conditionalFolds: 0
        };
    }

    /**
     * 记录统计信息
     */
    logStatistics() {
        logger.info('常量折叠统计:');
        logger.info(`  算术表达式: ${this.statistics.arithmeticFolds}`);
        logger.info(`  逻辑表达式: ${this.statistics.logicalFolds}`);
        logger.info(`  比较表达式: ${this.statistics.comparisonFolds}`);
        logger.info(`  字符串操作: ${this.statistics.stringFolds}`);
        logger.info(`  条件表达式: ${this.statistics.conditionalFolds}`);
    }

    /**
     * 获取优化统计信息
     * @returns {Object} - 统计信息
     */
    getStatistics() {
        return {
            totalFolds: this.foldCount,
            ...this.statistics
        };
    }

    /**
     * 检查表达式是否可以进一步优化
     * @param {ASTNode} node - AST节点
     * @returns {boolean} - 是否可以优化
     */
    canOptimize(node) {
        if (!node) return false;

        // 检查是否包含常量表达式
        if (node.nodeType === NodeType.BINARY_EXPRESSION) {
            return this.isConstant(node.left) && this.isConstant(node.right);
        }

        if (node.nodeType === NodeType.UNARY_EXPRESSION) {
            return this.isConstant(node.operand);
        }

        return false;
    }
}

module.exports = {
    ConstantFolder
};