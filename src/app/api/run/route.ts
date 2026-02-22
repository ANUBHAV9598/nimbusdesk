import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { mkdtemp, rm, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import ts from "typescript";

type RunResponse =
    | { mode: "text"; output: string }
    | { mode: "preview"; previewHtml: string; output?: string };

type RunFile = {
    _id?: string;
    name: string;
    language?: string;
    content?: string;
};

const execCommand = (command: string, cwd: string) =>
    new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
        exec(
            command,
            { cwd, timeout: 15000, maxBuffer: 1024 * 1024 * 5 },
            (error, stdout, stderr) => {
                if (error) {
                    reject(new Error((stderr || error.message || "Execution failed").trim()));
                    return;
                }
                resolve({ stdout, stderr });
            }
        );
    });

const normalize = (value: unknown) => String(value || "").toLowerCase();

const buildHtmlPreview = (html: string, files: RunFile[]) => {
    const css = files
        .filter((f) => normalize(f.language) === "css" || f.name.toLowerCase().endsWith(".css"))
        .map((f) => f.content || "")
        .join("\n");

    const js = files
        .filter((f) => {
            const lang = normalize(f.language);
            const lowerName = f.name.toLowerCase();
            return (
                lang === "javascript" ||
                lang === "js" ||
                lowerName.endsWith(".js") ||
                lowerName.endsWith(".mjs")
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

const buildCssPreview = (css: string) => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <style>${css}</style>
  </head>
  <body>
    <main class="demo">
      <h1>CSS Preview</h1>
      <p>Edit styles and click Run.</p>
      <button>Button</button>
      <div class="card">Card</div>
    </main>
  </body>
</html>`;

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
    <style>body{font-family:system-ui;padding:12px;margin:0}</style>
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
  ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(__maybeComponent));
} else if (typeof Component !== "undefined") {
  ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(Component));
}
    </script>
  </body>
</html>`;
};

export async function POST(req: NextRequest) {
    let tempDir = "";

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
                previewHtml: buildReactPreview(code, language === "react" ? "jsx" : language),
                output:
                    "Rendered React preview. Define App/Component (or defaultExport) to mount automatically.",
            });
        }

        tempDir = await mkdtemp(path.join(os.tmpdir(), "cloud-editor-"));

        if (["javascript", "js", "node", "nodejs", "mjs", "cjs"].includes(language)) {
            const filePath = path.join(tempDir, "main.js");
            await writeFile(filePath, code, "utf8");
            const { stdout } = await execCommand(`node "${filePath}"`, tempDir);
            return NextResponse.json<RunResponse>({
                mode: "text",
                output: stdout.trim() || "No output",
            });
        }

        if (["typescript", "ts"].includes(language)) {
            const transpiled = ts.transpileModule(code, {
                compilerOptions: {
                    module: ts.ModuleKind.CommonJS,
                    target: ts.ScriptTarget.ES2020,
                    esModuleInterop: true,
                },
            });

            const filePath = path.join(tempDir, "main.js");
            await writeFile(filePath, transpiled.outputText, "utf8");
            const { stdout } = await execCommand(`node "${filePath}"`, tempDir);
            return NextResponse.json<RunResponse>({
                mode: "text",
                output: stdout.trim() || "No output",
            });
        }

        if (["python", "py"].includes(language)) {
            const filePath = path.join(tempDir, "main.py");
            await writeFile(filePath, code, "utf8");
            const { stdout } = await execCommand(`python "${filePath}"`, tempDir);
            return NextResponse.json<RunResponse>({
                mode: "text",
                output: stdout.trim() || "No output",
            });
        }

        if (["cpp", "c++", "cc", "cxx"].includes(language)) {
            const filePath = path.join(tempDir, "main.cpp");
            const binaryPath = path.join(tempDir, process.platform === "win32" ? "main.exe" : "main");
            await writeFile(filePath, code, "utf8");
            await execCommand(`g++ "${filePath}" -o "${binaryPath}"`, tempDir);
            const runCmd = process.platform === "win32" ? `"${binaryPath}"` : `./${path.basename(binaryPath)}`;
            const { stdout } = await execCommand(runCmd, tempDir);
            return NextResponse.json<RunResponse>({
                mode: "text",
                output: stdout.trim() || "No output",
            });
        }

        if (language === "java") {
            const filePath = path.join(tempDir, "Main.java");
            await writeFile(filePath, code, "utf8");
            await execCommand(`javac "${filePath}"`, tempDir);
            const { stdout } = await execCommand(`java -cp "${tempDir}" Main`, tempDir);
            return NextResponse.json<RunResponse>({
                mode: "text",
                output: stdout.trim() || "No output",
            });
        }

        return NextResponse.json<RunResponse>(
            {
                mode: "text",
                output:
                    "Unsupported language. Supported: C++, Java, JavaScript, TypeScript, Python, HTML, CSS, React (JSX/TSX).",
            },
            { status: 400 }
        );
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : "Execution failed. Ensure the required runtime/compiler is installed.";

        return NextResponse.json<RunResponse>({ mode: "text", output: message }, { status: 500 });
    } finally {
        if (tempDir) {
            await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
        }
    }
}
