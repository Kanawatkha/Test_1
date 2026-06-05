import { Schema, model, models } from "mongoose";

export interface IProgramTask {
    programId?: string;
    subProgramId?: string;
    businessName: string;
    curl: string;
    successCondition: {
        status: {
            isSuccess: boolean;
        };
    };
}

export interface IFlowPrc {
    name: string;
    jobQueue: string;
    jobDefinition: string;
    programList: IProgramTask[];
    description: string;
}

const ProgramTaskSchema = new Schema<IProgramTask>({
    programId: { type: String, required: false },
    subProgramId: { type: String, required: false },
    businessName: { type: String, required: false, default: "" },
    curl: { type: String, required: true },
    successCondition: {
        status: {
            isSuccess: { type: Boolean, required: true, default: true }
        }
    }
}, { _id: false });

const FlowPrcSchema = new Schema<IFlowPrc>({
    name: { type: String, required: true, index: true },
    jobQueue: { type: String, required: true },
    jobDefinition: { type: String, required: true },
    programList: { type: [ProgramTaskSchema], required: true, default: [] },
    description: { type: String, required: false }
}, {
    timestamps: false,
    versionKey: false
});

// Avoid OverwriteModelError during hot-reloads/nodemon execution
const collectionName = "FLOW_PRC";
export const FlowPrcModel = models[collectionName] || model<IFlowPrc>(collectionName, FlowPrcSchema, collectionName);