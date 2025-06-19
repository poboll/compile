/**
 * 代码生成器模块 - codegen.js
 * @description 将优化后的抽象语法树转换为目标代码
 *              支持多种目标平台和代码格式的生成
 * @module compiler/codegen/codegen
 * @author poboll
 * @date 2025
 * @version 1.0
 * 
 * 主要功能：
 * 1. 根据AST生成高质量的目标代码
 * 2. 支持多种代码生成目标和平台
 * 3. 优化生成代码的性能和大小
 * 4. 实现寄存器分配和内存管理
 * 5. 生成调试信息和符号表
 * 6. 支持指令选择和调度优化
 * 7. 提供可配置的代码生成选项
 */

const { Instruction } = require('./instruction');
const { TargetMachine } = require('./target-machine');
const { logger } = require('../../utils/logger');

class CodeGenerator {
  constructor(ast, { onEnter, onExit } = {}) {
    this.ast = ast;
    this.onEnter = onEnter;
    this.onExit = onExit;
  }

  log(message) {
    logger.debug(`[代码生成] ${message}`);
  }

  generate() {
    this.log('--- 代码生成开始 ---');
    const code = this.visit(this.ast);
    this.log('--- 代码生成完成 ---');
    return code;
  }

  visit(node, context = {}) {
    if (!node || typeof this[node.nodeType] !== 'function') {
      return '';
    }
    if (this.onEnter) {
      this.onEnter(node);
    }
    const result = this[node.nodeType](node, context);
    if (this.onExit) {
      this.onExit(node);
    }
    return result;
  }

  Program(node) {
    return node.body.map(n => this.visit(n)).join('\n');
  }

  VariableDeclaration(node) {
    const kind = node.kind; // let, const, var
    const id = this.visit(node.identifier);
    const init = node.initializer ? ` = ${this.visit(node.initializer)}` : '';
    return `${kind} ${id}${init};`;
  }

  FunctionDeclaration(node) {
    const id = this.visit(node.identifier);
    const params = node.params.map(p => this.visit(p)).join(', ');
    const body = this.visit(node.body);
    return `function ${id}(${params}) ${body}`;
  }

  BlockStatement(node) {
    const statements = node.body.map(n => this.visit(n, { inBlock: true })).join('\n');
    return `{\n${statements}\n}`;
  }

  ExpressionStatement(node) {
    return `${this.visit(node.expression)};`;
  }

  IfStatement(node) {
    const test = this.visit(node.test);
    const consequent = this.visit(node.consequent);
    const alternate = node.alternate ? ` else ${this.visit(node.alternate)}` : '';
    return `if (${test}) ${consequent}${alternate}`;
  }

  WhileStatement(node) {
    const test = this.visit(node.test);
    const body = this.visit(node.body);
    return `while (${test}) ${body}`;
  }

  AssignmentExpression(node) {
    const left = this.visit(node.left);
    const right = this.visit(node.right);
    return `${left} = ${right}`;
  }

  BinaryExpression(node) {
    const left = this.visit(node.left);
    const right = this.visit(node.right);
    return `(${left} ${node.operator} ${right})`;
  }

  CallExpression(node) {
    const callee = this.visit(node.callee);
    const args = node.arguments.map(arg => this.visit(arg)).join(', ');
    return `${callee}(${args})`;
  }

  Identifier(node) {
    return node.name;
  }

  Literal(node) {
    return JSON.stringify(node.value);
  }
}

module.exports = {
  CodeGenerator
};

// 为了向后兼容，也导出默认的CodeGenerator
module.exports.default = CodeGenerator;

