// AI Adapter Types - Unified interface for all AI models

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

export interface MessageParams {
  messages: Message[];
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  stream?: boolean;
  userId?: string;
}

export interface AIResponse {
  content: string;
  finishReason: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  timestamp: Date;
  raw?: any;
}

export interface AIChunk {
  content: string;
  index: number;
  finishReason?: string;
  delta?: any;
}

export interface AICapabilities {
  streaming: boolean;
  vision: boolean;
  functionCalling: boolean;
}

export interface Pricing {
  input: number;  // $ per 1K tokens
  output: number; // $ per 1K tokens
}

export abstract class AIAdapterBase {
  abstract modelId: string;
  abstract modelName: string;
  abstract provider: string;
  abstract capabilities: AICapabilities;
  abstract pricing: Pricing;

  abstract initialize(): Promise<void>;
  abstract validateConfig(config: any): boolean;
  abstract sendMessage(params: MessageParams): Promise<AIResponse>;
  abstract sendStreamingMessage(params: MessageParams): AsyncIterator<AIChunk>;

  // Calculate cost in USD
  calculateCost(inputTokens: number, outputTokens: number): number {
    const inputCost = (inputTokens / 1000) * this.pricing.input;
    const outputCost = (outputTokens / 1000) * this.pricing.output;
    return inputCost + outputCost;
  }

  // Retry logic with exponential backoff
  protected async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        if (i === maxRetries - 1 || !this.isRetryable(error)) {
          throw error;
        }
        const delay = baseDelay * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw new Error('Max retries exceeded');
  }

  protected isRetryable(error: any): boolean {
    // Rate limits and server errors are retryable
    if (error.status === 429 || error.status === 500 || error.status === 502 || error.status === 503) {
      return true;
    }
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return true;
    }
    return false;
  }
}

export class AIError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public retryable: boolean = false,
    public originalError?: any
  ) {
    super(message);
    this.name = 'AIError';
  }
}

export enum AIErrorCode {
  INVALID_API_KEY = 'invalid_api_key',
  INSUFFICIENT_QUOTA = 'insufficient_quota',
  INVALID_REQUEST = 'invalid_request',
  CONTENT_FILTERED = 'content_filtered',
  CONTEXT_TOO_LONG = 'context_too_long',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  TIMEOUT = 'timeout',
  NETWORK_ERROR = 'network_error',
  UNKNOWN_ERROR = 'unknown_error',
}
