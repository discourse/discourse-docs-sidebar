import Component from "@glimmer/component";
import { action } from "@ember/object";
import { service } from "@ember/service";
import DButton from "discourse/components/d-button";

export default class TogglePanel extends Component {
  @service docsSidebar;

  get label() {
    return this.docsSidebar.isVisible
      ? "toggle_panels.sidebar"
      : "toggle_panels.docs";
  }

  get icon() {
    return this.docsSidebar.isVisible ? "arrow-left" : "book";
  }

  @action
  togglePanel() {
    this.docsSidebar.toggleSidebarPanel();
  }

  <template>
    <DButton
      @action={{this.togglePanel}}
      @icon={{this.icon}}
      @label={{themePrefix this.label}}
      @title={{this.title}}
      class="btn-transparent"
      ...attributes
    />
  </template>
}
