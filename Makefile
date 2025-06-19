# 编译器项目Makefile
# @author poboll
# @date 2025-06-05

# 编译器和标志
CC = gcc
CFLAGS = -g -Wall -Isrc
LDFLAGS =

# 目标文件
TARGET = compiler

# 源代码目录
SRC_DIR = src
COMPILER_DIR = $(SRC_DIR)/compiler

# 查找所有 .c 源文件
SOURCES = $(wildcard $(SRC_DIR)/*.c) \
          $(wildcard $(COMPILER_DIR)/*.c)

# 根据源文件生成 .o 目标文件列表
OBJECTS = $(SOURCES:.c=.o)

# 编译器设置
CFLAGS += -std=c11 -O2

# 目标文件
TEST_TARGET = compiler_test

# 源文件目录
TEST_DIR = $(SRC_DIR)/tests

# 编译输出目录
BIN_DIR = bin
OBJ_DIR = obj

# 源文件
COMMON_SRC = $(COMPILER_DIR)/common.c
LEXER_SRC = $(COMPILER_DIR)/lexer/lexer.c
PARSER_SRC = $(COMPILER_DIR)/parser/parser.c
SEMANTIC_SRC = $(COMPILER_DIR)/semantic/semantic.c
OPTIMIZER_SRC = $(COMPILER_DIR)/optimizer/optimizer.c
CODEGEN_SRC = $(COMPILER_DIR)/codegen/codegen.c
TEST_SRC = $(TEST_DIR)/compiler_test.c

# 对象文件
COMMON_OBJ = $(OBJ_DIR)/common.o
LEXER_OBJ = $(OBJ_DIR)/lexer.o
PARSER_OBJ = $(OBJ_DIR)/parser.o
SEMANTIC_OBJ = $(OBJ_DIR)/semantic.o
OPTIMIZER_OBJ = $(OBJ_DIR)/optimizer.o
CODEGEN_OBJ = $(OBJ_DIR)/codegen.o
TEST_OBJ = $(OBJ_DIR)/compiler_test.o

# 所有对象文件
OBJS = $(COMMON_OBJ) $(LEXER_OBJ) $(PARSER_OBJ) $(SEMANTIC_OBJ) $(OPTIMIZER_OBJ) $(CODEGEN_OBJ)
TEST_OBJS = $(TEST_OBJ) $(OBJS)

# --- 规则 ---

# 默认目标
all: $(TARGET)

# 链接目标文件生成最终可执行文件
$(TARGET): $(OBJECTS)
	$(CC) $(LDFLAGS) -o $@ $^

# 编译 .c 文件为 .o 文件
# 特别为 optimizer.o 添加额外的包含路径
$(OBJ_DIR)/optimizer.o: $(OPTIMIZER_SRC)
	$(CC) $(CFLAGS) -I$(COMPILER_DIR) -c -o $@ $<

# 其他 .o 文件的通用规则
$(OBJ_DIR)/%.o: $(SRC_DIR)/%.c
	$(CC) $(CFLAGS) -c -o $@ $<

$(OBJ_DIR)/%.o: $(COMPILER_DIR)/%.c
	$(CC) $(CFLAGS) -c -o $@ $<

$(OBJ_DIR)/%.o: $(SEMANTIC_DIR)/%.c
	$(CC) $(CFLAGS) -I$(COMPILER_DIR) -c -o $@ $<

# 测试程序
$(BIN_DIR)/$(TEST_TARGET): $(TEST_OBJS)
	$(CC) $(CFLAGS) -o $@ $^ $(LDFLAGS)

# 清理生成的文件
clean:
	rm -f $(TARGET) $(OBJECTS) output output.c

# 运行测试
test: all
	./$(TARGET) tests/test_code.c
	@echo "\n--- 编译生成的 C 代码 ---"
	@cat output.c
	@echo "\n--- 运行生成的 C 代码 ---"
	@$(CC) -o output output.c
	@./output

# 安装
install: $(TARGET)
	@mkdir -p /usr/local/bin
	cp $(TARGET) /usr/local/bin/

# 卸载
uninstall:
	rm -f /usr/local/bin/$(TARGET)

# 重新编译
rebuild: clean all

# 调试构建
debug: CFLAGS += -DDEBUG
debug: all

# 发布构建
release: CFLAGS += -DNDEBUG -O3
release: all

# 目标声明为伪目标
.PHONY: all clean test install uninstall rebuild debug release 