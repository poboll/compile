/*
 * 语法分析器 - parser.js
 * @description 基于递归下降的语法分析器，将Token序列转换为抽象语法树(AST)
 * @module compiler/parser/parser
 * @author poboll
 * @date 2024-07-26
 * 
 * 主要功能：
 * 1. 实现递归下降语法分析算法
 * 2. 构建抽象语法树(AST)
 * 3. 语法错误检测和恢复
 * 4. 支持变量声明、函数定义、表达式等语法结构
 */

/**
 * AST节点基类
 * 所有AST节点的基础类，包含节点类型和位置信息
 */
class AstNode {
    /**
     * 构造函数
     * @param {string} type - 节点类型
     * @param {number} line - 行号
     * @param {number} column - 列号
     */
    constructor(type, line, column) {
        this.nodeType = type;    // 节点类型标识
        this.line = line;        // 源代码行号
        this.column = column;    // 源代码列号
    }
}

// ==================== AST节点类型定义 ====================

/**
 * 程序根节点
 * 表示整个程序的AST根节点
 */
class ProgramNode extends AstNode {
    constructor(body, line = 1, column = 1) {
        super('Program', line, column);
        this.body = body; // Array<StatementNode> - 程序体语句列表
    }
}

/**
 * 变量声明节点
 * 表示变量声明语句 (let/const/var)
 */
class VariableDeclarationNode extends AstNode {
    constructor(kind, identifier, initializer, line, column) {
        super('VariableDeclaration', line, column);
        this.kind = kind;                    // 'let' | 'const' | 'var' - 声明类型
        this.identifier = identifier;        // IdentifierNode - 变量名
        this.initializer = initializer;      // ExpressionNode | null - 初始值
    }
}

/**
 * 函数声明节点
 * 表示函数定义语句
 */
class FunctionDeclarationNode extends AstNode {
    constructor(identifier, params, body, line, column) {
        super('FunctionDeclaration', line, column);
        this.identifier = identifier;    // IdentifierNode - 函数名
        this.params = params;            // Array<IdentifierNode> - 参数列表
        this.body = body;                // BlockStatementNode - 函数体
    }
}

/**
 * 块语句节点
 * 表示用大括号包围的语句块
 */
class BlockStatementNode extends AstNode {
    constructor(body, line, column) {
        super('BlockStatement', line, column);
        this.body = body; // Array<StatementNode> - 块内语句列表
    }
}

/**
 * 表达式语句节点
 * 表示单独的表达式作为语句
 */
class ExpressionStatementNode extends AstNode {
    constructor(expression, line, column) {
        super('ExpressionStatement', line, column);
        this.expression = expression; // ExpressionNode - 表达式内容
    }
}

/**
 * 赋值表达式节点
 * 表示赋值操作 (如 x = 5)
 */
class AssignmentExpressionNode extends AstNode {
    constructor(operator, left, right, line, column) {
        super('AssignmentExpression', line, column);
        this.operator = operator;    // '=' - 赋值操作符
        this.left = left;           // IdentifierNode - 左值(被赋值的变量)
        this.right = right;         // ExpressionNode - 右值(赋值的表达式)
    }
}

/**
 * if语句节点
 * 表示条件分支语句
 */
class IfStatementNode extends AstNode {
    constructor(test, consequent, alternate, line, column) {
        super('IfStatement', line, column);
        this.test = test;               // ExpressionNode - 条件表达式
        this.consequent = consequent;   // StatementNode - if分支语句
        this.alternate = alternate;     // StatementNode | null - else分支语句
    }
}

/**
 * while循环语句节点
 * 表示while循环结构
 */
class WhileStatementNode extends AstNode {
    constructor(test, body, line, column) {
        super('WhileStatement', line, column);
        this.test = test;   // ExpressionNode - 循环条件
        this.body = body;   // StatementNode - 循环体
    }
}

/**
 * return语句节点
 * 表示函数返回语句
 */
class ReturnStatementNode extends AstNode {
    constructor(argument, line, column) {
        super('ReturnStatement', line, column);
        this.argument = argument; // ExpressionNode | null - 返回值表达式
    }
}

/**
 * 二元表达式节点
 * 表示二元运算 (如 a + b, x > y)
 */
class BinaryExpressionNode extends AstNode {
    constructor(operator, left, right, line, column) {
        super('BinaryExpression', line, column);
        this.operator = operator;   // string - 操作符 (+, -, *, /, ==, !=, <, >, 等)
        this.left = left;          // ExpressionNode - 左操作数
        this.right = right;        // ExpressionNode - 右操作数
    }
}

/**
 * 一元表达式节点
 * 表示一元运算 (如 -x, !flag)
 */
class UnaryExpressionNode extends AstNode {
    constructor(operator, argument, prefix, line, column) {
        super('UnaryExpression', line, column);
        this.operator = operator;   // string - 操作符 (-, +, !, 等)
        this.argument = argument;   // ExpressionNode - 操作数
        this.prefix = prefix;       // boolean - 是否为前缀操作符
    }
}

/**
 * 函数调用表达式节点
 * 表示函数调用 (如 func(a, b))
 */
class CallExpressionNode extends AstNode {
    constructor(callee, args, line, column) {
        super('CallExpression', line, column);
        this.callee = callee;       // IdentifierNode - 被调用的函数
        this.arguments = args;      // Array<ExpressionNode> - 参数列表
    }
}

/**
 * 标识符节点
 * 表示变量名、函数名等标识符
 */
class IdentifierNode extends AstNode {
    constructor(name, line, column) {
        super('Identifier', line, column);
        this.name = name; // string - 标识符名称
    }
}

/**
 * 字面量节点
 * 表示数字、字符串、布尔值等字面量
 */
class LiteralNode extends AstNode {
    constructor(value, raw, line, column) {
        super('Literal', line, column);
        this.value = value; // number | string | boolean | null - 字面量值
        this.raw = raw;     // string - 原始字符串表示
    }
}

/**
 * 语法分析器类
 * 实现递归下降语法分析，将Token序列转换为抽象语法树(AST)
 * 支持错误检测和恢复机制
 */
class Parser {
    /**
     * 构造函数
     * @param {Array} tokens - 词法分析器生成的Token数组
     */
    constructor(tokens) {
        // 过滤掉空白符和注释Token，只保留有意义的Token
        this.tokens = tokens.filter(token => token.type !== 'WHITESPACE' && token.type !== 'COMMENT');
        this.currentTokenIndex = 0; // 当前Token索引
        this.currentToken = this.tokens[0] || null; // 当前正在处理的Token
        this.errors = []; // 语法错误列表
    }

    /**
     * 前进到下一个Token
     * 更新当前Token索引和当前Token
     */
    advance() {
        if (this.currentTokenIndex < this.tokens.length - 1) {
            this.currentTokenIndex++;
            this.currentToken = this.tokens[this.currentTokenIndex];
        } else {
            this.currentToken = null; // 到达Token序列末尾
        }
    }

    /**
     * 向前查看Token（不移动当前位置）
     * @param {number} offset - 向前查看的偏移量，默认为1
     * @returns {Token|null} 指定位置的Token，如果超出范围则返回null
     */
    peek(offset = 1) {
        const index = this.currentTokenIndex + offset;
        return index < this.tokens.length ? this.tokens[index] : null;
    }

    /**
     * 消费期望的Token类型
     * 检查当前Token是否为期望类型，如果是则消费并返回，否则报告错误
     * @param {string} expectedType - 期望的Token类型
     * @param {string} errorMessage - 自定义错误消息
     * @returns {Token|null} 消费的Token，如果类型不匹配则返回null
     */
    consume(expectedType, errorMessage = null) {
        if (!this.currentToken) {
            this.reportError(errorMessage || `期望 ${expectedType} 但已到达输入末尾`);
            return null;
        }

        // 对于标点符号，需要检查具体的值
        if (expectedType === 'PUNCTUATION') {
            if (this.currentToken.type !== 'PUNCTUATION' && this.currentToken.type !== 'OPERATOR') {
                this.reportError(errorMessage ||
                    `期望标点符号但得到 ${this.currentToken.type} '${this.currentToken.value}'`);
                return null;
            }
        } else if (this.currentToken.type !== expectedType) {
            this.reportError(errorMessage ||
                `期望 ${expectedType} 但得到 ${this.currentToken.type} '${this.currentToken.value}'`);
            return null;
        }

        const token = this.currentToken;
        this.advance();
        return token;
    }

    /**
     * 检查当前Token是否匹配指定值
     * @param {string} value - 要匹配的Token值
     * @returns {boolean} 是否匹配
     */
    match(value) {
        return this.currentToken && this.currentToken.value === value;
    }

    /**
     * 检查并消费指定值的Token
     * @param {string} value - 期望的Token值
     * @param {string} errorMessage - 自定义错误消息
     * @returns {Token|null} 消费的Token，如果值不匹配则返回null
     */
    consumeValue(value, errorMessage = null) {
        if (!this.currentToken) {
            this.reportError(errorMessage || `期望 '${value}' 但已到达输入末尾`);
            return null;
        }

        if (this.currentToken.value !== value) {
            this.reportError(errorMessage ||
                `期望 '${value}' 但得到 '${this.currentToken.value}'`);
            return null;
        }

        const token = this.currentToken;
        this.advance();
        return token;
    }

    /**
     * 检查当前Token是否为指定类型
     * @param {string} type - 要检查的Token类型
     * @returns {boolean} 是否为指定类型
     */
    check(type) {
        return this.currentToken && this.currentToken.type === type;
    }

    /**
     * 报告语法错误
     * @param {string} message - 错误消息
     */
    reportError(message) {
        const line = this.currentToken ? this.currentToken.line : 'EOF';
        const column = this.currentToken ? this.currentToken.column : 'EOF';
        const error = {
            message: `语法错误: ${message}`,
            line: line,
            column: column
        };
        this.errors.push(error);
        console.error(`${error.message} 在第 ${line} 行，第 ${column} 列`);
    }

    /**
     * 错误恢复机制 - 跳到同步Token
     * 当遇到语法错误时，跳过Token直到找到可以重新开始解析的位置
     */
    synchronize() {
        this.advance();

        while (this.currentToken) {
            // 如果遇到分号，说明语句结束，可以重新开始解析
            if (this.currentToken.value === ';') {
                this.advance();
                return;
            }

            // 如果遇到语句开始的关键字，停止跳过
            if (this.currentToken.type === 'KEYWORD') {
                const keywords = ['let', 'const', 'var', 'function', 'if', 'while', 'for', 'return', 'class'];
                if (keywords.includes(this.currentToken.value)) {
                    return;
                }
            }

            this.advance();
        }
    }

    /**
     * 获取语法分析过程中收集的错误列表
     * @returns {Array} 错误信息数组
     */
    getErrors() {
        return this.errors;
    }

    /**
     * 主解析函数
     * 解析整个程序，返回程序的抽象语法树
     * @returns {ProgramNode} 程序节点，包含所有语句
     */
    parse() {
        console.log('语法分析器: 开始语法分析...');
        const statements = [];

        // 循环解析所有语句直到文件结束
        while (this.currentToken && this.currentToken.type !== 'EOF') {
            try {
                const stmt = this.parseStatement();
                if (stmt) {
                    statements.push(stmt);
                }
            } catch (error) {
                console.error('语法分析错误:', error.message);
                this.synchronize(); // 错误恢复
            }
        }

        return new ProgramNode(statements);
    }

    /**
     * 解析语句
     * 根据当前Token类型决定解析哪种类型的语句
     * @returns {AstNode|null} 语句节点
     */
    parseStatement() {
        if (!this.currentToken) return null;

        // 变量声明语句
        if (this.match('let') || this.match('const') || this.match('var')) {
            return this.parseVariableDeclaration();
        }

        // 函数声明语句
        if (this.match('function')) {
            return this.parseFunctionDeclaration();
        }

        // if条件语句
        if (this.match('if')) {
            return this.parseIfStatement();
        }

        // while循环语句
        if (this.match('while')) {
            return this.parseWhileStatement();
        }

        // return返回语句
        if (this.match('return')) {
            return this.parseReturnStatement();
        }

        // 块语句（用大括号包围的语句组）
        if (this.match('{')) {
            return this.parseBlockStatement();
        }

        // 表达式语句（包括赋值表达式）
        return this.parseExpressionStatement();
    }

    /**
     * 解析变量声明语句
     * 支持 let、const、var 三种声明方式
     * @returns {VariableDeclarationNode} 变量声明节点
     */
    parseVariableDeclaration() {
        const kindToken = this.consume('KEYWORD'); // 消费声明关键字
        if (!kindToken) return null;

        const identifier = this.parseIdentifier(); // 解析变量名
        if (!identifier) return null;

        let initializer = null;
        // 检查是否有初始化表达式
        if (this.match('=')) {
            this.consumeValue('='); // 消费赋值操作符
            initializer = this.parseExpression(); // 解析初始化表达式
        }

        // const声明必须有初始化值
        if (kindToken.value === 'const' && !initializer) {
            this.reportError("const声明缺少初始化值");
        }

        this.consumeValue(';', "变量声明后期望 ';'");

        return new VariableDeclarationNode(
            kindToken.value,
            identifier,
            initializer,
            kindToken.line,
            kindToken.column
        );
    }

    /**
     * 解析函数声明语句
     * 格式: function 函数名(参数列表) { 函数体 }
     * @returns {FunctionDeclarationNode} 函数声明节点
     */
    parseFunctionDeclaration() {
        const functionToken = this.consume('KEYWORD'); // 消费 'function' 关键字
        if (!functionToken) return null;

        const identifier = this.parseIdentifier(); // 解析函数名
        if (!identifier) return null;

        this.consumeValue('(', "函数名后期望 '('");

        // 解析参数列表
        const params = [];
        if (!this.match(')')) {
            do {
                const param = this.parseIdentifier();
                if (param) {
                    params.push(param);
                }
                if (this.match(',')) {
                    this.consumeValue(','); // 消费参数分隔符
                } else {
                    break;
                }
            } while (this.currentToken && !this.match(')'));
        }

        this.consumeValue(')', "参数列表后期望 ')'")

        this.consumeValue('{', "函数体前期望 '{'")
        const body = this.parseStatementList(); // 解析函数体语句列表
        this.consumeValue('}', "函数体后期望 '}'")

        return new FunctionDeclarationNode(identifier.value, params, body);
    }

    /**
     * 解析if条件语句
     * 格式: if (条件表达式) 语句 [else 语句]
     * @returns {IfStatementNode} if语句节点
     */
    parseIfStatement() {
        const ifToken = this.consume('KEYWORD'); // 消费 'if' 关键字
        if (!ifToken) return null;

        this.consume('PUNCTUATION', "'if' 后期望 '('");
        const test = this.parseExpression(); // 解析条件表达式
        this.consume('PUNCTUATION', "if条件后期望 ')'");

        const consequent = this.parseStatement(); // 解析if分支语句
        let alternate = null;

        // 检查是否有else分支
        if (this.match('else')) {
            this.advance();
            alternate = this.parseStatement(); // 解析else分支语句
        }

        return new IfStatementNode(
            test,
            consequent,
            alternate,
            ifToken.line,
            ifToken.column
        );
    }

    /**
     * 解析while循环语句
     * 格式: while (条件表达式) 语句
     * @returns {WhileStatementNode} while语句节点
     */
    parseWhileStatement() {
        const whileToken = this.consume('KEYWORD'); // 消费 'while' 关键字
        if (!whileToken) return null;

        this.consume('PUNCTUATION', "'while' 后期望 '('");
        const test = this.parseExpression(); // 解析循环条件表达式
        this.consume('PUNCTUATION', "while条件后期望 ')'");

        const body = this.parseStatement(); // 解析循环体语句

        return new WhileStatementNode(
            test,
            body,
            whileToken.line,
            whileToken.column
        );
    }

    /**
     * 解析return返回语句
     * 格式: return [表达式];
     * @returns {ReturnStatementNode} return语句节点
     */
    parseReturnStatement() {
        const returnToken = this.consume('KEYWORD'); // 消费 'return' 关键字
        if (!returnToken) return null;

        let argument = null;
        // 检查是否有返回值表达式
        if (!this.match(';')) {
            argument = this.parseExpression(); // 解析返回值表达式
        }

        this.consume('PUNCTUATION', "return语句后期望 ';'");

        return new ReturnStatementNode(
            argument,
            returnToken.line,
            returnToken.column
        );
    }

    /**
     * 解析块语句（复合语句）
     * 格式: { 语句列表 }
     * @returns {BlockStatementNode} 块语句节点
     */
    parseBlockStatement() {
        const openBrace = this.consume('PUNCTUATION'); // 消费 '{'
        if (!openBrace) return null;

        const statements = [];
        // 解析块内的所有语句
        while (this.currentToken && !this.match('}')) {
            const stmt = this.parseStatement();
            if (stmt) {
                statements.push(stmt);
            }
        }

        this.consume('PUNCTUATION', "期望 '}' 来关闭代码块");

        return new BlockStatementNode(
            statements,
            openBrace.line,
            openBrace.column
        );
    }

    /**
     * 解析表达式语句
     * 格式: 表达式;
     * @returns {ExpressionStatementNode} 表达式语句节点
     */
    parseExpressionStatement() {
        const expr = this.parseExpression(); // 解析表达式
        if (!expr) return null;

        this.consume('PUNCTUATION', "表达式后期望 ';'");

        return new ExpressionStatementNode(
            expr,
            expr.line,
            expr.column
        );
    }

    /**
     * 解析表达式（入口点）
     * 从最低优先级的赋值表达式开始解析
     * @returns {AstNode} 表达式节点
     */
    parseExpression() {
        return this.parseAssignmentExpression();
    }

    /**
     * 解析赋值表达式
     * 格式: 标识符 = 表达式
     * 赋值运算符具有右结合性
     * @returns {AssignmentExpressionNode|AstNode} 赋值表达式节点或其他表达式节点
     */
    parseAssignmentExpression() {
        const expr = this.parseLogicalOrExpression();

        if (this.match('=')) {
            const operator = this.currentToken;
            this.advance();
            const right = this.parseAssignmentExpression(); // 右结合性

            // 检查左侧是否为有效的赋值目标（标识符）
            if (expr.nodeType !== 'Identifier') {
                this.reportError("无效的赋值目标");
                return expr;
            }

            return new AssignmentExpressionNode(
                operator.value,
                expr,
                right,
                operator.line,
                operator.column
            );
        }

        return expr;
    }

    /**
     * 解析逻辑或表达式
     * 格式: 表达式 || 表达式
     * 逻辑或运算符具有左结合性
     * @returns {BinaryExpressionNode|AstNode} 二元表达式节点或其他表达式节点
     */
    parseLogicalOrExpression() {
        let expr = this.parseLogicalAndExpression();

        // 处理左结合的逻辑或运算符
        while (this.match('||')) {
            const operator = this.currentToken;
            this.advance();
            const right = this.parseLogicalAndExpression();
            expr = new BinaryExpressionNode(
                operator.value,
                expr,
                right,
                operator.line,
                operator.column
            );
        }

        return expr;
    }

    /**
     * 解析逻辑与表达式
     * 格式: 表达式 && 表达式
     * 逻辑与运算符具有左结合性，优先级高于逻辑或
     * @returns {BinaryExpressionNode|AstNode} 二元表达式节点或其他表达式节点
     */
    parseLogicalAndExpression() {
        let expr = this.parseEqualityExpression();

        // 处理左结合的逻辑与运算符
        while (this.match('&&')) {
            const operator = this.currentToken;
            this.advance();
            const right = this.parseEqualityExpression();
            expr = new BinaryExpressionNode(
                operator.value,
                expr,
                right,
                operator.line,
                operator.column
            );
        }

        return expr;
    }

    /**
     * 解析相等性表达式
     * 格式: 表达式 == 表达式 | 表达式 != 表达式
     * 相等性运算符具有左结合性，优先级高于逻辑与
     * @returns {BinaryExpressionNode|AstNode} 二元表达式节点或其他表达式节点
     */
    parseEqualityExpression() {
        let expr = this.parseRelationalExpression();

        // 处理左结合的相等性运算符
        while (this.match('==') || this.match('!=')) {
            const operator = this.currentToken;
            this.advance();
            const right = this.parseRelationalExpression();
            expr = new BinaryExpressionNode(
                operator.value,
                expr,
                right,
                operator.line,
                operator.column
            );
        }

        return expr;
    }

    /**
     * 解析关系表达式
     * 格式: 表达式 > 表达式 | 表达式 < 表达式 | 表达式 >= 表达式 | 表达式 <= 表达式
     * 关系运算符具有左结合性，优先级高于相等性运算符
     * @returns {BinaryExpressionNode|AstNode} 二元表达式节点或其他表达式节点
     */
    parseRelationalExpression() {
        let expr = this.parseAdditiveExpression();

        // 处理左结合的关系运算符
        while (this.match('>') || this.match('<') || this.match('>=') || this.match('<=')) {
            const operator = this.currentToken;
            this.advance();
            const right = this.parseAdditiveExpression();
            expr = new BinaryExpressionNode(
                operator.value,
                expr,
                right,
                operator.line,
                operator.column
            );
        }

        return expr;
    }

    /**
     * 解析加法表达式
     * 格式: 表达式 + 表达式 | 表达式 - 表达式
     * 加法和减法运算符具有左结合性，优先级高于关系运算符
     * @returns {BinaryExpressionNode|AstNode} 二元表达式节点或其他表达式节点
     */
    parseAdditiveExpression() {
        let expr = this.parseMultiplicativeExpression();

        // 处理左结合的加法和减法运算符
        while (this.match('+') || this.match('-')) {
            const operator = this.currentToken;
            this.advance();
            const right = this.parseMultiplicativeExpression();
            expr = new BinaryExpressionNode(
                operator.value,
                expr,
                right,
                operator.line,
                operator.column
            );
        }

        return expr;
    }

    /**
     * 解析乘法表达式
     * 格式: 表达式 * 表达式 | 表达式 / 表达式 | 表达式 % 表达式
     * 乘法、除法和取模运算符具有左结合性，优先级高于加法运算符
     * @returns {BinaryExpressionNode|AstNode} 二元表达式节点或其他表达式节点
     */
    parseMultiplicativeExpression() {
        let expr = this.parseUnaryExpression();

        // 处理左结合的乘法、除法和取模运算符
        while (this.match('*') || this.match('/') || this.match('%')) {
            const operator = this.currentToken;
            this.advance();
            const right = this.parseUnaryExpression();
            expr = new BinaryExpressionNode(
                operator.value,
                expr,
                right,
                operator.line,
                operator.column
            );
        }

        return expr;
    }

    /**
     * 解析一元表达式
     * 格式: ! 表达式 | - 表达式
     * 一元运算符具有右结合性，优先级高于乘法运算符
     * @returns {UnaryExpressionNode|AstNode} 一元表达式节点或其他表达式节点
     */
    parseUnaryExpression() {
        // 处理前缀一元运算符
        if (this.match('!') || this.match('-')) {
            const operator = this.currentToken;
            this.advance();
            const argument = this.parseUnaryExpression(); // 右结合性
            return new UnaryExpressionNode(
                operator.value,
                argument,
                true, // prefix 前缀运算符
                operator.line,
                operator.column
            );
        }

        return this.parsePrimaryExpression();
    }

    /**
     * 解析基本表达式（最高优先级）
     * 包括字面量、标识符、函数调用和括号表达式
     * @returns {AstNode} 基本表达式节点
     */
    parsePrimaryExpression() {
        // 括号表达式 - 改变运算优先级
        if (this.match('(')) {
            this.consumeValue('(');
            const expr = this.parseExpression();
            this.consumeValue(')', "表达式后期望 ')'");
            return expr;
        }

        // 数字字面量
        if (this.check('NUMBER')) {
            return this.parseNumberLiteral();
        }

        // 字符串字面量
        if (this.check('STRING')) {
            return this.parseStringLiteral();
        }

        // 布尔字面量和null字面量
        if (this.match('true') || this.match('false') || this.match('null')) {
            return this.parseBooleanOrNullLiteral();
        }

        // 标识符或函数调用
        if (this.check('IDENTIFIER')) {
            const identifier = this.parseIdentifier();

            // 检查是否为函数调用（标识符后跟括号）
            if (this.match('(')) {
                this.advance(); // 消费 '('
                const args = [];

                // 解析参数列表
                if (!this.match(')')) {
                    do {
                        const arg = this.parseExpression();
                        if (arg) {
                            args.push(arg);
                        }
                        if (this.match(',')) {
                            this.advance(); // 消费参数分隔符
                        } else {
                            break;
                        }
                    } while (this.currentToken && !this.match(')'));
                }

                this.consume('PUNCTUATION', "参数列表后期望 ')'");

                return new CallExpressionNode(
                    identifier,
                    args,
                    identifier.line,
                    identifier.column
                );
            }

            return identifier;
        }

        this.reportError(`Unexpected token '${this.currentToken ? this.currentToken.value : 'EOF'}'`);
        return null;
    }

    /**
     * 解析标识符
     * 解析当前位置的标识符token，创建对应的标识符节点
     * @returns {IdentifierNode|null} 标识符节点，解析失败时返回null
     */
    parseIdentifier() {
        // 消费一个标识符token
        const token = this.consume('IDENTIFIER');
        if (!token) return null;

        // 创建标识符节点
        return new IdentifierNode(
            token.value,
            token.line,
            token.column
        );
    }

    /**
     * 解析数字字面量
     * 解析当前位置的数字token，创建对应的字面量节点
     * @returns {LiteralNode|null} 数字字面量节点，解析失败时返回null
     */
    parseNumberLiteral() {
        // 消费一个数字token
        const token = this.consume('NUMBER');
        if (!token) return null;

        // 创建数字字面量节点，将字符串转换为浮点数
        return new LiteralNode(
            parseFloat(token.value),
            token.value,
            token.line,
            token.column
        );
    }

    /**
     * 解析字符串字面量
     * 解析当前位置的字符串token，创建对应的字面量节点
     * @returns {LiteralNode|null} 字符串字面量节点，解析失败时返回null
     */
    parseStringLiteral() {
        // 消费一个字符串token
        const token = this.consume('STRING');
        if (!token) return null;

        // 移除字符串两端的引号
        const value = token.value.slice(1, -1);

        // 创建字符串字面量节点
        return new LiteralNode(
            value,
            token.value,
            token.line,
            token.column
        );
    }

    /**
     * 解析布尔值和null字面量
     * 解析当前位置的关键字token，识别true、false、null字面量
     * @returns {LiteralNode|null} 布尔值或null字面量节点，解析失败时返回null
     */
    parseBooleanOrNullLiteral() {
        // 消费一个关键字token
        const token = this.consume('KEYWORD');
        if (!token) return null;

        // 根据关键字确定字面量值
        let value;
        switch (token.value) {
            case 'true':
                value = true;
                break;
            case 'false':
                value = false;
                break;
            case 'null':
                value = null;
                break;
            default:
                this.reportError(`意外的字面量 '${token.value}'`);
                return null;
        }

        // 创建字面量节点
        return new LiteralNode(
            value,
            token.value,
            token.line,
            token.column
        );
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Parser,
        AstNode,
        ProgramNode,
        VariableDeclarationNode,
        FunctionDeclarationNode,
        BlockStatementNode,
        ExpressionStatementNode,
        AssignmentExpressionNode,
        IfStatementNode,
        WhileStatementNode,
        ReturnStatementNode,
        BinaryExpressionNode,
        UnaryExpressionNode,
        CallExpressionNode,
        IdentifierNode,
        LiteralNode
    };
}