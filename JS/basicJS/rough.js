function createrCounter() {
    let cnt = 0;
  function Counter() {
    cnt++;
    console.log(cnt);
  }
//   return cnt;
    return Counter;
}

let ans = createrCounter();
ans();
ans();
ans();
ans();

// console.log(ans);