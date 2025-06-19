/**
 * 目标机器代码生成模块 - target-machine.js
 * @description 定义目标机器的代码生成接口和实现
 *              支持多种目标架构的代码生成
 * @module compiler/codegen/target-machine
 * @author poboll
 * @date 2025
 * @version 1.0
 * 
 * 主要功能：
 * 1. 定义目标机器的抽象接口
 * 2. 实现x86/x64架构的代码生成
 * 3. 支持ARM架构的代码生成
 * 4. 提供寄存器分配和管理
 * 5. 实现指令选择和优化
 * 6. 支持调试信息生成
 */

const { logger } = require('../../utils/logger');

// 目标架构枚举
const TargetArch = {
    X86: 'x86',
    X64: 'x64',
    ARM: 'arm',
    ARM64: 'arm64',
    MIPS: 'mips'
};

// 寄存器类型
const RegisterType = {
    GENERAL: 'general',
    FLOAT: 'float',
    VECTOR: 'vector',
    SPECIAL: 'special'
};

// 指令类型
const InstructionType = {
    MOVE: 'mov',
    ADD: 'add',
    SUB: 'sub',
    MUL: 'mul',
    DIV: 'div',
    LOAD: 'load',
    STORE: 'store',
    JUMP: 'jmp',
    CALL: 'call',
    RET: 'ret',
    CMP: 'cmp',
    BRANCH: 'branch'
};

/**
 * 寄存器类
 */
class Register {
    constructor(name, type, size) {
        this.name = name;
        this.type = type;
        this.size = size;
        this.allocated = false;
        this.value = null;
    }

    /**
     * 分配寄存器
     * @param {*} value - 分配的值
     */
    allocate(value) {
        this.allocated = true;
        this.value = value;
    }

    /**
     * 释放寄存器
     */
    free() {
        this.allocated = false;
        this.value = null;
    }

    /**
     * 检查寄存器是否可用
     * @returns {boolean} - 是否可用
     */
    isAvailable() {
        return !this.allocated;
    }
}

/**
 * 指令类
 */
class Instruction {
    constructor(opcode, operands = [], comment = '') {
        this.opcode = opcode;
        this.operands = operands;
        this.comment = comment;
        this.label = null;
    }

    /**
     * 设置标签
     * @param {string} label - 标签名
     */
    setLabel(label) {
        this.label = label;
    }

    /**
     * 转换为汇编代码
     * @returns {string} - 汇编代码
     */
    toAssembly() {
        let asm = '';

        if (this.label) {
            asm += `${this.label}:\n`;
        }

        asm += `\t${this.opcode}`;

        if (this.operands.length > 0) {
            asm += ` ${this.operands.join(', ')}`;
        }

        if (this.comment) {
            asm += ` ; ${this.comment}`;
        }

        return asm;
    }
}

/**
 * 目标机器基类
 */
class TargetMachine {
    constructor(arch = TargetArch.X64) {
        this.arch = arch;
        this.registers = new Map();
        this.instructions = [];
        this.labelCounter = 0;
        this.stackOffset = 0;
        this.currentFunction = null;

        this.initializeRegisters();
    }

    /**
     * 初始化寄存器
     */
    initializeRegisters() {
        switch (this.arch) {
            case TargetArch.X64:
                this.initializeX64Registers();
                break;
            case TargetArch.X86:
                this.initializeX86Registers();
                break;
            case TargetArch.ARM64:
                this.initializeARM64Registers();
                break;
            default:
                logger.warn(`不支持的目标架构: ${this.arch}`);
        }
    }

    /**
     * 初始化x64寄存器
     */
    initializeX64Registers() {
        const generalRegs = ['rax', 'rbx', 'rcx', 'rdx', 'rsi', 'rdi', 'r8', 'r9', 'r10', 'r11', 'r12', 'r13', 'r14', 'r15'];
        const floatRegs = ['xmm0', 'xmm1', 'xmm2', 'xmm3', 'xmm4', 'xmm5', 'xmm6', 'xmm7'];

        generalRegs.forEach(name => {
            this.registers.set(name, new Register(name, RegisterType.GENERAL, 64));
        });

        floatRegs.forEach(name => {
            this.registers.set(name, new Register(name, RegisterType.FLOAT, 128));
        });

        // 特殊寄存器
        this.registers.set('rsp', new Register('rsp', RegisterType.SPECIAL, 64));
        this.registers.set('rbp', new Register('rbp', RegisterType.SPECIAL, 64));
    }

    /**
     * 初始化x86寄存器
     */
    initializeX86Registers() {
        const generalRegs = ['eax', 'ebx', 'ecx', 'edx', 'esi', 'edi'];

        generalRegs.forEach(name => {
            this.registers.set(name, new Register(name, RegisterType.GENERAL, 32));
        });

        this.registers.set('esp', new Register('esp', RegisterType.SPECIAL, 32));
        this.registers.set('ebp', new Register('ebp', RegisterType.SPECIAL, 32));
    }

    /**
     * 初始化ARM64寄存器
     */
    initializeARM64Registers() {
        // ARM64通用寄存器 x0-x30
        for (let i = 0; i <= 30; i++) {
            this.registers.set(`x${i}`, new Register(`x${i}`, RegisterType.GENERAL, 64));
        }

        // 浮点寄存器 v0-v31
        for (let i = 0; i <= 31; i++) {
            this.registers.set(`v${i}`, new Register(`v${i}`, RegisterType.FLOAT, 128));
        }

        // 特殊寄存器
        this.registers.set('sp', new Register('sp', RegisterType.SPECIAL, 64));
        this.registers.set('lr', new Register('lr', RegisterType.SPECIAL, 64));
    }

    /**
     * 分配寄存器
     * @param {string} type - 寄存器类型
     * @returns {Register|null} - 分配的寄存器
     */
    allocateRegister(type = RegisterType.GENERAL) {
        for (const [name, register] of this.registers) {
            if (register.type === type && register.isAvailable()) {
                register.allocate();
                return register;
            }
        }

        logger.warn(`无法分配${type}类型的寄存器`);
        return null;
    }

    /**
     * 释放寄存器
     * @param {Register} register - 要释放的寄存器
     */
    freeRegister(register) {
        if (register) {
            register.free();
        }
    }

    /**
     * 生成标签
     * @param {string} prefix - 标签前缀
     * @returns {string} - 生成的标签
     */
    generateLabel(prefix = 'L') {
        return `${prefix}${this.labelCounter++}`;
    }

    /**
     * 添加指令
     * @param {string} opcode - 操作码
     * @param {Array} operands - 操作数
     * @param {string} comment - 注释
     */
    emit(opcode, operands = [], comment = '') {
        const instruction = new Instruction(opcode, operands, comment);
        this.instructions.push(instruction);
        return instruction;
    }

    /**
     * 添加带标签的指令
     * @param {string} label - 标签
     * @param {string} opcode - 操作码
     * @param {Array} operands - 操作数
     * @param {string} comment - 注释
     */
    emitLabel(label, opcode = null, operands = [], comment = '') {
        if (opcode) {
            const instruction = new Instruction(opcode, operands, comment);
            instruction.setLabel(label);
            this.instructions.push(instruction);
            return instruction;
        } else {
            const instruction = new Instruction('', [], comment);
            instruction.setLabel(label);
            this.instructions.push(instruction);
            return instruction;
        }
    }

    /**
     * 生成函数序言
     * @param {string} functionName - 函数名
     */
    emitFunctionPrologue(functionName) {
        this.currentFunction = functionName;
        this.emitLabel(functionName);

        switch (this.arch) {
            case TargetArch.X64:
                this.emit('push', ['rbp'], '保存旧的基指针');
                this.emit('mov', ['rbp', 'rsp'], '设置新的基指针');
                break;
            case TargetArch.X86:
                this.emit('push', ['ebp']);
                this.emit('mov', ['ebp', 'esp']);
                break;
            case TargetArch.ARM64:
                this.emit('stp', ['x29', 'x30', '[sp, #-16]!']);
                this.emit('mov', ['x29', 'sp']);
                break;
        }
    }

    /**
     * 生成函数尾声
     */
    emitFunctionEpilogue() {
        switch (this.arch) {
            case TargetArch.X64:
                this.emit('mov', ['rsp', 'rbp'], '恢复栈指针');
                this.emit('pop', ['rbp'], '恢复基指针');
                this.emit('ret', [], '返回');
                break;
            case TargetArch.X86:
                this.emit('mov', ['esp', 'ebp']);
                this.emit('pop', ['ebp']);
                this.emit('ret');
                break;
            case TargetArch.ARM64:
                this.emit('ldp', ['x29', 'x30', '[sp], #16']);
                this.emit('ret');
                break;
        }

        this.currentFunction = null;
    }

    /**
     * 生成汇编代码
     * @returns {string} - 汇编代码
     */
    generateAssembly() {
        let assembly = '';

        // 添加架构相关的头部
        assembly += this.getAssemblyHeader();

        // 生成指令
        for (const instruction of this.instructions) {
            assembly += instruction.toAssembly() + '\n';
        }

        return assembly;
    }

    /**
     * 获取汇编头部
     * @returns {string} - 汇编头部
     */
    getAssemblyHeader() {
        switch (this.arch) {
            case TargetArch.X64:
                return '.intel_syntax noprefix\n.text\n\n';
            case TargetArch.X86:
                return '.intel_syntax noprefix\n.text\n\n';
            case TargetArch.ARM64:
                return '.text\n\n';
            default:
                return '';
        }
    }

    /**
     * 重置目标机器状态
     */
    reset() {
        this.instructions = [];
        this.labelCounter = 0;
        this.stackOffset = 0;
        this.currentFunction = null;

        // 释放所有寄存器
        for (const register of this.registers.values()) {
            register.free();
        }
    }

    /**
     * 获取目标架构信息
     * @returns {Object} - 架构信息
     */
    getArchInfo() {
        return {
            arch: this.arch,
            registerCount: this.registers.size,
            instructionCount: this.instructions.length,
            currentFunction: this.currentFunction
        };
    }
}

module.exports = {
    TargetMachine,
    TargetArch,
    RegisterType,
    InstructionType,
    Register,
    Instruction
};