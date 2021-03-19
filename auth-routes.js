// make sure you export and require accordingly.

// requiring this file in server.js will allow us to use its "side effects"

const { app } = require("./server");
const { requireLoggedInUser } = require("./middleware");
