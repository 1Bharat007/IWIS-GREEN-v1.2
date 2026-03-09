module.exports = [
"[project]/iwis/frontend/lib/api.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "apiFetch",
    ()=>apiFetch
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$iwis$2f$frontend$2f$lib$2f$session$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/iwis/frontend/lib/session.ts [app-ssr] (ecmascript)");
;
const BASE_URL = "http://localhost:5000/api";
async function apiFetch(endpoint, options = {}) {
    const token = (0, __TURBOPACK__imported__module__$5b$project$5d2f$iwis$2f$frontend$2f$lib$2f$session$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getToken"])();
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...token && {
                    Authorization: `Bearer ${token}`
                },
                ...options.headers || {}
            }
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || "Request failed");
        }
        return await response.json();
    } catch (error) {
        console.error("API ERROR:", error);
        throw new Error("Failed to connect to backend");
    }
}
}),
"[project]/iwis/frontend/app/scan/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ScanPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$iwis$2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/iwis/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$iwis$2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/iwis/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$iwis$2f$frontend$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/iwis/frontend/lib/api.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
function ScanPage() {
    const [result, setResult] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$iwis$2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$iwis$2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const handleUpload = async (file)=>{
        const reader = new FileReader();
        reader.onloadend = async ()=>{
            setLoading(true);
            setResult(null);
            const base64 = reader.result;
            // Simulated AI processing delay
            await new Promise((res)=>setTimeout(res, 2000));
            try {
                const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$iwis$2f$frontend$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["apiFetch"])("/waste/scan", {
                    method: "POST",
                    body: JSON.stringify({
                        image: base64
                    })
                });
                setResult(data);
            } catch (err) {
                console.error(err);
            } finally{
                setLoading(false);
            }
        };
        reader.readAsDataURL(file);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$iwis$2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "max-w-xl mx-auto space-y-8",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$iwis$2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                className: "text-3xl font-semibold",
                children: "Smart Waste Scanner"
            }, void 0, false, {
                fileName: "[project]/iwis/frontend/app/scan/page.tsx",
                lineNumber: 41,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$iwis$2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-sm text-[var(--muted)]",
                children: "Upload an image of waste material. Our AI analyzes category, environmental impact, and gives smart recycling tips."
            }, void 0, false, {
                fileName: "[project]/iwis/frontend/app/scan/page.tsx",
                lineNumber: 43,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$iwis$2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                className: "cursor-pointer px-6 py-3 border border-[var(--border)] rounded-lg  bg-[var(--card)] hover:bg-neutral-200 dark:hover:bg-neutral-800  transition text-sm inline-block",
                children: [
                    "Upload Image",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$iwis$2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "file",
                        className: "hidden",
                        accept: "image/*",
                        onChange: (e)=>{
                            const file = e.target.files?.[0];
                            if (file) handleUpload(file);
                        }
                    }, void 0, false, {
                        fileName: "[project]/iwis/frontend/app/scan/page.tsx",
                        lineNumber: 52,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/iwis/frontend/app/scan/page.tsx",
                lineNumber: 48,
                columnNumber: 7
            }, this),
            loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$iwis$2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-sm text-[var(--muted)] animate-pulse",
                children: "🔍 Analyzing image with AI..."
            }, void 0, false, {
                fileName: "[project]/iwis/frontend/app/scan/page.tsx",
                lineNumber: 64,
                columnNumber: 9
            }, this),
            result && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$iwis$2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "p-6 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-4 transition-all duration-500 animate-fadeIn",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$iwis$2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xl font-semibold",
                        children: result.category
                    }, void 0, false, {
                        fileName: "[project]/iwis/frontend/app/scan/page.tsx",
                        lineNumber: 71,
                        columnNumber: 5
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$iwis$2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$iwis$2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "h-2 bg-neutral-900 dark:bg-white rounded-full transition-all duration-700",
                            style: {
                                width: `${result.confidence}%`
                            }
                        }, void 0, false, {
                            fileName: "[project]/iwis/frontend/app/scan/page.tsx",
                            lineNumber: 74,
                            columnNumber: 7
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/iwis/frontend/app/scan/page.tsx",
                        lineNumber: 73,
                        columnNumber: 5
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$iwis$2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-[var(--muted)]",
                        children: [
                            "Confidence: ",
                            result.confidence,
                            "%"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/iwis/frontend/app/scan/page.tsx",
                        lineNumber: 80,
                        columnNumber: 5
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$iwis$2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-[var(--muted)]",
                        children: [
                            "CO₂ Impact: ",
                            result.co2,
                            " kg"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/iwis/frontend/app/scan/page.tsx",
                        lineNumber: 84,
                        columnNumber: 5
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$iwis$2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "pt-4 border-t border-[var(--border)] text-sm text-[var(--muted)]",
                        children: [
                            "💡 ",
                            result.smartTip
                        ]
                    }, void 0, true, {
                        fileName: "[project]/iwis/frontend/app/scan/page.tsx",
                        lineNumber: 88,
                        columnNumber: 5
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/iwis/frontend/app/scan/page.tsx",
                lineNumber: 70,
                columnNumber: 3
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/iwis/frontend/app/scan/page.tsx",
        lineNumber: 40,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=iwis_frontend_29bcc161._.js.map