/**
 * 词法分析器 - lexer.js
 * @description 词法分析器，负责将源代码分解为token序列，实现编译器的第一个阶段
 *              采用有限状态自动机实现，支持多种词法单元识别
 * @module compiler/lexer/lexer
 * @author poboll
 * @date 2025
 * @version 1.0
 * 
 * 主要功能：
 * 1. 识别关键字、标识符、数字、字符串等词法单元
 * 2. 处理注释和空白字符
 * 3. 提供位置信息用于错误报告
 * 4. 支持错误恢复和容错处理
 * 5. 实现完整的Token类型定义
 * 6. 提供灵活的词法分析接口
 * 7. 支持多种数字格式和字符串转义
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
    constructor(sourceCode = '') {
        this.sourceCode = sourceCode;    // 源代码字符串
        this.tokens = [];               // 生成的词法单元数组
        this.currentIndex = 0;          // 当前字符索引位置
        this.line = 1;                  // 当前行号
        this.column = 1;                // 当前列号
        this.errors = [];               // 词法分析错误信息收集
    }

    /**
     * 设置源代码
     * @param {string} sourceCode - 待分析的源代码字符串
     */
    setSourceCode(sourceCode) {
        this.sourceCode = sourceCode;
        this.tokens = [];
        this.currentIndex = 0;
        this.line = 1;
        this.column = 1;
        this.errors = [];
    }

    /**
     * 词法分析主方法
     * 将源代码转换为词法单元序列
     * @returns {Token[]} 词法单元数组
     */
    tokenize() {
        // console.log(`--- Lexer: Starting tokenization for source ---\n${this.sourceCode}\n---`);
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
                this.consumeNumber();
                continue;
            }

            // 4. 识别标识符或关键字 (以字母或下划线开头)
            if (this.isLetter(char) || char === '_') {
                this.consumeIdentifierOrKeyword();
                continue;
            }

            // 5. 识别字符串字面量
            if (char === '"' || char === "'") {
                this.consumeString(char);
                continue;
            }

            // 6. 识别操作符和分隔符
            // TODO: 扩展以支持更多操作符和多字符操作符
            if (['+', '-', '*', '/', '=', '<', '>', ';', '(', ')', '{', '}', ',', '.'].includes(char)) {
                // console.log(`  [Lexer] Tokenized OPERATOR: ${char}`);
                this.tokens.push(new Token(TokenType.OPERATOR, char, this.line, this.column));
                this.advance();
                continue;
            }

            // 7. 处理Unknown character
            const errorMsg = `Unknown character '${char}'`;
            this.errors.push({ message: errorMsg, line: this.line, column: this.column, value: char });
            this.tokens.push(new Token(TokenType.UNKNOWN, char, this.line, this.column));
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
     */
    consumeNumber() {
        let start = this.currentIndex;
        let startLine = this.line;
        let startColumn = this.column;
        let numberStr = '';
        while (this.currentIndex < this.sourceCode.length && this.isDigit(this.sourceCode[this.currentIndex])) {
            numberStr += this.sourceCode[this.currentIndex];
            this.advance();
        }

        // Handle floating point numbers
        if (this.sourceCode[this.currentIndex] === '.' && this.isDigit(this.peek())) {
            numberStr += '.';
            this.advance();
            while (this.currentIndex < this.sourceCode.length && this.isDigit(this.sourceCode[this.currentIndex])) {
                numberStr += this.sourceCode[this.currentIndex];
                this.advance();
            }
        }

        this.tokens.push(new Token(TokenType.NUMBER, numberStr, startLine, startColumn));
        // console.log(`  [Lexer] Tokenized NUMBER: ${numberStr}`);
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
            this.tokens.push(new Token(KEYWORDS[value], value, startLine, startColumn));
            // console.log(`  [Lexer] Tokenized KEYWORD: ${value}`);
            return;
        }

        // 否则为标识符
        this.tokens.push(new Token(TokenType.IDENTIFIER, value, startLine, startColumn));
        // console.log(`  [Lexer] Tokenized IDENTIFIER: ${value}`);
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
     * 处理跨行注释并检查是否正确闭合
     */
    consumeMultiLineComment() {
        const startLine = this.line;
        const startColumn = this.column;
        let commentValue = '/*';

        this.advance(); // Consume '*'
        this.advance(); // Consume '/'

        while (this.currentIndex < this.sourceCode.length) {
            if (this.sourceCode[this.currentIndex] === '*' && this.peek() === '/') {
                this.advance(); // Consume '*'
                this.advance(); // Consume '/'
                return; // Successfully ignored comment
            }
            commentValue += this.sourceCode[this.currentIndex];
            this.advance();
        }

        // Unterminated comment
        const errorMsg = `Unterminated multi-line comment`;
        this.errors.push({ message: errorMsg, line: startLine, column: startColumn, value: commentValue });
        this.tokens.push(new Token(TokenType.UNKNOWN, commentValue, startLine, startColumn));
    }

    /**
     * 消费字符串字面量
     * @param {string} quoteType - 字符串的引号类型 (' or ")
     */
    consumeString(quoteType) {
        const startLine = this.line;
        const startColumn = this.column;
        let stringValue = '';

        this.advance(); // Consume opening quote

        while (this.currentIndex < this.sourceCode.length) {
            let char = this.sourceCode[this.currentIndex];

            if (char === quoteType) {
                this.advance(); // Consume closing quote
                this.tokens.push(new Token(TokenType.STRING, stringValue, startLine, startColumn));
                // console.log(`  [Lexer] Tokenized STRING: "${stringValue}"`);
                return;
            }

            if (char === '\n') {
                this.errors.push({ message: 'Unterminated string', line: startLine, column: startColumn, value: stringValue });
                this.tokens.push(new Token(TokenType.UNKNOWN, quoteType + stringValue, startLine, startColumn));
                return;
            }

            if (char === '\\') {
                this.advance(); // Consume backslash
                if (this.currentIndex >= this.sourceCode.length) {
                    this.errors.push({ message: 'Unterminated string', line: startLine, column: startColumn, value: stringValue });
                    this.tokens.push(new Token(TokenType.UNKNOWN, quoteType + stringValue, startLine, startColumn));
                    return;
                }
                let nextChar = this.sourceCode[this.currentIndex];
                switch (nextChar) {
                    case 'n': stringValue += '\n'; break;
                    case 't': stringValue += '\t'; break;
                    case '\\': stringValue += '\\'; break;
                    case "'": stringValue += "'"; break;
                    case '"': stringValue += '"'; break;
                    default:
                        this.errors.push({ message: `Invalid escape sequence '\\${nextChar}'`, line: this.line, column: this.column - 1, value: `\\${nextChar}` });
                        stringValue += nextChar; // Per JS behavior
                        break;
                }
            } else {
                stringValue += char;
            }
            this.advance();
        }

        // If loop finishes, it's an unterminated string
        this.errors.push({ message: 'Unterminated string', line: startLine, column: startColumn, value: stringValue });
        this.tokens.push(new Token(TokenType.UNKNOWN, quoteType + stringValue, startLine, startColumn));
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
module.exports = Lexer;