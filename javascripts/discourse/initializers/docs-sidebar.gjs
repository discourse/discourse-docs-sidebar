import { withPluginApi } from "discourse/lib/plugin-api";
import DocsSidebarPanel from "../lib/docs-sidebar-panel";

export default {
  name: "docs-sidebar",
  initialize(container) {
    if (!settings.categories_toc_topics.length) {
      return;
    }

    const docsSidebar = container.lookup("service:docs-sidebar");
    docsSidebar.setSettings({
      categories: settings.categories_toc_topics,
    });

    withPluginApi("1.34.0", (api) => {
      api.addSidebarPanel(DocsSidebarPanel);
    });
  },
};
