import 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'video-player': {
        id?: string;
        'data-title-id'?: string;
        'data-publisher-id'?: string;
        'data-aggregator'?: string;
        episode?: number | string;
        season?: number | string;
        ident?: string;
        'is-show-banner'?: string;
        'disable-licensed'?: string;
        className?: string;
      };
    }
  }
}
