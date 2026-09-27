export function assertCase(condition, message) {
    if (!condition)
        throw new Error(message);
}
export function assertEqual(actual, expected, message) {
    if (actual !== expected)
        throw new Error(`${message}; expected ${String(expected)}, received ${String(actual)}`);
}
export function runCases(skill, cases) {
    let passed = 0;
    const failures = [];
    cases.forEach((test, index) => {
        try {
            test();
            passed += 1;
        }
        catch (error) {
            failures.push(`case ${index + 1}: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    if (failures.length > 0)
        throw new Error(`${skill} self-tests failed\n${failures.join("\n")}`);
    return { skill, passed, failed: 0 };
}
export async function runCasesAsync(skill, cases) {
    let passed = 0;
    const failures = [];
    for (const [index, test] of cases.entries()) {
        try {
            await test();
            passed += 1;
        }
        catch (error) {
            failures.push(`case ${index + 1}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    if (failures.length > 0)
        throw new Error(`${skill} self-tests failed\n${failures.join("\n")}`);
    return { skill, passed, failed: 0 };
}
