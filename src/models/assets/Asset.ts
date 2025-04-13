import { AssetType, DatabaseType } from "@/constants/enums";
import { AssetCredential } from "./AssetCredential";
import { User } from "../User";
import { AccessRequest } from "./AccessRequest";

export interface Asset {
    id: number;
    name: string;
    description: string;
    type: AssetType;
    databaseType?: DatabaseType;
    hostAddress: string;
    fetchTemplate?: string;
    createdAt?: Date;
    updatedAt?: Date;
    accessRequest?: AccessRequest;
    owners?: Array<User>;
    credentials?: Array<AssetCredential>;
    approvers?: Array<User>;
}