import mongoose, { Schema, Document } from 'mongoose';

export interface IMappingConfig extends Document {
    sourceTable: string;
    matchCondition: Record<string, any>;
    targetFlowName: string;
    description: string;
}

const MappingConfigSchema: Schema = new Schema(
    {
        sourceTable: { type: String, required: true },
        matchCondition: { type: Schema.Types.Mixed, required: true },
        targetFlowName: { type: String, required: true },
        description: { type: String, default: "" }
    },
    {
        collection: 'MAPPING_CONFIG',
        versionKey: false
    }
);

export const MappingConfigModel = mongoose.model<IMappingConfig>('MappingConfig', MappingConfigSchema);