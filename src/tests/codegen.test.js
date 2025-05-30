/*
 * 目标代码生成器测试文件
 * 
 * 功能：
 * 1. 测试基本代码生成功能
 * 2. 测试各种AST节点的代码生成
 * 3. 测试指令优化
 * 4. 测试错误处理
 * 5. 测试性能
 * 
 * 作者：编译系统课程设计
 * 日期：2024
 */

const { CodeGenerator, INSTRUCTION_SET } = require('../compiler/codegen/codegen');

// 测试工具函数
function createTestAST(type, properties = {}) {
    return {
        type: type,
        ...properties
    };
}

function createSymbolTable(symbols = {}) {
    const table = new Map();
    Object.keys(symbols).forEach(name => {
        table.set(name, symbols[name]);
    });
    return table;
}

// 测试用例
function runCodeGenTests() {
    console.log('=== 目标代码生成器测试 ===\n');

    let passedTests = 0;
    let totalTests = 0;

    // 测试函数
    function test(name, testFn) {
        totalTests++;
        try {
            console.log(`测试 ${totalTests}: ${name}`);
            testFn();
            console.log('✅ 通过\n');
            passedTests++;
        } catch (error) {
            console.log(`❌ 失败: ${error.message}\n`);
        }
    }

    // 断言函数
    function assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }

    // 1. 基本代码生成器创建测试
    test('代码生成器创建', () => {
        const generator = new CodeGenerator();
        assert(generator !== null, '代码生成器应该被成功创建');
        assert(generator.getVersion() === '1.0.0', '版本号应该正确');
    });

    // 2. 字面量代码生成测试
    test('字面量代码生成', () => {
        const generator = new CodeGenerator();
        const ast = createTestAST('Literal', { value: 42 });

        const result = generator.generate(ast);

        assert(result.success, '代码生成应该成功');
        assert(result.instructions.length > 0, '应该生成指令');
        assert(result.instructions[1].opcode === INSTRUCTION_SET.LOAD, '应该生成LOAD指令');
        assert(result.instructions[1].operand === 42, '操作数应该正确');
    });

    // 3. 变量声明代码生成测试
    test('变量声明代码生成', () => {
        const generator = new CodeGenerator();
        const ast = createTestAST('VariableDeclaration', {
            declarations: [{
                type: 'VariableDeclarator',
                id: { type: 'Identifier', name: 'x' },
                init: { type: 'Literal', value: 10 }
            }]
        });

        const symbolTable = createSymbolTable({
            'x': { type: 'variable', dataType: 'number' }
        });

        const result = generator.generate(ast, symbolTable);

        assert(result.success, '代码生成应该成功');
        assert(result.symbolTable.has('x'), '符号表应该包含变量x');

        // 检查生成的指令
        const loadInstr = result.instructions.find(instr => instr.opcode === INSTRUCTION_SET.LOAD);
        const storeInstr = result.instructions.find(instr => instr.opcode === INSTRUCTION_SET.STORE);

        assert(loadInstr !== undefined, '应该生成LOAD指令');
        assert(storeInstr !== undefined, '应该生成STORE指令');
        assert(loadInstr.operand === 10, 'LOAD指令操作数应该正确');
    });

    // 4. 二元表达式代码生成测试
    test('二元表达式代码生成', () => {
        const generator = new CodeGenerator();
        const ast = createTestAST('BinaryExpression', {
            operator: '+',
            left: { type: 'Literal', value: 5 },
            right: { type: 'Literal', value: 3 }
        });

        const result = generator.generate(ast);

        assert(result.success, '代码生成应该成功');

        // 检查指令序列：PUSH 0, LOAD 5, LOAD 3, ADD, HALT
        const instructions = result.instructions;
        assert(instructions.length >= 5, '应该生成足够的指令');

        const addInstr = instructions.find(instr => instr.opcode === INSTRUCTION_SET.ADD);
        assert(addInstr !== undefined, '应该生成ADD指令');
    });

    // 5. 赋值表达式代码生成测试
    test('赋值表达式代码生成', () => {
        const generator = new CodeGenerator();
        const ast = createTestAST('AssignmentExpression', {
            operator: '=',
            left: { type: 'Identifier', name: 'x' },
            right: { type: 'Literal', value: 20 }
        });

        const symbolTable = createSymbolTable({
            'x': { type: 'variable', dataType: 'number' }
        });

        const result = generator.generate(ast, symbolTable);

        assert(result.success, '代码生成应该成功');

        const storeInstr = result.instructions.find(instr => instr.opcode === INSTRUCTION_SET.STORE);
        assert(storeInstr !== undefined, '应该生成STORE指令');
        assert(storeInstr.operand === 0, 'STORE指令应该指向正确的变量地址');
    });

    // 6. 一元表达式代码生成测试
    test('一元表达式代码生成', () => {
        const generator = new CodeGenerator();
        const ast = createTestAST('UnaryExpression', {
            operator: '-',
            argument: { type: 'Literal', value: 5 }
        });

        const result = generator.generate(ast);

        assert(result.success, '代码生成应该成功');

        const negInstr = result.instructions.find(instr => instr.opcode === INSTRUCTION_SET.NEG);
        assert(negInstr !== undefined, '应该生成NEG指令');
    });

    // 7. 标识符代码生成测试
    test('标识符代码生成', () => {
        const generator = new CodeGenerator();
        const ast = createTestAST('Identifier', { name: 'y' });

        const symbolTable = createSymbolTable({
            'y': { type: 'variable', dataType: 'number' }
        });

        const result = generator.generate(ast, symbolTable);

        assert(result.success, '代码生成应该成功');

        const loadVarInstr = result.instructions.find(instr => instr.opcode === INSTRUCTION_SET.LOAD_VAR);
        assert(loadVarInstr !== undefined, '应该生成LOAD_VAR指令');
        assert(loadVarInstr.operand === 0, 'LOAD_VAR指令应该指向正确的变量地址');
    });

    // 8. if语句代码生成测试
    test('if语句代码生成', () => {
        const generator = new CodeGenerator();
        const ast = createTestAST('IfStatement', {
            test: { type: 'Literal', value: 1 },
            consequent: {
                type: 'ExpressionStatement',
                expression: { type: 'Literal', value: 10 }
            },
            alternate: {
                type: 'ExpressionStatement',
                expression: { type: 'Literal', value: 20 }
            }
        });

        const result = generator.generate(ast);

        assert(result.success, '代码生成应该成功');
        assert(result.labelTable.size >= 2, '应该生成至少2个标签');

        const jzInstr = result.instructions.find(instr => instr.opcode === INSTRUCTION_SET.JZ);
        const jmpInstr = result.instructions.find(instr => instr.opcode === INSTRUCTION_SET.JMP);

        assert(jzInstr !== undefined, '应该生成JZ指令');
        assert(jmpInstr !== undefined, '应该生成JMP指令');
    });

    // 9. while语句代码生成测试
    test('while语句代码生成', () => {
        const generator = new CodeGenerator();
        const ast = createTestAST('WhileStatement', {
            test: { type: 'Literal', value: 1 },
            body: {
                type: 'ExpressionStatement',
                expression: { type: 'Literal', value: 5 }
            }
        });

        const result = generator.generate(ast);

        assert(result.success, '代码生成应该成功');
        assert(result.labelTable.size >= 2, '应该生成至少2个标签');

        const jzInstr = result.instructions.find(instr => instr.opcode === INSTRUCTION_SET.JZ);
        const jmpInstr = result.instructions.find(instr => instr.opcode === INSTRUCTION_SET.JMP);

        assert(jzInstr !== undefined, '应该生成JZ指令');
        assert(jmpInstr !== undefined, '应该生成JMP指令');
    });

    // 10. 程序节点代码生成测试
    test('程序节点代码生成', () => {
        const generator = new CodeGenerator();
        const ast = createTestAST('Program', {
            body: [
                {
                    type: 'VariableDeclaration',
                    declarations: [{
                        type: 'VariableDeclarator',
                        id: { type: 'Identifier', name: 'a' },
                        init: { type: 'Literal', value: 1 }
                    }]
                },
                {
                    type: 'VariableDeclaration',
                    declarations: [{
                        type: 'VariableDeclarator',
                        id: { type: 'Identifier', name: 'b' },
                        init: { type: 'Literal', value: 2 }
                    }]
                }
            ]
        });

        const symbolTable = createSymbolTable({
            'a': { type: 'variable', dataType: 'number' },
            'b': { type: 'variable', dataType: 'number' }
        });

        const result = generator.generate(ast, symbolTable);

        assert(result.success, '代码生成应该成功');
        assert(result.symbolTable.size === 2, '符号表应该包含2个变量');
        assert(result.instructions.length > 5, '应该生成多条指令');
    });

    // 11. 汇编代码生成测试
    test('汇编代码生成', () => {
        const generator = new CodeGenerator();
        const ast = createTestAST('Literal', { value: 100 });

        const result = generator.generate(ast);

        assert(result.success, '代码生成应该成功');
        assert(result.assembly.length > 0, '应该生成汇编代码');
        assert(result.assembly.includes('编译器生成的汇编代码'), '汇编代码应该包含头部注释');
        assert(result.assembly.includes('LOAD'), '汇编代码应该包含LOAD指令');
        assert(result.assembly.includes('100'), '汇编代码应该包含操作数');
    });

    // 12. 错误处理测试
    test('未定义变量错误处理', () => {
        const generator = new CodeGenerator();
        const ast = createTestAST('Identifier', { name: 'undefined_var' });

        const result = generator.generate(ast);

        assert(!result.success, '代码生成应该失败');
        assert(result.errors.length > 0, '应该有错误信息');
        assert(result.errors[0].message.includes('未定义的变量'), '错误信息应该正确');
    });

    // 13. 不支持的运算符错误处理测试
    test('不支持的运算符错误处理', () => {
        const generator = new CodeGenerator();
        const ast = createTestAST('BinaryExpression', {
            operator: '**',  // 不支持的运算符
            left: { type: 'Literal', value: 2 },
            right: { type: 'Literal', value: 3 }
        });

        const result = generator.generate(ast);

        assert(!result.success, '代码生成应该失败');
        assert(result.errors.length > 0, '应该有错误信息');
    });

    // 14. 代码优化测试
    test('代码优化功能', () => {
        const generator = new CodeGenerator({ optimizeCode: true });

        // 创建一个会产生冗余PUSH/POP的AST
        const ast = createTestAST('Program', {
            body: [
                {
                    type: 'ExpressionStatement',
                    expression: { type: 'Literal', value: 1 }
                },
                {
                    type: 'ExpressionStatement',
                    expression: { type: 'Literal', value: 2 }
                }
            ]
        });

        const result = generator.generate(ast);

        assert(result.success, '代码生成应该成功');
        // 优化应该移除一些冗余指令
    });

    // 15. 复杂表达式代码生成测试
    test('复杂表达式代码生成', () => {
        const generator = new CodeGenerator();
        const ast = createTestAST('BinaryExpression', {
            operator: '+',
            left: {
                type: 'BinaryExpression',
                operator: '*',
                left: { type: 'Literal', value: 2 },
                right: { type: 'Literal', value: 3 }
            },
            right: {
                type: 'BinaryExpression',
                operator: '-',
                left: { type: 'Literal', value: 10 },
                right: { type: 'Literal', value: 4 }
            }
        });

        const result = generator.generate(ast);

        assert(result.success, '代码生成应该成功');

        // 检查是否包含所有必要的运算指令
        const mulInstr = result.instructions.find(instr => instr.opcode === INSTRUCTION_SET.MUL);
        const subInstr = result.instructions.find(instr => instr.opcode === INSTRUCTION_SET.SUB);
        const addInstr = result.instructions.find(instr => instr.opcode === INSTRUCTION_SET.ADD);

        assert(mulInstr !== undefined, '应该生成MUL指令');
        assert(subInstr !== undefined, '应该生成SUB指令');
        assert(addInstr !== undefined, '应该生成ADD指令');
    });

    // 16. 性能测试
    test('性能测试', () => {
        const generator = new CodeGenerator();

        // 创建一个较大的AST
        const statements = [];
        for (let i = 0; i < 100; i++) {
            statements.push({
                type: 'VariableDeclaration',
                declarations: [{
                    type: 'VariableDeclarator',
                    id: { type: 'Identifier', name: `var${i}` },
                    init: { type: 'Literal', value: i }
                }]
            });
        }

        const ast = createTestAST('Program', { body: statements });

        const symbolTable = new Map();
        for (let i = 0; i < 100; i++) {
            symbolTable.set(`var${i}`, { type: 'variable', dataType: 'number' });
        }

        const startTime = Date.now();
        const result = generator.generate(ast, symbolTable);
        const endTime = Date.now();

        assert(result.success, '代码生成应该成功');
        assert(endTime - startTime < 1000, '代码生成应该在合理时间内完成');
        assert(result.instructions.length > 200, '应该生成大量指令');

        console.log(`    性能: 生成${result.instructions.length}条指令，耗时${endTime - startTime}ms`);
    });

    // 17. 选项设置测试
    test('选项设置功能', () => {
        const generator = new CodeGenerator();

        generator.setOptions({
            optimizeCode: false,
            generateComments: false
        });

        const ast = createTestAST('Literal', { value: 42 });
        const result = generator.generate(ast);

        assert(result.success, '代码生成应该成功');
    });

    // 18. 重置功能测试
    test('重置功能', () => {
        const generator = new CodeGenerator();

        // 先生成一些代码
        const ast = createTestAST('Literal', { value: 1 });
        generator.generate(ast);

        // 重置
        generator.reset();

        // 再次生成
        const result = generator.generate(ast);
        assert(result.success, '重置后代码生成应该成功');
    });

    // 19. 统计信息测试
    test('统计信息收集', () => {
        const generator = new CodeGenerator();
        const ast = createTestAST('Program', {
            body: [
                {
                    type: 'VariableDeclaration',
                    declarations: [{
                        type: 'VariableDeclarator',
                        id: { type: 'Identifier', name: 'x' },
                        init: { type: 'Literal', value: 10 }
                    }]
                }
            ]
        });

        const symbolTable = createSymbolTable({
            'x': { type: 'variable', dataType: 'number' }
        });

        const result = generator.generate(ast, symbolTable);

        assert(result.success, '代码生成应该成功');
        assert(result.statistics.instructionCount > 0, '应该统计指令数量');
        assert(result.statistics.variableCount > 0, '应该统计变量数量');
        assert(result.statistics.generationTime >= 0, '应该统计生成时间');
    });

    // 输出测试结果
    console.log('='.repeat(50));
    console.log(`测试完成: ${passedTests}/${totalTests} 通过`);

    if (passedTests === totalTests) {
        console.log('🎉 所有测试通过！');
        return true;
    } else {
        console.log(`❌ ${totalTests - passedTests} 个测试失败`);
        return false;
    }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
    runCodeGenTests();
}

// 导出测试函数
module.exports = {
    runCodeGenTests
};