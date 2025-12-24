const path = require("path");

// require.main	            Refers to the entry point file — the file that started your app (usually app.js or server.js).
// require.main.filename	Returns the full absolute path of that entry file. Example: /Users/me/myproject/app.js
module.exports = path.dirname(require.main.filename);
