class SymbolTable {
    constructor() {
        // 作用域链，每个作用域都是一个 Map
        this.scopeChain = [new Map()];
    }

    // 进入一个新的作用域
    enterScope() {
        this.scopeChain.push(new Map());
    }

    // 退出当前作用域
    exitScope() {
        if (this.scopeChain.length > 1) {
            this.scopeChain.pop();
        } else {
            // 不能退出全局作用域
            throw new Error("Cannot exit global scope.");
        }
    }

    // 在当前作用域插入一个符号
    insert(name, symbol) {
        // 总是插入到最内层的作用域
        this.currentScope().set(name, symbol);
    }

    // 查找一个符号，从当前作用域开始向上查找
    lookup(name) {
        for (let i = this.scopeChain.length - 1; i >= 0; i--) {
            if (this.scopeChain[i].has(name)) {
                return this.scopeChain[i].get(name);
            }
        }
        return null; // 未找到
    }
    
    // 只在当前作用域查找
    lookupCurrentScope(name) {
        return this.currentScope().has(name) ? this.currentScope().get(name) : null;
    }

    // 获取当前作用域
    currentScope() {
        return this.scopeChain[this.scopeChain.length - 1];
    }
}

module.exports = SymbolTable; 