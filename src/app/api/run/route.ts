import { NextRequest, NextResponse } from "next/server";
import ts from "typescript";
import axios from "axios";

type RunResponse =
    | { mode: "text"; output: string }
    | { mode: "preview"; previewHtml: string; output?: string };

type RunFile = {
    _id?: string;
    name: string;
    language?: string;
    content?: string;
};

const normalize = (value: unknown) => String(value || "").toLowerCase();

/* -----------------------------
    Judge0 Execution
------------------------------ */
const executeWithJudge0 = async (language: string, code: string) => {
    const languageMap: Record<string, number> = {
        c: 50,
        cpp: 54,
        "c++": 54,
        java: 62,
        python: 71,
        py: 71,
        bash: 46,
        javascript: 63,
        js: 63,
        node: 63,
    };

    const language_id = languageMap[language];

    if (!language_id) {
        throw new Error("Unsupported language for Judge0.");
    }

    const response = await axios.post(
        "https://ce.judge0.com/submissions?base64_encoded=false&wait=true",
        {
            source_code: code,
            language_id,
        },
        {
            headers: {
                "Content-Type": "application/json",
            },
        }
    );

    const result = response.data;

    const output = result.stdout || result.stderr || result.compile_output || result.message || "No output";
    return output.trim();
};

    /* -----------------------------
    HTML Preview
    ------------------------------ */
    const buildHtmlPreview = (html: string, files: RunFile[]) => {
    const css = files
        .filter(
        (f) =>
            normalize(f.language) === "css" ||
            f.name.toLowerCase().endsWith(".css")
        )
        .map((f) => f.content || "")
        .join("\n");

    const js = files
        .filter((f) => {
        const lang = normalize(f.language);
        const lowerName = f.name.toLowerCase();
        return (
            lang === "javascript" ||
            lang === "js" ||
            lowerName.endsWith(".js")
        );
        })
        .map((f) => f.content || "")
        .join("\n");

    return `<!doctype html>
    <html>
    <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <style>${css}</style>
    </head>
    <body>
    ${html}
    <script>${js}</script>
    </body>
    </html>`;
    };

    /* -----------------------------
    CSS Preview
    ------------------------------ */
    const buildCssPreview = (css: string) => `<!doctype html>
    <html>
    <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <style>${css}</style>
    </head>
    <body>
    <main>
    <h1>CSS Preview</h1>
    <button>Button</button>
    <div>Card</div>
    </main>
    </body>
    </html>`;

    /* -----------------------------
    React Preview
    ------------------------------ */
    const buildReactPreview = (code: string, language: string) => {
    const presets =
        language === "tsx"
        ? "react,typescript"
        : language === "ts"
        ? "typescript"
        : "react";

    return `<!doctype html>
    <html>
    <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    </head>
    <body>
    <div id="root"></div>
    <script type="text/babel" data-presets="${presets}">
    ${code}

    const __maybeComponent =
    typeof App !== "undefined"
    ? App
    : (typeof defaultExport !== "undefined" ? defaultExport : null);

    if (__maybeComponent) {
    ReactDOM.createRoot(document.getElementById("root"))
    .render(React.createElement(__maybeComponent));
    }
    </script>
    </body>
    </html>`;
    };

    /* =============================
    MAIN ROUTE
    ============================= */
    export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const code = String(body?.code || "");
        const language = normalize(body?.language);
        const files: RunFile[] = Array.isArray(body?.files) ? body.files : [];

        if (!code.trim()) {
        return NextResponse.json<RunResponse>(
            { mode: "text", output: "No code to run." },
            { status: 400 }
        );
        }

        /* ---------- Preview Modes ---------- */

        if (language === "html") {
        return NextResponse.json<RunResponse>({
            mode: "preview",
            previewHtml: buildHtmlPreview(code, files),
            output: "Rendered HTML preview.",
        });
        }

        if (language === "css") {
        return NextResponse.json<RunResponse>({
            mode: "preview",
            previewHtml: buildCssPreview(code),
            output: "Rendered CSS preview.",
        });
        }

        if (["jsx", "tsx", "react"].includes(language)) {
        return NextResponse.json<RunResponse>({
            mode: "preview",
            previewHtml: buildReactPreview(code, language),
            output: "Rendered React preview.",
        });
        }

        /* ---------- TypeScript Support ---------- */

        if (language === "ts" || language === "typescript") {
        const transpiled = ts.transpileModule(code, {
            compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2020,
            },
        });

        const output = await executeWithJudge0(
            "javascript",
            transpiled.outputText
        );

        return NextResponse.json<RunResponse>({
            mode: "text",
            output,
        });
        }

        /* ---------- All Backend Languages ---------- */

        const supportedLanguages = [
        "c",
        "cpp",
        "c++",
        "java",
        "python",
        "py",
        "bash",
        "javascript",
        "js",
        "node",
        ];

        if (supportedLanguages.includes(language)) {
        const output = await executeWithJudge0(language, code);

        return NextResponse.json<RunResponse>({
            mode: "text",
            output,
        });
        }

        return NextResponse.json<RunResponse>(
        {
            mode: "text",
            output:
            "Unsupported language. Supported: C, C++, Java, JavaScript, TypeScript, Python, HTML, CSS, React.",
        },
        { status: 400 }
        );
    } catch (error) {
        const message =
        error instanceof Error ? error.message : "Execution failed.";

        return NextResponse.json<RunResponse>(
        { mode: "text", output: message },
        { status: 500 }
        );
    }
}