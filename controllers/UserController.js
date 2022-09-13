const DB = require("./DbController.js");
const bcrypt = require("bcrypt");
const crypto = require('crypto');
const moment = require("moment");

exports.reg = (req, res) => {
  let sql = `
    SELECT 
        clients_id AS id,
        clients_email AS email,
        clients_status AS status,
        clients_phone AS phone
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
              console.log('user_hash',user_hash)
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
                user_hash
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
                    clients_id_hash
                )
                VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)
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
                  res.status(400).json(err);
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
            clients_status AS status 
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
                                        city.city_name AS city FROM uni_clients cl,
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
            SQL: sql,
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
