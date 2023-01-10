"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chokidar = require("chokidar");
const path_1 = require("path");
const fs_1 = require("./fs");
const interfaces_1 = require("./interfaces");
const lib_1 = require("./lib");
const module_1 = require("./module");
function validTasks(logger, obj) {
    const tasks = {};
    Object.keys(obj).forEach((taskName) => {
        const task = obj[taskName];
        if ((0, interfaces_1.isValidTask)(task)) {
            tasks[taskName] = task;
        }
        else {
            logger.warn(`Not a valid task '${taskName}' - expected function, received ${task ? typeof task : String(task)}.`, {
                invalidTask: true,
                task,
                taskName,
            });
        }
    });
    return tasks;
}
async function loadFileIntoTasks(logger, tasks, filename, name = null, watch = false) {
    const replacementModule = watch ? (0, module_1.fauxRequire)(filename) : require(filename);
    if (!replacementModule) {
        throw new Error(`Module '${filename}' doesn't have an export`);
    }
    if (name) {
        const task = replacementModule.default || replacementModule;
        if ((0, interfaces_1.isValidTask)(task)) {
            tasks[name] = task;
        }
        else {
            throw new Error(`Invalid task '${name}' - expected function, received ${task ? typeof task : String(task)}.`);
        }
    }
    else {
        Object.keys(tasks).forEach((taskName) => {
            delete tasks[taskName];
        });
        if (!replacementModule.default ||
            typeof replacementModule.default === "function") {
            Object.assign(tasks, validTasks(logger, replacementModule));
        }
        else {
            Object.assign(tasks, validTasks(logger, replacementModule.default));
        }
    }
}
async function getTasks(options, taskPath, watch = false) {
    const { logger } = (0, lib_1.processSharedOptions)(options);
    const pathStat = await (0, fs_1.tryStat)(taskPath);
    if (!pathStat) {
        throw new Error(`Could not find tasks to execute - '${taskPath}' does not exist`);
    }
    const watchers = [];
    let taskNames = [];
    const tasks = {};
    const debugSupported = (debugLogger = logger) => {
        const oldTaskNames = taskNames;
        taskNames = Object.keys(tasks).sort();
        if (oldTaskNames.join(",") !== taskNames.join(",")) {
            debugLogger.debug(`Supported task names: '${taskNames.join("', '")}'`, {
                taskNames,
            });
        }
    };
    const watchLogger = logger.scope({ label: "watch" });
    if (pathStat.isFile()) {
        if (watch) {
            watchers.push(chokidar.watch(taskPath, { ignoreInitial: true }).on("all", () => {
                loadFileIntoTasks(watchLogger, tasks, taskPath, null, watch)
                    .then(() => debugSupported(watchLogger))
                    .catch((error) => {
                    watchLogger.error(`Error in ${taskPath}: ${error.message}`, {
                        taskPath,
                        error,
                    });
                });
            }));
        }
        // Try and require it
        await loadFileIntoTasks(logger, tasks, taskPath, null, watch);
    }
    else if (pathStat.isDirectory()) {
        if (watch) {
            watchers.push(chokidar
                .watch(`${taskPath}/*.js`, {
                ignoreInitial: true,
            })
                .on("all", (event, eventFilePath) => {
                const taskName = (0, path_1.basename)(eventFilePath, ".js");
                if (event === "unlink") {
                    delete tasks[taskName];
                    debugSupported(watchLogger);
                }
                else {
                    loadFileIntoTasks(watchLogger, tasks, eventFilePath, taskName, watch)
                        .then(() => debugSupported(watchLogger))
                        .catch((error) => {
                        watchLogger.error(`Error in ${eventFilePath}: ${error.message}`, { eventFilePath, error });
                    });
                }
            }));
        }
        // Try and require its contents
        const files = await (0, fs_1.readdir)(taskPath);
        for (const file of files) {
            if (file.endsWith(".js")) {
                const taskName = file.slice(0, -3);
                try {
                    await loadFileIntoTasks(logger, tasks, `${taskPath}/${file}`, taskName, watch);
                }
                catch (error) {
                    const message = `Error processing '${taskPath}/${file}': ${error.message}`;
                    if (watch) {
                        watchLogger.error(message, { error });
                    }
                    else {
                        throw new Error(message);
                    }
                }
            }
        }
    }
    taskNames = Object.keys(tasks).sort();
    let released = false;
    return {
        tasks,
        release: () => {
            if (released) {
                return;
            }
            released = true;
            watchers.forEach((watcher) => watcher.close());
        },
    };
}
exports.default = getTasks;
//# sourceMappingURL=getTasks.js.map