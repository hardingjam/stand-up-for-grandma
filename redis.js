var redis = require("redis");
var client = redis.createClient({
    host: "localhost",
    port: 6379,
});

client.on("error", function (err) {
    console.log(err);
});

client.setex("city", 60, "berlin", function (err, data) {
    if (err) {
        return console.log(err);
    }
    console.log('the "city" key was successfully set');

    client.get("city", function (err, data) {
        if (err) {
            return console.log(err);
        }
        console.log('The value of the "city" key is ' + data);
    });
});
