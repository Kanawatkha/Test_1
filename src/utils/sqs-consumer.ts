import {
    SQSClient,
    ReceiveMessageCommand,
    DeleteMessageCommand,
    Message,
} from "@aws-sdk/client-sqs";

import ApplicationConfig from "../configs/application.config";
import Logger from "./logger";

class SqsConsumer {
    // SQS Client
    private static sqsClient = new SQSClient({
        region: ApplicationConfig.aws.awsRegion,
    });

    private static sqsQueueUrl = ApplicationConfig.sqs.sqsQueueUrl || "";

    // ฟังก์ชันลบ message หลังประมวลผลสำเร็จ
    static async deleteMessage(receiptHandle: string, correlationId: string): Promise<void> {
        const command = new DeleteMessageCommand({
            QueueUrl: this.sqsQueueUrl,
            ReceiptHandle: receiptHandle,
        });

        await this.sqsClient.send(command);
        Logger.info("SqsConsumer", "deleteMessage", "Message deleted", correlationId);
    }

    // ฟังก์ชันดึง message
    static async pollMessages(correlationId: string): Promise<Message[]> {
        try {
            const command = new ReceiveMessageCommand({
                QueueUrl: this.sqsQueueUrl,
                MaxNumberOfMessages: 5,   // ดึงสูงสุดครั้งละกี่ message
                WaitTimeSeconds: 20,      // Long polling
                VisibilityTimeout: 30,    // เวลาซ่อน message
            });

            const response = await this.sqsClient.send(command);

            if (!response.Messages || response.Messages.length === 0) {
                // Logger.info("SqsConsumer", "pollMessages", "No messages received", correlationId);
            }
            return response.Messages ?? [];
        }catch (err: any){
            Logger.error("SqsConsumer", "pollMessages", `Error polling messages: ${err}`, correlationId);
            throw err;
        }
    }

}

export default SqsConsumer;