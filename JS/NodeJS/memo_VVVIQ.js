function fn(n){
    let ans=1;
    for(let i=1;i<=n;i++){
        ans=ans*i;
    }
    return ans; 
}


// ye line 12(14) se 26(23) tak memoization ka kaam karegi ****VVVVImportant Question for Interview

function memoizedFact(fn){
    let cache={};
    return function(n){
        if(n in cache){
            console.log("Fetching from cache");
            return cache[n];
        }
        else{
            console.log("Calculating result");
            let result=fn(n);
            cache[n]=result;
            return result;
        }
    }
}

let factorial=memoizedFact(fn);

console.log(factorial(5));
console.log(factorial(6));
console.log(factorial(5));
console.log(factorial(7));
console.log(factorial(6));