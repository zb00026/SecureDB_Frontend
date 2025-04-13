import { AccessLevel } from "./AccessLevel";

export interface AssetObject {
  name: string;
  grants?: Array<AccessLevel> | null;
  data?: Array<string> | null;
}