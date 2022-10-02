const fetch = require('node-fetch');
const fs = require('fs').promises;
var moment = require('moment');
const nodemailer = require('nodemailer');
const DB = require("./DbController.js");
const mysql = require('mysql2/promise');
const firebase = require("firebase-admin");
const serviceAccount = require('../docs/crowdfaster-9a11a-firebase-adminsdk-uc1pk-f60b5ea352.json');


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

exports.sendMail = async (email, subject, text, html ='')=>{
    try{
        let transporter = nodemailer.createTransport({
            host: 'mail.crowdfaster.com',
            port: 465,
            secure: true,
            auth: {
              user: "no-reply@crowdfaster.com",
              pass: "1}A6#VK5(kb,",
            },
        })
        
        let result = await transporter.sendMail({
            from: '"Код подтверждения" <no-reply@crowdfaster.com>',
            to: email,
            subject: subject,
            text: text,
            html: html,
        })
        
        return await result;
    }catch(err){
        console.log(err);
        return false;
    }
}

exports.massLoop =async ()=>{
    setInterval(eventMass, 3000);
    async function eventMass(){
        try{
            const conn = await mysql.createConnection(DB.config);
            let sql = `SELECT 
            chat_messages_id as messages_id,
            chat_messages_date as date,
            chat_messages_id_hash as chat_id_hash,
            chat_messages_action as type,
            chat_messages_id_user as user_id
            FROM uni_chat_messages WHERE chat_messages_send=0 AND chat_messages_status = 0`;
            let [rows,fields]=await conn.execute(sql);
            let userMassages = rows;
            if(userMassages.length>0){
                for(let msg = 0; msg<userMassages.length; msg++){
                    let messages_id = userMassages[msg].messages_id;
                    let user_id = userMassages[msg].user_id;
                    //проверяем, есть ли у него dev_id
                    let sql =`SELECT dev_id FROM uni_userdata WHERE user_id=${user_id}`;
                    let [rows,fields]=await conn.execute(sql);
                    console.log("Сообщение для user_id", user_id);
                    if(rows.length>0){
                        let devs = rows;
                        for(let dev=0; dev<devs.length; dev++){
                            let sev_id = devs[dev].dev_id;
                            if(sev_id){
                                //
                                await sendPush(dev_id, type, title ,text);
                            }
                            
                        }
                    }
                    sql = `UPDATE uni_chat_messages 
                    SET chat_messages_send = 1 WHERE chat_messages_id=${messages_id}`;
                    [rows,fields]=await conn.execute(sql);
                }
            }
            conn.end();
        }catch(error){
            console.log(error);
        }
    }
}
async function sendPush(dev_id, title ,text){
    //инициализация приложения
    firebase.initializeApp({
        credential: firebase.credential.cert(serviceAccount),
        databaseURL: "https://crowdfaster-9a11a-default-rtdb.europe-west1.firebasedatabase.app"
      });
    const payload = {
        notification: {
          title: title,
          body: text,
        }
      };
      const options = {
        priority: 'high',
        timeToLive: 60 * 60 * 24, // 1 day
      };
      await firebase.messaging().sendToDevice(dev_id, payload, options);
}
exports.testPush = async (req, res)=>{
        let dev_id = "qwri3bl3b543";
        //инициализация приложения
        firebase.initializeApp({
            credential: firebase.credential.cert(serviceAccount),
            databaseURL: "https://crowdfaster-9a11a-default-rtdb.europe-west1.firebasedatabase.app"
          });
    
        const payload = {
            notification: {
              title: "Это тяйтл",
              body: "Это боди",
            }
          };
          const options = {
            priority: 'high',
            timeToLive: 60 * 60 * 24, // 1 day
          };
          console.log( await firebase.messaging().sendToDevice(dev_id, payload, options));
}


exports.translit = (str)=>{ var magic = function(lit){ var arrayLits = [ ["а","a"], ["б","b"], ["в","v"], ["г","g"], ["д","d"], ["е","e"], ["ё","yo"], ["ж","zh"], ["з","z"], ["и","i"], ["й","j"], ["к","k"], ["л","l"], ["м","m"], ["н","n"], ["о","o"], ["п","p"], ["р","r"], ["с","s"], ["т","t"], ["у","u"], ["ф","f"], ["х","h"], ["ц","c"], ["ч","ch"], ["ш","w"], ["щ","shh"], ["ъ","''"], ["ы","y"], ["ь","'"], ["э","e"], ["ю","yu"], ["я","ya"], ["А","A"], ["Б","B"], ["В","V"], ["Г","G"], ["Д","D"], ["Е","E"], ["Ё","YO"], ["Ж","ZH"], ["З","Z"], ["И","I"], ["Й","J"], ["К","K"], ["Л","L"], ["М","M"], ["Н","N"], ["О","O"], ["П","P"], ["Р","R"], ["С","S"], ["Т","T"], ["У","U"], ["Ф","F"], ["Х","H"], ["Ц","C"], ["Ч","CH"], ["Ш","W"], ["Щ","SHH"], ["Ъ",""], ["Ы","Y"], ["Ь",""], ["Э","E"], ["Ю","YU"], ["Я","YA"], ["0","0"], ["1","1"], ["2","2"], ["3","3"], ["4","4"], ["5","5"], ["6","6"], ["7","7"], ["8","8"], ["9","9"], ["a", "a"], ["b", "b"], ["c", "c"], ["d", "d"], ["e", "e"], ["f", "f"], ["g", "g"], ["h", "h"], ["i", "i"], ["j", "j"], ["k", "k"], ["l", "l"], ["m", "m"], ["n", "n"], ["o", "o"], ["p", "p"], ["q", "q"], ["r", "r"], ["s", "s"], ["t", "t"], ["u", "u"], ["v", "v"], ["w", "w"], ["x", "x"], ["y", "y"], ["z", "z"], ["A", "A"], ["B", "B"], ["C", "C"], ["D", "D"], ["E", "E"], ["F", "F"], ["G", "G"], ["H", "H"], ["I", "I"], ["J", "J"], ["K", "K"], ["L", "L"], ["M", "M"], ["N", "N"], ["O", "O"], ["P", "P"], ["Q", "Q"], ["R", "R"], ["S", "S"], ["T", "T"], ["U", "U"], ["V", "V"], ["W", "W"], ["X", "X"], ["Y", "Y"], ["Z", "Z"], [" ", "_"] ]; var efim360ru = arrayLits.map(i=>{if (i[0]===lit){return i[1]}else{return undefined}}).filter(i=>i!=undefined); if (efim360ru.length>0){return efim360ru[0]} else{return "-"} }; return Array.from(str).map(i=>magic(i)).join("") }