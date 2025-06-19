# 代码优化器测试工具

本目录包含代码优化器的独立测试工具，用于验证和调试代码优化功能。

## 📁 文件结构

### 核心文件
- `optimizer.js` - 代码优化器主模块
- `constant-folder.js` - 常量折叠优化
- `dead-code-eliminator.js` - 死代码消除

### 测试工具
- `run-optimizer.js` - 完整的代码优化测试套件
- `test-single-optimizer.js` - 单个代码片段快速测试
- `README.md` - 本文档

## 🚀 使用方法

### 运行完整测试套件

```bash
# 运行所有预定义测试用例
node run-optimizer.js

# 优化自定义代码
node run-optimizer.js "let x = 2 + 3; if (true) { console.log(x); }"
```

### 快速测试单个代码片段

```bash
# 使用默认测试代码
node test-single-optimizer.js

# 优化指定代码
node test-single-optimizer.js "const result = 10 * 5 + 2;"

# 显示帮助信息
node test-single-optimizer.js --help
```

## 📊 输出格式

### 优化前后AST对比
```
=== 优化前 AST ===
Program
├── VariableDeclaration (let)
│   └── VariableDeclarator
│       ├── Identifier: x
│       └── BinaryExpression (+)
│           ├── Literal: 2
│           └── Literal: 3
└── ExpressionStatement
    └── CallExpression
        ├── MemberExpression
        │   ├── Identifier: console
        │   └── Identifier: log
        └── Identifier: x

=== 优化后 AST ===
Program
├── VariableDeclaration (let)
│   └── VariableDeclarator
│       ├── Identifier: x
│       └── Literal: 5
└── ExpressionStatement
    └── CallExpression
        ├── MemberExpression
        │   ├── Identifier: console
        │   └── Identifier: log
        └── Identifier: x
```

### 优化统计信息
```
=== 优化统计 ===
优化前节点数: 12
优化后节点数: 10
节点减少: 2 (16.67%)
常量折叠次数: 1
死代码消除: 0
表达式简化: 1
优化耗时: 3ms
优化级别: 标准
```

### 优化详情
```
✅ 应用的优化:
  1. 常量折叠: 2 + 3 → 5
  2. 表达式简化: true && x → x
  3. 死代码消除: 移除不可达代码块

⚠️ 跳过的优化:
  1. 循环展开: 循环次数不确定
  2. 内联函数: 函数体过大
```

## 🧪 测试用例

### 常量折叠测试
1. **算术常量折叠** - 测试数值运算的编译时计算
2. **逻辑常量折叠** - 测试布尔表达式的简化
3. **字符串常量折叠** - 测试字符串连接的优化

### 死代码消除测试
4. **不可达代码消除** - 移除永远不会执行的代码
5. **未使用变量消除** - 移除声明但未使用的变量

### 表达式简化测试
6. **表达式简化** - 简化复杂的布尔和算术表达式
7. **复合优化** - 测试多种优化技术的组合应用
8. **循环优化** - 测试循环相关的优化

## 🔧 支持的优化技术

### 常量折叠 (Constant Folding)
- ✅ 算术表达式: `2 + 3` → `5`
- ✅ 逻辑表达式: `true && false` → `false`
- ✅ 字符串连接: `"hello" + " world"` → `"hello world"`
- ✅ 比较表达式: `5 > 3` → `true`
- ✅ 一元表达式: `!true` → `false`

### 死代码消除 (Dead Code Elimination)
- ✅ 不可达代码: `if (false) { ... }`
- ✅ 未使用变量: `let unused = 10;`
- ✅ 未使用函数: `function unused() { ... }`
- ✅ 死循环后的代码: `while(true) { ... } // 后续代码`
- ✅ 无效赋值: `x = x;`

### 表达式简化 (Expression Simplification)
- ✅ 恒等操作: `x + 0` → `x`, `x * 1` → `x`
- ✅ 吸收操作: `x * 0` → `0`, `x && false` → `false`
- ✅ 幂等操作: `x || x` → `x`, `x && x` → `x`
- ✅ 德摩根定律: `!(a && b)` → `!a || !b`
- ✅ 双重否定: `!!x` → `x`

### 控制流优化
- ✅ 条件简化: `if (true)` → 直接执行
- ✅ 循环展开: 小循环的展开
- ✅ 跳转优化: 消除不必要的跳转
- ✅ 分支合并: 合并相同的分支

## ⚡ 性能信息

- **平均优化时间**: 1-15ms（取决于代码复杂度）
- **内存使用**: 中等，会创建新的AST节点
- **优化效果**: 通常可减少10-30%的节点数
- **安全性**: 保证语义等价性

## 🛠️ 自定义优化规则

### 添加新的优化测试用例

在 `run-optimizer.js` 中的 `testCases` 数组添加新测试：

```javascript
{
    name: '自定义优化测试',
    code: `
// 你的测试代码
let x = 10 + 20;
if (x > 0) {
    console.log("positive");
}
`
}
```

### 实现自定义优化器

在 `optimizer.js` 中添加新的优化方法：

```javascript
CustomOptimization(node) {
    // 自定义优化逻辑
    if (this.canOptimize(node)) {
        return this.createOptimizedNode(node);
    }
    return node;
}
```

### 扩展常量折叠

在 `constant-folder.js` 中添加新的折叠规则：

```javascript
foldCustomExpression(node) {
    if (node.operator === 'custom_op') {
        const left = this.evaluate(node.left);
        const right = this.evaluate(node.right);
        if (left !== null && right !== null) {
            return this.createLiteral(customOperation(left, right));
        }
    }
    return null;
}
```

## 🔍 优化级别配置

### 基础优化 (Level 1)
```javascript
const optimizer = new Optimizer(ast, {
    level: 1,
    constantFolding: true,
    deadCodeElimination: false,
    expressionSimplification: false
});
```

### 标准优化 (Level 2)
```javascript
const optimizer = new Optimizer(ast, {
    level: 2,
    constantFolding: true,
    deadCodeElimination: true,
    expressionSimplification: true,
    loopOptimization: false
});
```

### 激进优化 (Level 3)
```javascript
const optimizer = new Optimizer(ast, {
    level: 3,
    constantFolding: true,
    deadCodeElimination: true,
    expressionSimplification: true,
    loopOptimization: true,
    inlining: true
});
```

## 🐛 故障排除

### 常见问题

1. **优化后代码行为改变**
   - 检查优化规则是否保持语义等价
   - 验证副作用处理是否正确

2. **优化效果不明显**
   - 尝试更高的优化级别
   - 检查代码是否已经是最优形式

3. **优化时间过长**
   - 降低优化级别
   - 检查是否存在无限递归优化

### 调试技巧

1. **启用优化日志**
   ```javascript
   const optimizer = new Optimizer(ast, {
       debug: true,
       onOptimization: (type, before, after) => {
           console.log(`${type}: ${before} → ${after}`);
       }
   });
   ```

2. **比较优化前后**
   ```bash
   node test-single-optimizer.js "let x = 2 + 3;" > before.txt
   # 修改优化规则后
   node test-single-optimizer.js "let x = 2 + 3;" > after.txt
   diff before.txt after.txt
   ```

3. **分步优化**
   ```javascript
   // 只应用常量折叠
   const step1 = new ConstantFolder().fold(ast);
   // 再应用死代码消除
   const step2 = new DeadCodeEliminator().eliminate(step1);
   ```

## 📈 性能分析

### 优化效果测量

```javascript
const { performOptimization } = require('./run-optimizer');

function measureOptimization(code) {
    const result = performOptimization(code, 'performance-test');
    
    console.log(`节点减少: ${result.nodeReduction}%`);
    console.log(`优化时间: ${result.optimizationTime}ms`);
    console.log(`应用的优化: ${result.appliedOptimizations.length}`);
    
    return result;
}
```

### 批量性能测试

```bash
# 测试多个文件的优化效果
for file in test-cases/*.js; do
    echo "Testing $file"
    node run-optimizer.js "$(cat $file)"
done
```

## 🔬 高级功能

### 自定义优化通道

```javascript
class CustomOptimizationPass {
    constructor() {
        this.name = 'custom-pass';
    }
    
    optimize(node) {
        // 实现自定义优化逻辑
        return optimizedNode;
    }
}

// 注册自定义通道
optimizer.addPass(new CustomOptimizationPass());
```

### 条件优化

```javascript
const optimizer = new Optimizer(ast, {
    conditionalOptimizations: {
        // 只在生产环境应用激进优化
        aggressiveInlining: process.env.NODE_ENV === 'production',
        // 只在代码大小超过阈值时应用压缩
        compression: ast.nodeCount > 1000
    }
});
```

### 优化统计收集

```javascript
const stats = new OptimizationStats();
const optimizer = new Optimizer(ast, {
    onOptimization: (type, details) => stats.record(type, details)
});

// 生成优化报告
stats.generateReport('optimization-report.json');
```

## 📚 相关文档

- [词法分析器文档](../lexer/README.md)
- [语法分析器文档](../parser/README.md)
- [语义分析器文档](../semantic/README.md)
- [代码生成器文档](../codegen/README.md)

## 🤝 贡献指南

1. 添加新优化规则时，请确保包含相应的测试用例
2. 优化必须保持语义等价性，不能改变程序行为
3. 提交前请运行性能测试确保没有性能回归
4. 新的优化技术请添加详细的文档说明
5. 考虑优化的适用场景和限制条件

---

💡 **提示**: 代码优化是提高程序性能的重要手段。通过这些测试工具，你可以验证优化的正确性和效果，并开发新的优化技术。记住，优化的目标是在保持程序正确性的前提下提高执行效率。