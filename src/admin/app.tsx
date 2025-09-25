import React from "react";

const PageBuilderIcon = (props: any) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
    <path d="M3 6h6v6H3zM15 6h6v6h-6zM3 15h6v6H3zM15 15h6v6h-6z" />
  </svg>
);

const PageBuilderPage = () => {
  return (
    <div style={{ padding: 24 }}>
      <h1>Page Builder</h1>
      <p>This is a standalone Page Builder page 🎉</p>
    </div>
  );
};



export default {
  register(app: any) {
    app.addMenuLink({
      to: `${process.env.PAGE_LAYOUT_EDITOR_URL || 'http://localhost:1337/page-template-layout-manager.html'}`,
      icon: PageBuilderIcon,
      intlLabel: {
        id: "page-builder.label",
        defaultMessage: "Page Builder",
      },
      Component: PageBuilderPage,
      permissions: [],
    });

  },

};
