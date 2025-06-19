#!/bin/bash

# 词法分析器测试运行脚本
# 作者: 编译系统课程设计
# 版本: 1.0

echo "=========================================================="
echo "           词法分析器测试工具集"
echo "=========================================================="
echo "作者: poboll"
echo "时间: $(date)"
echo ""

# 检查是否在正确的目录
if [ ! -f "lexer.js" ]; then
    echo "错误: 找不到 lexer.js 文件"
    echo "请确保在包含词法分析器文件的目录中运行此脚本"
    exit 1
fi

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "错误: 未找到 Node.js"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

echo "Node.js 版本: $(node --version)"
echo ""

# 显示菜单
echo "请选择要运行的测试:"
echo "1. 运行完整测试套件 (run-lexer.js)"
echo "2. 快速测试默认代码 (test-single.js)"
echo "3. 测试自定义代码片段"
echo "4. 查看帮助信息"
echo "5. 退出"
echo ""

read -p "请输入选项 (1-5): " choice

case $choice in
    1)
        echo ""
        echo "运行完整测试套件..."
        echo "=========================================================="
        node run-lexer.js
        ;;
    2)
        echo ""
        echo "运行快速测试..."
        echo "=========================================================="
        node test-single.js
        ;;
    3)
        echo ""
        read -p "请输入要测试的代码: " custom_code
        echo ""
        echo "测试自定义代码..."
        echo "=========================================================="
        node test-single.js "$custom_code"
        ;;
    4)
        echo ""
        echo "=== 帮助信息 ==="
        echo ""
        echo "文件说明:"
        echo "  lexer.js      - 词法分析器主文件"
        echo "  run-lexer.js  - 完整测试套件"
        echo "  test-single.js - 单个代码片段测试"
        echo "  README.md     - 详细说明文档"
        echo ""
        echo "直接运行命令:"
        echo "  node run-lexer.js                    # 运行所有测试用例"
        echo "  node test-single.js                  # 测试默认代码"
        echo "  node test-single.js \"let x = 10;\"   # 测试自定义代码"
        echo ""
        echo "支持的Token类型:"
        echo "  KEYWORD, IDENTIFIER, NUMBER, STRING, OPERATOR, DELIMITER, EOF, UNKNOWN"
        echo ""
        echo "更多信息请查看 README.md 文件"
        ;;
    5)
        echo "退出测试工具"
        exit 0
        ;;
    *)
        echo "无效选项，请重新运行脚本"
        exit 1
        ;;
esac

echo ""
echo "=========================================================="
echo "测试完成"
echo "=========================================================="