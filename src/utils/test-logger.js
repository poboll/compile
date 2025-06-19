/**
 * 测试环境专用日志配置
 * 
 * 功能：
 * 1. 为测试环境提供静默的日志配置
 * 2. 只在测试失败时输出关键信息
 * 3. 避免测试输出干扰
 * 
 * 作者：poboll
 * 日期：2025-06-05
 */

const { Logger } = require('./logger');

// 创建测试专用的日志器
const testLogger = new Logger({
    level: 'ERROR',        // 只输出错误信息
    enableConsole: false,  // 禁用控制台输出
    enableFile: false,     // 禁用文件输出
    silent: true,          // 完全静默
    timestamp: false,      // 不显示时间戳
    colors: false          // 不使用颜色
});

// 为测试环境配置全局日志器
function configureTestLogging() {
    // 检测是否在测试环境
    const isTestEnv = process.env.NODE_ENV === 'test' ||
        process.argv.some(arg => arg.includes('jest') || arg.includes('test'));

    if (isTestEnv) {
        // 在测试环境中，替换默认的logger
        const logger = require('./logger');

        // 重写所有日志方法为静默
        logger.logger.setSilent(true);
        logger.logger.setLevel('SILENT');

        // 重写全局方法
        Object.assign(logger, {
            debug: () => { },
            info: () => { },
            warn: () => { },
            error: () => { },
            phase: () => { },
            success: () => { },
            failure: () => { },
            progress: () => { }
        });
    }
}

// 为特定测试提供有限的日志输出
function createTestLogger(options = {}) {
    return new Logger({
        level: options.level || 'ERROR',
        enableConsole: options.enableConsole || false,
        enableFile: false,
        silent: options.silent !== false,
        timestamp: false,
        colors: false,
        ...options
    });
}

// 在测试中临时启用日志（用于调试）
function enableTestLogging(level = 'INFO') {
    const logger = require('./logger');
    logger.logger.setSilent(false);
    logger.logger.setLevel(level);

    // 恢复日志方法
    const originalLogger = new Logger({ level, silent: false });
    Object.assign(logger, {
        debug: originalLogger.debug.bind(originalLogger),
        info: originalLogger.info.bind(originalLogger),
        warn: originalLogger.warn.bind(originalLogger),
        error: originalLogger.error.bind(originalLogger),
        phase: originalLogger.phase.bind(originalLogger),
        success: originalLogger.success.bind(originalLogger),
        failure: originalLogger.failure.bind(originalLogger),
        progress: originalLogger.progress.bind(originalLogger)
    });
}

// 禁用测试日志
function disableTestLogging() {
    const logger = require('./logger');
    logger.logger.setSilent(true);
    logger.logger.setLevel('SILENT');
}

module.exports = {
    testLogger,
    configureTestLogging,
    createTestLogger,
    enableTestLogging,
    disableTestLogging
};

// 自动配置测试环境
configureTestLogging();