const fetch = require('node-fetch');
const fs = require('fs').promises;
var moment = require('moment');

exports.encrypt = async (plaintext)=>{
    const params = new URLSearchParams();
    params.append("action", "encrypt");
    params.append("text", plaintext);
    const response = await fetch('https://api.crowdfaster.com/test.php', {method: 'POST', body: params});
    return  await response.text();
}
exports.decrypt = async (ciphertext)=>{
    const params = new URLSearchParams();
    params.append("action", "decrypt");
    params.append("text", ciphertext);
    const response = await fetch('https://api.crowdfaster.com/test.php', {
        method: 'POST', 
        body: params,
        headers: {'Content-Type': 'application/x-www-form-urlencoded','Content-Length':300}
    });
    let text = await response.text();
    return text;
}

exports.fileSave = async (files)=>{
    let filePuthArr = [];
    let errors = [];
    try {
        for(let el = 0; el<files.length; el++){
            let date = Date.now().toString();
            let puth = './upload/'+date+'_'+files[el].originalname;
            await fs.writeFile(puth, files[el].buffer);
            filePuthArr.push(puth);
        }
        return filePuthArr;
    } catch (error) {
        console.log(error)
        return error;
    }
}

exports.translit = (str)=>{ var magic = function(lit){ var arrayLits = [ ["а","a"], ["б","b"], ["в","v"], ["г","g"], ["д","d"], ["е","e"], ["ё","yo"], ["ж","zh"], ["з","z"], ["и","i"], ["й","j"], ["к","k"], ["л","l"], ["м","m"], ["н","n"], ["о","o"], ["п","p"], ["р","r"], ["с","s"], ["т","t"], ["у","u"], ["ф","f"], ["х","h"], ["ц","c"], ["ч","ch"], ["ш","w"], ["щ","shh"], ["ъ","''"], ["ы","y"], ["ь","'"], ["э","e"], ["ю","yu"], ["я","ya"], ["А","A"], ["Б","B"], ["В","V"], ["Г","G"], ["Д","D"], ["Е","E"], ["Ё","YO"], ["Ж","ZH"], ["З","Z"], ["И","I"], ["Й","J"], ["К","K"], ["Л","L"], ["М","M"], ["Н","N"], ["О","O"], ["П","P"], ["Р","R"], ["С","S"], ["Т","T"], ["У","U"], ["Ф","F"], ["Х","H"], ["Ц","C"], ["Ч","CH"], ["Ш","W"], ["Щ","SHH"], ["Ъ",""], ["Ы","Y"], ["Ь",""], ["Э","E"], ["Ю","YU"], ["Я","YA"], ["0","0"], ["1","1"], ["2","2"], ["3","3"], ["4","4"], ["5","5"], ["6","6"], ["7","7"], ["8","8"], ["9","9"], ["a", "a"], ["b", "b"], ["c", "c"], ["d", "d"], ["e", "e"], ["f", "f"], ["g", "g"], ["h", "h"], ["i", "i"], ["j", "j"], ["k", "k"], ["l", "l"], ["m", "m"], ["n", "n"], ["o", "o"], ["p", "p"], ["q", "q"], ["r", "r"], ["s", "s"], ["t", "t"], ["u", "u"], ["v", "v"], ["w", "w"], ["x", "x"], ["y", "y"], ["z", "z"], ["A", "A"], ["B", "B"], ["C", "C"], ["D", "D"], ["E", "E"], ["F", "F"], ["G", "G"], ["H", "H"], ["I", "I"], ["J", "J"], ["K", "K"], ["L", "L"], ["M", "M"], ["N", "N"], ["O", "O"], ["P", "P"], ["Q", "Q"], ["R", "R"], ["S", "S"], ["T", "T"], ["U", "U"], ["V", "V"], ["W", "W"], ["X", "X"], ["Y", "Y"], ["Z", "Z"], [" ", "_"] ]; var efim360ru = arrayLits.map(i=>{if (i[0]===lit){return i[1]}else{return undefined}}).filter(i=>i!=undefined); if (efim360ru.length>0){return efim360ru[0]} else{return "-"} }; return Array.from(str).map(i=>magic(i)).join("") }