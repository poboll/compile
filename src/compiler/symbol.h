/**
 * 符号表定义和实现
 *
 * 功能：
 * 1. 定义符号表结构用于存储变量、函数等符号信息
 * 2. 提供符号表的创建、查找和管理功能
 *
 * 作者：poboll
 * 日期：2025-06-05
 */

#ifndef COMPILER_SYMBOL_H
#define COMPILER_SYMBOL_H

#include "common.h"
#include "token.h"

// 符号类型
typedef enum
{
    SYMBOL_VARIABLE,  // 变量
    SYMBOL_FUNCTION,  // 函数
    SYMBOL_PARAMETER, // 函数参数
} SymbolType;

// 数据类型
typedef enum
{
    TYPE_VOID,
    TYPE_INT,
    TYPE_CHAR,
    TYPE_FLOAT,
    TYPE_STRING,
    TYPE_BOOL,
    TYPE_ERROR, // 用于错误处理
} DataType;

// 符号信息
typedef struct Symbol
{
    char *name;         // 符号名称
    SymbolType type;    // 符号类型
    DataType data_type; // 数据类型
    int scope_level;    // 作用域层级
    int line;           // 定义行号

    // 函数特有字段
    ArrayList *params; // 参数列表 (仅对函数有效)
    bool is_defined;   // 函数是否已定义 (与声明区分)
} Symbol;

// 作用域
typedef struct Scope
{
    HashMap *symbols;     // 该作用域的符号表
    struct Scope *parent; // 父作用域
    int level;            // 作用域层级 (0为全局)
} Scope;

// 符号表
typedef struct
{
    Scope *current;    // 当前作用域
    ArrayList *errors; // 语义错误列表
} SymbolTable;

// 符号表操作函数
SymbolTable *symbol_table_create();
void symbol_table_free(SymbolTable *table);

// 作用域管理
void enter_scope(SymbolTable *table);
void exit_scope(SymbolTable *table);

// 符号操作
Symbol *define_symbol(SymbolTable *table, const char *name, SymbolType symbol_type,
                      DataType data_type, int line);
Symbol *lookup_symbol(SymbolTable *table, const char *name);
Symbol *lookup_symbol_in_current_scope(SymbolTable *table, const char *name);

// 错误处理
void add_semantic_error(SymbolTable *table, const char *format, ...);

// 数据类型名称转换
const char *data_type_to_string(DataType type);

#endif // COMPILER_SYMBOL_H