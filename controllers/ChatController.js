const DB = require("./DbController.js");
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const { send } = require("process");
const { type } = require("express/lib/response.js");
const res = require("express/lib/response.js");

//инициализация чата. Если есть уже чат - отправляем хаш этого чата или создаем новый хэш
exports.init = (req,res)=>{
    let user_id = req.body.user_id;
    if("ad_id" in req.body && typeof req.body.ad_id !="undefined" && req.body.ad_id !=""){
        let ad_id = req.body.ad_id;
        sql = `select * from uni_ads where ads_id= ${ad_id}`;
        DB.connection.query(sql,(err, getAd)=>{
            if(getAd){
                if(getAd.length>0){
                    getAd = getAd[0].ads_id_user;
                    sql = `SELECT * FROM uni_clients LEFT JOIN uni_city ON uni_city.city_id = uni_clients.clients_city_id WHERE clients_id = ${getAd}`;
                    DB.connection.query(sql,(err, interlocator)=>{
                        if(interlocator){
                            interlocator = interlocator[0].clients_id;
                            sql = `SELECT * FROM uni_chat_users WHERE chat_users_id_ad=${ad_id} and chat_users_id_user=${user_id} and chat_users_id_interlocutor=${interlocator}`;
                                DB.connection.query(sql,(err, getUserChat)=>{
                                    if(getUserChat){
                                        if(getUserChat.length > 0){
                                            res.json({"hash":getUserChat[0].chat_users_id_hash,"ad_id": ad_id});
                                        }else{
                                            let str2hash = String(ad_id)+String(user_id);
                                            let hash = crypto.createHash('md5').update(str2hash).digest('hex');
                                            sql = `INSERT INTO uni_chat_users(chat_users_id_ad,chat_users_id_user,chat_users_id_hash,chat_users_id_interlocutor)VALUES(?,?,?,?)`;
                                            let val =[ad_id, user_id, hash, interlocator];
                                            DB.connection.query(sql, val, (err, results)=>{
                                                if(results){
                                                    res.json({"hash":hash,"ad_id": ad_id});
                                                }else{
                                                    let resBody = {
                                                        "status": "error",
                                                        "id": -6,
                                                        "massage":"Error get data from DB.",
                                                        "debug":{
                                                            "sql":sql,
                                                            "error DB":err,
                                                        }
                                                    }
                                                    res.status(400).json(resBody);
                                                }
                                            });
                                        }
                                    }else{
                                        let resBody = {
                                            "status": "error",
                                            "id": -6,
                                            "massage":"Error get data from DB.",
                                            "debug":{
                                                "sql":sql,
                                                "error DB":err,
                                            }
                                        }
                                        res.status(400).json(resBody);
                                    }
                                })
                        }else{
                            let resBody = {
                                "status": "error",
                                "id": -6,
                                "massage":"Error get data from DB.",
                                "debug":{
                                    "sql":sql,
                                    "error DB":err,
                                }
                            }
                            res.status(400).json(resBody);
                        };
                    })
                }else{
                    res.json(getAd)
                }
            }else{
                let resBody = {
                    "status": "error",
                    "id": -6,
                    "massage":"Error get data from DB.",
                    "debug":{
                        "sql":sql,
                        "error DB":err,
                    }
                }
                res.status(400).json(resBody);
            }})
    }else{
        let resBody = {
            "status": "error",
            "id": -17,
            "massage":"Error ad_id.",
            "debug":{
                "type ad_id":typeof ad_id,
            }
        }
        res.status(400).json(resBody);
    }
}

//загрузка чата по его хэшу
exports.load = (req,res)=>{
    let user_id = req.body.user_id;
    if("hash_id" in req.body && typeof req.body.hash_id != "undefined" && req.body.hash_id != ""){
        let hash_id = req.body.hash_id;
        //!Примечание! Возможно в чат необходимо добавить поддержку. Для этого нужно принимать параметр suport hash которого состит из конкотинации'support' и id пользователя
        //!пока отправляем без саппорта
        sql = `select * from uni_chat_users where chat_users_id_hash='${hash_id}' and chat_users_id_user=${user_id}`;
        DB.connection.query(sql,(err, getChatUser)=>{
            if(getChatUser){
                if(getChatUser.length >0){
                    getChatUser = getChatUser[0];
                    sql = `SELECT * FROM uni_ads
                    INNER JOIN uni_city ON uni_city.city_id = uni_ads.ads_city_id
                    INNER JOIN uni_region ON uni_region.region_id = uni_ads.ads_region_id
                    INNER JOIN uni_country ON uni_country.country_id = uni_ads.ads_country_id
                    INNER JOIN uni_category_board ON uni_category_board.category_board_id =uni_ads.ads_id_cat
                    INNER JOIN uni_clients ON uni_clients.clients_id = uni_ads.ads_id_user where ads_id=${getChatUser.chat_users_id_ad}`;
                    DB.connection.query(sql,(err, getAd)=>{
                        if(getAd){
                            getAd = getAd[0];
                            let hashUserInterloc = String(getChatUser.chat_users_id_ad)+String(getChatUser.chat_users_id_interlocutor);
                            let  = String(getChatUser.chat_users_id_ad)+String(getChatUser.chat_users_id_user);
                            if(hash_id == crypto.createHash('md5').update(hashUserInterloc).digest('hex') || hash_id == crypto.createHash('md5').update(hashUserUsre).digest('hex')){
                                sql = `update uni_chat_messages set chat_messages_status=1 where chat_messages_id_hash='${hash_id}' and chat_messages_id_user!=${user_id}`;
                                DB.connection.query(sql,(err, update)=>{
                                    if(update){

                                        sql = `select * from uni_chat_messages where chat_messages_id_hash='${hash_id}' order by chat_messages_date asc`;
                                            DB.connection.query(sql,(err, getDialog)=>{
                                                if(getDialog){
                                                    sql = `select * from uni_chat_locked where chat_locked_user_id=${user_id} and chat_locked_user_id_locked=${getChatUser.chat_users_id_interlocutor}`;
                                                    DB.connection.query(sql,(err, getLocked)=>{
                                                        if(getLocked){
                                                            sql = `select * from uni_chat_locked where chat_locked_user_id=${getChatUser.chat_users_id_interlocutor} and chat_locked_user_id_locked=${user_id}`;
                                                            DB.connection.query(sql,(err, getMyLocked)=>{
                                                                if(getMyLocked){
                                                                    res.json({"dialogs":getDialog, "locked":getLocked, "myLocked":getMyLocked});
                                                                }else{
                                                                    let resBody = {
                                                                        "status": "error",
                                                                        "id": -6,
                                                                        "massage":"Error getMyLocked.",
                                                                        "debug":{
                                                                            "sql":sql,
                                                                            "err":err,
                                                                        }
                                                                    }
                                                                    res.status(400).json(resBody);
                                                                }
                                                            })
                                                        }else{
                                                            let resBody = {
                                                                "status": "error",
                                                                "id": -6,
                                                                "massage":"Error getLocked.",
                                                                "debug":{
                                                                    "sql":sql,
                                                                    "err":err,
                                                                }
                                                            }
                                                            res.status(400).json(resBody);
                                                        }
                                                    })
                                                }else{
                                                    let resBody = {
                                                        "status": "error",
                                                        "id": -6,
                                                        "massage":"Error getDialog.",
                                                        "debug":{
                                                            "sql":sql,
                                                            "err":err,
                                                        }
                                                    }
                                                    res.status(400).json(resBody);
                                                }
                                            })
                                    }else{
                                        let resBody = {
                                            "status": "error",
                                            "id": -6,
                                            "massage":"Error update status.",
                                            "debug":{
                                                "sql":sql,
                                                "err":err,
                                            }
                                        }
                                        res.status(400).json(resBody);
                                    }
                                })
                            }
                        }else{
                            let resBody = {
                                "status": "error",
                                "id": -6,
                                "massage":"Error getAd.",
                                "debug":{
                                    "sql":sql,
                                    "err":err,
                                }
                            }
                            res.status(400).json(resBody);
                        }
                    });
                }else{
                    res.json(getChatUser);
                }
            }else{
                let resBody = {
                    "status": "error",
                    "id": -6,
                    "massage":"Error getChatUser.",
                    "debug":{
                        "sql":sql,
                        "err":err,
                    }
                }
                res.status(400).json(resBody);
            }
        });
    }else{
        sql = `select count(*) as total from uni_chat_users where chat_users_id_user=${user_id} group by chat_users_id_hash`;
        DB.connection.query(sql,(err, data)=>{
            if(data){
                if(data.length >0){
                    res.send('Выберите чат для общения');
                }else{
                    res.send('У вас пока нет диалогов');
                }
            }else{
                let resBody = {
                    "status": "error",
                    "id": -6,
                    "massage":"Error ad_id.",
                    "debug":{
                        "sql":sql,
                        "err":err,
                    }
                }
                res.status(400).json(resBody);
            }
        });
    }
}

//Удаление чата по хэшу
exports.delete = (req,res)=>{
    let user_id = req.body.user_id;
    if("hash_id" in req.body && typeof req.body.hash_id != "undefined" && req.body.hash_id != ""){
        let id_hash = req.body.hash_id;
        sql = `DELETE FROM uni_chat_users WHERE chat_users_id_hash='${id_hash}' and chat_users_id_user=${user_id}`;
        DB.connection.query(sql,(err, data)=>{
            if(data){
                   res.send('Deleted')
            }else{
                let resBody = {
                    "status": "error",
                    "id": -6,
                    "massage":"Error ad_id.",
                    "debug":{
                        "sql":sql,
                        "err":err,
                    }
                }
                res.status(400).json(resBody);
            }
        })
    }else{
        let resBody = {
            "status": "error",
            "id": -6,
            "massage":"Error hash_id.",
            "debug":{
                "hash_id":hash_id,
                "type hash_id":typeof hash_id,
            }
        }
        res.status(400).json(resBody);
    }
}

exports.count_message = async (req,res)=>{
    let user_id = req.body.user_id;
    const conn = await mysql.createConnection(DB.config);
    let all = await getMessage();
    let allSend = all.get('total');
    let allNotTotal = all;
    let hash_counts = []
    Array.from(allNotTotal, ([key, value]) => {
        if(key != 'total'){
            hash_counts.push(value)
        }
    })
    if("hash_id" in req.body && typeof req.body.hash_id != "undefined" && req.body.hash_id != ""){
        let active = await getMessage(req.body.hash_id)
        if(!('status' in active && active.status =="error" && 'status' in all && all.status =="error")){
            res.json({
                "all":allSend,
                "active":active.total,
                "hash_chats":hash_counts
            });
        }else{
            res.json('status' in active ? active : all)
        }
    }else{
        if(!('status' in all && all.status =="error")){
            res.json({
                "all":allSend,
                "active":"",
                "hash_chats":hash_counts
            });
        }else{
            res.json(all)
        }
    }
        //Если hash_id отсутствует или пустой
       
async function getMessage(id_hash=''){
    if(id_hash ==''){
        let results = new Map();
        try{
            let groupBy = new Map();
            let sql = `select * from uni_chat_users where chat_users_id_user=${user_id}`;
            let [rows,fields]=await conn.execute(sql);
            let getAll = rows;
            if(getAll.length >0){
                for(let user = 0; user<getAll.length; user++){
                    if(typeof getAll[user].chat_users_id_interlocutor !='undefined' && getAll[user].chat_users_id_interlocutor !=null&& getAll[user].chat_users_id_interlocutor !=NaN){
                        let sql = `select * from uni_clients where clients_id=${getAll[user].chat_users_id_interlocutor}`;
                        let [rows,fields]=await conn.execute(sql);
                        let get = rows;
                        if(get){
                            groupBy.set(getAll[user].chat_users_id_hash, getAll[user].chat_users_id_hash)
                        }
                    }else{
                        groupBy.set(getAll[user].chat_users_id_hash, getAll[user].chat_users_id_hash)
                    }
                }
                if(groupBy.size >0){
                    let cnt = 0;
                    for(let id_hash of groupBy.keys()){
                        let sql = `select count(*) as total from uni_chat_messages where chat_messages_id_hash="${id_hash}" and chat_messages_status=0 and chat_messages_id_user!=${user_id}`
                        let [rows,fields]=await conn.execute(sql);
                        let count = rows[0];
                        if(count.total>0){
                            results.set(id_hash,id_hash)
                        }
                        cnt += count.total;
                        results.set(`total`,cnt)
                    }
                }
            }
            return results;
        }catch(err){
            let resBody = {
                "status": "error",
                "id": -6,
                "massage":"Error ad_id.",
                "debug":{
                    "sql":sql,
                    "err":err,
                }
            }
            return resBody;
        }
    }else{
        let sql = `select count(*) as total from uni_chat_messages where chat_messages_id_hash="${id_hash}" and  chat_messages_status=0 and chat_messages_id_user!=${user_id}`;

        try{
            let [rows,fields]=await conn.execute(sql);
            return rows[0];
        }catch(err){
            let resBody = {
                "status": "error",
                "id": -6,
                "massage":"Error ad_id.",
                "debug":{
                    "sql":sql,
                    "err":err,
                }
            }
            return resBody;
        }
    }
}

}

exports.send = (req,res)=>{
    res.send('In developing')
}
exports.user_locked = (req,res)=>{
    res.send('In developing')
}

