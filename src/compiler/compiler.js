/**
 * 编译器主模块 - compiler.js
 * @description 集成词法分析、语法分析、语义分析、代码优化和目标代码生成
 *              提供完整的编译流程管理和统一的编译接口
 * @module compiler/compiler
 * @author poboll
 * @date 2025
 * @version 1.0
 * 
 * 主要功能：
 * 1. 集成词法分析器、语法分析器、语义分析器、代码优化器和目标代码生成器
 * 2. 提供统一的编译接口和流程管理
 * 3. 完整的错误处理和报告机制
 * 4. 编译结果统计和性能分析
 * 5. 支持多种编译模式和配置选项
 * 6. 提供编译演示和测试功能
 * 7. 集成日志系统和调试支持
 */

const Lexer = require('./lexer/lexer');
const { Parser } = require('./parser/parser');
const SemanticAnalyzer = require('./semantic/semantic').SemanticAnalyzer;
const Optimizer = require('./optimizer/optimizer');
const CodeGenerator = require('./codegen/codegen');
const { logger } = require('../utils/logger');

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

        this.lexicalAnalyzer = new Lexer();
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
            logger.progress(`开始编译 ${filename}...`);

            // 第一阶段：词法分析
            logger.phase('词法分析', '开始词法分析...');
            const lexicalResult = this.performLexicalAnalysis(sourceCode, result);
            if (!lexicalResult.success) {
                logger.failure('词法分析失败');
                return this.finishCompilation(result, startTime);
            }
            logger.success(`词法分析完成，生成 ${result.tokens.length} 个Token`);

            // 第二阶段：语法分析
            logger.phase('语法分析', '开始语法分析...');
            const syntaxResult = this.performSyntaxAnalysis(result.tokens, result);
            if (!syntaxResult.success) {
                logger.failure('语法分析失败');
                return this.finishCompilation(result, startTime);
            }
            logger.success('语法分析完成，生成AST');

            // 第三阶段：语义分析
            logger.phase('语义分析', '开始语义分析...');
            const semanticResult = this.performSemanticAnalysis(result.ast, result);
            if (!semanticResult.success) {
                logger.failure('语义分析失败');
                return this.finishCompilation(result, startTime);
            }
            logger.success('语义分析完成');

            // 第四阶段：代码优化
            if (this.options.enableOptimization) {
                logger.phase('代码优化', '开始代码优化...');
                const optimizationResult = this.performOptimization(result.ast, result);
                if (!optimizationResult.success) {
                    logger.failure('代码优化失败');
                    return this.finishCompilation(result, startTime);
                }
                logger.success(`代码优化完成，进行了 ${result.statistics.totalOptimizations} 项优化`);
            } else {
                logger.info('跳过代码优化阶段');
                result.optimizedAST = result.ast; // 如果不优化，使用原始AST
            }

            // 第五阶段：目标代码生成
            if (this.options.enableCodeGeneration) {
                logger.phase('目标代码生成', '开始目标代码生成...');
                const codegenResult = this.performCodeGeneration(result.optimizedAST, result);
                if (!codegenResult.success) {
                    logger.failure('目标代码生成失败');
                    return this.finishCompilation(result, startTime);
                }
                logger.success(`目标代码生成完成，生成了 ${result.statistics.instructionCount} 条指令`);
            } else {
                logger.info('跳过目标代码生成阶段');
            }

            // 编译成功
            result.success = true;
            logger.success('编译成功完成!');

        } catch (error) {
            logger.error('编译过程中发生内部错误:', error.message);
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
        logger.info('\n' + '='.repeat(60));
        logger.info('📊 编译摘要');
        logger.info('='.repeat(60));

        // 基本统计
        logger.info(`状态: ${result.success ? '✅ 成功' : '❌ 失败'}`);
        logger.info(`编译时间: ${result.statistics.compilationTime}ms`);
        logger.info(`Token数量: ${result.statistics.tokenCount}`);
        logger.info(`AST节点数量: ${result.statistics.astNodeCount}`);
        logger.info(`符号数量: ${result.statistics.symbolCount}`);

        // 优化统计
        if (this.options.enableOptimization) {
            logger.info(`优化时间: ${result.statistics.optimizationTime}ms`);
            logger.info(`优化次数: ${result.statistics.totalOptimizations}`);
        }

        // 代码生成统计
        if (this.options.enableCodeGeneration && result.targetCode) {
            logger.info(`代码生成时间: ${result.statistics.codegenTime}ms`);
            logger.info(`生成指令数量: ${result.statistics.instructionCount}`);
        }

        logger.info(`错误数量: ${result.statistics.errorCount}`);
        logger.info(`警告数量: ${result.warnings.length}`);

        // 错误详情
        if (result.hasErrors()) {
            logger.error('\n❌ 错误详情:');
            const allErrors = result.getAllErrors();
            allErrors.forEach((errorInfo, index) => {
                const { phase, error } = errorInfo;
                const errorMsg = error.message || (typeof error === 'string' ? error : JSON.stringify(error));
                logger.error(`  ${index + 1}. [${phase.toUpperCase()}] ${errorMsg}`);
            });
        }

        // 警告详情
        if (result.warnings.length > 0) {
            logger.warn('\n⚠️ 警告详情:');
            result.warnings.forEach((warning, index) => {
                logger.warn(`  ${index + 1}. ${warning}`);
            });
        }

        // 目标代码输出
        if (result.success && result.targetCode && this.options.generateDebugInfo) {
            logger.info('\n🎯 生成的目标代码:');
            logger.info('-'.repeat(40));
            logger.info(result.targetCode.assembly);
            logger.info('-'.repeat(40));
        }

        logger.info('='.repeat(60));
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
            author: 'poboll',
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
    logger.info('🎯 编译器集成演示\n');

    const compiler = new Compiler({
        enableOptimization: true,
        enableCodeGeneration: true,
        generateDebugInfo: true
    });

    // 获取命令行参数中的文件名
    const filename = process.argv[2];

    if (!filename) {
        // 没有提供文件名时使用演示代码
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

        logger.info('📝 测试源代码:');
        logger.info(testCode);
        logger.info('\n' + '='.repeat(60));

        // 编译测试代码
        const result = compiler.compile(testCode, 'test.txt');

        if (result.success) {
            logger.success('\n🎉 编译器集成测试成功!');

            if (result.targetCode) {
                logger.info('\n📄 可以将生成的汇编代码保存到文件或在虚拟机中执行。');
            }
        } else {
            logger.failure('\n❌ 编译器集成测试失败!');
        }
    } else {
        // 编译指定的文件
        logger.info(`📝 编译文件: ${filename}\n`);
        const result = compiler.compileFile(filename);

        if (result.success) {
            logger.success('\n🎉 编译成功!');

            if (result.targetCode) {
                logger.info('\n📄 可以将生成的汇编代码保存到文件或在虚拟机中执行。');
            }
        } else {
            logger.failure('\n❌ 编译失败!');
        }
    }
}