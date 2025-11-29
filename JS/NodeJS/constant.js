// const a=10;
//   a=20;  // Error: Assignment to constant variable.
// console.log(a);



// let arr=[23,45,3,223,78,90,12,5,67];
// let crr=[...arr]; // deep copy
// let brr=arr; // reference copy

// brr.push(1000);

// console.log("arr:",arr);
// console.log("brr:",brr);
// console.log("crr:",crr);






// let obj1={name:"Alice"}
// let obj2={name:"Alice"}
// let obj3=obj1

// console.log(obj1==obj2);
// console.log(obj1===obj2);
// console.log(obj1==obj3);
// console.log(obj1===obj3);


const arr=[10,20,30,40,50];
// arr=[60,70,80]; // Error: Assignment to constant variable.
const brr=arr; // reference copy
const crr=[...arr]; // deep copy

brr.push(60);
crr.push(70);

console.log("arr:",arr);
console.log("brr:",brr);
console.log("crr:",crr);