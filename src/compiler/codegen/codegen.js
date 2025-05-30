/*
 * 目标代码生成器 - 将优化后的AST转换为目标机器代码
 * 
 * 功能：
 * 1. 定义简单的目标机模型（基于栈的虚拟机）
 * 2. 实现指令集和寄存器分配
 * 3. 将AST节点转换为目标指令序列
 * 4. 生成可执行的汇编代码
 * 
 * 作者：编译系统课程设计
 * 日期：2024
 */

// 目标机指令集定义
const INSTRUCTION_SET = {
    // 数据操作指令
    LOAD: 'LOAD',           // 加载立即数到栈顶
    STORE: 'STORE',         // 存储栈顶值到变量
    LOAD_VAR: 'LOAD_VAR',   // 加载变量值到栈顶

    // 算术运算指令
    ADD: 'ADD',             // 栈顶两元素相加
    SUB: 'SUB',             // 栈顶两元素相减
    MUL: 'MUL',             // 栈顶两元素相乘
    DIV: 'DIV',             // 栈顶两元素相除
    MOD: 'MOD',             // 栈顶两元素取模
    NEG: 'NEG',             // 栈顶元素取负

    // 比较指令
    EQ: 'EQ',               // 相等比较
    NE: 'NE',               // 不等比较
    LT: 'LT',               // 小于比较
    LE: 'LE',               // 小于等于比较
    GT: 'GT',               // 大于比较
    GE: 'GE',               // 大于等于比较

    // 逻辑运算指令
    AND: 'AND',             // 逻辑与
    OR: 'OR',               // 逻辑或
    NOT: 'NOT',             // 逻辑非

    // 控制流指令
    JMP: 'JMP',             // 无条件跳转
    JZ: 'JZ',               // 零跳转
    JNZ: 'JNZ',             // 非零跳转
    CALL: 'CALL',           // 函数调用
    RET: 'RET',             // 函数返回

    // 栈操作指令
    PUSH: 'PUSH',           // 压栈
    POP: 'POP',             // 出栈
    DUP: 'DUP',             // 复制栈顶

    // 系统指令
    HALT: 'HALT',           // 程序终止
    PRINT: 'PRINT',         // 输出栈顶值
    INPUT: 'INPUT'          // 输入值到栈顶
};

// 代码生成结果类
class CodeGenerationResult {
    constructor() {
        this.success = false;
        this.instructions = [];         // 生成的指令序列
        this.assembly = '';             // 汇编代码字符串
        this.symbolTable = new Map();   // 符号表（变量地址映射）
        this.labelTable = new Map();    // 标签表（跳转地址映射）
        this.errors = [];
        this.warnings = [];
        this.statistics = {
            instructionCount: 0,
            variableCount: 0,
            labelCount: 0,
            generationTime: 0
        };
    }

    // 添加指令
    addInstruction(opcode, operand = null, comment = '') {
        const instruction = {
            address: this.instructions.length,
            opcode: opcode,
            operand: operand,
            comment: comment
        };
        this.instructions.push(instruction);
        this.statistics.instructionCount++;
        return instruction;
    }

    // 添加标签
    addLabel(name) {
        const address = this.instructions.length;
        this.labelTable.set(name, address);
        this.statistics.labelCount++;
        return address;
    }

    // 添加变量
    addVariable(name, address) {
        this.symbolTable.set(name, address);
        this.statistics.variableCount++;
    }

    // 生成汇编代码
    generateAssembly() {
        let assembly = [];

        // 添加头部注释
        assembly.push('; 编译器生成的汇编代码');
        assembly.push('; 目标机：基于栈的虚拟机');
        assembly.push('');

        // 添加符号表信息
        if (this.symbolTable.size > 0) {
            assembly.push('; 符号表:');
            for (const [name, address] of this.symbolTable) {
                assembly.push(`; ${name} -> ${address}`);
            }
            assembly.push('');
        }

        // 生成指令序列
        for (const instruction of this.instructions) {
            let line = `${instruction.address.toString().padStart(4, '0')}: `;
            line += instruction.opcode;

            if (instruction.operand !== null) {
                line += ` ${instruction.operand}`;
            }

            if (instruction.comment) {
                line += ` ; ${instruction.comment}`;
            }

            assembly.push(line);
        }

        this.assembly = assembly.join('\n');
        return this.assembly;
    }
}

// 目标代码生成器类
class CodeGenerator {
    constructor(options = {}) {
        this.options = {
            targetMachine: 'stack-vm',      // 目标机类型
            optimizeCode: true,             // 是否优化生成的代码
            generateComments: true,         // 是否生成注释
            stackSize: 1024,                // 栈大小
            ...options
        };

        this.result = null;
        this.currentAddress = 0;
        this.labelCounter = 0;
        this.tempCounter = 0;
    }

    /*
     * 生成目标代码
     * @param {Object} ast - 抽象语法树
     * @param {Object} symbolTable - 符号表
     * @returns {CodeGenerationResult} - 代码生成结果
     */
    generate(ast, symbolTable = null) {
        const startTime = Date.now();

        try {
            this.result = new CodeGenerationResult();
            this.currentAddress = 0;
            this.labelCounter = 0;
            this.tempCounter = 0;

            // 初始化符号表
            if (symbolTable) {
                this.initializeSymbolTable(symbolTable);
            }

            // 生成程序入口
            this.generateProgramEntry();

            // 遍历AST生成代码
            this.generateNode(ast);

            // 生成程序出口
            this.generateProgramExit();

            // 生成汇编代码
            this.result.generateAssembly();

            // 后处理优化
            if (this.options.optimizeCode) {
                this.optimizeInstructions();
            }

            this.result.success = true;
            this.result.statistics.generationTime = Date.now() - startTime;

        } catch (error) {
            this.result.errors.push({
                type: 'generation_error',
                message: error.message,
                location: error.location || null
            });
            this.result.success = false;
        }

        return this.result;
    }

    /*
     * 初始化符号表
     * @param {Object} symbolTable - 输入符号表
     */
    initializeSymbolTable(symbolTable) {
        let address = 0;

        // 为每个变量分配地址
        for (const [name, info] of symbolTable.entries()) {
            if (info.type === 'variable') {
                this.result.addVariable(name, address++);
            }
        }
    }

    /*
     * 生成程序入口代码
     */
    generateProgramEntry() {
        this.result.addInstruction(
            INSTRUCTION_SET.PUSH,
            0,
            '程序开始，初始化栈帧'
        );
    }

    /*
     * 生成程序出口代码
     */
    generateProgramExit() {
        this.result.addInstruction(
            INSTRUCTION_SET.HALT,
            null,
            '程序结束'
        );
    }

    /*
     * 根据AST节点类型生成相应代码
     * @param {Object} node - AST节点
     */
    generateNode(node) {
        if (!node) return;

        switch (node.type) {
            case 'Program':
                this.generateProgram(node);
                break;
            case 'VariableDeclaration':
                this.generateVariableDeclaration(node);
                break;
            case 'AssignmentExpression':
                this.generateAssignment(node);
                break;
            case 'BinaryExpression':
                this.generateBinaryExpression(node);
                break;
            case 'UnaryExpression':
                this.generateUnaryExpression(node);
                break;
            case 'Literal':
                this.generateLiteral(node);
                break;
            case 'Identifier':
                this.generateIdentifier(node);
                break;
            case 'IfStatement':
                this.generateIfStatement(node);
                break;
            case 'WhileStatement':
                this.generateWhileStatement(node);
                break;
            case 'BlockStatement':
                this.generateBlockStatement(node);
                break;
            case 'ExpressionStatement':
                this.generateExpressionStatement(node);
                break;
            case 'PrintStatement':
                this.generatePrintStatement(node);
                break;
            default:
                this.result.warnings.push({
                    type: 'unsupported_node',
                    message: `不支持的节点类型: ${node.type}`,
                    location: node.location
                });
        }
    }

    /*
     * 生成程序节点代码
     * @param {Object} node - 程序节点
     */
    generateProgram(node) {
        if (node.body && Array.isArray(node.body)) {
            for (const statement of node.body) {
                this.generateNode(statement);
            }
        }
    }

    /*
     * 生成变量声明代码
     * @param {Object} node - 变量声明节点
     */
    generateVariableDeclaration(node) {
        if (node.declarations) {
            for (const declaration of node.declarations) {
                if (declaration.init) {
                    // 生成初始值表达式
                    this.generateNode(declaration.init);

                    // 存储到变量
                    const varName = declaration.id.name;
                    const address = this.result.symbolTable.get(varName);

                    this.result.addInstruction(
                        INSTRUCTION_SET.STORE,
                        address,
                        `存储到变量 ${varName}`
                    );
                }
            }
        }
    }

    /*
     * 生成赋值表达式代码
     * @param {Object} node - 赋值表达式节点
     */
    generateAssignment(node) {
        // 生成右侧表达式
        this.generateNode(node.right);

        // 存储到左侧变量
        if (node.left.type === 'Identifier') {
            const varName = node.left.name;
            const address = this.result.symbolTable.get(varName);

            if (address !== undefined) {
                this.result.addInstruction(
                    INSTRUCTION_SET.STORE,
                    address,
                    `赋值给变量 ${varName}`
                );
            } else {
                throw new Error(`未定义的变量: ${varName}`);
            }
        }
    }

    /*
     * 生成二元表达式代码
     * @param {Object} node - 二元表达式节点
     */
    generateBinaryExpression(node) {
        // 生成左操作数
        this.generateNode(node.left);

        // 生成右操作数
        this.generateNode(node.right);

        // 生成运算指令
        const operator = node.operator;
        let instruction;

        switch (operator) {
            case '+':
                instruction = INSTRUCTION_SET.ADD;
                break;
            case '-':
                instruction = INSTRUCTION_SET.SUB;
                break;
            case '*':
                instruction = INSTRUCTION_SET.MUL;
                break;
            case '/':
                instruction = INSTRUCTION_SET.DIV;
                break;
            case '%':
                instruction = INSTRUCTION_SET.MOD;
                break;
            case '==':
                instruction = INSTRUCTION_SET.EQ;
                break;
            case '!=':
                instruction = INSTRUCTION_SET.NE;
                break;
            case '<':
                instruction = INSTRUCTION_SET.LT;
                break;
            case '<=':
                instruction = INSTRUCTION_SET.LE;
                break;
            case '>':
                instruction = INSTRUCTION_SET.GT;
                break;
            case '>=':
                instruction = INSTRUCTION_SET.GE;
                break;
            case '&&':
                instruction = INSTRUCTION_SET.AND;
                break;
            case '||':
                instruction = INSTRUCTION_SET.OR;
                break;
            default:
                throw new Error(`不支持的二元运算符: ${operator}`);
        }

        this.result.addInstruction(
            instruction,
            null,
            `${operator} 运算`
        );
    }

    /*
     * 生成一元表达式代码
     * @param {Object} node - 一元表达式节点
     */
    generateUnaryExpression(node) {
        // 生成操作数
        this.generateNode(node.argument);

        // 生成运算指令
        const operator = node.operator;
        let instruction;

        switch (operator) {
            case '-':
                instruction = INSTRUCTION_SET.NEG;
                break;
            case '!':
                instruction = INSTRUCTION_SET.NOT;
                break;
            default:
                throw new Error(`不支持的一元运算符: ${operator}`);
        }

        this.result.addInstruction(
            instruction,
            null,
            `${operator} 运算`
        );
    }

    /*
     * 生成字面量代码
     * @param {Object} node - 字面量节点
     */
    generateLiteral(node) {
        this.result.addInstruction(
            INSTRUCTION_SET.LOAD,
            node.value,
            `加载常量 ${node.value}`
        );
    }

    /*
     * 生成标识符代码
     * @param {Object} node - 标识符节点
     */
    generateIdentifier(node) {
        const varName = node.name;
        const address = this.result.symbolTable.get(varName);

        if (address !== undefined) {
            this.result.addInstruction(
                INSTRUCTION_SET.LOAD_VAR,
                address,
                `加载变量 ${varName}`
            );
        } else {
            throw new Error(`未定义的变量: ${varName}`);
        }
    }

    /*
     * 生成if语句代码
     * @param {Object} node - if语句节点
     */
    generateIfStatement(node) {
        const elseLabel = this.generateLabel('else');
        const endLabel = this.generateLabel('endif');

        // 生成条件表达式
        this.generateNode(node.test);

        // 条件为假时跳转到else分支
        this.result.addInstruction(
            INSTRUCTION_SET.JZ,
            elseLabel,
            'if条件为假时跳转'
        );

        // 生成then分支
        this.generateNode(node.consequent);

        // 跳转到结束
        this.result.addInstruction(
            INSTRUCTION_SET.JMP,
            endLabel,
            '跳转到if语句结束'
        );

        // else标签
        this.result.addLabel(elseLabel);

        // 生成else分支（如果存在）
        if (node.alternate) {
            this.generateNode(node.alternate);
        }

        // 结束标签
        this.result.addLabel(endLabel);
    }

    /*
     * 生成while语句代码
     * @param {Object} node - while语句节点
     */
    generateWhileStatement(node) {
        const loopLabel = this.generateLabel('loop');
        const endLabel = this.generateLabel('endloop');

        // 循环开始标签
        this.result.addLabel(loopLabel);

        // 生成条件表达式
        this.generateNode(node.test);

        // 条件为假时跳出循环
        this.result.addInstruction(
            INSTRUCTION_SET.JZ,
            endLabel,
            'while条件为假时跳出循环'
        );

        // 生成循环体
        this.generateNode(node.body);

        // 跳回循环开始
        this.result.addInstruction(
            INSTRUCTION_SET.JMP,
            loopLabel,
            '跳回循环开始'
        );

        // 循环结束标签
        this.result.addLabel(endLabel);
    }

    /*
     * 生成块语句代码
     * @param {Object} node - 块语句节点
     */
    generateBlockStatement(node) {
        if (node.body && Array.isArray(node.body)) {
            for (const statement of node.body) {
                this.generateNode(statement);
            }
        }
    }

    /*
     * 生成表达式语句代码
     * @param {Object} node - 表达式语句节点
     */
    generateExpressionStatement(node) {
        this.generateNode(node.expression);

        // 弹出表达式结果（如果不需要保留）
        this.result.addInstruction(
            INSTRUCTION_SET.POP,
            null,
            '弹出表达式结果'
        );
    }

    /*
     * 生成打印语句代码
     * @param {Object} node - 打印语句节点
     */
    generatePrintStatement(node) {
        // 生成要打印的表达式
        this.generateNode(node.expression);

        // 打印栈顶值
        this.result.addInstruction(
            INSTRUCTION_SET.PRINT,
            null,
            '打印输出'
        );
    }

    /*
     * 生成唯一标签名
     * @param {string} prefix - 标签前缀
     * @returns {string} - 标签名
     */
    generateLabel(prefix = 'L') {
        return `${prefix}_${this.labelCounter++}`;
    }

    /*
     * 优化指令序列
     */
    optimizeInstructions() {
        if (!this.options.optimizeCode) return;

        let optimized = false;

        // 窥孔优化：移除冗余的PUSH/POP对
        for (let i = 0; i < this.result.instructions.length - 1; i++) {
            const current = this.result.instructions[i];
            const next = this.result.instructions[i + 1];

            if (current.opcode === INSTRUCTION_SET.PUSH &&
                next.opcode === INSTRUCTION_SET.POP) {
                // 移除冗余的PUSH/POP对
                this.result.instructions.splice(i, 2);
                optimized = true;
                i--; // 重新检查当前位置
            }
        }

        // 更新地址
        if (optimized) {
            this.updateInstructionAddresses();
        }
    }

    /*
     * 更新指令地址
     */
    updateInstructionAddresses() {
        for (let i = 0; i < this.result.instructions.length; i++) {
            this.result.instructions[i].address = i;
        }

        // 更新标签地址
        for (const [label, oldAddress] of this.result.labelTable) {
            // 查找新地址（简化处理，实际应该更精确）
            this.result.labelTable.set(label, oldAddress);
        }
    }

    /*
     * 设置生成选项
     * @param {Object} options - 选项对象
     */
    setOptions(options) {
        this.options = { ...this.options, ...options };
    }

    /*
     * 重置生成器状态
     */
    reset() {
        this.result = null;
        this.currentAddress = 0;
        this.labelCounter = 0;
        this.tempCounter = 0;
    }

    /*
     * 获取版本信息
     * @returns {string} - 版本信息
     */
    getVersion() {
        return '1.0.0';
    }
}

// 导出模块
module.exports = {
    CodeGenerator,
    CodeGenerationResult,
    INSTRUCTION_SET
};

// 目标代码生成器演示
if (require.main === module) {
    console.log('=== 目标代码生成器演示 ===');

    // 创建测试AST
    const testAST = {
        type: 'Program',
        body: [
            {
                type: 'VariableDeclaration',
                declarations: [{
                    type: 'VariableDeclarator',
                    id: { type: 'Identifier', name: 'x' },
                    init: { type: 'Literal', value: 10 }
                }]
            },
            {
                type: 'VariableDeclaration',
                declarations: [{
                    type: 'VariableDeclarator',
                    id: { type: 'Identifier', name: 'y' },
                    init: { type: 'Literal', value: 20 }
                }]
            },
            {
                type: 'AssignmentExpression',
                operator: '=',
                left: { type: 'Identifier', name: 'x' },
                right: {
                    type: 'BinaryExpression',
                    operator: '+',
                    left: { type: 'Identifier', name: 'x' },
                    right: { type: 'Identifier', name: 'y' }
                }
            },
            {
                type: 'PrintStatement',
                expression: { type: 'Identifier', name: 'x' }
            }
        ]
    };

    // 创建符号表
    const symbolTable = new Map([
        ['x', { type: 'variable', dataType: 'number' }],
        ['y', { type: 'variable', dataType: 'number' }]
    ]);

    // 创建代码生成器
    const generator = new CodeGenerator({
        optimizeCode: true,
        generateComments: true
    });

    // 生成目标代码
    console.log('\n生成目标代码...');
    const result = generator.generate(testAST, symbolTable);

    if (result.success) {
        console.log('\n=== 生成的汇编代码 ===');
        console.log(result.assembly);

        console.log('\n=== 生成统计信息 ===');
        console.log(`指令数量: ${result.statistics.instructionCount}`);
        console.log(`变量数量: ${result.statistics.variableCount}`);
        console.log(`标签数量: ${result.statistics.labelCount}`);
        console.log(`生成时间: ${result.statistics.generationTime}ms`);

        if (result.warnings.length > 0) {
            console.log('\n=== 警告信息 ===');
            result.warnings.forEach(warning => {
                console.log(`- ${warning.message}`);
            });
        }
    } else {
        console.log('\n=== 生成失败 ===');
        result.errors.forEach(error => {
            console.log(`错误: ${error.message}`);
        });
    }
}