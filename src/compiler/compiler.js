/*
 * 编译器主模块 - 集成词法分析、语法分析、语义分析、代码优化和目标代码生成
 * 
 * 功能：
 * 1. 集成词法分析器、语法分析器、语义分析器、代码优化器和目标代码生成器
 * 2. 提供统一的编译接口
 * 3. 错误处理和报告
 * 4. 编译流程管理
 * 
 * 作者：编译系统课程设计
 * 日期：2024
 */

const { Lexer } = require('./lexer/lexer');
const { Parser } = require('./parser/parser');
const { SemanticAnalyzer } = require('./semantic/semantic');
const { Optimizer } = require('./optimizer/optimizer');
const { CodeGenerator } = require('./codegen/codegen');

// 编译结果类
class CompilationResult {
    constructor() {
        this.success = false;
        this.tokens = [];
        this.ast = null;
        this.optimizedAST = null;
        this.symbolTable = null;
        this.targetCode = null;  // 新增：目标代码生成结果
        this.errors = {
            lexical: [],
            syntax: [],
            semantic: [],
            optimization: [],
            codegen: []  // 新增：代码生成错误
        };
        this.warnings = [];
        this.statistics = {
            tokenCount: 0,
            astNodeCount: 0,
            symbolCount: 0,
            errorCount: 0,
            compilationTime: 0,
            optimizationTime: 0,
            totalOptimizations: 0,
            codegenTime: 0,  // 新增：代码生成时间
            instructionCount: 0  // 新增：生成的指令数量
        };
    }

    // 添加错误
    addError(phase, error) {
        if (this.errors[phase]) {
            this.errors[phase].push(error);
        }
    }

    // 添加警告
    addWarning(warning) {
        this.warnings.push(warning);
    }

    // 获取所有错误
    getAllErrors() {
        const allErrors = [];
        Object.keys(this.errors).forEach(phase => {
            this.errors[phase].forEach(error => {
                allErrors.push({ phase, error });
            });
        });
        return allErrors;
    }

    // 检查是否有错误
    hasErrors() {
        return this.getAllErrors().length > 0;
    }

    // 获取错误总数
    getErrorCount() {
        return this.getAllErrors().length;
    }
}

// 编译器主类
class Compiler {
    constructor(options = {}) {
        this.options = {
            enableOptimization: false,
            enableCodeGeneration: true,  // 新增：是否启用代码生成
            generateDebugInfo: true,
            strictMode: true,
            targetMachine: 'stack-vm',  // 新增：目标机类型
            ...options
        };

        this.semanticAnalyzer = new SemanticAnalyzer();
        this.codeGenerator = new CodeGenerator({  // 新增：代码生成器
            targetMachine: this.options.targetMachine,
            optimizeCode: true,
            generateComments: this.options.generateDebugInfo
        });
    }

    // 编译源代码
    compile(sourceCode, filename = 'input.txt') {
        const result = new CompilationResult();
        const startTime = Date.now();

        try {
            console.log(`🚀 开始编译 ${filename}...`);

            // 第一阶段：词法分析
            console.log('📝 阶段1: 词法分析...');
            const lexicalResult = this.performLexicalAnalysis(sourceCode, result);
            if (!lexicalResult.success) {
                console.log('❌ 词法分析失败');
                return this.finishCompilation(result, startTime);
            }
            console.log(`✅ 词法分析完成，生成 ${result.tokens.length} 个Token`);

            // 第二阶段：语法分析
            console.log('🌳 阶段2: 语法分析...');
            const syntaxResult = this.performSyntaxAnalysis(result.tokens, result);
            if (!syntaxResult.success) {
                console.log('❌ 语法分析失败');
                return this.finishCompilation(result, startTime);
            }
            console.log('✅ 语法分析完成，生成AST');

            // 第三阶段：语义分析
            console.log('🔍 阶段3: 语义分析...');
            const semanticResult = this.performSemanticAnalysis(result.ast, result);
            if (!semanticResult.success) {
                console.log('❌ 语义分析失败');
                return this.finishCompilation(result, startTime);
            }
            console.log('✅ 语义分析完成');

            // 第四阶段：代码优化
            if (this.options.enableOptimization) {
                console.log('🔧 阶段4: 代码优化...');
                const optimizationResult = this.performOptimization(result.ast, result);
                if (!optimizationResult.success) {
                    console.log('❌ 代码优化失败');
                    return this.finishCompilation(result, startTime);
                }
                console.log(`✅ 代码优化完成，进行了 ${result.statistics.totalOptimizations} 项优化`);
            } else {
                console.log('⏭️ 跳过代码优化阶段');
                result.optimizedAST = result.ast; // 如果不优化，使用原始AST
            }

            // 第五阶段：目标代码生成
            if (this.options.enableCodeGeneration) {
                console.log('🎯 阶段5: 目标代码生成...');
                const codegenResult = this.performCodeGeneration(result.optimizedAST, result);
                if (!codegenResult.success) {
                    console.log('❌ 目标代码生成失败');
                    return this.finishCompilation(result, startTime);
                }
                console.log(`✅ 目标代码生成完成，生成了 ${result.statistics.instructionCount} 条指令`);
            } else {
                console.log('⏭️ 跳过目标代码生成阶段');
            }

            // 编译成功
            result.success = true;
            console.log('🎉 编译成功完成!');

        } catch (error) {
            console.error('💥 编译过程中发生内部错误:', error.message);
            result.addError('internal', {
                message: `Internal compiler error: ${error.message}`,
                line: 0,
                column: 0
            });
        }

        return this.finishCompilation(result, startTime);
    }

    // 执行词法分析
    performLexicalAnalysis(sourceCode, result) {
        try {
            this.lexicalAnalyzer.setSourceCode(sourceCode);
            const tokens = this.lexicalAnalyzer.tokenize();
            const errors = this.lexicalAnalyzer.getErrors();

            if (errors.length === 0) {
                result.tokens = tokens;
                result.statistics.tokenCount = tokens.length;
                return { success: true };
            } else {
                errors.forEach(error => {
                    result.addError('lexical', error);
                });
                return { success: false };
            }
        } catch (error) {
            result.addError('lexical', {
                message: `Lexical analysis error: ${error.message}`,
                line: 0,
                column: 0
            });
            return { success: false };
        }
    }

    // 执行语法分析
    performSyntaxAnalysis(tokens, result) {
        try {
            const syntaxAnalyzer = new Parser(tokens);
            const ast = syntaxAnalyzer.parse();
            const errors = syntaxAnalyzer.getErrors();

            if (errors.length === 0) {
                result.ast = ast;
                result.statistics.astNodeCount = this.countASTNodes(ast);
                return { success: true };
            } else {
                errors.forEach(error => {
                    result.addError('syntax', error);
                });
                return { success: false };
            }
        } catch (error) {
            result.addError('syntax', {
                message: `Syntax analysis error: ${error.message}`,
                line: 0,
                column: 0
            });
            return { success: false };
        }
    }

    // 执行语义分析
    performSemanticAnalysis(ast, result) {
        try {
            const semanticResult = this.semanticAnalyzer.analyze(ast);

            if (semanticResult.success) {
                result.symbolTable = semanticResult.symbolTable;
                result.statistics.symbolCount = this.countSymbols(semanticResult.symbolTable);
                return { success: true };
            } else {
                semanticResult.errors.forEach(error => {
                    result.addError('semantic', error);
                });
                return { success: false };
            }
        } catch (error) {
            result.addError('semantic', {
                message: `Semantic analysis error: ${error.message}`,
                line: 0,
                column: 0
            });
            return { success: false };
        }
    }

    // 执行代码优化
    performOptimization(ast, result) {
        try {
            const optimizer = new Optimizer({
                enableConstantFolding: true,
                enableAlgebraicSimplification: true,
                enableCommonSubexpressionElimination: true,
                enableDeadCodeElimination: true,
                maxOptimizationPasses: 3,
                generateOptimizationReport: false // 在编译器中不显示详细报告
            });

            const optimizationResult = optimizer.optimize(ast);

            if (optimizationResult.success) {
                result.optimizedAST = optimizationResult.optimizedAST;
                result.statistics.optimizationTime = optimizationResult.statistics.optimizationTime;
                result.statistics.totalOptimizations = optimizationResult.statistics.totalOptimizations;

                // 添加优化警告
                optimizationResult.warnings.forEach(warning => {
                    result.addWarning(`Optimization: ${warning}`);
                });

                return { success: true };
            } else {
                optimizationResult.errors.forEach(error => {
                    result.addError('optimization', error);
                });
                return { success: false };
            }
        } catch (error) {
            result.addError('optimization', {
                message: `Optimization error: ${error.message}`,
                line: 0,
                column: 0
            });
            return { success: false };
        }
    }

    // 执行目标代码生成
    performCodeGeneration(ast, result) {
        try {
            const startTime = Date.now();
            const codegenResult = this.codeGenerator.generate(ast, result.symbolTable);
            const endTime = Date.now();

            if (codegenResult.success) {
                result.targetCode = codegenResult;
                result.statistics.codegenTime = endTime - startTime;
                result.statistics.instructionCount = codegenResult.statistics.instructionCount;

                // 添加代码生成警告
                codegenResult.warnings.forEach(warning => {
                    result.addWarning(`CodeGen: ${warning.message || warning}`);
                });

                return { success: true };
            } else {
                codegenResult.errors.forEach(error => {
                    result.addError('codegen', error);
                });
                return { success: false };
            }
        } catch (error) {
            result.addError('codegen', {
                message: `Code generation error: ${error.message}`,
                line: 0,
                column: 0
            });
            return { success: false };
        }
    }

    // 完成编译
    finishCompilation(result, startTime) {
        const endTime = Date.now();
        result.statistics.compilationTime = endTime - startTime;
        result.statistics.errorCount = result.getErrorCount();

        this.printCompilationSummary(result);
        return result;
    }

    // 计算AST节点数量
    countASTNodes(node) {
        if (!node) return 0;

        let count = 1;

        // 递归计算子节点
        Object.keys(node).forEach(key => {
            const value = node[key];
            if (Array.isArray(value)) {
                value.forEach(item => {
                    if (item && typeof item === 'object' && item.type) {
                        count += this.countASTNodes(item);
                    }
                });
            } else if (value && typeof value === 'object' && value.type) {
                count += this.countASTNodes(value);
            }
        });

        return count;
    }

    // 计算符号数量
    countSymbols(symbolTable) {
        if (!symbolTable || !symbolTable.globalScope) return 0;

        let count = 0;
        const countScope = (scope) => {
            count += scope.symbols.size;
            scope.children.forEach(child => countScope(child));
        };

        countScope(symbolTable.globalScope);
        return count;
    }

    // 打印编译摘要
    printCompilationSummary(result) {
        console.log('\n' + '='.repeat(60));
        console.log('📊 编译摘要');
        console.log('='.repeat(60));

        // 基本统计
        console.log(`状态: ${result.success ? '✅ 成功' : '❌ 失败'}`);
        console.log(`编译时间: ${result.statistics.compilationTime}ms`);
        console.log(`Token数量: ${result.statistics.tokenCount}`);
        console.log(`AST节点数量: ${result.statistics.astNodeCount}`);
        console.log(`符号数量: ${result.statistics.symbolCount}`);

        // 优化统计
        if (this.options.enableOptimization) {
            console.log(`优化时间: ${result.statistics.optimizationTime}ms`);
            console.log(`优化次数: ${result.statistics.totalOptimizations}`);
        }

        // 代码生成统计
        if (this.options.enableCodeGeneration && result.targetCode) {
            console.log(`代码生成时间: ${result.statistics.codegenTime}ms`);
            console.log(`生成指令数量: ${result.statistics.instructionCount}`);
        }

        console.log(`错误数量: ${result.statistics.errorCount}`);
        console.log(`警告数量: ${result.warnings.length}`);

        // 错误详情
        if (result.hasErrors()) {
            console.log('\n❌ 错误详情:');
            const allErrors = result.getAllErrors();
            allErrors.forEach((errorInfo, index) => {
                const { phase, error } = errorInfo;
                const errorMsg = error.message || (typeof error === 'string' ? error : JSON.stringify(error));
                console.log(`  ${index + 1}. [${phase.toUpperCase()}] ${errorMsg}`);
            });
        }

        // 警告详情
        if (result.warnings.length > 0) {
            console.log('\n⚠️ 警告详情:');
            result.warnings.forEach((warning, index) => {
                console.log(`  ${index + 1}. ${warning}`);
            });
        }

        // 目标代码输出
        if (result.success && result.targetCode && this.options.generateDebugInfo) {
            console.log('\n🎯 生成的目标代码:');
            console.log('-'.repeat(40));
            console.log(result.targetCode.assembly);
            console.log('-'.repeat(40));
        }

        console.log('='.repeat(60));
    }

    // 编译文件
    compileFile(filename) {
        const fs = require('fs');
        const path = require('path');

        try {
            if (!fs.existsSync(filename)) {
                throw new Error(`File not found: ${filename}`);
            }

            const sourceCode = fs.readFileSync(filename, 'utf8');
            const baseName = path.basename(filename);

            return this.compile(sourceCode, baseName);
        } catch (error) {
            const result = new CompilationResult();
            result.addError('file', {
                message: `File error: ${error.message}`,
                line: 0,
                column: 0
            });
            return result;
        }
    }

    // 获取编译器版本信息
    getVersion() {
        return {
            version: '1.0.0',
            name: 'Simple Compiler',
            author: '编译系统课程设计',
            features: [
                'Lexical Analysis',
                'Syntax Analysis',
                'Semantic Analysis',
                'Code Optimization',
                'Target Code Generation',  // 新增
                'Symbol Table Management',
                'Type Checking',
                'Scope Management',
                'Error Reporting'
            ]
        };
    }

    // 设置选项
    setOptions(options) {
        this.options = { ...this.options, ...options };

        // 更新代码生成器选项
        if (this.codeGenerator) {
            this.codeGenerator.setOptions({
                targetMachine: this.options.targetMachine,
                optimizeCode: this.options.enableOptimization,
                generateComments: this.options.generateDebugInfo
            });
        }
    }

    // 重置编译器状态
    reset() {
        this.semanticAnalyzer = new SemanticAnalyzer();
        this.codeGenerator.reset();
    }
}

// 导出模块
module.exports = {
    Compiler,
    CompilationResult
};

// 如果直接运行此文件，执行演示
if (require.main === module) {
    console.log('🎯 编译器集成演示\n');

    const compiler = new Compiler({
        enableOptimization: true,
        enableCodeGeneration: true,
        generateDebugInfo: true
    });

    // 演示代码
    const testCode = `
        let x = 10;
        const PI = 3.14;
        
        function add(a, b) {
            return a + b;
        }
        
        x = add(5, 3);
        
        if (x > 0) {
            x = x * 2;
        }
        
        while (x < 100) {
            x = x + 1;
        }
    `;

    console.log('📝 测试源代码:');
    console.log(testCode);
    console.log('\n' + '='.repeat(60));

    // 编译测试代码
    const result = compiler.compile(testCode, 'test.txt');

    if (result.success) {
        console.log('\n🎉 编译器集成测试成功!');

        if (result.targetCode) {
            console.log('\n📄 可以将生成的汇编代码保存到文件或在虚拟机中执行。');
        }
    } else {
        console.log('\n❌ 编译器集成测试失败!');
    }
}