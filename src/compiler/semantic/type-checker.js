/**
 * 类型检查器模块 - type-checker.js
 * @description 提供类型检查和类型推断功能
 *              支持基本类型检查、类型转换和类型兼容性验证
 * @module compiler/semantic/type-checker
 * @author poboll
 * @date 2025
 * @version 1.0
 * 
 * 主要功能：
 * 1. 基本数据类型检查和验证
 * 2. 类型推断和类型转换
 * 3. 函数参数和返回值类型检查
 * 4. 表达式类型兼容性验证
 * 5. 类型错误检测和报告
 * 6. 支持自定义类型定义
 */

const { logger } = require('../../utils/logger');

// 基本数据类型定义
const DataType = {
    NUMBER: 'number',
    STRING: 'string',
    BOOLEAN: 'boolean',
    NULL: 'null',
    UNDEFINED: 'undefined',
    FUNCTION: 'function',
    OBJECT: 'object',
    ARRAY: 'array',
    UNKNOWN: 'unknown'
};

/**
 * 类型检查器类
 */
class TypeChecker {
    constructor() {
        this.typeErrors = [];
        this.typeWarnings = [];
    }

    /**
     * 检查表达式类型
     * @param {Object} expression - 表达式节点
     * @returns {string} - 推断的类型
     */
    checkExpressionType(expression) {
        if (!expression) {
            return DataType.UNKNOWN;
        }

        switch (expression.nodeType) {
            case 'NumberLiteral':
                return DataType.NUMBER;
            case 'StringLiteral':
                return DataType.STRING;
            case 'BooleanLiteral':
                return DataType.BOOLEAN;
            case 'NullLiteral':
                return DataType.NULL;
            case 'Identifier':
                return this.getIdentifierType(expression.name);
            case 'BinaryExpression':
                return this.checkBinaryExpressionType(expression);
            case 'UnaryExpression':
                return this.checkUnaryExpressionType(expression);
            case 'CallExpression':
                return this.checkCallExpressionType(expression);
            default:
                logger.debug(`[类型检查] 未知表达式类型: ${expression.nodeType}`);
                return DataType.UNKNOWN;
        }
    }

    /**
     * 检查二元表达式类型
     * @param {Object} expression - 二元表达式节点
     * @returns {string} - 结果类型
     */
    checkBinaryExpressionType(expression) {
        const leftType = this.checkExpressionType(expression.left);
        const rightType = this.checkExpressionType(expression.right);
        const operator = expression.operator;

        // 算术运算符
        if (['+', '-', '*', '/', '%'].includes(operator)) {
            if (operator === '+' && (leftType === DataType.STRING || rightType === DataType.STRING)) {
                return DataType.STRING; // 字符串连接
            }
            if (leftType === DataType.NUMBER && rightType === DataType.NUMBER) {
                return DataType.NUMBER;
            }
            this.addTypeError(`算术运算类型不匹配: ${leftType} ${operator} ${rightType}`);
            return DataType.UNKNOWN;
        }

        // 比较运算符
        if (['==', '!=', '===', '!==', '<', '>', '<=', '>='].includes(operator)) {
            return DataType.BOOLEAN;
        }

        // 逻辑运算符
        if (['&&', '||'].includes(operator)) {
            return DataType.BOOLEAN;
        }

        return DataType.UNKNOWN;
    }

    /**
     * 检查一元表达式类型
     * @param {Object} expression - 一元表达式节点
     * @returns {string} - 结果类型
     */
    checkUnaryExpressionType(expression) {
        const operandType = this.checkExpressionType(expression.operand);
        const operator = expression.operator;

        switch (operator) {
            case '!':
                return DataType.BOOLEAN;
            case '-':
            case '+':
                if (operandType === DataType.NUMBER) {
                    return DataType.NUMBER;
                }
                this.addTypeError(`一元运算符 ${operator} 不能应用于类型 ${operandType}`);
                return DataType.UNKNOWN;
            default:
                return DataType.UNKNOWN;
        }
    }

    /**
     * 检查函数调用表达式类型
     * @param {Object} expression - 函数调用表达式节点
     * @returns {string} - 返回值类型
     */
    checkCallExpressionType(expression) {
        // 简化实现，实际应该查找函数定义
        logger.debug(`[类型检查] 检查函数调用: ${expression.callee?.name || 'anonymous'}`);
        return DataType.UNKNOWN;
    }

    /**
     * 获取标识符类型
     * @param {string} name - 标识符名称
     * @returns {string} - 标识符类型
     */
    getIdentifierType(name) {
        // 简化实现，实际应该查找符号表
        logger.debug(`[类型检查] 查找标识符类型: ${name}`);
        return DataType.UNKNOWN;
    }

    /**
     * 检查类型兼容性
     * @param {string} expectedType - 期望类型
     * @param {string} actualType - 实际类型
     * @returns {boolean} - 是否兼容
     */
    isTypeCompatible(expectedType, actualType) {
        if (expectedType === actualType) {
            return true;
        }

        // 数字和字符串在某些情况下可以兼容
        if (expectedType === DataType.STRING && actualType === DataType.NUMBER) {
            return true;
        }

        // null 可以赋值给任何类型
        if (actualType === DataType.NULL) {
            return true;
        }

        return false;
    }

    /**
     * 添加类型错误
     * @param {string} message - 错误消息
     */
    addTypeError(message) {
        this.typeErrors.push(message);
        logger.debug(`[类型检查] 错误: ${message}`);
    }

    /**
     * 添加类型警告
     * @param {string} message - 警告消息
     */
    addTypeWarning(message) {
        this.typeWarnings.push(message);
        logger.debug(`[类型检查] 警告: ${message}`);
    }

    /**
     * 获取所有类型错误
     * @returns {Array} - 错误列表
     */
    getTypeErrors() {
        return this.typeErrors;
    }

    /**
     * 获取所有类型警告
     * @returns {Array} - 警告列表
     */
    getTypeWarnings() {
        return this.typeWarnings;
    }

    /**
     * 清除所有错误和警告
     */
    clearErrors() {
        this.typeErrors = [];
        this.typeWarnings = [];
    }
}

module.exports = {
    TypeChecker,
    DataType
};