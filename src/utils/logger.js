/**
 * 编译器日志系统
 * 
 * 功能：
 * 1. 统一管理所有日志输出
 * 2. 支持不同日志级别
 * 3. 可配置的输出控制
 * 4. 测试环境下可禁用输出
 * 
 * 作者：poboll
 * 日期：2025-06-05
 */

class Logger {
    constructor(options = {}) {
        this.options = {
            level: options.level || 'INFO',
            enableConsole: options.enableConsole !== false,
            enableFile: options.enableFile || false,
            logFile: options.logFile || 'compiler.log',
            timestamp: options.timestamp !== false,
            colors: options.colors !== false,
            silent: options.silent || false,
            ...options
        };

        this.levels = {
            DEBUG: 0,
            INFO: 1,
            WARN: 2,
            ERROR: 3,
            SILENT: 4
        };

        this.colors = {
            DEBUG: '\x1b[36m',    // 青色
            INFO: '\x1b[32m',     // 绿色
            WARN: '\x1b[33m',     // 黄色
            ERROR: '\x1b[31m',    // 红色
            RESET: '\x1b[0m'      // 重置
        };

        // 检测是否在测试环境
        this.isTestEnvironment = process.env.NODE_ENV === 'test' ||
            process.argv.some(arg => arg.includes('jest') || arg.includes('test'));

        // 测试环境下默认静默
        if (this.isTestEnvironment && !options.hasOwnProperty('silent')) {
            this.options.silent = true;
        }
    }

    shouldLog(level) {
        if (this.options.silent) return false;
        return this.levels[level] >= this.levels[this.options.level];
    }

    formatMessage(level, message, ...args) {
        let formattedMessage = typeof message === 'string' ? message : JSON.stringify(message);

        // 处理额外参数
        if (args.length > 0) {
            formattedMessage += ' ' + args.map(arg =>
                typeof arg === 'string' ? arg : JSON.stringify(arg)
            ).join(' ');
        }

        // 添加时间戳
        if (this.options.timestamp) {
            const timestamp = new Date().toISOString();
            formattedMessage = `[${timestamp}] ${formattedMessage}`;
        }

        // 添加级别标识
        formattedMessage = `[${level}] ${formattedMessage}`;

        // 添加颜色
        if (this.options.colors && this.options.enableConsole) {
            const color = this.colors[level] || this.colors.RESET;
            formattedMessage = `${color}${formattedMessage}${this.colors.RESET}`;
        }

        return formattedMessage;
    }

    log(level, message, ...args) {
        if (!this.shouldLog(level)) return;

        const formattedMessage = this.formatMessage(level, message, ...args);

        // 控制台输出
        if (this.options.enableConsole) {
            if (level === 'ERROR') {
                console.error(formattedMessage);
            } else {
                console.log(formattedMessage);
            }
        }

        // 文件输出（如果启用）
        if (this.options.enableFile) {
            this.writeToFile(formattedMessage);
        }
    }

    writeToFile(message) {
        try {
            const fs = require('fs');
            const path = require('path');

            // 确保日志目录存在
            const logDir = path.dirname(this.options.logFile);
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }

            // 写入文件
            fs.appendFileSync(this.options.logFile, message + '\n');
        } catch (error) {
            // 文件写入失败时静默处理，避免循环错误
        }
    }

    debug(message, ...args) {
        this.log('DEBUG', message, ...args);
    }

    info(message, ...args) {
        this.log('INFO', message, ...args);
    }

    warn(message, ...args) {
        this.log('WARN', message, ...args);
    }

    error(message, ...args) {
        this.log('ERROR', message, ...args);
    }

    // 编译器特定的日志方法
    phase(phaseName, message, ...args) {
        this.info(`[${phaseName}] ${message}`, ...args);
    }

    success(message, ...args) {
        this.info(`✅ ${message}`, ...args);
    }

    failure(message, ...args) {
        this.error(`❌ ${message}`, ...args);
    }

    progress(message, ...args) {
        this.info(`🚀 ${message}`, ...args);
    }

    // 设置日志级别
    setLevel(level) {
        if (this.levels.hasOwnProperty(level)) {
            this.options.level = level;
        }
    }

    // 启用/禁用静默模式
    setSilent(silent) {
        this.options.silent = silent;
    }

    // 创建子日志器（用于特定模块）
    createChild(prefix, options = {}) {
        const childOptions = { ...this.options, ...options };
        const child = new Logger(childOptions);

        // 重写日志方法以添加前缀
        const originalLog = child.log.bind(child);
        child.log = (level, message, ...args) => {
            const prefixedMessage = `[${prefix}] ${message}`;
            originalLog(level, prefixedMessage, ...args);
        };

        return child;
    }
}

// 创建默认日志器实例
const defaultLogger = new Logger();

// 导出默认实例和类
module.exports = {
    Logger,
    logger: defaultLogger,

    // 便捷方法
    debug: defaultLogger.debug.bind(defaultLogger),
    info: defaultLogger.info.bind(defaultLogger),
    warn: defaultLogger.warn.bind(defaultLogger),
    error: defaultLogger.error.bind(defaultLogger),
    phase: defaultLogger.phase.bind(defaultLogger),
    success: defaultLogger.success.bind(defaultLogger),
    failure: defaultLogger.failure.bind(defaultLogger),
    progress: defaultLogger.progress.bind(defaultLogger),

    // 配置方法
    setLevel: defaultLogger.setLevel.bind(defaultLogger),
    setSilent: defaultLogger.setSilent.bind(defaultLogger),
    createChild: defaultLogger.createChild.bind(defaultLogger)
};