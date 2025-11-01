// Predefined color palette for AI avatars
// These colors are carefully selected for good contrast and accessibility
export const AI_AVATAR_COLORS = [
  '#10a37f', // Teal (OpenAI green)
  '#d4a373', // Bronze (Claude)
  '#4f46e5', // Indigo
  '#0ea5e9', // Sky blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#22c55e', // Green
  '#06b6d4', // Cyan
];

/**
 * Get a deterministic color based on AI model ID or index
 * This ensures the same AI model always gets the same color
 */
export function getAIColor(identifier: string | number): string {
  if (typeof identifier === 'number') {
    return AI_AVATAR_COLORS[identifier % AI_AVATAR_COLORS.length];
  }
  
  // Generate a hash from the string for consistent color selection
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = ((hash << 5) - hash) + identifier.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return AI_AVATAR_COLORS[Math.abs(hash) % AI_AVATAR_COLORS.length];
}
