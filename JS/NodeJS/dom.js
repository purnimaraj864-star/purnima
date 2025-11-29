let depesh={
    "name":"Depesh",
    "age":91,
    "display": function(){
        console.log ("hi");
        console.log (this);
        console.log (this.name);
    },
}
console.log (depesh);
depesh.display();