import type { ServiceContainer } from '../services/container.js';
import { formatJson } from '../utils/index.js';
import type {
  SearchDocumentationInput,
  ExplainTopicInput,
  ReadSkillInput,
  ListRulesInput,
  ReadRuleInput,
  SearchReferenceInput,
  ListTemplatesInput,
  GetTemplateInput,
  ValidateCodeInput,
  ExplainValidationInput,
  SearchSdkFeatureInput,
  SearchConstraintsInput,
  SearchNetworkingInput,
  SearchExamplesInput,
  SearchBestPracticeInput,
  SearchAntipatternInput,
} from '../schemas/tools.js';

export function handleSearchDocumentation(
  container: ServiceContainer,
  input: SearchDocumentationInput,
): string {
  const results = container.documentationService.searchDocumentation(input.query, {
    ...(input.sdkVersion !== undefined ? { sdkVersion: input.sdkVersion } : {}),
    limit: input.limit,
  });
  return formatJson({ query: input.query, count: results.length, results });
}

export function handleExplainTopic(container: ServiceContainer, input: ExplainTopicInput): string {
  const explanation = container.documentationService.explainTopic(
    input.topic,
    input.sdkVersion ?? container.config.sdkVersion,
    input.depth,
  );
  return formatJson(explanation);
}

export function handleListSkills(container: ServiceContainer): string {
  const skills = container.skillService.listSkills();
  return formatJson({ count: skills.length, skills });
}

export function handleReadSkill(container: ServiceContainer, input: ReadSkillInput): string {
  const skill = container.skillService.readSkill(input.skillId);
  if (!skill) {
    return formatJson({ error: `Skill not found: ${input.skillId}` });
  }
  return formatJson(skill);
}

export function handleListRules(container: ServiceContainer, input: ListRulesInput): string {
  const rules = container.ruleService.listRules(input.skillId);
  return formatJson({ count: rules.length, rules });
}

export function handleReadRule(container: ServiceContainer, input: ReadRuleInput): string {
  const rule = container.ruleService.readRule(input.ruleId);
  if (!rule) {
    return formatJson({ error: `Rule not found: ${input.ruleId}` });
  }
  return formatJson(rule);
}

export function handleSearchReference(
  container: ServiceContainer,
  input: SearchReferenceInput,
): string {
  const results = container.searchEngine.search(input.query, {
    fileType: 'reference',
    limit: input.limit,
  });
  const filtered = input.skillId
    ? results.filter((r) => r.path.includes(input.skillId!))
    : results;
  return formatJson({ query: input.query, count: filtered.length, results: filtered });
}

export function handleListTemplates(
  container: ServiceContainer,
  input: ListTemplatesInput,
): string {
  const templates = container.templateService.listTemplates(input.skillId);
  return formatJson({
    count: templates.length,
    templates: templates.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      path: t.path,
      tags: t.tags,
    })),
  });
}

export function handleGetTemplate(container: ServiceContainer, input: GetTemplateInput): string {
  const template = container.templateService.getTemplate(input.templateId);
  if (!template) {
    return formatJson({ error: `Template not found: ${input.templateId}` });
  }
  return formatJson(template);
}

export function handleValidateCode(container: ServiceContainer, input: ValidateCodeInput): string {
  const result = container.validationService.validate(
    input.code,
    input.sdkVersion ?? container.config.sdkVersion,
  );
  return formatJson(result);
}

export function handleExplainValidation(
  container: ServiceContainer,
  input: ExplainValidationInput,
): string {
  const explanation = container.validationService.explainValidation(input.ruleId);
  return formatJson(explanation);
}

export function handleSdkMatrix(container: ServiceContainer): string {
  const matrix = container.sdkService.getSdkMatrix();
  return formatJson(matrix);
}

export function handleSearchSdkFeature(
  container: ServiceContainer,
  input: SearchSdkFeatureInput,
): string {
  const features = container.sdkService.searchSdkFeature(
    input.query,
    input.sdkVersion ?? container.config.sdkVersion,
    input.limit,
  );
  return formatJson({ query: input.query, count: features.length, features });
}

export function handleSearchConstraints(
  container: ServiceContainer,
  input: SearchConstraintsInput,
): string {
  const results = container.documentationService.searchByCategory(
    input.query,
    'constraints',
    input.limit,
  );
  return formatJson({ query: input.query, count: results.length, results });
}

export function handleSearchNetworking(
  container: ServiceContainer,
  input: SearchNetworkingInput,
): string {
  const results = container.documentationService.searchByCategory(
    input.query,
    'networking',
    input.limit,
  );
  return formatJson({ query: input.query, count: results.length, results });
}

export function handleSearchExamples(
  container: ServiceContainer,
  input: SearchExamplesInput,
): string {
  const results = container.documentationService.searchByCategory(
    input.query,
    'examples',
    input.limit,
  );
  return formatJson({ query: input.query, count: results.length, results });
}

export function handleSearchBestPractice(
  container: ServiceContainer,
  input: SearchBestPracticeInput,
): string {
  const results = container.documentationService.searchByCategory(
    input.query,
    'best-practice',
    input.limit,
  );
  return formatJson({ query: input.query, count: results.length, results });
}

export function handleSearchAntipattern(
  container: ServiceContainer,
  input: SearchAntipatternInput,
): string {
  const results = container.documentationService.searchByCategory(
    input.query,
    'antipattern',
    input.limit,
  );
  return formatJson({ query: input.query, count: results.length, results });
}
