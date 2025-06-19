/**
 * 死代码消除优化模块 - dead-code-eliminator.js
 * @description 识别和移除程序中永远不会执行的代码
 *              提高代码质量和执行效率
 * @module compiler/optimizer/dead-code-eliminator
 * @author poboll
 * @date 2025
 * @version 1.0
 * 
 * 主要功能：
 * 1. 识别不可达代码块
 * 2. 移除未使用的变量和函数
 * 3. 消除永远为假的条件分支
 * 4. 移除无效的赋值语句
 * 5. 优化循环中的死代码
 * 6. 处理异常处理中的死代码
 */

const { logger } = require('../../utils/logger');
const { NodeType } = require('../parser/ast-node');

/**
 * 死代码消除器类
 */
class DeadCodeEliminator {
    constructor() {
        this.eliminatedCount = 0;
        this.statistics = {
            unreachableBlocks: 0,
            unusedVariables: 0,
            unusedFunctions: 0,
            deadBranches: 0,
            deadAssignments: 0,
            deadLoops: 0
        };
        this.usedVariables = new Set();
        this.usedFunctions = new Set();
        this.reachableBlocks = new Set();
    }

    /**
     * 对AST进行死代码消除优化
     * @param {ASTNode} ast - 抽象语法树
     * @returns {ASTNode} - 优化后的AST
     */
    eliminate(ast) {
        logger.phase('DeadCodeEliminator', '开始死代码消除优化');

        this.eliminatedCount = 0;
        this.resetStatistics();
        this.resetAnalysis();

        // 第一遍：分析使用情况
        this.analyzeUsage(ast);

        // 第二遍：标记可达代码
        this.markReachableCode(ast);

        // 第三遍：消除死代码
        const optimizedAst = this.eliminateDeadCode(ast);

        logger.success(`死代码消除完成，共移除 ${this.eliminatedCount} 个死代码块`);
        this.logStatistics();

        return optimizedAst;
    }

    /**
     * 分析代码使用情况
     * @param {ASTNode} node - AST节点
     */
    analyzeUsage(node) {
        if (!node) return;

        switch (node.nodeType) {
            case NodeType.IDENTIFIER:
                this.usedVariables.add(node.name);
                break;

            case NodeType.CALL_EXPRESSION:
                if (node.callee && node.callee.nodeType === NodeType.IDENTIFIER) {
                    this.usedFunctions.add(node.callee.name);
                }
                break;

            case NodeType.MEMBER_EXPRESSION:
                if (node.object && node.object.nodeType === NodeType.IDENTIFIER) {
                    this.usedVariables.add(node.object.name);
                }
                break;
        }

        // 递归分析子节点
        if (node.children) {
            node.children.forEach(child => this.analyzeUsage(child));
        }

        // 分析特定属性
        ['left', 'right', 'operand', 'callee', 'object', 'property',
            'test', 'consequent', 'alternate', 'init', 'update', 'body'].forEach(prop => {
                if (node[prop]) {
                    if (Array.isArray(node[prop])) {
                        node[prop].forEach(item => this.analyzeUsage(item));
                    } else {
                        this.analyzeUsage(node[prop]);
                    }
                }
            });
    }

    /**
     * 标记可达代码
     * @param {ASTNode} node - AST节点
     * @param {boolean} reachable - 是否可达
     */
    markReachableCode(node, reachable = true) {
        if (!node) return;

        if (reachable) {
            this.reachableBlocks.add(node.id || this.getNodeId(node));
        }

        switch (node.nodeType) {
            case NodeType.IF_STATEMENT:
                this.markReachableInIfStatement(node, reachable);
                break;

            case NodeType.WHILE_STATEMENT:
            case NodeType.FOR_STATEMENT:
                this.markReachableInLoop(node, reachable);
                break;

            case NodeType.RETURN_STATEMENT:
            case NodeType.BREAK_STATEMENT:
            case NodeType.CONTINUE_STATEMENT:
                // 这些语句后的代码不可达
                if (reachable && node.parent) {
                    this.markUnreachableAfter(node);
                }
                break;

            default:
                // 递归标记子节点
                if (node.children) {
                    node.children.forEach(child => this.markReachableCode(child, reachable));
                }
        }
    }

    /**
     * 标记if语句中的可达代码
     * @param {ASTNode} node - if语句节点
     * @param {boolean} reachable - 是否可达
     */
    markReachableInIfStatement(node, reachable) {
        // 标记条件表达式
        this.markReachableCode(node.test, reachable);

        // 检查条件是否为常量
        if (this.isConstantCondition(node.test)) {
            const conditionValue = this.getConstantValue(node.test);

            if (conditionValue) {
                // 条件为真，then分支可达，else分支不可达
                this.markReachableCode(node.consequent, reachable);
                if (node.alternate) {
                    this.markReachableCode(node.alternate, false);
                    this.statistics.deadBranches++;
                }
            } else {
                // 条件为假，else分支可达，then分支不可达
                this.markReachableCode(node.consequent, false);
                this.statistics.deadBranches++;
                if (node.alternate) {
                    this.markReachableCode(node.alternate, reachable);
                }
            }
        } else {
            // 条件不是常量，两个分支都可能可达
            this.markReachableCode(node.consequent, reachable);
            if (node.alternate) {
                this.markReachableCode(node.alternate, reachable);
            }
        }
    }

    /**
     * 标记循环中的可达代码
     * @param {ASTNode} node - 循环节点
     * @param {boolean} reachable - 是否可达
     */
    markReachableInLoop(node, reachable) {
        if (node.nodeType === NodeType.WHILE_STATEMENT) {
            this.markReachableCode(node.test, reachable);

            // 检查是否为死循环或永不执行的循环
            if (this.isConstantCondition(node.test)) {
                const conditionValue = this.getConstantValue(node.test);
                if (!conditionValue) {
                    // 条件永远为假，循环体不可达
                    this.markReachableCode(node.body, false);
                    this.statistics.deadLoops++;
                    return;
                }
            }

            this.markReachableCode(node.body, reachable);
        } else if (node.nodeType === NodeType.FOR_STATEMENT) {
            // for循环的各个部分
            if (node.init) this.markReachableCode(node.init, reachable);
            if (node.test) this.markReachableCode(node.test, reachable);
            if (node.update) this.markReachableCode(node.update, reachable);

            // 检查循环条件
            if (node.test && this.isConstantCondition(node.test)) {
                const conditionValue = this.getConstantValue(node.test);
                if (!conditionValue) {
                    this.markReachableCode(node.body, false);
                    this.statistics.deadLoops++;
                    return;
                }
            }

            this.markReachableCode(node.body, reachable);
        }
    }

    /**
     * 标记某个节点之后的代码为不可达
     * @param {ASTNode} node - 节点
     */
    markUnreachableAfter(node) {
        const parent = node.parent;
        if (!parent || !parent.children) return;

        const nodeIndex = parent.children.indexOf(node);
        if (nodeIndex === -1) return;

        // 标记后续兄弟节点为不可达
        for (let i = nodeIndex + 1; i < parent.children.length; i++) {
            this.markReachableCode(parent.children[i], false);
            this.statistics.unreachableBlocks++;
        }
    }

    /**
     * 消除死代码
     * @param {ASTNode} node - AST节点
     * @returns {ASTNode|null} - 处理后的节点
     */
    eliminateDeadCode(node) {
        if (!node) return null;

        const nodeId = node.id || this.getNodeId(node);

        // 检查节点是否可达
        if (!this.reachableBlocks.has(nodeId)) {
            this.eliminatedCount++;
            return null; // 移除不可达的节点
        }

        // 处理特定类型的节点
        switch (node.nodeType) {
            case NodeType.VARIABLE_DECLARATION:
                return this.eliminateDeadVariables(node);

            case NodeType.FUNCTION_DECLARATION:
                return this.eliminateDeadFunctions(node);

            case NodeType.ASSIGNMENT_EXPRESSION:
                return this.eliminateDeadAssignments(node);

            case NodeType.IF_STATEMENT:
                return this.eliminateDeadBranches(node);

            case NodeType.BLOCK_STATEMENT:
                return this.eliminateDeadInBlock(node);

            default:
                // 递归处理子节点
                return this.eliminateInChildren(node);
        }
    }

    /**
     * 消除死变量声明
     * @param {ASTNode} node - 变量声明节点
     * @returns {ASTNode|null} - 处理后的节点
     */
    eliminateDeadVariables(node) {
        if (!node.declarations) return node;

        const liveDeclarations = node.declarations.filter(decl => {
            if (decl.id && decl.id.nodeType === NodeType.IDENTIFIER) {
                const isUsed = this.usedVariables.has(decl.id.name);
                if (!isUsed) {
                    this.statistics.unusedVariables++;
                    this.eliminatedCount++;
                }
                return isUsed;
            }
            return true;
        });

        if (liveDeclarations.length === 0) {
            return null; // 移除整个声明
        }

        if (liveDeclarations.length < node.declarations.length) {
            node.declarations = liveDeclarations;
        }

        return node;
    }

    /**
     * 消除死函数声明
     * @param {ASTNode} node - 函数声明节点
     * @returns {ASTNode|null} - 处理后的节点
     */
    eliminateDeadFunctions(node) {
        if (node.id && node.id.nodeType === NodeType.IDENTIFIER) {
            const functionName = node.id.name;

            // 检查函数是否被使用（排除main函数等入口函数）
            if (!this.usedFunctions.has(functionName) &&
                !this.isEntryFunction(functionName)) {
                this.statistics.unusedFunctions++;
                this.eliminatedCount++;
                return null;
            }
        }

        // 递归处理函数体
        if (node.body) {
            node.body = this.eliminateDeadCode(node.body);
        }

        return node;
    }

    /**
     * 消除死赋值语句
     * @param {ASTNode} node - 赋值表达式节点
     * @returns {ASTNode|null} - 处理后的节点
     */
    eliminateDeadAssignments(node) {
        // 检查赋值的左侧是否为未使用的变量
        if (node.left && node.left.nodeType === NodeType.IDENTIFIER) {
            const varName = node.left.name;

            if (!this.usedVariables.has(varName)) {
                this.statistics.deadAssignments++;
                this.eliminatedCount++;
                return null;
            }
        }

        // 递归处理右侧表达式
        if (node.right) {
            node.right = this.eliminateDeadCode(node.right);
        }

        return node;
    }

    /**
     * 消除死分支
     * @param {ASTNode} node - if语句节点
     * @returns {ASTNode} - 处理后的节点
     */
    eliminateDeadBranches(node) {
        // 处理条件表达式
        node.test = this.eliminateDeadCode(node.test);

        // 如果条件是常量，可以简化分支
        if (this.isConstantCondition(node.test)) {
            const conditionValue = this.getConstantValue(node.test);

            if (conditionValue) {
                // 条件为真，返回then分支
                return this.eliminateDeadCode(node.consequent);
            } else {
                // 条件为假，返回else分支（如果存在）
                return node.alternate ? this.eliminateDeadCode(node.alternate) : null;
            }
        }

        // 递归处理分支
        node.consequent = this.eliminateDeadCode(node.consequent);
        if (node.alternate) {
            node.alternate = this.eliminateDeadCode(node.alternate);
        }

        return node;
    }

    /**
     * 消除块语句中的死代码
     * @param {ASTNode} node - 块语句节点
     * @returns {ASTNode} - 处理后的节点
     */
    eliminateDeadInBlock(node) {
        if (!node.body || !Array.isArray(node.body)) {
            return node;
        }

        const liveStatements = [];

        for (const stmt of node.body) {
            const processedStmt = this.eliminateDeadCode(stmt);
            if (processedStmt) {
                liveStatements.push(processedStmt);

                // 如果遇到return、break、continue等语句，后续语句不可达
                if (this.isTerminatingStatement(stmt)) {
                    break;
                }
            }
        }

        node.body = liveStatements;
        return node;
    }

    /**
     * 递归处理子节点
     * @param {ASTNode} node - AST节点
     * @returns {ASTNode} - 处理后的节点
     */
    eliminateInChildren(node) {
        // 处理子节点数组
        if (node.children) {
            node.children = node.children
                .map(child => this.eliminateDeadCode(child))
                .filter(child => child !== null);
        }

        // 处理特定属性
        ['left', 'right', 'operand', 'callee', 'object', 'property',
            'test', 'consequent', 'alternate', 'init', 'update', 'body'].forEach(prop => {
                if (node[prop]) {
                    if (Array.isArray(node[prop])) {
                        node[prop] = node[prop]
                            .map(item => this.eliminateDeadCode(item))
                            .filter(item => item !== null);
                    } else {
                        node[prop] = this.eliminateDeadCode(node[prop]);
                    }
                }
            });

        return node;
    }

    /**
     * 检查条件是否为常量
     * @param {ASTNode} node - 条件节点
     * @returns {boolean} - 是否为常量条件
     */
    isConstantCondition(node) {
        return node && (
            node.nodeType === NodeType.BOOLEAN_LITERAL ||
            node.nodeType === NodeType.NUMBER_LITERAL ||
            node.nodeType === NodeType.NULL_LITERAL
        );
    }

    /**
     * 获取常量条件的值
     * @param {ASTNode} node - 条件节点
     * @returns {*} - 常量值
     */
    getConstantValue(node) {
        switch (node.nodeType) {
            case NodeType.BOOLEAN_LITERAL:
                return node.value;
            case NodeType.NUMBER_LITERAL:
                return node.value !== 0;
            case NodeType.NULL_LITERAL:
                return false;
            default:
                return undefined;
        }
    }

    /**
     * 检查是否为终止语句
     * @param {ASTNode} node - AST节点
     * @returns {boolean} - 是否为终止语句
     */
    isTerminatingStatement(node) {
        return node && (
            node.nodeType === NodeType.RETURN_STATEMENT ||
            node.nodeType === NodeType.BREAK_STATEMENT ||
            node.nodeType === NodeType.CONTINUE_STATEMENT
        );
    }

    /**
     * 检查是否为入口函数
     * @param {string} functionName - 函数名
     * @returns {boolean} - 是否为入口函数
     */
    isEntryFunction(functionName) {
        const entryFunctions = ['main', 'init', 'start', 'entry'];
        return entryFunctions.includes(functionName);
    }

    /**
     * 获取节点ID
     * @param {ASTNode} node - AST节点
     * @returns {string} - 节点ID
     */
    getNodeId(node) {
        return `${node.nodeType}_${node.line}_${node.column}`;
    }

    /**
     * 重置统计信息
     */
    resetStatistics() {
        this.statistics = {
            unreachableBlocks: 0,
            unusedVariables: 0,
            unusedFunctions: 0,
            deadBranches: 0,
            deadAssignments: 0,
            deadLoops: 0
        };
    }

    /**
     * 重置分析状态
     */
    resetAnalysis() {
        this.usedVariables.clear();
        this.usedFunctions.clear();
        this.reachableBlocks.clear();
    }

    /**
     * 记录统计信息
     */
    logStatistics() {
        logger.info('死代码消除统计:');
        logger.info(`  不可达代码块: ${this.statistics.unreachableBlocks}`);
        logger.info(`  未使用变量: ${this.statistics.unusedVariables}`);
        logger.info(`  未使用函数: ${this.statistics.unusedFunctions}`);
        logger.info(`  死分支: ${this.statistics.deadBranches}`);
        logger.info(`  死赋值: ${this.statistics.deadAssignments}`);
        logger.info(`  死循环: ${this.statistics.deadLoops}`);
    }

    /**
     * 获取优化统计信息
     * @returns {Object} - 统计信息
     */
    getStatistics() {
        return {
            totalEliminated: this.eliminatedCount,
            ...this.statistics
        };
    }
}

module.exports = {
    DeadCodeEliminator
};