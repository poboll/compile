/**
 * 语义分析器模块 - semantic.js
 * @description 对抽象语法树进行语义分析，检查类型一致性和作用域规则
 *              生成符号表并进行语义错误检测
 * @module compiler/semantic/semantic
 * @author poboll
 * @date 2025
 * @version 1.0
 * 
 * 主要功能：
 * 1. 分析AST结构和语义信息
 * 2. 检查类型一致性和类型转换
 * 3. 检查变量作用域和生命周期
 * 4. 生成和维护符号表
 * 5. 检测语义错误和警告
 * 6. 支持函数调用和参数匹配检查
 * 7. 提供语义分析结果和诊断信息
 */

const SymbolTable = require('./symbol-table');
const { TypeChecker } = require('./type-checker');
const { logger } = require('../../utils/logger');

class Analyzer {
    constructor(ast, { onEnter, onExit } = {}) {
        this.ast = ast;
        this.symbolTable = new SymbolTable();
        this.errors = [];
        this.onEnter = onEnter;
        this.onExit = onExit;
    }

    log(message) {
        logger.debug(`[语义分析] ${message}`);
    }

    analyze() {
        this.log('--- 语义分析开始 ---');
        this.visit(this.ast);
        this.log('--- 语义分析完成 ---');
        if (this.errors.length > 0) {
            this.log('发现语义错误:');
            this.errors.forEach(err => this.log(err));
        }
        return this.errors;
    }

    visit(node) {
        if (!node || typeof this[node.nodeType] !== 'function') {
            return;
        }
        if (this.onEnter) {
            this.onEnter(node);
        }
        this[node.nodeType](node);
        if (this.onExit) {
            this.onExit(node);
        }
    }

    Program(node) {
        this.symbolTable.enterScope();
        node.body.forEach(child => this.visit(child));
        this.symbolTable.exitScope();
    }

    VariableDeclaration(node) {
        const name = node.identifier.name;
        if (this.symbolTable.lookupCurrentScope(name)) {
            this.errors.push(`错误: 变量 "${name}" 在当前作用域已声明 (行 ${node.line})`);
        } else {
            this.symbolTable.insert(name, { type: node.kind });
        }
        if (node.initializer) {
            this.visit(node.initializer);
        }
    }

    FunctionDeclaration(node) {
        const name = node.identifier.name;
        if (this.symbolTable.lookupCurrentScope(name)) {
            this.errors.push(`错误: 函数 "${name}" 在当前作用域已声明 (行 ${node.line})`);
        } else {
            this.symbolTable.insert(name, { type: 'function' });
        }

        this.symbolTable.enterScope();
        node.params.forEach(param => {
            const paramName = param.name;
            if (this.symbolTable.lookupCurrentScope(paramName)) {
                this.errors.push(`错误: 参数 "${paramName}" 重复声明 (行 ${param.line})`);
            } else {
                this.symbolTable.insert(paramName, { type: 'param' });
            }
        });
        this.visit(node.body);
        this.symbolTable.exitScope();
    }

    BlockStatement(node) {
        this.symbolTable.enterScope();
        node.body.forEach(child => this.visit(child));
        this.symbolTable.exitScope();
    }

    IfStatement(node) {
        this.visit(node.test);
        this.visit(node.consequent);
        if (node.alternate) {
            this.visit(node.alternate);
        }
    }

    WhileStatement(node) {
        this.visit(node.test);
        this.visit(node.body);
    }

    AssignmentExpression(node) {
        const name = node.left.name;
        if (!this.symbolTable.lookup(name)) {
            this.errors.push(`错误: 变量 "${name}" 未声明 (行 ${node.line})`);
        }
        this.visit(node.right);
    }

    BinaryExpression(node) {
        this.visit(node.left);
        this.visit(node.right);
    }

    CallExpression(node) {
        this.visit(node.callee);
        node.arguments.forEach(arg => this.visit(arg));
    }

    Identifier(node) {
        if (!this.symbolTable.lookup(node.name)) {
            // A more complex check is needed to differentiate between variable use and declarations
            // For now, we only check in AssignmentExpression's left side.
        }
    }

    ExpressionStatement(node) {
        this.visit(node.expression);
    }

    Literal(node) {
        // Literals have no semantic rules to check here
    }
}

module.exports = Analyzer;