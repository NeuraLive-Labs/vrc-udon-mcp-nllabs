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
 * Descriptions tell agents WHEN/HOW to use each tool for accurate UdonSharp generation.
 */
export function registerTools(server: McpServer, container: ServiceContainer): void {
  server.tool(
    'search_documentation',
    'WHEN: before answering any Udon/VRChat docs question. HOW: keyword/fuzzy search the indexed agent-skills repo. Prefer this over inventing APIs from general C# knowledge.',
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
    'WHEN: user needs a cited explanation of a Udon/VRChat topic. HOW: returns sections with path and line numbers — use citations, do not paraphrase away constraints.',
    ExplainTopicSchema.shape,
    async (input) => ({
      content: [
        { type: 'text' as const, text: handleExplainTopic(container, ExplainTopicSchema.parse(input)) },
      ],
    }),
  );

  server.tool(
    'list_skills',
    'WHEN: starting an Udon session or discovering available skills. HOW: list skills from the repo before reading one with read_skill.',
    ListSkillsSchema.shape,
    async () => ({
      content: [{ type: 'text' as const, text: handleListSkills(container) }],
    }),
  );

  server.tool(
    'read_skill',
    'WHEN: you need the full skill contract (rules, refs, templates). HOW: call after list_skills; follow linked rules before writing code.',
    ReadSkillSchema.shape,
    async (input) => ({
      content: [
        { type: 'text' as const, text: handleReadSkill(container, ReadSkillSchema.parse(input)) },
      ],
    }),
  );

  server.tool(
    'list_rules',
    'WHEN: you need the set of UdonSharp rules before coding. HOW: list then read_rule for any rule that applies to the feature.',
    ListRulesSchema.shape,
    async (input) => ({
      content: [
        { type: 'text' as const, text: handleListRules(container, ListRulesSchema.parse(input)) },
      ],
    }),
  );

  server.tool(
    'read_rule',
    'WHEN: implementing something covered by a named rule (constraints, networking, etc.). HOW: apply purpose/constraints/examples from the rule; do not skip constraints.',
    ReadRuleSchema.shape,
    async (input) => ({
      content: [
        { type: 'text' as const, text: handleReadRule(container, ReadRuleSchema.parse(input)) },
      ],
    }),
  );

  server.tool(
    'search_reference',
    'WHEN: looking up API/reference docs in references/. HOW: search before inventing method names or event signatures.',
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
    'WHEN: about to write UdonSharp — first step of template→validate→fix. HOW: list .cs templates, then get_template for the closest match and adapt it.',
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
    'WHEN: before writing UdonSharp. HOW: use the returned source as the BASE — adapt fields/logic; do NOT invent networking (ownership, Manual sync, RequestSerialization). After adapting, call validate_code.',
    GetTemplateSchema.shape,
    async (input) => ({
      content: [
        { type: 'text' as const, text: handleGetTemplate(container, GetTemplateSchema.parse(input)) },
      ],
    }),
  );

  server.tool(
    'validate_code',
    'WHEN: after writing or editing any UdonSharp script (mandatory). HOW: pass full code. If issues: call explain_validation for each unique ruleId, fix, then re-run validate_code until valid. Never ship code that failed validation.',
    ValidateCodeSchema.shape,
    async (input) => ({
      content: [
        { type: 'text' as const, text: handleValidateCode(container, ValidateCodeSchema.parse(input)) },
      ],
    }),
  );

  server.tool(
    'explain_validation',
    'WHEN: validate_code returned issues. HOW: call once per unique ruleId from the result, read the cited rule/docs, apply the fix, then re-run validate_code. Part of the fix loop — do not guess fixes.',
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
    'WHEN: checking which APIs exist for a target SDK version. HOW: read the matrix before using version-specific features.',
    SdkMatrixSchema.shape,
    async () => ({
      content: [{ type: 'text' as const, text: handleSdkMatrix(container) }],
    }),
  );

  server.tool(
    'search_sdk_feature',
    'WHEN: unsure if a feature (NetworkCallable, PlayerData, PhysBones, etc.) exists or how it works. HOW: search before coding against that feature.',
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
    'WHEN: BEFORE using any C# feature in UdonSharp (List<T>, Dictionary, Coroutine, LINQ, async, generics, etc.). HOW: check constraints and use documented alternatives. Skipping this causes invalid Udon.',
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
    'WHEN: any ownership, sync mode, late joiners, serialization, or RPC work. HOW: search before writing synced fields; prefer Manual + RequestSerialization patterns from docs/templates.',
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
    'WHEN: before writing UdonSharp (prefer with get_template). HOW: use matching examples as the code BASE — adapt, do not invent APIs or networking patterns. Then validate_code.',
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
    'WHEN: refining structure, performance, or idiomatic UdonSharp. HOW: apply recommended patterns from the repo after drafting from a template.',
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
    'WHEN: BEFORE using unfamiliar C# patterns or when validate_code fails with a common mistake. HOW: check anti-patterns to avoid; prefer documented alternatives.',
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
