import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ServiceContainer } from '../services/container.js';
import {
  SearchDocumentationSchema,
  ExplainTopicSchema,
  ListSkillsSchema,
  ReadSkillSchema,
  ListRulesSchema,
  ReadRuleSchema,
  SearchReferenceSchema,
  ListTemplatesSchema,
  GetTemplateSchema,
  ValidateCodeSchema,
  ExplainValidationSchema,
  SdkMatrixSchema,
  SearchSdkFeatureSchema,
  SearchConstraintsSchema,
  SearchNetworkingSchema,
  SearchExamplesSchema,
  SearchBestPracticeSchema,
  SearchAntipatternSchema,
} from '../schemas/tools.js';
import {
  handleSearchDocumentation,
  handleExplainTopic,
  handleListSkills,
  handleReadSkill,
  handleListRules,
  handleReadRule,
  handleSearchReference,
  handleListTemplates,
  handleGetTemplate,
  handleValidateCode,
  handleExplainValidation,
  handleSdkMatrix,
  handleSearchSdkFeature,
  handleSearchConstraints,
  handleSearchNetworking,
  handleSearchExamples,
  handleSearchBestPractice,
  handleSearchAntipattern,
} from './handlers.js';

/**
 * Registers all repository-driven MCP tools.
 */
export function registerTools(server: McpServer, container: ServiceContainer): void {
  server.tool(
    'search_documentation',
    'Search agent-skills-vrc-udon documentation with keyword, heading, and fuzzy matching',
    SearchDocumentationSchema.shape,
    async (input) => ({
      content: [
        {
          type: 'text' as const,
          text: handleSearchDocumentation(container, SearchDocumentationSchema.parse(input)),
        },
      ],
    }),
  );

  server.tool(
    'explain_topic',
    'Explain a Udon/VRChat topic citing indexed repository sections with path and line numbers',
    ExplainTopicSchema.shape,
    async (input) => ({
      content: [
        { type: 'text' as const, text: handleExplainTopic(container, ExplainTopicSchema.parse(input)) },
      ],
    }),
  );

  server.tool(
    'list_skills',
    'Auto-discover all skills from the repository',
    ListSkillsSchema.shape,
    async () => ({
      content: [{ type: 'text' as const, text: handleListSkills(container) }],
    }),
  );

  server.tool(
    'read_skill',
    'Read full SKILL.md with metadata, rules, references, and templates',
    ReadSkillSchema.shape,
    async (input) => ({
      content: [
        { type: 'text' as const, text: handleReadSkill(container, ReadSkillSchema.parse(input)) },
      ],
    }),
  );

  server.tool(
    'list_rules',
    'List all UdonSharp rules from the repository',
    ListRulesSchema.shape,
    async (input) => ({
      content: [
        { type: 'text' as const, text: handleListRules(container, ListRulesSchema.parse(input)) },
      ],
    }),
  );

  server.tool(
    'read_rule',
    'Read a rule with purpose, constraints, examples, and related rules',
    ReadRuleSchema.shape,
    async (input) => ({
      content: [
        { type: 'text' as const, text: handleReadRule(container, ReadRuleSchema.parse(input)) },
      ],
    }),
  );

  server.tool(
    'search_reference',
    'Search reference documentation in the repository',
    SearchReferenceSchema.shape,
    async (input) => ({
      content: [
        {
          type: 'text' as const,
          text: handleSearchReference(container, SearchReferenceSchema.parse(input)),
        },
      ],
    }),
  );

  server.tool(
    'list_templates',
    'List UdonSharp code templates from the repository',
    ListTemplatesSchema.shape,
    async (input) => ({
      content: [
        {
          type: 'text' as const,
          text: handleListTemplates(container, ListTemplatesSchema.parse(input)),
        },
      ],
    }),
  );

  server.tool(
    'get_template',
    'Get a specific UdonSharp template with full source code',
    GetTemplateSchema.shape,
    async (input) => ({
      content: [
        { type: 'text' as const, text: handleGetTemplate(container, GetTemplateSchema.parse(input)) },
      ],
    }),
  );

  server.tool(
    'validate_code',
    'Validate UdonSharp code using rules parsed from the repository',
    ValidateCodeSchema.shape,
    async (input) => ({
      content: [
        { type: 'text' as const, text: handleValidateCode(container, ValidateCodeSchema.parse(input)) },
      ],
    }),
  );

  server.tool(
    'explain_validation',
    'Explain a validation failure by referencing the repository rule that caused it',
    ExplainValidationSchema.shape,
    async (input) => ({
      content: [
        {
          type: 'text' as const,
          text: handleExplainValidation(container, ExplainValidationSchema.parse(input)),
        },
      ],
    }),
  );

  server.tool(
    'sdk_matrix',
    'Get SDK version matrix from repository documentation',
    SdkMatrixSchema.shape,
    async () => ({
      content: [{ type: 'text' as const, text: handleSdkMatrix(container) }],
    }),
  );

  server.tool(
    'search_sdk_feature',
    'Search SDK features like NetworkCallable, PlayerData, PhysBones',
    SearchSdkFeatureSchema.shape,
    async (input) => ({
      content: [
        {
          type: 'text' as const,
          text: handleSearchSdkFeature(container, SearchSdkFeatureSchema.parse(input)),
        },
      ],
    }),
  );

  server.tool(
    'search_constraints',
    'Search UdonSharp constraints (List<T>, Dictionary, Coroutine, etc.) with alternatives',
    SearchConstraintsSchema.shape,
    async (input) => ({
      content: [
        {
          type: 'text' as const,
          text: handleSearchConstraints(container, SearchConstraintsSchema.parse(input)),
        },
      ],
    }),
  );

  server.tool(
    'search_networking',
    'Search networking topics: ownership, sync modes, late joiners, serialization',
    SearchNetworkingSchema.shape,
    async (input) => ({
      content: [
        {
          type: 'text' as const,
          text: handleSearchNetworking(container, SearchNetworkingSchema.parse(input)),
        },
      ],
    }),
  );

  server.tool(
    'search_examples',
    'Search UdonSharp code examples and patterns from the repository',
    SearchExamplesSchema.shape,
    async (input) => ({
      content: [
        {
          type: 'text' as const,
          text: handleSearchExamples(container, SearchExamplesSchema.parse(input)),
        },
      ],
    }),
  );

  server.tool(
    'search_best_practice',
    'Search recommended patterns and best practices',
    SearchBestPracticeSchema.shape,
    async (input) => ({
      content: [
        {
          type: 'text' as const,
          text: handleSearchBestPractice(container, SearchBestPracticeSchema.parse(input)),
        },
      ],
    }),
  );

  server.tool(
    'search_antipattern',
    'Search anti-patterns and common mistakes to avoid',
    SearchAntipatternSchema.shape,
    async (input) => ({
      content: [
        {
          type: 'text' as const,
          text: handleSearchAntipattern(container, SearchAntipatternSchema.parse(input)),
        },
      ],
    }),
  );
}
