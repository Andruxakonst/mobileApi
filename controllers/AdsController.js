const DB = require("./DbController.js");
const User = require("./UserController");
const Sys = require("./SystemController");
var moment = require('moment');

exports.addAds = (req,res)=>{
    let sql='';
    if('ads_data' in req.body && Array.isArray(req.body.ads_data)&& req.body.ads_data.length>0){
      let results = req.body.results;
      let user_id = results.id;
      let arr_res = [];
      console.log(results);
        if(results.tarif >=3 && results.status !=0){
    
          sql = `
            SELECT 
              clients_shops_title AS shop
            FROM 
              uni_clients_shops
            WHERE 
              clients_shops_id_user = "${user_id}"`;

            DB.connection.query(sql,
              (err, results)=>{
                if(results){
                  let data_arr = req.body.ads_data;
                  let ad;
                  for(ad = 0; ad<data_arr.length; ad++){
                        if(!data_arr[ad].images.length >1){data_arr[ad].images=''}
                        let val =[
                          data_arr[ad].title,
                          data_arr[ad].alias,
                          data_arr[ad].text,
                          data_arr[ad].id_cat,
                          user_id,
                          data_arr[ad].images,
                          data_arr[ad].price,
                          data_arr[ad].address,
                          data_arr[ad].period_publication,
                          data_arr[ad].city_id,
                          data_arr[ad].status,
                          data_arr[ad].region_id,
                          data_arr[ad].country_id,
                          data_arr[ad].currency,
                          data_arr[ad].period_day,
                          data_arr[ad].filter_tags,
                          data_arr[ad].available_unlimitedly,
                        ];
                        sql = `
                          INSERT INTO uni_ads(
                            ads_title,
                            ads_alias,
                            ads_text,
                            ads_id_cat,
                            ads_id_user,
                            ads_images,
                            ads_price,
                            ads_address,
                            ads_period_publication,
                            ads_city_id,
                            ads_status,
                            ads_region_id,
                            ads_country_id,
                            ads_currency,
                            ads_period_day,
                            ads_filter_tags,
                            ads_available_unlimitedly
                          )
                          VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                        `;
                        DB.connection.query(sql, val, (err, results)=>{
                          if(results){
                            arr_res.push({"ad_count":ad, "added":true, "err":null});
                          }else{
                            arr_res.push({"ad_count":ad, "added":false, "err":err});
                            console.log("ERROR",arr_res);
                          }
                        });
                  }
                  res.send(`Addedet ${ad} lines`);
                }else{
                  let resBody = {
                    "status": "error",
                    "id":  -12,
                    "massage":"Error get user shops from database.",
                    "debug":{}
                  }
                  res.status(400).json(resBody);
                }
              });
        }else{
          let resBody = {
            "status": "error",
            "id": -11,
            "massage":"Error user tarif or status.",
            "debug":{
              "tarif":results.tarif,
              "status":results.status,
            }
          }
          res.status(400).json(resBody);
        }
    }else{
      let resBody = {
        "status": "error",
        "id": -9,
        "massage":"ads_data error.",
        "debug":{
          "ads_data":req.body.ads_data,
          "ads_data.length":req.body.ads_data.length,
          "ads_data is array":Array.isArray(req.body.ads_data),
        }
      }
      res.status(400).json(resBody);
    };
};
exports.list = (req,res)=>{
    let id='';
    if(req.body && 'id' in req.body && req.body.id != ''){
        id = `AND ads_id = ${req.body.id}`;
    }
    let sql = `
    SELECT 
      a.*,
      country.country_name,
      reg.region_name,
      city.city_name,
      u.clients_name,
      u.clients_surname,
      c.category_board_name
  FROM uni_ads a,
      uni_country country,
      uni_region reg,
      uni_city city,
      uni_clients u,
      uni_category_board c
  WHERE
      a.ads_id_cat = c.category_board_id
      AND
      a.ads_id_user = u.clients_id
      AND
      a.ads_city_id = city.city_id
      AND
      a.ads_region_id = reg.region_id
      AND
      a.ads_country_id = country.country_id
      ${id}
  ORDER BY
      a.ads_id
  `;
  if(req.body){
    if(typeof req.body.limit != 'undefined'){
      sql += `LIMIT ${req.body.limit}`;
    }else{
      sql += `LIMIT 10000`;
    };
    sql += ` `;
    if(typeof req.body.offset != 'undefined'){
      sql += `OFFSET ${req.body.offset}`;
    }else{
      sql += `OFFSET 0`;
    }
  }
  DB.connection.query(sql,
  (err, results)=>{
    if(err){
      res.status(404).send(`Не удалось получить данные из базы.`);
    }else{
      res.json(results);
    }
  });
};

exports.categorie = (req,res)=>{
  if(req.query && 'id' in req.query && req.query.id != ''){
    let sql = `
      SELECT 
      category_board_id,
      category_board_name,
      category_board_title,
      category_board_text,
      category_board_image,
      category_board_description,
      category_board_alias,
      category_board_h1 
      FROM uni_category_board 
      WHERE
      category_board_visible = 1 AND category_board_id = ${req.query.id};
    `;
    DB.connection.query(sql,
      (err, results)=>{
        if(err){
          res.status(404).send(`Не удалось получить данные из базы.`);
        }else{
          if(results.length > 0){
             res.json(results);
          }else{
            let resBody = {
              "status": "error",
              "id": -14,
              "massage":"Category requested by id not found",
              "debug":{
                  "id":req.query.id,
                }
              }
              res.status(400).json(resBody);
          }
        }
      });
  }else{
    let resBody = {
    "status": "error",
    "id": -14,
    "massage":"Empty data in request",
    "debug":{
        "id":req.query.id,
    }
    }
    res.status(400).json(resBody);
  }
};

exports.categories = (req,res)=>{
  let sql = `
    SELECT 
    category_board_id,
    category_board_name,
    category_board_title,
    category_board_text,
    category_board_image,
    category_board_description,
    category_board_alias,
    category_board_h1 
    FROM uni_category_board 
    WHERE category_board_visible = 1
    ORDER BY category_board_id ASC
  `;
  DB.connection.query(sql,
  (err, results)=>{
    if(err){
      res.status(404).send(`Не удалось получить данные из базы.`);
    }else{
      res.json(results);
    }
  });
};

exports.vip = (req,res)=>{
  let sql = `UPDATE uni_ads
        SET 
          ads_vip = ?
        WHERE 
          ads_id = ${req.body.id}
        `;
      DB.connection.query(sql, [1], (err, results)=>{
        if(results){
            res.send('OK');
        }else{
            res.json({err});
        }
    });
}
exports.up = (req,res)=>{
  let sql = `SELECT ads_id, ads_sorting FROM uni_ads WHERE ads_id = ${req.body.id}`;
  DB.connection.query(sql,
    (err, results)=>{
      if(err){
        res.json(err);
      }else{
        if(results.length > 0){
          let val = results[0].ads_sorting +10;
          sql = `UPDATE uni_ads
          SET 
            ads_sorting = ?
          WHERE 
            ads_id = ${req.body.id}
          `;
          DB.connection.query(sql, [val], (err, results)=>{
            if(results){
                res.send('OK');
            }else{
                res.json({err});
            }
          });
        }else{
          let resBody = {
            "status": "error",
            "id": -12,
            "massage":"Empty data to dataBase for ads_id",
            "debug":{
                "ads_id":req.body.id,
                "results":results,
            }
          }
          res.status(401).json(resBody);
        }
      }
  });
}
exports.turbo = (req,res)=>{
    let val = [
      req.body.id,
      moment().format('YYYY-MM-DD HH:mm:ss'),
      3,
      7,
      moment().format('YYYY-MM-DD HH:mm:ss'),
      1
    ];
    let sql = `INSERT into uni_services_order(
      services_order_id_ads,
      services_order_time_validity,
      services_order_id_service,
      services_order_count_day,
      services_order_time_create,
      services_order_status)
      VALUES(?,?,?,?,?,?)
    `;
    DB.connection.query(sql,val,
        (err, results)=>{
          if(results){
              res.send('OK');
          }else{
              res.json({err});
          }
      });
};
