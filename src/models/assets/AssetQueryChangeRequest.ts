import { Asset } from "./Asset";
import { User } from "../User";
import { ChangeRequestStatus } from "@/constants/enums";

export interface AssetQueryChangeRequest {
    id?: number;
    asset: Asset;
    requestor: User;
    ticketReference: string;
    changeDescription: string;
    approvalStatus: ChangeRequestStatus;
    query: string;
    createdAt?: Date;
    updatedAt?: Date;
} 