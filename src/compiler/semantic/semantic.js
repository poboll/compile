/**
 * 语义分析器
 * 
 * 功能：
 * 1. 符号表管理
 * 2. 类型检查
 * 3. 作用域分析
 * 4. 语义错误检测
 * 
 * 作者：编译系统课程设计
 * 日期：2024
 */

// 符号表项
class Symbol {
    constructor(name, type, scope, line, column) {
        this.name = name;
        this.type = type;
        this.scope = scope;
        this.line = line;
        this.column = column;
        this.used = false;
    }
}

// 作用域
class Scope {
    constructor(name, parent = null) {
        this.name = name;
        this.parent = parent;
        this.symbols = new Map();
        this.children = [];
        if (parent) {
            parent.children.push(this);
        }
    }

    // 在当前作用域中定义符号
    define(symbol) {
        if (this.symbols.has(symbol.name)) {
            return false; // 重复定义
        }
        this.symbols.set(symbol.name, symbol);
        return true;
    }

    // 在当前作用域及父作用域中查找符号
    lookup(name) {
        if (this.symbols.has(name)) {
            return this.symbols.get(name);
        }
        if (this.parent) {
            return this.parent.lookup(name);
        }
        return null;
    }

    // 仅在当前作用域中查找符号
    lookupLocal(name) {
        return this.symbols.get(name) || null;
    }
}

// 语义分析器
class SemanticAnalyzer {
    constructor() {
        this.globalScope = new Scope('global');
        this.currentScope = this.globalScope;
        this.errors = [];
        this.warnings = [];
    }

    // 分析AST
    analyze(ast) {
        this.errors = [];
        this.warnings = [];
        this.currentScope = this.globalScope;

        try {
            this.visitNode(ast);
            this.checkUnusedVariables();
        } catch (error) {
            this.addError(`语义分析过程中发生错误: ${error.message}`);
        }

        return {
            success: this.errors.length === 0,
            errors: this.errors,
            warnings: this.warnings,
            symbolTable: this.globalScope
        };
    }

    // 访问AST节点
    visitNode(node) {
        if (!node) return;

        switch (node.type) {
            case 'Program':
                this.visitProgram(node);
                break;
            case 'VariableDeclaration':
                this.visitVariableDeclaration(node);
                break;
            case 'FunctionDeclaration':
                this.visitFunctionDeclaration(node);
                break;
            case 'Identifier':
                this.visitIdentifier(node);
                break;
            case 'BinaryExpression':
                this.visitBinaryExpression(node);
                break;
            case 'AssignmentExpression':
                this.visitAssignmentExpression(node);
                break;
            case 'CallExpression':
                this.visitCallExpression(node);
                break;
            case 'IfStatement':
                this.visitIfStatement(node);
                break;
            case 'WhileStatement':
                this.visitWhileStatement(node);
                break;
            case 'BlockStatement':
                this.visitBlockStatement(node);
                break;
            case 'ReturnStatement':
                this.visitReturnStatement(node);
                break;
            case 'Literal':
                // 字面量不需要特殊处理
                break;
            default:
                this.addWarning(`未知的AST节点类型: ${node.type}`);
        }
    }

    // 访问程序节点
    visitProgram(node) {
        if (node.body) {
            node.body.forEach(stmt => this.visitNode(stmt));
        }
    }

    // 访问变量声明
    visitVariableDeclaration(node) {
        if (node.declarations) {
            node.declarations.forEach(decl => {
                const symbol = new Symbol(
                    decl.id.name,
                    this.inferType(decl.init),
                    this.currentScope.name,
                    decl.line || 0,
                    decl.column || 0
                );

                if (!this.currentScope.define(symbol)) {
                    this.addError(`变量 '${decl.id.name}' 重复定义`);
                }

                // 分析初始化表达式
                if (decl.init) {
                    this.visitNode(decl.init);
                }
            });
        }
    }

    // 访问函数声明
    visitFunctionDeclaration(node) {
        // 在当前作用域中定义函数
        const symbol = new Symbol(
            node.id.name,
            'function',
            this.currentScope.name,
            node.line || 0,
            node.column || 0
        );

        if (!this.currentScope.define(symbol)) {
            this.addError(`函数 '${node.id.name}' 重复定义`);
        }

        // 创建函数作用域
        const functionScope = new Scope(`function_${node.id.name}`, this.currentScope);
        const previousScope = this.currentScope;
        this.currentScope = functionScope;

        // 处理参数
        if (node.params) {
            node.params.forEach(param => {
                const paramSymbol = new Symbol(
                    param.name,
                    'parameter',
                    this.currentScope.name,
                    param.line || 0,
                    param.column || 0
                );
                this.currentScope.define(paramSymbol);
            });
        }

        // 分析函数体
        if (node.body) {
            this.visitNode(node.body);
        }

        // 恢复作用域
        this.currentScope = previousScope;
    }

    // 访问标识符
    visitIdentifier(node) {
        const symbol = this.currentScope.lookup(node.name);
        if (!symbol) {
            this.addError(`未定义的标识符 '${node.name}'`);
        } else {
            symbol.used = true;
        }
    }

    // 访问二元表达式
    visitBinaryExpression(node) {
        this.visitNode(node.left);
        this.visitNode(node.right);

        // 简单的类型检查
        const leftType = this.getExpressionType(node.left);
        const rightType = this.getExpressionType(node.right);

        if (leftType && rightType && leftType !== rightType) {
            if (!this.isCompatibleTypes(leftType, rightType, node.operator)) {
                this.addWarning(`类型不匹配: ${leftType} ${node.operator} ${rightType}`);
            }
        }
    }

    // 访问赋值表达式
    visitAssignmentExpression(node) {
        this.visitNode(node.right);

        if (node.left.type === 'Identifier') {
            const symbol = this.currentScope.lookup(node.left.name);
            if (!symbol) {
                this.addError(`未定义的变量 '${node.left.name}'`);
            } else {
                symbol.used = true;
                // 类型检查
                const rightType = this.getExpressionType(node.right);
                if (symbol.type && rightType && symbol.type !== rightType) {
                    this.addWarning(`类型不匹配: 无法将 ${rightType} 赋值给 ${symbol.type}`);
                }
            }
        } else {
            this.visitNode(node.left);
        }
    }

    // 访问函数调用
    visitCallExpression(node) {
        this.visitNode(node.callee);

        if (node.arguments) {
            node.arguments.forEach(arg => this.visitNode(arg));
        }

        // 检查函数是否存在
        if (node.callee.type === 'Identifier') {
            const symbol = this.currentScope.lookup(node.callee.name);
            if (!symbol) {
                this.addError(`未定义的函数 '${node.callee.name}'`);
            } else if (symbol.type !== 'function') {
                this.addError(`'${node.callee.name}' 不是一个函数`);
            }
        }
    }

    // 访问if语句
    visitIfStatement(node) {
        this.visitNode(node.test);

        // 创建新作用域
        const ifScope = new Scope('if', this.currentScope);
        const previousScope = this.currentScope;
        this.currentScope = ifScope;

        this.visitNode(node.consequent);

        this.currentScope = previousScope;

        if (node.alternate) {
            const elseScope = new Scope('else', this.currentScope);
            this.currentScope = elseScope;
            this.visitNode(node.alternate);
            this.currentScope = previousScope;
        }
    }

    // 访问while语句
    visitWhileStatement(node) {
        this.visitNode(node.test);

        // 创建新作用域
        const whileScope = new Scope('while', this.currentScope);
        const previousScope = this.currentScope;
        this.currentScope = whileScope;

        this.visitNode(node.body);

        this.currentScope = previousScope;
    }

    // 访问块语句
    visitBlockStatement(node) {
        if (node.body) {
            node.body.forEach(stmt => this.visitNode(stmt));
        }
    }

    // 访问return语句
    visitReturnStatement(node) {
        if (node.argument) {
            this.visitNode(node.argument);
        }
    }

    // 推断类型
    inferType(node) {
        if (!node) return 'undefined';

        switch (node.type) {
            case 'Literal':
                if (typeof node.value === 'number') return 'number';
                if (typeof node.value === 'string') return 'string';
                if (typeof node.value === 'boolean') return 'boolean';
                return 'unknown';
            case 'Identifier':
                const symbol = this.currentScope.lookup(node.name);
                return symbol ? symbol.type : 'unknown';
            case 'BinaryExpression':
                return this.getBinaryExpressionType(node);
            default:
                return 'unknown';
        }
    }

    // 获取表达式类型
    getExpressionType(node) {
        return this.inferType(node);
    }

    // 获取二元表达式类型
    getBinaryExpressionType(node) {
        const leftType = this.getExpressionType(node.left);
        const rightType = this.getExpressionType(node.right);

        if (['+', '-', '*', '/', '%'].includes(node.operator)) {
            if (leftType === 'number' && rightType === 'number') {
                return 'number';
            }
            if (node.operator === '+' && (leftType === 'string' || rightType === 'string')) {
                return 'string';
            }
        }

        if (['==', '!=', '<', '>', '<=', '>='].includes(node.operator)) {
            return 'boolean';
        }

        if (['&&', '||'].includes(node.operator)) {
            return 'boolean';
        }

        return 'unknown';
    }

    // 检查类型兼容性
    isCompatibleTypes(leftType, rightType, operator) {
        if (leftType === rightType) return true;

        // 数字和字符串在+操作中兼容
        if (operator === '+' &&
            ((leftType === 'number' && rightType === 'string') ||
                (leftType === 'string' && rightType === 'number'))) {
            return true;
        }

        return false;
    }

    // 检查未使用的变量
    checkUnusedVariables() {
        this.checkScopeForUnusedVariables(this.globalScope);
    }

    checkScopeForUnusedVariables(scope) {
        scope.symbols.forEach(symbol => {
            if (!symbol.used && symbol.type !== 'function') {
                this.addWarning(`变量 '${symbol.name}' 已声明但未使用`);
            }
        });

        scope.children.forEach(childScope => {
            this.checkScopeForUnusedVariables(childScope);
        });
    }

    // 添加错误
    addError(message, line = 0, column = 0) {
        this.errors.push({ message, line, column, type: 'error' });
    }

    // 添加警告
    addWarning(message, line = 0, column = 0) {
        this.warnings.push({ message, line, column, type: 'warning' });
    }

    // 获取错误
    getErrors() {
        return this.errors;
    }

    // 获取警告
    getWarnings() {
        return this.warnings;
    }

    // 获取符号表
    getSymbolTable() {
        return this.globalScope;
    }
}

module.exports = {
    SemanticAnalyzer,
    Symbol,
    Scope
};