// Array of object 
function getTopper(students) {
    let topper = students[0];
    for (let i = 1; i < students.length; i++) {
        if (students[i].marks > topper.marks) {
            topper = students[i];
        }
    }
    return topper;
}

let students = [
{ name: "Aman", marks: 85 },
{ name: "Riya", marks: 92 },
{ name: "Kunal", marks: 76 }
];

let topper = getTopper(students);
console.log(topper.name);