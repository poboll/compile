/**
 * 简化测试运行器
 * 
 * 功能：
 * 1. 运行基本测试验证
 * 2. 生成简单测试报告
 * 
 * 作者：poboll
 * 日期：2024
 */

const fs = require('fs');
const path = require('path');

// 简单测试结果统计
class TestResults {
    constructor() {
        this.total = 0;
        this.passed = 0;
        this.failed = 0;
        this.errors = [];
    }

    addTest(name, success, error = null) {
        this.total++;
        if (success) {
            this.passed++;
            console.log(`✅ ${name}`);
        } else {
            this.failed++;
            console.log(`❌ ${name}: ${error}`);
            this.errors.push({ name, error });
        }
    }

    getReport() {
        const passRate = this.total > 0 ? (this.passed / this.total * 100).toFixed(1) : '0.0';
        return {
            total: this.total,
            passed: this.passed,
            failed: this.failed,
            passRate,
            errors: this.errors
        };
    }
}

// 测试各个模块的基本功能
function testModules() {
    console.log('🚀 开始运行编译系统基本功能测试\n');
    console.log('='.repeat(60));

    const results = new TestResults();

    // 1. 测试词法分析器
    console.log('\n📝 测试词法分析器...');
    try {
        const { Lexer } = require('../compiler/lexer/lexer');
        const lexer = new Lexer('let x = 10;');
        const tokens = lexer.tokenize();

        results.addTest('词法分析器 - 基本分词', tokens && tokens.length > 0);
        results.addTest('词法分析器 - Token类型识别',
            tokens.some(t => t.type === 'KEYWORD') &&
            tokens.some(t => t.type === 'IDENTIFIER') &&
            tokens.some(t => t.type === 'NUMBER')
        );
    } catch (error) {
        results.addTest('词法分析器 - 模块加载', false, error.message);
    }

    // 2. 测试语法分析器
    console.log('\n🌳 测试语法分析器...');
    try {
        const { Parser } = require('../compiler/parser/parser');
        const { Lexer } = require('../compiler/lexer/lexer');

        const lexer = new Lexer('let x = 10;');
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        const ast = parser.parse();

        results.addTest('语法分析器 - AST生成', ast && ast.nodeType === 'Program');
        results.addTest('语法分析器 - 变量声明解析',
            ast.body && ast.body.length > 0 && ast.body[0].nodeType === 'VariableDeclaration'
        );
    } catch (error) {
        results.addTest('语法分析器 - 模块加载', false, error.message);
    }

    // 3. 测试语义分析器
    console.log('\n🔍 测试语义分析器...');
    try {
        const { SemanticAnalyzer } = require('../compiler/semantic/semantic');
        const analyzer = new SemanticAnalyzer();

        // 创建简单的AST进行测试
        const simpleAST = {
            type: 'Program',
            body: [{
                type: 'VariableDeclaration',
                declarations: [{
                    id: { name: 'x', type: 'Identifier' },
                    init: { type: 'Literal', value: 10 }
                }]
            }]
        };

        const result = analyzer.analyze(simpleAST);
        results.addTest('语义分析器 - 基本分析', result && typeof result.success === 'boolean');
        results.addTest('语义分析器 - 符号表生成', result.symbolTable && result.symbolTable.symbols);
    } catch (error) {
        results.addTest('语义分析器 - 模块加载', false, error.message);
    }

    // 4. 测试代码优化器
    console.log('\n⚡ 测试代码优化器...');
    try {
        const { Optimizer } = require('../compiler/optimizer/optimizer');
        const optimizer = new Optimizer();

        // 创建简单的AST进行测试
        const simpleAST = {
            type: 'Program',
            body: [{
                type: 'BinaryExpression',
                operator: '+',
                left: { type: 'Literal', value: 1 },
                right: { type: 'Literal', value: 2 }
            }]
        };

        const optimized = optimizer.optimize(simpleAST);
        results.addTest('代码优化器 - 基本优化', optimized && optimized.success);
    } catch (error) {
        results.addTest('代码优化器 - 模块加载', false, error.message);
    }

    // 5. 测试目标代码生成器
    console.log('\n🎯 测试目标代码生成器...');
    try {
        const { CodeGenerator } = require('../compiler/codegen/codegen');
        const generator = new CodeGenerator();

        // 创建简单的AST进行测试
        const simpleAST = {
            type: 'Program',
            body: [{
                type: 'VariableDeclaration',
                declarations: [{
                    id: { name: 'x', type: 'Identifier' },
                    init: { type: 'Literal', value: 10 }
                }]
            }]
        };

        const code = generator.generate(simpleAST);
        results.addTest('目标代码生成器 - 代码生成', code && code.success);
    } catch (error) {
        results.addTest('目标代码生成器 - 模块加载', false, error.message);
    }

    // 生成测试报告
    console.log('\n' + '='.repeat(60));
    console.log('📊 编译系统基本功能测试报告');
    console.log('='.repeat(60));

    const report = results.getReport();
    console.log(`\n📈 总体统计:`);
    console.log(`总测试数: ${report.total}`);
    console.log(`✅ 通过测试: ${report.passed}`);
    console.log(`❌ 失败测试: ${report.failed}`);
    console.log(`📊 通过率: ${report.passRate}%`);

    if (report.errors.length > 0) {
        console.log('\n❌ 失败详情:');
        report.errors.forEach(error => {
            console.log(`  - ${error.name}: ${error.error}`);
        });
    }

    console.log('\n' + '='.repeat(60));

    if (report.passed === report.total) {
        console.log('🎉 所有基本功能测试通过！编译系统核心模块运行正常。');
    } else {
        console.log('⚠️ 部分测试失败，请检查相关模块的实现。');
    }

    return report;
}

// 如果直接运行此文件
if (require.main === module) {
    testModules();
}

module.exports = {
    testModules,
    TestResults
};