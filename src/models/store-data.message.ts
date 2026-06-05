export interface KinesisCdcPayload {
    eventSource: string;
    eventVersion: string;
    eventID: string;
    eventName: string;
    invokeIdentityArn: string;
    awsRegion: string;
    eventSourceARN: string;
    kinesisSchemaVersion: string;
    partitionKey: string;
    sequenceNumber: string;
    data: string;
    approximateArrivalTimestamp: number;
}

export interface DecodedStoreStateData {
    data: {
        STORE_ID: string;
        CUR_BSNS_DT?: string;
        BSNS_DT?: string;
        SHIFT_NO?: number;
        TOT_SALE_AMT?: number;
        TOT_CUST_CNT?: number;
        TOTAL_SII_SALE_AMT?: number;
        CHECK_STATUS?: string;
        VAT_AMT?: number;
        VAT_SII_AMT?: number;
        OTHER_REVENUE?: number;
        TOT_PHONE_AMT?: number;
        TOT_VAT_PHONE_AMT?: number;
        TOT_PHONE_CUST?: number;
        TOT_SEVEN_PHONE_CUST?: number;
        UPDATE_AT?: string;
    };
    metadata: {
        timestamp: string;
        "record-type": string;
        operation: string;
        "partition-key-type": string;
        "schema-name": string;
        "table-name": string;
        "transaction-id": number;
    };
}

export interface messageNotification {
    Type: string;
    MessageId: string;
    TopicArn: string;
    Subject: string;
    Message: string;
    Timestamp: string;
    SignatureVersion: string;
    Signature: string;
    SigningCertURL: string;
    UnsubscribeURL: string;
}

export interface messageNotificationS3 {
    Records: {
        eventVersion: string;
        eventSource: string;
        awsRegion: string;
        eventTime: string;
        eventName: string;
        userIdentity: {
            principalId: string;
        };
        requestParameters: {
            sourceIPAddress: string;
        };
        responseElements: {
            "x-amz-request-id": string;
            "x-amz-id-2": string;
        };
        s3: {
            s3SchemaVersion: string;
            configurationId: string;
            bucket: {
                name: string;
                ownerIdentity: {
                    principalId: string;
                };
                arn: string;
            };
            object: {
                key: string;
                size: number;
                eTag: string;
                sequencer: string;
            }
        };
    }[];
}