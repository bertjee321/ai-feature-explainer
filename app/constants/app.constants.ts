// Constants for security limits
export const MAX_CODE_LENGTH = 10000; // 10KB limit
export const MAX_REQUEST_SIZE = 50000; // 50KB total request limit
export const RATE_LIMIT_WINDOW = 60000; // 1 minute
export const MAX_REQUESTS_PER_WINDOW = 10;
export const MAX_RESPONSE_SIZE = 1_000_000; // 1MB limit
export const STREAM_TIMEOUT = 30000; // 30 seconds timeout