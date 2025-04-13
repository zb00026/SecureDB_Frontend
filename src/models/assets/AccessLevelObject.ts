import { AccessLevel } from './AccessLevel';
import { User } from '../User';
import { AccessRequest } from './AccessRequest';

export interface AccessLevelObject {
  id?: number;
  objectName: string;
  accessLevel: AccessLevel;
  requestor?: User;
  accessRequest?: AccessRequest;
} 