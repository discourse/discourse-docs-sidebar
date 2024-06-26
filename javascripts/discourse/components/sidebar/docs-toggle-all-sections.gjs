import Component from "@glimmer/component";
import { action } from "@ember/object";
import { service } from "@ember/service";
import DButton from "discourse/components/d-button";

export default class DocsToggleAllSections extends Component {
  @service docsSidebar;
  @service sidebarState;
  @service keyValueStore;

  get allSectionsExpanded() {
    return this.docsSidebar.allSectionsExpanded;
  }

  get title() {
    return this.allSectionsExpanded
      ? "docs-sidebar.collapse_all_sections"
      : "docs-sidebar.expand_all_sections";
  }

  get icon() {
    return this.allSectionsExpanded ? "angle-double-up" : "angle-double-down";
  }

  @action
  toggleAllSections() {
    const collapse = this.allSectionsExpanded;

    this.docsSidebar.sectionsConfig.forEach((sectionConfig) => {
      const key = sectionConfig.name;
      if (collapse) {
        this.sidebarState.collapseSection(key);
      } else {
        this.sidebarState.expandSection(key);
      }
    });
  }

  <template>
    <DButton
      @action={{this.toggleAllSections}}
      @icon={{this.icon}}
      @title={{this.title}}
      class="btn-transparent sidebar-toggle-all-sections"
    />
  </template>
}
