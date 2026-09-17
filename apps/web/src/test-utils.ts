export interface TestSummary {
  skill: string;
  passed: number;
  failed: number;
}

export function assertCase(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

export function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) throw new Error(`${message}; expected ${String(expected)}, received ${String(actual)}`);
}

export function runCases(skill: string, cases: Array<() => void>): TestSummary {
  let passed = 0;
  const failures: string[] = [];
  cases.forEach((test, index) => {
    try {
      test();
      passed += 1;
    } catch (error) {
      failures.push(`case ${index + 1}: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  if (failures.length > 0) throw new Error(`${skill} self-tests failed\n${failures.join("\n")}`);
  return { skill, passed, failed: 0 };
}

export async function runCasesAsync(skill: string, cases: Array<() => void | Promise<void>>): Promise<TestSummary> {
  let passed = 0;
  const failures: string[] = [];
  for (const [index, test] of cases.entries()) {
    try {
      await test();
      passed += 1;
    } catch (error) {
      failures.push(`case ${index + 1}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (failures.length > 0) throw new Error(`${skill} self-tests failed\n${failures.join("\n")}`);
  return { skill, passed, failed: 0 };
}
