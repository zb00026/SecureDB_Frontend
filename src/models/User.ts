import { Role } from "./Role";

export interface User {
    id: number;
    name: string;
    email: string;
    isActive: boolean;
    roles: Array<Role>;
}