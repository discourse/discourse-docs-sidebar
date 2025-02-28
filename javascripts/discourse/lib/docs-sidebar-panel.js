import { cached } from "@glimmer/tracking";
import { computed } from "@ember/object";
import { htmlSafe } from "@ember/template";
import BaseCustomSidebarSection from "discourse/lib/sidebar/base-custom-sidebar-section";
import BaseCustomSidebarSectionLink from "discourse/lib/sidebar/base-custom-sidebar-section-link";
import DiscourseURL from "discourse/lib/url";
import { escapeExpression, unicodeSlugify } from "discourse/lib/utilities";
import { getOwnerWithFallback } from "discourse-common/lib/get-owner";
import getURL, {
  getAbsoluteURL,
  samePrefix,
} from "discourse-common/lib/get-url";
import I18n from "discourse-i18n";
import { SIDEBAR_DOCS_PANEL } from "../services/docs-sidebar";

const sidebarPanelClassBuilder = (BaseCustomSidebarPanel) =>
  class DocsSidebarPanel extends BaseCustomSidebarPanel {
    key = SIDEBAR_DOCS_PANEL;
    hidden = true;
    displayHeader = true;

    get docsSidebar() {
      return getOwnerWithFallback(this).lookup("service:docs-sidebar");
    }

    @cached
    get sections() {
      const router = getOwnerWithFallback(this).lookup("service:router");

      return this.docsSidebar.sectionsConfig.map((config) => {
        return prepareDocsSection({ config, router });
      });
    }

    get filterable() {
      return !this.docsSidebar.loading;
    }

    filterNoResultsDescription(filter) {
      const active = this.docsSidebar.activeCategory;
      let categoryFilter = "";

      if (this.docsSidebar.activeCategory) {
        categoryFilter =
          " " +
          (this.#assembleCategoryFilter("", active, 1) ??
            `category:${active.id}`);
      }

      const params = {
        filter: escapeExpression(filter),
        content_search_url: getURL(
          `/search?q=${encodeURIComponent(filter + categoryFilter)}`
        ),
        site_search_url: getURL(`/search?q=${encodeURIComponent(filter)}`),
      };

      return htmlSafe(
        I18n.t(themePrefix("filter.no_results.description"), params)
      );
    }

    #assembleCategoryFilter(filter, category, level) {
      if (!category) {
        return filter;
      }

      if (level > 2) {
        return null;
      }

      if (category.parentCategory) {
        return this.#assembleCategoryFilter(
          ":" + category.slug,
          category.parentCategory,
          level + 1
        );
      } else {
        return "#" + category.slug + filter;
      }
    }
  };

export default sidebarPanelClassBuilder;

function prepareDocsSection({ config, router }) {
  return class extends BaseCustomSidebarSection {
    #config = config;

    get sectionLinks() {
      return this.#config.links;
    }

    get name() {
      return this.#config.name;
    }

    get title() {
      return this.#config.text;
    }

    get text() {
      return this.#config.label
        ? I18n.t(this.#config.label)
        : this.#config.text;
    }

    get links() {
      return this.sectionLinks.map(
        (sectionLinkData) =>
          new SidebarDocsSectionLink({
            data: sectionLinkData,
            panelName: this.name,
            router,
          })
      );
    }

    get displaySection() {
      return true;
    }

    get hideSectionHeader() {
      return this.#config.name === `${SIDEBAR_DOCS_PANEL}::root`;
    }

    get collapsedByDefault() {
      return false;
    }
  };
}

class SidebarDocsSectionLink extends BaseCustomSidebarSectionLink {
  #data;
  #panelName;
  #router;

  constructor({ data, panelName, router }) {
    super(...arguments);

    this.#data = data;
    this.#panelName = panelName;
    this.#router = router;
  }

  get active() {
    if (DiscourseURL.isInternal(this.href) && samePrefix(this.href)) {
      const topicRouteInfo = this.#router
        .recognize(this.href.replace(getAbsoluteURL("/"), "/"), "")
        .find((route) => route.name === "topic");

      const currentTopicRouteInfo = this.#router.currentRoute.find(
        (route) => route.name === "topic"
      );

      return (
        currentTopicRouteInfo &&
        currentTopicRouteInfo?.params?.id === topicRouteInfo?.params?.id
      );
    }

    return false;
  }

  get name() {
    return `${this.#panelName}___${unicodeSlugify(this.#data.text)}`;
  }

  get classNames() {
    const list = ["docs-sidebar-nav-link"];

    if (this.active) {
      list.push("active");
    }

    return list.join(" ");
  }

  get href() {
    return this.#data.href;
  }

  get text() {
    return this.#data.text;
  }

  get title() {
    return this.#data.text;
  }

  @computed("data.text")
  get keywords() {
    return {
      navigation: this.#data.text.toLowerCase().split(/\s+/g),
    };
  }
}
