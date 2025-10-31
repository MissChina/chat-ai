import OpenAI from 'openai';
import {
  AIAdapterBase,
  AICapabilities,
  AIChunk,
  AIError,
  AIErrorCode,
  AIResponse,
  Message,
  MessageParams,
  Pricing,
} from './types';
import { config } from '../config/env';

export class GPT4Adapter extends AIAdapterBase {
  modelId = 'gpt-4';
  modelName = 'GPT-4';
  provider = 'openai';
  capabilities: AICapabilities = {
    streaming: true,
    vision: true,
    functionCalling: true,
  };
  pricing: Pricing = {
    input: 0.03,  // $0.03 per 1K tokens
    output: 0.06, // $0.06 per 1K tokens
  };

  private client?: OpenAI;

  async initialize(): Promise<void> {
    const apiKey = config.openaiApiKey;
    if (!apiKey) {
      throw new AIError(
        'OpenAI API Key not configured',
        AIErrorCode.INVALID_API_KEY
      );
    }
    this.client = new OpenAI({ apiKey });
  }

  validateConfig(config: any): boolean {
    return config.apiKey && config.apiKey.startsWith('sk-');
  }

  async sendMessage(params: MessageParams): Promise<AIResponse> {
    if (!this.client) await this.initialize();

    return this.retryWithBackoff(async () => {
      const response = await this.client!.chat.completions.create({
        model: this.modelId,
        messages: this.formatMessages(params.messages, params.systemPrompt),
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? 2000,
        stop: params.stopSequences,
        user: params.userId,
      });

      return this.formatResponse(response);
    });
  }

  async *sendStreamingMessage(params: MessageParams): AsyncIterator<AIChunk> {
    if (!this.client) await this.initialize();

    const stream = await this.client!.chat.completions.create({
      model: this.modelId,
      messages: this.formatMessages(params.messages, params.systemPrompt),
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 2000,
      stream: true,
      user: params.userId,
    });

    let index = 0;
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        yield {
          content: delta.content,
          index: index++,
          finishReason: chunk.choices[0]?.finish_reason || undefined,
          delta,
        };
      }
    }
  }

  private formatMessages(messages: Message[], systemPrompt?: string): any[] {
    const formatted = [...messages];

    if (systemPrompt) {
      formatted.unshift({
        role: 'system',
        content: systemPrompt,
      });
    }

    return formatted;
  }

  private formatResponse(rawResponse: any): AIResponse {
    const choice = rawResponse.choices[0];
    return {
      content: choice.message.content,
      finishReason: choice.finish_reason,
      usage: {
        promptTokens: rawResponse.usage.prompt_tokens,
        completionTokens: rawResponse.usage.completion_tokens,
        totalTokens: rawResponse.usage.total_tokens,
      },
      model: rawResponse.model,
      timestamp: new Date(),
      raw: rawResponse,
    };
  }

  protected handleError(error: any): never {
    let aiError: AIError;

    if (error.response) {
      const status = error.response.status;

      switch (status) {
        case 401:
          aiError = new AIError(
            'OpenAI API Key is invalid or expired',
            AIErrorCode.INVALID_API_KEY,
            401,
            false,
            error
          );
          break;

        case 429:
          aiError = new AIError(
            'Rate limit exceeded, please retry later',
            AIErrorCode.RATE_LIMIT_EXCEEDED,
            429,
            true,
            error
          );
          break;

        case 400:
          const errorCode = error.response.data?.error?.code;
          if (errorCode === 'context_length_exceeded') {
            aiError = new AIError(
              'Context length exceeded limit',
              AIErrorCode.CONTEXT_TOO_LONG,
              400,
              false,
              error
            );
          } else {
            aiError = new AIError(
              'Invalid request parameters',
              AIErrorCode.INVALID_REQUEST,
              400,
              false,
              error
            );
          }
          break;

        case 500:
        case 502:
        case 503:
          aiError = new AIError(
            'OpenAI service temporarily unavailable',
            AIErrorCode.SERVICE_UNAVAILABLE,
            status,
            true,
            error
          );
          break;

        default:
          aiError = new AIError(
            'Unknown error',
            AIErrorCode.UNKNOWN_ERROR,
            status,
            false,
            error
          );
      }
    } else if (error.code === 'ECONNABORTED') {
      aiError = new AIError(
        'Request timeout',
        AIErrorCode.TIMEOUT,
        undefined,
        true,
        error
      );
    } else {
      aiError = new AIError(
        'Network error',
        AIErrorCode.NETWORK_ERROR,
        undefined,
        true,
        error
      );
    }

    throw aiError;
  }
}
