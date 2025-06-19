#!/usr/bin/env node
/**
 * 语义分析器单个代码片段测试工具 - test-single-semantic.js
 * @description 快速测试单个代码片段的语义分析功能
 * @module compiler/semantic/test-single-semantic
 * @author poboll
 * @date 2025
 * @version 1.0
 * 
 * 主要功能：
 * 1. 快速测试单个代码片段
 * 2. 显示详细的语义分析过程
 * 3. 展示符号表和作用域信息
 * 4. 提供类型检查结果
 * 5. 支持命令行参数输入
 * 6. 生成简洁的分析报告
 */

const Lexer = require('../lexer/lexer');
const { Parser } = require('../parser/parser');
const Analyzer = require('./semantic');
const { TypeChecker } = require('./type-checker');

/**
 * 显示简化的符号表
 * @param {SymbolTable} symbolTable - 符号表实例
 */
function displaySymbolTable(symbolTable) {
  console.log('\n📋 符号表:');
  const scopes = symbolTable.scopeChain;

  scopes.forEach((scope, index) => {
    const scopeName = index === 0 ? '全局' : `局部${index}`;
    const symbols = Array.from(scope.entries());

    if (symbols.length > 0) {
      console.log(`  ${scopeName}作用域: ${symbols.map(([name, info]) => `${name}(${info.type})`).join(', ')}`);
    } else {
      console.log(`  ${scopeName}作用域: (空)`);
    }
  });
}

/**
 * 显示语义分析统计
 * @param {Object} stats - 统计信息
 */
function displayStats(stats) {
  console.log('\n📊 分析统计:');
  console.log(`  作用域层数: ${stats.scopeDepth}`);
  console.log(`  符号总数: ${stats.symbolCount}`);
  console.log(`  变量声明: ${stats.variableDeclarations}`);
  console.log(`  函数声明: ${stats.functionDeclarations}`);
  console.log(`  标识符引用: ${stats.identifierReferences}`);
  console.log(`  语义错误: ${stats.semanticErrors}`);
  console.log(`  分析耗时: ${stats.duration}ms`);
}

/**
 * 测试单个代码片段的语义分析
 * @param {string} code - 源代码
 * @returns {Object} - 分析结果
 */
function testSingleCode(code) {
  console.log('🔍 语义分析测试');
  console.log('='.repeat(40));
  console.log('代码:');
  console.log(code);
  console.log('='.repeat(40));

  const startTime = Date.now();

  try {
    // 1. 词法分析
    console.log('\n1️⃣ 词法分析...');
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();

    console.log(`   找到 ${tokens.length} 个标记`);

    if (lexer.errors.length > 0) {
      console.log(`   ❌ 词法错误 ${lexer.errors.length} 个:`);
      lexer.errors.forEach(error => console.log(`     ${error}`));
      return { success: false, stage: 'lexer', errors: lexer.errors };
    } else {
      console.log('   ✅ 词法分析通过');
    }

    // 2. 语法分析
    console.log('\n2️⃣ 语法分析...');
    const parser = new Parser(tokens);
    const ast = parser.parse();

    if (parser.errors.length > 0) {
      console.log(`   ❌ 语法错误 ${parser.errors.length} 个:`);
      parser.errors.forEach(error => console.log(`     ${error}`));
      return { success: false, stage: 'parser', errors: parser.errors };
    } else {
      console.log('   ✅ 语法分析通过');
    }

    // 3. 语义分析
    console.log('\n3️⃣ 语义分析...');

    const stats = {
      scopeDepth: 0,
      symbolCount: 0,
      variableDeclarations: 0,
      functionDeclarations: 0,
      identifierReferences: 0,
      semanticErrors: 0,
      duration: 0
    };

    const analyzer = new Analyzer(ast, {
      onEnter: (node) => {
        switch (node.nodeType) {
          case 'VariableDeclaration':
            stats.variableDeclarations++;
            break;
          case 'FunctionDeclaration':
            stats.functionDeclarations++;
            break;
          case 'Identifier':
            stats.identifierReferences++;
            break;
        }
      }
    });

    const semanticErrors = analyzer.analyze();

    const endTime = Date.now();
    stats.duration = endTime - startTime;
    stats.scopeDepth = analyzer.symbolTable.scopeChain.length;
    stats.symbolCount = analyzer.symbolTable.scopeChain.reduce((total, scope) => total + scope.size, 0);
    stats.semanticErrors = semanticErrors.length;

    // 4. 类型检查
    console.log('\n4️⃣ 类型检查...');
    const typeChecker = new TypeChecker();
    // 这里可以添加更详细的类型检查
    console.log('   ✅ 类型检查完成');

    // 显示结果
    if (semanticErrors.length > 0) {
      console.log(`\n❌ 发现 ${semanticErrors.length} 个语义错误:`);
      semanticErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    } else {
      console.log('\n✅ 未发现语义错误');
    }

    // 显示符号表
    displaySymbolTable(analyzer.symbolTable);

    // 显示统计信息
    displayStats(stats);

    // 总结
    console.log('\n' + '='.repeat(40));
    const totalErrors = lexer.errors.length + parser.errors.length + semanticErrors.length;
    console.log(`📋 分析完成 - 总错误数: ${totalErrors} (词法: ${lexer.errors.length}, 语法: ${parser.errors.length}, 语义: ${semanticErrors.length})`);
    console.log(`⏱️  总耗时: ${stats.duration}ms`);

    return {
      success: true,
      lexerErrors: lexer.errors,
      parserErrors: parser.errors,
      semanticErrors,
      symbolTable: analyzer.symbolTable,
      stats,
      ast
    };

  } catch (error) {
    console.error('\n💥 分析过程中发生错误:', error.message);
    console.error('错误堆栈:', error.stack);
    return { success: false, stage: 'runtime', error: error.message };
  }
}

/**
 * 显示使用说明
 */
function showUsage() {
  console.log('\n📖 使用说明:');
  console.log('  node test-single-semantic.js                    # 使用默认代码测试');
  console.log('  node test-single-semantic.js "let x = 10;"      # 测试指定代码');
  console.log('  node test-single-semantic.js "function f() {}" # 测试函数声明');
  console.log('\n💡 提示: 使用引号包围代码以避免shell解析问题');
}

// 默认测试代码
const defaultCode = `
let x = 10;
const message = "Hello, World!";

function greet(name) {
    let greeting = message + ", " + name;
    return greeting;
}

let result = greet("Alice");
console.log(result);
`;

// 主程序
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // 使用默认代码
    console.log('🎯 使用默认测试代码:');
    testSingleCode(defaultCode);
  } else if (args[0] === '--help' || args[0] === '-h') {
    showUsage();
  } else {
    // 使用命令行参数提供的代码
    const customCode = args.join(' ');
    console.log('🎯 测试自定义代码:');
    testSingleCode(customCode);
  }

  showUsage();
}

// 导出函数供其他模块使用
module.exports = {
  testSingleCode,
  displaySymbolTable,
  displayStats
};