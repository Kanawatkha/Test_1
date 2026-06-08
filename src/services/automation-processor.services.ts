import ApplicationConfig from "../configs/application.config";
import Logger from "../utils/logger";
import MysqlDb from "../utils/mysql-db.util";
import Util from "../utils/util";
import { BatchClient, SubmitJobCommand } from "@aws-sdk/client-batch";
import { MongoClient } from "../utils/mongodb.client";

export class AutomationProcessorService {
    private mysqlDb = new MysqlDb();
    private className: string = "AutomationProcessorService";
    private mongoClient = new MongoClient();
    private batchClient = new BatchClient({ region: ApplicationConfig.aws.awsRegion });

    public async processAutomation(targetFlowName: string, expectedShiftNo: number, correlationId: string): Promise<boolean> {
        const functionName = "processAutomation";
        try {
            const storeResult = await this.mysqlDb.query("read", "SELECT DISTINCT STORE_ID FROM STORE_ACTIVE", []);
            const stores = storeResult.map((row: any) => row.STORE_ID);

            const flowConfig = await this.mongoClient.getFlowConfig(targetFlowName, correlationId, "-");
            if (!flowConfig) {
                Logger.error(this.className, functionName, `Flow configuration not found for target: ${targetFlowName}`, correlationId, "-");
                return false;
            }

            const promises = stores.map(async (storeId: string) => {
                try {
                    const sanitizedTimestamp = Util.getDateNowByFormat("YYYYMMDDHHmmss");
                    const calculatedJobName = `${targetFlowName}-${storeId}-${sanitizedTimestamp}`;
                    const batchParams = {
                        jobName: calculatedJobName,
                        jobQueue: flowConfig.jobQueue,
                        jobDefinition: flowConfig.jobDefinition,
                        containerOverrides: {
                            environment: [
                                { name: "STORE_ID", value: storeId },
                                { name: "FLOW_NAME", value: targetFlowName }
                            ]
                        }
                    };
                    await this.batchClient.send(new SubmitJobCommand(batchParams));
                } catch (err: any) {
                    Logger.error(this.className, functionName, `Batch submission failed for store: ${storeId} | Error: ${err.message}`, correlationId, storeId);
                }
            });

            await Promise.all(promises);
            return true;
        } catch (error: any) {
            Logger.error(this.className, functionName, `Automation Fatal Interruption: ${error.message}`, correlationId, "-");
            throw error;
        }
    }
}