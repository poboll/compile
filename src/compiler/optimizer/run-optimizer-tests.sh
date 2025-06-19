#!/bin/bash

# 代码优化器测试运行脚本
# 提供交互式菜单来运行各种代码优化测试

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
    
    if [[ ! -f "$SCRIPT_DIR/run-optimizer.js" ]]; then
        missing_files+=("run-optimizer.js")
    fi
    
    if [[ ! -f "$SCRIPT_DIR/test-single-optimizer.js" ]]; then
        missing_files+=("test-single-optimizer.js")
    fi
    
    if [[ ! -f "$SCRIPT_DIR/optimizer.js" ]]; then
        missing_files+=("optimizer.js")
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
    echo -e "${CYAN}║                    代码优化器测试工具                        ║${NC}"
    echo -e "${CYAN}║                  Code Optimizer Test Tool                    ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo
}

# 显示主菜单
show_main_menu() {
    echo -e "${BLUE}请选择要执行的操作:${NC}"
    echo
    echo -e "  ${GREEN}1.${NC} 运行完整代码优化测试套件"
    echo -e "  ${GREEN}2.${NC} 运行默认单个代码测试"
    echo -e "  ${GREEN}3.${NC} 运行自定义代码测试"
    echo -e "  ${GREEN}4.${NC} 运行优化效果对比测试"
    echo -e "  ${GREEN}5.${NC} 运行性能基准测试"
    echo -e "  ${GREEN}6.${NC} 显示帮助信息"
    echo -e "  ${GREEN}7.${NC} 查看优化器状态"
    echo -e "  ${RED}0.${NC} 退出"
    echo
    echo -e -n "${YELLOW}请输入选项 [0-7]: ${NC}"
}

# 运行完整测试套件
run_full_tests() {
    echo -e "${BLUE}正在运行完整代码优化测试套件...${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    
    cd "$SCRIPT_DIR"
    node run-optimizer.js
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
    echo -e "${BLUE}正在运行默认单个代码优化测试...${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    
    cd "$SCRIPT_DIR"
    node test-single-optimizer.js
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
    echo -e "${BLUE}自定义代码优化测试${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    echo
    echo -e "${YELLOW}请输入要优化的代码 (输入 'quit' 退出):${NC}"
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
    
    echo -e "${BLUE}正在优化自定义代码...${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    
    cd "$SCRIPT_DIR"
    node test-single-optimizer.js "$code"
    local exit_code=$?
    
    echo
    if [[ $exit_code -eq 0 ]]; then
        echo -e "${GREEN}✓ 自定义代码优化完成${NC}"
    else
        echo -e "${RED}✗ 自定义代码优化失败 (退出码: $exit_code)${NC}"
    fi
    
    return $exit_code
}

# 运行优化效果对比测试
run_comparison_tests() {
    echo -e "${BLUE}优化效果对比测试${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    echo
    
    local test_codes=(
        "let x = 2 + 3; let y = x * 1; console.log(y + 0);"
        "if (true) { console.log('always'); } if (false) { console.log('never'); }"
        "let a = 10; let b = a; let c = b; console.log(c);"
        "function test() { let unused = 42; return 5 * 4 + 1; }"
        "let result = (true && x) || (false && y);"
    )
    
    local test_names=(
        "算术表达式优化"
        "条件分支优化"
        "变量传播优化"
        "死代码消除优化"
        "逻辑表达式优化"
    )
    
    cd "$SCRIPT_DIR"
    
    for i in "${!test_codes[@]}"; do
        echo -e "${CYAN}测试 $((i+1)): ${test_names[i]}${NC}"
        echo -e "${YELLOW}代码: ${test_codes[i]}${NC}"
        echo
        
        node test-single-optimizer.js "${test_codes[i]}"
        
        echo -e "${PURPLE}─────────────────────────────────────────────────────────────${NC}"
        echo
    done
    
    echo -e "${GREEN}✓ 所有对比测试用例执行完成${NC}"
}

# 运行性能基准测试
run_benchmark_tests() {
    echo -e "${BLUE}性能基准测试${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    echo
    
    local benchmark_codes=(
        "for (let i = 0; i < 100; i++) { console.log(i + 0); }"
        "function fibonacci(n) { if (n <= 1) return n; return fibonacci(n-1) + fibonacci(n-2); }"
        "let arr = [1, 2, 3]; for (let item of arr) { console.log(item * 1); }"
        "class Test { constructor() { this.value = 10 + 0; } getValue() { return this.value * 1; } }"
    )
    
    local benchmark_names=(
        "循环优化基准"
        "递归函数优化基准"
        "数组遍历优化基准"
        "类方法优化基准"
    )
    
    cd "$SCRIPT_DIR"
    
    echo -e "${GREEN}开始性能基准测试...${NC}"
    echo
    
    for i in "${!benchmark_codes[@]}"; do
        echo -e "${CYAN}基准 $((i+1)): ${benchmark_names[i]}${NC}"
        
        # 记录开始时间
        local start_time=$(date +%s%N)
        
        # 运行优化测试
        node test-single-optimizer.js "${benchmark_codes[i]}" > /tmp/optimizer_benchmark_$i.log 2>&1
        local exit_code=$?
        
        # 记录结束时间
        local end_time=$(date +%s%N)
        local duration=$(( (end_time - start_time) / 1000000 ))
        
        if [[ $exit_code -eq 0 ]]; then
            echo -e "  ${GREEN}✓${NC} 执行时间: ${duration}ms"
            
            # 提取优化统计信息
            if grep -q "优化耗时" /tmp/optimizer_benchmark_$i.log; then
                local opt_time=$(grep "优化耗时" /tmp/optimizer_benchmark_$i.log | sed 's/.*优化耗时: \([0-9]*\)ms.*/\1/')
                echo -e "  ${BLUE}ℹ${NC} 优化耗时: ${opt_time}ms"
            fi
            
            if grep -q "节点减少" /tmp/optimizer_benchmark_$i.log; then
                local reduction=$(grep "节点减少" /tmp/optimizer_benchmark_$i.log | sed 's/.*节点减少: \([0-9]*\).*/\1/')
                echo -e "  ${BLUE}ℹ${NC} 节点减少: ${reduction}%"
            fi
        else
            echo -e "  ${RED}✗${NC} 执行失败 (${duration}ms)"
        fi
        
        echo
    done
    
    # 清理临时文件
    rm -f /tmp/optimizer_benchmark_*.log
    
    echo -e "${GREEN}✓ 性能基准测试完成${NC}"
}

# 显示帮助信息
show_help() {
    echo -e "${BLUE}代码优化器测试工具帮助${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    echo
    echo -e "${GREEN}功能说明:${NC}"
    echo -e "  ${CYAN}•${NC} 完整测试套件: 运行所有预定义的代码优化测试用例"
    echo -e "  ${CYAN}•${NC} 单个代码测试: 快速测试单个代码片段的优化效果"
    echo -e "  ${CYAN}•${NC} 自定义测试: 输入自定义代码进行优化分析"
    echo -e "  ${CYAN}•${NC} 效果对比: 展示不同类型代码的优化效果"
    echo -e "  ${CYAN}•${NC} 性能基准: 测试优化器在不同场景下的性能"
    echo
    echo -e "${GREEN}支持的优化技术:${NC}"
    echo -e "  ${CYAN}•${NC} 常量折叠 (Constant Folding)"
    echo -e "    - 算术表达式: 2 + 3 → 5"
    echo -e "    - 逻辑表达式: true && false → false"
    echo -e "    - 字符串连接: \"a\" + \"b\" → \"ab\""
    echo
    echo -e "  ${CYAN}•${NC} 死代码消除 (Dead Code Elimination)"
    echo -e "    - 不可达代码: if (false) { ... }"
    echo -e "    - 未使用变量: let unused = 10;"
    echo -e "    - 无效赋值: x = x;"
    echo
    echo -e "  ${CYAN}•${NC} 表达式简化 (Expression Simplification)"
    echo -e "    - 恒等操作: x + 0 → x, x * 1 → x"
    echo -e "    - 吸收操作: x * 0 → 0, x && false → false"
    echo -e "    - 幂等操作: x || x → x, x && x → x"
    echo
    echo -e "${GREEN}输出信息:${NC}"
    echo -e "  ${CYAN}•${NC} 优化前后AST对比"
    echo -e "  ${CYAN}•${NC} 优化统计信息 (节点减少、优化次数等)"
    echo -e "  ${CYAN}•${NC} 应用的优化技术详情"
    echo -e "  ${CYAN}•${NC} 性能分析数据 (优化耗时等)"
    echo
    echo -e "${GREEN}直接命令行使用:${NC}"
    echo -e "  ${YELLOW}node run-optimizer.js${NC}                   # 运行完整测试套件"
    echo -e "  ${YELLOW}node test-single-optimizer.js${NC}           # 运行默认测试"
    echo -e "  ${YELLOW}node test-single-optimizer.js \"code\"${NC}     # 优化指定代码"
    echo -e "  ${YELLOW}node test-single-optimizer.js --help${NC}     # 显示帮助"
    echo
    echo -e "${GREEN}优化级别:${NC}"
    echo -e "  ${CYAN}•${NC} 基础优化: 只进行常量折叠"
    echo -e "  ${CYAN}•${NC} 标准优化: 常量折叠 + 死代码消除 + 表达式简化"
    echo -e "  ${CYAN}•${NC} 激进优化: 所有优化技术 + 循环优化 + 内联"
}

# 查看优化器状态
show_optimizer_status() {
    echo -e "${BLUE}代码优化器状态检查${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    echo
    
    cd "$SCRIPT_DIR"
    
    # 检查核心文件
    echo -e "${GREEN}核心文件状态:${NC}"
    local files=("optimizer.js" "constant-folder.js" "dead-code-eliminator.js")
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
    local test_files=("run-optimizer.js" "test-single-optimizer.js")
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
    local modules=("../lexer/lexer.js" "../parser/parser.js" "../semantic/semantic.js")
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
    
    if [[ -f "test-single-optimizer.js" ]]; then
        if timeout 5s node test-single-optimizer.js "let x = 2 + 3;" >/dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} 代码优化器基本功能正常"
        else
            echo -e "  ${RED}✗${NC} 代码优化器基本功能异常"
        fi
    fi
    
    # 优化器性能测试
    echo
    echo -e "${GREEN}性能测试:${NC}"
    if [[ -f "test-single-optimizer.js" ]]; then
        local start_time=$(date +%s%N)
        if timeout 10s node test-single-optimizer.js "for(let i=0;i<10;i++){console.log(i+0);}" >/dev/null 2>&1; then
            local end_time=$(date +%s%N)
            local duration=$(( (end_time - start_time) / 1000000 ))
            echo -e "  ${GREEN}✓${NC} 复杂代码优化测试通过 (${duration}ms)"
        else
            echo -e "  ${RED}✗${NC} 复杂代码优化测试失败"
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
                run_comparison_tests
                wait_for_input
                ;;
            5)
                run_benchmark_tests
                wait_for_input
                ;;
            6)
                show_help
                wait_for_input
                ;;
            7)
                show_optimizer_status
                wait_for_input
                ;;
            0)
                echo -e "${GREEN}感谢使用代码优化器测试工具！${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}无效选项: $choice${NC}"
                echo -e "${YELLOW}请输入 0-7 之间的数字${NC}"
                wait_for_input
                ;;
        esac
    done
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi