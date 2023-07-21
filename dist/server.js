"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importStar(require("express"));
const cors_1 = __importDefault(require("cors"));
require("dotenv/config");
const ioredis_1 = require("ioredis");
// constants ------------------------------------------------
const PORT = process.env.PORT;
const EXPIRATION_TIME = 20;
// PLANETSCALE connections ----------------------------------
const promise_1 = __importDefault(require("mysql2/promise"));
const pscale_read_url = process.env.PLANETSCALE_READ_DB_URL || "";
const pscale_conn = async () => {
    return await promise_1.default.createConnection(pscale_read_url);
};
const conn = pscale_conn();
// UPSTASH REDIS connections --------------------------------
const redis_url = process.env.UPSTASH_REDIS_URL || "";
const redis_client = new ioredis_1.Redis(redis_url);
// ----------------------------------------------------------
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use((0, express_1.json)());
app.use(express_1.default.urlencoded({ extended: true }));
// ----------------------------------------------------------
app.get('/pscale', async (req, res) => {
    //console.log('hii')
    redis_client.get("firstData", async (err, redis_res) => {
        if (err)
            console.error(err);
        if (redis_res != null) {
            console.log('Cache HIT.');
            return res.json(JSON.parse(redis_res));
        }
        //upload to redis and fetch from api endpoint
        const query = 'select * from RegisteredUsers;';
        const [rows] = await (await conn).query(query);
        res.json(rows);
        redis_client.setex("firstData", EXPIRATION_TIME, JSON.stringify([rows]));
        console.log('Cache MISS.');
    });
    //console.log([rows]);
    //res.json(rows);
});
app.get('/', (req, res) => {
    const obj = {
        status: 200,
        response: {
            "msg": "server responded at 'GET' request!"
        },
        additional: "Data sent successfully"
    };
    res.json(obj);
});
app.listen(PORT, (err) => {
    if (err) {
        throw new Error("500: Internal Server Error");
    }
    console.log(`Local server listening at port ${PORT}`);
});
module.exports = app;
