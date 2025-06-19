// This is a test file for the lexer.
/*
  This is a multi-line comment.
  It should be ignored by the lexer.
*/

int main() {
    // Variable declaration and initialization
    int a = 10;
    int b = 20;
    int sum = a + b;
    
    // String and char literals
    char* greeting = "Hello, World!";
    char newline = '\n';

    // Conditional statement
    if (sum > 25) {
        printf("Sum is greater than 25.\n");
    } else {
        printf("Sum is not greater than 25.\n");
    }

    // Loop
    while (a < 15) {
        a++;
    }

    for (int i = 0; i < 5; i = i + 1) {
        sum = sum * i;
    }
    
    return sum;
} 