import { AssetType, DatabaseType, UnixServerType, LockType } from "@/constants/enums";
import { AssetCredential } from "./AssetCredential";
import { User } from "../User";
import { AccessRequest } from "./AccessRequest";

export interface Asset {
    id?: number;
    name: string;
    description: string;
    type: AssetType | '';
    databaseType?: DatabaseType | null;
    unixServerType?: UnixServerType | null;
    hostAddress: string;
    portNumber: string;
    databaseName: string;
    hostUrl?: string;
    fetchTemplate?: string;
    createdAt?: Date;
    updatedAt?: Date;
    accessRequest?: AccessRequest;
    owners?: Array<User>;
    credentials?: Array<AssetCredential>;
    approvers?: Array<User>;
    locked?: boolean;
    lockType?: LockType | null;
}