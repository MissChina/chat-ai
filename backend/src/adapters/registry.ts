import { AIAdapterBase } from './types';
import { GPT4Adapter } from './gpt4-adapter';
import { ClaudeAdapter } from './claude-adapter';

// Type for adapter factory function
type AIAdapterFactory = (modelId: string) => AIAdapterBase;

export class AIAdapterRegistry {
  private static factories: Map<string, AIAdapterFactory> = new Map();
  private static instances: Map<string, AIAdapterBase> = new Map();

  // Register all available adapters
  static initialize() {
    // OpenAI models use the same adapter with different model IDs
    const gptFactory = (modelId: string) => new GPT4Adapter(modelId);
    this.register('gpt-4', gptFactory);
    this.register('gpt-4-turbo', gptFactory);
    this.register('gpt-3.5-turbo', gptFactory);
    
    // Claude models
    const claudeFactory = (modelId: string) => new ClaudeAdapter(modelId);
    this.register('claude-3-5-sonnet-20241022', claudeFactory);
    this.register('claude-3-opus', claudeFactory);
    
    console.log('AI Adapters initialized:', Array.from(this.factories.keys()));
  }

  static register(modelId: string, factory: AIAdapterFactory) {
    this.factories.set(modelId, factory);
  }

  static async getAdapter(modelId: string): Promise<AIAdapterBase> {
    // Return cached instance if exists
    if (this.instances.has(modelId)) {
      return this.instances.get(modelId)!;
    }

    // Get adapter factory
    const factory = this.factories.get(modelId);
    if (!factory) {
      throw new Error(`AI model adapter not found: ${modelId}`);
    }

    // Create and initialize instance
    const adapter = factory(modelId);
    await adapter.initialize();

    // Cache instance
    this.instances.set(modelId, adapter);

    return adapter;
  }

  static getAvailableModels(): string[] {
    return Array.from(this.factories.keys());
  }

  static hasModel(modelId: string): boolean {
    return this.factories.has(modelId);
  }
}
