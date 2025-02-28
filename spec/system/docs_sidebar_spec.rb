# frozen_string_literal: true

RSpec.describe "Docs Sidebar", system: true do
  fab!(:theme) { upload_theme_component }
  fab!(:category) { Fabricate(:category_with_definition) }
  fab!(:topic) do
    t = Fabricate(:topic, category: category)
    Fabricate(:post, topic: t)
    t
  end
  fab!(:post) { Fabricate(:post, topic: topic) }
  fab!(:documentation_category) { Fabricate(:category_with_definition) }
  fab!(:documentation_subcategory) do
    Fabricate(
      :category_with_definition,
      parent_category_id: documentation_category.id
    )
  end
  fab!(:documentation_topic) do
    t = Fabricate(:topic, category: documentation_category)
    Fabricate(:post, topic: t)
    t
  end
  fab!(:documentation_topic2) do
    t = Fabricate(:topic, category: documentation_category)
    Fabricate(:post, topic: t)
    t
  end
  fab!(:documentation_topic3) do
    t = Fabricate(:topic, category: documentation_category)
    Fabricate(:post, topic: t)
    t
  end
  fab!(:documentation_topic4) do
    t = Fabricate(:topic, category: documentation_category)
    Fabricate(:post, topic: t)
    t
  end
  fab!(:index_topic) do
    t = Fabricate(:topic, category: documentation_category)

    Fabricate(:post, topic: t, raw: <<~MD)
      Lorem ipsum dolor sit amet

      ## General Usage

      * No link
      * [#{documentation_topic.title}](/t/#{documentation_topic.slug}/#{documentation_topic.id})
      * #{documentation_topic2.slug}: [#{documentation_topic2.title}](/t/#{documentation_topic2.slug}/#{documentation_topic2.id})

      ## Writing

      * [#{documentation_topic3.title}](/t/#{documentation_topic3.slug}/#{documentation_topic3.id})
      * #{documentation_topic4.slug}: [#{documentation_topic4.title}](/t/#{documentation_topic4.slug}/#{documentation_topic4.id})
      * No link

      ## Empty section

    MD

    t
  end

  let(:sidebar) { PageObjects::Components::NavigationMenu::Sidebar.new }
  let(:filter) { PageObjects::Components::Filter.new }

  def docs_section_name(title)
    "discourse-sidebar-docs__#{Slug.for(title)}"
  end

  def docs_link_name(title, section_title)
    "#{docs_section_name(section_title)}___#{Slug.for(title)}"
  end

  before do
    SiteSetting.navigation_menu = "sidebar"

    theme.update_setting(
      :categories_toc_topics,
      [{ category: [documentation_category.id], topic_id: index_topic.id }]
    )

    theme.save!
  end

  context "when browsing regular pages" do
    it "should display the main sidebar" do
      visit("/categories")
      expect(sidebar).to have_section("categories")

      visit("/t/#{topic.slug}/#{topic.id}")
      expect(sidebar).to have_section("categories")
    end
  end

  def expect_docs_sidebar_to_be_correct
    expect(sidebar).to have_section(docs_section_name("General Usage"))
    expect(sidebar).to have_section(docs_section_name("Writing"))
    expect(sidebar).to have_no_section(docs_section_name("Empty section"))
    expect(sidebar).to have_no_section("categories")

    [documentation_topic, documentation_topic3].each do |topic|
      expect(sidebar).to have_section_link(
        topic.title,
        href: %r{t/#{topic.slug}/#{topic.id}}
      )
    end

    [documentation_topic2, documentation_topic4].each do |topic|
      expect(sidebar).to have_section_link(
        topic.slug,
        href: %r{t/#{topic.slug}/#{topic.id}}
      )
    end

    expect(sidebar).to have_no_section_link("No link")
  end

  context "when browsing a documentation category" do
    it "should display the docs sidebar correctly" do
      visit("/c/#{documentation_category.slug}/#{documentation_category.id}")

      expect(sidebar).to be_visible
      expect_docs_sidebar_to_be_correct
    end
  end

  context "when browsing a documentation topic" do
    it "should display the docs sidebar correctly" do
      visit("/t/#{documentation_topic.slug}/#{documentation_topic.id}")

      expect(sidebar).to be_visible
      expect_docs_sidebar_to_be_correct
    end
  end

  context "when filtering" do
    it "should suggest filtering the content when there are no results" do
      SiteSetting.max_category_nesting = 3
      documentation_subsubcategory =
        Fabricate(
          :category_with_definition,
          parent_category_id: documentation_subcategory.id
        )

      visit("/c/#{documentation_category.slug}/#{documentation_category.id}")

      filter.filter("ieeee")
      expect(page).to have_no_css(".sidebar-section-link-content-text")
      expect(page).to have_css(".sidebar-no-results")

      no_results_description = page.find(".sidebar-no-results__description")
      expect(no_results_description.text).to eq(
        "We couldn’t find anything matching ‘ieeee’.\n\nDo you want to perform a search on this category or a site wide search instead?"
      )

      suggested_category_search =
        page.find(".docs-sidebar-suggested-category-search")
      expect(suggested_category_search[:href]).to end_with(
        "/search?q=ieeee%20%23#{documentation_category.slug}"
      )

      site_wide_search = page.find(".docs-sidebar-suggested-site-search")
      expect(site_wide_search[:href]).to end_with("/search?q=ieeee")

      # for subcategories
      visit(
        "/c/#{documentation_category.slug}/#{documentation_subcategory.slug}/#{documentation_subcategory.id}"
      )
      filter.filter("ieeee")

      suggested_category_search =
        page.find(".docs-sidebar-suggested-category-search")
      expect(suggested_category_search[:href]).to end_with(
        "/search?q=ieeee%20%23#{documentation_category.slug}%3A#{documentation_subcategory.slug}"
      )

      # for 3 levels deep
      visit("/c/#{documentation_subsubcategory.id}")
      filter.filter("ieeee")

      suggested_category_search =
        page.find(".docs-sidebar-suggested-category-search")
      expect(suggested_category_search[:href]).to end_with(
        "/search?q=ieeee%20category%3A#{documentation_subsubcategory.id}"
      )
    end
  end
end
