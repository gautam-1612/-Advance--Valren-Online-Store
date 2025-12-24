const Mongodb = require("mongodb");
const mongoClient = Mongodb.MongoClient;

let _db;

function mongoConnect(callback) {
  mongoClient
    .connect("url")
    .then((client) => {
      console.log("connected !!!!!!!!!!");
      _db = client.db();
      callback(client);
    })
    .catch((err) => {
      console.log(err);
      throw err;
    });
}

const getDb = () => {
  if (_db) return _db;
  else throw new Error("No Database Found.");
};

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;
