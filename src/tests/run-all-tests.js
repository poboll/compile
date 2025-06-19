/**
 * 编译器测试套件 - 运行所有测试
 * 
 * 功能：
 * 1. 运行所有各组件测试
 * 2. 收集测试结果
 * 3. 生成统一报告
 * 
 * 作者：poboll
 * 日期：2025-06-05
 */

// 配置测试环境日志
require('../utils/test-logger');
const { logger } = require('../utils/logger');

const { runLexerTests } = require('./lexer.test');
const { runParserTests } = require('./parser.test');
const { runSemanticTests } = require('./semantic.test');
const { runOptimizerTests } = require('./optimizer.test');
const { runCodeGenTests } = require('./codegen.test');

// 测试运行器
function runAllTests() {
  logger.info('========================================');
  logger.info('=== 编译器测试套件 - 全部测试开始 ===');
  logger.info('========================================\n');

  const results = {};

  // 运行词法分析器测试
  logger.info('\n=== 词法分析器测试开始 ===');
  try {
    results.lexer = runLexerTests();
    logger.info(`词法分析器测试完成: ${results.lexer.passed}/${results.lexer.total} 通过\n`);
  } catch (error) {
    logger.error('词法分析器测试出错:', error);
    results.lexer = { total: 0, passed: 0, failed: 0, passRate: 0 };
  }

  // 运行语法分析器测试
  logger.info('\n=== 语法分析器测试开始 ===');
  try {
    results.parser = runParserTests();
    logger.info(`语法分析器测试完成: ${results.parser.passed}/${results.parser.total} 通过\n`);
  } catch (error) {
    logger.error('语法分析器测试出错:', error);
    results.parser = { total: 0, passed: 0, failed: 0, passRate: 0 };
  }

  // 运行语义分析器测试
  logger.info('\n=== 语义分析器测试开始 ===');
  try {
    results.semantic = runSemanticTests();
    logger.info(`语义分析器测试完成: ${results.semantic.passed}/${results.semantic.total} 通过\n`);
  } catch (error) {
    logger.error('语义分析器测试出错:', error);
    results.semantic = { total: 0, passed: 0, failed: 0, passRate: 0 };
  }

  // 运行优化器测试
  logger.info('\n=== 代码优化器测试开始 ===');
  try {
    results.optimizer = runOptimizerTests();
    logger.info(`代码优化器测试完成: ${results.optimizer.passed}/${results.optimizer.total} 通过\n`);
  } catch (error) {
    logger.error('代码优化器测试出错:', error);
    results.optimizer = { total: 0, passed: 0, failed: 0, passRate: 0 };
  }

  // 运行代码生成器测试
  logger.info('\n=== 代码生成器测试开始 ===');
  try {
    results.codegen = runCodeGenTests();
    logger.info(`代码生成器测试完成: ${results.codegen.passed}/${results.codegen.total} 通过\n`);
  } catch (error) {
    logger.error('代码生成器测试出错:', error);
    results.codegen = { total: 0, passed: 0, failed: 0, passRate: 0 };
  }

  // 计算总体结果
  const totalTests = Object.values(results).reduce((sum, result) => sum + result.total, 0);
  const passedTests = Object.values(results).reduce((sum, result) => sum + result.passed, 0);
  const failedTests = totalTests - passedTests;
  const overallPassRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : '0.0';

  // 输出总体结果
  logger.info('========================================');
  logger.info('=== 编译器测试套件 - 总体结果 ===');
  logger.info('========================================');
  logger.info(`总测试数: ${totalTests}`);
  logger.info(`通过测试: ${passedTests}`);
  logger.info(`失败测试: ${failedTests}`);
  logger.info(`总通过率: ${overallPassRate}%`);
  logger.info('----------------------------------------');
  logger.info('各组件结果:');
  logger.info(`词法分析器: ${results.lexer.passed}/${results.lexer.total} (${results.lexer.passRate.toFixed(1)}%)`);
  logger.info(`语法分析器: ${results.parser.passed}/${results.parser.total} (${results.parser.passRate.toFixed(1)}%)`);
  logger.info(`语义分析器: ${results.semantic.passed}/${results.semantic.total} (${results.semantic.passRate.toFixed(1)}%)`);
  logger.info(`代码优化器: ${results.optimizer.passed}/${results.optimizer.total} (${results.optimizer.passRate.toFixed(1)}%)`);
  logger.info(`代码生成器: ${results.codegen.passed}/${results.codegen.total} (${results.codegen.passRate.toFixed(1)}%)`);
  logger.info('========================================');

  if (failedTests === 0) {
    logger.success('🎉 太棒了！所有测试全部通过！');
  } else {
    logger.warn(`⚠️  注意: 有 ${failedTests} 个测试未通过，请检查具体错误。`);
  }

  return {
    allPassed: failedTests === 0,
    results: results,
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      passRate: parseFloat(overallPassRate)
    }
  };
}

// 如果直接运行此文件，执行所有测试
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests };