import { describe, it, expect, beforeAll } from 'vitest';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DocsRepository } from '../repositories/docs-repository.js';
import { ValidationService } from '../services/validation-service.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoPath = join(__dirname, '../../agent-skills-vrc-udon');

describe('ValidationService', () => {
  let validator: ValidationService;

  beforeAll(() => {
    const repo = new DocsRepository(repoPath, join(__dirname, '../../data/test-validators'));
    repo.rebuild();
    validator = new ValidationService(repo);
  });

  it('detects unsupported List<T> from repository rules', () => {
    const code = `
using UdonSharp;
public class Test : UdonSharpBehaviour {
    private List<int> items;
}`;
    const result = validator.validate(code);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.message.toLowerCase().includes('list'))).toBe(true);
    expect(result.issues.some((i) => i.sourcePath.includes('udonsharp'))).toBe(true);
  });

  it('detects missing UdonSharpBehaviour', () => {
    const code = `public class Test : MonoBehaviour { }`;
    const result = validator.validate(code);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.message.includes('UdonSharpBehaviour'))).toBe(true);
  });

  it('detects Coroutine usage from hook rules', () => {
    const code = `
using UdonSharp;
public class Test : UdonSharpBehaviour {
    void Start() { StartCoroutine(MyCoroutine()); }
}`;
    const result = validator.validate(code);
    expect(result.issues.some((i) => i.message.toLowerCase().includes('coroutine') || i.message.toLowerCase().includes('startcoroutine'))).toBe(true);
  });

  it('passes valid minimal code', () => {
    const code = `
using UdonSharp;
using UnityEngine;
using VRC.SDKBase;

[UdonBehaviourSyncMode(BehaviourSyncMode.NoVariableSync)]
public class ValidScript : UdonSharpBehaviour
{
    void Start() { }
}`;
    const result = validator.validate(code);
    expect(result.summary.errors).toBe(0);
  });

  it('explains validation rule from repository', () => {
    const code = `
using UdonSharp;
public class Test : UdonSharpBehaviour {
    private List<int> items;
}`;
    const result = validator.validate(code);
    const issue = result.issues.find((i) => i.message.toLowerCase().includes('list'));
    expect(issue).toBeDefined();
    if (issue) {
      const explanation = validator.explainValidation(issue.ruleId);
      expect(explanation.documentation).not.toBeNull();
    }
  });
});
