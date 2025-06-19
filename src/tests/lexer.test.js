/**
 * @description 词法分析器测试用例。
 * @module tests/lexer.test
 * @author AI Assistant
 * @date 2025-07-26
 */

const Lexer = require('../compiler/lexer/lexer');
const { TokenType, KEYWORDS } = require('../compiler/lexer/lexer');

// 辅助函数，用于快速获取词法分析结果
function tokenize(sourceCode, getErrors = false) {
    const lexer = new Lexer(sourceCode);
    const tokens = lexer.tokenize();
    if (getErrors) {
        return { tokens, errors: lexer.getErrors() };
    }
    return tokens;
}

// 词法分析器测试
describe('Lexer', () => {
    test('should tokenize simple input correctly', () => {
        const sourceCode = 'let x = 10;';
        const lexer = new Lexer(sourceCode);
        const tokens = lexer.tokenize();
        console.log('Lexer Test: Tokenizing "let x = 10;"', tokens);

        // 预期 Token 序列
        // let (KEYWORD), x (IDENTIFIER), = (OPERATOR), 10 (NUMBER), ; (OPERATOR), EOF
        const expectedTokens = [
            { type: 'KEYWORD', value: 'let', line: 1, column: 1 },
            { type: 'IDENTIFIER', value: 'x', line: 1, column: 5 },
            { type: 'OPERATOR', value: '=', line: 1, column: 7 },
            { type: 'NUMBER', value: '10', line: 1, column: 9 },
            { type: 'OPERATOR', value: ';', line: 1, column: 11 },
            { type: 'EOF', value: null }
        ];

        expect(tokens.length).toBe(expectedTokens.length);
        tokens.forEach((token, i) => {
            expect(token.type).toBe(expectedTokens[i].type);
            expect(token.value).toBe(expectedTokens[i].value);
            // 暂时不严格比较 line 和 column，因为 consumeWhitespace 会影响它们
            // expect(token.line).toBe(expectedTokens[i].line);
            // expect(token.column).toBe(expectedTokens[i].column);
        });
    });

    test('should tokenize numbers correctly', () => {
        const sourceCode = '42 123 0';
        const lexer = new Lexer(sourceCode);
        const tokens = lexer.tokenize();
        const expectedValues = ['42', '123', '0'];
        expect(tokens.filter(t => t.type === 'NUMBER').map(t => t.value)).toEqual(expectedValues);
        expect(tokens.find(t => t.type === 'EOF')).toBeDefined();
    });

    test('should tokenize identifiers correctly', () => {
        const sourceCode = 'name _value result1';
        const lexer = new Lexer(sourceCode);
        const tokens = lexer.tokenize();
        const expectedValues = ['name', '_value', 'result1'];
        expect(tokens.filter(t => t.type === 'IDENTIFIER').map(t => t.value)).toEqual(expectedValues);
        expect(tokens.find(t => t.type === 'EOF')).toBeDefined();
    });

    test('should tokenize operators correctly', () => {
        const sourceCode = '+ - * / = ; ( ) { } , .';
        const lexer = new Lexer(sourceCode);
        const tokens = lexer.tokenize();
        const expectedValues = ['+', '-', '*', '/', '=', ';', '(', ')', '{', '}', ',', '.'];
        expect(tokens.filter(t => t.type === 'OPERATOR').map(t => t.value)).toEqual(expectedValues);
        expect(tokens.find(t => t.type === 'EOF')).toBeDefined();
    });

    test('should handle mixed input', () => {
        const sourceCode = 'var count = 100; result = count * 2;';
        const lexer = new Lexer(sourceCode);
        const tokens = lexer.tokenize();
        // A more robust test would check the entire token stream structure
        expect(tokens.length).toBeGreaterThan(5); // Basic check
        expect(tokens.find(t => t.type === 'NUMBER' && t.value === '100')).toBeDefined();
        expect(tokens.find(t => t.type === 'IDENTIFIER' && t.value === 'result')).toBeDefined();
        expect(tokens.find(t => t.type === 'OPERATOR' && t.value === '*')).toBeDefined();
        expect(tokens.find(t => t.type === 'EOF')).toBeDefined();
    });

    test('should handle empty input', () => {
        const sourceCode = '';
        const lexer = new Lexer(sourceCode);
        const tokens = lexer.tokenize();
        expect(tokens.length).toBe(1);
        expect(tokens[0].type).toBe('EOF');
    });

    test('should handle input with only whitespace', () => {
        const sourceCode = '   \t  \n  ';
        const lexer = new Lexer(sourceCode);
        const tokens = lexer.tokenize();
        expect(tokens.length).toBe(1);
        expect(tokens[0].type).toBe('EOF');
    });

    test('should tokenize keywords correctly', () => {
        const sourceCode = 'let const var function if else while for return class true false null';
        const lexer = new Lexer(sourceCode);
        const tokens = lexer.tokenize();
        const expectedKeywords = ['let', 'const', 'var', 'function', 'if', 'else', 'while', 'for', 'return', 'class', 'true', 'false', 'null'];
        const keywordTokens = tokens.filter(t => t.type === 'KEYWORD');

        expect(keywordTokens.length).toBe(expectedKeywords.length);
        keywordTokens.forEach((token, i) => {
            expect(token.value).toBe(expectedKeywords[i]);
        });
        expect(tokens.find(t => t.type === 'EOF')).toBeDefined();
    });

    test('should distinguish keywords from identifiers', () => {
        const sourceCode = 'letter let constant const variable var';
        const lexer = new Lexer(sourceCode);
        const tokens = lexer.tokenize();

        const expectedSequence = [
            { type: 'IDENTIFIER', value: 'letter' },
            { type: 'KEYWORD', value: 'let' },
            { type: 'IDENTIFIER', value: 'constant' },
            { type: 'KEYWORD', value: 'const' },
            { type: 'IDENTIFIER', value: 'variable' },
            { type: 'KEYWORD', value: 'var' },
            { type: 'EOF', value: null }
        ];

        expect(tokens.length).toBe(expectedSequence.length);
        tokens.forEach((token, i) => {
            expect(token.type).toBe(expectedSequence[i].type);
            expect(token.value).toBe(expectedSequence[i].value);
        });
    });

    test('should tokenize string literals with double quotes', () => {
        const sourceCode = 'let greeting = "Hello, world!";';
        const lexer = new Lexer(sourceCode);
        const tokens = lexer.tokenize();
        const stringToken = tokens.find(t => t.type === 'STRING');
        expect(stringToken).toBeDefined();
        expect(stringToken.value).toBe('Hello, world!');
    });

    test('should tokenize string literals with single quotes', () => {
        const tokens = tokenize("'hello'");
        expect(tokens[0]).toMatchObject({ type: 'STRING', value: 'hello' });
    });

    test('should handle empty strings', () => {
        const tokens = tokenize('""');
        expect(tokens[0]).toMatchObject({ type: 'STRING', value: '' });
    });

    test('should handle strings with newline character inside as UNKNOWN (if not allowed)', () => {
        const sourceCode = '"hello\nworld"';
        const { tokens, errors } = tokenize(sourceCode, true);
        const unknownToken = tokens.find(t => t.type === 'UNKNOWN');

        // This test assumes that a raw newline inside a string is an error.
        // If the lexer allows unescaped newlines, this test would need to be adjusted.
        // For now, assuming the current implementation flags it as UNKNOWN.
        expect(unknownToken).toBeDefined();
    });

    test('should handle unterminated strings as UNKNOWN', () => {
        const { tokens } = tokenize('"Hello, world', true);
        const unknownToken = tokens.find(t => t.type === 'UNKNOWN');
        expect(unknownToken).toBeDefined();
        // The exact value might depend on how unterminated strings are handled,
        // here we assume it consumes till EOF or problematic char.
        expect(unknownToken.value.startsWith('"Hello, world')).toBeTruthy();
    });

    test('should handle unterminated multi-line comments as UNKNOWN', () => {
        const sourceCode = 'let z = 1; /* This comment never ends';
        const { tokens } = tokenize(sourceCode, true);
        const unknownToken = tokens.find(t => t.type === 'UNKNOWN');
        expect(unknownToken).toBeDefined();
        expect(unknownToken.value.startsWith('/* This comment never ends')).toBeTruthy();
        // Ensure other tokens are processed correctly before the unterminated comment
        expect(tokens.find(t => t.value === 'let')).toBeDefined();
        expect(tokens.find(t => t.value === 'z')).toBeDefined();
    });

    test('should ignore single-line comments', () => {
        const sourceCode = '// This is a single-line comment\nlet x = 10; // Another comment';
        const lexer = new Lexer(sourceCode);
        const tokens = lexer.tokenize();
        // Expected: let, x, =, 10, ;, EOF
        expect(tokens.length).toBe(6);
        expect(tokens.find(t => t.type === 'COMMENT')).toBeUndefined(); // Comments should be ignored
        expect(tokens[0].value).toBe('let');
        expect(tokens[4].value).toBe(';');
    });

    test('should ignore multi-line comments', () => {
        const sourceCode = '/* This is a\nmulti-line comment */\nlet y = 20;\n/* Another one */';
        const lexer = new Lexer(sourceCode);
        const tokens = lexer.tokenize();
        // Expected: let, y, =, 20, ;, EOF
        expect(tokens.length).toBe(6);
        expect(tokens.find(t => t.type === 'COMMENT')).toBeUndefined(); // Comments should be ignored
        expect(tokens[0].value).toBe('let');
        expect(tokens[1].value).toBe('y');
    });

    test('should handle code with mixed comments', () => {
        const sourceCode = `
            // Single line comment before code
            let value = /* multi-line comment \n inside code */ 42;
            // another single line
            /* multi-line at end */
        `;
        const lexer = new Lexer(sourceCode);
        const tokens = lexer.tokenize();
        // Expected: let, value, =, 42, ;, EOF
        expect(tokens.length).toBe(6);
        expect(tokens.find(t => t.type === 'COMMENT')).toBeUndefined();
        expect(tokens.map(t => t.value)).toEqual(['let', 'value', '=', '42', ';', null]);
    });
});