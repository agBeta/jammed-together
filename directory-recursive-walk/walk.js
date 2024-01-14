import { readdirSync, lstatSync } from "node:fs";
import { sep } from "node:path";
/**
 * @version sync
 * recursively walks a directory and returns the list of all folders and files
 * inside of it.
 * @param {*} pathToDir 
 */
export function walk(pathToDir) {
    const result = [];
    const allDirectFilesAndFolders = readdirSync(pathToDir);

    allDirectFilesAndFolders.forEach(fileName => {
        try {
            const path = `${pathToDir}${sep}${fileName}`;
            if (!lstatSync(path).isDirectory()) {
                result.push(path);
            } else {
                result.push(...walk(path), /*also the directory*/ path)
            }
        } 
        catch (err) {}
    });
    return result;
}


