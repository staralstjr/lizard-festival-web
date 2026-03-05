/* Kakao Map SDK (loaded via script tag) */
interface Window {
  kakao?: {
    maps: {
      load: (cb: () => void) => void;
      Map: new (el: HTMLElement, options: { center: unknown; level?: number }) => unknown;
      LatLng: new (lat: number, lng: number) => unknown;
      Marker: new (options: { position: unknown; map?: unknown }) => unknown;
      CustomOverlay: new (options: {
        position: unknown;
        content: string | HTMLElement;
        map?: unknown;
        yAnchor?: number;
      }) => unknown;
      event: {
        addListener: (target: unknown, type: string, handler: () => void) => void;
      };
    };
  };
}
