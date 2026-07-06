"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const CDN = {
  react: "https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js",
  reactDom:
    "https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.production.min.js",
  babel: "https://cdn.jsdelivr.net/npm/@babel/standalone@7.26.4/babel.min.js",
};

function escapeForScriptTag(code: string): string {
  return code.replace(/<\/(script)/gi, "<\\/$1");
}

function buildSrcDoc(code: string, dataJson: string, nonce: string): string {
  const escapedCode = escapeForScriptTag(code);
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'unsafe-inline'; img-src data: https:; font-src https:; connect-src 'none'" />
<style>
  html, body { margin: 0; padding: 0; background: transparent; }
  body { color: #ededea; font-family: ui-sans-serif, system-ui, sans-serif; }
  #root { padding: 2px; }
  .sbx-error { color: #e5b567; font: 13px ui-sans-serif, system-ui; padding: 8px; }
</style>
<script src="${CDN.react}"></script>
<script src="${CDN.reactDom}"></script>
<script src="${CDN.babel}"></script>
</head>
<body>
<div id="root"></div>
<script id="user-code" type="text/plain">${escapedCode}</script>
<script>
(function () {
  var NONCE = ${JSON.stringify(nonce)};
  var DATA = ${dataJson};
  function report(m) { try { m.nonce = NONCE; parent.postMessage(m, "*"); } catch (e) {} }
  function reportHeight() {
    try {
      var h = Math.max(
        document.documentElement.scrollHeight,
        document.body ? document.body.scrollHeight : 0
      );
      report({ type: "resize", height: h });
    } catch (e) {}
  }
  function fail(msg) {
    var r = document.getElementById("root");
    if (r) r.innerHTML = '<div class="sbx-error">Unable to render this interactive view.</div>';
    report({ type: "error", message: String(msg) });
    reportHeight();
  }
  function run() {
    try {
      if (!window.React || !window.ReactDOM || !window.Babel) {
        throw new Error("runtime failed to load");
      }
      var React = window.React, ReactDOM = window.ReactDOM;
      var src = document.getElementById("user-code").textContent;
      var pre = "var {useState,useEffect,useMemo,useRef,useCallback,useReducer}=React;\\n";
      var post = "\\nreturn (typeof Widget!=='undefined')?Widget:((typeof App!=='undefined')?App:null);";
      var out = window.Babel.transform(pre + src + post, { presets: ["react"], parserOpts: { allowReturnOutsideFunction: true } }).code;
      var factory = new Function("React", "ReactDOM", out);
      var Comp = factory(React, ReactDOM);
      if (!Comp) throw new Error("no component named Widget");
      function EB(props) { return props.children; }
      var Boundary = (function () {
        function B(p) { React.Component.call(this, p); this.state = { e: null }; }
        B.prototype = Object.create(React.Component.prototype);
        B.getDerivedStateFromError = function (e) { return { e: e }; };
        B.prototype.componentDidCatch = function (e) { report({ type: "error", message: String(e && e.message || e) }); };
        B.prototype.render = function () {
          if (this.state.e) return React.createElement("div", { className: "sbx-error" }, "Unable to render this interactive view.");
          return React.createElement(Comp, { data: DATA });
        };
        return B;
      })();
      var root = ReactDOM.createRoot(document.getElementById("root"));
      root.render(React.createElement(Boundary));
      report({ type: "ready" });
      setTimeout(reportHeight, 30);
      setTimeout(reportHeight, 250);
      setTimeout(reportHeight, 800);
      if (window.ResizeObserver) {
        new ResizeObserver(reportHeight).observe(document.documentElement);
      }
    } catch (e) {
      fail(e && e.message ? e.message : e);
    }
  }
  if (document.readyState !== "loading") run();
  else document.addEventListener("DOMContentLoaded", run);
})();
</script>
</body>
</html>`;
}

export function ReactArtifactSandbox({
  code,
  data,
  title,
}: {
  code: string;
  data?: unknown;
  title?: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const nonceRef = useRef<string>(
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2),
  );
  const [height, setHeight] = useState(140);
  const [error, setError] = useState<string | null>(null);

  const srcDoc = useMemo(() => {
    if (!code) return "";
    const dataJson = JSON.stringify(data ?? null).replace(/</g, "\\u003c");
    return buildSrcDoc(code, dataJson, nonceRef.current);
  }, [code, data]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const frame = iframeRef.current;
      if (!frame || event.source !== frame.contentWindow) return;
      const d = event.data as {
        nonce?: string;
        type?: string;
        height?: number;
        message?: string;
      };
      if (!d || d.nonce !== nonceRef.current) return;
      if (d.type === "resize" && typeof d.height === "number") {
        setHeight(Math.min(Math.max(d.height, 40), 2400));
      } else if (d.type === "error") {
        setError(String(d.message ?? "error"));
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  if (!code) {
    return (
      <div
        data-testid="react-skeleton"
        className="my-3 rounded-md border border-line bg-black/40 p-4 text-xs text-muted"
      >
        Preparing interactive view…
      </div>
    );
  }

  return (
    <div className="my-3">
      <div className="mb-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
        <span className="rounded border border-line px-1.5 py-0.5 text-accent">
          Interactive · sandboxed
        </span>
        {title ? <span>{title}</span> : null}
      </div>
      <iframe
        ref={iframeRef}
        data-testid="react-frame"
        title={title ?? "interactive widget"}
        srcDoc={srcDoc}
        sandbox="allow-scripts"
        style={{ width: "100%", height }}
        className="block rounded-md border border-line bg-black/40"
      />
      {error ? (
        <p className="mt-1 font-mono text-[11px] text-accent">
          Widget error — {error}
        </p>
      ) : null}
    </div>
  );
}
