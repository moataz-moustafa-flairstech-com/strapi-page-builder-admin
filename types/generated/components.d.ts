import type { Schema, Struct } from '@strapi/strapi';

export interface SharedAccordionList extends Struct.ComponentSchema {
  collectionName: 'components_shared_accordion_lists';
  info: {
    description: 'A list of accordion items';
    displayName: 'Accordion List';
    icon: 'list';
  };
  attributes: {
    items: Schema.Attribute.Component<'shared.accordion-list-item', true>;
  };
}

export interface SharedAccordionListItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_accordion_list_items';
  info: {
    description: 'An item for an accordion list';
    displayName: 'Accordion List Item';
    icon: 'chevron-down';
  };
  attributes: {
    description: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedArticleSelector extends Struct.ComponentSchema {
  collectionName: 'components_shared_article_selectors';
  info: {
    description: 'Select or link to an Article';
    displayName: 'Article Selector';
    icon: 'link';
  };
  attributes: {
    article: Schema.Attribute.Relation<'oneToOne', 'api::article.article'>;
    article_id: Schema.Attribute.Integer;
  };
}

export interface SharedBulletedList extends Struct.ComponentSchema {
  collectionName: 'components_shared_bulleted_lists';
  info: {
    description: 'A simple bulleted list';
    displayName: 'Bulleted List';
    icon: 'list';
  };
  attributes: {
    items: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
  };
}

export interface SharedButtonInput extends Struct.ComponentSchema {
  collectionName: 'components_shared_button_inputs';
  info: {
    description: 'Button for forms';
    displayName: 'Button Input';
    icon: 'square-o';
  };
  attributes: {
    name: Schema.Attribute.String;
    type: Schema.Attribute.Enumeration<['submit', 'click']> &
      Schema.Attribute.DefaultTo<'click'>;
  };
}

export interface SharedCardsList extends Struct.ComponentSchema {
  collectionName: 'components_shared_cards_lists';
  info: {
    description: 'List of cards';
    displayName: 'Cards List';
    icon: 'th-large';
  };
  attributes: {
    cards: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
  };
}

export interface SharedCheckBoxInput extends Struct.ComponentSchema {
  collectionName: 'components_shared_check_box_inputs';
  info: {
    description: 'Checkbox input';
    displayName: 'Check Box Input';
    icon: 'check-square';
  };
  attributes: {
    checked: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    name: Schema.Attribute.String;
  };
}

export interface SharedDropDownList extends Struct.ComponentSchema {
  collectionName: 'components_shared_drop_down_lists';
  info: {
    description: 'Select input with items';
    displayName: 'Drop Down List';
    icon: 'caret-down';
  };
  attributes: {
    defaultKey: Schema.Attribute.String;
    items: Schema.Attribute.Component<'shared.selection-item', true>;
    multiselect: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
  };
}

export interface SharedExternalContent extends Struct.ComponentSchema {
  collectionName: 'components_shared_external_contents';
  info: {
    description: 'External website content with live refresh capabilities';
    displayName: 'External Content';
    icon: 'external-link-alt';
  };
  attributes: {
    live: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    refresh_rate: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedFacebookFeed extends Struct.ComponentSchema {
  collectionName: 'components_shared_facebook_feeds';
  info: {
    description: 'Embed Facebook posts/feed';
    displayName: 'Facebook Feed';
    icon: 'facebook';
  };
  attributes: {
    embedHtml: Schema.Attribute.Text;
    pageUrl: Schema.Attribute.String;
  };
}

export interface SharedFormFileInput extends Struct.ComponentSchema {
  collectionName: 'components_shared_form_file_inputs';
  info: {
    description: 'Placeholder component removed; kept minimal to avoid Strapi load errors';
    displayName: 'Form File Input';
    icon: 'file';
  };
  attributes: {
    accept: Schema.Attribute.String & Schema.Attribute.DefaultTo<'*'>;
    name: Schema.Attribute.String;
  };
}

export interface SharedFormSelector extends Struct.ComponentSchema {
  collectionName: 'components_shared_form_selectors';
  info: {
    description: 'Placeholder component removed; kept minimal to avoid Strapi load errors';
    displayName: 'Form Selector';
    icon: 'list-alt';
  };
  attributes: {
    form_widget: Schema.Attribute.Relation<
      'oneToOne',
      'api::form-widget.form-widget'
    >;
  };
}

export interface SharedFormTextInput extends Struct.ComponentSchema {
  collectionName: 'components_shared_form_text_inputs';
  info: {
    description: 'Placeholder component removed; kept minimal to avoid Strapi load errors';
    displayName: 'Form Text Input ';
    icon: 'font';
  };
  attributes: {
    defaultValue: Schema.Attribute.String;
    name: Schema.Attribute.String;
    placeholder: Schema.Attribute.String;
    text_type: Schema.Attribute.Enumeration<['text', 'password', 'text_area']> &
      Schema.Attribute.DefaultTo<'text'>;
  };
}

export interface SharedGoogleMapWidget extends Struct.ComponentSchema {
  collectionName: 'components_shared_google_map_widgets';
  info: {
    description: 'Embed a Google Map';
    displayName: 'Google Map Widget';
    icon: 'map';
  };
  attributes: {
    address: Schema.Attribute.String;
    latitude: Schema.Attribute.Decimal;
    longitude: Schema.Attribute.Decimal;
    showMarker: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    zoom: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<12>;
  };
}

export interface SharedGrid extends Struct.ComponentSchema {
  collectionName: 'components_shared_grids';
  info: {
    description: 'Grid layout container';
    displayName: 'Grid';
    icon: 'th';
  };
  attributes: {
    columns: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<3>;
    gap: Schema.Attribute.String & Schema.Attribute.DefaultTo<'normal'>;
  };
}

export interface SharedHtmlBlock extends Struct.ComponentSchema {
  collectionName: 'components_shared_html_blocks';
  info: {
    description: 'Custom HTML content';
    displayName: 'HTML Block';
    icon: 'code';
  };
  attributes: {
    html: Schema.Attribute.Text;
  };
}

export interface SharedInstagramFeed extends Struct.ComponentSchema {
  collectionName: 'components_shared_instagram_feeds';
  info: {
    description: 'Embed Instagram feed';
    displayName: 'Instagram Feed';
    icon: 'instagram';
  };
  attributes: {
    embedHtml: Schema.Attribute.Text;
    profileUrl: Schema.Attribute.String;
  };
}

export interface SharedLayoutRepeater extends Struct.ComponentSchema {
  collectionName: 'components_shared_layout_repeaters';
  info: {
    description: 'Repeater that groups placeholders into layout rows/columns';
    displayName: 'Layout Repeater';
    icon: 'th-large';
  };
  attributes: {
    blocks: Schema.Attribute.Component<'shared.place-holder', true>;
    blocks_repeat: Schema.Attribute.Enumeration<['horizontal', 'vertical']> &
      Schema.Attribute.DefaultTo<'vertical'>;
    blocks_resizable: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    name: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedMedia extends Struct.ComponentSchema {
  collectionName: 'components_shared_media';
  info: {
    displayName: 'Media';
    icon: 'file-video';
  };
  attributes: {
    file: Schema.Attribute.Media<'images' | 'files' | 'videos'>;
  };
}

export interface SharedPageHeaderTag extends Struct.ComponentSchema {
  collectionName: 'components_shared_page_header_tags';
  info: {
    description: 'A header tag with attributes to be rendered in the page head';
    displayName: 'Page Header Tag';
    icon: 'header';
  };
  attributes: {
    attributes: Schema.Attribute.Component<'shared.tag-attribute', true>;
    tag_name: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedPageSection extends Struct.ComponentSchema {
  collectionName: 'components_shared_page_sections';
  info: {
    description: 'A page section that maps to a placeholder UI identifier and contains blocks';
    displayName: 'Page Section';
    icon: 'columns';
  };
  attributes: {
    blocks: Schema.Attribute.DynamicZone<
      [
        'shared.external-content',
        'shared.media',
        'shared.quote',
        'shared.rich-text',
        'shared.slider',
        'shared.article-selector',
        'shared.youtube-player',
        'shared.google-map-widget',
        'shared.facebook-feed',
        'shared.instagram-feed',
        'shared.social-media-link',
        'shared.html-block',
        'shared.accordion-list',
        'shared.grid',
        'shared.bulleted-list',
        'shared.cards-list',
        'shared.form-selector',
      ]
    >;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    style: Schema.Attribute.Component<
      'shared.page-section-styling-options',
      false
    >;
  };
}

export interface SharedPageSectionStylingOptions
  extends Struct.ComponentSchema {
  collectionName: 'components_shared_page_section_styling_options';
  info: {
    description: 'Advanced styling options for page sections including dimensions and scrolling';
    displayName: 'Page Section Styling Options';
    icon: 'paint-brush';
  };
  attributes: {
    background_color: Schema.Attribute.String &
      Schema.Attribute.CustomField<'plugin::color-picker.color'> &
      Schema.Attribute.SetPluginOptions<{
        'color-picker': {
          format: 'hex';
        };
      }>;
    background_image: Schema.Attribute.Media<'images'>;
    maximum_height: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    maximum_height_unit: Schema.Attribute.Enumeration<['pixels', 'percent']> &
      Schema.Attribute.DefaultTo<'pixels'>;
    maximum_width: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    maximum_width_unit: Schema.Attribute.Enumeration<['pixels', 'percent']> &
      Schema.Attribute.DefaultTo<'pixels'>;
    minimum_height: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    minimum_height_unit: Schema.Attribute.Enumeration<['pixels', 'percent']> &
      Schema.Attribute.DefaultTo<'pixels'>;
    minimum_width: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    minimum_width_unit: Schema.Attribute.Enumeration<['pixels', 'percent']> &
      Schema.Attribute.DefaultTo<'pixels'>;
    scrollable: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
  };
}

export interface SharedPageStylingOptions extends Struct.ComponentSchema {
  collectionName: 'components_shared_page_styling_options';
  info: {
    description: 'Styling options for pages including background color and image';
    displayName: 'Page Styling Options';
    icon: 'palette';
  };
  attributes: {
    background_color: Schema.Attribute.String &
      Schema.Attribute.CustomField<'plugin::color-picker.color'> &
      Schema.Attribute.SetPluginOptions<{
        'color-picker': {
          format: 'hex';
        };
      }>;
    background_image: Schema.Attribute.Media<'images'>;
  };
}

export interface SharedPlaceHolder extends Struct.ComponentSchema {
  collectionName: 'components_shared_place_holders';
  info: {
    description: 'Recursive container for organizing layout blocks with configurable arrangement';
    displayName: 'Place Holder';
    icon: 'layer-group';
  };
  attributes: {
    blocks_repeat: Schema.Attribute.Enumeration<['horizontal', 'vertical']> &
      Schema.Attribute.DefaultTo<'vertical'>;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    ui_identifier: Schema.Attribute.String;
  };
}

export interface SharedQuote extends Struct.ComponentSchema {
  collectionName: 'components_shared_quotes';
  info: {
    displayName: 'Quote';
    icon: 'indent';
  };
  attributes: {
    body: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface SharedRadioButtonsList extends Struct.ComponentSchema {
  collectionName: 'components_shared_radio_buttons_lists';
  info: {
    description: 'Radio button selection';
    displayName: 'Radio Buttons List';
    icon: 'dot-circle-o';
  };
  attributes: {
    defaultKey: Schema.Attribute.String;
    items: Schema.Attribute.Component<'shared.selection-item', true>;
  };
}

export interface SharedRichText extends Struct.ComponentSchema {
  collectionName: 'components_shared_rich_texts';
  info: {
    description: '';
    displayName: 'Rich text';
    icon: 'align-justify';
  };
  attributes: {
    body: Schema.Attribute.RichText;
  };
}

export interface SharedSelectionItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_selection_items';
  info: {
    description: 'Key/value item for selection lists';
    displayName: 'Selection Item';
    icon: 'tag';
  };
  attributes: {
    key: Schema.Attribute.String;
    value: Schema.Attribute.String;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: '';
    displayName: 'Seo';
    icon: 'allergies';
    name: 'Seo';
  };
  attributes: {
    metaDescription: Schema.Attribute.Text & Schema.Attribute.Required;
    metaTitle: Schema.Attribute.String & Schema.Attribute.Required;
    shareImage: Schema.Attribute.Media<'images'>;
  };
}

export interface SharedSlider extends Struct.ComponentSchema {
  collectionName: 'components_shared_sliders';
  info: {
    description: '';
    displayName: 'Slider';
    icon: 'address-book';
  };
  attributes: {
    files: Schema.Attribute.Media<'images', true>;
  };
}

export interface SharedSocialMediaLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_social_media_links';
  info: {
    description: 'Link to a social profile';
    displayName: 'Social Media Link';
    icon: 'share-alt';
  };
  attributes: {
    platform: Schema.Attribute.Enumeration<
      ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'other']
    > &
      Schema.Attribute.DefaultTo<'other'>;
    title: Schema.Attribute.String;
    url: Schema.Attribute.String;
  };
}

export interface SharedTagAttribute extends Struct.ComponentSchema {
  collectionName: 'components_shared_tag_attributes';
  info: {
    description: 'A name/value attribute used in header tags';
    displayName: 'Tag Attribute';
    icon: 'tag';
  };
  attributes: {
    name: Schema.Attribute.String & Schema.Attribute.Required;
    value: Schema.Attribute.String;
  };
}

export interface SharedYoutubePlayer extends Struct.ComponentSchema {
  collectionName: 'components_shared_youtube_players';
  info: {
    description: 'Embed a YouTube video';
    displayName: 'YouTube Player';
    icon: 'youtube';
  };
  attributes: {
    autoPlay: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    controls: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    height: Schema.Attribute.Integer;
    startAt: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    url: Schema.Attribute.String;
    videoId: Schema.Attribute.String & Schema.Attribute.Required;
    width: Schema.Attribute.Integer;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'shared.accordion-list': SharedAccordionList;
      'shared.accordion-list-item': SharedAccordionListItem;
      'shared.article-selector': SharedArticleSelector;
      'shared.bulleted-list': SharedBulletedList;
      'shared.button-input': SharedButtonInput;
      'shared.cards-list': SharedCardsList;
      'shared.check-box-input': SharedCheckBoxInput;
      'shared.drop-down-list': SharedDropDownList;
      'shared.external-content': SharedExternalContent;
      'shared.facebook-feed': SharedFacebookFeed;
      'shared.form-file-input': SharedFormFileInput;
      'shared.form-selector': SharedFormSelector;
      'shared.form-text-input': SharedFormTextInput;
      'shared.google-map-widget': SharedGoogleMapWidget;
      'shared.grid': SharedGrid;
      'shared.html-block': SharedHtmlBlock;
      'shared.instagram-feed': SharedInstagramFeed;
      'shared.layout-repeater': SharedLayoutRepeater;
      'shared.media': SharedMedia;
      'shared.page-header-tag': SharedPageHeaderTag;
      'shared.page-section': SharedPageSection;
      'shared.page-section-styling-options': SharedPageSectionStylingOptions;
      'shared.page-styling-options': SharedPageStylingOptions;
      'shared.place-holder': SharedPlaceHolder;
      'shared.quote': SharedQuote;
      'shared.radio-buttons-list': SharedRadioButtonsList;
      'shared.rich-text': SharedRichText;
      'shared.selection-item': SharedSelectionItem;
      'shared.seo': SharedSeo;
      'shared.slider': SharedSlider;
      'shared.social-media-link': SharedSocialMediaLink;
      'shared.tag-attribute': SharedTagAttribute;
      'shared.youtube-player': SharedYoutubePlayer;
    }
  }
}
