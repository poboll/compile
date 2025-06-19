# 代码生成器测试工具

本目录包含代码生成器的独立测试工具，用于验证和调试目标代码生成功能。

## 📁 文件结构

### 核心文件
- `codegen.js` - 代码生成器主模块
- `instruction.js` - 指令定义和操作码
- `target-machine.js` - 目标机器抽象

### 测试工具
- `run-codegen.js` - 完整的代码生成测试套件
- `test-single-codegen.js` - 单个代码片段快速测试
- `README.md` - 本文档

## 🚀 使用方法

### 运行完整测试套件

```bash
# 运行所有预定义测试用例
node run-codegen.js

# 生成自定义代码
node run-codegen.js "function add(a, b) { return a + b; }"
```

### 快速测试单个代码片段

```bash
# 使用默认测试代码
node test-single-codegen.js

# 生成指定代码
node test-single-codegen.js "let x = 10; console.log(x);"

# 显示帮助信息
node test-single-codegen.js --help
```

## 📊 输出格式

### 生成的目标代码
```
=== 生成的目标代码 ===

// 函数: add
function add(a, b) {
    // 参数加载
    LOAD R1, a
    LOAD R2, b
    
    // 执行加法
    ADD R3, R1, R2
    
    // 返回结果
    RETURN R3
}

// 主程序
main:
    // 变量声明: x
    CONST R1, 10
    STORE x, R1
    
    // 函数调用: console.log
    LOAD R2, x
    CALL console.log, R2
    
    // 程序结束
    HALT
```

### 代码生成统计
```
=== 代码生成统计 ===
生成代码行数: 15
生成代码大小: 342 字节
指令数量: 8
寄存器使用: 3
内存分配: 1 变量
函数定义: 1
代码复杂度: 低
生成耗时: 2ms
目标平台: x86_64
```

### 代码分析
```
=== 代码分析 ===

📊 指令分布:
  - LOAD: 3 (37.5%)
  - STORE: 1 (12.5%)
  - ADD: 1 (12.5%)
  - CALL: 1 (12.5%)
  - RETURN: 1 (12.5%)
  - HALT: 1 (12.5%)

🔧 关键字使用:
  - function: 1
  - return: 1
  - let: 1
  - console: 1

⚡ 性能特征:
  - 循环嵌套深度: 0
  - 条件分支数: 0
  - 函数调用深度: 1
  - 内存访问次数: 4
```

## 🧪 测试用例

### 基本功能测试
1. **基本变量声明** - 测试let、const、var的代码生成
2. **函数声明和调用** - 测试函数定义、参数传递和返回值
3. **控制流语句** - 测试if、while、for等控制结构

### 表达式测试
4. **复杂表达式** - 测试算术、逻辑和比较表达式
5. **嵌套结构** - 测试嵌套函数和作用域
6. **赋值操作** - 测试各种赋值操作的代码生成

### 高级功能测试
7. **混合语言特性** - 测试多种语言特性的组合
8. **优化代码生成** - 测试优化后代码的生成效果

## 🎯 支持的目标平台

### x86_64 架构
- ✅ 寄存器分配: RAX, RBX, RCX, RDX, RSI, RDI
- ✅ 内存寻址: 直接、间接、基址+偏移
- ✅ 指令集: MOV, ADD, SUB, MUL, DIV, CMP, JMP
- ✅ 调用约定: System V ABI
- ✅ 栈管理: 自动栈帧管理

### ARM64 架构
- ✅ 寄存器分配: X0-X30, W0-W30
- ✅ 内存寻址: 基址、偏移、预/后索引
- ✅ 指令集: ADD, SUB, MUL, LDR, STR, B, BL
- ✅ 调用约定: AAPCS64
- ✅ 条件执行: 条件码支持

### 虚拟机字节码
- ✅ 栈式虚拟机: 操作数栈管理
- ✅ 指令集: LOAD, STORE, ADD, CALL, RETURN
- ✅ 类型系统: 动态类型支持
- ✅ 垃圾回收: GC友好的代码生成

## 🔧 代码生成特性

### 寄存器分配
- ✅ 线性扫描算法
- ✅ 寄存器溢出处理
- ✅ 生命周期分析
- ✅ 寄存器重用优化
- ✅ 调用者/被调用者保存

### 指令选择
- ✅ 模式匹配
- ✅ 指令融合
- ✅ 地址模式优化
- ✅ 常量传播
- ✅ 强度削减

### 代码布局
- ✅ 基本块排序
- ✅ 分支预测优化
- ✅ 代码对齐
- ✅ 热点代码聚集
- ✅ 跳转优化

### 调试信息
- ✅ 行号映射
- ✅ 变量位置信息
- ✅ 符号表生成
- ✅ DWARF格式支持
- ✅ 源码关联

## ⚡ 性能信息

- **平均生成时间**: 1-20ms（取决于代码复杂度）
- **内存使用**: 中等，需要存储指令序列
- **生成代码质量**: 接近手写汇编的80-90%
- **支持优化**: 窥孔优化、指令调度

## 🛠️ 自定义代码生成

### 添加新的测试用例

在 `run-codegen.js` 中的 `testCases` 数组添加新测试：

```javascript
{
    name: '自定义代码生成测试',
    code: `
// 你的测试代码
function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n-1) + fibonacci(n-2);
}
`
}
```

### 实现自定义指令

在 `instruction.js` 中添加新指令：

```javascript
const CustomInstructions = {
    CUSTOM_OP: 'CUSTOM_OP',
    VECTOR_ADD: 'VECTOR_ADD',
    ATOMIC_CAS: 'ATOMIC_CAS'
};

class CustomInstruction extends Instruction {
    constructor(opcode, operands) {
        super(opcode, operands);
        this.cycles = this.calculateCycles();
    }
}
```

### 扩展目标机器

在 `target-machine.js` 中添加新架构：

```javascript
class CustomTargetMachine extends TargetMachine {
    constructor() {
        super('custom-arch', {
            wordSize: 64,
            registers: ['R0', 'R1', 'R2', 'R3'],
            addressingModes: ['direct', 'indirect']
        });
    }
    
    generateInstruction(node) {
        // 自定义指令生成逻辑
        return new CustomInstruction(opcode, operands);
    }
}
```

## 🔍 代码生成配置

### 基础配置
```javascript
const generator = new CodeGenerator(ast, {
    target: 'x86_64',
    optimizationLevel: 1,
    debugInfo: false,
    registerAllocation: 'linear-scan'
});
```

### 优化配置
```javascript
const generator = new CodeGenerator(ast, {
    target: 'x86_64',
    optimizationLevel: 2,
    debugInfo: true,
    registerAllocation: 'graph-coloring',
    instructionScheduling: true,
    peepholeOptimization: true
});
```

### 调试配置
```javascript
const generator = new CodeGenerator(ast, {
    target: 'x86_64',
    optimizationLevel: 0,
    debugInfo: true,
    preserveComments: true,
    verboseOutput: true,
    generateAssembly: true
});
```

## 🐛 故障排除

### 常见问题

1. **生成的代码无法运行**
   - 检查目标平台是否正确
   - 验证寄存器分配是否有冲突
   - 确认调用约定是否正确

2. **性能不如预期**
   - 提高优化级别
   - 检查是否启用了指令调度
   - 分析寄存器使用效率

3. **代码大小过大**
   - 启用窥孔优化
   - 检查是否有冗余指令
   - 考虑使用更紧凑的指令

### 调试技巧

1. **启用详细输出**
   ```javascript
   const generator = new CodeGenerator(ast, {
       verbose: true,
       onInstruction: (inst) => console.log('生成:', inst),
       onRegisterAlloc: (reg, var) => console.log(`${var} → ${reg}`)
   });
   ```

2. **分析生成的汇编**
   ```bash
   node test-single-codegen.js "let x = 10;" | grep -A 10 "=== 生成的目标代码 ==="
   ```

3. **比较不同优化级别**
   ```bash
   # 无优化
   node test-single-codegen.js "function test() { return 42; }"
   # 有优化（需要修改配置）
   node test-single-codegen.js "function test() { return 42; }"
   ```

## 📈 性能分析

### 代码质量测量

```javascript
const { performCodeGeneration } = require('./run-codegen');

function analyzeCodeQuality(code) {
    const result = performCodeGeneration(code, 'quality-test');
    
    console.log(`指令数量: ${result.instructionCount}`);
    console.log(`寄存器使用: ${result.registerUsage}`);
    console.log(`内存访问: ${result.memoryAccesses}`);
    console.log(`代码大小: ${result.codeSize} 字节`);
    
    return result;
}
```

### 性能基准测试

```bash
# 测试不同代码模式的生成效率
for pattern in arithmetic loops functions recursion; do
    echo "Testing $pattern"
    time node run-codegen.js "$(cat test-patterns/$pattern.js)"
done
```

## 🔬 高级功能

### 自定义代码生成器

```javascript
class CustomCodeGenerator extends CodeGenerator {
    constructor(ast, options) {
        super(ast, options);
        this.customPasses = [];
    }
    
    addCustomPass(pass) {
        this.customPasses.push(pass);
    }
    
    generate() {
        let code = super.generate();
        
        // 应用自定义处理
        for (const pass of this.customPasses) {
            code = pass.transform(code);
        }
        
        return code;
    }
}
```

### 多目标代码生成

```javascript
const targets = ['x86_64', 'arm64', 'wasm'];
const results = {};

for (const target of targets) {
    const generator = new CodeGenerator(ast, { target });
    results[target] = generator.generate();
}

// 比较不同目标的代码
console.log('代码大小比较:');
for (const [target, code] of Object.entries(results)) {
    console.log(`${target}: ${code.length} 字节`);
}
```

### 增量代码生成

```javascript
class IncrementalCodeGenerator {
    constructor() {
        this.cache = new Map();
        this.dependencies = new Map();
    }
    
    generateIncremental(ast, changedNodes) {
        // 只重新生成受影响的部分
        const affectedFunctions = this.findAffectedFunctions(changedNodes);
        
        for (const func of affectedFunctions) {
            this.regenerateFunction(func);
        }
        
        return this.assembleCode();
    }
}
```

## 📚 相关文档

- [词法分析器文档](../lexer/README.md)
- [语法分析器文档](../parser/README.md)
- [语义分析器文档](../semantic/README.md)
- [代码优化器文档](../optimizer/README.md)

## 🤝 贡献指南

1. 添加新目标平台时，请确保包含完整的指令集支持
2. 新的优化技术需要验证正确性和性能提升
3. 提交前请运行所有目标平台的测试
4. 新功能请添加相应的性能基准测试
5. 考虑代码生成的可移植性和可维护性

---

💡 **提示**: 代码生成是编译器的最后阶段，它将高级语言转换为可执行的机器代码。通过这些测试工具，你可以验证代码生成的正确性和效率，并开发针对特定平台的优化技术。记住，好的代码生成器应该在代码质量和编译速度之间找到平衡。