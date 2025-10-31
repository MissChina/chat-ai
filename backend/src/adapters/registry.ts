import { AIAdapterBase } from './types';
import { GPT4Adapter } from './gpt4-adapter';
import { ClaudeAdapter } from './claude-adapter';

export class AIAdapterRegistry {
  private static adapters: Map<string, typeof AIAdapterBase> = new Map();
  private static instances: Map<string, AIAdapterBase> = new Map();

  // Register all available adapters
  static initialize() {
    this.register('gpt-4', GPT4Adapter);
    this.register('gpt-4-turbo', GPT4Adapter);
    this.register('gpt-3.5-turbo', GPT4Adapter);
    this.register('claude-3-5-sonnet-20241022', ClaudeAdapter);
    this.register('claude-3-opus', ClaudeAdapter);
    console.log('AI Adapters initialized:', Array.from(this.adapters.keys()));
  }

  static register(modelId: string, adapterClass: typeof AIAdapterBase) {
    this.adapters.set(modelId, adapterClass);
  }

  static async getAdapter(modelId: string): Promise<AIAdapterBase> {
    // Return cached instance if exists
    if (this.instances.has(modelId)) {
      return this.instances.get(modelId)!;
    }

    // Get adapter class
    const AdapterClass = this.adapters.get(modelId);
    if (!AdapterClass) {
      throw new Error(`AI model adapter not found: ${modelId}`);
    }

    // Create and initialize instance
    const adapter = new AdapterClass();
    await adapter.initialize();

    // Cache instance
    this.instances.set(modelId, adapter);

    return adapter;
  }

  static getAvailableModels(): string[] {
    return Array.from(this.adapters.keys());
  }

  static hasModel(modelId: string): boolean {
    return this.adapters.has(modelId);
  }
}
