import Express, { json } from "express";
import axios from "axios";
import cors from "cors";
import "dotenv/config";
import { Redis } from "ioredis";

// constants ------------------------------------------------
const PORT = process.env.PORT;
const EXPIRATION_TIME = 20;

// PLANETSCALE connections ----------------------------------
import mysql from "mysql2/promise";
const pscale_read_url = process.env.PLANETSCALE_READ_DB_URL || "";
const pscale_conn = async () => {
    return await mysql.createConnection(pscale_read_url);
};
const conn = pscale_conn();

// UPSTASH REDIS connections --------------------------------
const redis_url = process.env.UPSTASH_REDIS_URL || "";
const redis_client = new Redis(redis_url);

// ----------------------------------------------------------
const app = Express();
app.use(cors());
app.use(json());
app.use(Express.urlencoded({ extended:true }));


interface resObj {
    status: number,
    response: object,
    additional?: string
}

// ----------------------------------------------------------



app.get('/pscale', async (req, res) => {
    //console.log('hii')
    redis_client.get("firstData", async (err,redis_res) => {
        if(err)
            console.error(err);
        
        if(redis_res!=null){
            console.log('Cache HIT.');
            return res.json(JSON.parse(redis_res));
        }

        //upload to redis and fetch from api endpoint
        const query = 'select * from RegisteredUsers;';
        const [rows] = await (await conn).query(query);

        res.json(rows);

        redis_client.setex("firstData",EXPIRATION_TIME,JSON.stringify([rows]));
        console.log('Cache MISS.');
    })
    
    //console.log([rows]);
    //res.json(rows);
})


app.get('/', (req,res) => {
    const obj: resObj = {
        status: 200,
        response: {
            "msg": "server responded at 'GET' request!" 
        },
        additional: "Data sent successfully"
    };

    res.json(obj);
})


app.listen(PORT, (err: any) => {
    if(err){
        throw new Error("500: Internal Server Error");
    }
    console.log(`Local server listening at port ${PORT}`);
});

module.exports = app;
