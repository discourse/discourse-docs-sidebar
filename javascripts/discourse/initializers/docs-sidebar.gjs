import { withPluginApi } from "discourse/lib/plugin-api";
import SidebarHeader from "../components/sidebar/docs-header";
import DocsSidebarPanel from "../lib/docs-sidebar-panel";

export default {
  name: "docs-sidebar",
  initialize() {
    if (!settings.categories_toc_topics.length) {
      return;
    }

    withPluginApi("1.8.0", (api) => {
      addSidebarHeader(api);
      addSidebarPanel(api);
    });
  },
};

function addSidebarHeader(api) {
  api.renderInOutlet("before-sidebar-sections", SidebarHeader);
}

function addSidebarPanel(api) {
  api.addSidebarPanel(DocsSidebarPanel);
}
