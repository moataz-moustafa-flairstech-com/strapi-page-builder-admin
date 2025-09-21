import type { Schema, Struct } from '@strapi/strapi';

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
      ]
    >;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    place_holder_ui_indentifier: Schema.Attribute.String &
      Schema.Attribute.Required;
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

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'shared.external-content': SharedExternalContent;
      'shared.layout-repeater': SharedLayoutRepeater;
      'shared.media': SharedMedia;
      'shared.page-section': SharedPageSection;
      'shared.place-holder': SharedPlaceHolder;
      'shared.quote': SharedQuote;
      'shared.rich-text': SharedRichText;
      'shared.seo': SharedSeo;
      'shared.slider': SharedSlider;
    }
  }
}
