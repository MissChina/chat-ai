import Anthropic from '@anthropic-ai/sdk';
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

export class ClaudeAdapter extends AIAdapterBase {
  modelId = 'claude-3-5-sonnet-20241022';
  modelName = 'Claude 3.5 Sonnet';
  provider = 'anthropic';
  capabilities: AICapabilities = {
    streaming: true,
    vision: true,
    functionCalling: false,
  };
  pricing: Pricing = {
    input: 0.003,  // $0.003 per 1K tokens
    output: 0.015, // $0.015 per 1K tokens
  };

  private client?: Anthropic;

  async initialize(): Promise<void> {
    const apiKey = config.anthropicApiKey;
    if (!apiKey) {
      throw new AIError(
        'Anthropic API Key not configured',
        AIErrorCode.INVALID_API_KEY
      );
    }
    this.client = new Anthropic({ apiKey });
  }

  validateConfig(config: any): boolean {
    return config.apiKey && config.apiKey.startsWith('sk-ant-');
  }

  async sendMessage(params: MessageParams): Promise<AIResponse> {
    if (!this.client) await this.initialize();

    return this.retryWithBackoff(async () => {
      const { system, messages } = this.formatMessagesForClaude(
        params.messages,
        params.systemPrompt
      );

      const response = await this.client!.messages.create({
        model: this.modelId,
        system,
        messages,
        max_tokens: params.maxTokens ?? 2000,
        temperature: params.temperature ?? 0.7,
        stop_sequences: params.stopSequences,
      });

      return this.formatResponse(response);
    });
  }

  async *sendStreamingMessage(params: MessageParams): AsyncIterator<AIChunk> {
    if (!this.client) await this.initialize();

    const { system, messages } = this.formatMessagesForClaude(
      params.messages,
      params.systemPrompt
    );

    const stream = await this.client!.messages.create({
      model: this.modelId,
      system,
      messages,
      max_tokens: params.maxTokens ?? 2000,
      stream: true,
    });

    let index = 0;
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield {
          content: event.delta.text,
          index: index++,
          delta: event,
        };
      }

      if (event.type === 'message_stop') {
        yield {
          content: '',
          index: index,
          finishReason: 'stop',
        };
      }
    }
  }

  private formatMessagesForClaude(
    messages: Message[],
    systemPrompt?: string
  ): { system: string; messages: any[] } {
    // Claude requires alternating user/assistant messages
    let system = systemPrompt || '';
    const formatted: any[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        system += '\n' + msg.content;
      } else {
        formatted.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    // Ensure it starts with a user message
    if (formatted.length > 0 && formatted[0]?.role !== 'user') {
      formatted.unshift({
        role: 'user',
        content: 'Please answer the following question.',
      });
    }

    return { system, messages: formatted };
  }

  private formatResponse(rawResponse: any): AIResponse {
    return {
      content: rawResponse.content[0].text,
      finishReason: rawResponse.stop_reason,
      usage: {
        promptTokens: rawResponse.usage.input_tokens,
        completionTokens: rawResponse.usage.output_tokens,
        totalTokens: rawResponse.usage.input_tokens + rawResponse.usage.output_tokens,
      },
      model: rawResponse.model,
      timestamp: new Date(),
      raw: rawResponse,
    };
  }
}
