import { z } from 'zod';

export const SearchDocumentationSchema = z.object({
  query: z.string().min(1).describe('Search query for documentation'),
  sdkVersion: z.string().optional().describe('Filter by SDK version'),
  limit: z.number().int().min(1).max(50).optional().default(10),
});

export const ExplainTopicSchema = z.object({
  topic: z.string().min(1).describe('Topic to explain'),
  sdkVersion: z.string().optional().describe('Target SDK version'),
  depth: z.enum(['brief', 'detailed', 'expert']).optional().default('detailed'),
});

export const ListSkillsSchema = z.object({});

export const ReadSkillSchema = z.object({
  skillId: z.string().min(1).describe('Skill identifier (e.g. unity-vrc-udon-sharp)'),
});

export const ListRulesSchema = z.object({
  skillId: z.string().optional().describe('Filter rules by skill'),
});

export const ReadRuleSchema = z.object({
  ruleId: z.string().min(1).describe('Rule identifier or filename'),
});

export const SearchReferenceSchema = z.object({
  query: z.string().min(1).describe('Search query for references'),
  skillId: z.string().optional(),
  limit: z.number().int().min(1).max(50).optional().default(10),
});

export const ListTemplatesSchema = z.object({
  skillId: z.string().optional().describe('Filter templates by skill'),
});

export const GetTemplateSchema = z.object({
  templateId: z.string().min(1).describe('Template identifier or filename'),
});

export const ValidateCodeSchema = z.object({
  code: z.string().min(1).describe('UdonSharp C# code to validate'),
  sdkVersion: z.string().optional(),
});

export const ExplainValidationSchema = z.object({
  ruleId: z.string().min(1).describe('Validation rule ID from validate_code'),
});

export const SdkMatrixSchema = z.object({});

export const SearchSdkFeatureSchema = z.object({
  query: z.string().min(1).describe('SDK feature to search (e.g. NetworkCallable, PlayerData)'),
  sdkVersion: z.string().optional(),
  limit: z.number().int().min(1).max(50).optional().default(10),
});

export const SearchConstraintsSchema = z.object({
  query: z.string().min(1).describe('Constraint to search (e.g. List<T>, Coroutine)'),
  limit: z.number().int().min(1).max(50).optional().default(10),
});

export const SearchNetworkingSchema = z.object({
  query: z.string().min(1).describe('Networking topic to search'),
  limit: z.number().int().min(1).max(50).optional().default(10),
});

export const SearchExamplesSchema = z.object({
  query: z.string().min(1).describe('Search query for code examples'),
  limit: z.number().int().min(1).max(50).optional().default(10),
});

export const SearchBestPracticeSchema = z.object({
  query: z.string().min(1).describe('Best practice topic to search'),
  limit: z.number().int().min(1).max(50).optional().default(10),
});

export const SearchAntipatternSchema = z.object({
  query: z.string().min(1).describe('Anti-pattern to search'),
  limit: z.number().int().min(1).max(50).optional().default(10),
});

export type SearchDocumentationInput = z.infer<typeof SearchDocumentationSchema>;
export type ExplainTopicInput = z.infer<typeof ExplainTopicSchema>;
export type ListSkillsInput = z.infer<typeof ListSkillsSchema>;
export type ReadSkillInput = z.infer<typeof ReadSkillSchema>;
export type ListRulesInput = z.infer<typeof ListRulesSchema>;
export type ReadRuleInput = z.infer<typeof ReadRuleSchema>;
export type SearchReferenceInput = z.infer<typeof SearchReferenceSchema>;
export type ListTemplatesInput = z.infer<typeof ListTemplatesSchema>;
export type GetTemplateInput = z.infer<typeof GetTemplateSchema>;
export type ValidateCodeInput = z.infer<typeof ValidateCodeSchema>;
export type ExplainValidationInput = z.infer<typeof ExplainValidationSchema>;
export type SdkMatrixInput = z.infer<typeof SdkMatrixSchema>;
export type SearchSdkFeatureInput = z.infer<typeof SearchSdkFeatureSchema>;
export type SearchConstraintsInput = z.infer<typeof SearchConstraintsSchema>;
export type SearchNetworkingInput = z.infer<typeof SearchNetworkingSchema>;
export type SearchExamplesInput = z.infer<typeof SearchExamplesSchema>;
export type SearchBestPracticeInput = z.infer<typeof SearchBestPracticeSchema>;
export type SearchAntipatternInput = z.infer<typeof SearchAntipatternSchema>;
