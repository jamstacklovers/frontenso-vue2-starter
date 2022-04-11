const execa = require("execa");
const chalk = require("chalk");
const path = require("path");
const glob = require("glob-promise");
const fs = require("fs");
const npm = async (...args) => {
  const result = await execa("npm", args);
  return result.stdout;
};
const LOG_LEVEL_NOTIFY = 2;
const LOG_LEVEL_IMPORTANT = 1;
const LOCK_FILENAME = "package-lock.json";
const CACHE_FILENAME = "package-lock-checker-cash.json";

/**
 * set difference operation - return A - B
 * @param {object} a
 * @param {object} b
 * @returns {object}
 */
const difference = (a, b) => {
  a = Object.keys(a);
  return a
    .filter((x) => !(x in b))
    .reduce((result, i) => {
      result[i] = i;
      return result;
    }, {});
};
/**
 * {react: {version: "1.0.2", ...}, ...} => {"react~~1.0.2": true, ...}
 * @param {object} deps
 * @returns {object}
 */
const simplify_deps = (deps) => {
  return Object.entries(deps).reduce((result, item) => {
    const [key, value] = item;
    const cache_key = `${key}~~${value.version}`;
    result[cache_key] = true;
    return result;
  }, {});
};
/**
 * restore simplified deps
 */
const restore_deps = (simplified_deps, deps) => {
  return Object.keys(simplified_deps).reduce((result, s_key) => {
    const [key] = s_key.split("~~");
    result[key] = deps[key];
    return result;
  }, {});
};

function get_deps_to_check(deps_path, cache_path) {
  if (!fs.existsSync(deps_path)) {
    return null;
  }
  const data = require(deps_path);
  let packages = data.dependencies;
  if (!packages) {
    return null;
  }
  //so, we can use cache
  if (cache_path && fs.existsSync(cache_path)) {
    const cached_data = require(cache_path);
    let cashed_packages = cached_data.dependencies;
    const diff = difference(
      simplify_deps(packages),
      simplify_deps(cashed_packages)
    );
    packages = restore_deps(diff, packages);
  }
  return packages;
}
/**
 *
 * @param {string} deps_path path to package-lock.json
 * @param {string|null} cache_path path to package-lock-checker-cash.json
 * @param {number} date  ms timestamp
 * @param {[string]} ignore_scopes package prefix list to ignore, like @chronos
 * @param {number} log_level
 * @returns {Promise<{released_after_date: *[], with_error: *[]}>}
 */
async function check_packages(
  deps_path,
  cache_path,
  date,
  ignore_scopes,
  log_level
) {
  const released_after_date = [];
  const with_error = [];
  let packages = get_deps_to_check(deps_path, cache_path);
  if (packages === null) {
    console.error(
      chalk.red(`SKIP ${deps_path}, cant find ${LOCK_FILENAME} file here`)
    );
    return { with_error, released_after_date };
  }
  const queue_module = await import("p-queue");
  const PQueue = queue_module.default;
  const queue = new PQueue({ concurrency: 8 });
  for (let name in packages) {
    if (name === "npm_version_checker") {
      continue;
    }
    if (name.startsWith("@")) {
      const [scope] = name.split("/");
      if (ignore_scopes.includes(scope)) {
        continue;
      }
    }
    let version = packages[name].version;
    //edge case with vue-loader
    if (version.startsWith("npm:")) {
      [name, version] = version.split(":")[1].split("@");
    }
    queue.add(async () => {
      const timesJSON = await npm("view", name, "time", "--json");
      try {
        const times = JSON.parse(timesJSON);

        let log_date = times[version];
        const release_date = Date.parse(log_date);
        // potentially "bad" package
        if (release_date > date) {
          log_date = chalk.red(log_date);
          released_after_date.push(`${name}@${version}`);
          if (log_level >= LOG_LEVEL_IMPORTANT) {
            console.log(`${name}@${version}: ${log_date}`);
          }
          // potentially "good" package
        } else {
          log_date = chalk.green(log_date);
          if (log_level >= LOG_LEVEL_NOTIFY) {
            console.log(`${name}@${version}: ${log_date}`);
          }
        }
      } catch (error) {
        with_error.push(name);
        if (log_level >= LOG_LEVEL_IMPORTANT) {
          console.log(`${name}: ${chalk.red("error")}`);
        }
      }
    });
  }
  await queue.onIdle();
  //save cache file;
  if (
    cache_path &&
    with_error.length === 0 &&
    released_after_date.length === 0
  ) {
    fs.copyFileSync(deps_path, cache_path);
  }
  return { with_error, released_after_date };
}

/**
 *
 * @param {[string]} pattern glob patterns
 * @param {[string]} ignore_scopes package prefix list to ignore, like @chronos
 * @param {string} date
 * @param {boolean} using_cache
 * @param {number} log_level
 * @returns {Promise<object>}
 */
async function main(
  pattern = ["./"],
  date = "2022-02-23",
  ignore_scopes = ["@chronos", "@common"],
  using_cache = true,
  log_level = LOG_LEVEL_NOTIFY
) {
  const global_result = { is_error: false, packages: {} };
  const date_ts = Date.parse(date);
  for (let i = 0, count = pattern.length; i < count; i++) {
    const dir_pattern = path.join(process.cwd(), pattern[i]);
    const files = await glob(dir_pattern);
    for (let j = 0, files_count = files.length; j < files_count; j++) {
      const dir_path = files[j];
      const lock_path = path.join(dir_path, LOCK_FILENAME);
      const cache_lock_path = using_cache
        ? path.join(dir_path, CACHE_FILENAME)
        : null;
      global_result.packages[dir_path] = {
        with_error: [],
        released_after_date: [],
      };
      console.log("----------------------");
      console.log(`CHECK DIR STARTED: ${dir_path} `);
      console.log(lock_path);
      console.log("----------------------");
      const { with_error, released_after_date } = await check_packages(
        lock_path,
        cache_lock_path,
        date_ts,
        ignore_scopes,
        log_level
      );
      console.log("----------------------");
      console.log(`CHECK DIR ENDED: ${dir_path} `);
      console.log("----------------------");
      if (with_error.length) {
        console.error(
          chalk.red(
            `Error receiving information about following packages: ${with_error.join(
              ", "
            )}`
          )
        );
        global_result.packages[dir_path].with_error = with_error;
      }
      if (released_after_date.length) {
        console.error(
          chalk.red(
            `Following packages must be downgraded: ${released_after_date.join(
              ", "
            )}`
          )
        );
        global_result.packages[dir_path].released_after_date =
          released_after_date;
      }
      if (with_error.length || released_after_date.length) {
        global_result.is_error = true;
      } else {
        console.log(chalk.green(`${dir_path} is OK!`));
      }
    }
  }
  if (global_result.is_error) {
    console.error(
      chalk.red(
        "We found some potentially bad packages. Check result object or log to see details"
      )
    );
  } else {
    console.log(chalk.green("All of your packages is OK!"));
  }
  return global_result;
}
module.exports = main;
