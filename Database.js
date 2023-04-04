const redis = require("redis");
const { commandOptions } = require("redis");
const client = redis.createClient({});

(async () => {
  await client.connect();
})();

client.on("error", (err) => {
  console.log("Error " + err);
});

client.on("ready", () => {
  console.log("Connected to redis");
});


exports.client = client;