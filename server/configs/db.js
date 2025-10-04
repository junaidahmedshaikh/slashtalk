const { MongoClient } = require("mongodb");
require("dotenv").config();
let db;
const connectToDB = async () => {
  try {
    const client = new MongoClient(process.env.CONNECTION_STRING);
    await client.connect();
    db = client.db("junaiddb");
    console.log("Connected successfully to server");
  } catch (error) {
    console.log("Error: ", error.message);
  }
};
const getDB = () => db;
module.exports = { connectToDB, getDB };
