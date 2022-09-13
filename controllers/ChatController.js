const DB = require("./DbController.js");
const fn = require("./FnController.js");
const mysql = require('mysql2/promise');
const crypto = require('crypto');
var moment = require('moment');

//инициализация чата. Если есть уже чат - отправляем хаш этого чата или создаем новый хэш
exports.init = async (req,res)=>{
    let user_id = req.body.user_id;
    const conn = await mysql.createConnection(DB.config);
    if("ad_id" in req.body && typeof req.body.ad_id !="undefined" && req.body.ad_id !=""){
        try{
            let ad_id = req.body.ad_id;
            let sql = `select * from uni_ads where ads_id= ${ad_id}`;;
            let [rows,fields]=await conn.execute(sql);
            let getAd = rows[0];
            if(getAd){
                let sql = `SELECT * FROM uni_clients LEFT JOIN uni_city ON uni_city.city_id = uni_clients.clients_city_id  where clients_id=${getAd.ads_id_user}`;
                let [rows,fields]=await conn.execute(sql);
                let interlocutor = rows[0];
                if(interlocutor){
                    let sql = `SELECT * FROM uni_ads WHERE ads_id=${ad_id} and (ads_id_user=${user_id} or ads_id_user=${interlocutor.clients_id})`;
                    let [rows,fields]=await conn.execute(sql);
                    if(rows[0]){
                        sql = `SELECT * FROM uni_chat_users WHERE chat_users_id_ad=${ad_id} and chat_users_id_user=${user_id} and chat_users_id_interlocutor=${interlocutor.clients_id}`;
                        [rows,fields]=await conn.execute(sql);
                        let getUserChat = rows[0];
                        if(!getUserChat){
                            let str2hash = String(ad_id)+String(user_id);
                            let id_hash = crypto.createHash('md5').update(str2hash).digest('hex');
                            sql = `INSERT INTO uni_chat_users(chat_users_id_ad,chat_users_id_user,chat_users_id_hash,chat_users_id_interlocutor)VALUES(${id_ad},${user_id},"${id_hash}",${interlocutor.clients_id})`;
                            [rows,fields]=await conn.execute(sql);
                        }else{
                            var id_hash = getUserChat.chat_users_id_hash
                        }
                    }
                }
            }
            //*Отдаем данные чаата из функции await chatUsers(id_hash)
            let getChatUser = await chatUsers(id_hash);
            if(!("status" in getChatUser)){
                res.json(getChatUser)
            }else{
                res.status(500).json(getChatUser);
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
    async function chatUsers(id_hash){
        try{
            let listUsers = new Map;
            let sql =`select * from uni_chat_users where chat_users_id_user=${user_id} order by chat_users_id desc`;
            let [rows,fields]=await conn.execute(sql);
            let get = rows;
            if(get.length>0){
                for(let i=0; i<get.length; i++){
                    listUsers.set(get[i].chat_users_id_hash,get[i]);
                }
            }
            let msgMap = new Map;
            if(listUsers.size>0){
                for (let hash of listUsers){
                    sql = `SELECT * FROM uni_ads
                    INNER JOIN uni_city ON uni_city.city_id = uni_ads.ads_city_id
                    INNER JOIN uni_region ON uni_region.region_id = uni_ads.ads_region_id
                    INNER JOIN uni_country ON uni_country.country_id = uni_ads.ads_country_id
                    INNER JOIN uni_category_board ON uni_category_board.category_board_id =uni_ads.ads_id_cat
                    INNER JOIN uni_clients ON uni_clients.clients_id = uni_ads.ads_id_user where ads_id="${hash[1].chat_users_id_ad}"`;
                    [rows,fields]=await conn.execute(sql);
                    if(rows[0]){
                        sql = `select * from uni_chat_messages where chat_messages_id_hash="${hash[1].chat_users_id_hash}" order by chat_messages_date desc`;
                        [rows,fields]=await conn.execute(sql);
                        let getMsg = rows[0];
                        let getMsgText = await fn.decrypt(getMsg.chat_messages_text)
                        msgMap.set(hash[0], {
                            "hash":hash[0],
                            "messages_id":getMsg.chat_messages_id,
                            "date":getMsg.chat_messages_date,
                            "I_am":getMsg.chat_messages_id_user == hash[1].chat_users_id_user ? true : false,
                            "action":getAction(getMsg.chat_messages_action),
                            "id_user":getMsg.chat_messages_id_user,
                            "notification":getMsg.chat_messages_notification,
                            "id_responder":getMsg.chat_messages_id_responder,
                            "text":getMsgText
                        })
                    }
                }
                function getAction(action){
                    let text = '';
                    switch (action) {
                        case 1:
                            text = 'Покупатель добавил объявление в избранное'
                            break;
                        case 2:
                            text = 'Ваш номер просмотрели'
                            break;
                        case 3:
                            text = 'Оформление заказа'
                            break;
                        case 4:
                            text = 'У вас новый отзыв'
                            break;
                        case 5:
                            text = 'Вы победили в аукционе'
                            break;
                        case 6:
                            text = 'Ваша ставка перебита'
                            break;
                        default:
                            text = 'Сообщение'
                            break;
                    }
                    return text;
                }
            }
            conn.end();
            return Array.from(msgMap.values());

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

                                        sql = `select chat_messages_id_hash from uni_chat_messages where chat_messages_id_hash='${hash_id}' order by chat_messages_date asc`;
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
            conn.end();
            res.json({
                "all":allSend,
                "active":active.total,
                "hash_chats":hash_counts
            });
        }else{
            conn.end();
            res.json('status' in active ? active : all)
        }
    }else{
        if(!('status' in all && all.status =="error")){
            conn.end();
            res.json({
                "all":allSend,
                "active":"",
                "hash_chats":hash_counts
            });
        }else{
            conn.end();
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

exports.user_locked = async (req,res)=>{
    let user_id = req.body.user_id;
    const conn = await mysql.createConnection(DB.config);
    if("hash_id" in req.body && typeof req.body.hash_id != "undefined" && req.body.hash_id != ""){
        try{
            let sql = `select * from uni_chat_users where chat_users_id_hash="${req.body.hash_id}" and chat_users_id_user=${user_id}`;
            let [rows,fields]=await conn.execute(sql);
            let getUser = rows[0]
            if(getUser){
                let sql = `select * from uni_chat_locked where chat_locked_user_id = ${user_id} and chat_locked_user_id_locked = ${getUser.chat_users_id_interlocutor}`;
                let [rows,fields]=await conn.execute(sql);
                let getLocked = rows;
                if(getLocked.length >0){
                    let sql = `DELETE FROM uni_chat_locked WHERE chat_locked_id=${getLocked[0].chat_locked_id}`;
                    let [rows,fields]=await conn.execute(sql);
                }else{
                    let sql = `INSERT INTO uni_chat_locked(chat_locked_user_id,chat_locked_user_id_locked)VALUES(${user_id},${getUser.chat_users_id_interlocutor})`;
                    let [rows,fields]=await conn.execute(sql);
                }
            }
            sql = `select * from uni_chat_locked where chat_locked_user_id = ${user_id} and chat_locked_user_id_locked = ${getUser.chat_users_id_interlocutor}`;
            [rows,fields]=await conn.execute(sql);
            let dialog = rows
            let chat = await chatDialog(req.body.hash_id);
            
            //* Делаем возврат диалога
            if(!('status' in chat)){
                res.json({"dialog":chat});
            }else{
                res.status(500).json({"error":chat});
            }
        }catch(err){
            let resBody = {
                "status": "error",
                "id": -6,
                "massage":"Error.",
                "debug":{
                    "err":err,
                }
            }
            conn.end();
            res.status(500).json(resBody);
        }
    }else{
        try{
            let sql = `select count(*) as total from uni_chat_users where chat_users_id_user=${user_id} group by chat_users_id_hash`;
            let [rows,fields]=await conn.execute(sql);
            let get = rows[0].total;
            if(get>0){
                res.send('Выберите чат для общения');
            }else{
                res.send('У вас пока нет диалогов');
            }
        }catch(err){
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

    async function chatDialog(id_hash = 0){
        try{
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
                sql = `select * from uni_chat_messages where chat_messages_id_hash="${id_hash}" order by chat_messages_date asc`;
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
}

exports.send = async (req,res)=>{
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
            let isBlockad = await getUserLocked(user_from, user_to);
            //* Провоерка на блокировку пользователя
            if(isBlockad){
                res.json({"isBlockad":isBlockad});
            }
            // //*Шифруем сообщение
            let textEncript = await fn.encrypt(req.body.text)
            sql = `INSERT INTO uni_chat_users(chat_users_id_ad,chat_users_id_user,chat_users_id_hash,chat_users_id_interlocutor)VALUES(${id_ad},${user_to},"${req.body.hash_id}",${user_from})`;
            [rows,fields]=await conn.execute(sql);
            sql = `INSERT INTO uni_chat_messages(chat_messages_text,chat_messages_date,chat_messages_id_hash,chat_messages_id_user,chat_messages_action,chat_messages_attach)VALUES("${textEncript}","${moment().format('YYYY-MM-DD HH:mm:ss')}","${req.body.hash_id}",${user_from},0,0)`;
            [rows,fields]=await conn.execute(sql);
            let chat = await chatDialog(req.body.hash_id);
            //* Делаем возврат диалога
            if(!('status' in chat)){
                res.json(chat);
            }else{
                res.status(500).json({"error":chat});
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
    
    async function chatDialog(id_hash = 0){
        try{
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

    async function getUserLocked(user_to = 0,user_from = 0){
        try{
            let sql = `select * from uni_chat_locked WHERE chat_locked_user_id=${user_to} and chat_locked_user_id_locked=${user_from}`;
            let [rows,fields]=await conn.execute(sql);
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
}