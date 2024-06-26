import Component from "@glimmer/component";
import { service } from "@ember/service";
import Filter from "discourse/components/sidebar/filter";
import { getOwnerWithFallback } from "discourse-common/lib/get-owner";
import DocsToggleAllSections from "./docs-toggle-all-sections";
import DocsTogglePanel from "./docs-toggle-panel";

export default class DocsHeader extends Component {
  static shouldRender() {
    return getOwnerWithFallback(this).lookup("service:docs-sidebar").isEnabled;
  }

  @service docsSidebar;
  @service sidebarState;

  get sections() {
    return this.sidebarState.currentPanel.sections;
  }

  get shouldDisplayDocsUI() {
    return this.docsSidebar.isVisible;
  }

  <template>
    <div class="docs-sidebar-header">
      <div class="docs-sidebar-header__row">
        <DocsTogglePanel class="docs-sidebar-header__toggle-panel-btn" />
        {{#if this.shouldDisplayDocsUI}}
          <DocsToggleAllSections @sections={{this.sections}} />
        {{/if}}
      </div>
      {{#if this.shouldDisplayDocsUI}}
        <div class="docs-sidebar-header__row">
          <Filter />
        </div>
      {{/if}}
    </div>
  </template>
}
