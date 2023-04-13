const form = document.querySelector(".form");
const textarea = document.querySelector(".form textarea");
let TokenType = null;

form.addEventListener("submit", (evt) => {
    evt.preventDefault();
    if(textarea.value.trim() === "") {
        showAlert("No se puede analizar un texto vacío");
    } else {
        fillTable();
    }
});

document.addEventListener("DOMContentLoaded", init());
async function init() {
    fillTable(await lexer(textarea.value));
}

function isDigit(char) {
    return /\d/.test(char);
}

function isLetter(char) {
    return /[a-zA-Z]/.test(char);
}

function isWhiteSpace(char) {
    return /\s/.test(char);
}

async function lexer(input) {
    const tokens = [];
    const url = "./js/Grammar.json";
    let currentPosition = 0;
    let line = 1;

    const response = await fetch(url);
    TokenType = await response.json();

    while (currentPosition < input.length) {
        let currentChar = input[currentPosition];

        // Match whitespace
        if (isWhiteSpace(currentChar)) {
            if (currentChar === "\n") {
                line++;
            }
            currentPosition++;
            continue;
        }

        // Match a number
        if (isDigit(currentChar)) {
            let number = "";

            while (isDigit(currentChar)) {
                number += currentChar;
                currentPosition++;
                currentChar = input[currentPosition];
            }

            tokens.push({ type: TokenType.NUMBER, line, value: Number(number) });
            continue;
        }

        // Match is a letter
        if (isLetter(currentChar)) {
            let identifier = "";

            while (isLetter(currentChar) || isDigit(currentChar) || currentChar == "_") {
                identifier += currentChar;
                currentPosition++;
                currentChar = input[currentPosition];
            }

            switch (identifier) {
                case "var":
                    tokens.push({ type: TokenType.VAR, line });
                    break;
                case "true":
                    tokens.push({ type: TokenType.BOOLEAN, line, value: true });
                    break;
                case "false":
                    tokens.push({ type: TokenType.BOOLEAN, line, value: false });
                    break;
                case "if":
                    tokens.push({ type: TokenType.IF, line });
                    break;
                case "else":
                    tokens.push({ type: TokenType.ELSE, line });
                    break;
                case "for":
                    tokens.push({ type: TokenType.FOR, line });
                    break;
                case "while":
                    tokens.push({ type: TokenType.WHILE, line });
                    break;
                case "function":
                    tokens.push({ type: TokenType.FUNCTION, line });
                    break;
                default:
                    tokens.push({
                        type: TokenType.IDENTIFIER,
                        line,
                        value: identifier,
                    });
                    break;
            }

            continue;
        }

        // Match a message
        if (currentChar === '"') {
            let message = "";
            currentPosition++;
            currentChar = input[currentPosition];
            
            while (currentChar !== '"') {
                if (currentPosition >= input.length) {
                    throw new Error(`Line(${line}): Se esperaba un cierre de comillas`);
                }
                message += currentChar;
                currentPosition++;
                currentChar = input[currentPosition];
            }

            tokens.push({ type: TokenType.STRING, line, value: message });
            currentPosition++;
            continue;
        }

        if (currentChar === "+") {
            if (input[currentPosition + 1] === "+") {
                tokens.push({ type: TokenType.INCREMENT, line });
                currentPosition += 2;
            } else {
                tokens.push({ type: TokenType.PLUS, line });
                currentPosition++;
            }
            continue;
        } else if (currentChar === "-") {
            if (input[currentPosition + 1] === "-") {
                tokens.push({ type: TokenType.DECREMENT, line });
                currentPosition += 2;
            } else {
                tokens.push({ type: TokenType.MINUS, line });
                currentPosition++;
            }
            continue;
        } else if (currentChar === "*") {
            tokens.push({ type: TokenType.MULTIPLY, line });
            currentPosition++;
            continue;
        } else if (currentChar === "/") {
            tokens.push({ type: TokenType.DIVIDE, line });
            currentPosition++;
            continue;
        } else if (currentChar === "<") {
            if (input[currentPosition + 1] === "=") {
                tokens.push({ type: TokenType.LESS_THAN_EQUAL, line });
                currentPosition += 2;
            } else {
                tokens.push({ type: TokenType.LESS_THAN, line });
                currentPosition++;
            }
            continue;
        } else if (currentChar === ">") {
            if (input[currentPosition + 1] === "=") {
                tokens.push({ type: TokenType.GREATER_THAN_EQUAL, line });
                currentPosition += 2;
            } else {
                tokens.push({ type: TokenType.GREATER_THAN, line });
                currentPosition++;
            }
            continue;
        } else if (currentChar === "=") {
            if (input[currentPosition + 1] === "=") {
                tokens.push({ type: TokenType.EQUAL, line });
                currentPosition += 2;
            } else {
                tokens.push({ type: TokenType.ASSIGN, line });
                currentPosition++;
            }
            continue;
        } else if (currentChar === "!") {
            if (input[currentPosition + 1] === "=") {
                tokens.push({ type: TokenType.NOT_EQUAL, line });
                currentPosition += 2;
            } else {
                throw new Error(`Carácter no reconocido: '${currentChar}'`);
            }
            continue;
        } else if (currentChar === "(") {
            tokens.push({ type: TokenType.LPAREN, line });
            currentPosition++;
            continue;
        } else if (currentChar === ")") {
            tokens.push({ type: TokenType.RPAREN, line });
            currentPosition++;
            continue;
        } else if (currentChar === "{") {
            tokens.push({ type: TokenType.LBRACE, line });
            currentPosition++;
            continue;
        } else if (currentChar === "}") {
            tokens.push({ type: TokenType.RBRACE, line });
            currentPosition++;
            continue;
        } else if (currentChar === ",") {
            tokens.push({ type: TokenType.COMMA, line });
            currentPosition++;
            continue;
        } else if (currentChar === ".") {
            tokens.push({ type: TokenType.DOT, line });
            currentPosition++;
            continue;
        } else if (currentChar === ";") {
            tokens.push({ type: TokenType.SEMICOLON, line });
            currentPosition++;
            continue;
        } else {
            throw new Error(`Carácter no reconocido: '${currentChar}'`);
        }
    }

    return tokens;
}

function parser(tokens) {
    let currentPosition = 0;

    tokens.push({ type: "EOF" }); // Añadir un token EOF al final

    function getNextToken() {
        return tokens[currentPosition++];
    }
    function parseStatement() {
        const token = getNextToken();

        // Agregar soporte para declaración de variables
        if (token.type === TokenType.VAR) {
            const identifierToken = getNextToken();
            if (identifierToken.type !== TokenType.IDENTIFIER) {
                throw new Error(
                    `Linea(${paramToken.line}): Se esperaba un identificador después de '${token.type}'`
                );
            }

            const identifier = identifierToken.value;
            getNextToken(); // Consume '='
            const value = parseExpression();

            if (getNextToken().type === TokenType.SEMICOLON) {
            } else currentPosition--;

            return { type: TokenType.VAR, identifier, value };
        }

        // Agregar soporte para estructuras de control
        if (token.type === TokenType.IF) {
            getNextToken(); // Consume '('
            const condition = parseCondition();
            if (getNextToken().type !== TokenType.RPAREN) {
                throw new Error(`Linea(${paramToken.line}): Se esperaba un paréntesis de cierre ')'`);
            }
            const consequent = parseBlock();
            let alternate = null;
            if (tokens[currentPosition] && tokens[currentPosition].type === TokenType.ELSE) {
                getNextToken(); // Consume 'else'
                alternate = parseBlock();
            }
            return { type: TokenType.IF, condition, consequent, alternate };
        }

        if (token.type === TokenType.FOR) {
            getNextToken(); // Consume '('
            const initializer = parseStatement();
            const condition = parseCondition();
            getNextToken(); // Consume ';'
            const increment = parseStatement();
            if (getNextToken().type !== TokenType.RPAREN) {
                throw new Error(`Linea(${paramToken.line}): Se esperaba un paréntesis de cierre ')'`);
            }
            const body = parseBlock();
            return {
                type: TokenType.FOR,
                initializer,
                condition,
                increment,
                body,
            };
        }

        if (token.type === TokenType.WHILE) {
            getNextToken(); // Consume '('
            const condition = parseCondition();
            getNextToken(); // Consume ')'
            const body = parseBlock();
            return { type: TokenType.WHILE, condition, body };
        }

        currentPosition--;
        return parseExpression();
    }

    function parseCondition() {
        let left = parseExpression();

        const operatorToken = getNextToken();
        if (
            operatorToken.type === TokenType.LESS_THAN ||
            operatorToken.type === TokenType.GREATER_THAN ||
            operatorToken.type === TokenType.EQUAL ||
            operatorToken.type === TokenType.LESS_THAN_EQUAL ||
            operatorToken.type === TokenType.GREATER_THAN_EQUAL ||
            operatorToken.type === TokenType.NOT_EQUAL
        ) {
            const right = parseExpression();
            return { type: operatorToken.type, left, right };
        } else if (left.type === TokenType.BOOLEAN) {
            currentPosition--;
            return { type: left.type, value: left.value };
        } else {
            throw new Error(
                `Linea(${operatorToken.line}): Se esperaba un operador de comparación, pero se encontró: '${operatorToken.type}'`
            );
        }
    }

    function parseBlockStatement() {
        const token = getNextToken();
        currentPosition--; // Regresa al token actual
    
        if (token.type === TokenType.RBRACE) {
            return null;
        }
    
        return parseStatement();
    }
    
    function parseBlock() {
        if (getNextToken().type !== TokenType.LBRACE) {
            throw new Error(`Linea(${paramToken.line}): Se esperaba un corchete de apertura '{'`);
        }
    
        const statements = [];
        let statement = parseBlockStatement();
        while (statement) {
            statements.push(statement);
            statement = parseBlockStatement();
        }
    
        if (getNextToken().type !== TokenType.RBRACE) {
            throw new Error(`Linea(${paramToken.line}): Se esperaba un corchete de cierre '}'`);
        }
    
        return statements;
    }

    function parseExpression() {
        let left = parseTerm();

        while (true) {
            const token = getNextToken();

            if (
                token.type === TokenType.PLUS ||
                token.type === TokenType.MINUS
            ) {
                const right = parseTerm();
                left = { type: token.type, left, right };
            } else {
                currentPosition--;
                break;
            }
        }

        return left;
    }

    function parseTerm() {
        let left = parseFactor();

        while (true) {
            const token = getNextToken();

            if (
                token.type === TokenType.MULTIPLY ||
                token.type === TokenType.DIVIDE
            ) {
                const right = parseFactor();
                left = { type: token.type, left, right };
            } else {
                currentPosition--;
                break;
            }
        }

        return left;
    }

    function parseFactor() {
        const token = getNextToken();

        if (token.type === TokenType.NUMBER) {
            return token;
        }

        if (token.type === TokenType.STRING) {
            return token;
        }

        if (token.type === TokenType.BOOLEAN) {
            return token;
        }

        if (token.type === TokenType.IDENTIFIER) {
            const identifier = token.value;
            const nextToken = getNextToken();

            if (nextToken.type === TokenType.INCREMENT || nextToken.type === TokenType.DECREMENT) {
                if (getNextToken().type !== TokenType.SEMICOLON)
                    currentPosition--; // Consume ';'
                return { type: nextToken.type, identifier };
            }

            if (nextToken.type === TokenType.ASSIGN) {
                const value = parseExpression();
                return { type: TokenType.ASSIGN, identifier, value };
            } else if (nextToken.type === TokenType.LPAREN) {
                let next = getNextToken();
                const params = [];
                while (next.type !== TokenType.RPAREN) {
                    if (
                        next.type === TokenType.STRING ||
                        next.type === TokenType.NUMBER
                    ) {
                        params.push(next);
                    }
                    next = getNextToken();
                }

                if (getNextToken().type !== TokenType.SEMICOLON)
                    currentPosition--; // Consume ';'

                return {
                    type: TokenType.IDENTIFIER,
                    identifier,
                    params: params,
                };
            } else if (nextToken.type === TokenType.SEMICOLON) {
                // Saltar el token ';'
                getNextToken();
            } else {
                currentPosition--;
                return { type: TokenType.IDENTIFIER, value: identifier };
            }
        }

        if (token.type === TokenType.LPAREN) {
            const node = parseExpression();
            if (getNextToken().type !== TokenType.RPAREN) {
                throw new Error(`Linea(${token.line}): Se esperaba un paréntesis de cierre ')'`);
            }
            return node;
        }

        // Añadir soporte para funciones con llaves '{}'
        if (token.type === TokenType.FUNCTION) {
            const identifierToken = getNextToken();

            if (identifierToken.type !== TokenType.IDENTIFIER) {
                throw new Error(
                    `Linea(${identifierToken.line}): Se esperaba un identificador después de 'function'`
                );
            }

            const identifier = identifierToken.value;
            getNextToken(); // Consume '('

            const params = [];
            let paramToken = getNextToken();

            while (paramToken.type !== TokenType.RPAREN) {
                if (paramToken.type === TokenType.IDENTIFIER) {
                    const identifier = paramToken.value;
                    if (getNextToken().type === TokenType.ASSIGN) {
                        const value = parseExpression();
                        params.push({ type: TokenType.VAR, identifier, value });
                    } else {
                        params.push({
                            type: TokenType.VAR,
                            identifier,
                            value: null,
                        });
                        currentPosition--;
                    }
                } else if (paramToken.type === TokenType.COMMA) {
                    // Ignora la coma
                } else {
                    throw new Error(`Linea(${paramToken.line}): Se esperaba un identificador o una coma`);
                }
                paramToken = getNextToken();
            }

            getNextToken(); // Consume '{'
            const body = [];
            while (tokens[currentPosition].type !== TokenType.RBRACE) {
                const statement = parseStatement();
                body.push(statement);
            }
            getNextToken(); // Consume '}'

            return { type: TokenType.FUNCTION, identifier, params, body };
        }

        currentPosition--;
        throw new Error(`Linea(${getNextToken().line}): Se esperaba un número, string, identificador o palabra clave, pero se encontró: '${token.type}'`);
    }

    const ast = {
        type: "Program",
        body: [],
    };

    while (tokens[currentPosition].type !== TokenType.EOF) {
        const statement = parseStatement();

        // Añadir soporte para ';'
        if (
            tokens[currentPosition] &&
            tokens[currentPosition].type === TokenType.SEMICOLON
        ) {
            currentPosition++; // Consume ';'
        }

        ast.body.push(statement);
    }

    return ast;
}

async function fillTable() {
    // get tokens from textarea
    try {
        const tokens = await lexer(textarea.value);
        const ast = parser(tokens);
        console.log(tokens);
        console.log(ast);
    
        // get table
        const tableBody = document.querySelector(".container > tbody");

        // create row
        const row = document.createElement("tr");
        // create 5 columns
        let columns = [
            document.createElement("td"),
            document.createElement("td"),
            document.createElement("td"),
            document.createElement("td"),
            document.createElement("td"),
        ];

        tokens.forEach((element) => {
            const { type, value, line } = element;
            switch (type) {
                case TokenType.IF:
                case TokenType.VAR:
                case TokenType.FUNCTION:
                case TokenType.ELSE:
                case TokenType.WHILE:
                case TokenType.FOR:
                    if (columns[0].textContent != "")
                        columns[0].textContent += ", ";
                    columns[0].textContent += `Linea(${line}): ${type}`;
                    break;
                case TokenType.LESS_THAN:
                    if (columns[1].textContent != "")
                        columns[1].textContent += ", ";
                    columns[1].textContent += `Linea(${line}): <`;
                    break;
                case TokenType.GREATER_THAN:
                    if (columns[1].textContent != "")
                        columns[1].textContent += ", ";
                    columns[1].textContent += `Linea(${line}): >`;
                    break;
                case TokenType.LESS_THAN_EQUAL:
                    if (columns[1].textContent != "")
                        columns[1].textContent += ", ";
                    columns[1].textContent += `Linea(${line}): <=`;
                    break;
                case TokenType.GREATER_THAN_EQUAL:
                    if (columns[1].textContent != "")
                        columns[1].textContent += ", ";
                    columns[1].textContent += `Linea(${line}): >=`;
                    break;
                case TokenType.EQUAL:
                    if (columns[1].textContent != "")
                        columns[1].textContent += ", ";
                    columns[1].textContent += `Linea(${line}): ==`;
                    break;
                case TokenType.NOT_EQUAL:
                    if (columns[1].textContent != "")
                        columns[1].textContent += ", ";
                    columns[1].textContent += `Linea(${line}): !=`;
                    break;
                case TokenType.IDENTIFIER:
                    if (columns[2].textContent != "")
                        columns[2].textContent += ", ";
                        columns[2].textContent += `Linea(${line}): ${value}`;
                    break;
                case TokenType.STRING:
                    if (columns[3].textContent != "")
                        columns[3].textContent += ", ";
                    columns[3].textContent += `Linea(${line}): ${value}`;
                    break;
                case TokenType.NUMBER:
                    if (columns[4].textContent != "")
                        columns[4].textContent += ", ";
                    columns[4].textContent += `Linea(${line}): ${value}`;
                    break;
                default:
                    break;
            }
        });

        // insert columns in the row
        columns.forEach((column) => row.appendChild(column));
        // insert row in the table
        tableBody.appendChild(row);
    } catch (error) {
        showAlert(error.message);
    }
}

function showAlert(message) {
    const errorAlert = document.getElementById('errorAlert');
    errorAlert.classList.remove('hidden');
    errorAlert.textContent = message;

    setTimeout(() => {
        errorAlert.classList.add('hidden');
    }, 3000);
}
