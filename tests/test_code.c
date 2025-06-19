// 这是一个用于测试我们编译器的示例代码
// 包含变量声明、函数、if语句和一些算术运算

int a = 10;
int b = 20;

void main() {
    int c;
    c = a + (5 + 15); // 这里可以进行常量折叠
    
    if (c > 20) {
        printf("c is greater than 20\n");
    } else {
        printf("c is not greater than 20\n");
    }
    
    // 这个if语句的条件是常量，可以被优化掉
    if (1) {
        printf("This will always be printed.\n");
    }

    if (0) {
        printf("This will never be printed.\n");
    }
} 