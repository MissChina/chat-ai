import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://chatai:chatai_password@localhost:5432/chatai?schema=public',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'demo-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  aliyunAccessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
  aliyunAccessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
};

// Validate critical env variables
const validateEnv = () => {
  const warnings: string[] = [];
  
  if (!process.env.DATABASE_URL) {
    warnings.push('DATABASE_URL not set, using default: file:./dev.db');
  }
  
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('demo')) {
    warnings.push('JWT_SECRET not set or using demo value - CHANGE IN PRODUCTION!');
  }
  
  if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    warnings.push('No AI API keys configured - users must provide their own');
  }
  
  if (warnings.length > 0 && config.nodeEnv !== 'production') {
    console.warn('⚠ Environment configuration warnings:');
    warnings.forEach(w => console.warn(`  - ${w}`));
  } else if (warnings.length > 0 && config.nodeEnv === 'production') {
    console.error('❌ Critical environment variables missing in production!');
    warnings.forEach(w => console.error(`  - ${w}`));
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('demo')) {
      throw new Error('JWT_SECRET must be set to a secure value in production');
    }
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL must be set in production');
    }
  }
};

validateEnv();
