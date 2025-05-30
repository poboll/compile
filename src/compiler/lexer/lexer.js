/**
 * 词法分析器 - lexer.js
 * @description 词法分析器，负责将源代码分解为token序列，实现编译器的第一个阶段
 * @module compiler/lexer/lexer
 * @author poboll
 * @date 2024-07-26
 * 
 * 主要功能：
 * 1. 识别关键字、标识符、数字、字符串等词法单元
 * 2. 处理注释和空白字符
 * 3. 提供位置信息用于错误报告
 * 4. 支持错误恢复和容错处理
 */

// 词法分析器实现

// 定义Token类型
const TokenType = {
    KEYWORD: 'KEYWORD',
    IDENTIFIER: 'IDENTIFIER',
    NUMBER: 'NUMBER',
    STRING: 'STRING',
    OPERATOR: 'OPERATOR',
    PUNCTUATION: 'PUNCTUATION',
    COMMENT: 'COMMENT',
    WHITESPACE: 'WHITESPACE', // 通常会被忽略，但有时也需要
    EOF: 'EOF', // End Of File
    UNKNOWN: 'UNKNOWN' // 未知Token
};

class Token {
    constructor(type, value, line, column) {
        this.type = type;
        this.value = value;
        this.line = line;       // Token所在行号
        this.column = column;   // Token所在列号
    }
}

const KEYWORDS = {
    'let': TokenType.KEYWORD,
    'const': TokenType.KEYWORD,
    'var': TokenType.KEYWORD,
    'function': TokenType.KEYWORD,
    'if': TokenType.KEYWORD,
    'else': TokenType.KEYWORD,
    'while': TokenType.KEYWORD,
    'for': TokenType.KEYWORD,
    'return': TokenType.KEYWORD,
    'class': TokenType.KEYWORD,
    'true': TokenType.KEYWORD, // Or a boolean literal type
    'false': TokenType.KEYWORD, // Or a boolean literal type
    'null': TokenType.KEYWORD,  // Or a null literal type
    // Add more keywords as needed
};

/**
 * 词法分析器类
 * 负责将源代码字符串转换为词法单元(Token)序列
 */
class Lexer {
    /**
     * 构造函数
     * @param {string} sourceCode - 待分析的源代码字符串
     */
    constructor(sourceCode) {
        this.sourceCode = sourceCode;    // 源代码字符串
        this.tokens = [];               // 生成的词法单元数组
        this.currentIndex = 0;          // 当前字符索引位置
        this.line = 1;                  // 当前行号
        this.column = 1;                // 当前列号
        this.errors = [];               // 词法分析错误信息收集
    }

    /**
     * 词法分析主方法
     * 将源代码转换为词法单元序列
     * @returns {Token[]} 词法单元数组
     */
    tokenize() {
        console.log('词法分析器: 开始分析源代码...');
        while (this.currentIndex < this.sourceCode.length) {
            let char = this.sourceCode[this.currentIndex];

            // 1. 跳过空白字符 (空格, 制表符, 换行符)
            if (this.isWhitespace(char)) {
                this.consumeWhitespace();
                continue;
            }

            // 2. 处理注释
            if (char === '/') {
                if (this.peek() === '/') {
                    this.consumeSingleLineComment();
                    continue;
                } else if (this.peek() === '*') {
                    this.consumeMultiLineComment();
                    continue;
                }
            }

            // 3. 识别数字字面量
            if (this.isDigit(char)) {
                this.tokens.push(this.consumeNumber());
                continue;
            }

            // 4. 识别标识符或关键字 (以字母或下划线开头)
            if (this.isLetter(char) || char === '_') {
                this.tokens.push(this.consumeIdentifierOrKeyword());
                continue;
            }

            // 5. 识别字符串字面量
            if (char === '"' || char === "'") {
                this.tokens.push(this.consumeString(char));
                continue;
            }

            // 6. 识别操作符和分隔符
            // TODO: 扩展以支持更多操作符和多字符操作符
            if (['+', '-', '*', '/', '=', '<', '>', ';', '(', ')', '{', '}', ',', '.'].includes(char)) {
                this.tokens.push(new Token(TokenType.OPERATOR, char, this.line, this.column));
                this.advance();
                continue;
            }

            // 7. 处理未知字符
            const errorMsg = `未知字符 '${char}'`;
            this.errors.push({ message: errorMsg, line: this.line, column: this.column, value: char });
            this.tokens.push(new Token(TokenType.UNKNOWN, char, this.line, this.column));
            console.warn(`词法分析错误: ${errorMsg} 位置: 第${this.line}行, 第${this.column}列`);
            this.advance();
        }

        // 添加文件结束标记
        this.tokens.push(new Token(TokenType.EOF, null, this.line, this.column));
        return this.tokens;
    }

    /**
     * 前进一个字符位置
     * 更新当前索引、行号和列号
     */
    advance() {
        const char = this.sourceCode[this.currentIndex];
        if (char === '\n') {
            this.line++;        // 遇到换行符，行号加1
            this.column = 1;    // 列号重置为1
        } else {
            this.column++;      // 列号加1
        }
        this.currentIndex++;    // 字符索引前进
    }

    /**
     * 查看下一个字符但不移动当前位置
     * @returns {string|null} 下一个字符，如果到达文件末尾则返回null
     */
    peek() {
        if (this.currentIndex + 1 >= this.sourceCode.length) {
            return null; // 到达文件末尾
        }
        return this.sourceCode[this.currentIndex + 1];
    }

    /**
     * 判断字符是否为空白字符
     * @param {string} char - 待判断的字符
     * @returns {boolean} 是否为空白字符
     */
    isWhitespace(char) {
        return /\s/.test(char);
    }

    /**
     * 消费所有连续的空白字符
     */
    consumeWhitespace() {
        while (this.currentIndex < this.sourceCode.length && this.isWhitespace(this.sourceCode[this.currentIndex])) {
            this.advance();
        }
    }

    /**
     * 判断字符是否为数字
     * @param {string} char - 待判断的字符
     * @returns {boolean} 是否为数字字符
     */
    isDigit(char) {
        return /[0-9]/.test(char);
    }

    /**
     * 消费数字字面量
     * @returns {Token} 数字类型的词法单元
     */
    consumeNumber() {
        let start = this.currentIndex;
        let startLine = this.line;
        let startColumn = this.column;

        // 消费所有连续的数字字符
        while (this.currentIndex < this.sourceCode.length && this.isDigit(this.sourceCode[this.currentIndex])) {
            this.advance();
        }

        // TODO: 支持浮点数 (小数点和科学计数法)
        const value = this.sourceCode.substring(start, this.currentIndex);
        return new Token(TokenType.NUMBER, value, startLine, startColumn);
    }

    /**
     * 判断字符是否为字母
     * @param {string} char - 待判断的字符
     * @returns {boolean} 是否为字母字符
     */
    isLetter(char) {
        return /[a-zA-Z]/.test(char);
    }

    /**
     * 消费标识符或关键字
     * @returns {Token} 标识符或关键字类型的词法单元
     */
    consumeIdentifierOrKeyword() {
        let start = this.currentIndex;
        let startLine = this.line;
        let startColumn = this.column;

        // 消费字母、数字和下划线组成的标识符
        while (this.currentIndex < this.sourceCode.length &&
            (this.isLetter(this.sourceCode[this.currentIndex]) ||
                this.isDigit(this.sourceCode[this.currentIndex]) ||
                this.sourceCode[this.currentIndex] === '_')) {
            this.advance();
        }

        const value = this.sourceCode.substring(start, this.currentIndex);

        // 检查是否为关键字
        if (KEYWORDS.hasOwnProperty(value)) {
            return new Token(KEYWORDS[value], value, startLine, startColumn);
        }

        // 否则为标识符
        return new Token(TokenType.IDENTIFIER, value, startLine, startColumn);
    }

    /**
     * 消费单行注释 (// 开头)
     * 注释内容通常被忽略，不生成词法单元
     */
    consumeSingleLineComment() {
        const startLine = this.line;
        const startColumn = this.column;
        let commentValue = '';

        // 消费直到行尾的所有字符
        while (this.currentIndex < this.sourceCode.length && this.sourceCode[this.currentIndex] !== '\n') {
            commentValue += this.sourceCode[this.currentIndex];
            this.advance();
        }

        // 根据需要决定是否将注释Token添加到tokens数组中
        // this.tokens.push(new Token(TokenType.COMMENT, commentValue, startLine, startColumn));
        // 通常词法分析器会忽略注释，所以这里不添加到tokens列表，直接跳过

        // 消费换行符
        if (this.currentIndex < this.sourceCode.length && this.sourceCode[this.currentIndex] === '\n') {
            this.advance();
        }
    }

    /**
     * 消费多行注释 (/* ... */ 格式)
    * 处理跨行注释并检查是否正确闭合
     */
consumeMultiLineComment() {
    const startLine = this.line;
    const startColumn = this.column;
    let commentValue = '';

    this.advance(); // 跳过 '/'
    this.advance(); // 跳过 '*'
    commentValue += '/*';

    // 查找注释结束标记 */
    while (this.currentIndex < this.sourceCode.length) {
        const char = this.sourceCode[this.currentIndex];
        if (char === '*' && this.peek() === '/') {
            commentValue += '*/';
            this.advance(); // 跳过 '*'
            this.advance(); // 跳过 '/'
            // 根据需要决定是否将注释Token添加到tokens数组中
            // this.tokens.push(new Token(TokenType.COMMENT, commentValue, startLine, startColumn));
            return; // 注释处理完成
        }
        commentValue += char;
        this.advance();
    }

    // 如果到达文件末尾仍未闭合注释，则为错误
    const errorMsg = `未闭合的多行注释`;
    this.errors.push({ message: errorMsg, line: startLine, column: startColumn, value: commentValue });
    console.warn(`词法分析错误: ${errorMsg} 开始位置: 第${startLine}行, 第${startColumn}列`);
    // 创建一个未知类型的词法单元
    this.tokens.push(new Token(TokenType.UNKNOWN, commentValue, startLine, startColumn));
}

/**
     * 消费字符串字面量
     * @param {string} quoteType - 引号类型 ('"' 或 "'")
     * @returns {Token} 字符串类型的词法单元
     */
consumeString(quoteType) {
    let start = this.currentIndex;
    let startLine = this.line;
    let startColumn = this.column;
    let stringValue = '';

    this.advance(); // 跳过起始引号

    while (this.currentIndex < this.sourceCode.length) {
        const char = this.sourceCode[this.currentIndex];

        // 遇到结束引号
        if (char === quoteType) {
            this.advance(); // 跳过结束引号
            return new Token(TokenType.STRING, stringValue, startLine, startColumn);
        }

        // 处理转义字符
        if (char === '\\') {
            this.advance(); // 跳过反斜杠
            if (this.currentIndex < this.sourceCode.length) {
                const nextChar = this.sourceCode[this.currentIndex];
                switch (nextChar) {
                    case 'n': stringValue += '\n'; break;   // 换行符
                    case 't': stringValue += '\t'; break;   // 制表符
                    case 'r': stringValue += '\r'; break;   // 回车符
                    case '\'': stringValue += '\''; break; // 单引号
                    case '"': stringValue += '"'; break;   // 双引号
                    case '\\': stringValue += '\\'; break; // 反斜杠
                    default:
                        // 无效的转义序列
                        const invalidEscapeMsg = `无效的转义序列 '\\${nextChar}'`;
                        this.errors.push({ message: invalidEscapeMsg, line: this.line, column: this.column - 1, value: `\\${nextChar}` });
                        console.warn(`词法分析错误: ${invalidEscapeMsg} 位置: 第${this.line}行, 第${this.column - 1}列`);
                        stringValue += char; // 保留反斜杠
                        stringValue += nextChar; // 保留其后的字符
                        break;
                }
                this.advance(); // 跳过转义序列的第二个字符
            } else {
                // 到达文件末尾，但转义序列未完成
                const unterminatedEscapeMsg = `文件末尾的未完成转义序列`;
                this.errors.push({ message: unterminatedEscapeMsg, line: this.line, column: this.column - 1, value: char });
                console.warn(`词法分析错误: ${unterminatedEscapeMsg} 位置: 第${this.line}行, 第${this.column - 1}列`);
                stringValue += char; // 保留反斜杠
            }
        } else {
            // 普通字符
            stringValue += char;
            this.advance();
        }
    }

    // 如果到达文件末尾仍未闭合字符串，则为错误
    const unterminatedStringMsg = `未闭合的字符串`;
    this.errors.push({ message: unterminatedStringMsg, line: startLine, column: startColumn, value: stringValue });
    console.warn(`词法分析错误: ${unterminatedStringMsg} 开始位置: 第${startLine}行, 第${startColumn}列`);
    return new Token(TokenType.UNKNOWN, stringValue, startLine, startColumn); // 返回未知类型词法单元
}

/**
 * 获取词法分析过程中的错误信息
 * @returns {Array} 错误信息数组
 */
getErrors() {
    return this.errors;
}
}

// 导出词法分析器类和相关组件
module.exports = { Lexer, Token, TokenType };