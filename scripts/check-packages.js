const checker = require("./npm_version_checker");
const patterns = ["./"];
checker(patterns, "2022-02-24", ["@chronos", "@common"], false, 1);
