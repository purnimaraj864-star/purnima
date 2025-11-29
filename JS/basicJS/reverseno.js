let no=123
    let i=0;

let rev=0;
while(no>0) 
{
    let digit=no%10;
    rev=rev*10+digit;
    no=no-(digit * Math.pow (10,i));
    i++;
}
console.log(rev);