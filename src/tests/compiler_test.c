/**
 * 编译器测试框架 - compiler_test.c
 * @description 集成测试框架，用于测试编译器的完整流程
 * @module tests/compiler_test
 * @author poboll
 * @date 2025-06-05
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#include "../compiler/common.h"
#include "../compiler/lexer/lexer.h"
#include "../compiler/parser/parser.h"
#include "../compiler/semantic/semantic.h"
#include "../compiler/optimizer/optimizer.h"
#include "../compiler/codegen/codegen.h"

// 设置日志级别
#define TEST_LOG_LEVEL LOG_DEBUG

// 编译错误计数
static int error_count = 0;

// 测试状态
typedef struct
{
  bool lexer_success;
  bool parser_success;
  bool semantic_success;
  bool optimizer_success;
  bool codegen_success;
  int token_count;
  int error_count;
  double lexer_time;
  double parser_time;
  double semantic_time;
  double optimizer_time;
  double codegen_time;
  double total_time;
} TestStatus;

// 初始化测试状态
static void init_test_status(TestStatus *status)
{
  status->lexer_success = false;
  status->parser_success = false;
  status->semantic_success = false;
  status->optimizer_success = false;
  status->codegen_success = false;
  status->token_count = 0;
  status->error_count = 0;
  status->lexer_time = 0.0;
  status->parser_time = 0.0;
  status->semantic_time = 0.0;
  status->optimizer_time = 0.0;
  status->codegen_time = 0.0;
  status->total_time = 0.0;
}

// 编译源代码
static bool compile_source(const char *source_code, const char *output_file, bool verbose, TestStatus *status)
{
  if (!source_code || !output_file || !status)
  {
    fprintf(stderr, "编译错误: 无效的参数\n");
    return false;
  }

  clock_t start_total = clock();

  // 初始化状态
  init_test_status(status);

  // 设置日志级别
  set_log_level(verbose ? TEST_LOG_LEVEL : LOG_ERROR);

  printf("开始编译源代码...\n");

  // 第1阶段: 词法分析
  printf("\n=== 阶段1: 词法分析 ===\n");
  clock_t start_lexer = clock();

  Lexer *lexer = lexer_create(source_code, "test_input");
  if (!lexer)
  {
    fprintf(stderr, "词法分析器创建失败\n");
    return false;
  }

  // 执行词法分析
  TokenArray *tokens = lexer_tokenize(lexer);
  if (!tokens)
  {
    fprintf(stderr, "词法分析失败\n");
    lexer_free(lexer);
    return false;
  }

  // 检查词法错误
  status->token_count = tokens->size;
  if (lexer->errors->size > 0)
  {
    printf("词法分析发现 %d 个错误:\n", lexer->errors->size);
    for (int i = 0; i < lexer->errors->size; i++)
    {
      LexerError *error = arraylist_get(lexer->errors, i);
      printf("  错误 #%d: %s (第%d行第%d列)\n",
             i + 1, error->message, error->line, error->column);
    }
    status->error_count += lexer->errors->size;
  }
  else
  {
    printf("词法分析成功，生成了 %d 个标记\n", tokens->size);
    status->lexer_success = true;
  }

  clock_t end_lexer = clock();
  status->lexer_time = ((double)(end_lexer - start_lexer)) / CLOCKS_PER_SEC * 1000.0;
  printf("词法分析耗时: %.2f毫秒\n", status->lexer_time);

  // 输出所有标记（如果开启详细模式）
  if (verbose)
  {
    printf("\n标记列表:\n");
    for (int i = 0; i < tokens->size; i++)
    {
      Token *token = tokens->tokens[i];
      printf("  %d: [%s] '%s' (第%d行第%d列)\n",
             i, token_type_name(token->type), token->value,
             token->line, token->column);
    }
    printf("\n");
  }

  // 第2阶段: 语法分析
  printf("\n=== 阶段2: 语法分析 ===\n");
  clock_t start_parser = clock();

  Parser *parser = parser_create(tokens);
  if (!parser)
  {
    fprintf(stderr, "语法分析器创建失败\n");
    lexer_free(lexer);
    return false;
  }

  // 执行语法分析
  AstNode *ast = parser_parse(parser);
  if (!ast)
  {
    fprintf(stderr, "语法分析失败\n");
    parser_free(parser);
    lexer_free(lexer);
    return false;
  }

  // 检查语法错误
  if (parser->errors->size > 0)
  {
    printf("语法分析发现 %d 个错误:\n", parser->errors->size);
    for (int i = 0; i < parser->errors->size; i++)
    {
      ParserError *error = arraylist_get(parser->errors, i);
      printf("  错误 #%d: %s (第%d行第%d列)\n",
             i + 1, error->message, error->line, error->column);
    }
    status->error_count += parser->errors->size;
  }
  else
  {
    printf("语法分析成功，生成了AST\n");
    status->parser_success = true;
  }

  clock_t end_parser = clock();
  status->parser_time = ((double)(end_parser - start_parser)) / CLOCKS_PER_SEC * 1000.0;
  printf("语法分析耗时: %.2f毫秒\n", status->parser_time);

  // 输出AST（如果开启详细模式）
  if (verbose)
  {
    printf("\nAST结构:\n");
    ast_node_print(ast, 0);
    printf("\n");
  }

  // 第3阶段: 语义分析
  printf("\n=== 阶段3: 语义分析 ===\n");
  clock_t start_semantic = clock();

  SemanticAnalyzer *analyzer = semantic_analyzer_create();
  if (!analyzer)
  {
    fprintf(stderr, "语义分析器创建失败\n");
    parser_free(parser);
    lexer_free(lexer);
    return false;
  }

  // 执行语义分析
  bool semantic_ok = semantic_analyzer_analyze(analyzer, ast);

  // 检查语义错误
  ArrayList *semantic_errors = semantic_analyzer_get_errors(analyzer);
  ArrayList *semantic_warnings = semantic_analyzer_get_warnings(analyzer);

  if (semantic_errors && semantic_errors->size > 0)
  {
    printf("语义分析发现 %d 个错误:\n", semantic_errors->size);
    for (int i = 0; i < semantic_errors->size; i++)
    {
      char *error = arraylist_get(semantic_errors, i);
      printf("  错误 #%d: %s\n", i + 1, error);
    }
    status->error_count += semantic_errors->size;
  }

  if (semantic_warnings && semantic_warnings->size > 0)
  {
    printf("语义分析发现 %d 个警告:\n", semantic_warnings->size);
    for (int i = 0; i < semantic_warnings->size; i++)
    {
      char *warning = arraylist_get(semantic_warnings, i);
      printf("  警告 #%d: %s\n", i + 1, warning);
    }
  }

  if (semantic_ok)
  {
    printf("语义分析成功\n");
    status->semantic_success = true;
  }
  else
  {
    printf("语义分析失败\n");
  }

  // 获取符号表
  SymbolTable *symbol_table = semantic_analyzer_get_symbol_table(analyzer);

  clock_t end_semantic = clock();
  status->semantic_time = ((double)(end_semantic - start_semantic)) / CLOCKS_PER_SEC * 1000.0;
  printf("语义分析耗时: %.2f毫秒\n", status->semantic_time);

  // 输出符号表（如果开启详细模式）
  if (verbose && symbol_table)
  {
    printf("\n符号表:\n");
    symbol_table_print(symbol_table);
    printf("\n");
  }

  // 第4阶段: 代码优化
  printf("\n=== 阶段4: 代码优化 ===\n");
  clock_t start_optimizer = clock();

  OptimizerOptions optimizer_options;
  optimizer_options.enable_constant_folding = true;
  optimizer_options.enable_algebraic_simplification = true;
  optimizer_options.enable_common_subexpression = true;
  optimizer_options.enable_dead_code = true;
  optimizer_options.enable_control_flow = true;
  optimizer_options.max_optimization_passes = 3;
  optimizer_options.verbose = verbose;

  Optimizer *optimizer = optimizer_create(&optimizer_options);
  if (!optimizer)
  {
    fprintf(stderr, "代码优化器创建失败\n");
    semantic_analyzer_free(analyzer);
    parser_free(parser);
    lexer_free(lexer);
    return false;
  }

  // 执行代码优化
  OptimizationResult *opt_result = optimizer_optimize(optimizer, ast, symbol_table);
  if (!opt_result)
  {
    fprintf(stderr, "代码优化失败\n");
    optimizer_free(optimizer);
    semantic_analyzer_free(analyzer);
    parser_free(parser);
    lexer_free(lexer);
    return false;
  }

  // 检查优化错误
  if (opt_result->errors->size > 0)
  {
    printf("代码优化发现 %d 个错误:\n", opt_result->errors->size);
    for (int i = 0; i < opt_result->errors->size; i++)
    {
      char *error = arraylist_get(opt_result->errors, i);
      printf("  错误 #%d: %s\n", i + 1, error);
    }
    status->error_count += opt_result->errors->size;
  }

  if (opt_result->warnings->size > 0)
  {
    printf("代码优化发现 %d 个警告:\n", opt_result->warnings->size);
    for (int i = 0; i < opt_result->warnings->size; i++)
    {
      char *warning = arraylist_get(opt_result->warnings, i);
      printf("  警告 #%d: %s\n", i + 1, warning);
    }
  }

  if (opt_result->success)
  {
    printf("代码优化成功，进行了 %d 项优化\n", opt_result->stats.total_optimizations);
    status->optimizer_success = true;
  }
  else
  {
    printf("代码优化失败\n");
  }

  // 获取优化后的AST
  AstNode *optimized_ast = opt_result->optimized_ast;

  clock_t end_optimizer = clock();
  status->optimizer_time = ((double)(end_optimizer - start_optimizer)) / CLOCKS_PER_SEC * 1000.0;
  printf("代码优化耗时: %.2f毫秒\n", status->optimizer_time);

  // 输出优化报告（如果开启详细模式）
  if (verbose)
  {
    printf("\n优化报告:\n");
    optimizer_print_report(opt_result);
    printf("\n");
  }

  // 第5阶段: 代码生成
  printf("\n=== 阶段5: 代码生成 ===\n");
  clock_t start_codegen = clock();

  CodeGenOptions codegen_options;
  codegen_options.target_type = TARGET_STACK_VM;
  codegen_options.optimize_code = true;
  codegen_options.generate_comments = true;
  codegen_options.stack_size = 1024;
  codegen_options.debug_info = verbose;

  CodeGenerator *generator = codegen_create(&codegen_options);
  if (!generator)
  {
    fprintf(stderr, "代码生成器创建失败\n");
    optimization_result_free(opt_result);
    optimizer_free(optimizer);
    semantic_analyzer_free(analyzer);
    parser_free(parser);
    lexer_free(lexer);
    return false;
  }

  // 执行代码生成
  CodeGenResult *gen_result = codegen_generate(generator, optimized_ast, symbol_table);
  if (!gen_result)
  {
    fprintf(stderr, "代码生成失败\n");
    codegen_free(generator);
    optimization_result_free(opt_result);
    optimizer_free(optimizer);
    semantic_analyzer_free(analyzer);
    parser_free(parser);
    lexer_free(lexer);
    return false;
  }

  // 检查代码生成错误
  if (gen_result->errors->size > 0)
  {
    printf("代码生成发现 %d 个错误:\n", gen_result->errors->size);
    for (int i = 0; i < gen_result->errors->size; i++)
    {
      char *error = arraylist_get(gen_result->errors, i);
      printf("  错误 #%d: %s\n", i + 1, error);
    }
    status->error_count += gen_result->errors->size;
  }

  if (gen_result->warnings->size > 0)
  {
    printf("代码生成发现 %d 个警告:\n", gen_result->warnings->size);
    for (int i = 0; i < gen_result->warnings->size; i++)
    {
      char *warning = arraylist_get(gen_result->warnings, i);
      printf("  警告 #%d: %s\n", i + 1, warning);
    }
  }

  if (gen_result->success)
  {
    printf("代码生成成功，生成了 %d 条指令\n", gen_result->statistics.instruction_count);
    status->codegen_success = true;
  }
  else
  {
    printf("代码生成失败\n");
  }

  // 将生成的汇编代码写入文件
  if (gen_result->assembly)
  {
    FILE *out_file = fopen(output_file, "w");
    if (out_file)
    {
      fprintf(out_file, "%s", gen_result->assembly);
      fclose(out_file);
      printf("已将生成的汇编代码写入文件: %s\n", output_file);
    }
    else
    {
      fprintf(stderr, "无法写入输出文件: %s\n", output_file);
    }
  }

  clock_t end_codegen = clock();
  status->codegen_time = ((double)(end_codegen - start_codegen)) / CLOCKS_PER_SEC * 1000.0;
  printf("代码生成耗时: %.2f毫秒\n", status->codegen_time);

  // 输出代码生成报告（如果开启详细模式）
  if (verbose)
  {
    printf("\n代码生成报告:\n");
    codegen_print_report(gen_result);
    printf("\n");
  }

  // 释放资源
  codegen_result_free(gen_result);
  codegen_free(generator);
  optimization_result_free(opt_result);
  optimizer_free(optimizer);
  semantic_analyzer_free(analyzer);
  parser_free(parser);
  lexer_free(lexer);

  // 计算总耗时
  clock_t end_total = clock();
  status->total_time = ((double)(end_total - start_total)) / CLOCKS_PER_SEC * 1000.0;

  // 输出总结
  printf("\n=== 编译总结 ===\n");
  printf("词法分析: %s\n", status->lexer_success ? "成功" : "失败");
  printf("语法分析: %s\n", status->parser_success ? "成功" : "失败");
  printf("语义分析: %s\n", status->semantic_success ? "成功" : "失败");
  printf("代码优化: %s\n", status->optimizer_success ? "成功" : "失败");
  printf("代码生成: %s\n", status->codegen_success ? "成功" : "失败");
  printf("总耗时: %.2f毫秒\n", status->total_time);
  printf("总错误数: %d\n", status->error_count);

  return status->error_count == 0;
}

// 运行单个测试用例
static void run_test(const char *test_name, const char *source_code)
{
  printf("\n***** 测试用例: %s *****\n", test_name);

  char output_file[256];
  snprintf(output_file, sizeof(output_file), "%s.asm", test_name);

  TestStatus status;
  bool success = compile_source(source_code, output_file, true, &status);

  printf("测试结果: %s\n", success ? "通过" : "失败");
  if (!success)
  {
    error_count++;
  }

  printf("***********************\n");
}

// 简单的测试用例
static void run_simple_tests()
{
  // 测试1: 简单的算术表达式
  run_test("test1_arithmetic", "var a = 10;\nvar b = 20;\nvar c = a + b * 2;\n");

  // 测试2: 条件语句
  run_test("test2_condition", "var x = 10;\nif (x > 5) {\n  var y = 20;\n} else {\n  var y = 0;\n}\n");

  // 测试3: 循环语句
  run_test("test3_loop", "var sum = 0;\nvar i = 1;\nwhile (i <= 10) {\n  sum = sum + i;\n  i = i + 1;\n}\n");

  // 测试4: 函数定义和调用
  run_test("test4_function", "function add(a, b) {\n  return a + b;\n}\nvar result = add(10, 20);\n");

  // 测试5: 嵌套循环
  run_test("test5_nested_loop", "var result = 0;\nvar i = 0;\nwhile (i < 5) {\n  var j = 0;\n  while (j < 5) {\n    result = result + i * j;\n    j = j + 1;\n  }\n  i = i + 1;\n}\n");

  // 测试6: 复杂算术表达式
  run_test("test6_complex_arithmetic", "var a = 5;\nvar b = 10;\nvar c = 15;\nvar result = (a + b) * c / (a + 1) - b;\n");

  // 测试7: 变量作用域
  run_test("test7_variable_scope", "var x = 10;\nfunction test() {\n  var x = 20;\n  var y = x + 5;\n  return y;\n}\nvar z = test();\nvar w = x + z;\n");

  // 测试8: 布尔表达式
  run_test("test8_boolean_expr", "var a = 5;\nvar b = 10;\nvar result = (a < b) && (a + 5 >= b) || (a == b);\n");

  // 测试9: 函数递归
  run_test("test9_recursion", "function factorial(n) {\n  if (n <= 1) {\n    return 1;\n  } else {\n    return n * factorial(n - 1);\n  }\n}\nvar result = factorial(5);\n");

  // 测试10: 错误处理
  run_test("test10_error", "var a = b + 10;\nvar 123invalid = 10;\nif (a > b {\n  a = 20;\n}\n");
}

// 主函数
int main(int argc, char **argv)
{
  printf("编译器测试框架\n");
  printf("==============\n");

  // 设置随机数种子
  srand((unsigned)time(NULL));

  // 运行内置测试用例
  run_simple_tests();

  // 从文件中读取源代码（如果提供了文件路径）
  if (argc > 1)
  {
    const char *input_file = argv[1];
    const char *output_file = argc > 2 ? argv[2] : "output.asm";

    printf("\n编译文件: %s\n", input_file);

    // 读取源文件
    FILE *file = fopen(input_file, "r");
    if (!file)
    {
      fprintf(stderr, "无法打开文件: %s\n", input_file);
      return 1;
    }

    // 获取文件大小
    fseek(file, 0, SEEK_END);
    long file_size = ftell(file);
    fseek(file, 0, SEEK_SET);

    // 读取文件内容
    char *source = (char *)malloc(file_size + 1);
    if (!source)
    {
      fprintf(stderr, "内存分配失败\n");
      fclose(file);
      return 1;
    }

    size_t read_size = fread(source, 1, file_size, file);
    source[read_size] = '\0';
    fclose(file);

    // 编译源代码
    TestStatus status;
    bool success = compile_source(source, output_file, true, &status);

    free(source);

    // 输出结果
    printf("\n编译结果: %s\n", success ? "成功" : "失败");
    return success ? 0 : 1;
  }

  // 输出测试结果
  printf("\n总结: 执行了10个测试用例，%d个失败\n", error_count);

  return error_count > 0 ? 1 : 0;
}