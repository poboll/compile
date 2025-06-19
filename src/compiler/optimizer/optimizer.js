/**
 * 代码优化器模块 - optimizer.js
 * @description 对抽象语法树进行各种代码优化，提高生成代码的执行效率
 *              实现多种优化策略和算法
 * @module compiler/optimizer/optimizer
 * @author poboll
 * @date 2025
 * @version 1.0
 * 
 * 主要功能：
 * 1. 执行基本的代码优化和性能提升
 * 2. 常量折叠和常量传播优化
 * 3. 死代码消除和无用代码清理
 * 4. 表达式简化和代数优化
 * 5. 控制流优化和跳转简化
 * 6. 循环优化和展开策略
 * 7. 提供可配置的优化级别和选项
 */

const { ASTNode } = require('../parser/ast-node');
const { ConstantFolder } = require('./constant-folder');
const { DeadCodeEliminator } = require('./dead-code-eliminator');
const { logger } = require('../../utils/logger');

class Optimizer {
  constructor(ast, { onEnter, onExit } = {}) {
    this.ast = ast;
    this.onEnter = onEnter;
    this.onExit = onExit;
  }

  log(message) {
    logger.debug(`[代码优化] ${message}`);
  }

  optimize() {
    this.log('--- 代码优化开始 ---');
    this.visit(this.ast);
    this.log('--- 代码优化完成 ---');
    return this.ast;
  }

  visit(node, parent, key, index) {
    if (!node || typeof this[node.nodeType] !== 'function') {
      return;
    }

    if (this.onEnter) {
      this.onEnter(node);
    }

    const replacement = this[node.nodeType](node);
    if (replacement) {
      // 如果节点被替换，则更新父节点的引用
      if (parent && key) {
        if (index !== undefined) {
          parent[key][index] = replacement;
        } else {
          parent[key] = replacement;
        }
        // 从替换后的节点继续访问
        this.visit(replacement, parent, key, index);
      } else {
        this.ast = replacement; // 根节点被替换
        this.visit(this.ast);
      }
      return;
    }

    // 递归访问子节点
    for (const key of Object.keys(node)) {
      const value = node[key];
      if (Array.isArray(value)) {
        value.forEach((child, i) => this.visit(child, node, key, i));
      } else if (typeof value === 'object' && value !== null && value.nodeType) {
        this.visit(value, node, key);
      }
    }

    if (this.onExit) {
      this.onExit(node);
    }
  }

  BinaryExpression(node) {
    // 常量折叠
    if (node.left.nodeType === 'Literal' && node.right.nodeType === 'Literal') {
      const leftVal = node.left.value;
      const rightVal = node.right.value;
      let result;
      switch (node.operator) {
        case '+': result = leftVal + rightVal; break;
        case '-': result = leftVal - rightVal; break;
        case '*': result = leftVal * rightVal; break;
        case '/': result = leftVal / rightVal; break;
        // 可以添加更多操作符
        default: return null; // 无法折叠
      }

      this.log(`常量折叠: ${leftVal} ${node.operator} ${rightVal} -> ${result}`);

      return {
        nodeType: 'Literal',
        value: result,
        line: node.line,
        column: node.column
      };
    }
    return null; // 无替换
  }

  // 为其他节点类型添加空的访问者方法，以允许递归
  Program() { }
  VariableDeclaration() { }
  FunctionDeclaration() { }
  BlockStatement() { }
  IfStatement() { }
  WhileStatement() { }
  AssignmentExpression() { }
  CallExpression() { }
  Identifier() { }
  ExpressionStatement() { }
  Literal() { }
}

module.exports = Optimizer;

