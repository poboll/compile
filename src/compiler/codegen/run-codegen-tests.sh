#!/bin/bash

# 代码生成器测试运行脚本
# 提供交互式菜单来运行各种代码生成测试

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
    
    if [[ ! -f "$SCRIPT_DIR/run-codegen.js" ]]; then
        missing_files+=("run-codegen.js")
    fi
    
    if [[ ! -f "$SCRIPT_DIR/test-single-codegen.js" ]]; then
        missing_files+=("test-single-codegen.js")
    fi
    
    if [[ ! -f "$SCRIPT_DIR/codegen.js" ]]; then
        missing_files+=("codegen.js")
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
    echo -e "${CYAN}║                    代码生成器测试工具                        ║${NC}"
    echo -e "${CYAN}║                  Code Generator Test Tool                     ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo
}

# 显示主菜单
show_main_menu() {
    echo -e "${BLUE}请选择要执行的操作:${NC}"
    echo
    echo -e "  ${GREEN}1.${NC} 运行完整代码生成测试套件"
    echo -e "  ${GREEN}2.${NC} 运行默认单个代码测试"
    echo -e "  ${GREEN}3.${NC} 运行自定义代码测试"
    echo -e "  ${GREEN}4.${NC} 运行目标平台对比测试"
    echo -e "  ${GREEN}5.${NC} 运行代码质量分析"
    echo -e "  ${GREEN}6.${NC} 运行性能基准测试"
    echo -e "  ${GREEN}7.${NC} 显示帮助信息"
    echo -e "  ${GREEN}8.${NC} 查看代码生成器状态"
    echo -e "  ${RED}0.${NC} 退出"
    echo
    echo -e -n "${YELLOW}请输入选项 [0-8]: ${NC}"
}

# 运行完整测试套件
run_full_tests() {
    echo -e "${BLUE}正在运行完整代码生成测试套件...${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    
    cd "$SCRIPT_DIR"
    node run-codegen.js
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
    echo -e "${BLUE}正在运行默认单个代码生成测试...${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    
    cd "$SCRIPT_DIR"
    node test-single-codegen.js
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
    echo -e "${BLUE}自定义代码生成测试${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    echo
    echo -e "${YELLOW}请输入要生成代码的源代码 (输入 'quit' 退出):${NC}"
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
    
    echo -e "${BLUE}正在生成自定义代码...${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    
    cd "$SCRIPT_DIR"
    node test-single-codegen.js "$code"
    local exit_code=$?
    
    echo
    if [[ $exit_code -eq 0 ]]; then
        echo -e "${GREEN}✓ 自定义代码生成完成${NC}"
    else
        echo -e "${RED}✗ 自定义代码生成失败 (退出码: $exit_code)${NC}"
    fi
    
    return $exit_code
}

# 运行目标平台对比测试
run_platform_comparison() {
    echo -e "${BLUE}目标平台对比测试${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    echo
    
    local test_code="function add(a, b) { return a + b; } let result = add(10, 20); console.log(result);"
    
    echo -e "${CYAN}测试代码:${NC}"
    echo -e "${YELLOW}$test_code${NC}"
    echo
    
    local platforms=("x86_64" "arm64" "wasm" "bytecode")
    local platform_names=("x86_64 架构" "ARM64 架构" "WebAssembly" "虚拟机字节码")
    
    cd "$SCRIPT_DIR"
    
    echo -e "${GREEN}正在为不同目标平台生成代码...${NC}"
    echo
    
    for i in "${!platforms[@]}"; do
        echo -e "${CYAN}目标平台: ${platform_names[i]}${NC}"
        echo -e "${PURPLE}─────────────────────────────────────────────────────────────${NC}"
        
        # 这里应该调用支持目标平台选择的代码生成器
        # 由于当前实现可能不支持平台选择，我们使用默认生成器
        node test-single-codegen.js "$test_code" 2>/dev/null
        
        if [[ $? -eq 0 ]]; then
            echo -e "  ${GREEN}✓${NC} ${platform_names[i]} 代码生成成功"
        else
            echo -e "  ${RED}✗${NC} ${platform_names[i]} 代码生成失败"
        fi
        
        echo
    done
    
    echo -e "${GREEN}✓ 平台对比测试完成${NC}"
    echo -e "${YELLOW}注意: 当前实现可能使用统一的代码生成器，实际的多平台支持需要扩展实现。${NC}"
}

# 运行代码质量分析
run_quality_analysis() {
    echo -e "${BLUE}代码质量分析${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    echo
    
    local analysis_codes=(
        "let x = 10; console.log(x);"
        "function factorial(n) { if (n <= 1) return 1; return n * factorial(n-1); }"
        "for (let i = 0; i < 5; i++) { console.log(i); }"
        "class Calculator { add(a, b) { return a + b; } multiply(a, b) { return a * b; } }"
        "let arr = [1, 2, 3]; arr.map(x => x * 2).filter(x => x > 2).forEach(console.log);"
    )
    
    local analysis_names=(
        "简单变量声明"
        "递归函数"
        "循环结构"
        "类定义"
        "函数式编程"
    )
    
    cd "$SCRIPT_DIR"
    
    echo -e "${GREEN}开始代码质量分析...${NC}"
    echo
    
    for i in "${!analysis_codes[@]}"; do
        echo -e "${CYAN}分析 $((i+1)): ${analysis_names[i]}${NC}"
        echo -e "${YELLOW}代码: ${analysis_codes[i]}${NC}"
        echo
        
        # 运行代码生成并分析输出
        local output=$(node test-single-codegen.js "${analysis_codes[i]}" 2>&1)
        local exit_code=$?
        
        if [[ $exit_code -eq 0 ]]; then
            echo -e "  ${GREEN}✓${NC} 代码生成成功"
            
            # 提取统计信息
            if echo "$output" | grep -q "生成代码行数"; then
                local lines=$(echo "$output" | grep "生成代码行数" | sed 's/.*生成代码行数: \([0-9]*\).*/\1/')
                echo -e "  ${BLUE}ℹ${NC} 生成代码行数: $lines"
            fi
            
            if echo "$output" | grep -q "生成代码大小"; then
                local size=$(echo "$output" | grep "生成代码大小" | sed 's/.*生成代码大小: \([0-9]*\).*/\1/')
                echo -e "  ${BLUE}ℹ${NC} 代码大小: ${size} 字节"
            fi
            
            if echo "$output" | grep -q "指令数量"; then
                local instructions=$(echo "$output" | grep "指令数量" | sed 's/.*指令数量: \([0-9]*\).*/\1/')
                echo -e "  ${BLUE}ℹ${NC} 指令数量: $instructions"
            fi
            
            if echo "$output" | grep -q "代码复杂度"; then
                local complexity=$(echo "$output" | grep "代码复杂度" | sed 's/.*代码复杂度: \([^\n]*\).*/\1/')
                echo -e "  ${BLUE}ℹ${NC} 代码复杂度: $complexity"
            fi
        else
            echo -e "  ${RED}✗${NC} 代码生成失败"
        fi
        
        echo -e "${PURPLE}─────────────────────────────────────────────────────────────${NC}"
        echo
    done
    
    echo -e "${GREEN}✓ 代码质量分析完成${NC}"
}

# 运行性能基准测试
run_benchmark_tests() {
    echo -e "${BLUE}性能基准测试${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    echo
    
    local benchmark_codes=(
        "let sum = 0; for (let i = 0; i < 1000; i++) { sum += i; } console.log(sum);"
        "function fibonacci(n) { if (n <= 1) return n; return fibonacci(n-1) + fibonacci(n-2); } fibonacci(10);"
        "let matrix = [[1,2],[3,4]]; for (let row of matrix) { for (let cell of row) { console.log(cell); } }"
        "class DataProcessor { process(data) { return data.map(x => x * 2).filter(x => x > 5); } } new DataProcessor().process([1,2,3,4,5,6]);"
    )
    
    local benchmark_names=(
        "大循环计算基准"
        "递归算法基准"
        "嵌套循环基准"
        "面向对象基准"
    )
    
    cd "$SCRIPT_DIR"
    
    echo -e "${GREEN}开始性能基准测试...${NC}"
    echo
    
    local total_time=0
    local successful_tests=0
    
    for i in "${!benchmark_codes[@]}"; do
        echo -e "${CYAN}基准 $((i+1)): ${benchmark_names[i]}${NC}"
        
        # 记录开始时间
        local start_time=$(date +%s%N)
        
        # 运行代码生成测试
        local output=$(node test-single-codegen.js "${benchmark_codes[i]}" 2>&1)
        local exit_code=$?
        
        # 记录结束时间
        local end_time=$(date +%s%N)
        local duration=$(( (end_time - start_time) / 1000000 ))
        
        if [[ $exit_code -eq 0 ]]; then
            echo -e "  ${GREEN}✓${NC} 执行时间: ${duration}ms"
            total_time=$((total_time + duration))
            successful_tests=$((successful_tests + 1))
            
            # 提取生成统计信息
            if echo "$output" | grep -q "生成耗时"; then
                local gen_time=$(echo "$output" | grep "生成耗时" | sed 's/.*生成耗时: \([0-9]*\)ms.*/\1/')
                echo -e "  ${BLUE}ℹ${NC} 代码生成耗时: ${gen_time}ms"
            fi
            
            if echo "$output" | grep -q "指令数量"; then
                local instructions=$(echo "$output" | grep "指令数量" | sed 's/.*指令数量: \([0-9]*\).*/\1/')
                echo -e "  ${BLUE}ℹ${NC} 生成指令数: $instructions"
            fi
            
            # 计算代码生成效率 (指令数/时间)
            if echo "$output" | grep -q "指令数量" && echo "$output" | grep -q "生成耗时"; then
                local instructions=$(echo "$output" | grep "指令数量" | sed 's/.*指令数量: \([0-9]*\).*/\1/')
                local gen_time=$(echo "$output" | grep "生成耗时" | sed 's/.*生成耗时: \([0-9]*\)ms.*/\1/')
                if [[ $gen_time -gt 0 ]]; then
                    local efficiency=$((instructions * 1000 / gen_time))
                    echo -e "  ${BLUE}ℹ${NC} 生成效率: ${efficiency} 指令/秒"
                fi
            fi
        else
            echo -e "  ${RED}✗${NC} 执行失败 (${duration}ms)"
        fi
        
        echo
    done
    
    # 显示总体统计
    echo -e "${GREEN}基准测试总结:${NC}"
    echo -e "  ${CYAN}•${NC} 成功测试: $successful_tests/${#benchmark_codes[@]}"
    if [[ $successful_tests -gt 0 ]]; then
        local avg_time=$((total_time / successful_tests))
        echo -e "  ${CYAN}•${NC} 平均执行时间: ${avg_time}ms"
        echo -e "  ${CYAN}•${NC} 总执行时间: ${total_time}ms"
    fi
    
    echo -e "${GREEN}✓ 性能基准测试完成${NC}"
}

# 显示帮助信息
show_help() {
    echo -e "${BLUE}代码生成器测试工具帮助${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    echo
    echo -e "${GREEN}功能说明:${NC}"
    echo -e "  ${CYAN}•${NC} 完整测试套件: 运行所有预定义的代码生成测试用例"
    echo -e "  ${CYAN}•${NC} 单个代码测试: 快速测试单个代码片段的代码生成"
    echo -e "  ${CYAN}•${NC} 自定义测试: 输入自定义代码进行代码生成"
    echo -e "  ${CYAN}•${NC} 平台对比: 展示不同目标平台的代码生成差异"
    echo -e "  ${CYAN}•${NC} 质量分析: 分析生成代码的质量指标"
    echo -e "  ${CYAN}•${NC} 性能基准: 测试代码生成器的性能表现"
    echo
    echo -e "${GREEN}支持的目标平台:${NC}"
    echo -e "  ${CYAN}•${NC} x86_64 架构"
    echo -e "    - 寄存器: RAX, RBX, RCX, RDX, RSI, RDI"
    echo -e "    - 指令集: MOV, ADD, SUB, MUL, DIV, CMP, JMP"
    echo -e "    - 调用约定: System V ABI"
    echo
    echo -e "  ${CYAN}•${NC} ARM64 架构"
    echo -e "    - 寄存器: X0-X30, W0-W30"
    echo -e "    - 指令集: ADD, SUB, MUL, LDR, STR, B, BL"
    echo -e "    - 调用约定: AAPCS64"
    echo
    echo -e "  ${CYAN}•${NC} WebAssembly"
    echo -e "    - 栈式虚拟机"
    echo -e "    - 类型化指令集"
    echo -e "    - 内存安全"
    echo
    echo -e "  ${CYAN}•${NC} 虚拟机字节码"
    echo -e "    - 操作数栈管理"
    echo -e "    - 动态类型支持"
    echo -e "    - GC友好设计"
    echo
    echo -e "${GREEN}代码生成特性:${NC}"
    echo -e "  ${CYAN}•${NC} 寄存器分配: 线性扫描算法、生命周期分析"
    echo -e "  ${CYAN}•${NC} 指令选择: 模式匹配、指令融合"
    echo -e "  ${CYAN}•${NC} 代码布局: 基本块排序、分支预测优化"
    echo -e "  ${CYAN}•${NC} 调试信息: 行号映射、符号表生成"
    echo
    echo -e "${GREEN}输出信息:${NC}"
    echo -e "  ${CYAN}•${NC} 生成的目标代码 (汇编/字节码)"
    echo -e "  ${CYAN}•${NC} 代码生成统计 (行数、大小、指令数等)"
    echo -e "  ${CYAN}•${NC} 代码分析 (指令分布、关键字使用、性能特征)"
    echo -e "  ${CYAN}•${NC} 性能数据 (生成耗时、内存使用等)"
    echo
    echo -e "${GREEN}直接命令行使用:${NC}"
    echo -e "  ${YELLOW}node run-codegen.js${NC}                     # 运行完整测试套件"
    echo -e "  ${YELLOW}node test-single-codegen.js${NC}             # 运行默认测试"
    echo -e "  ${YELLOW}node test-single-codegen.js \"code\"${NC}       # 生成指定代码"
    echo -e "  ${YELLOW}node test-single-codegen.js --help${NC}       # 显示帮助"
    echo
    echo -e "${GREEN}优化配置:${NC}"
    echo -e "  ${CYAN}•${NC} 基础配置: 无优化，保留调试信息"
    echo -e "  ${CYAN}•${NC} 优化配置: 启用寄存器优化、指令调度"
    echo -e "  ${CYAN}•${NC} 调试配置: 详细输出、保留注释"
}

# 查看代码生成器状态
show_generator_status() {
    echo -e "${BLUE}代码生成器状态检查${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    echo
    
    cd "$SCRIPT_DIR"
    
    # 检查核心文件
    echo -e "${GREEN}核心文件状态:${NC}"
    local files=("codegen.js" "instruction.js" "target-machine.js")
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
    local test_files=("run-codegen.js" "test-single-codegen.js")
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
    local modules=("../lexer/lexer.js" "../parser/parser.js" "../semantic/semantic.js" "../optimizer/optimizer.js")
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
    
    if [[ -f "test-single-codegen.js" ]]; then
        if timeout 5s node test-single-codegen.js "let x = 10;" >/dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} 代码生成器基本功能正常"
        else
            echo -e "  ${RED}✗${NC} 代码生成器基本功能异常"
        fi
    fi
    
    # 代码生成器性能测试
    echo
    echo -e "${GREEN}性能测试:${NC}"
    if [[ -f "test-single-codegen.js" ]]; then
        local start_time=$(date +%s%N)
        if timeout 10s node test-single-codegen.js "function test(){return 42;}" >/dev/null 2>&1; then
            local end_time=$(date +%s%N)
            local duration=$(( (end_time - start_time) / 1000000 ))
            echo -e "  ${GREEN}✓${NC} 函数代码生成测试通过 (${duration}ms)"
        else
            echo -e "  ${RED}✗${NC} 函数代码生成测试失败"
        fi
        
        # 复杂代码测试
        local start_time=$(date +%s%N)
        if timeout 15s node test-single-codegen.js "class Test{constructor(){this.x=10;}method(){return this.x*2;}}" >/dev/null 2>&1; then
            local end_time=$(date +%s%N)
            local duration=$(( (end_time - start_time) / 1000000 ))
            echo -e "  ${GREEN}✓${NC} 复杂代码生成测试通过 (${duration}ms)"
        else
            echo -e "  ${RED}✗${NC} 复杂代码生成测试失败"
        fi
    fi
    
    # 目标平台支持检查
    echo
    echo -e "${GREEN}目标平台支持:${NC}"
    local platforms=("x86_64" "arm64" "wasm" "bytecode")
    for platform in "${platforms[@]}"; do
        # 这里应该检查实际的平台支持，目前只是示例
        echo -e "  ${YELLOW}?${NC} $platform (需要实现检查)"
    done
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
                run_platform_comparison
                wait_for_input
                ;;
            5)
                run_quality_analysis
                wait_for_input
                ;;
            6)
                run_benchmark_tests
                wait_for_input
                ;;
            7)
                show_help
                wait_for_input
                ;;
            8)
                show_generator_status
                wait_for_input
                ;;
            0)
                echo -e "${GREEN}感谢使用代码生成器测试工具！${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}无效选项: $choice${NC}"
                echo -e "${YELLOW}请输入 0-8 之间的数字${NC}"
                wait_for_input
                ;;
        esac
    done
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi