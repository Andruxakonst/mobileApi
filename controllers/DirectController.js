const DB = require("./DbController.js");
exports.country = (req,res)=>{
    let id='';
    if(req.query && 'id' in req.query && req.query.id != ''){
        id = `WHERE country_id = ${req.query.id}`;
    }
    let sql = `
    SELECT 
      *
  FROM
    uni_country
    ${id}
  ORDER BY
    country_id`;
    DB.connection.query(sql,(err, results)=>{
        if(err){
            res.status(404).send(`Не удалось получить данные из базы. ${err} ${sql}`);
        }else{
            res.json(results);
        }
    });
}

exports.region = (req,res)=>{
    let id='';
    if(req.query && 'id' in req.query && req.query.id != ''){
        id = `WHERE region_id = ${req.query.id}`;
    }
    let sql = `
    SELECT 
      *
  FROM
    uni_region
    ${id}
  ORDER BY
  region_id`;
    DB.connection.query(sql,(err, results)=>{
        if(err){
            res.status(404).send(`Не удалось получить данные из базы. ${err} ${sql}`);
        }else{
            res.json(results);
        }
    });
}

exports.region = (req,res)=>{
    let WHERE='';
    console.log(Object.keys(req.query).length, req.query)
    if(Object.keys(req.query).length>0){
        WHERE = `WHERE `;
    }
    if(req.query && ('region_id' in req.query||'country_id' in req.query) && (req.query.region_id != ''||req.query.country_id != '')){
        if(req.query.region_id){
            WHERE +=`region_id=${req.query.region_id}`;
        };
        if(req.query.country_id){
            if(!req.query.region_id){
                WHERE +=`country_id=${req.query.country_id}`;
            }else{
                WHERE +=` AND country_id=${req.query.country_id}`;
            }
        };
    }
    let sql = `
    SELECT 
      *
  FROM
    uni_region
    ${WHERE}
  ORDER BY
  region_id`;
    DB.connection.query(sql,(err, results)=>{
        if(err){
            res.status(404).send(`Не удалось получить данные из базы. ${err} ${sql}`);
        }else{
            res.json(results);
        }
    });
}

exports.city = (req,res)=>{
    let WHERE='';
    if(Object.keys(req.query).length>0){
        WHERE = `WHERE `;
    }
    if(req.query && ('country_id' in req.query||'region_id' in req.query||'city_id' in req.query) && (req.query.country_id != '' || req.query.region_id != ''||req.query.city_id != '')){
        if(req.query.country_id){WHERE +=`country_id=${req.query.country_id}`};
        if(req.query.region_id){
            if(!req.query.country_id){
                WHERE +=`region_id=${req.query.region_id}`;
            }else{
                WHERE +=` AND region_id=${req.query.region_id}`
            }
        };
        if(req.query.city_id){
            if(!req.query.country_id && !req.query.region_id){
                WHERE +=`city_id=${req.query.city_id}`;
            }
            if(req.query.country_id || req.query.region_id){
                WHERE +=` AND city_id=${req.query.city_id}`;
            }
            
        };
    }
    let sql = `
    SELECT 
      *
  FROM
    uni_city
    ${WHERE}
  ORDER BY
  city_id`;
    DB.connection.query(sql,(err, results)=>{
        if(err){
            res.status(404).send(`Не удалось получить данные из базы. ${err} ${sql}`);
        }else{
            res.json(results);
        }
    });
}

exports.metro = (req,res)=>{
    let WHERE='';
    console.log(Object.keys(req.query).length, req.query)
    if(Object.keys(req.query).length>0){
        WHERE = `WHERE `;
    }
    if(req.query && ('id' in req.query||'city_id' in req.query) && (req.query.region_id != ''||req.query.city_id != '')){
        if(req.query.id){
            WHERE +=`id=${req.query.id}`;
        };
        if(req.query.city_id){
            if(!req.query.id){
                WHERE +=`city_id=${req.query.city_id}`;
            }else{
                WHERE +=` AND city_id=${req.query.city_id}`;
            }
        };
    }
    let sql = `
    SELECT 
      *
  FROM
    uni_metro
    ${WHERE}
  ORDER BY
  id`;
    DB.connection.query(sql,(err, results)=>{
        if(err){
            res.status(404).send(`Не удалось получить данные из базы. ${err} ${sql}`);
        }else{
            res.json(results);
        }
    });
}

exports.support = (req,res)=>{
    res.send("Контактные данные техничесой поддержки");
}
exports.secur = (req,res)=>{
    res.send("Текст политики конфеденциальности");
}
exports.tutor = (req,res)=>{
    res.send("Руководство пользователя");
}
