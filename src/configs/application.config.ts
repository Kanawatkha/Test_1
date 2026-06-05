import dotenv from 'dotenv';
dotenv.config();

const ApplicationConfig = {
    app: {
        nodeEnv: process.env.NODE_ENV,
        appName: process.env.APP_NAME,
        allowedServiceTypes: process.env.ALLOWED_SERVICE_TYPES || "1", // "1,2"
        allowedModules: process.env.MODULE_SALES_TRANSACTION_7DELI_VENDING?.split(",") || [],
        itemFlgTopSdl: process.env.ITEM_FLG_TOD_SDL ? process.env.ITEM_FLG_TOD_SDL.split(",") : [],
        tableMapping: process.env.TABLE_MAPPING?.split(",") || [],
    },
    aws: {
        awsRegion: process.env.AWS_REGION || "ap-southeast-1",
    },
    mysqlDb: {
        hostReader: process.env.HOST_READER,
        hostWriter: process.env.HOST_WRITER,
        dbUser: process.env.DB_USER,
        dbPassword: process.env.DB_PASSWORD,
        databaseName: process.env.DATA_BASE_NAME,
    },
    // Added for Phase 1: Realignment of MongoDB configuration keys based on template structure
    mongoDb: {
        endpoint: process.env.MONGO_ENDPOINT || "",
        username: process.env.MONGO_USERNAME || "",
        password: process.env.MONGO_PASSWORD || "",
        database: process.env.MONGO_DATABASE || "NSS_SC_CONFIG",
        serverSelectionTimeoutMS: 5000,
    },
    sqs: {
        sqsQueueUrl: process.env.SQS_QUEUE_URL,
    }
};

export default ApplicationConfig;