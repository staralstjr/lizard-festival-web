"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }; // 서울
const NAVER_MAP_SCRIPT_URL = "https://openapi.map.naver.com/openapi/v3/maps.js";

type PlaceItem = {
  id: string;
  place_name: string;
  category_name: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  place_url: string;
  phone: string;
};

type EventItem = {
  title: string;
  location: string | null;
  event_date: string | null;
  event_type: string;
  source_url: string;
};

type Props = {
  mapKey: string; // 네이버 ncpClientId
  center?: { lat: number; lng: number };
  onPlacesLoad?: (places: PlaceItem[]) => void;
  onEventsLoad?: (events: EventItem[]) => void;
  onMapReady?: (map: unknown) => void; // 지도 인스턴스를 외부에 전달
  searchResults?: PlaceItem[]; // 검색 결과를 지도에 표시
};

declare global {
  interface Window {
    naver?: {
      maps: {
        Map: new (element: HTMLElement | string, options: { center: { lat: () => number; lng: () => number } | { lat: number; lng: number }; zoom: number }) => {
          setCenter: (center: { lat: number; lng: number }) => void;
          getCenter: () => { lat: () => number; lng: () => number };
        };
        LatLng: new (lat: number, lng: number) => { lat: () => number; lng: () => number };
        Marker: new (options: { position: { lat: () => number; lng: () => number } | { lat: number; lng: number }; map: unknown }) => unknown;
        event: {
          addListener: (target: unknown, type: string, handler: () => void) => void;
        };
      };
    };
  }
}

function loadNaverMapScript(clientId: string): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  const id = clientId.trim();
  if (!id) return Promise.reject(new Error("Empty client ID"));
  
  // 이미 로드되어 있으면 즉시 resolve
  if (window.naver?.maps) {
    return Promise.resolve();
  }

  // 이미 스크립트 태그가 있으면 기다리기
  const existing = document.querySelector('script[src*="openapi.map.naver.com"]');
  if (existing) {
    return new Promise((resolve, reject) => {
      const deadline = Date.now() + 15000;
      const tick = () => {
        if (window.naver?.maps) {
          resolve();
          return;
        }
        if (Date.now() > deadline) {
          reject(new Error("Naver map script load timeout"));
          return;
        }
        window.setTimeout(tick, 100);
      };
      tick();
    });
  }

  // 새로 스크립트 로드
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${NAVER_MAP_SCRIPT_URL}?ncpKeyId=${id}`;
    script.async = true;

    const timeout = window.setTimeout(() => {
      script.onload = null;
      script.onerror = null;
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      if (window.naver?.maps) {
        resolve();
      } else {
        reject(new Error("Naver map script load timeout"));
      }
    }, 15000);

    script.onload = () => {
      window.clearTimeout(timeout);
      setTimeout(() => {
        if (window.naver?.maps) {
          resolve();
        } else {
          reject(new Error("Naver map script loaded but window.naver.maps is missing"));
        }
      }, 100);
    };
    
    script.onerror = () => {
      window.clearTimeout(timeout);
      reject(
        new Error(
          `네이버 지도 스크립트 로드 실패. .env.local의 NEXT_PUBLIC_NAVER_MAP_CLIENT_ID가 올바른지 확인하세요.`
        )
      );
    };
    
    document.head.appendChild(script);
  });
}

export default function MapView({ mapKey, center = DEFAULT_CENTER, onPlacesLoad, onEventsLoad, onMapReady, searchResults }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null); // React StrictMode 대응: 지도 인스턴스 저장
  const markersRef = useRef<unknown[]>([]); // React StrictMode 대응: 마커 배열 저장
  const searchMarkersRef = useRef<unknown[]>([]); // 검색 결과 마커 별도 관리
  const isInitializingRef = useRef<boolean>(false); // 초기화 중 플래그
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (!mapKey) {
      setStatus("error");
      setErrorMsg("지도 키가 없습니다. .env.local에 NEXT_PUBLIC_NAVER_MAP_CLIENT_ID를 설정하세요.");
      return;
    }

    // 이미 지도 인스턴스가 있으면 스킵 (React StrictMode 대응)
    if (mapInstanceRef.current) {
      console.log("[Naver Map Debug] Map instance already exists, skipping initialization...");
      setStatus("ready");
      return;
    }

    // 초기화 중이면 완전히 스킵 (다른 프로세스가 처리 중)
    if (isInitializingRef.current) {
      console.log("[Naver Map Debug] Initialization in progress, completely skipping this effect...");
      return;
    }

    // 컨테이너가 이미 지도로 사용 중인지 확인
    if (containerRef.current && (containerRef.current as any).__naver_map_instance__) {
      console.log("[Naver Map Debug] Container already has map instance, reusing...");
      mapInstanceRef.current = (containerRef.current as any).__naver_map_instance__;
      setStatus("ready");
      return;
    }

    // 초기화 플래그 설정 전에 이미 초기화되었는지 확인
    if (mapInstanceRef.current) {
      console.log("[Naver Map Debug] Map instance already exists before setting flag, skipping...");
      setStatus("ready");
      return;
    }

    if (containerRef.current && (containerRef.current as any).__naver_map_instance__) {
      console.log("[Naver Map Debug] Container already has map instance before setting flag, skipping...");
      mapInstanceRef.current = (containerRef.current as any).__naver_map_instance__;
      setStatus("ready");
      return;
    }

    isInitializingRef.current = true;
    let map: unknown = null;
    const markers: unknown[] = [];
    let isCancelled = false; // 취소 플래그 추가

    const init = () => {
      console.log("[Naver Map Debug] Starting initialization, mapKey:", mapKey);
      console.log("[Naver Map Debug] Container ref:", containerRef.current);
      
      loadNaverMapScript(mapKey.trim())
        .then(() => {
          console.log("[Naver Map Debug] Script loaded, checking window.naver.maps...");
          if (!window.naver?.maps) {
            console.error("[Naver Map Debug] window.naver.maps is missing");
            setStatus("error");
            setErrorMsg("네이버 지도 API를 불러올 수 없습니다. Client ID를 확인하세요.");
            isInitializingRef.current = false;
            isCancelled = true;
            return;
          }

          console.log("[Naver Map Debug] window.naver.maps found:", window.naver.maps);

          // 이미 지도가 초기화되었는지 확인 (비동기 실행 중에 다른 프로세스가 완료했을 수 있음)
          if (mapInstanceRef.current) {
            console.log("[Naver Map Debug] Map already initialized before checkContainer, skipping...");
            setStatus("ready");
            isInitializingRef.current = false;
            isCancelled = true;
            return;
          }

          // 컨테이너가 이미 지도로 사용 중인지 확인
          if (containerRef.current && (containerRef.current as any).__naver_map_instance__) {
            console.log("[Naver Map Debug] Container already has map instance before checkContainer, reusing...");
            mapInstanceRef.current = (containerRef.current as any).__naver_map_instance__;
            setStatus("ready");
            isInitializingRef.current = false;
            isCancelled = true;
            return;
          }

          // 초기화 플래그가 false이면 다른 프로세스가 이미 완료했거나 취소한 것
          if (!isInitializingRef.current || isCancelled) {
            console.log("[Naver Map Debug] Initialization flag is false or cancelled, skipping checkContainer...");
            isCancelled = true;
            return;
          }

          // containerRef가 준비될 때까지 대기 (최대 3초)
          let retryCount = 0;
          const maxRetries = 30;
          const checkContainer = () => {
            // 취소 플래그 확인 - 가장 먼저 확인 (함수 시작 시마다 확인)
            if (isCancelled) {
              console.log("[Naver Map Debug] Initialization cancelled, skipping checkContainer...");
              return;
            }

            if (mapInstanceRef.current) {
              console.log("[Naver Map Debug] Map instance already exists, skipping checkContainer...");
              setStatus("ready");
              isInitializingRef.current = false;
              isCancelled = true;
              return;
            }

            if (!isInitializingRef.current) {
              console.log("[Naver Map Debug] Initialization flag is false, skipping checkContainer...");
              isCancelled = true;
              return;
            }

            // 컨테이너가 이미 지도로 사용 중인지 확인
            if (containerRef.current && (containerRef.current as any).__naver_map_instance__) {
              console.log("[Naver Map Debug] Container already has map instance (start check), reusing...");
              mapInstanceRef.current = (containerRef.current as any).__naver_map_instance__;
              setStatus("ready");
              isInitializingRef.current = false;
              isCancelled = true;
              return;
            }

            if (!containerRef.current) {
              // 재시도 전에 중복 체크
              if (isCancelled || mapInstanceRef.current || !isInitializingRef.current) {
                console.log("[Naver Map Debug] Cancelled/initialized/flag false during retry, skipping...");
                if (mapInstanceRef.current) {
                  setStatus("ready");
                }
                isInitializingRef.current = false;
                return;
              }
              retryCount++;
              if (retryCount < maxRetries) {
                // setTimeout 전에 다시 한 번 확인
                setTimeout(() => {
                  // setTimeout 콜백 실행 시점에 다시 확인
                  if (isCancelled || mapInstanceRef.current || !isInitializingRef.current) {
                    console.log("[Naver Map Debug] Cancelled/initialized/flag false in setTimeout callback, skipping checkContainer...");
                    if (mapInstanceRef.current) {
                      setStatus("ready");
                    }
                    isInitializingRef.current = false;
                    return;
                  }
                  // 컨테이너가 이미 지도로 사용 중인지 확인
                  if (containerRef.current && (containerRef.current as any).__naver_map_instance__) {
                    console.log("[Naver Map Debug] Container has map instance in setTimeout callback, skipping checkContainer...");
                    mapInstanceRef.current = (containerRef.current as any).__naver_map_instance__;
                    setStatus("ready");
                    isInitializingRef.current = false;
                    isCancelled = true;
                    return;
                  }
                  checkContainer();
                }, 100);
                return;
              }
              console.error("[Naver Map Debug] Container ref timeout after", maxRetries * 100, "ms");
              setStatus("error");
              setErrorMsg("지도 컨테이너를 찾을 수 없습니다.");
              isInitializingRef.current = false;
              isCancelled = true;
              return;
            }

            // 취소 플래그 확인
            if (isCancelled) {
              console.log("[Naver Map Debug] Initialization cancelled before getting container, skipping...");
              return;
            }

            if (!window.naver?.maps) {
              console.error("[Naver Map Debug] window.naver.maps is missing in checkContainer");
              isInitializingRef.current = false;
              isCancelled = true;
              return;
            }

            const { Map, LatLng, Marker, event: naverEvent } = window.naver.maps;
            const container = containerRef.current;

            // 중복 체크: 컨테이너가 이미 지도로 사용되고 있는지 확인
            // 네이버 지도는 컨테이너에 특정 속성을 추가하므로 이를 확인
            if ((container as any).__naver_map_instance__) {
              console.log("[Naver Map Debug] Container already has a map instance, reusing...");
              const existingMap = (container as any).__naver_map_instance__;
              mapInstanceRef.current = existingMap;
              setStatus("ready");
              isInitializingRef.current = false;
              isCancelled = true;
              return;
            }

            // 취소 플래그 확인
            if (isCancelled) {
              console.log("[Naver Map Debug] Initialization cancelled before canvas check, skipping...");
              return;
            }

            // 네이버 지도 API가 컨테이너에 직접 추가하는 속성 확인
            // 네이버 지도는 컨테이너의 첫 번째 자식이 지도 컨테이너인 경우가 많음
            if (container.children.length > 0) {
              // 이미 지도가 렌더링되어 있는지 확인
              const hasMapCanvas = Array.from(container.children).some(
                (child) => child.tagName === "CANVAS" || child.classList.contains("naver-map")
              );
              if (hasMapCanvas) {
                console.log("[Naver Map Debug] Container already has map canvas, skipping initialization...");
                // 기존 지도 인스턴스를 찾아서 재사용
                if ((container as any).__naver_map_instance__) {
                  mapInstanceRef.current = (container as any).__naver_map_instance__;
                  setStatus("ready");
                }
                isInitializingRef.current = false;
                isCancelled = true;
                return;
              }
            }

            console.log("[Naver Map Debug] Container found:", container);
            console.log("[Naver Map Debug] Container dimensions:", {
              width: container.offsetWidth,
              height: container.offsetHeight,
              clientWidth: container.clientWidth,
              clientHeight: container.clientHeight,
            });

            // HTMLElement인지 확인
            if (!(container instanceof HTMLElement)) {
              console.error("[Naver Map Debug] Container is not HTMLElement:", container);
              setStatus("error");
              setErrorMsg("지도 컨테이너가 올바르지 않습니다.");
              isInitializingRef.current = false;
              return;
            }

            // 컨테이너 크기가 0이면 경고
            if (container.offsetWidth === 0 || container.offsetHeight === 0) {
              console.warn("[Naver Map Debug] Container has zero dimensions, but proceeding anyway");
            }

            // 마지막 중복 체크: 지도 인스턴스가 이미 생성되었는지 다시 확인
            // (비동기 실행 중에 다른 프로세스가 이미 생성했을 수 있음)
            if (mapInstanceRef.current) {
              console.log("[Naver Map Debug] Map instance created by another process, skipping...");
              setStatus("ready");
              isInitializingRef.current = false;
              return;
            }

            // 컨테이너가 이미 지도로 사용 중인지 최종 확인
            if ((container as any).__naver_map_instance__) {
              console.log("[Naver Map Debug] Container already has map instance (final check), skipping...");
              mapInstanceRef.current = (container as any).__naver_map_instance__;
              setStatus("ready");
              isInitializingRef.current = false;
              return;
            }

            // 최종 중복 체크: 지도 인스턴스가 이미 생성되었는지 확인
            // (비동기 실행 중에 다른 프로세스가 이미 생성했을 수 있음)
            if (mapInstanceRef.current) {
              console.log("[Naver Map Debug] Map instance already exists (before Map creation), skipping...");
              setStatus("ready");
              isInitializingRef.current = false;
              return;
            }

            // 컨테이너가 이미 지도로 사용 중인지 최종 확인
            if ((container as any).__naver_map_instance__) {
              console.log("[Naver Map Debug] Container already has map instance (before Map creation), skipping...");
              mapInstanceRef.current = (container as any).__naver_map_instance__;
              setStatus("ready");
              isInitializingRef.current = false;
              return;
            }

            try {
              // 네이버 지도 초기화
              // 네이버 지도 API v3: new naver.maps.Map(element, options)
              const centerLatLng = new LatLng(center.lat, center.lng);
              const mapOptions = {
                center: centerLatLng,
                zoom: 13,
              };
              
              console.log("[Naver Map Debug] Creating map with options:", mapOptions);
              
              // 컨테이너가 유효한 HTMLElement인지 최종 확인
              if (!container || !(container instanceof HTMLElement)) {
                throw new Error("Container is not a valid HTMLElement");
              }
              
              // 취소 플래그 최종 확인 (가장 먼저 확인)
              if (isCancelled) {
                console.log("[Naver Map Debug] Initialization cancelled right before Map creation (in try block), aborting...");
                return;
              }

              // 마지막 확인: 지도 인스턴스가 생성되지 않았는지 확인
              if (mapInstanceRef.current) {
                console.log("[Naver Map Debug] Map instance created between checks, aborting...");
                setStatus("ready");
                isInitializingRef.current = false;
                isCancelled = true;
                return;
              }
              
              // 컨테이너가 이미 지도로 사용 중인지 최종 확인
              if ((container as any).__naver_map_instance__) {
                console.log("[Naver Map Debug] Container already has map instance (right before Map creation), aborting...");
                mapInstanceRef.current = (container as any).__naver_map_instance__;
                setStatus("ready");
                isInitializingRef.current = false;
                isCancelled = true;
                return;
              }
              
              // 초기화 플래그가 여전히 true인지 확인 (다른 프로세스가 취소했을 수 있음)
              if (!isInitializingRef.current) {
                console.log("[Naver Map Debug] Initialization flag is false, aborting Map creation...");
                return;
              }
              
              // 취소 플래그 최종 확인 (가장 먼저 확인)
              if (isCancelled) {
                console.log("[Naver Map Debug] Initialization cancelled right before Map creation, aborting...");
                return;
              }

              // 최종 확인: 지도 인스턴스가 생성되지 않았는지 확인
              if (mapInstanceRef.current) {
                console.log("[Naver Map Debug] Map instance exists right before new Map(), aborting...");
                setStatus("ready");
                isInitializingRef.current = false;
                isCancelled = true;
                return;
              }
              
              // 최종 확인: 컨테이너가 이미 사용 중인지 확인
              if ((container as any).__naver_map_instance__) {
                console.log("[Naver Map Debug] Container already has map instance right before new Map(), aborting...");
                mapInstanceRef.current = (container as any).__naver_map_instance__;
                setStatus("ready");
                isInitializingRef.current = false;
                isCancelled = true;
                return;
              }
              
              // 컨테이너가 유효한지 최종 확인
              if (!container || !(container instanceof HTMLElement)) {
                console.error("[Naver Map Debug] Container is not valid HTMLElement right before new Map(), aborting...");
                isInitializingRef.current = false;
                isCancelled = true;
                return;
              }
              
              // 컨테이너가 DOM에 연결되어 있는지 확인
              if (!container.isConnected) {
                console.error("[Naver Map Debug] Container is not connected to DOM right before new Map(), aborting...");
                isInitializingRef.current = false;
                isCancelled = true;
                return;
              }

              // 최종 확인: 취소되었거나 이미 초기화되었는지 확인
              if (isCancelled) {
                console.log("[Naver Map Debug] Cancelled right before new Map(), aborting...");
                return;
              }

              if (mapInstanceRef.current) {
                console.log("[Naver Map Debug] Map instance exists right before new Map(), aborting...");
                setStatus("ready");
                isInitializingRef.current = false;
                isCancelled = true;
                return;
              }

              if ((container as any).__naver_map_instance__) {
                console.log("[Naver Map Debug] Container already has map instance right before new Map(), aborting...");
                mapInstanceRef.current = (container as any).__naver_map_instance__;
                setStatus("ready");
                isInitializingRef.current = false;
                isCancelled = true;
                return;
              }

              if (!isInitializingRef.current) {
                console.log("[Naver Map Debug] Initialization flag is false right before new Map(), aborting...");
                isCancelled = true;
                return;
              }

              // 마지막 최종 확인: 취소되었거나 이미 초기화되었는지 확인 (new Map() 호출 직전)
              if (isCancelled) {
                console.log("[Naver Map Debug] Cancelled right before new Map() (final check), aborting...");
                return;
              }

              if (mapInstanceRef.current) {
                console.log("[Naver Map Debug] Map instance exists right before new Map() (final check), aborting...");
                setStatus("ready");
                isInitializingRef.current = false;
                isCancelled = true;
                return;
              }

              if ((container as any).__naver_map_instance__) {
                console.log("[Naver Map Debug] Container has map instance right before new Map() (final check), aborting...");
                mapInstanceRef.current = (container as any).__naver_map_instance__;
                setStatus("ready");
                isInitializingRef.current = false;
                isCancelled = true;
                return;
              }

              if (!isInitializingRef.current) {
                console.log("[Naver Map Debug] Initialization flag is false right before new Map() (final check), aborting...");
                isCancelled = true;
                return;
              }

              console.log("[Naver Map Debug] All checks passed, creating Map instance...");
              map = new Map(container, mapOptions);
              
              // 네이버 지도 인스턴스를 컨테이너에 저장 (중복 방지용)
              (container as any).__naver_map_instance__ = map;
              
              // 지도가 실제로 생성되었는지 확인
              if (!map) {
                throw new Error("Map object is null after initialization");
              }
              
              console.log("[Naver Map Debug] Map created successfully:", map);
              
              // React StrictMode 대응: 인스턴스 저장
              mapInstanceRef.current = map;
              markersRef.current = markers as unknown[];
              
              // 상태를 즉시 업데이트 (지도가 생성되었으므로)
              setStatus("ready");
              console.log("[Naver Map Debug] Map status set to ready");
              
              // 지도 인스턴스를 외부에 전달 (현재 위치 이동, 검색 등에 사용)
              onMapReady?.(map);
              
              // 초기화 완료 플래그 해제 및 취소 플래그 설정 (다른 초기화 시도 방지)
              isInitializingRef.current = false;
              isCancelled = true; // 이 초기화는 완료되었으므로 취소 플래그 설정
              
              // 인증 경고가 있어도 지도는 계속 사용 가능하도록 함
              // (네이버 지도는 인증 실패해도 지도 자체는 표시됨)
            } catch (err) {
              isInitializingRef.current = false; // 초기화 실패 시 플래그 해제
              console.error("[Naver Map Debug] Map initialization failed:", err);
              console.error("[Naver Map Debug] Error details:", {
                container: container,
                containerType: typeof container,
                isHTMLElement: container instanceof HTMLElement,
                naverMaps: window.naver?.maps,
                Map: window.naver?.maps?.Map,
              });
              setStatus("error");
              setErrorMsg(`지도 초기화 실패: ${err instanceof Error ? err.message : String(err)}`);
              return;
            }

            // 주변 장소 (파충류, 특수동물병원) - 지도가 성공적으로 초기화된 후에만 실행
            if (!map) return;

            // 네이버 검색 API가 설정되지 않은 경우를 대비해 에러 처리
            const keywords = ["파충류", "특수동물병원"];
            Promise.all(
              keywords.map((keyword) =>
                fetch(
                  `/api/places?keyword=${encodeURIComponent(keyword)}&x=${center.lng}&y=${center.lat}&radius=15000&size=15`
                )
                  .then((r) => {
                    if (!r.ok) {
                      console.warn(`[Naver Map Debug] Places API returned ${r.status} for "${keyword}". 네이버 검색 API가 활성화되지 않았을 수 있습니다.`);
                      return { places: [] };
                    }
                    return r.json();
                  })
                  .catch((err) => {
                    console.warn(`[Naver Map Debug] Places fetch failed for "${keyword}":`, err);
                    return { places: [] };
                  })
              )
            ).then((results) => {
              const placesById = new globalThis.Map<string, PlaceItem>();
              results.forEach((res: { places?: PlaceItem[] }) => {
                (res.places || []).forEach((p: PlaceItem) => {
                  if (!placesById.has(p.id)) placesById.set(p.id, p);
                });
              });
              const places = Array.from(placesById.values());
              onPlacesLoad?.(places);

              if (!map) return;
              places.forEach((p: PlaceItem) => {
                try {
                  const marker = new Marker({
                    position: new LatLng(parseFloat(p.y), parseFloat(p.x)),
                    map,
                  });
                  markers.push(marker);
                } catch (err) {
                  console.error("[Naver Map Debug] Marker creation failed:", err);
                }
              });
            });

            // 행사: /api/events → 지역명 지오코딩 후 마커
            fetch("/api/events")
              .then((r) => r.json())
              .then((data: { upcoming_events?: EventItem[] }) => {
                const events = data.upcoming_events || [];
                onEventsLoad?.(events);

                const withLocation = events.filter((e: EventItem) => e.location?.trim());
                Promise.all(
                  withLocation.map((e: EventItem) =>
                    fetch(`/api/geocode?query=${encodeURIComponent(e.location!)}`).then((r) => r.json()).catch(() => ({ lat: null, lng: null }))
                  )
                ).then((coordsList) => {
                  if (!map) return;
                  coordsList.forEach((coord: { lat: number | null; lng: number | null }, i: number) => {
                    if (coord.lat == null || coord.lng == null) return;
                    const e = withLocation[i];
                    try {
                      const marker = new Marker({
                        position: new LatLng(coord.lat, coord.lng),
                        map,
                      });
                      markers.push(marker);
                      naverEvent.addListener(marker, "click", () => {
                        window.open(e.source_url, "_blank");
                      });
                    } catch (err) {
                      console.error("[Naver Map Debug] Event marker creation failed:", err);
                    }
                  });
                });
              })
              .catch((err) => {
                console.error("[Naver Map Debug] Events fetch failed:", err);
              });
          };

          // checkContainer 호출 전에 최종 확인 - 이미 초기화되었으면 아예 호출하지 않음
          // 이 체크는 Promise.then 체인에서 비동기적으로 실행되므로 매우 중요함
          if (isCancelled) {
            console.log("[Naver Map Debug] Initialization cancelled before checkContainer call, skipping entirely...");
            return;
          }

          if (mapInstanceRef.current) {
            console.log("[Naver Map Debug] Map instance exists before checkContainer call, skipping entirely...");
            setStatus("ready");
            isInitializingRef.current = false;
            isCancelled = true;
            return;
          }

          if (!isInitializingRef.current) {
            console.log("[Naver Map Debug] Initialization flag is false before checkContainer call, skipping entirely...");
            isCancelled = true;
            return;
          }

          // 컨테이너가 이미 지도로 사용 중인지 확인
          if (containerRef.current && (containerRef.current as any).__naver_map_instance__) {
            console.log("[Naver Map Debug] Container already has map instance before checkContainer call, skipping entirely...");
            mapInstanceRef.current = (containerRef.current as any).__naver_map_instance__;
            setStatus("ready");
            isInitializingRef.current = false;
            isCancelled = true;
            return;
          }

          // checkContainer 호출 - 여기까지 왔다면 정말로 초기화가 필요한 경우임
          checkContainer();
        })
        .catch((err) => {
          if (!isCancelled) {
            isInitializingRef.current = false; // 초기화 실패 시 플래그 해제
            setStatus("error");
            const msg = err?.message || "지도를 불러오지 못했습니다.";
            setErrorMsg(msg);
          }
        });
    };

    init();

    return () => {
      // 취소 플래그 설정 (비동기 작업 취소)
      isCancelled = true;
      isInitializingRef.current = false;
      // React StrictMode에서는 cleanup이 두 번 실행될 수 있으므로
      // 실제로 컴포넌트가 언마운트될 때만 정리하도록 함
      // cleanup은 최소한으로만 수행 (마커만 제거, 지도는 유지)
      
      const markersToClean = markersRef.current || [];
      
      // 마커만 제거 (지도는 유지하여 재사용 가능하도록)
      markersToClean.forEach((marker) => {
        try {
          if (marker && typeof marker === "object" && "setMap" in marker) {
            (marker as { setMap: (map: null) => void }).setMap(null);
          }
        } catch (e) {
          // ignore cleanup errors
        }
      });

      // 검색 결과 마커도 제거
      const searchMarkersToClean = searchMarkersRef.current || [];
      searchMarkersToClean.forEach((marker) => {
        try {
          if (marker && typeof marker === "object" && "setMap" in marker) {
            (marker as { setMap: (map: null) => void }).setMap(null);
          }
        } catch (e) {
          // ignore cleanup errors
        }
      });
      
      // 마커 배열만 초기화 (지도 인스턴스는 유지)
      markersRef.current = [];
      searchMarkersRef.current = [];
      
      // 주의: mapInstanceRef와 containerRef는 유지하여 재사용 가능하도록 함
      // 실제 언마운트 시에는 브라우저가 자동으로 정리함
    };
  }, [mapKey, center.lat, center.lng, onPlacesLoad, onEventsLoad, onMapReady, searchResults]);

  // 검색 결과가 변경되면 지도에 마커 표시
  useEffect(() => {
    if (!mapInstanceRef.current || !window.naver?.maps) {
      return;
    }

    const { Marker, LatLng, event: naverEvent } = window.naver.maps;
    const map = mapInstanceRef.current as { setCenter?: (center: { lat: () => number; lng: () => number }) => void };

    // 기존 검색 결과 마커 제거
    searchMarkersRef.current.forEach((marker: unknown) => {
      try {
        if (marker && typeof marker === "object" && "setMap" in marker) {
          (marker as { setMap: (map: null) => void }).setMap(null);
        }
      } catch (e) {
        // ignore
      }
    });
    searchMarkersRef.current = [];

    // 검색 결과가 있으면 마커 생성
    if (searchResults && searchResults.length > 0) {
      searchResults.forEach((p) => {
        try {
          const marker = new Marker({
            position: new LatLng(parseFloat(p.y), parseFloat(p.x)),
            map: mapInstanceRef.current as unknown,
          });
          searchMarkersRef.current.push(marker);
          naverEvent.addListener(marker, "click", () => {
            window.open(p.place_url, "_blank");
          });
        } catch (err) {
          console.error("[Naver Map Debug] Search result marker creation failed:", err);
        }
      });

      // 첫 번째 검색 결과로 지도 중심 이동
      try {
        const firstResult = searchResults[0];
        const center = new LatLng(parseFloat(firstResult.y), parseFloat(firstResult.x));
        if (map.setCenter) {
          map.setCenter(center);
        }
      } catch (err) {
        console.error("[Naver Map Debug] Failed to move map center:", err);
      }
    }
  }, [searchResults]);

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-xl overflow-hidden bg-gray-100">
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/90">
          <p className="text-gray-600">지도 불러오는 중...</p>
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-amber-50 p-4 gap-4 overflow-auto">
          <p className="text-amber-800 text-sm text-center font-semibold">{errorMsg}</p>
          <div className="text-left text-xs text-amber-900 bg-amber-100/80 rounded-lg p-4 max-w-lg border border-amber-300">
            <p className="font-bold mb-3 text-base">네이버 지도 API 설정</p>
            <ol className="space-y-2 list-decimal list-inside">
              <li className="font-semibold">네이버 클라우드 플랫폼에서 클라이언트 ID 발급:
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1 font-normal">
                  <li><a href="https://console.ncloud.com/maps/application" target="_blank" rel="noopener" className="text-blue-600 underline">console.ncloud.com/maps/application</a></li>
                  <li>애플리케이션 등록 → <strong>Dynamic Map</strong> 선택</li>
                  <li>Client ID 복사</li>
                </ul>
              </li>
              <li className="font-semibold">.env.local 파일 설정:
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1 font-normal">
                  <li>파일 위치: <code className="bg-amber-200/80 px-1 rounded">lizard-web/.env.local</code></li>
                  <li><code className="bg-amber-200/80 px-1 rounded">NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_client_id_here</code></li>
                </ul>
              </li>
              <li className="font-semibold">Web 서비스 URL 등록 (중요! 230 에러 해결):
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1 font-normal">
                  <li>네이버 클라우드 플랫폼 → 내 애플리케이션 → <strong>Web 서비스 URL</strong>에 다음 중 하나 추가:</li>
                  <li className="ml-6"><code className="bg-amber-200/80 px-1 rounded">http://localhost:3000</code> 또는</li>
                  <li className="ml-6"><code className="bg-amber-200/80 px-1 rounded">http://127.0.0.1:3000</code> (권장)</li>
                  <li>⚠️ 포트 번호(<code className="bg-amber-200/80 px-1 rounded">:3000</code>)를 반드시 포함해야 합니다</li>
                  <li>⚠️ 경로나 URI는 제외하고 도메인만 등록 (예: <code className="bg-amber-200/80 px-1 rounded">http://127.0.0.1:3000</code>만, <code className="bg-amber-200/80 px-1 rounded">/</code> 제외)</li>
                  <li>배포 시에는 실제 도메인도 등록해야 합니다</li>
                  <li>URL 등록 후 1-2분 정도 기다려야 반영될 수 있습니다</li>
                </ul>
              </li>
              <li className="font-semibold">서버 재시작:
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1 font-normal">
                  <li>.env.local 저장 후 개발 서버 재시작 (Ctrl+C 후 npm run dev)</li>
                </ul>
              </li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
