import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/getUser";

type DebugPayload = {
    code?: string;
    language?: string;
    error?: string;
    fileName?: string;
};

type DebugResult = {
    advice: string;
    correctedCode: string | null;
};

const extractFirstCodeBlock = (text: string) => {
    const match = text.match(/```[a-zA-Z0-9]*\n([\s\S]*?)```/);
    return match?.[1]?.trim() || null;
};

const buildHeuristicAdvice = ({ code, language, error, fileName }: Required<DebugPayload>) => {
    const suggestions: string[] = [];
    const lowerError = error.toLowerCase();
    const lowerCode = code.toLowerCase();

    if (lowerError.includes("module not found")) {
        suggestions.push(
            "Root cause: Missing import or dependency.",
            "Fix: Verify the import path and install missing package."
        );
    }

    if (lowerError.includes("syntaxerror")) {
        suggestions.push(
            "Root cause: Invalid syntax in the current file.",
            "Fix: Check brackets, commas, and function declarations near the reported line."
        );
    }

    if (lowerError.includes("undefined") || lowerError.includes("is not defined")) {
        suggestions.push(
            "Root cause: A variable/function is referenced before declaration or misspelled.",
            "Fix: Ensure the symbol exists in scope and spelling matches exactly."
        );
    }

    if (language === "typescript" || language === "ts") {
        if (lowerError.includes("type")) {
            suggestions.push(
                "TypeScript hint: Add explicit types for function params/returns and narrow union values before use."
            );
        }
    }

    if (language === "python" || language === "py") {
        if (lowerError.includes("indentationerror")) {
            suggestions.push("Python hint: Use consistent indentation (4 spaces, no mixed tabs/spaces).");
        }
    }

    if (language === "java") {
        if (!lowerCode.includes("class main")) {
            suggestions.push(
                "Java hint: Ensure your entry class is `Main` and includes `public static void main(String[] args)`."
            );
        }
    }

    if (suggestions.length === 0) {
        suggestions.push(
            "Root cause was not detected heuristically.",
            "Fix strategy:",
            "1. Read the first error line and file/line number.",
            "2. Isolate the smallest failing statement.",
            "3. Re-run after each small change."
        );
    }

    return [
        "AI Debug Assistant (Local Fallback)",
        `File: ${fileName || "current file"}`,
        `Language: ${language || "unknown"}`,
        "",
        ...suggestions,
    ].join("\n");
};

const buildHeuristicResult = (payload: Required<DebugPayload>): DebugResult => ({
    advice: buildHeuristicAdvice(payload),
    correctedCode: null,
});

const callGemini = async ({ code, language, error, fileName }: Required<DebugPayload>) => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) return null;

    try {
        // Dynamic import keeps build stable even if package isn't installed yet.
        const pkgName = "@google/generative-ai";
        const mod = await import(pkgName);
        const GoogleGenerativeAI = mod?.GoogleGenerativeAI;
        if (!GoogleGenerativeAI) return null;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = [
            "You are a senior debugging agent for an online IDE.",
            "Return ONLY valid JSON with keys:",
            '{"rootCause":"string","minimalFixSteps":["step1","step2"],"correctedCode":"string"}',
            "No markdown, no code fences, no extra keys.",
            "",
            `File: ${fileName || "unknown"}`,
            `Language: ${language || "unknown"}`,
            "Error Output:",
            error || "No runtime error provided",
            "",
            "Code:",
            code || "",
        ].join("\n");

        const result = await model.generateContent(prompt);
        const text = result?.response?.text?.()?.trim();
        if (!text) return null;

        try {
            const parsed = JSON.parse(text);
            const rootCause = String(parsed?.rootCause || "Not specified");
            const steps = Array.isArray(parsed?.minimalFixSteps)
                ? parsed.minimalFixSteps.map((s: unknown) => `- ${String(s)}`)
                : [];
            const correctedCode = String(parsed?.correctedCode || "").trim() || null;

            return {
                advice: [
                    "AI Debug Assistant (Gemini)",
                    "",
                    `Root Cause: ${rootCause}`,
                    "",
                    "Minimal Fix Steps:",
                    ...(steps.length ? steps : ["- No steps provided"]),
                ].join("\n"),
                correctedCode,
            } satisfies DebugResult;
        } catch {
            return {
                advice: text,
                correctedCode: extractFirstCodeBlock(text),
            } satisfies DebugResult;
        }
    } catch {
        return null;
    }
};

const callOpenAI = async ({ code, language, error, fileName }: Required<DebugPayload>) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;
    try {
        const system = [
            "You are a senior debugging agent for an online IDE.",
            "Return ONLY valid JSON with keys:",
            '{"rootCause":"string","minimalFixSteps":["step1","step2"],"correctedCode":"string"}',
            "No markdown, no code fences, no extra keys.",
        ].join(" ");

        const user = [
            `File: ${fileName || "unknown"}`,
            `Language: ${language || "unknown"}`,
            "Error Output:",
            error || "No runtime error provided",
            "",
            "Code:",
            code || "",
        ].join("\n");

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: system },
                    { role: "user", content: user },
                ],
                temperature: 0.2,
            }),
        });

        if (!response.ok) return null;
        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (!text) return null;

        try {
            const parsed = JSON.parse(text);
            const rootCause = String(parsed?.rootCause || "Not specified");
            const steps = Array.isArray(parsed?.minimalFixSteps)
                ? parsed.minimalFixSteps.map((s: unknown) => `- ${String(s)}`)
                : [];
            const correctedCode = String(parsed?.correctedCode || "").trim() || null;

            return {
                advice: [
                    "AI Debug Assistant (OpenAI)",
                    "",
                    `Root Cause: ${rootCause}`,
                    "",
                    "Minimal Fix Steps:",
                    ...(steps.length ? steps : ["- No steps provided"]),
                ].join("\n"),
                correctedCode,
            } satisfies DebugResult;
        } catch {
            return {
                advice: text,
                correctedCode: extractFirstCodeBlock(text),
            } satisfies DebugResult;
        }
    } catch {
        return null;
    }
};

export async function POST(req: NextRequest) {
    try {
        getUserFromRequest(req);

        const body = (await req.json()) as DebugPayload;
        const payload: Required<DebugPayload> = {
            code: String(body.code || ""),
            language: String(body.language || ""),
            error: String(body.error || ""),
            fileName: String(body.fileName || ""),
        };

        if (!payload.code.trim()) {
            return NextResponse.json({ message: "Code is required." }, { status: 400 });
        }

        const geminiResult = await callGemini(payload);
        const openAiResult = geminiResult ? null : await callOpenAI(payload);
        const aiResult = geminiResult || openAiResult;
        const fallback = buildHeuristicResult(payload);
        const result = aiResult || fallback;

        return NextResponse.json({
            success: true,
            advice: result.advice,
            correctedCode: result.correctedCode,
            source: geminiResult ? "gemini" : openAiResult ? "openai" : "local",
        });
    } catch {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
}
