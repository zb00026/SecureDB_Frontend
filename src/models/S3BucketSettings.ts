
export interface S3BucketSettings {
  id?: number;
  bucketName: string;
  previousBucketName?: string;
  isEncrypted?: boolean;
  versioningEnabled?: boolean;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  localRetentionDays: number;
}