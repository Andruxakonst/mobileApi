const DB = require("./DbController.js");
var bcrypt = require('bcrypt');
exports.auth = (req,res,next)=>{
    let sql = `
    SELECT 
        clients_id AS id,
        clients_pass AS pass,
        clients_email AS email,
        clients_tariff_id AS tarif,
        clients_status AS status 
    FROM 
        uni_clients 
    WHERE `;
    if(req.body.email){
        sql +=`clients_email = "${req.body.email}"`;
    }else{
        sql +=`clients_phone = "${req.body.tel}"`;
    };
    DB.connection.query(sql,
    (err, results)=>{
        if(results){
            req.body.results = results[0]; 
            next();
        }else{
            let resBody = {
                "status": "error",
                "id": -5,
                "massage":"Failed to retrieve user data from database.",
                "debug":{
                "DB_err":err,
                "SQL":sql,
                }
            }
            res.status(400).json(resBody);
            }
        });
}
exports.authHeadLoginPass = (req,res,next)=>{
    if('auth' in req.headers){
        if(typeof req.headers.auth != 'undefined' && req.headers.auth == '1234567890!@#$%^&*()QWERTYUIOP'){
            if(req.body && typeof req.body != "undefined",Object.keys(req.body).length > 0){ //проверяем что есть данные
                if(('email' in req.body && typeof req.body.email != 'undefined' || 'phone' in req.body && typeof req.body.phone != 'undefined') && 'token' in req.body){
                    let sql = `
                    SELECT 
                    clients_id AS id,
                    clients_pass AS pass,
                    clients_email AS email,
                    clients_tariff_id AS tarif,
                    clients_status AS status 
                    FROM 
                    uni_clients 
                    WHERE `;
                    if(req.body.email){
                        sql +=`clients_email = "${req.body.email}"`;
                    }else{
                        sql +=`clients_phone = "${req.body.phone}"`;
                    };
                    DB.connection.query(sql,
                    (err, results)=>{
                        if(results){
                            user_id = results[0].id;
                            let hash = results[0].pass; 
                            hash = hash.replace(/^\$2y(.+)$/i, '$2a$1');
                            bcrypt.compare(req.body.pass+"2b041ac127efd8862025e026176713d3", hash, (err_hash, res_hash)=>{
                                if(res_hash){
                                    if(results[0].status >0){
                                        next();
                                    }else{
                                        let resBody = {
                                            "status": "error",
                                            "id": -7,
                                            "massage":"Error user status.",
                                            "debug":{
                                                "status":results[0].status,
                                            }
                                        }
                                        res.status(400).json(resBody);
                                    }
                                }else{
                                    let resBody = {
                                    "status": "error",
                                    "id": -6,
                                    "massage":"Login or password is not correct.",
                                    "debug":{}
                                    }
                                    res.status(401).json(resBody);
                                }
                            });
                        }else{
                            let resBody = {
                                "status": "error",
                                "id": -5,
                                "massage":"Failed to retrieve user data from database.",
                                "debug":{
                                "DB_err":err,
                                "SQL":sql,
                                }
                            }
                            res.status(400).json(resBody);
                            }
                        });
                    }else{
                        let resBody = {
                        "status": "error",
                        "id": -4,
                        "massage":"Empty data in request",
                        "debug":{
                            "req.body.email":req.body.email,
                            "req.body.phone":req.body.phone,
                            "req.body.pass":req.body.pass,
                        }
                        }
                        res.status(400).json(resBody);
                    }
                }else{
                let resBody = {
                    "status": "error",
                    "id": -3,
                    "massage":"Empty data in request body or request body = undefined",
                    "debug":{
                    "req.body":req.body,
                    "req.body type":typeof req.body,
                    }
                }
                res.status(400).json(resBody);
                }
        }else{
            let resBody = {
                "status": "error",
                "id": -2,
                "massage":"Unauthorized.Uncorrect auth in headers",
                "debug":{
                    "auth":req.headers.auth,
                }
            }
            res.status(401).json(resBody);
        };
    }else{
        let resBody = {
            "status": "error",
            "id": -1,
            "massage":"Unauthorized.Missing auth in headers",
            "debug":{
                "req.headers type":typeof req.headers.auth,
            }
        }
        if(typeof req.headers.auth !='undefined'){
            resBody["req.headers.auth"] = req.headers.auth;
        }
        res.status(401).json(resBody);
    };
}
exports.authHeaderId = (req,res,next)=>{
    if('auth' in req.headers){
        if(typeof req.headers.auth != 'undefined' && req.headers.auth == '1234567890!@#$%^&*()QWERTYUIOP'){
            if('id' in req.body && typeof req.body.id != 'undefined'){
                next();
            }else{
                let resBody = {
                    "status": "error",
                    "id": -3,
                    "massage":"Empty data in request body or request body = undefined",
                    "debug":{
                    "req.body":req.body,
                    "req.body type":typeof req.body,
                    }
                }
                res.status(400).json(resBody);
            }
        }else{
            let resBody = {
                "status": "error",
                "id": -2,
                "massage":"Unauthorized.Uncorrect auth in headers",
                "debug":{
                    "auth":req.headers.auth,
                }
            }
            res.status(401).json(resBody);
        };
    }else{
        let resBody = {
            "status": "error",
            "id": -1,
            "massage":"Unauthorized.Missing auth in headers",
            "debug":{
                "req.headers type":typeof req.headers.auth,
            }
        }
        if(typeof req.headers.auth !='undefined'){
            resBody["req.headers.auth"] = req.headers.auth;
        }
        res.status(401).json(resBody);
    };
}
exports.authHeader = (req,res,next)=>{
    if('auth' in req.headers){
        if(typeof req.headers.auth != 'undefined' && req.headers.auth == '1234567890!@#$%^&*()QWERTYUIOP'){
            next();
        }else{
            let resBody = {
                "status": "error",
                "id": -2,
                "massage":"Unauthorized.Uncorrect auth in headers",
                "debug":{
                    "auth":req.headers.auth,
                }
            }
            res.status(401).json(resBody);
        };
    }else{
        let resBody = {
            "status": "error",
            "id": -1,
            "massage":"Unauthorized.Missing auth in headers",
            "debug":{
                "req.headers type":typeof req.headers.auth,
            }
        }
        if(typeof req.headers.auth !='undefined'){
            resBody["req.headers.auth"] = req.headers.auth;
        }
        res.status(401).json(resBody);
    };
}

exports.authHeaderToken = (req,res,next)=>{
    if('auth' in req.headers){
        if(typeof req.headers.auth != 'undefined' && req.headers.auth == '1234567890!@#$%^&*()QWERTYUIOP'){
            if(typeof req.headers.token != 'undefined'){
                let token = req.headers.token;
                let data = token[token.length-1]+token.slice(0, -1);
                let text = JSON.parse(Buffer.from(data, 'base64').toString('ascii'));
                    let sql = `
                    SELECT 
                        clients_id AS id,
                        clients_status AS status,
                        clients_email AS email,
                        clients_tariff_id AS tarif,
                        clients_status AS status 
                    FROM 
                        uni_clients 
                    WHERE `;
                    if(text.email){
                        sql +=`clients_email = "${text.email}"`;
                    }else{
                        sql +=`clients_phone = "${text.tel}"`;
                    };
                    DB.connection.query(sql,
                    (err, results)=>{
                        if(err){
                            let resBody = {
                                "status": "error",
                                "id": -5,
                                "massage":"Failed to retrieve user data from database.",
                                "debug":{
                                "DB_err":err,
                                "SQL":sql,
                                }
                            }
                            res.status(400).json(resBody);

                        }else{
                            if(results.length>0 && (results[0].status >0 || req.body.code)){
                                delete req.body.token;
                                req.body.user_id = results[0].id;
                                req.body.email = text.email;
                                req.body.tel = text.tel;
                                next();
                            }else{
                                let resBody = {
                                    "status": "error",
                                    "id": -5,
                                    "massage":"Пользователь не активирован.",
                                    "debug":{
                                        "email":req.body.email,
                                        "tel":req.body.tel
                                    }
                                }
                                if(results.length <1){
                                    resBody.massage ="Пользователь не найден.";
                                }
                                res.status(404).json(resBody);
                            }
                            
                        }
                    });
            }else{
                let resBody = {
                    "status": "error",
                    "id": -3,
                    "massage":"Empty token in request body or request body = undefined",
                    "debug":{
                    "req.body":req.body,
                    "req.body type":typeof req.body,
                    }
                }
                res.status(400).json(resBody);
            }
        }else{
            let resBody = {
                "status": "error",
                "id": -2,
                "massage":"Unauthorized.Uncorrect auth in headers",
                "debug":{
                    "auth":req.headers.auth,
                }
            }
            res.status(401).json(resBody);
        };
    }else{
        let resBody = {
            "status": "error",
            "id": -1,
            "massage":"Unauthorized. Missing auth in headers",
            "debug":{
                "req.headers type":typeof req.headers.auth,
            }
        }
        if(typeof req.headers.auth !='undefined'){
            resBody["req.headers.auth"] = req.headers.auth;
        }
        res.status(401).json(resBody);
    };
}