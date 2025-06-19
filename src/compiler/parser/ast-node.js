/**
 * AST节点基类模块 - ast-node.js
 * @description 定义抽象语法树节点的基础类和通用方法
 *              提供AST节点的创建、遍历和操作接口
 * @module compiler/parser/ast-node
 * @author poboll
 * @date 2025
 * @version 1.0
 * 
 * 主要功能：
 * 1. 定义AST节点的基础类结构
 * 2. 提供节点类型枚举和常量
 * 3. 实现节点遍历和访问方法
 * 4. 支持节点的序列化和反序列化
 * 5. 提供节点操作的工具方法
 * 6. 支持节点的克隆和比较
 */

const { logger } = require('../../utils/logger');

// AST节点类型枚举
const NodeType = {
    // 程序结构
    PROGRAM: 'Program',
    BLOCK_STATEMENT: 'BlockStatement',

    // 声明
    VARIABLE_DECLARATION: 'VariableDeclaration',
    FUNCTION_DECLARATION: 'FunctionDeclaration',

    // 语句
    EXPRESSION_STATEMENT: 'ExpressionStatement',
    IF_STATEMENT: 'IfStatement',
    WHILE_STATEMENT: 'WhileStatement',
    FOR_STATEMENT: 'ForStatement',
    RETURN_STATEMENT: 'ReturnStatement',
    BREAK_STATEMENT: 'BreakStatement',
    CONTINUE_STATEMENT: 'ContinueStatement',

    // 表达式
    BINARY_EXPRESSION: 'BinaryExpression',
    UNARY_EXPRESSION: 'UnaryExpression',
    ASSIGNMENT_EXPRESSION: 'AssignmentExpression',
    CALL_EXPRESSION: 'CallExpression',
    MEMBER_EXPRESSION: 'MemberExpression',

    // 字面量
    NUMBER_LITERAL: 'NumberLiteral',
    STRING_LITERAL: 'StringLiteral',
    BOOLEAN_LITERAL: 'BooleanLiteral',
    NULL_LITERAL: 'NullLiteral',

    // 标识符
    IDENTIFIER: 'Identifier'
};

/**
 * AST节点基类
 */
class ASTNode {
    /**
     * 构造函数
     * @param {string} type - 节点类型
     * @param {number} line - 行号
     * @param {number} column - 列号
     */
    constructor(type, line = 0, column = 0) {
        this.nodeType = type;
        this.line = line;
        this.column = column;
        this.parent = null;
        this.children = [];
    }

    /**
     * 添加子节点
     * @param {ASTNode} child - 子节点
     */
    addChild(child) {
        if (child instanceof ASTNode) {
            child.parent = this;
            this.children.push(child);
        }
    }

    /**
     * 移除子节点
     * @param {ASTNode} child - 要移除的子节点
     */
    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            this.children.splice(index, 1);
            child.parent = null;
        }
    }

    /**
     * 获取所有子节点
     * @returns {Array<ASTNode>} - 子节点数组
     */
    getChildren() {
        return this.children;
    }

    /**
     * 获取父节点
     * @returns {ASTNode|null} - 父节点
     */
    getParent() {
        return this.parent;
    }

    /**
     * 检查是否为叶子节点
     * @returns {boolean} - 是否为叶子节点
     */
    isLeaf() {
        return this.children.length === 0;
    }

    /**
     * 获取节点深度
     * @returns {number} - 节点深度
     */
    getDepth() {
        let depth = 0;
        let current = this.parent;
        while (current) {
            depth++;
            current = current.parent;
        }
        return depth;
    }

    /**
     * 遍历节点（深度优先）
     * @param {Function} visitor - 访问函数
     */
    traverse(visitor) {
        visitor(this);
        for (const child of this.children) {
            if (child instanceof ASTNode) {
                child.traverse(visitor);
            }
        }
    }

    /**
     * 查找特定类型的节点
     * @param {string} nodeType - 节点类型
     * @returns {Array<ASTNode>} - 匹配的节点数组
     */
    findNodes(nodeType) {
        const result = [];
        this.traverse(node => {
            if (node.nodeType === nodeType) {
                result.push(node);
            }
        });
        return result;
    }

    /**
     * 克隆节点
     * @returns {ASTNode} - 克隆的节点
     */
    clone() {
        const cloned = new ASTNode(this.nodeType, this.line, this.column);

        // 复制所有属性
        for (const key in this) {
            if (this.hasOwnProperty(key) && key !== 'parent' && key !== 'children') {
                cloned[key] = this[key];
            }
        }

        // 递归克隆子节点
        for (const child of this.children) {
            if (child instanceof ASTNode) {
                cloned.addChild(child.clone());
            }
        }

        return cloned;
    }

    /**
     * 转换为JSON对象
     * @returns {Object} - JSON表示
     */
    toJSON() {
        const json = {
            nodeType: this.nodeType,
            line: this.line,
            column: this.column
        };

        // 添加其他属性
        for (const key in this) {
            if (this.hasOwnProperty(key) &&
                key !== 'parent' &&
                key !== 'children' &&
                key !== 'nodeType' &&
                key !== 'line' &&
                key !== 'column') {
                json[key] = this[key];
            }
        }

        // 添加子节点
        if (this.children.length > 0) {
            json.children = this.children.map(child =>
                child instanceof ASTNode ? child.toJSON() : child
            );
        }

        return json;
    }

    /**
     * 转换为字符串表示
     * @returns {string} - 字符串表示
     */
    toString() {
        return `${this.nodeType}(${this.line}:${this.column})`;
    }

    /**
     * 获取节点的位置信息
     * @returns {Object} - 位置信息
     */
    getLocation() {
        return {
            line: this.line,
            column: this.column
        };
    }

    /**
     * 设置节点的位置信息
     * @param {number} line - 行号
     * @param {number} column - 列号
     */
    setLocation(line, column) {
        this.line = line;
        this.column = column;
    }
}

/**
 * 创建AST节点的工厂函数
 * @param {string} type - 节点类型
 * @param {Object} properties - 节点属性
 * @param {number} line - 行号
 * @param {number} column - 列号
 * @returns {ASTNode} - 创建的节点
 */
function createNode(type, properties = {}, line = 0, column = 0) {
    const node = new ASTNode(type, line, column);

    // 设置属性
    for (const key in properties) {
        if (properties.hasOwnProperty(key)) {
            node[key] = properties[key];
        }
    }

    return node;
}

/**
 * 验证节点类型
 * @param {string} type - 节点类型
 * @returns {boolean} - 是否为有效类型
 */
function isValidNodeType(type) {
    return Object.values(NodeType).includes(type);
}

module.exports = {
    ASTNode,
    NodeType,
    createNode,
    isValidNodeType
};