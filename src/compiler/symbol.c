/**
 * 符号表实现
 *
 * 功能：
 * 1. 实现符号表的操作函数
 * 2. 管理作用域和符号的查找
 *
 * 作者：poboll
 * 日期：2025-06-05
 */

#include "symbol.h"

// 创建新符号表
SymbolTable *symbol_table_create()
{
    SymbolTable *table = (SymbolTable *)safe_malloc(sizeof(SymbolTable));

    // 创建全局作用域
    Scope *global_scope = (Scope *)safe_malloc(sizeof(Scope));
    global_scope->symbols = hashmap_create(16);
    global_scope->parent = NULL;
    global_scope->level = 0;

    table->current = global_scope;
    table->errors = arraylist_create(8);

    return table;
}

// 释放符号表
void symbol_table_free(SymbolTable *table)
{
    if (table == NULL)
    {
        return;
    }

    // 释放所有作用域 (递归返回到全局作用域)
    while (table->current != NULL)
    {
        Scope *parent = table->current->parent;

        // 释放符号表中的符号
        // TODO: 实现符号的释放
        hashmap_free(table->current->symbols, free);

        free(table->current);
        table->current = parent;
    }

    // 释放错误列表
    for (int i = 0; i < table->errors->size; i++)
    {
        free(arraylist_get(table->errors, i));
    }
    arraylist_free(table->errors, NULL);

    free(table);
}

// 进入新作用域
void enter_scope(SymbolTable *table)
{
    Scope *new_scope = (Scope *)safe_malloc(sizeof(Scope));
    new_scope->symbols = hashmap_create(8);
    new_scope->parent = table->current;
    new_scope->level = table->current->level + 1;

    table->current = new_scope;
}

// 退出当前作用域
void exit_scope(SymbolTable *table)
{
    if (table->current->parent == NULL)
    {
        // 已经在全局作用域，不能再退出
        return;
    }

    Scope *old_scope = table->current;
    table->current = old_scope->parent;

    // 释放旧作用域
    hashmap_free(old_scope->symbols, free);
    free(old_scope);
}

// 在当前作用域定义新符号
Symbol *define_symbol(SymbolTable *table, const char *name, SymbolType symbol_type,
                      DataType data_type, int line)
{
    // 检查当前作用域是否已存在同名符号
    if (hashmap_contains(table->current->symbols, name))
    {
        add_semantic_error(table, "重定义符号 '%s' (行 %d)", name, line);
        return NULL;
    }

    // 创建新符号
    Symbol *symbol = (Symbol *)safe_malloc(sizeof(Symbol));
    symbol->name = safe_strdup(name);
    symbol->type = symbol_type;
    symbol->data_type = data_type;
    symbol->scope_level = table->current->level;
    symbol->line = line;

    if (symbol_type == SYMBOL_FUNCTION)
    {
        symbol->params = arraylist_create(4);
        symbol->is_defined = false;
    }
    else
    {
        symbol->params = NULL;
        symbol->is_defined = true;
    }

    // 添加到当前作用域
    hashmap_put(table->current->symbols, name, symbol);

    return symbol;
}

// 在所有可见作用域中查找符号
Symbol *lookup_symbol(SymbolTable *table, const char *name)
{
    Scope *scope = table->current;

    while (scope != NULL)
    {
        Symbol *symbol = (Symbol *)hashmap_get(scope->symbols, name);
        if (symbol != NULL)
        {
            return symbol;
        }

        scope = scope->parent;
    }

    return NULL; // 未找到符号
}

// 仅在当前作用域查找符号
Symbol *lookup_symbol_in_current_scope(SymbolTable *table, const char *name)
{
    return (Symbol *)hashmap_get(table->current->symbols, name);
}

// 添加语义错误
void add_semantic_error(SymbolTable *table, const char *format, ...)
{
    va_list args;
    va_start(args, format);

    // 创建错误消息
    char buffer[256];
    vsnprintf(buffer, sizeof(buffer), format, args);

    // 添加到错误列表
    arraylist_add(table->errors, safe_strdup(buffer));

    va_end(args);
}

// 数据类型转字符串
const char *data_type_to_string(DataType type)
{
    switch (type)
    {
    case TYPE_VOID:
        return "void";
    case TYPE_INT:
        return "int";
    case TYPE_CHAR:
        return "char";
    case TYPE_FLOAT:
        return "float";
    case TYPE_STRING:
        return "string";
    case TYPE_BOOL:
        return "bool";
    case TYPE_ERROR:
        return "error";
    default:
        return "unknown";
    }
}