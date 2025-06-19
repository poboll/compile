/*
 * 语法分析器测试 - parser.test.js
 * @description 测试语法分析器的各种功能，包括AST构建和错误处理
 * @module tests/parser.test
 * @author AI Assistant
 * @date 2025-07-26
 */

const Lexer = require('../compiler/lexer/lexer');
const { Parser } = require('../compiler/parser/parser');

// 辅助函数：从源代码创建AST
function parseCode(sourceCode) {
    const lexer = new Lexer(sourceCode);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    return {
        ast: parser.parse(),
        errors: parser.getErrors()
    };
}

describe('Parser', () => {

    describe('AST Construction', () => {
        test('should parse a variable declaration', () => {
            const { ast } = parseCode('let x = 42;');
            expect(ast.body).toHaveLength(1);
            const decl = ast.body[0];
            expect(decl.nodeType).toBe('VariableDeclaration');
            expect(decl.kind).toBe('let');
            expect(decl.identifier.name).toBe('x');
            expect(decl.initializer.value).toBe(42);
        });

        test('should parse a constant declaration', () => {
            const { ast } = parseCode('const PI = 3.14;');
            const decl = ast.body[0];
            expect(decl.nodeType).toBe('VariableDeclaration');
            expect(decl.kind).toBe('const');
            expect(decl.identifier.name).toBe('PI');
            expect(decl.initializer.value).toBe(3.14);
        });

        test('should parse a function declaration', () => {
            const code = `
        function add(a, b) {
            return a + b;
        }
        `;
            const { ast } = parseCode(code);
            const func = ast.body[0];
            expect(func.nodeType).toBe('FunctionDeclaration');
            expect(func.identifier.name).toBe('add');
            expect(func.params).toHaveLength(2);
            expect(func.params[0].name).toBe('a');
            expect(func.params[1].name).toBe('b');
            expect(func.body.nodeType).toBe('BlockStatement');
        });

        test('should parse a binary expression respecting precedence', () => {
            const { ast } = parseCode('let result = x + y * 2;');
            const assignment = ast.body[0].initializer;
            expect(assignment.nodeType).toBe('BinaryExpression');
            expect(assignment.operator).toBe('+');
            expect(assignment.right.nodeType).toBe('BinaryExpression');
            expect(assignment.right.operator).toBe('*');
        });

        test('should parse an if-else statement', () => {
            const code = `
        if (x > 0) {
            console.log("positive");
        } else {
            console.log("negative");
        }
        `;
            const { ast } = parseCode(code);
            const stmt = ast.body[0];
            expect(stmt.nodeType).toBe('IfStatement');
            expect(stmt.test.nodeType).toBe('BinaryExpression');
            expect(stmt.consequent.nodeType).toBe('BlockStatement');
            expect(stmt.alternate.nodeType).toBe('BlockStatement');
        });

        test('should parse a while loop', () => {
            const code = `
        while (i < 10) {
            i = i + 1;
        }
        `;
            const { ast } = parseCode(code);
            const stmt = ast.body[0];
            expect(stmt.nodeType).toBe('WhileStatement');
            expect(stmt.test.nodeType).toBe('BinaryExpression');
            expect(stmt.body.nodeType).toBe('BlockStatement');
        });

        test('should parse a function call', () => {
            const { ast } = parseCode('let result = add(1, 2);');
            const callExpr = ast.body[0].initializer;
            expect(callExpr.nodeType).toBe('CallExpression');
            expect(callExpr.callee.name).toBe('add');
            expect(callExpr.arguments).toHaveLength(2);
            expect(callExpr.arguments[0].value).toBe(1);
            expect(callExpr.arguments[1].value).toBe(2);
        });

        test('should parse an assignment expression', () => {
            const { ast } = parseCode('x = y + 1;');
            const assignExpr = ast.body[0].expression;
            expect(assignExpr.nodeType).toBe('AssignmentExpression');
            expect(assignExpr.operator).toBe('=');
            expect(assignExpr.left.name).toBe('x');
            expect(assignExpr.right.nodeType).toBe('BinaryExpression');
        });
    });

    describe('Error Handling', () => {
        test('should report a missing semicolon', () => {
            const { errors } = parseCode('let x = 42');
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].message).toContain('Expected');
        });

        test('should report a missing right parenthesis', () => {
            const { errors } = parseCode('if (x > 0 { console.log("positive"); }');
            expect(errors.length).toBeGreaterThan(0);
        });

        test('should report a missing initializer for const', () => {
            const { errors } = parseCode('const x;');
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].message).toContain('const declaration requires initialization');
        });

        test('should report an invalid assignment target', () => {
            const { errors } = parseCode('42 = x;');
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].message).toContain('无效的赋值目标');
        });

        test('should report an unexpected token', () => {
            const { errors } = parseCode('let x = @;');
            expect(errors.length).toBeGreaterThan(0);
        });
    });
});