let n=102;

for(let i=2;i<n;i++){
    if(n%i==0){
        console.log("not prime");
        break;
    }
    else if (i==n-1){ 
        console.log("prime");
    }
}
  