function openbankaccount(){
   let balance=0;
   function deposite(amount){
    balance=balance+amount;
    console.log(`updated balance is = ${balance}`);
   }
   function withdrawl(amount){
    if(balance >=amount){
        balance=balance-amount;
    console.log(` thank you! updated balance is = ${balance}`);
    }
    else{
        console.log(`insufficient balance ${balance} , kami=${amount-balance}`);
    }
   }
   return {deposite,withdrawl};
}

let ayush=openbankaccount();
console.log(ayush);
ayush.deposite(4000);
ayush.withdrawl(500);
ayush.withdrawl(500);
ayush.withdrawl(150);
ayush.withdrawl(250);
ayush.withdrawl(200);
ayush.withdrawl(300);
ayush.withdrawl(100);
ayush.withdrawl(700);




