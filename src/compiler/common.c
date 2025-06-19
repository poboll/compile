/**
 * 编译器公共函数实现
 *
 * 功能：
 * 1. 实现错误处理和日志记录
 * 2. 实现内存安全的工具函数
 * 3. 实现哈希表和动态数组等数据结构
 *
 * 作者：poboll
 * 日期：2025-06-05
 */

#include "common.h"

// 日志记录实现
void log_message(LogLevel level, const char *format, ...)
{
  const char *level_str;
  FILE *output = stdout;

  switch (level)
  {
  case LOG_DEBUG:
    level_str = "DEBUG";
    break;
  case LOG_INFO:
    level_str = "INFO";
    break;
  case LOG_WARNING:
    level_str = "WARNING";
    break;
  case LOG_ERROR:
    level_str = "ERROR";
    output = stderr;
    break;
  default:
    level_str = "UNKNOWN";
    break;
  }

  // 输出日志级别前缀
  fprintf(output, "[%s] ", level_str);

  // 处理可变参数
  va_list args;
  va_start(args, format);
  vfprintf(output, format, args);
  va_end(args);

  fprintf(output, "\n");
}

// 安全内存分配
void *safe_malloc(size_t size)
{
  void *ptr = malloc(size);
  if (!ptr)
  {
    log_message(LOG_ERROR, "内存分配失败 (大小: %zu)", size);
    exit(EXIT_FAILURE);
  }
  return ptr;
}

void *safe_realloc(void *ptr, size_t size)
{
  void *new_ptr = realloc(ptr, size);
  if (!new_ptr)
  {
    log_message(LOG_ERROR, "内存重分配失败 (大小: %zu)", size);
    exit(EXIT_FAILURE);
  }
  return new_ptr;
}

char *safe_strdup(const char *str)
{
  if (!str)
    return NULL;

  size_t len = strlen(str) + 1;
  char *new_str = (char *)safe_malloc(len);
  memcpy(new_str, str, len);
  return new_str;
}

// 字符串工具函数
char *str_concat(const char *str1, const char *str2)
{
  if (!str1)
    return safe_strdup(str2);
  if (!str2)
    return safe_strdup(str1);

  size_t len1 = strlen(str1);
  size_t len2 = strlen(str2);

  char *result = (char *)safe_malloc(len1 + len2 + 1);
  memcpy(result, str1, len1);
  memcpy(result + len1, str2, len2 + 1); // +1 to include null terminator

  return result;
}

char *str_substring(const char *str, int start, int length)
{
  if (!str)
    return NULL;

  size_t str_len = strlen(str);

  // 检查范围
  if (start < 0)
    start = 0;
  if (start >= str_len)
    return safe_strdup("");
  if (length < 0 || start + length > str_len)
  {
    length = str_len - start;
  }

  char *result = (char *)safe_malloc(length + 1);
  memcpy(result, str + start, length);
  result[length] = '\0';

  return result;
}

// 哈希表实现
#define HASHMAP_INITIAL_CAPACITY 16
#define HASHMAP_LOAD_FACTOR 0.75

// 简单哈希函数
static unsigned int hash_string(const char *str)
{
  unsigned int hash = 5381;
  int c;

  while ((c = *str++))
    hash = ((hash << 5) + hash) + c; /* hash * 33 + c */

  return hash;
}

HashMap *hashmap_create(int initial_capacity)
{
  if (initial_capacity <= 0)
    initial_capacity = HASHMAP_INITIAL_CAPACITY;

  HashMap *map = (HashMap *)safe_malloc(sizeof(HashMap));
  map->capacity = initial_capacity;
  map->size = 0;
  map->entries = (HashEntry **)safe_malloc(sizeof(HashEntry *) * initial_capacity);

  // 初始化为NULL
  for (int i = 0; i < initial_capacity; i++)
  {
    map->entries[i] = NULL;
  }

  return map;
}

void hashmap_put(HashMap *map, const char *key, void *value)
{
  if (!map || !key)
    return;

  // 计算哈希值
  unsigned int hash = hash_string(key) % map->capacity;

  // 查找是否已存在
  HashEntry *entry = map->entries[hash];
  while (entry)
  {
    if (strcmp(entry->key, key) == 0)
    {
      // 更新现有值
      entry->value = value;
      return;
    }
    entry = entry->next;
  }

  // 创建新条目
  HashEntry *new_entry = (HashEntry *)safe_malloc(sizeof(HashEntry));
  new_entry->key = safe_strdup(key);
  new_entry->value = value;
  new_entry->next = map->entries[hash];
  map->entries[hash] = new_entry;
  map->size++;

  // 检查是否需要扩容
  if (map->size > map->capacity * HASHMAP_LOAD_FACTOR)
  {
    // 实际项目中应该实现扩容，但简化版本可以省略
    log_message(LOG_WARNING, "HashMap负载因子已超过阈值，建议扩容");
  }
}

void *hashmap_get(HashMap *map, const char *key)
{
  if (!map || !key)
    return NULL;

  unsigned int hash = hash_string(key) % map->capacity;

  HashEntry *entry = map->entries[hash];
  while (entry)
  {
    if (strcmp(entry->key, key) == 0)
    {
      return entry->value;
    }
    entry = entry->next;
  }

  return NULL;
}

bool hashmap_contains(HashMap *map, const char *key)
{
  if (!map || !key)
    return false;

  unsigned int hash = hash_string(key) % map->capacity;

  HashEntry *entry = map->entries[hash];
  while (entry)
  {
    if (strcmp(entry->key, key) == 0)
    {
      return true;
    }
    entry = entry->next;
  }

  return false;
}

void hashmap_remove(HashMap *map, const char *key)
{
  if (!map || !key)
    return;

  unsigned int hash = hash_string(key) % map->capacity;

  HashEntry *entry = map->entries[hash];
  HashEntry *prev = NULL;

  while (entry)
  {
    if (strcmp(entry->key, key) == 0)
    {
      if (prev)
      {
        prev->next = entry->next;
      }
      else
      {
        map->entries[hash] = entry->next;
      }

      free(entry->key);
      free(entry);
      map->size--;
      return;
    }

    prev = entry;
    entry = entry->next;
  }
}

void hashmap_free(HashMap *map, void (*value_free)(void *))
{
  if (!map)
    return;

  for (int i = 0; i < map->capacity; i++)
  {
    HashEntry *entry = map->entries[i];
    while (entry)
    {
      HashEntry *next = entry->next;

      if (value_free)
      {
        value_free(entry->value);
      }

      free(entry->key);
      free(entry);
      entry = next;
    }
  }

  free(map->entries);
  free(map);
}

// 动态数组实现
#define ARRAYLIST_INITIAL_CAPACITY 10
#define ARRAYLIST_GROWTH_FACTOR 1.5

ArrayList *arraylist_create(int initial_capacity)
{
  if (initial_capacity <= 0)
    initial_capacity = ARRAYLIST_INITIAL_CAPACITY;

  ArrayList *list = (ArrayList *)safe_malloc(sizeof(ArrayList));
  list->capacity = initial_capacity;
  list->size = 0;
  list->items = (void **)safe_malloc(sizeof(void *) * initial_capacity);

  return list;
}

void arraylist_add(ArrayList *list, void *item)
{
  if (!list)
    return;

  // 检查是否需要扩容
  if (list->size >= list->capacity)
  {
    int new_capacity = (int)(list->capacity * ARRAYLIST_GROWTH_FACTOR);
    list->items = (void **)safe_realloc(list->items, sizeof(void *) * new_capacity);
    list->capacity = new_capacity;
  }

  list->items[list->size++] = item;
}

void *arraylist_get(ArrayList *list, int index)
{
  if (!list || index < 0 || index >= list->size)
  {
    return NULL;
  }

  return list->items[index];
}

void arraylist_free(ArrayList *list, void (*item_free)(void *))
{
  if (!list)
    return;

  if (item_free)
  {
    for (int i = 0; i < list->size; i++)
    {
      if (list->items[i])
      {
        item_free(list->items[i]);
      }
    }
  }

  free(list->items);
  free(list);
}

// 文件读取工具
char *read_file(const char *filename)
{
  FILE *file = fopen(filename, "r");
  if (!file)
  {
    log_message(LOG_ERROR, "无法打开文件：%s", filename);
    return NULL;
  }

  // 获取文件大小
  fseek(file, 0, SEEK_END);
  long size = ftell(file);
  fseek(file, 0, SEEK_SET);

  // 分配内存
  char *buffer = (char *)safe_malloc(size + 1);

  // 读取文件内容
  size_t read_size = fread(buffer, 1, size, file);
  buffer[read_size] = '\0';

  fclose(file);
  return buffer;
}