const inputFields = document.querySelectorAll('input');

inputFields.forEach(input => {

    if (!input.hasAttribute('data-exp') || input.hasAttribute('disableOnPress')) {
        return; // Skip inputs without data-exp attribute or disableOnPress attribute
    }
    // Cache the supported character sets by input name to avoid recomputation
    const regexCache = new Map();

    // Extract regex pattern and supported characters only once per input
    const exp = input.getAttribute('data-exp');
    if (exp) {
        try {
            // Cache the supported characters if not already cached
            if (!regexCache.has(exp)) {
                regexCache.set(exp, extractCharacters(new RegExp(exp)));
            }
        } catch (e) {
            console.error(`Invalid regular expression for input with name "${input.name}": ${exp}`);
        }
    }

    input.addEventListener('keyup', function () {
        const supportedChars = regexCache.get(exp);
        if (supportedChars) {
            const message = input.getAttribute('data-suggestion') || `Please enter a valid value for field: ${input.name}`;
            const value = input.value;

            // Create a regex to match any invalid characters
            const invalidCharsRegex = new RegExp(`[^${supportedChars}]`, 'g');
            const invalidChars = value.match(invalidCharsRegex);

            if (invalidChars) {
                flash_error(message);
                // Update the input value only once by removing invalid characters
                input.value = value.replace(invalidCharsRegex, '');
            }
        }
    });
});

function extractCharacters(regex) {
    
    const pattern = regex.toString();

    let charSet = new Set();

    // Handle common escape sequences like \d, \s, \w
    const escapeSequences = {
        '\\d': '0123456789',            // Digits
        '\\s': ' \t\n\r\v\f',           // Whitespace (space, tab, newline, etc.)
        '\\w': 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_'  // Word characters
    };

    // Match all character classes in square brackets [a-zA-Z0-9], etc.
    const matches = pattern.match(/\[([^\]]+)\]/g);
    
    if (matches) {
        matches.forEach(match => {
            const chars = match.slice(1, -1); // Remove the square brackets [ and ]
            for (let i = 0; i < chars.length; i++) {
                let char = chars[i];
                if (char === '-' && i > 0 && i < chars.length - 1) {
                    // Handle ranges like a-z
                    let start = chars.charCodeAt(i - 1);
                    let end = chars.charCodeAt(i + 1);
                    for (let j = start + 1; j < end; j++) {
                        charSet.add(String.fromCharCode(j));
                    }
                } else {
                    charSet.add(char);
                }
            }
        });
    }

    // Match and handle escape sequences in the regex pattern
    Object.keys(escapeSequences).forEach(seq => {
        if (pattern.includes(seq)) {
            for (let char of escapeSequences[seq]) {
                charSet.add(char);
            }
        }
    });

    return [...charSet].join('');
}


function validateInputs() {

    let allValid = true; // Flag to track if all inputs are valid

    // Loop through each input field
    inputFields.forEach(input => {

        // Check if the 'data-exp' attribute exists
        const exp = input.getAttribute('data-exp');
        if (exp) {

            try {
                // Create a new regular expression from the 'data-exp' attribute
                const regex = new RegExp(exp);
                
                // Get the current value of the input field
                const value = input.value;
                
                // Validate the value using the regular expression
                const isValid = regex.test(value);

                const message = input.getAttribute('data-suggestion') || `Please enter a valid value for field: ${input.name}`;
                
                // If the value is not valid, alert the user and set allValid to false
                if (!isValid) {
                    
                    // if flash_error is not defined, define it
                    if (typeof flash_error === 'function') {
                        flash_error(message);
                    }

                    allValid = false;
                }

            } catch (e) {

                console.error(`Invalid regular expression for input with name "${input.name}": ${exp}`);

                allValid = false; // Mark invalid if regex is broken
            }
        }
    });

    return allValid; // Return whether all inputs are valid
}

// Call the validateInputs function when needed (e.g., on form submit or button click)
document.querySelector('form').addEventListener('submit', function(event) {
    // Prevent form submission until validation is complete
    event.preventDefault();

    // Validate inputs
    const isFormValid = validateInputs();

    // If all inputs are valid, submit the form
    if (isFormValid) {
        this.submit(); // Submit the form programmatically
    }
});