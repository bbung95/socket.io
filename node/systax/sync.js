var fs = require('fs');

// 
// console.log('A');
// var result = fs.readFileSync('systax/sample.txt','utf-8',);
// console.log(result);
// console.log('C');


console.log('A');
var result = fs.readFile('systax/sample.txt','utf-8',function(err,result){
    console.log(result);
});
console.log('C');

// sync 는 비동기화 