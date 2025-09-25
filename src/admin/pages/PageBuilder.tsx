import React, { useEffect } from "react";

const LayoutEditor = () => {
  useEffect(() => {

    // Load your stylesheet
    const css = document.createElement("link");
    css.rel = "stylesheet";
    // use the same stylesheet path as the public page
    css.href = "/style/page-layout-editor.css"; // served from /public
    document.head.appendChild(css);

    // Load your custom JS AFTER DOM exists
    const script = document.createElement("script");
    script.src = "/scripts/page-layout-JS-functions.js"; // served from /public
    script.async = false; // preserve execution order
    script.onload = () => {
      try {
        // If the script defines a global LayoutBuilder (it does in the public file),
        // instantiate it directly because the DOMContentLoaded event already fired in the admin SPA.
        // Prevent double-instantiation by checking a marker.
        const win: any = window;
        // First, if the page-layout script registered a DOMContentLoaded listener
        // we can trigger it by dispatching a synthetic event. The script registers
        // its listener during evaluation, so dispatching here will call it.
        try {
          if (document.readyState !== 'loading') {
            // Dispatching DOMContentLoaded manually lets the embedded script
            // run its initialization block even in an already-loaded SPA.
            document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true, cancelable: true }));
          }
        } catch (e) {
          // ignore
        }

        // As a fallback, if that didn't initialize a builder, create one directly.
        if (win && win.LayoutBuilder && !win.__layoutBuilderInstance) {
          win.__layoutBuilderInstance = new win.LayoutBuilder();
        }
      } catch (e) {
        // ignore
        console.error('Failed to init LayoutBuilder after script load', e);
      }
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup if component unmounts
      document.head.removeChild(css);
      try {
        document.body.removeChild(script);
      } catch (e) {}
    };
  }, []);

  return (
    <div className="app-container">
        <h1 className="app-title">Structured Layout Builder</h1>
        <p className="app-desc">Create components with identifiers, build hierarchical layouts with named containers, and export the complete structure as JSON.</p>

        <div className="main-grid">

            <div>
                <div className="panel components-panel">
                    <h2>Components</h2>
                    <div className="mb-6">
                        <div className="compact-row">
                            <input type="text" id="new-component-id" placeholder="Component ID" className="component-id-input"/>
                            <button id="add-component-btn" className="btn btn-purple">Add</button>
                        </div>
                    </div>

                    <div id="components-list">
                        <div className="drop-zone" id="components-drop-zone">Drag components back here or add new ones above</div>
                    </div>
                </div>

                <div style={{ height: "16px" }}></div>

                <div className="panel">
                    <h3>Export</h3>
                    <button id="export-btn" className="btn btn-green btn-block">Export JSON Structure</button>
                    <div id="json-output" className="json-output hidden" style={{ marginTop: "12px" }}></div>
                </div>

                <div style={{ height: "12px" }}></div>

                <div className="panel">
                    <h3>Import</h3>
                    <textarea
                      id="json-input"
                      placeholder="Paste JSON structure here..."
                      style={{
                        width: "100%",
                        height: "120px",
                        padding: "8px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        fontFamily: "monospace"
                      }}
                    ></textarea>
                    <button id="import-btn" className="btn btn-blue btn-block" style={{ marginTop: "10px" }}>Load Layout from JSON</button>
                </div>
            </div>

            <div>
                <div className="panel builder-panel">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <h2 style={{ margin: 0 }}>Layout Builder</h2>
                        <button id="add-root-div-btn" className="btn btn-blue">+ Add Root Div</button>
                    </div>

                    <div id="root-layout" className="root-layout">
                        <div className="drop-zone">Click "Add Root Div" to start building your layout</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default LayoutEditor;
