import type { DocsRepository } from '../repositories/docs-repository.js';
import type { ValidationIssue, ValidationResult, ValidationRule } from '../types/index.js';

/**
 * Validates UdonSharp code using rules parsed from the repository.
 */
export class ValidationService {
  constructor(private readonly docsRepo: DocsRepository) {}

  validate(code: string, _sdkVersion?: string): ValidationResult {
    const rules = this.docsRepo.getRules();
    const issues: ValidationIssue[] = [];
    const lines = code.split('\n');

    if (!/using\s+UdonSharp/.test(code)) {
      issues.push(this.structuralIssue(
        'Missing UdonSharp using directive',
        'Add: using UdonSharp;',
        'code-quality',
        'skills/unity-vrc-udon-sharp/rules/udonsharp-constraints.md',
        52,
      ));
    }

    if (!/UdonSharpBehaviour/.test(code)) {
      issues.push(this.structuralIssue(
        'Class must inherit from UdonSharpBehaviour',
        'Change base class to UdonSharpBehaviour',
        'code-quality',
        'skills/unity-vrc-udon-sharp/rules/udonsharp-constraints.md',
        50,
      ));
    }

    if (!/\[UdonBehaviourSyncMode/.test(code) && /\[UdonSynced\]/.test(code)) {
      issues.push({
        severity: 'warning',
        message: 'Synced variables without UdonBehaviourSyncMode attribute',
        rule: 'sync-mode',
        ruleId: 'sync-mode-missing',
        suggestion: 'Add [UdonBehaviourSyncMode(BehaviourSyncMode.Manual)] or appropriate mode',
        sourcePath: 'skills/unity-vrc-udon-sharp/rules/udonsharp-networking.md',
        sourceLine: 1,
      });
    }

    for (const rule of rules) {
      if (rule.pattern.global) {
        const globalPattern = new RegExp(rule.pattern.source, rule.pattern.flags);
        let match: RegExpExecArray | null;
        while ((match = globalPattern.exec(code)) !== null) {
          const line = code.slice(0, match.index).split('\n').length;
          issues.push(this.ruleToIssue(rule, line, lines[line - 1]?.trim()));
        }
      } else {
        lines.forEach((line, index) => {
          if (rule.pattern.test(line)) {
            issues.push(this.ruleToIssue(rule, index + 1, line.trim()));
          }
        });
      }
    }

    const deduped = this.deduplicateIssues(issues);
    const errors = deduped.filter((i) => i.severity === 'error').length;
    const warnings = deduped.filter((i) => i.severity === 'warning').length;
    const suggestions = deduped.filter(
      (i) => i.severity === 'suggestion' || i.severity === 'info',
    ).length;

    return {
      valid: errors === 0,
      issues: deduped,
      summary: { errors, warnings, suggestions },
    };
  }

  explainValidation(ruleId: string): {
    rule: ValidationRule | null;
    documentation: string | null;
  } {
    const rule = this.docsRepo.getRules().find((r) => r.id === ruleId || r.name === ruleId);
    const sourcePath = rule?.sourcePath ?? this.structuralRulePaths[ruleId];
    if (!sourcePath) return { rule: rule ?? null, documentation: null };

    const doc = this.docsRepo.getByPath(sourcePath);
    return {
      rule: rule ?? null,
      documentation: doc?.content ?? this.docsRepo.readFileContent(sourcePath),
    };
  }

  private readonly structuralRulePaths: Record<string, string> = {
    'code-quality': 'skills/unity-vrc-udon-sharp/rules/udonsharp-constraints.md',
    'sync-mode-missing': 'skills/unity-vrc-udon-sharp/rules/udonsharp-networking.md',
  };

  private ruleToIssue(rule: ValidationRule, line: number, code?: string): ValidationIssue {
    return {
      severity: rule.severity,
      message: rule.message,
      line,
      rule: rule.name,
      ruleId: rule.id,
      ...(rule.suggestion ? { suggestion: rule.suggestion } : {}),
      ...(code ? { code } : {}),
      sourcePath: rule.sourcePath,
      sourceLine: rule.sourceLine,
    };
  }

  private structuralIssue(
    message: string,
    suggestion: string,
    rule: string,
    sourcePath: string,
    sourceLine: number,
  ): ValidationIssue {
    return {
      severity: 'error',
      message,
      rule,
      ruleId: rule,
      suggestion,
      sourcePath,
      sourceLine,
    };
  }

  private deduplicateIssues(issues: ValidationIssue[]): ValidationIssue[] {
    const seen = new Set<string>();
    return issues.filter((issue) => {
      const key = `${issue.line}-${issue.message}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
