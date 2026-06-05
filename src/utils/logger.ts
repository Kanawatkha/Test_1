import winston from "winston";
import applicationConfig from "../configs/application.config";
import WinstonCloudWatch from 'winston-cloudwatch';
import util from "./util";
const { combine, timestamp } = winston.format;

class Logger {
    private static _winstonLogger = winston.createLogger({
        level: 'info',
        defaultMeta: {
            appName: applicationConfig.app.appName,
            nodeEnv: applicationConfig.app.nodeEnv
        },
        format: combine(
            timestamp(),
            winston.format.json()
        ),
        transports: new winston.transports.Console(),
    });

    static info(className: string, funtionName: string, message: string, correlationId: string = "-", storeId: string = "-") {
        this._winstonLogger.info({
            className: className,
            functionName: funtionName,
            correlationId: correlationId,
            storeId: storeId,
            message: message
        });
    }

    static error(className: string, funtionName: string, error: any, correlationId: string = "-", storeId: string = "-") {
        this._winstonLogger.error({
            className: className,
            functionName: funtionName,
            correlationId: correlationId,
            storeId: storeId,
            message: error
        });
    }
}

export default Logger;
