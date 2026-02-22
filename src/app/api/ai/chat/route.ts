import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/getUser";

type ChatPayload = {
    message?: string;
    code?: string;
    language?: string;
    fileName?: string;
    output?: string;
};

const ensureCodeBlock = (text: string, language: string) => {
    const trimmed = text.trim();
    if (trimmed.includes("```")) return trimmed;
    const lang = detectLanguage(language);
    return ["```" + lang, trimmed, "```"].join("\n");
};

const detectLanguage = (language: string) => {
    const l = language.toLowerCase();
    if (["js", "javascript", "node", "nodejs"].includes(l)) return "javascript";
    if (["ts", "typescript"].includes(l)) return "typescript";
    if (["py", "python"].includes(l)) return "python";
    if (["cpp", "c++", "cc", "cxx"].includes(l)) return "cpp";
    if (["java"].includes(l)) return "java";
    return l || "javascript";
};

const detectLanguageFromPrompt = (message: string, fallback: string) => {
    const m = message.toLowerCase();
    if (m.includes("c++") || m.includes(" cpp")) return "cpp";
    if (m.includes("javascript") || m.includes(" java script") || m.includes(" js")) return "javascript";
    if (m.includes("typescript") || m.includes(" ts")) return "typescript";
    if (m.includes("python") || m.includes(" py")) return "python";
    if (m.includes("java")) return "java";
    if (m.includes("c language") || m.includes(" in c")) return "c";
    return detectLanguage(fallback);
};

const reverseNumberTemplate = (lang: string) => {
    switch (lang) {
        case "typescript":
            return [
                "```ts",
                "function reverseNumber(n: number): number {",
                "  const sign = n < 0 ? -1 : 1;",
                "  const reversed = Number(String(Math.abs(n)).split('').reverse().join(''));",
                "  return sign * reversed;",
                "}",
                "",
                "console.log(reverseNumber(12345)); // 54321",
                "console.log(reverseNumber(-902));  // -209",
                "```",
            ].join("\n");
        case "python":
            return [
                "```python",
                "def reverse_number(n: int) -> int:",
                "    sign = -1 if n < 0 else 1",
                "    reversed_num = int(str(abs(n))[::-1])",
                "    return sign * reversed_num",
                "",
                "print(reverse_number(12345))  # 54321",
                "print(reverse_number(-902))   # -209",
                "```",
            ].join("\n");
        default:
            return [
                "```javascript",
                "function reverseNumber(n) {",
                "  const sign = n < 0 ? -1 : 1;",
                "  const reversed = Number(String(Math.abs(n)).split('').reverse().join(''));",
                "  return sign * reversed;",
                "}",
                "",
                "console.log(reverseNumber(12345)); // 54321",
                "console.log(reverseNumber(-902));  // -209",
                "```",
            ].join("\n");
    }
};

const reverseStringTemplate = (lang: string) => {
    switch (lang) {
        case "cpp":
            return [
                "```cpp",
                "#include <iostream>",
                "#include <algorithm>",
                "#include <string>",
                "using namespace std;",
                "",
                "int main() {",
                "    string s;",
                "    getline(cin, s);",
                "    reverse(s.begin(), s.end());",
                "    cout << s << endl;",
                "    return 0;",
                "}",
                "```",
            ].join("\n");
        case "java":
            return [
                "```java",
                "import java.util.*;",
                "",
                "public class Main {",
                "    public static void main(String[] args) {",
                "        Scanner sc = new Scanner(System.in);",
                "        String s = sc.nextLine();",
                "        String reversed = new StringBuilder(s).reverse().toString();",
                "        System.out.println(reversed);",
                "    }",
                "}",
                "```",
            ].join("\n");
        case "python":
            return [
                "```python",
                "s = input()",
                "print(s[::-1])",
                "```",
            ].join("\n");
        case "typescript":
            return [
                "```ts",
                "function reverseString(s: string): string {",
                "  return s.split('').reverse().join('');",
                "}",
                "",
                "console.log(reverseString('nimbus')); // submin",
                "```",
            ].join("\n");
        default:
            return [
                "```javascript",
                "function reverseString(s) {",
                "  return s.split('').reverse().join('');",
                "}",
                "",
                "console.log(reverseString('nimbus')); // submin",
                "```",
            ].join("\n");
    }
};

const fallbackReply = (payload: Required<ChatPayload>) => {
    const prompt = payload.message.toLowerCase();
    const lang = detectLanguageFromPrompt(payload.message, payload.language);
    const wantsReverse =
        prompt.includes("reverse") ||
        prompt.includes("reverese") ||
        prompt.includes("revrese") ||
        prompt.includes("revrse");
    const wantsString = prompt.includes("string");
    const wantsNumber = prompt.includes("number");
    const asksForCode =
        prompt.includes("code") ||
        prompt.includes("program") ||
        prompt.includes("solution") ||
        prompt.includes("write");

    if (wantsReverse && wantsString) {
        return reverseStringTemplate(lang);
    }

    if (wantsReverse && (wantsNumber || asksForCode)) {
        return reverseNumberTemplate(lang);
    }

    if (
        prompt.includes("error") ||
        prompt.includes("exception") ||
        payload.output.toLowerCase().includes("error")
    ) {
        return [
            "I found an error context. Use this debug checklist now:",
            "1) Read the first error line and exact file:line.",
            "2) Fix syntax/import/scope issue at that line first.",
            "3) Re-run and handle the next error only after first is resolved.",
            "",
            "Quick template fix (JavaScript):",
            "```javascript",
            "// Ensure function is declared before use",
            "function solve(input) {",
            "  // your logic",
            "  return input;",
            "}",
            "",
            "console.log(solve(123));",
            "```",
            "",
            `Latest output/error seen: ${payload.output || "N/A"}`,
        ].join("\n");
    }

    if (prompt.includes("optimiz") || prompt.includes("performance")) {
        return [
            "Performance review steps:",
            "- Measure hot paths first.",
            "- Avoid repeated expensive operations inside loops.",
            "- Cache derived values and reduce unnecessary renders/allocations.",
        ].join("\n");
    }

    return [
        "```" + lang,
        "// Ask a direct prompt like:",
        "// \"Write reverse string program in C++\"",
        "// \"Fix this runtime error: ...\"",
        "```",
    ].join("\n");
};

const callGemini = async (payload: Required<ChatPayload>) => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) return null;

    try {
        const mod = await import("@google/generative-ai");
        const GoogleGenerativeAI = mod?.GoogleGenerativeAI;
        if (!GoogleGenerativeAI) return null;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = [
            "You are NimbusDesk AI coding assistant.",
            "Provide concise, practical coding help.",
            "ALWAYS include a runnable code solution when user asks to write/solve code.",
            "If user shares an error, provide corrected code and explain root cause briefly.",
            "Use markdown code blocks.",
            "",
            `User message: ${payload.message}`,
            `File: ${payload.fileName || "unknown"}`,
            `Language: ${payload.language || "unknown"}`,
            "Latest output/error:",
            payload.output || "No output provided",
            "",
            "Current code:",
            payload.code || "",
        ].join("\n");

        const result = await model.generateContent(prompt);
        return result?.response?.text?.()?.trim() || null;
    } catch {
        return null;
    }
};

const callOpenAI = async (payload: Required<ChatPayload>) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                temperature: 0.3,
                messages: [
                    {
                        role: "system",
                        content:
                            "You are NimbusDesk AI coding assistant. Always provide runnable code for solve/write prompts and corrected code for errors.",
                    },
                    {
                        role: "user",
                        content: [
                            `User message: ${payload.message}`,
                            `File: ${payload.fileName || "unknown"}`,
                            `Language: ${payload.language || "unknown"}`,
                            "Latest output/error:",
                            payload.output || "No output provided",
                            "",
                            "Current code:",
                            payload.code || "",
                        ].join("\n"),
                    },
                ],
            }),
        });

        if (!response.ok) return null;
        const data = await response.json();
        return data?.choices?.[0]?.message?.content?.trim() || null;
    } catch {
        return null;
    }
};

export async function POST(req: NextRequest) {
    try {
        getUserFromRequest(req);

        const body = (await req.json()) as ChatPayload;
        const payload: Required<ChatPayload> = {
            message: String(body.message || ""),
            code: String(body.code || ""),
            language: String(body.language || ""),
            fileName: String(body.fileName || ""),
            output: String(body.output || ""),
        };

        if (!payload.message.trim()) {
            return NextResponse.json({ message: "Message is required." }, { status: 400 });
        }

        const geminiReply = await callGemini(payload);
        const openAiReply = geminiReply ? null : await callOpenAI(payload);
        const rawReply = geminiReply || openAiReply || fallbackReply(payload);
        const reply = ensureCodeBlock(rawReply, payload.language);

        return NextResponse.json({
            success: true,
            reply,
            source: geminiReply ? "gemini" : openAiReply ? "openai" : "local",
        });
    } catch {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
}
