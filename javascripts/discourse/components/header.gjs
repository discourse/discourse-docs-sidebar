import Component from "@glimmer/component";
import { service } from "@ember/service";
import BackToForum from "discourse/components/sidebar/back-to-forum";
import Filter from "discourse/components/sidebar/filter";
import ToggleAllSections from "discourse/components/sidebar/toggle-all-sections";
import { getOwnerWithFallback } from "discourse-common/lib/get-owner";

export default class SidebarHeader extends Component {
  @service docsSidebar;
  @service sidebarState;

  static shouldRender() {
    return getOwnerWithFallback(this).lookup("service:docs-sidebar").isVisible;
  }

  get sections() {
    return this.sidebarState.currentPanel.sections;
  }

  <template>
    <div class="sidebar-docs-header">
      <div class="sidebar-docs-header__row">
        <BackToForum />
        <ToggleAllSections @sections={{this.sections}} />
      </div>
      <div class="sidebar-docs-header__row">
        <Filter />
      </div>
    </div>
  </template>
}
