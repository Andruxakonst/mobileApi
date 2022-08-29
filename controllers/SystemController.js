var http = require('http');
var fs = require('fs');
exports.fileUpload = async (urlsArr)=>{
    let resArr = [];
    urlsArr.forEach(url => {
        let now = new Date.now();
        let randFilrName = Math.floor(Math.random() * 10000)+now;
        let puth = '../img/';
        var file = fs.createWriteStream(randFilrName+".jpg");
        var request = http.get(url, function(response) {
            response.pipe(file);
            resArr.push(randFilrName+".jpg");
        });
    });
    console.log(resArr);
    return resArr;
};