import { Role } from "./Role";

export interface User {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    isActive: boolean;

    approver: User;
    roles: Array<Role>;
}