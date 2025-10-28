import { Asset } from './assets/Asset';

export interface MaskingPolicy {
  readonly id: string;
  readonly fieldName: string;
  readonly tableName: string;
  readonly maskingStrategy: 'partial' | 'full' | 'hash' | 'custom';
  readonly customPattern?: string;
  readonly roles?: string[];
  readonly description: string;
  readonly createdAt: string;
  readonly isActive: boolean;
  readonly asset: Asset;
}
