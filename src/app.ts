import Logger from "./utils/logger";
import { version, description } from "../package.json";
import SqsConsumer from "./utils/sqs-consumer";
import { StoreProcessTriggerService } from "./services/store-process-trigger.services";
import { randomUUID } from "crypto";
import ApplicationConfig from "./configs/application.config";

export async function execute() {
    Logger.info(`App`, "execute", `App Start V.${version} description: ${description}`)
    if (ApplicationConfig.sqs.sqsQueueUrl) {
        const className = "app";
        const storeProcessTriggerService = new StoreProcessTriggerService();
        while (true) {
            try {
                const correlationId = randomUUID();
                const messageList = await SqsConsumer.pollMessages(correlationId);
                for (const message of messageList) {
                    try {
                        // await this.processMessage(message);
                        const result = await storeProcessTriggerService.execute(message.Body || "", correlationId);
                        if (result) {
                            if (message.ReceiptHandle) {
                                await SqsConsumer.deleteMessage(message.ReceiptHandle, correlationId);
                            }
                        }
                    } catch (err) {
                        Logger.error(className, "execute", `Error processing message: ${err}`, correlationId);
                    }
                }
            } catch (err) {
                Logger.error(className, "execute", `Polling error: ${err}`);
            }
        }
    }else {
        Logger.error(`App`, "execute", `SQS Queue URL is not configured.`);
        process.exit(1);
    }
}

execute();