const fn = require("./FnController.js");
const mysql = require('mysql2/promise');
var moment = require('moment');
class User {
    async getUserLocked(user_to = 0,user_from = 0){
        try{
            const conn = await mysql.createConnection(DB.config);
            let sql = `select * from uni_chat_locked WHERE chat_locked_user_id=${user_to} and chat_locked_user_id_locked=${user_from}`;
            let [rows,fields]=await conn.execute(sql);
            conn.end();
            return rows[0] ? true : false;
        }catch(err){
            let resBody = {
                "status": "error",
                "id": -16,
                "massage":"Empty hash_id in respons body",
                "debug":{
                    "err":err,
                }
            }
            return resBody;
        }
    }
    async chatDialog(id_hash = 0){
        try{
            const conn = await mysql.createConnection(DB.config);
            let sql = `select * from uni_chat_users where chat_users_id_hash="${id_hash}" and chat_users_id_user=${user_id}`;
            let [rows,fields]=await conn.execute(sql);
            let getChatUser = rows[0];
            sql = `SELECT * FROM uni_ads 
            INNER JOIN uni_city ON uni_city.city_id = uni_ads.ads_city_id
            INNER JOIN uni_region ON uni_region.region_id = uni_ads.ads_region_id
            INNER JOIN uni_country ON uni_country.country_id = uni_ads.ads_country_id
            INNER JOIN uni_category_board ON uni_category_board.category_board_id = uni_ads.ads_id_cat
            INNER JOIN uni_clients ON uni_clients.clients_id = uni_ads.ads_id_user where ads_id=${getChatUser.chat_users_id_ad}`;
            [rows,fields]=await conn.execute(sql);
            let getAd = rows[0]
            let str2hash = String(getChatUser.chat_users_id_ad)+String(getChatUser.chat_users_id_interlocutor);
            let hash1 = crypto.createHash('md5').update(str2hash).digest('hex');
            str2hash = String(getChatUser.chat_users_id_ad)+String(getChatUser.chat_users_id_user);
            let hash2 = crypto.createHash('md5').update(str2hash).digest('hex');

            if(id_hash == hash1 || id_hash == hash2){
                let sql = `update uni_chat_messages set chat_messages_status=1 where chat_messages_id_hash="${id_hash}" and chat_messages_id_user!=${user_id}`;
                let [rows,fields]=await conn.execute(sql);
                sql = `select chat_messages_id_hash from uni_chat_messages where chat_messages_id_hash="${id_hash}" order by chat_messages_date asc`;
                [rows,fields]=await conn.execute(sql);
                let getDialog = rows;
                sql = `select * from uni_chat_locked WHERE chat_locked_user_id=${user_id} and chat_locked_user_id_locked=${getChatUser.chat_users_id_interlocutor}`;
                [rows,fields]=await conn.execute(sql);
                let getLocked = rows;
                sql = `select * from uni_chat_locked WHERE chat_locked_user_id=${getChatUser.chat_users_id_interlocutor} and chat_locked_user_id_locked=${user_id}`;
                [rows,fields]=await conn.execute(sql);
                let getMyLocked = rows;
                //*Возвращаем полученные из бд данные о чатах
                return {
                    "dialogs":getDialog,
                    "locked":getLocked,
                    "my_locked":getMyLocked
                };
            }
        }catch(err){
            let resBody = {
                "status": "error",
                "id": -16,
                "massage":"Empty hash_id in respons body",
                "debug":{
                    "err":err,
                }
            }
            return resBody;
        }
    }

    async sendChat(req){
        let user_id = req.body.user_id;
        const conn = await mysql.createConnection(DB.config);
        try{
            if("hash_id" in req.body && typeof req.body.hash_id != "undefined" && req.body.hash_id != "" && "text" in req.body && typeof req.body.text != "undefined" && req.body.text != ""){
                let sql = `select * from uni_chat_users where chat_users_id_hash="${req.body.hash_id}" and chat_users_id_user=${user_id}`;
                let [rows,fields]=await conn.execute(sql);
                let getUser = rows[0];
                let id_ad = getUser.chat_users_id_ad;
                let user_from = getUser.chat_users_id_interlocutor;
                let user_to = user_id;
                let isBlockad = await this.getUserLocked(user_from, user_to);
                //* Провоерка на блокировку пользователя
                if(isBlockad){
                    return {"isBlockad":isBlockad};
                }
                // //*Шифруем сообщение
                let textEncript = await fn.encrypt(req.body.text)
                sql = `INSERT INTO uni_chat_users(chat_users_id_ad,chat_users_id_user,chat_users_id_hash,chat_users_id_interlocutor)VALUES(${id_ad},${user_to},"${req.body.hash_id}",${user_from})`;
                [rows,fields]=await conn.execute(sql);
                sql = `INSERT INTO uni_chat_messages(chat_messages_text,chat_messages_date,chat_messages_id_hash,chat_messages_id_user,chat_messages_action,chat_messages_attach)VALUES("${textEncript}","${moment().format('YYYY-MM-DD HH:mm:ss')}","${req.body.hash_id}",${user_from},0,0)`;
                [rows,fields]=await conn.execute(sql);
                let chat = await this.chatDialog(req.body.hash_id);
                //* Делаем возврат диалога
                if(!('status' in chat)){
                   return chat;
                }else{
                    return {"error":chat};
                }
            }else{
                let resBody = {
                    "status": "error",
                    "id": -16,
                    "massage":"Empty hash_id or text in respons body",
                    "debug":{
                        "hash_id":req.body.hash_id,
                        "text":req.body.text,
                        "type hash_id":typeof req.body.hash_id,
                        "type text":typeof req.body.text,
                    }
                }
                res.status(400).json(resBody);
            }
        }catch(err){
            console.log('error',err)
            let resBody = {
                "status": "error",
                "id": -16,
                "massage":"Error",
                "debug":{
                    "err":err,
                }
            }
            res.status(500).json(resBody);
        }
    }

    async sendChatAction(id_ad, action, user_to,user_from, text){
        try{
            const conn = await mysql.createConnection(DB.config);
            text = await fn.encrypt(text);
            let str2hash = String(id_ad)+String(user_from);
            let hash = crypto.createHash('md5').update(str2hash).digest('hex');
            sql = `INSERT INTO uni_chat_users(chat_users_id_ad,chat_users_id_user,chat_users_id_hash,chat_users_id_interlocutor)VALUES(${id_ad},${user_to},${hash},${user_from})`;
            [rows,fields]=await conn.execute(sql);
            sql = `INSERT INTO uni_chat_messages(chat_messages_text,chat_messages_date,chat_messages_id_hash,chat_messages_id_user,chat_messages_action)VALUES(${text},"${moment().format('YYYY-MM-DD HH:mm:ss')}","${id_hash}",${user_from},${action})`;
            [rows,fields]=await conn.execute(sql);
            conn.end();
            return true;
        }catch(err){
            console.log(err);
            return false;
        }
    }

    async sendMail(email, subject, text, html =''){
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
}

module.exports = User;