import { Role } from "./Role";

export interface User {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    isActive: boolean;
    isInitialPassword?: boolean;

    approver: User;
    roles: Array<Role>;
}