const form = document.querySelector(".form");
const textarea = document.querySelector(".form textarea");

form.addEventListener("submit", evt => {
    evt.preventDefault();
    fillTable();
});

document.addEventListener("DOMContentLoaded", init());
async function init() {
    fillTable(await lex(textarea.value));
}

async function lex(input) {
    const tokens = [];
    const url = "./js/Alphabet.json";
    let i = 0;

    try {
        const response = await fetch(url);
        let { numbers, letters, operators, words, messages } = await response.json();

        numbers = RegExp(numbers);
        let operatorsRegex = RegExp(operators.regex);
        operators = operators.array;
        letters = RegExp(letters);
        messages = RegExp(messages);

        while (i < input.length) {
            let c = input[i];

            // Match a number
            if (numbers.test(c)) {
                let value = "";

                while (i < input.length && numbers.test(input[i])) {
                    value += input[i];
                    i++;
                }

                tokens.push({ type: "number", value });
                continue;
            }

            // Match an operator
            if (operatorsRegex.test(c)) {
                let value = "";

                while (i < input.length && operatorsRegex.test(input[i])) {
                    value += input[i];
                    i++;
                }

                if(operators.some(variant => variant == value.toLocaleLowerCase())) {
                    tokens.push({ type: "operator", value: value });
                } else {
                    // If we get here, we have an unexpected combination
                    throw new Error(`Unexpected character: ${c}`);
                }
                continue;
            }

            // Match a variable or reserved word
            if (letters.test(c)) {
                let value = "";

                while (i < input.length && (letters.test(input[i]) || numbers.test(input[i]))) {
                    value += input[i];
                    i++;
                }

                if(words.some(word => word == value.toLocaleLowerCase())) {
                    tokens.push({ type: "word", value });
                } else {
                    tokens.push({ type: "variable", value });
                }
                continue;
            }

            // Match a message
            if (messages.test(c)) {
                i++;
                let value = "";

                while (i < input.length && !messages.test(input[i])) {
                    value += input[i];
                    i++;
                }

                tokens.push({ type: "message", value });
                i++;
                continue;
            }

            // Match whitespace
            if (/\s/.test(c)) {
                i++;
                continue;
            }

            // If we get here, we have an unexpected character
            throw new Error(`Unexpected character: ${c}`);
        }
    } catch (error) {
        console.log(error);
    }

    return tokens;
}

async function fillTable() {
    // get tokens from textarea
    const tokens = await lex(textarea.value);

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
        document.createElement("td")
    ];
    
    tokens.forEach((element) => {
        const { type, value } = element;

        switch (type) {
            case "word":
                if (columns[0].textContent != "") columns[0].textContent += ", "; 
                columns[0].textContent += value;
                break;
            case "operator":
                if (columns[1].textContent != "") columns[1].textContent += ", "; 
                columns[1].textContent += value;
                break;
            case "number":
                if (columns[4].textContent != "") columns[4].textContent += ", "; 
                columns[4].textContent += value;
                break;
            case "variable":
                if (columns[2].textContent != "") columns[2].textContent += ", "; 
                columns[2].textContent += value;
                break;
            case "message":
                if (columns[3].textContent != "") columns[3].textContent += ", "; 
                columns[3].textContent += value;
                break;
            default:
                break;
        }
    });

    // insert columns in the row
    columns.forEach(column => row.appendChild(column));
    // insert row in the table
    tableBody.appendChild(row);
}
