import React from "react";
import { Button } from "@strapi/design-system";

/**
 * Simple inline icon to avoid @strapi/icons TypeScript friction
 */
const PencilIcon = (props: any) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...props} fill="currentColor">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41L18.37 3.29a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
  </svg>
);

const PageBuilderPage = () => (
  <div style={{ padding: 24 }}>
    <h1>Page Builder</h1>
    <p>This is a standalone Page Builder page 🎉</p>
  </div>
);


function buildManagerUrl(documentId?: string) {
    ///plugins/page-builder
    const base = `/admin/plugins/page-builder${documentId ? '?documentId=' + encodeURIComponent(documentId) : ''}`;
  return base;
}



export default {
  register(app: any) {
    // sidebar menu link (keep in register)
    // app.addMenuLink({
    //   to: "/plugins/page-builder",
    //   icon: PencilIcon,
    //   intlLabel: { id: "page-builder.label", defaultMessage: "Page Builder" },
    //   Component: PageBuilderPage,
    //   permissions: [],
    // });

    // Register a hidden route only (no menu link)
    app.addMenuLink({
      to: "/plugins/page-builder",
      icon: PencilIcon,
      intlLabel: {
        id: "page-builder.label",
        defaultMessage: "Page Builder",
      },
      // Lazy load the page
      Component: async () => {
        const component = await import("./pages/PageBuilder");
        return component.default;
      },
      permissions: [],
    });

  },

  // IMPORTANT: Content-Manager apis should be called from bootstrap()
  bootstrap(app: any) {
    try {
      const cmPlugin = app.getPlugin("content-manager");
      console.log("[layout-manager] content-manager plugin:", cmPlugin);

      const apis = cmPlugin?.apis;
      if (!apis) {
        console.warn("[layout-manager] content-manager.apis is not available");
        return;
      }

      // --- addDocumentAction adds actions for both ListView (table-row) and EditView (panel/header)
      // We add a table-row action that opens the layout editor for each document.
      const TableRowAction = (ctx: any) => {
        // ctx is a ListViewContext when used in the list; inspect in console if unsure
        // guard to only run for page-template
        if (ctx?.model !== "api::page-template.page-template" && ctx?.model !== "page-template") {
          return null;
        }

        // Return the action description expected by Strapi
        return {
          label: "Edit layout",
          icon: <PencilIcon />,
          position: "table-row", // show in list table per-row
          onClick: () => {
            // context may expose document/documentId/documents depending on where it's called
            const id =
              ctx?.documentId || (ctx?.documents && ctx.documents[0]?.id);
            if (!id) return;
            // prefer token from ctx.request.cookies when available 
            window.open(buildManagerUrl(String(id)), "_self");
          },
          variant: "secondary",
        };
      };

      // Add the table-row action(s)
      apis.addDocumentAction([TableRowAction]);

      // Also add a header action for the EditView (the button next to Save/Publish)
      const HeaderAction = (ctx: any) => {
        if (ctx?.model !== "api::page-template.page-template" && ctx?.model !== "page-template") {
          return null;
        }

        return {
          label: "Edit layout",
          icon: <PencilIcon />,
          position: "header", // header of the Edit view
          onClick: () => {
            const id = ctx?.documentId;
            if (!id) return;
            window.open(buildManagerUrl(String(id)), "_self");
          },
          variant: "secondary",
        };
      };

      apis.addDocumentHeaderAction([HeaderAction]);

      console.info("[layout-manager] Content Manager actions registered");
    } catch (err) {
      console.error("[layout-manager] bootstrap error:", err);
    }
  },
};
