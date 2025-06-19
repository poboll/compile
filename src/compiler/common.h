/**
 * 编译器公共头文件 - common.h
 * @description 定义编译器各模块共享的数据结构、常量和工具函数
 *              提供统一的基础设施和公共接口
 * @module compiler/common
 * @author poboll
 * @date 2025
 * @version 1.0
 *
 * 主要功能：
 * 1. 定义错误处理和日志记录结构
 * 2. 定义编译器常量和配置参数
 * 3. 提供公共工具函数和宏定义
 * 4. 统一内存管理和错误处理机制
 * 5. 定义跨模块的数据类型和接口
 * 6. 提供调试和诊断支持
 */

#ifndef COMPILER_COMMON_H
#define COMPILER_COMMON_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdarg.h>
#include <ctype.h>

// 错误类型
typedef enum
{
  ERROR_LEXICAL,   // 词法错误
  ERROR_SYNTAX,    // 语法错误
  ERROR_SEMANTIC,  // 语义错误
  ERROR_OPTIMIZER, // 优化错误
  ERROR_CODEGEN,   // 代码生成错误
  ERROR_INTERNAL   // 内部错误
} ErrorType;

// 错误信息结构
typedef struct
{
  ErrorType type; // 错误类型
  char *message;  // 错误消息
  int line;       // 行号
  int column;     // 列号
  char *context;  // 上下文信息（可选）
} ErrorInfo;

// 日志级别
typedef enum
{
  LOG_DEBUG,
  LOG_INFO,
  LOG_WARNING,
  LOG_ERROR
} LogLevel;

// 日志记录函数
void log_message(LogLevel level, const char *format, ...);

// 内存分配工具
void *safe_malloc(size_t size);
void *safe_realloc(void *ptr, size_t size);
char *safe_strdup(const char *str);

// 字符串工具函数
char *str_concat(const char *str1, const char *str2);
char *str_substring(const char *str, int start, int length);

// 哈希表实现（简单）
typedef struct HashEntry
{
  char *key;
  void *value;
  struct HashEntry *next;
} HashEntry;

typedef struct
{
  HashEntry **entries;
  int size;
  int capacity;
} HashMap;

HashMap *hashmap_create(int initial_capacity);
void hashmap_put(HashMap *map, const char *key, void *value);
void *hashmap_get(HashMap *map, const char *key);
bool hashmap_contains(HashMap *map, const char *key);
void hashmap_remove(HashMap *map, const char *key);
void hashmap_free(HashMap *map, void (*value_free)(void *));

// 动态数组实现
typedef struct
{
  void **items;
  int size;
  int capacity;
} ArrayList;

ArrayList *arraylist_create(int initial_capacity);
void arraylist_add(ArrayList *list, void *item);
void *arraylist_get(ArrayList *list, int index);
void arraylist_free(ArrayList *list, void (*item_free)(void *));

// 文件读取工具
char *read_file(const char *filename);

// 版本信息
#define COMPILER_VERSION "1.0.0"
#define COMPILER_NAME "Simple C Compiler"

#endif /* COMPILER_COMMON_H */