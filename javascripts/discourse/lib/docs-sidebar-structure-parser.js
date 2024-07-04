import { SIDEBAR_DOCS_PANEL } from "../services/docs-sidebar";
import { normalizeName } from "./utils";

export function parseSidebarStructure(cookedHtml) {
  return new DocsSidebarStructureParser(cookedHtml).sectionsConfig;
}

class DocsSidebarStructureParser {
  #htmlDocument;
  #sections = [];

  constructor(cookedHtml) {
    this.#htmlDocument = new DOMParser().parseFromString(
      cookedHtml,
      "text/html"
    );

    this.#build();
  }

  get sectionsConfig() {
    // return only sections with at least one valid link
    return this.#sections.filter((section) => section.links.length > 0);
  }

  #isHeading(element) {
    return ["H1", "H2", "H3", "H4", "H5", "H6"].indexOf(element.tagName) > -1;
  }

  #isList(element) {
    return ["UL", "OL"].indexOf(element.tagName) > -1;
  }

  #isListItem(element) {
    return element.tagName === "LI";
  }

  get #currentSection() {
    if (this.#sections.length === 0) {
      return null;
    }

    return this.#sections[this.#sections.length - 1];
  }

  #addSection(element) {
    this.#sections.push({
      name: `${SIDEBAR_DOCS_PANEL}__${normalizeName(element.innerText)}`,
      text: element.innerText,
      links: [],
    });
  }

  #addRootSection() {
    this.#sections.push({ name: `${SIDEBAR_DOCS_PANEL}::root`, links: [] });
  }

  #addList(element) {
    for (const itemElement of element.children) {
      if (this.#isListItem(itemElement)) {
        this.#addLink(itemElement);
      }
    }
  }

  #addLink(element) {
    const anchorElement = element.querySelector("a");

    if (!anchorElement) {
      return;
    }

    if (!this.#currentSection) {
      this.#addRootSection();
    }

    this.#currentSection.links.push({
      href: anchorElement.href,
      text: anchorElement.innerText,
    });
  }

  #build() {
    for (const element of this.#htmlDocument.body.children) {
      if (this.#isHeading(element)) {
        this.#addSection(element);
      } else if (this.#isList(element)) {
        this.#addList(element);
      }
    }
  }
}
