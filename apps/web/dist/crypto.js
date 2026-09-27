import { createHash } from "node:crypto";
export function stableStringify(value) {
    if (value === null || typeof value !== "object")
        return JSON.stringify(value);
    if (Array.isArray(value))
        return `[${value.map(stableStringify).join(",")}]`;
    const object = value;
    return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(object[key])}`).join(",")}}`;
}
export function sha256(value) {
    return createHash("sha256").update(typeof value === "string" ? value : stableStringify(value)).digest("hex");
}
export function deterministicId(prefix, value) {
    return `${prefix}_${sha256(value).slice(0, 12)}`;
}
export function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
}
