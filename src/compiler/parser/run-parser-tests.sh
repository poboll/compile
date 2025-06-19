#!/bin/bash

# 语法分析器测试运行脚本
# 提供交互式菜单来运行各种语法分析器测试

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查必要文件是否存在
check_files() {
    if [ ! -f "parser.js" ]; then
        echo -e "${RED}错误: 找不到 parser.js 文件${NC}"
        echo "请确保在正确的目录下运行此脚本"
        exit 1
    fi
    
    if [ ! -f "run-parser.js" ]; then
        echo -e "${RED}错误: 找不到 run-parser.js 文件${NC}"
        exit 1
    fi
    
    if [ ! -f "test-single-parser.js" ]; then
        echo -e "${RED}错误: 找不到 test-single-parser.js 文件${NC}"
        exit 1
    fi
}

# 检查Node.js是否安装
check_node() {
    if ! command -v node &> /dev/null; then
        echo -e "${RED}错误: 未找到 Node.js${NC}"
        echo "请先安装 Node.js: https://nodejs.org/"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Node.js 版本: $(node --version)${NC}"
}

# 显示主菜单
show_menu() {
    clear
    echo -e "${BLUE}===========================================${NC}"
    echo -e "${BLUE}        语法分析器测试工具菜单${NC}"
    echo -e "${BLUE}===========================================${NC}"
    echo
    echo -e "${YELLOW}1.${NC} 运行完整测试套件 (run-parser.js)"
    echo -e "${YELLOW}2.${NC} 快速单代码测试 (test-single-parser.js)"
    echo -e "${YELLOW}3.${NC} 测试自定义代码片段"
    echo -e "${YELLOW}4.${NC} 测试语法错误代码"
    echo -e "${YELLOW}5.${NC} 查看帮助信息"
    echo -e "${YELLOW}6.${NC} 退出"
    echo
    echo -n "请选择操作 [1-6]: "
}

# 运行完整测试套件
run_full_tests() {
    echo -e "${GREEN}正在运行完整语法分析器测试套件...${NC}"
    echo
    node run-parser.js
    echo
    echo -e "${BLUE}按任意键返回主菜单...${NC}"
    read -n 1
}

# 运行单代码测试
run_single_test() {
    echo -e "${GREEN}正在运行默认单代码测试...${NC}"
    echo
    node test-single-parser.js
    echo
    echo -e "${BLUE}按任意键返回主菜单...${NC}"
    read -n 1
}

# 测试自定义代码
test_custom_code() {
    echo -e "${GREEN}测试自定义代码片段${NC}"
    echo
    echo "请输入要测试的代码 (可以是多行，输入空行结束):"
    echo -e "${YELLOW}示例: let x = 10; if (x > 5) { console.log('大于5'); }${NC}"
    echo
    
    # 读取多行输入
    code=""
    while IFS= read -r line; do
        if [ -z "$line" ]; then
            break
        fi
        if [ -z "$code" ]; then
            code="$line"
        else
            code="$code\n$line"
        fi
    done
    
    if [ -z "$code" ]; then
        echo -e "${RED}未输入任何代码${NC}"
    else
        echo
        echo -e "${GREEN}正在分析您的代码...${NC}"
        echo
        node test-single-parser.js "$code"
    fi
    
    echo
    echo -e "${BLUE}按任意键返回主菜单...${NC}"
    read -n 1
}

# 测试语法错误代码
test_error_code() {
    echo -e "${GREEN}测试语法错误代码${NC}"
    echo
    
    # 预定义的错误代码示例
    error_codes=(
        "let x = ;"  # 缺少初始化值
        "function ( { return 42; }"  # 函数名缺失
        "if x > 0 { console.log('error'); }"  # 缺少括号
        "let y = 10 console.log(y);"  # 缺少分号
        "function test() { return }"  # return语句不完整
    )
    
    echo "选择要测试的错误代码:"
    for i in "${!error_codes[@]}"; do
        echo -e "${YELLOW}$((i+1)).${NC} ${error_codes[$i]}"
    done
    echo -e "${YELLOW}6.${NC} 输入自定义错误代码"
    echo
    echo -n "请选择 [1-6]: "
    read choice
    
    case $choice in
        [1-5])
            selected_code="${error_codes[$((choice-1))]}"
            echo
            echo -e "${GREEN}正在分析错误代码: ${selected_code}${NC}"
            echo
            node test-single-parser.js "$selected_code"
            ;;
        6)
            echo
            echo "请输入自定义错误代码:"
            read custom_code
            if [ ! -z "$custom_code" ]; then
                echo
                echo -e "${GREEN}正在分析自定义错误代码...${NC}"
                echo
                node test-single-parser.js "$custom_code"
            fi
            ;;
        *)
            echo -e "${RED}无效选择${NC}"
            ;;
    esac
    
    echo
    echo -e "${BLUE}按任意键返回主菜单...${NC}"
    read -n 1
}

# 显示帮助信息
show_help() {
    clear
    echo -e "${BLUE}===========================================${NC}"
    echo -e "${BLUE}           语法分析器帮助信息${NC}"
    echo -e "${BLUE}===========================================${NC}"
    echo
    echo -e "${GREEN}文件说明:${NC}"
    echo "• parser.js - 语法分析器核心文件"
    echo "• run-parser.js - 完整测试套件"
    echo "• test-single-parser.js - 单代码片段测试"
    echo "• README.md - 详细文档"
    echo
    echo -e "${GREEN}支持的语法结构:${NC}"
    echo "• 变量声明: let, const, var"
    echo "• 函数声明和调用"
    echo "• 条件语句: if/else"
    echo "• 循环语句: while"
    echo "• 表达式: 算术、比较、逻辑"
    echo "• 数据类型: 数字、字符串、布尔值、null"
    echo
    echo -e "${GREEN}命令行使用:${NC}"
    echo "• node run-parser.js"
    echo "• node test-single-parser.js"
    echo "• node test-single-parser.js \"代码片段\""
    echo
    echo -e "${GREEN}输出说明:${NC}"
    echo "• AST - 抽象语法树结构"
    echo "• 节点统计 - 各类型节点数量"
    echo "• 错误信息 - 语法错误详情"
    echo "• 性能数据 - 分析耗时"
    echo
    echo -e "${YELLOW}更多信息请查看 README.md 文件${NC}"
    echo
    echo -e "${BLUE}按任意键返回主菜单...${NC}"
    read -n 1
}

# 主程序
main() {
    # 检查环境
    check_files
    check_node
    
    # 主循环
    while true; do
        show_menu
        read choice
        
        case $choice in
            1)
                run_full_tests
                ;;
            2)
                run_single_test
                ;;
            3)
                test_custom_code
                ;;
            4)
                test_error_code
                ;;
            5)
                show_help
                ;;
            6)
                echo
                echo -e "${GREEN}感谢使用语法分析器测试工具！${NC}"
                exit 0
                ;;
            *)
                echo
                echo -e "${RED}无效选择，请输入 1-6${NC}"
                sleep 1
                ;;
        esac
    done
}

# 运行主程序
main