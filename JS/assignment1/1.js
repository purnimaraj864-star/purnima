// sum of array elements
function sumArray(arr) {
   let sum = 0;
    for (let i = 0; i < arr.length; i++) {
         sum = sum + arr[i];
    }
    return sum;
}

let arr = [1, 2, 3, 4, 5];
console.log("Sum of array elements:", sumArray(arr));

