const fn = require("./FnController.js");
const DB = require("./DbController.js");
const mysql = require('mysql2/promise');
var moment = require('moment');

class Ads {
    async get(ads_id){
        try{
            const conn = await mysql.createConnection(DB.config);
            let sql = `
            SELECT * FROM uni_ads 
            INNER JOIN uni_city ON uni_city.city_id = uni_ads.ads_city_id
            INNER JOIN uni_region ON uni_region.region_id = uni_ads.ads_region_id
            INNER JOIN uni_country ON uni_country.country_id = uni_ads.ads_country_id
            INNER JOIN uni_category_board ON uni_category_board.category_board_id = uni_ads.ads_id_cat
            INNER JOIN uni_clients ON uni_clients.clients_id = uni_ads.ads_id_user where ads_id=${ads_id}`;
            let [rows,fields]=await conn.execute(sql);
            return rows[0];
        }catch(err){
            console.log(err)
        }
    }
}

module.exports = Ads;