import { tracked } from "@glimmer/tracking";
import Service, { inject as service } from "@ember/service";
import { ajax } from "discourse/lib/ajax";
import { MAIN_PANEL } from "discourse/lib/sidebar/panels";
import { parseSidebarStructure } from "../lib/cooked-html-parser";

export const SIDEBAR_DOCS_PANEL = "discourse_sidebar_docs";

export default class DocsSidebarService extends Service {
  @service appEvents;
  @service router;
  @service sidebarState;
  @service store;

  #contentCache = new Map();

  @tracked _activeTopicId;
  @tracked _currentSections = null;
  @tracked _loading = false;

  constructor() {
    super(...arguments);

    this.appEvents.on("page:changed", this, this.#maybeForceDocsSidebar);
  }

  get isVisible() {
    return this.sidebarState.isCurrentPanel(SIDEBAR_DOCS_PANEL);
  }

  get loading() {
    return this._loading;
  }

  get activeCategory() {
    return (
      this.router.currentRoute?.attributes?.category ||
      this.router.currentRoute?.parent?.attributes?.category
    );
  }

  get sections() {
    return this._currentSections || [];
  }

  #findSettingsForActiveCategory() {
    let category = this.activeCategory;

    while (category != null) {
      const matchingSetting = settings.categories_toc_topics.find(
        // eslint-disable-next-line no-loop-func
        (setting) => setting.category[0] === category.id
      );

      if (matchingSetting) {
        return matchingSetting;
      }

      category = category.parentCategory;
    }
  }

  #maybeForceDocsSidebar() {
    const newActiveTopicId = this.#findSettingsForActiveCategory()?.topic_id;

    if (this._activeTopicId !== newActiveTopicId) {
      this.#setSidebarContent(newActiveTopicId);
    }
  }

  async #setSidebarContent(topic_id) {
    this._activeTopicId = topic_id;

    if (!this._activeTopicId) {
      this.sidebarState.setPanel(MAIN_PANEL);
      return;
    }

    this._currentSections = this.#contentCache.get(this._activeTopicId);

    this.sidebarState.setPanel(SIDEBAR_DOCS_PANEL);
    this.sidebarState.setSeparatedMode();
    this.sidebarState.hideSwitchPanelButtons();

    if (this._currentSections) {
      return;
    }

    this._loading = true;
    try {
      // leverages the post stream API to fetch only the first post
      const data = await ajax(`/t/${topic_id}/posts.json`, {
        post_number: 2,
        include_suggested: false,
        asc: false,
      });

      const cookedHtml = data?.post_stream?.posts?.[0]?.cooked;
      if (!cookedHtml) {
        // display regular sidebar
        return;
      }

      const sections = parseSidebarStructure(cookedHtml);
      this.#contentCache.set(topic_id, sections);
      this._currentSections = sections;
    } finally {
      this._loading = false;
    }
  }
}
