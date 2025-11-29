function sum(...numbers) {
    return numbers.reduce((total, num) => total + num, 0);
}

console.log(sum(1, 2, 3)); // 6
console.log(sum(10, 20, 30, 40)); // 100
console.log(sum()); // 0

function multiply(factor, ...numbers) {
    return numbers.map(num => num * factor);
}

console.log(multiply(2, 1, 2, 3)); // [2, 4, 6]
console.log(multiply(3, 10, 20, 30)); // [30, 60, 90]
console.log(multiply(5)); // []

function createUser(name, age, ...hobbies) {
    return {
        name,
        age,
        hobbies
    };
}

console.log(createUser("Alice", 30, "reading", "traveling"));
console.log(createUser("Bob", 25));
console.log(createUser("Charlie", 40, "gaming", "cooking", "hiking"));