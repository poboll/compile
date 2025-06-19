#!/bin/bash

# 语义分析器测试运行脚本
# 提供交互式菜单来运行各种语义分析测试

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 检查必要文件
check_files() {
    local missing_files=()
    
    if [[ ! -f "$SCRIPT_DIR/run-semantic.js" ]]; then
        missing_files+=("run-semantic.js")
    fi
    
    if [[ ! -f "$SCRIPT_DIR/test-single-semantic.js" ]]; then
        missing_files+=("test-single-semantic.js")
    fi
    
    if [[ ! -f "$SCRIPT_DIR/semantic.js" ]]; then
        missing_files+=("semantic.js")
    fi
    
    if [[ ${#missing_files[@]} -gt 0 ]]; then
        echo -e "${RED}错误: 缺少必要文件:${NC}"
        for file in "${missing_files[@]}"; do
            echo -e "  ${RED}✗${NC} $file"
        done
        echo
        echo -e "${YELLOW}请确保在正确的目录运行此脚本。${NC}"
        return 1
    fi
    
    return 0
}

# 检查Node.js
check_nodejs() {
    if ! command -v node &> /dev/null; then
        echo -e "${RED}错误: 未找到 Node.js${NC}"
        echo -e "${YELLOW}请安装 Node.js 后再运行此脚本。${NC}"
        return 1
    fi
    
    local node_version=$(node --version)
    echo -e "${GREEN}✓${NC} Node.js 版本: $node_version"
    return 0
}

# 显示标题
show_header() {
    clear
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                    语义分析器测试工具                        ║${NC}"
    echo -e "${CYAN}║                  Semantic Analyzer Test Tool                 ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo
}

# 显示主菜单
show_main_menu() {
    echo -e "${BLUE}请选择要执行的操作:${NC}"
    echo
    echo -e "  ${GREEN}1.${NC} 运行完整语义分析测试套件"
    echo -e "  ${GREEN}2.${NC} 运行默认单个代码测试"
    echo -e "  ${GREEN}3.${NC} 运行自定义代码测试"
    echo -e "  ${GREEN}4.${NC} 运行预定义错误代码测试"
    echo -e "  ${GREEN}5.${NC} 显示帮助信息"
    echo -e "  ${GREEN}6.${NC} 查看语义分析器状态"
    echo -e "  ${RED}0.${NC} 退出"
    echo
    echo -e -n "${YELLOW}请输入选项 [0-6]: ${NC}"
}

# 运行完整测试套件
run_full_tests() {
    echo -e "${BLUE}正在运行完整语义分析测试套件...${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    
    cd "$SCRIPT_DIR"
    node run-semantic.js
    local exit_code=$?
    
    echo
    if [[ $exit_code -eq 0 ]]; then
        echo -e "${GREEN}✓ 测试套件执行完成${NC}"
    else
        echo -e "${RED}✗ 测试套件执行失败 (退出码: $exit_code)${NC}"
    fi
    
    return $exit_code
}

# 运行默认单个测试
run_default_single_test() {
    echo -e "${BLUE}正在运行默认单个代码语义分析测试...${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    
    cd "$SCRIPT_DIR"
    node test-single-semantic.js
    local exit_code=$?
    
    echo
    if [[ $exit_code -eq 0 ]]; then
        echo -e "${GREEN}✓ 默认测试执行完成${NC}"
    else
        echo -e "${RED}✗ 默认测试执行失败 (退出码: $exit_code)${NC}"
    fi
    
    return $exit_code
}

# 运行自定义代码测试
run_custom_test() {
    echo -e "${BLUE}自定义代码语义分析测试${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    echo
    echo -e "${YELLOW}请输入要分析的代码 (输入 'quit' 退出):${NC}"
    echo -e "${CYAN}提示: 可以输入多行代码，以空行结束输入${NC}"
    echo
    
    local code_lines=()
    local line
    
    while true; do
        read -r line
        
        if [[ "$line" == "quit" ]]; then
            echo -e "${YELLOW}已取消自定义测试${NC}"
            return 0
        fi
        
        if [[ -z "$line" ]] && [[ ${#code_lines[@]} -gt 0 ]]; then
            break
        fi
        
        if [[ -n "$line" ]]; then
            code_lines+=("$line")
        fi
    done
    
    if [[ ${#code_lines[@]} -eq 0 ]]; then
        echo -e "${RED}错误: 未输入任何代码${NC}"
        return 1
    fi
    
    # 合并代码行
    local code=$(printf "%s\n" "${code_lines[@]}")
    
    echo -e "${BLUE}正在分析自定义代码...${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    
    cd "$SCRIPT_DIR"
    node test-single-semantic.js "$code"
    local exit_code=$?
    
    echo
    if [[ $exit_code -eq 0 ]]; then
        echo -e "${GREEN}✓ 自定义代码分析完成${NC}"
    else
        echo -e "${RED}✗ 自定义代码分析失败 (退出码: $exit_code)${NC}"
    fi
    
    return $exit_code
}

# 运行预定义错误代码测试
run_error_tests() {
    echo -e "${BLUE}预定义错误代码语义分析测试${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    echo
    
    local error_codes=(
        "let x = 10; let x = 20;"  # 变量重复声明
        "console.log(undeclaredVar);"  # 未声明变量
        "function test(a, a) { return a; }"  # 参数重复
        "{ let y = 5; } console.log(y);"  # 作用域外访问
        "const z; z = 10;"  # const未初始化
    )
    
    local error_names=(
        "变量重复声明错误"
        "未声明变量使用错误"
        "函数参数重复错误"
        "作用域外访问错误"
        "const未初始化错误"
    )
    
    cd "$SCRIPT_DIR"
    
    for i in "${!error_codes[@]}"; do
        echo -e "${CYAN}测试 $((i+1)): ${error_names[i]}${NC}"
        echo -e "${YELLOW}代码: ${error_codes[i]}${NC}"
        echo
        
        node test-single-semantic.js "${error_codes[i]}"
        
        echo -e "${PURPLE}─────────────────────────────────────────────────────────────${NC}"
        echo
    done
    
    echo -e "${GREEN}✓ 所有错误测试用例执行完成${NC}"
}

# 显示帮助信息
show_help() {
    echo -e "${BLUE}语义分析器测试工具帮助${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    echo
    echo -e "${GREEN}功能说明:${NC}"
    echo -e "  ${CYAN}•${NC} 完整测试套件: 运行所有预定义的语义分析测试用例"
    echo -e "  ${CYAN}•${NC} 单个代码测试: 快速测试单个代码片段的语义分析"
    echo -e "  ${CYAN}•${NC} 自定义测试: 输入自定义代码进行语义分析"
    echo -e "  ${CYAN}•${NC} 错误测试: 测试各种语义错误的检测能力"
    echo
    echo -e "${GREEN}支持的语义检查:${NC}"
    echo -e "  ${CYAN}•${NC} 作用域管理和变量可见性"
    echo -e "  ${CYAN}•${NC} 符号表构建和查找"
    echo -e "  ${CYAN}•${NC} 变量重复声明检测"
    echo -e "  ${CYAN}•${NC} 未声明变量使用检测"
    echo -e "  ${CYAN}•${NC} 函数参数重复检测"
    echo -e "  ${CYAN}•${NC} 类型检查和推断"
    echo
    echo -e "${GREEN}输出信息:${NC}"
    echo -e "  ${CYAN}•${NC} 符号表结构和内容"
    echo -e "  ${CYAN}•${NC} 语义分析统计信息"
    echo -e "  ${CYAN}•${NC} 错误和警告报告"
    echo -e "  ${CYAN}•${NC} 性能分析数据"
    echo
    echo -e "${GREEN}直接命令行使用:${NC}"
    echo -e "  ${YELLOW}node run-semantic.js${NC}                    # 运行完整测试套件"
    echo -e "  ${YELLOW}node test-single-semantic.js${NC}            # 运行默认测试"
    echo -e "  ${YELLOW}node test-single-semantic.js "code"${NC}      # 测试指定代码"
    echo -e "  ${YELLOW}node test-single-semantic.js --help${NC}      # 显示帮助"
}

# 查看语义分析器状态
show_analyzer_status() {
    echo -e "${BLUE}语义分析器状态检查${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    echo
    
    cd "$SCRIPT_DIR"
    
    # 检查核心文件
    echo -e "${GREEN}核心文件状态:${NC}"
    local files=("semantic.js" "symbol-table.js" "type-checker.js")
    for file in "${files[@]}"; do
        if [[ -f "$file" ]]; then
            local size=$(wc -c < "$file" 2>/dev/null || echo "0")
            echo -e "  ${GREEN}✓${NC} $file (${size} 字节)"
        else
            echo -e "  ${RED}✗${NC} $file (缺失)"
        fi
    done
    echo
    
    # 检查测试文件
    echo -e "${GREEN}测试文件状态:${NC}"
    local test_files=("run-semantic.js" "test-single-semantic.js")
    for file in "${test_files[@]}"; do
        if [[ -f "$file" ]]; then
            local size=$(wc -c < "$file" 2>/dev/null || echo "0")
            echo -e "  ${GREEN}✓${NC} $file (${size} 字节)"
        else
            echo -e "  ${RED}✗${NC} $file (缺失)"
        fi
    done
    echo
    
    # 检查依赖
    echo -e "${GREEN}依赖检查:${NC}"
    if command -v node &> /dev/null; then
        local node_version=$(node --version)
        echo -e "  ${GREEN}✓${NC} Node.js $node_version"
    else
        echo -e "  ${RED}✗${NC} Node.js (未安装)"
    fi
    
    # 检查相关模块
    local modules=("../lexer/lexer.js" "../parser/parser.js")
    for module in "${modules[@]}"; do
        if [[ -f "$module" ]]; then
            echo -e "  ${GREEN}✓${NC} $module"
        else
            echo -e "  ${YELLOW}!${NC} $module (可选依赖缺失)"
        fi
    done
    echo
    
    # 快速功能测试
    echo -e "${GREEN}快速功能测试:${NC}"
    if node -e "console.log('Node.js 运行正常')" 2>/dev/null; then
        echo -e "  ${GREEN}✓${NC} Node.js 执行环境正常"
    else
        echo -e "  ${RED}✗${NC} Node.js 执行环境异常"
    fi
    
    if [[ -f "test-single-semantic.js" ]]; then
        if timeout 5s node test-single-semantic.js "let x = 10;" >/dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} 语义分析器基本功能正常"
        else
            echo -e "  ${RED}✗${NC} 语义分析器基本功能异常"
        fi
    fi
}

# 等待用户输入
wait_for_input() {
    echo
    echo -e -n "${YELLOW}按 Enter 键继续...${NC}"
    read -r
}

# 主循环
main() {
    # 初始检查
    if ! check_nodejs; then
        exit 1
    fi
    
    if ! check_files; then
        exit 1
    fi
    
    while true; do
        show_header
        show_main_menu
        
        read -r choice
        echo
        
        case $choice in
            1)
                run_full_tests
                wait_for_input
                ;;
            2)
                run_default_single_test
                wait_for_input
                ;;
            3)
                run_custom_test
                wait_for_input
                ;;
            4)
                run_error_tests
                wait_for_input
                ;;
            5)
                show_help
                wait_for_input
                ;;
            6)
                show_analyzer_status
                wait_for_input
                ;;
            0)
                echo -e "${GREEN}感谢使用语义分析器测试工具！${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}无效选项: $choice${NC}"
                echo -e "${YELLOW}请输入 0-6 之间的数字${NC}"
                wait_for_input
                ;;
        esac
    done
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi