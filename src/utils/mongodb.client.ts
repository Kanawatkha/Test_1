import mongoose from 'mongoose';
import Logger from './logger';
import ApplicationConfig from '../configs/application.config';
import { FlowPrcModel, IFlowPrc } from '../models/mongo-flow.schema';
import { MappingConfigModel, IMappingConfig } from '../models/mongo-mapping.schema';

export class MongoClient {
    private readonly endpoint: string;
    private readonly options: any;
    private readonly className: string = "MongoClient";

    constructor() {
        const { username: user, password: pass, endpoint, database: dbName, serverSelectionTimeoutMS } = ApplicationConfig.mongoDb;
        this.endpoint = endpoint;
        this.options = { user, pass, dbName, serverSelectionTimeoutMS };
        this.getConnection("-", "-");
    }

    public async getConnection(correlationId: string = "-", storeId: string = "-"): Promise<void> {
        const uriRegex = /^mongodb(\+srv)?:\/\//;
        if (!this.endpoint || !uriRegex.test(this.endpoint)) {
            Logger.error(
                this.className, 
                "getConnection", 
                `Fatal Configuration Error: MONGO_ENDPOINT is undefined or illegal format schema. Provided: "${this.endpoint}"`, 
                correlationId, 
                storeId
            );
            process.exit(1);
        }

        if (mongoose.connection.readyState === 1) return;

        try {
            await mongoose.connect(this.endpoint, this.options);
            Logger.info(this.className, "getConnection", "MongoDB Connected successfully", correlationId, storeId);
        } catch (err: any) {
            Logger.error(this.className, "getConnection", `MongoDB Connection Failure: ${err.message}`, correlationId, storeId);
            throw err;
        }
    }

    async getRouterMapping(
        tableName: string,
        lookupShift: number | null,
        correlationId: string,
        storeId: string
    ): Promise<IMappingConfig | null> {
        const functionName = "getRouterMapping";
        try {
            await this.getConnection(correlationId, storeId);
            Logger.info(this.className, functionName, `Initiating database query for router mapping: ${tableName} with shift: ${lookupShift}`, correlationId, storeId);

            const query: Record<string, any> = { sourceTable: tableName };
            if (lookupShift !== null) {
                query["matchCondition.SHIFT_NO"] = lookupShift;
            }

            const result = await MappingConfigModel.findOne(query).lean().exec();

            if (result) {
                Logger.info(this.className, functionName, `Mapping Document fetched successfully for table: ${tableName}`, correlationId, storeId);
            } else {
                Logger.info(this.className, functionName, `Mapping Document execution returned null for table: ${tableName}`, correlationId, storeId);
            }

            return result as IMappingConfig | null;
        } catch (error: any) {
            Logger.error(this.className, functionName, `Database operation failure during router mapping: ${error.message}`, correlationId, storeId);
            throw error;
        }
    }

    async getFlowConfig(
        configName: string,
        correlationId: string,
        storeId: string
    ): Promise<IFlowPrc | null> {
        const functionName = "getFlowConfig";
        try {
            await this.getConnection(correlationId, storeId);
            Logger.info(this.className, functionName, `Initiating database query for flow configuration name: ${configName}`, correlationId, storeId);

            const result = await FlowPrcModel.findOne({ name: configName }).lean().exec();

            if (result) {
                Logger.info(this.className, functionName, `Configuration Document fetched successfully for target: ${configName}`, correlationId, storeId);
            } else {
                Logger.info(this.className, functionName, `Configuration Document execution returned null for target: ${configName}`, correlationId, storeId);
            }

            return result as IFlowPrc | null;
        } catch (error: any) {
            Logger.error(this.className, functionName, `Database operation failure during configuration mapping: ${error.message}`, correlationId, storeId);
            throw error;
        }
    }
}