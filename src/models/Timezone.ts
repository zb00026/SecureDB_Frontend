export interface TimezoneInfoDTO {
  readonly id: string;
  readonly displayName: string;
  readonly utcOffset: string;
}

export interface TimezoneRequest {
  readonly timezone: string;
}

export interface TimezoneResponse {
  readonly timezone: string;
}

export interface SystemSettings {
  readonly timezone: string;
  readonly [key: string]: any;
}
