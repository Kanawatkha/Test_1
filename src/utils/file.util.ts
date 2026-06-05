import { promises as fsPromises } from 'fs';
import { join } from 'path';
import Logger from "./logger";
class FileUtil {

    public async readFile(path: string): Promise<string> {
        try {
            const result = await fsPromises.readFile(
                join(__dirname, path),
                'utf-8',
            );

            Logger.info("FileUtil", "readFile", result)

            return result;
        } catch (err) {
            Logger.error("FileUtil", "readFile", err)
            throw err;
        }
    }
}

export default FileUtil;
