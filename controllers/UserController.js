const DB = require("./DbController.js");
const mysql = require('mysql2/promise');
const bcrypt = require("bcrypt");
const crypto = require('crypto');
const moment = require("moment");
const User = require("./User");
const { fn } = require("moment");

exports.reg = (req, res) => {
  let sql = `
    SELECT 
        clients_id AS id,
        clients_email AS email,
        clients_status AS status,
        clients_phone AS phone,
        clients_lang AS lang
    FROM
        uni_clients
    WHERE clients_email = "${req.body.email}"`;
  DB.connection.query(sql, (err, results) => {
    if (err) {
      res.status(404).send(`Не удалось получить данные из базы. ${err} ${sql}`);
    } else {
      if (results < 1) {
        bcrypt.genSalt(10, function (err, salt) {
          bcrypt.hash(
            req.body.pass + "2b041ac127efd8862025e026176713d3",
            salt,
            function (err, pass_hash) {
              pass_hash = pass_hash.replace(/^\$2b(.+)$/i, "$2y$1");
              user_hash = crypto.createHash('md5').update(req.body.email).digest("hex");
              let val = [
                pass_hash,
                req.body.email,
                moment().format("YYYY-MM-DD HH:mm:ss"),
                1,
                req.body.phone,
                req.body.name,
                req.body.surname,
                "user",
                376,
                1,
                1,
                0,
                user_hash,
                req.body.leng,
              ];
              sql = `
                INSERT INTO uni_clients(
                    clients_pass,
                    clients_email,
                    clients_datetime_add,
                    clients_status,
                    clients_phone,
                    clients_name,
                    clients_surname,
                    clients_type_person,
                    clients_city_id,
                    clients_secure,
                    clients_view_phone,
                    clients_tariff_id,
                    clients_id_hash,
                    clients_lang
                )
                VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                `;

              DB.connection.query(sql, val, (err, results) => {
                if (results) {
                  let data = JSON.stringify({
                    email: req.body.email,
                    tel: req.body.phone,
                  });
                  let token = Buffer.from(data).toString("base64");
                  results.token = token.slice(1) + token[0];
                  res.json({ results });
                } else {
                  res.status(500).json(err);
                  console.log("ERROR", err);
                }
              });
            }
          );
        });
      } else {
        res.status(400).send(`Пользователь уже зарегистрировн!`);
      }
    }
  });
};
exports.isMagazin = (user_id) => {
  sql = `
    SELECT 
        clients_shops_title AS shop
    FROM 
        uni_clients_shops
    WHERE 
        clients_shops_id_user = "${user_id}"`;
  DB.connection.query(sql, (err, results) => {
    if (err) {
      return false;
    } else {
      if (results.langth > 0) {
        return true;
      } else {
        return false;
      }
    }
  });
};
exports.getMagazin = (req, res) => {
  sql = `
        SELECT 
            clients_shops_id as id,
            clients_shops_id_user as id_user,
            clients_shops_title as title,
            clients_shops_desc as 'desc',
            clients_shops_logo as logo,
            clients_shops_count_view as view,
            clients_shops_status as status
        FROM 
            uni_clients_shops
        WHERE 
            clients_shops_id_user = "${req.body.id}"`;
  DB.connection.query(sql, (err, results) => {
    if (err) {
      console.log(err);
      res.status(404).send(`Не удалось получить данные из базы.`);
    } else {
      if (results.length > 0) {
        res.json(results);
      } else {
        res.status(404).send(`Magazin not found from dataBase`);
      }
    }
  });
};
exports.isAdmin = (user_id) => {
  return "OK " + user_id;
};
exports.user_balance = async (req, res) => {
  let sql = `
        SELECT 
        clients_id AS id,
        clients_balance AS balance
        FROM 
        uni_clients 
        WHERE clients_id = "${req.body.user_id}"`;
  DB.connection.query(sql, (err, result) => {
    if (err) {
      res.status(404).send(`Не удалось получить данные из базы. ` + err);
    } else {
      res.json(result);
    }
  });
};

exports.user_get = (req, res) => {
  if ((req.body.phone || req.body.email) && req.body.pass) {
    let sql1 = `
            SELECT 
            clients_id AS id,
            clients_pass AS pass,
            clients_email AS email,
            clients_tariff_id AS tarif,
            clients_status AS status,
            clients_lang AS lang 
            FROM 
            uni_clients 
            WHERE `;
    if (req.body.phone) {
      sql1 += `clients_phone = "${req.body.phone}"`;
    } else {
      sql1 += `clients_email = "${req.body.email}"`;
    }
    DB.connection.query(sql1, (err, results) => {
      if (results) {
        user_id = results[0].id;
        let hash = results[0].pass;
        hash = hash.replace(/^\$2y(.+)$/i, "$2a$1");
        bcrypt.compare(
          req.body.pass + "2b041ac127efd8862025e026176713d3",
          hash,
          (err_hash, res_hash) => {
            if (res_hash) {
              if (results[0].status > 0) {
                let sql = `
                    SELECT 
                    clients_id AS id,
                    cl.clients_datetime_add AS datetime_add,
                    cl.clients_social_identity AS social_identity,
                    cl.clients_status AS status,
                    clients_avatar AS avatar,
                    cl.clients_datetime_view AS datetime_view,
                    cl.clients_name AS name,
                    cl.clients_surname AS surname,
                    cl.clients_balance AS balans,
                    cl.clients_tariff_id AS tariff,
                    cl.clients_tariff_autorenewal AS tariff_autorenewal,
                    cl.clients_lang AS lang,
                    city.city_name AS city 
                    FROM 
                    uni_clients cl,
                    uni_city city 
                    WHERE `;
                if (req.body.phone) {
                  sql += `clients_phone = "${req.body.phone}"`;
                } else {
                  sql += `clients_email = "${req.body.email}"`;
                }
                sql += ` AND cl.clients_city_id = city.city_id`;
                DB.connection.query(sql, (err, results) => {
                  if (err) {
                    res
                      .status(404)
                      .send(
                        `Не удалось получить данные из базы. ${err} ${sql}`
                      );
                  } else {
                    if (results.length > 0) {
                      let str = {};
                      if (req.body.email) {
                        str.email = req.body.email;
                      }
                      if (req.body.phone) {
                        str.tel = req.body.phone;
                      }
                      let data = JSON.stringify(str);
                      let token = Buffer.from(data).toString("base64");
                      results[0].token = token.slice(1) + token[0];
                      res.json(results);
                    } else {
                      let resBody = {
                        status: "error",
                        id: -16,
                        massage: "User not found",
                        debug: {},
                      };
                      res.status(401).json(resBody);
                    }
                  }
                });
              } else {
                let resBody = {
                  status: "error",
                  id: -7,
                  massage: "Error user status.",
                  debug: {
                    status: results[0].status,
                  },
                };
                res.status(400).json(resBody);
              }
            } else {
              let resBody = {
                status: "error",
                id: -6,
                massage: "Login or password is not correct.",
                debug: {},
              };
              res.status(401).json(resBody);
            }
          }
        );
      } else {
        let resBody = {
          status: "error",
          id: -5,
          massage: "Failed to retrieve user data from database.",
          debug: {
            DB_err: err,
            SQL: 'sql',
          },
        };
        res.status(400).json(resBody);
      }
    });
  } else {
    let resBody = {
      status: "error",
      id: -15,
      massage: "Unauthorized.Error data for login",
      debug: {
        phone: typeof req.body.phone,
        email: typeof req.body.email,
        pass: typeof req.body.pass,
      },
    };
    res.status(401).json(resBody);
  }
};
exports.user_edit = (req, res) => {
  let data = req.body.data;
  if (Object.keys(data).length > 0) {
  } else {
    console.log("пуст");
  }
  let keys = [];
  let values = [];
  let val = new Map(Object.entries(data));
  for (let key of val.keys()) {
    keys.push("clients_" + key + "=?");
  }
  for (let value of val.values()) {
    values.push(value);
  }
  let sql = `UPDATE uni_clients
        SET 
        ${keys.join(", ")}
        WHERE `;
  if (req.body.email) {
    sql += `clients_email = "${req.body.email}"`;
  } else {
    sql += `clients_phone = "${req.body.phone}"`;
  }

  DB.connection.query(sql, values, (err, results) => {
    if (results) {
      res.send("Updated");
    } else {
      res.json({ err });
    }
  });
};
exports.order = (req, res) => {
  let sql = `
        SELECT 
        orders_id,
        orders_uid,
        orders_price,
        orders_date,
        orders_status,
        orders_title,
        orders_id_ad,
        orders_action_name 
        FROM 
        uni_orders 
        WHERE 
        orders_id_user= '${req.body.user_id}'`;
  if (req.query && "id" in req.query && req.query.id != "") {
    sql += `
                AND orders_id ='${req.query.id}'
            `;
  }
  DB.connection.query(sql, (err, results) => {
    if (err) {
      res.status(404).send(`Не удалось получить данные из базы. ${err} ${sql}`);
    } else {
      res.json(results);
    }
  });
};
exports.sale = (req, res) => {
  let id_sale = "";
  if (req.query && "id" in req.query && req.query.id != "") {
    id_sale = `AND a.ads_id =${req.query.id}`;
  }
  let sql = `
    SELECT 
      a.*
  FROM
    uni_ads a
  WHERE
      a.ads_id_user= '${req.body.user_id}'
      AND
      a.ads_status = 5
      ${id_sale}
  ORDER BY
      a.ads_id`;

  DB.connection.query(sql, (err, results) => {
    if (err) {
      res.status(404).send(`Не удалось получить данные из базы. ${err} ${sql}`);
    } else {
      res.json(results);
    }
  });
};
exports.favorite = async (req, res) => {
  try{
    const conn = await mysql.createConnection(DB.config);
    const user_id = req.body.user_id
    if('id_ad' in req.body && req.body.id_ad){
      let id_ad = req.body.id_ad;
      let sql = `select * from uni_ads where ads_id =${id_ad}`;
      let [rows,fields]= await conn.execute(sql);
      let findAd = rows[0];

      if(findAd){
        let sql = `select * from uni_favorites where favorites_id_ad=${id_ad} and favorites_from_id_user=${user_id}`;
        let [rows,fields]= await conn.execute(sql);
        let find = rows[0];
        if(find){
          let sql = `DELETE FROM uni_favorites WHERE favorites_id=${find.favorites_id}`;
          let [rows,fields]= await conn.execute(sql);
          await stat(id_ad,user_id,findAd.ads_id_user, "favorite");
          res.send('Delete from favorite');
        }else{
          let sql = `INSERT INTO uni_favorites(
          favorites_id_ad,
          favorites_from_id_user,
          favorites_to_id_user,
          favorites_date)
          VALUES(${id_ad},${user_id},${findAd.ads_id_user},"${moment().format("YYYY-MM-DD HH:mm:ss")}")`;
          let [rows,fields]= await conn.execute(sql);
          conn.end();
          res.send('Added from favorite');
        }
      }
    }else{
      let resBody = {
        status: "error",
        id: -17,
        massage: "Empty id_ad in body request.",
        debug: {
          id_ad: req.body.id_ad,
          "type": typeof req.body.id_ad
        },
      };
      conn.end();
      res.status(400).json(resBody);
    }
  }catch(err){
    console.log(err);
    let resBody = {
      status: "error",
      id: -17,
      massage: err,
      debug: {
      },
    };
    res.status(500).json(resBody);
  }
}
exports.add_review = async (req, res) =>{
  if('stars' in req.body && req.body.stars &&'text' in req.body && req.body.text &&'id_ad' in req.body && req.body.id_ad && 'id_user' in req.body && req.body.id_user){
    try{
      let user = new User();
      const conn = await mysql.createConnection(DB.config);
      let text = req.body.text;
      let stars = req.body.stars;
      let id_ad = req.body.id_ad;
      const user_id = req.body.user_id;
      const id_user = req.body.id_user;
      let status_result = 1; //TODO непонятно что за статус. profile php 776стр.
      let sql = `select * from uni_ads where ads_id =${id_ad}`;
      let [rows,fields]= await conn.execute(sql);
      let getAd = rows[0];
      if(getAd){
        let sql = `select * from uni_clients_reviews where clients_reviews_from_id_user=${user_id} and clients_reviews_id_user=${id_user}`;
        let [rows,fields]= await conn.execute(sql);
        let status_publication_review = rows[0];
        if(!status_publication_review){
          let sql = `INSERT INTO uni_clients_reviews(
            clients_reviews_id_user,
            clients_reviews_text,
            clients_reviews_from_id_user,
            clients_reviews_rating,
            clients_reviews_id_ad,
            clients_reviews_status_result,
            clients_reviews_date)
            VALUES(${id_user},"${text}",${user_id},${stars},${id_ad},${status_result},"${moment().format("YYYY-MM-DD HH:mm:ss")}")`;
          let [rows,fields]= await conn.execute(sql);
          await user.sendChatAction(id_ad, 4, user_id, id_user);
          conn.end();
          res.send("Отзыв добавлен.");
        }else{
          conn.end();
          res.send("Вы уже оставляли отзыв для данного товара!");
        }
      }else{
        conn.end();
        res.send("товар не найден");
      }
      
    }catch(err){
      console.log(err);
      let resBody = {
        status: "error",
        id: -17,
        massage: err,
        debug: {
        },
      };
      res.status(500).json(resBody);
    }
  }else{
    let resBody = {
      status: "error",
      id: -17,
      massage: "Empty id_ad,id_user,stars, or text in body request.",
      debug: {
        "id_ad": req.body.id_ad,
        "type id_ad": typeof req.body.id_ad,
        "id_user": req.body.id_user,
        "type id_user": typeof req.body.id_user,
        "stars": req.body.stars,
        "type stars": typeof req.body.stars,
        "text": req.body.text,
        "type text": typeof req.body.text
      },
    };
    res.status(400).json(resBody);
  }
}

exports.del = async (req, res) =>{
  try {
    let user_id = req.body.user_id;
    user_id = 9;
    const conn = await mysql.createConnection(DB.config);
    let sql = `DELETE FROM uni_clients WHERE clients_id = ${user_id}`;
    let [rows,fields]= await conn.execute(sql);
    res.send("User deleted")
  } catch (error) {
    console.log(error)
    res.status(500).join(error)
  }
}


async function stat(id_ad,from_user_id,to_user_id, action){
  const conn = await mysql.createConnection(DB.config);
  let sql = `select * from uni_action_statistics where date(action_statistics_date)="${moment().format("YYYY-MM-DD HH:mm:ss")}" and action_statistics_from_user_id=${from_user_id} and action_statistics_ad_id=${to_user_id} and action_statistics_action="${action}"`;
  let [rows,fields]= await conn.execute(sql);
  let find = rows[0];
  if(find){
    let sql = `INSERT INTO uni_action_statistics(action_statistics_date,action_statistics_ad_id,action_statistics_from_user_id,action_statistics_to_user_id,action_statistics_action)VALUES("${moment().format("YYYY-MM-DD HH:mm:ss")}",${id_ad},${from_user_id},${to_user_id},"${action}")`;
    let [rows,fields]= await conn.execute(sql);
  }
  conn.end();
}