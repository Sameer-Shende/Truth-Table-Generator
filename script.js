const priority = ["∼", "∧", "∨", "→"];

/**
 * Tokenize input expression.
 * 
 * @param {string} inputLine 
 * @returns {string[]}
 */

const tokenizer = (inputLine) => {
    const pattern = /(\s*∼\s*|\s*∧\s*|\s*∨\s*|\s*→\s*|\s*\(\s*|\s*\)\s*| )/g;
    return inputLine.split(pattern).filter(value => value.trim().length > 0);
}

/**
 * Check if a variable name is valid.
 * 
 * @param {string} varName 
 * @returns {boolean}
 */

const satisfyVariable = (varName) => {
    const validChar = (char) => char === '_' || char.match(/[a-zA-Z]/);
    return varName.length > 0 && [...varName].every((char, idx) => idx === 0 ? validChar(char) : validChar(char) || char.match(/[0-9]/));
}

/**
 * Convert infix expression to postfix notation.
 * 
 * @param {string[]} inputArr 
 * @returns {string[]}
 */
const inToPost = (inputArr) => {
    let stack = [];
    let result = [];

    const precedence = (op) => {
        switch (op) {
            case '∼': return 4;
            case '∧': return 3;
            case '∨': return 2;
            case '→': return 1;
            default: return 0;
        }
    };

    for (let token of inputArr) {
        token = token.trim();
        if (token === '(') {
            stack.push(token);
        } else if (token === ')') {
            while (stack.length && stack[stack.length - 1] !== '(') {
                result.push(stack.pop());
            }
            stack.pop(); // Pop '('
        } else if (priority.includes(token)) {
            while (stack.length && precedence(stack[stack.length - 1]) >= precedence(token)) {
                result.push(stack.pop());
            }
            stack.push(token);
        } else {
            result.push(token);
        }
    }

    while (stack.length) {
        result.push(stack.pop());
    }

    return result;
}

/**
 * Check the correctness of the expression.
 * 
 * @param {string[]} postExp 
 * @returns {boolean}
 */
const check = (postExp) => {
    let stack = [];
    for (let token of postExp) {
        if (priority.includes(token)) {
            if (token === '∼') {
                if (stack.length === 0 || !satisfyVariable(stack.pop())) {
                    return false;
                }
                stack.push('var');
            } else {
                if (stack.length < 2 || !satisfyVariable(stack.pop()) || !satisfyVariable(stack.pop())) {
                    return false;
                }
                stack.push('var');
            }
        } else if (token.match(/[a-zA-Z0-9_]/)) {
            stack.push(token);
        } else {
            return false;
        }
    }
    return stack.length === 1 && satisfyVariable(stack[0]);
}

/**
 * Convert postfix expression to infix with parentheses.
 * 
 * @param {string[]} postExp 
 * @returns {string}
 */
const postToInWithParentheses = (postExp) => {
    let stack = [];
    for (let token of postExp) {
        if (priority.includes(token)) {
            if (token === '∼') {
                stack.push(`(${token}${stack.pop()})`);
            } else {
                const right = stack.pop();
                const left = stack.pop();
                stack.push(`(${left} ${token} ${right})`);
            }
        } else {
            stack.push(token);
        }
    }
    return stack.pop();
}

/**
 * Compute the truth table based on the expression.
 * 
 * @param {string[]} postExp 
 * @param {string} inExpWithParen 
 */
const computeAll = (postExp, inExpWithParen) => {
    const removeDuplicateVars = () => {
        return postExp.filter(value => !priority.includes(value) && !['T', 'F'].includes(value))
                      .filter((value, index, self) => self.indexOf(value) === index);
    }

    const compute = (values) => {
        const evalOp = (a, b, op) => {
            switch (op) {
                case '∧': return a && b;
                case '∨': return a || b;
                case '→': return !a || b;
                default: return false;
            }
        }

        let stack = [];
        for (let token of postExp) {
            if (priority.includes(token)) {
                if (token === '∼') {
                    stack.push(!stack.pop());
                } else {
                    const right = stack.pop();
                    const left = stack.pop();
                    stack.push(evalOp(left, right, token));
                }
            } else if (token.match(/[a-zA-Z0-9_]/)) {
                stack.push(values[token]);
            }
        }
        return stack.pop();
    }

    const createTableTd = (values, result) => {
        let tr = document.createElement('tr');
        for (let key in values) {
            let td = document.createElement('td');
            td.textContent = values[key] ? 'T' : 'F';
            tr.appendChild(td);
        }
        let td = document.createElement('td');
        td.textContent = result ? 'T' : 'F';
        tr.appendChild(td);
        resultTable.appendChild(tr);
    }

    const listAll = (vars) => {
        const numCombinations = 1 << vars.length;
        for (let i = 0; i < numCombinations; i++) {
            let values = {};
            for (let j = 0; j < vars.length; j++) {
                values[vars[j]] = Boolean(i & (1 << j));
            }
            createTableTd(values, compute(values));
        }
    }

    const vars = removeDuplicateVars();
    const headerRow = document.createElement('tr');
    for (let varName of vars) {
        let th = document.createElement('th');
        th.textContent = varName;
        headerRow.appendChild(th);
    }
    let resultTh = document.createElement('th');
    resultTh.textContent = inExpWithParen;
    headerRow.appendChild(resultTh);
    resultTable.innerHTML = "";  
    resultTable.appendChild(headerRow);

    listAll(vars);
}


const input = document.querySelector('.text-field');
const submitButton = document.querySelector('.submit');
const resultViewHeading = document.querySelector('#res-view-heading');
const resultTable = document.querySelector('.table');

// Process input and generate truth table
const process = () => {
    if (!input.value.trim()) {
        resultViewHeading.textContent = "The truth table of: ";
        return;
    }

    let inputArr = tokenizer(input.value);
    let postExp = inToPost(inputArr);
    
    if (!check(postExp)) {
        resultViewHeading.textContent = "Invalid expression.";
        resultTable.innerHTML = "";
        return;
    }

    let inExpWithParen = postToInWithParentheses(postExp);
    resultViewHeading.textContent = `The truth table of: ${inExpWithParen}`;
    computeAll(postExp, inExpWithParen);
}

// Event Listeners
submitButton.addEventListener('click', process);

document.querySelectorAll('.char-btns').forEach(button => {
    button.addEventListener('click', (e) => {
        const textField = document.querySelector('.text-field');
        const cursorPos = textField.selectionStart;
        textField.value = textField.value.slice(0, cursorPos) + e.target.textContent + textField.value.slice(cursorPos);
        textField.setSelectionRange(cursorPos + e.target.textContent.length, cursorPos + e.target.textContent.length);
        textField.focus();
    });
});
