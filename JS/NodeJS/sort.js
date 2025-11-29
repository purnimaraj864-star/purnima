let arr=[23,45,3,223,78,90,12,5,67];

arr.sort();
console.log(arr);

arr.sort((a,b)=>{
    return a-b;
});
console.log(arr);

arr.sort((a,b)=>{
    return b-a;
});
console.log(arr);

arr.sort((a,b)=>{
    return (a%10)-(b%10);
});
console.log(arr);

arr.sort((a,b)=>{
    return (a%10)-(b%10) || a-b;
});
console.log(arr);