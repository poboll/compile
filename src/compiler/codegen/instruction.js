/**
 * 指令定义模块 - instruction.js
 * @description 定义编译器中间代码和目标代码的指令表示
 *              提供指令的创建、操作和优化接口
 * @module compiler/codegen/instruction
 * @author poboll
 * @date 2025
 * @version 1.0
 * 
 * 主要功能：
 * 1. 定义各种指令类型和操作码
 * 2. 实现指令的创建和管理
 * 3. 支持指令的优化和变换
 * 4. 提供指令的序列化和反序列化
 * 5. 实现指令的依赖分析
 * 6. 支持指令的调度和重排序
 */

const { logger } = require('../../utils/logger');

// 指令操作码枚举
const OpCode = {
    // 算术运算
    ADD: 'add',
    SUB: 'sub',
    MUL: 'mul',
    DIV: 'div',
    MOD: 'mod',
    NEG: 'neg',

    // 逻辑运算
    AND: 'and',
    OR: 'or',
    XOR: 'xor',
    NOT: 'not',

    // 比较运算
    EQ: 'eq',
    NE: 'ne',
    LT: 'lt',
    LE: 'le',
    GT: 'gt',
    GE: 'ge',

    // 数据移动
    MOVE: 'mov',
    LOAD: 'load',
    STORE: 'store',
    LEA: 'lea',

    // 控制流
    JUMP: 'jmp',
    BRANCH: 'br',
    CALL: 'call',
    RET: 'ret',

    // 栈操作
    PUSH: 'push',
    POP: 'pop',

    // 类型转换
    CAST: 'cast',
    CONVERT: 'convert',

    // 特殊指令
    NOP: 'nop',
    LABEL: 'label',
    COMMENT: 'comment'
};

// 操作数类型
const OperandType = {
    REGISTER: 'register',
    IMMEDIATE: 'immediate',
    MEMORY: 'memory',
    LABEL: 'label',
    VARIABLE: 'variable'
};

// 数据类型
const DataType = {
    INT8: 'i8',
    INT16: 'i16',
    INT32: 'i32',
    INT64: 'i64',
    UINT8: 'u8',
    UINT16: 'u16',
    UINT32: 'u32',
    UINT64: 'u64',
    FLOAT32: 'f32',
    FLOAT64: 'f64',
    POINTER: 'ptr',
    VOID: 'void'
};

/**
 * 操作数类
 */
class Operand {
    constructor(type, value, dataType = DataType.INT32) {
        this.type = type;
        this.value = value;
        this.dataType = dataType;
        this.size = this.getTypeSize(dataType);
    }

    /**
     * 获取数据类型的大小
     * @param {string} dataType - 数据类型
     * @returns {number} - 字节大小
     */
    getTypeSize(dataType) {
        const sizes = {
            [DataType.INT8]: 1,
            [DataType.UINT8]: 1,
            [DataType.INT16]: 2,
            [DataType.UINT16]: 2,
            [DataType.INT32]: 4,
            [DataType.UINT32]: 4,
            [DataType.INT64]: 8,
            [DataType.UINT64]: 8,
            [DataType.FLOAT32]: 4,
            [DataType.FLOAT64]: 8,
            [DataType.POINTER]: 8,
            [DataType.VOID]: 0
        };
        return sizes[dataType] || 4;
    }

    /**
     * 检查是否为寄存器操作数
     * @returns {boolean} - 是否为寄存器
     */
    isRegister() {
        return this.type === OperandType.REGISTER;
    }

    /**
     * 检查是否为立即数操作数
     * @returns {boolean} - 是否为立即数
     */
    isImmediate() {
        return this.type === OperandType.IMMEDIATE;
    }

    /**
     * 检查是否为内存操作数
     * @returns {boolean} - 是否为内存
     */
    isMemory() {
        return this.type === OperandType.MEMORY;
    }

    /**
     * 检查是否为标签操作数
     * @returns {boolean} - 是否为标签
     */
    isLabel() {
        return this.type === OperandType.LABEL;
    }

    /**
     * 转换为字符串表示
     * @returns {string} - 字符串表示
     */
    toString() {
        switch (this.type) {
            case OperandType.REGISTER:
                return `%${this.value}`;
            case OperandType.IMMEDIATE:
                return `#${this.value}`;
            case OperandType.MEMORY:
                return `[${this.value}]`;
            case OperandType.LABEL:
                return this.value;
            case OperandType.VARIABLE:
                return `$${this.value}`;
            default:
                return this.value.toString();
        }
    }

    /**
     * 克隆操作数
     * @returns {Operand} - 克隆的操作数
     */
    clone() {
        return new Operand(this.type, this.value, this.dataType);
    }
}

/**
 * 指令类
 */
class Instruction {
    constructor(opcode, operands = [], comment = '') {
        this.opcode = opcode;
        this.operands = operands.map(op =>
            op instanceof Operand ? op : this.createOperand(op)
        );
        this.comment = comment;
        this.label = null;
        this.id = Instruction.nextId++;
        this.basicBlock = null;
        this.liveIn = new Set();
        this.liveOut = new Set();
        this.def = new Set();
        this.use = new Set();
        this.metadata = {};
    }

    /**
     * 创建操作数
     * @param {*} operand - 操作数描述
     * @returns {Operand} - 操作数对象
     */
    createOperand(operand) {
        if (typeof operand === 'string') {
            if (operand.startsWith('%')) {
                return new Operand(OperandType.REGISTER, operand.slice(1));
            } else if (operand.startsWith('#')) {
                return new Operand(OperandType.IMMEDIATE, parseInt(operand.slice(1)));
            } else if (operand.startsWith('[') && operand.endsWith(']')) {
                return new Operand(OperandType.MEMORY, operand.slice(1, -1));
            } else {
                return new Operand(OperandType.LABEL, operand);
            }
        } else if (typeof operand === 'number') {
            return new Operand(OperandType.IMMEDIATE, operand);
        } else {
            return new Operand(OperandType.VARIABLE, operand);
        }
    }

    /**
     * 设置标签
     * @param {string} label - 标签名
     */
    setLabel(label) {
        this.label = label;
    }

    /**
     * 获取标签
     * @returns {string|null} - 标签名
     */
    getLabel() {
        return this.label;
    }

    /**
     * 添加操作数
     * @param {*} operand - 操作数
     */
    addOperand(operand) {
        const op = operand instanceof Operand ? operand : this.createOperand(operand);
        this.operands.push(op);
    }

    /**
     * 获取操作数
     * @param {number} index - 操作数索引
     * @returns {Operand|null} - 操作数
     */
    getOperand(index) {
        return this.operands[index] || null;
    }

    /**
     * 设置操作数
     * @param {number} index - 操作数索引
     * @param {*} operand - 新操作数
     */
    setOperand(index, operand) {
        if (index >= 0 && index < this.operands.length) {
            this.operands[index] = operand instanceof Operand ? operand : this.createOperand(operand);
        }
    }

    /**
     * 获取所有操作数
     * @returns {Array<Operand>} - 操作数数组
     */
    getOperands() {
        return this.operands;
    }

    /**
     * 检查是否为分支指令
     * @returns {boolean} - 是否为分支指令
     */
    isBranch() {
        return [OpCode.JUMP, OpCode.BRANCH, OpCode.CALL, OpCode.RET].includes(this.opcode);
    }

    /**
     * 检查是否为算术指令
     * @returns {boolean} - 是否为算术指令
     */
    isArithmetic() {
        return [OpCode.ADD, OpCode.SUB, OpCode.MUL, OpCode.DIV, OpCode.MOD].includes(this.opcode);
    }

    /**
     * 检查是否为内存访问指令
     * @returns {boolean} - 是否为内存访问指令
     */
    isMemoryAccess() {
        return [OpCode.LOAD, OpCode.STORE].includes(this.opcode);
    }

    /**
     * 检查是否为移动指令
     * @returns {boolean} - 是否为移动指令
     */
    isMove() {
        return this.opcode === OpCode.MOVE;
    }

    /**
     * 检查是否为比较指令
     * @returns {boolean} - 是否为比较指令
     */
    isComparison() {
        return [OpCode.EQ, OpCode.NE, OpCode.LT, OpCode.LE, OpCode.GT, OpCode.GE].includes(this.opcode);
    }

    /**
     * 获取定义的寄存器
     * @returns {Set<string>} - 定义的寄存器集合
     */
    getDef() {
        const def = new Set();

        // 根据指令类型确定定义的寄存器
        if (this.isArithmetic() || this.isMove() || this.opcode === OpCode.LOAD) {
            const dest = this.getOperand(0);
            if (dest && dest.isRegister()) {
                def.add(dest.value);
            }
        }

        return def;
    }

    /**
     * 获取使用的寄存器
     * @returns {Set<string>} - 使用的寄存器集合
     */
    getUse() {
        const use = new Set();

        // 根据指令类型确定使用的寄存器
        const startIndex = (this.isArithmetic() || this.isMove() || this.opcode === OpCode.STORE) ? 1 : 0;

        for (let i = startIndex; i < this.operands.length; i++) {
            const operand = this.operands[i];
            if (operand && operand.isRegister()) {
                use.add(operand.value);
            }
        }

        return use;
    }

    /**
     * 设置元数据
     * @param {string} key - 键
     * @param {*} value - 值
     */
    setMetadata(key, value) {
        this.metadata[key] = value;
    }

    /**
     * 获取元数据
     * @param {string} key - 键
     * @returns {*} - 值
     */
    getMetadata(key) {
        return this.metadata[key];
    }

    /**
     * 转换为汇编代码
     * @returns {string} - 汇编代码
     */
    toAssembly() {
        let asm = '';

        // 添加标签
        if (this.label) {
            asm += `${this.label}:\n`;
        }

        // 添加指令
        if (this.opcode !== OpCode.LABEL) {
            asm += `\t${this.opcode}`;

            if (this.operands.length > 0) {
                asm += ` ${this.operands.map(op => op.toString()).join(', ')}`;
            }
        }

        // 添加注释
        if (this.comment) {
            asm += ` ; ${this.comment}`;
        }

        return asm;
    }

    /**
     * 转换为中间代码表示
     * @returns {string} - 中间代码
     */
    toIR() {
        let ir = '';

        if (this.label) {
            ir += `${this.label}:\n`;
        }

        if (this.opcode !== OpCode.LABEL) {
            ir += `  ${this.opcode}`;

            if (this.operands.length > 0) {
                ir += ` ${this.operands.map(op => op.toString()).join(', ')}`;
            }
        }

        return ir;
    }

    /**
     * 克隆指令
     * @returns {Instruction} - 克隆的指令
     */
    clone() {
        const cloned = new Instruction(
            this.opcode,
            this.operands.map(op => op.clone()),
            this.comment
        );

        cloned.label = this.label;
        cloned.metadata = { ...this.metadata };

        return cloned;
    }

    /**
     * 转换为JSON对象
     * @returns {Object} - JSON表示
     */
    toJSON() {
        return {
            id: this.id,
            opcode: this.opcode,
            operands: this.operands.map(op => ({
                type: op.type,
                value: op.value,
                dataType: op.dataType
            })),
            comment: this.comment,
            label: this.label,
            metadata: this.metadata
        };
    }

    /**
     * 转换为字符串表示
     * @returns {string} - 字符串表示
     */
    toString() {
        return this.toIR();
    }
}

// 静态计数器
Instruction.nextId = 1;

/**
 * 创建指令的工厂函数
 */
const InstructionFactory = {
    /**
     * 创建算术指令
     * @param {string} op - 操作符
     * @param {*} dest - 目标操作数
     * @param {*} src1 - 源操作数1
     * @param {*} src2 - 源操作数2
     * @returns {Instruction} - 指令
     */
    createArithmetic(op, dest, src1, src2) {
        return new Instruction(op, [dest, src1, src2]);
    },

    /**
     * 创建移动指令
     * @param {*} dest - 目标操作数
     * @param {*} src - 源操作数
     * @returns {Instruction} - 指令
     */
    createMove(dest, src) {
        return new Instruction(OpCode.MOVE, [dest, src]);
    },

    /**
     * 创建加载指令
     * @param {*} dest - 目标寄存器
     * @param {*} addr - 内存地址
     * @returns {Instruction} - 指令
     */
    createLoad(dest, addr) {
        return new Instruction(OpCode.LOAD, [dest, addr]);
    },

    /**
     * 创建存储指令
     * @param {*} addr - 内存地址
     * @param {*} src - 源寄存器
     * @returns {Instruction} - 指令
     */
    createStore(addr, src) {
        return new Instruction(OpCode.STORE, [addr, src]);
    },

    /**
     * 创建跳转指令
     * @param {string} label - 目标标签
     * @returns {Instruction} - 指令
     */
    createJump(label) {
        return new Instruction(OpCode.JUMP, [label]);
    },

    /**
     * 创建分支指令
     * @param {string} condition - 条件
     * @param {string} label - 目标标签
     * @returns {Instruction} - 指令
     */
    createBranch(condition, label) {
        return new Instruction(OpCode.BRANCH, [condition, label]);
    },

    /**
     * 创建调用指令
     * @param {string} function - 函数名
     * @param {Array} args - 参数列表
     * @returns {Instruction} - 指令
     */
    createCall(func, args = []) {
        return new Instruction(OpCode.CALL, [func, ...args]);
    },

    /**
     * 创建返回指令
     * @param {*} value - 返回值（可选）
     * @returns {Instruction} - 指令
     */
    createReturn(value = null) {
        const operands = value ? [value] : [];
        return new Instruction(OpCode.RET, operands);
    },

    /**
     * 创建标签指令
     * @param {string} label - 标签名
     * @returns {Instruction} - 指令
     */
    createLabel(label) {
        const inst = new Instruction(OpCode.LABEL, []);
        inst.setLabel(label);
        return inst;
    },

    /**
     * 创建注释指令
     * @param {string} comment - 注释内容
     * @returns {Instruction} - 指令
     */
    createComment(comment) {
        return new Instruction(OpCode.COMMENT, [], comment);
    }
};

module.exports = {
    Instruction,
    Operand,
    OpCode,
    OperandType,
    DataType,
    InstructionFactory
};