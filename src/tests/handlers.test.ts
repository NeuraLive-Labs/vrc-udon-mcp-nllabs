import { describe, it, expect, beforeAll } from 'vitest';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DocsRepository } from '../repositories/docs-repository.js';
import { ValidationService } from '../services/validation-service.js';
import { TemplateService } from '../services/template-service.js';
import { handleValidateCode, handleGetTemplate } from '../tools/handlers.js';
import type { ServiceContainer } from '../services/container.js';
import { CODE_WORKFLOW_MARKDOWN } from '../server.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoPath = join(__dirname, '../../agent-skills-vrc-udon');

describe('handler agentGuidance', () => {
  let container: Pick<
    ServiceContainer,
    'validationService' | 'templateService' | 'config'
  >;

  beforeAll(() => {
    const repo = new DocsRepository(repoPath, join(__dirname, '../../data/test-handlers'));
    repo.rebuild();
    container = {
      validationService: new ValidationService(repo),
      templateService: new TemplateService(repo),
      config: { sdkVersion: '3.10.4' } as ServiceContainer['config'],
    };
  });

  it('validate_code appends fix-loop guidance when issues exist', () => {
    const text = handleValidateCode(container as ServiceContainer, {
      code: `
using UdonSharp;
public class Test : UdonSharpBehaviour {
    private List<int> items;
}`,
    });
    const parsed = JSON.parse(text) as {
      valid: boolean;
      agentGuidance: { next: string; ruleIds: string[]; fixHints: string[] };
    };
    expect(parsed.valid).toBe(false);
    expect(parsed.agentGuidance.next).toContain('explain_validation');
    expect(parsed.agentGuidance.ruleIds.length).toBeGreaterThan(0);
  });

  it('validate_code appends pass guidance when clean', () => {
    const text = handleValidateCode(container as ServiceContainer, {
      code: `
using UdonSharp;
using UnityEngine;
using VRC.SDKBase;

[UdonBehaviourSyncMode(BehaviourSyncMode.NoVariableSync)]
public class ValidScript : UdonSharpBehaviour
{
    void Start() { }
}`,
    });
    const parsed = JSON.parse(text) as { agentGuidance: string };
    expect(parsed.agentGuidance).toContain('Validation passed');
  });

  it('get_template reminds to adapt not invent networking', () => {
    const templates = container.templateService.listTemplates();
    expect(templates.length).toBeGreaterThan(0);
    const first = templates[0]!;
    const text = handleGetTemplate(container as ServiceContainer, { templateId: first.id });
    const parsed = JSON.parse(text) as { agentGuidance: string; code?: string };
    expect(parsed.agentGuidance).toContain('Adapt this template');
    expect(parsed.agentGuidance).toContain('validate_code');
  });

  it('exports code workflow resource markdown', () => {
    expect(CODE_WORKFLOW_MARKDOWN).toContain('template');
    expect(CODE_WORKFLOW_MARKDOWN).toContain('validate_code');
    expect(CODE_WORKFLOW_MARKDOWN).toContain('explain_validation');
  });
});
