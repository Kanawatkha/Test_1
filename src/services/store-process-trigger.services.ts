import ApplicationConfig from "../configs/application.config";
import Logger from "../utils/logger";
import MysqlDb from "../utils/mysql-db.util";
import Util from "../utils/util";
import { XMLParser } from "fast-xml-parser";
import { BatchClient, SubmitJobCommand } from "@aws-sdk/client-batch";
import { MongoClient } from "../utils/mongodb.client";
import { KinesisCdcPayload, DecodedStoreStateData } from "../models/store-data.message";

export class StoreProcessTriggerService {
    private mysqlDb = new MysqlDb();
    private className: string = "StoreProcessTriggerService";
    private mongoClient = new MongoClient();
    private batchClient = new BatchClient({ region: ApplicationConfig.aws.awsRegion });
    private parser = new XMLParser({
        ignoreAttributes: false,
        parseTagValue: false,       
        parseAttributeValue: false, 
    });

    public async execute(message: string, correlationId: string): Promise<boolean> {
        const functionName = "execute";
        let currentStoreId = "-";

        try {
            Logger.info(this.className, functionName, `Log 1/9 - Raw SQS Message Body Received: ${message}`, correlationId, currentStoreId);

            if (!message || message.trim() === "") {
                throw new Error("Received an empty or invalid SQS message string");
            }

            const outerPayload = JSON.parse(message) as KinesisCdcPayload;
            Logger.info(this.className, functionName, `Log 2/9 - Outer JSON parsed successfully. Event Source: ${outerPayload.eventSource}, Partition Key: ${outerPayload.partitionKey}`, correlationId, currentStoreId);

            Logger.info(this.className, functionName, `Log 3/9 - Initiating Base64 decoding on raw data attribute: ${outerPayload.data.substring(0, 30)}...`, correlationId, currentStoreId);
            const decodedDataString = Buffer.from(outerPayload.data, 'base64').toString('utf-8');

            const innerPayload = JSON.parse(decodedDataString) as DecodedStoreStateData;
            currentStoreId = innerPayload.data.STORE_ID;

            const tableName = innerPayload.metadata ? innerPayload.metadata["table-name"] : "";
            let targetBusinessDate = "";
            let lookupShift: number | null = null;

            if (tableName === "T_SYS_STATE") {
                targetBusinessDate = innerPayload.data.CUR_BSNS_DT || "";
                lookupShift = null;
            } else if (tableName === "T_SHIFT_SUMMARY_MAST") {
                targetBusinessDate = innerPayload.data.BSNS_DT || "";
                const shiftNo = innerPayload.data.SHIFT_NO;

                if (shiftNo === 1) {
                    const queryStr = "SELECT MAX(SHIFT_NO) as maxShift FROM T_SHIFT_MAST WHERE STORE_ID = ? AND DESELECT_IND = 'N'";
                    const mysqlResult = await this.mysqlDb.query("read", queryStr, [currentStoreId]);
                    let maxShift = 3;
                    if (mysqlResult && mysqlResult.length > 0 && mysqlResult[0].maxShift !== null && mysqlResult[0].maxShift !== undefined) {
                        maxShift = Number(mysqlResult[0].maxShift);
                    }
                    lookupShift = maxShift;
                } else if (shiftNo && shiftNo > 1) {
                    lookupShift = shiftNo - 1;
                } else {
                    lookupShift = 3;
                }
            } else {
                throw new Error(`Unsupported schema table name received: ${tableName}`);
            }

            Logger.info(this.className, functionName, `Log 4/9 - Inner JSON parsed. Store ID Extracted: ${currentStoreId} | Business Date: ${targetBusinessDate} | Lookup Shift: ${lookupShift}`, correlationId, currentStoreId);

            Logger.info(this.className, functionName, `Log 5/9 - Routing event payload to lookup router mapping for table: ${tableName}`, correlationId, currentStoreId);
            const routerMapping = await this.mongoClient.getRouterMapping(tableName, lookupShift, correlationId, currentStoreId);

            if (!routerMapping) {
                throw new Error(`Router mapping configuration metadata document not found in MongoDB for table: ${tableName} with shift: ${lookupShift}`);
            }

            const targetFlowName = routerMapping.targetFlowName;
            const flowConfig = await this.mongoClient.getFlowConfig(targetFlowName, correlationId, currentStoreId);

            if (!flowConfig) {
                throw new Error(`Routing configuration metadata document not found in MongoDB for target name: ${targetFlowName}`);
            }

            Logger.info(this.className, functionName, `Log 6/9 - Target configurations verified. JobQueue: ${flowConfig.jobQueue} | JobDefinition: ${flowConfig.jobDefinition}`, correlationId, currentStoreId);

            const sanitizedTimestamp = Util.getDateNowByFormat("YYYYMMDDHHmmss");
            const calculatedJobName = `${targetFlowName}-${currentStoreId}-${sanitizedTimestamp}`;

            const batchParams = {
                jobName: calculatedJobName,
                jobQueue: flowConfig.jobQueue,
                jobDefinition: flowConfig.jobDefinition,
                containerOverrides: {
                    environment: [
                        { name: "STORE_ID", value: currentStoreId },
                        { name: "BUSINESS_DATE", value: targetBusinessDate },
                        { name: "FLOW_NAME", value: targetFlowName }
                    ]
                }
            };

            Logger.info(this.className, functionName, `Log 7/9 - Constructing AWS Batch payload. Dispatching Job Name: ${batchParams.jobName}`, correlationId, currentStoreId);

            const batchResponse = await this.batchClient.send(new SubmitJobCommand(batchParams));

            Logger.info(this.className, functionName, `Log 8/9 - AWS Batch response received. Remote Job ID Allocated: ${batchResponse.jobId}`, correlationId, currentStoreId);

            Logger.info(this.className, functionName, `Log 9/9 - Pipeline execution completed cleanly. Returning acknowledgement signature flag.`, correlationId, currentStoreId);

            return true;
        } catch (error: any) {
            Logger.error(this.className, functionName, `Pipeline Fatal Interruption: ${error.message}`, correlationId, currentStoreId);
            Logger.error(this.className, functionName, `Error Dump Stack Trace: ${error.stack}`, correlationId, currentStoreId);
            throw error;
        }
    }
}