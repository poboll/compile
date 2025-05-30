/**
 * 综合测试运行器
 * 
 * 功能：
 * 1. 运行所有模块的测试
 * 2. 生成测试报告
 * 3. 统计测试覆盖率
 * 4. 性能分析
 * 
 * 作者：编译系统课程设计
 * 日期：2024
 */

const fs = require('fs');
const path = require('path');

// 简单的测试框架实现
class SimpleTestFramework {
    constructor() {
        this.tests = [];
        this.describes = [];
        this.currentDescribe = null;
    }

    describe(name, fn) {
        this.currentDescribe = { name, tests: [] };
        this.describes.push(this.currentDescribe);
        fn();
        this.currentDescribe = null;
    }

    test(name, fn) {
        if (this.currentDescribe) {
            this.currentDescribe.tests.push({ name, fn });
        } else {
            this.tests.push({ name, fn });
        }
    }

    expect(actual) {
        return {
            toBe: (expected) => {
                if (actual !== expected) {
                    throw new Error(`Expected ${expected}, but got ${actual}`);
                }
            },
            toEqual: (expected) => {
                if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                    throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
                }
            },
            toContain: (expected) => {
                if (!actual.includes(expected)) {
                    throw new Error(`Expected ${actual} to contain ${expected}`);
                }
            },
            toBeGreaterThan: (expected) => {
                if (actual <= expected) {
                    throw new Error(`Expected ${actual} to be greater than ${expected}`);
                }
            }
        };
    }

    runTests() {
        let totalTests = 0;
        let passedTests = 0;
        let failedTests = 0;
        const results = [];

        // 运行独立测试
        for (const test of this.tests) {
            totalTests++;
            try {
                test.fn();
                passedTests++;
                results.push({ name: test.name, status: 'PASS' });
            } catch (error) {
                failedTests++;
                results.push({ name: test.name, status: 'FAIL', error: error.message });
            }
        }

        // 运行分组测试
        for (const describe of this.describes) {
            for (const test of describe.tests) {
                totalTests++;
                try {
                    test.fn();
                    passedTests++;
                    results.push({ name: `${describe.name} - ${test.name}`, status: 'PASS' });
                } catch (error) {
                    failedTests++;
                    results.push({ name: `${describe.name} - ${test.name}`, status: 'FAIL', error: error.message });
                }
            }
        }

        return { totalTests, passedTests, failedTests, results };
    }
}

// 全局测试函数
let testFramework = new SimpleTestFramework();
const describe = (name, fn) => testFramework.describe(name, fn);
const test = (name, fn) => testFramework.test(name, fn);
const expect = (actual) => testFramework.expect(actual);

// 设置全局变量
global.describe = describe;
global.test = test;
global.expect = expect;

// 运行测试文件的函数
function runTestFile(filePath) {
    testFramework = new SimpleTestFramework();
    global.describe = (name, fn) => testFramework.describe(name, fn);
    global.test = (name, fn) => testFramework.test(name, fn);
    global.expect = (actual) => testFramework.expect(actual);

    try {
        require(filePath);
        return testFramework.runTests();
    } catch (error) {
        console.error(`Error loading test file ${filePath}:`, error.message);
        return { totalTests: 0, passedTests: 0, failedTests: 1, results: [{ name: path.basename(filePath), status: 'FAIL', error: error.message }] };
    }
}

/**
 * 运行所有测试
 */
function runAllTests() {
    console.log('🚀 开始运行编译系统完整测试套件\n');
    console.log('='.repeat(60));

    const startTime = Date.now();
    const results = {};
    const testFiles = [
        { name: 'lexer', file: './lexer.test.js', emoji: '📝' },
        { name: 'parser', file: './parser.test.js', emoji: '🌳' },
        { name: 'semantic', file: './semantic.test.js', emoji: '🔍' },
        { name: 'optimizer', file: './optimizer.test.js', emoji: '⚡' },
        { name: 'codegen', file: './codegen.test.js', emoji: '🎯' }
    ];

    try {
        for (const testFile of testFiles) {
            console.log(`\n${testFile.emoji} 运行${testFile.name}测试...`);
            const testPath = path.resolve(__dirname, testFile.file);

            if (fs.existsSync(testPath)) {
                results[testFile.name] = runTestFile(testPath);
                console.log(`   ✅ ${results[testFile.name].passedTests}/${results[testFile.name].totalTests} 测试通过`);
                if (results[testFile.name].failedTests > 0) {
                    console.log(`   ❌ ${results[testFile.name].failedTests} 测试失败`);
                }
            } else {
                console.log(`   ⚠️  测试文件不存在: ${testFile.file}`);
                results[testFile.name] = { totalTests: 0, passedTests: 0, failedTests: 1, results: [] };
            }
        }

    } catch (error) {
        console.error('❌ 测试运行过程中发生错误:', error.message);
        return null;
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // 生成综合报告
    generateTestReport(results, totalTime);

    return results;
}

/**
 * 生成测试报告
 */
function generateTestReport(results, totalTime) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 编译系统测试综合报告');
    console.log('='.repeat(60));

    // 计算总体统计
    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;

    const moduleNames = {
        lexer: '词法分析器',
        parser: '语法分析器',
        semantic: '语义分析器',
        optimizer: '代码优化器',
        codegen: '目标代码生成器'
    };

    console.log('\n📋 各模块测试结果:');
    console.log('-'.repeat(60));

    Object.keys(results).forEach(module => {
        const result = results[module];
        totalTests += result.totalTests;
        totalPassed += result.passedTests;
        totalFailed += result.failedTests;

        const status = result.passedTests === result.totalTests ? '✅' : '⚠️';
        const passRate = result.totalTests > 0 ? (result.passedTests / result.totalTests * 100).toFixed(1) : '0.0';

        console.log(`${status} ${moduleNames[module]}: ${result.passedTests}/${result.totalTests} (${passRate}%)`);
    });

    console.log('-'.repeat(60));

    // 总体统计
    const overallPassRate = (totalPassed / totalTests * 100).toFixed(1);
    const overallStatus = totalPassed === totalTests ? '🎉' : '⚠️';

    console.log('\n📈 总体统计:');
    console.log(`${overallStatus} 总测试数: ${totalTests}`);
    console.log(`✅ 通过测试: ${totalPassed}`);
    console.log(`❌ 失败测试: ${totalFailed}`);
    console.log(`📊 总通过率: ${overallPassRate}%`);
    console.log(`⏱️  总耗时: ${totalTime}ms`);

    // 性能分析
    console.log('\n⚡ 性能分析:');
    const avgTimePerTest = (totalTime / totalTests).toFixed(2);
    console.log(`平均每个测试耗时: ${avgTimePerTest}ms`);

    if (totalTime < 5000) {
        console.log('🚀 测试执行速度: 优秀');
    } else if (totalTime < 10000) {
        console.log('👍 测试执行速度: 良好');
    } else {
        console.log('🐌 测试执行速度: 需要优化');
    }

    // 质量评估
    console.log('\n🏆 质量评估:');
    if (overallPassRate >= 95) {
        console.log('🌟 代码质量: 优秀 (≥95%)');
    } else if (overallPassRate >= 85) {
        console.log('👍 代码质量: 良好 (≥85%)');
    } else if (overallPassRate >= 70) {
        console.log('⚠️  代码质量: 一般 (≥70%)');
    } else {
        console.log('❌ 代码质量: 需要改进 (<70%)');
    }

    // 覆盖率分析
    console.log('\n📊 测试覆盖率分析:');
    const coverageAreas = [
        { name: '词法分析', coverage: results.lexer.passRate },
        { name: '语法分析', coverage: results.parser.passRate },
        { name: '语义分析', coverage: results.semantic.passRate },
        { name: '代码优化', coverage: results.optimizer.passRate },
        { name: '代码生成', coverage: results.codegen.passRate }
    ];

    coverageAreas.forEach(area => {
        const bar = generateProgressBar(area.coverage, 20);
        console.log(`${area.name}: ${bar} ${area.coverage.toFixed(1)}%`);
    });

    // 建议和改进
    console.log('\n💡 改进建议:');
    const failedModules = Object.keys(results).filter(module =>
        results[module].passRate < 100
    );

    if (failedModules.length === 0) {
        console.log('🎉 所有模块测试全部通过，代码质量优秀！');
    } else {
        failedModules.forEach(module => {
            const moduleName = moduleNames[module];
            const passRate = results[module].passRate.toFixed(1);
            console.log(`- ${moduleName}: 通过率${passRate}%，建议检查失败的测试用例`);
        });
    }

    // 测试完整性检查
    console.log('\n🔍 测试完整性检查:');
    const expectedMinTests = {
        lexer: 15,
        parser: 15,
        semantic: 15,
        optimizer: 15,
        codegen: 15
    };

    Object.keys(expectedMinTests).forEach(module => {
        const actual = results[module].total;
        const expected = expectedMinTests[module];
        const status = actual >= expected ? '✅' : '⚠️';
        console.log(`${status} ${moduleNames[module]}: ${actual}/${expected} 个测试用例`);
    });

    console.log('\n' + '='.repeat(60));

    if (totalPassed === totalTests) {
        console.log('🎊 恭喜！编译系统所有测试通过，可以提交课程设计了！');
    } else {
        console.log('📝 请根据失败的测试用例修复问题后重新运行测试。');
    }

    console.log('='.repeat(60));
}

/**
 * 生成进度条
 */
function generateProgressBar(percentage, length = 20) {
    const filled = Math.round(percentage / 100 * length);
    const empty = length - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * 运行特定模块测试
 */
function runModuleTest(moduleName) {
    console.log(`🔧 运行 ${moduleName} 模块测试...\n`);

    const testFunctions = {
        lexer: runLexerTests,
        parser: runParserTests,
        semantic: runSemanticTests,
        optimizer: runOptimizerTests,
        codegen: runCodeGenTests
    };

    const testFn = testFunctions[moduleName];
    if (!testFn) {
        console.error(`❌ 未知的模块名: ${moduleName}`);
        console.log('可用的模块: lexer, parser, semantic, optimizer, codegen');
        return null;
    }

    try {
        const result = testFn();
        console.log(`\n✅ ${moduleName} 模块测试完成`);
        return result;
    } catch (error) {
        console.error(`❌ ${moduleName} 模块测试失败:`, error.message);
        return null;
    }
}

/**
 * 生成测试报告文件
 */
function generateTestReportFile(results, outputPath = './test-report.md') {
    const fs = require('fs');

    let report = '# 编译系统测试报告\n\n';
    report += `生成时间: ${new Date().toLocaleString()}\n\n`;

    // 总体统计
    let totalTests = 0;
    let totalPassed = 0;
    Object.values(results).forEach(result => {
        totalTests += result.totalTests;
        totalPassed += result.passedTests;
    });

    const overallPassRate = (totalPassed / totalTests * 100).toFixed(1);

    report += '## 总体统计\n\n';
    report += `- 总测试数: ${totalTests}\n`;
    report += `- 通过测试: ${totalPassed}\n`;
    report += `- 失败测试: ${totalTests - totalPassed}\n`;
    report += `- 总通过率: ${overallPassRate}%\n\n`;

    // 各模块详情
    report += '## 各模块测试结果\n\n';
    report += '| 模块 | 通过/总数 | 通过率 | 状态 |\n';
    report += '|------|-----------|--------|------|\n';

    const moduleNames = {
        lexer: '词法分析器',
        parser: '语法分析器',
        semantic: '语义分析器',
        optimizer: '代码优化器',
        codegen: '目标代码生成器'
    };

    Object.keys(results).forEach(module => {
        const result = results[module];
        const status = result.passed === result.total ? '✅ 通过' : '⚠️ 部分失败';
        report += `| ${moduleNames[module]} | ${result.passed}/${result.total} | ${result.passRate.toFixed(1)}% | ${status} |\n`;
    });

    report += '\n## 测试覆盖范围\n\n';
    report += '### 词法分析器测试\n';
    report += '- Token识别测试\n';
    report += '- 关键字识别测试\n';
    report += '- 数字和标识符测试\n';
    report += '- 运算符和分隔符测试\n';
    report += '- 错误处理测试\n';
    report += '- 性能测试\n\n';

    report += '### 语法分析器测试\n';
    report += '- 基本语法结构解析\n';
    report += '- 表达式解析测试\n';
    report += '- 语句解析测试\n';
    report += '- AST构建测试\n';
    report += '- 语法错误处理\n';
    report += '- 复杂程序解析\n\n';

    report += '### 语义分析器测试\n';
    report += '- 符号表管理\n';
    report += '- 类型检查\n';
    report += '- 作用域分析\n';
    report += '- 变量声明和使用检查\n';
    report += '- 语义错误检测\n';
    report += '- 复杂表达式分析\n\n';

    report += '### 代码优化器测试\n';
    report += '- 常量折叠优化\n';
    report += '- 代数化简优化\n';
    report += '- 公共子表达式消除\n';
    report += '- 无用代码删除\n';
    report += '- 优化效果验证\n';
    report += '- 性能提升测试\n\n';

    report += '### 目标代码生成器测试\n';
    report += '- 基本指令生成\n';
    report += '- 表达式代码生成\n';
    report += '- 控制流代码生成\n';
    report += '- 变量管理\n';
    report += '- 指令优化\n';
    report += '- 汇编代码输出\n\n';

    report += '## 结论\n\n';
    if (overallPassRate >= 95) {
        report += '🎉 编译系统实现质量优秀，所有核心功能均正常工作，可以满足课程设计要求。\n';
    } else if (overallPassRate >= 85) {
        report += '👍 编译系统实现质量良好，大部分功能正常工作，建议修复少量问题。\n';
    } else {
        report += '⚠️ 编译系统实现需要进一步完善，建议检查失败的测试用例并修复相关问题。\n';
    }

    try {
        fs.writeFileSync(outputPath, report, 'utf8');
        console.log(`📄 测试报告已生成: ${outputPath}`);
    } catch (error) {
        console.error('❌ 生成测试报告文件失败:', error.message);
    }
}

// 命令行参数处理
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        // 运行所有测试
        const results = runAllTests();
        if (results) {
            generateTestReportFile(results);
        }
    } else if (args[0] === '--module' && args[1]) {
        // 运行特定模块测试
        runModuleTest(args[1]);
    } else if (args[0] === '--help') {
        console.log('编译系统测试运行器使用说明:');
        console.log('');
        console.log('运行所有测试:');
        console.log('  node test-runner.js');
        console.log('');
        console.log('运行特定模块测试:');
        console.log('  node test-runner.js --module <模块名>');
        console.log('');
        console.log('可用模块: lexer, parser, semantic, optimizer, codegen');
        console.log('');
        console.log('示例:');
        console.log('  node test-runner.js --module lexer');
    } else {
        console.error('❌ 无效的命令行参数');
        console.log('使用 --help 查看使用说明');
    }
}

module.exports = {
    runAllTests,
    runModuleTest,
    generateTestReport,
    generateTestReportFile
};