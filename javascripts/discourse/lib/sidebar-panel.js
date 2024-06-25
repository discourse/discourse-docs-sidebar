import { cached } from "@glimmer/tracking";
import { computed } from "@ember/object";
import BaseCustomSidebarSection from "discourse/lib/sidebar/base-custom-sidebar-section";
import BaseCustomSidebarSectionLink from "discourse/lib/sidebar/base-custom-sidebar-section-link";
import DiscourseURL from "discourse/lib/url";
import { getOwnerWithFallback } from "discourse-common/lib/get-owner";
import { getAbsoluteURL, samePrefix } from "discourse-common/lib/get-url";
import I18n from "discourse-i18n";
import { SIDEBAR_DOCS_PANEL } from "../services/docs-sidebar";

const sidebarPanelClassBuilder = (BaseCustomSidebarPanel) =>
  class DocsSidebarPanel extends BaseCustomSidebarPanel {
    key = SIDEBAR_DOCS_PANEL;
    hidden = true;

    get docsSidebar() {
      return getOwnerWithFallback(this).lookup("service:docs-sidebar");
    }

    @cached
    get sections() {
      const router = getOwnerWithFallback(this).lookup("service:router");
      const navConfig = this.docsSidebar.sections;

      return navConfig.map((config) => {
        return prepareDocsSection({ config, router });
      });
    }

    get filterable() {
      return !this.docsSidebar.loading;
    }
  };

export default sidebarPanelClassBuilder;

function prepareDocsSection({ config, router, parent = null }) {
  return class extends BaseCustomSidebarSection {
    #config = config;

    get sectionLinks() {
      return this.#config.links;
    }

    get name() {
      const normalizedName = normalizeName(this.#config.name);

      return parent
        ? `${parent.name}__${normalizedName}`
        : `${SIDEBAR_DOCS_PANEL}-${normalizedName}`;
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
            router,
          })
      );
    }

    get displaySection() {
      return true;
    }

    get hideSectionHeader() {
      return this.#config.name === "root";
    }

    get collapsedByDefault() {
      return false;
    }
  };
}

class SidebarDocsSectionLink extends BaseCustomSidebarSectionLink {
  #data;

  constructor({ data, router }) {
    super(...arguments);

    this.#data = data;
    this._router = router;
  }

  @computed("_router.currentRoute", "href")
  get active() {
    if (DiscourseURL.isInternal(this.href) && samePrefix(this.href)) {
      const topicRouteInfo = this._router
        .recognize(this.href.replace(getAbsoluteURL("/"), "/"), "")
        .find((v) => v.name === "topic");

      const currentTopicRouteInfo = this._router.currentRoute.find(
        (v) => v.name === "topic"
      );

      return (
        currentTopicRouteInfo &&
        currentTopicRouteInfo?.params?.id === topicRouteInfo?.params?.id
      );
    }

    return false;
  }

  get name() {
    return normalizeName(this.#data.text);
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

function normalizeName(name) {
  return name
    .normalize("NFD") // normalize the string to remove diacritics
    .replace(
      /[\u0300-\u036f]|\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu,
      ""
    ) // remove emojis and diacritics
    .toLowerCase()
    .replace(/\s|_+/g, "-") // replace spaces and underscores with dashes
    .replace(/--+/g, "-") // replace multiple dashes with a single dash
    .replace(/(^-+|-+$)/, ""); // remove trailing/leading dashes
}
