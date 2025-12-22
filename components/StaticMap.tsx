import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Berth, Ship, SimulationPhase } from '../types';
import { X, Plus, Trash2, RotateCw, Download, Edit2, Maximize2, Minimize2 } from 'lucide-react';

interface StaticMapProps {
  className?: string;
  berths?: Berth[]; // 从 App 传入的泊位数据
  ships?: Ship[]; // 船舶数据，用于匹配检查和显示
  simulationPhase?: SimulationPhase; // 调度阶段
  processingShipIds?: string[]; // 正在处理的船舶ID列表
}

// 经纬度路径点数据结构
interface LatLngWaypoint {
  id: string;
  lat: number; // 纬度
  lng: number; // 经度
  headingDeg?: number; // 船头转向角度（度）
}

// 每个泊位的路径点配置（使用经纬度）
type BerthWaypointsLatLng = Record<string, LatLngWaypoint[]>;

// 泊位经纬度位置（初始值，可以从 localStorage 加载或手动设置）
type BerthPositionsLatLng = Record<string, { lat: number; lng: number }>;

const StaticMap: React.FC<StaticMapProps> = ({ className = '', berths = [], ships = [], simulationPhase, processingShipIds = [] }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map()); // 存储所有标记
  const polylinesRef = useRef<Map<string, any>>(new Map()); // 存储所有路径线
  const anchorageAreaRef = useRef<any>(null); // 存储锚地区域多边形
  const anchorageMarkersRef = useRef<Map<string, any>>(new Map()); // 存储锚位标记
  const shipMarkersRef = useRef<Map<string, any>>(new Map()); // 存储船舶标记
  const shipTrajectoryLinesRef = useRef<Map<string, any>>(new Map()); // 存储船舶轨迹线
  const shipIconCacheRef = useRef<Map<string, { rotation: number; isMoving: boolean }>>(new Map()); // 缓存船舶图标配置，避免频繁更新
  // 存储最新的berth数据映射，供tooltip函数使用
  const berthDataRef = useRef<Map<string, Berth>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const leafletLoadedRef = useRef(false);
  const [currentZoom, setCurrentZoom] = useState<number>(11); // 当前缩放级别
  const [isFullscreen, setIsFullscreen] = useState(false); // 全屏状态
  
  // 编辑状态
  const [editingBerthId, setEditingBerthId] = useState<string | null>(null);
  const [clickToAddMode, setClickToAddMode] = useState(false);
  const [berthWaypoints, setBerthWaypoints] = useState<BerthWaypointsLatLng>({});
  const [berthPositions, setBerthPositions] = useState<BerthPositionsLatLng>({});
  
  // 面板位置（相对于右侧边栏容器，使用 right 和 top）
  const [panelPosition, setPanelPosition] = useState<{ right: number; top: number }>({ 
    right: 20, // 距离右边缘20px
    top: 180  // 距离顶部180px
  });
  const [draggingPanel, setDraggingPanel] = useState(false);
  
  // 路径点拖拽状态（用于地图上的拖拽，类似PortMap的实现）
  const [draggingWaypoint, setDraggingWaypoint] = useState<{ berthId: string; waypointId: string } | null>(null);
  // 编辑面板中的路径点拖拽状态（用于输入框拖拽）
  const [draggingWaypointInput, setDraggingWaypointInput] = useState<{ berthId: string; waypointId: string; axis: 'lat' | 'lng' } | null>(null);
  // 存储拖拽起始值和起始鼠标位置（用于输入框拖拽）
  const draggingStartValueRef = useRef<number | null>(null);
  const draggingStartMouseYRef = useRef<number | null>(null);
  
  // 添加模式：'anchorage' | 'berth' | null
  const [addMode, setAddMode] = useState<'anchorage' | 'berth' | null>(null);
  
  // 动态添加的泊位数据（不在原始 berths 中的）
  const [dynamicBerths, setDynamicBerths] = useState<Berth[]>([]);
  
  // 自定义名称映射（berthId -> customName）
  const [berthCustomNames, setBerthCustomNames] = useState<Record<string, string>>({});
  
  // 管理面板显示状态
  const [showManagementPanel, setShowManagementPanel] = useState(false);
  const [managementPanelPosition, setManagementPanelPosition] = useState<{ x: number; y: number }>({ x: 20, y: 100 });
  const [draggingManagementPanel, setDraggingManagementPanel] = useState(false);
  
  // 根据泊位ID设置不同的长度和吃水深度
  // 顺序：B02 > A02 > C01 > B01 > A01
  const getBerthSpecs = (berthId: string): { length: number; depth: number } | null => {
    const specs: Record<string, { length: number; depth: number }> = {
      'B02': { length: 300, depth: 18.0 }, // 最大，可容纳16米吃水船舶（16+1=17米安全余量）
      'A02': { length: 250, depth: 13.5 },
      'C01': { length: 200, depth: 12.0 },
      'B01': { length: 150, depth: 10.5 },
      'A01': { length: 80, depth: 9.0 },   // 最小
    };
    return specs[berthId] || null; // 如果不是标准泊位，返回null
  };

  // 标准泊位的固定位置（经纬度坐标）
  // 注意：A01和A02需要不同的位置，否则会重叠
  const STANDARD_BERTH_POSITIONS: Record<string, { lat: number; lng: number }> = {
    'A01': { lat: 29.939986003172454, lng: 122.25445591754996 }, // 从日志中获取的实际位置
    'A02': { lat: 29.9405, lng: 122.2550 }, // A02需要不同的位置，避免与A01重叠
    'B01': { lat: 29.945192219631437, lng: 122.23852157592775 }, // 从日志中获取的实际位置
    'B02': { lat: 29.937085278663123, lng: 122.26444244384767 }, // 从日志中获取的实际位置
    'C01': { lat: 29.92536995390245, lng: 122.29190826416017 },  // 从日志中获取的实际位置
  };

  // 直接创建5个标准泊位（A01, A02, B01, B02, C01），忽略localStorage中的错误数据
  // 从berths prop中获取锚位
  const allBerths = useMemo(() => {
    const standardBerthIds = ['A01', 'A02', 'B01', 'B02', 'C01'];
    const standardBerths: Berth[] = standardBerthIds.map(id => {
      const specs = getBerthSpecs(id);
      if (!specs) {
        return null;
      }
      
      // 确定区域：A01/A02 -> A区, B01/B02 -> B区, C01 -> C区
      const zone = id.startsWith('A') ? 'A' : id.startsWith('B') ? 'B' : 'C';
      
      return {
        id,
        name: `${id} 泊位`,
        type: 'berth' as const,
        zone: zone as 'A' | 'B' | 'C',
        length: specs.length,
        depth: specs.depth,
        isOccupied: false,
      } as Berth;
    }).filter((b): b is Berth => b !== null);
    
    // 从berths prop中获取所有锚位
    const anchorages = berths.filter(b => b.type === 'anchorage');
    
    // 合并标准泊位和锚位
    return [...standardBerths, ...anchorages];
  }, [berths]); // 只依赖berths（用于锚位），不依赖dynamicBerths
  
  // 稳定依赖数组的键（避免依赖数组大小变化）
  const berthPositionsKeys = useMemo(() => Object.keys(berthPositions).sort().join(','), [berthPositions]);
  const berthWaypointsKeys = useMemo(() => Object.keys(berthWaypoints).sort().join(','), [berthWaypoints]);
  const berthCustomNamesKeys = useMemo(() => Object.keys(berthCustomNames).sort().join(','), [berthCustomNames]);
  
  // 稳定processingShipIds的引用，避免频繁重新渲染
  const processingShipIdsKey = useMemo(() => processingShipIds.sort().join(','), [processingShipIds]);
  
    // 稳定ships数组的引用（显示正在处理的船，以及已完成航行的船）
  const relevantShips = useMemo(() => {
    // 如果processingShipIds为空，仍然显示已完成航行的船舶（docked或anchored状态）
    if (!processingShipIds || processingShipIds.length === 0) {
      const filtered = ships.filter(s => s.status === 'docked' || s.status === 'anchored');
      console.log('[StaticMap] relevantShips (no processing):', filtered.map(s => `${s.id}(${s.status})`));
      return filtered;
    }
    // 显示正在处理的船，以及已完成航行的船（即使不在processingShipIds中）
    // 注意：anchored状态的船应该显示在锚位，docked状态的船显示在泊位
    const filtered = ships.filter(s => {
      // 如果船在processingShipIds中，总是显示
      if (processingShipIds.includes(s.id)) {
        return true;
      }
      // 如果船已经完成航行，显示（docked在泊位，anchored在锚位）
      if (s.status === 'docked' || s.status === 'anchored') {
        return true;
      }
      return false;
    });
    console.log('[StaticMap] relevantShips:', filtered.map(s => `${s.id}(${s.status}, assignedBerth:${s.assignedBerthId || 'none'}, assignedAnchorage:${s.assignedAnchorageId || 'none'})`), 'processingShipIds:', processingShipIds);
    return filtered;
  }, [ships, processingShipIdsKey]);
  
  // 稳定relevantShips的键值，避免依赖数组大小变化
  const relevantShipsKey = useMemo(() => {
    return relevantShips.map(s => s.id).sort().join(',');
  }, [relevantShips]);
  
  // 用于检测路径点内容变化的哈希值（当路径点内容变化时，这个值会变化）
  // 只在编辑的锚位路径点变化时才更新，避免频繁重新渲染
  const berthWaypointsHash = useMemo(() => {
    if (!editingBerthId) return '';
    const waypoints = berthWaypoints[editingBerthId] || [];
    // 使用路径点数量和ID来生成哈希，避免浮点数精度问题
    return `${editingBerthId}:${waypoints.length}:${waypoints.map(wp => wp.id).join(',')}`;
  }, [berthWaypoints, editingBerthId]);

  // 检查船舶是否可以匹配锚位（锚位深度需≥船舶吃水×1.2）
  const canShipFitAnchorage = (ship: Ship, anchorage: Berth): boolean => {
    return anchorage.depth >= ship.draft * 1.2;
  };

  // 检查船舶是否可以匹配泊位（泊位长度需≥船舶长度×1.1，且水深满足要求）
  const canShipFitBerth = (ship: Ship, berth: Berth): boolean => {
    // 长度约束：泊位长度需≥船舶长度×1.1
    if (berth.length < ship.length * 1.1) return false;
    // 吃水深度检查：泊位水深需≥船舶吃水+1米安全余量（UKC）
    const requiredDepth = ship.draft + 1.0; // 吃水 + 1米安全余量
    if (berth.depth < requiredDepth) return false;
    // 类型约束：油轮必须去A区
    if (ship.type === '油轮' && berth.zone !== 'A') return false;
    return true;
  };

  // 获取可以匹配锚位的船舶列表
  const getMatchingShipsForAnchorage = (anchorage: Berth): Ship[] => {
    return ships.filter(ship => canShipFitAnchorage(ship, anchorage));
  };

  // 获取可以匹配泊位的船舶列表
  const getMatchingShipsForBerth = (berth: Berth): Ship[] => {
    return ships.filter(ship => canShipFitBerth(ship, berth));
  };

  // 保存自定义名称到 localStorage
  const saveCustomNamesToStorage = (names: Record<string, string>) => {
    try {
      localStorage.setItem('berth-custom-names-latlng', JSON.stringify(names));
    } catch (e) {
      console.error('Failed to save custom names to storage:', e);
    }
  };

  // 从 public/waypoints/berth-waypoints-latlng.json 或 localStorage 加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        // 优先从 public/waypoints/berth-waypoints-latlng.json 加载
        const response = await fetch('/waypoints/berth-waypoints-latlng.json');
        if (response.ok) {
          const data = await response.json();
          console.log('[StaticMap] Loaded from public/waypoints/berth-waypoints-latlng.json');
          
          // 加载路径点
          if (data.waypoints) {
            setBerthWaypoints(data.waypoints);
            // 同步到 localStorage 以便后续编辑
            localStorage.setItem('berth-waypoints-latlng', JSON.stringify(data.waypoints));
          }
          
          // 加载位置
          if (data.positions) {
            setBerthPositions(data.positions);
            // 同步到 localStorage 以便后续编辑
            localStorage.setItem('berth-positions-latlng', JSON.stringify(data.positions));
          }
          
          // 加载自定义名称（如果有）
          if (data.customNames) {
            setBerthCustomNames(data.customNames);
            localStorage.setItem('berth-custom-names-latlng', JSON.stringify(data.customNames));
          }
          
          return; // 成功加载，直接返回
        }
      } catch (e) {
        console.warn('[StaticMap] Failed to load from public/waypoints/berth-waypoints-latlng.json, trying localStorage:', e);
      }
      
      // 如果 public 文件不存在或加载失败，从 localStorage 加载
      try {
        const storedWaypoints = localStorage.getItem('berth-waypoints-latlng');
        if (storedWaypoints) {
          const parsed = JSON.parse(storedWaypoints);
          setBerthWaypoints(parsed);
          console.log('[StaticMap] Loaded waypoints from localStorage');
        }
        
        const storedPositions = localStorage.getItem('berth-positions-latlng');
        if (storedPositions) {
          const parsed = JSON.parse(storedPositions);
          setBerthPositions(parsed);
          console.log('[StaticMap] Loaded positions from localStorage');
        }

        const storedNames = localStorage.getItem('berth-custom-names-latlng');
        if (storedNames) {
          const parsed = JSON.parse(storedNames);
          setBerthCustomNames(parsed);
          console.log('[StaticMap] Loaded custom names from localStorage');
        }
      } catch (e) {
        console.error('[StaticMap] Failed to load data from localStorage:', e);
      }
    };
    
    loadData();
  }, []);


  // 保存路径点到 localStorage
  const saveWaypointsToStorage = (waypoints: BerthWaypointsLatLng) => {
    try {
      localStorage.setItem('berth-waypoints-latlng', JSON.stringify(waypoints));
    } catch (e) {
      console.error('Failed to save waypoints to storage:', e);
    }
  };

  // 保存泊位位置到 localStorage
  const savePositionsToStorage = (positions: BerthPositionsLatLng) => {
    try {
      localStorage.setItem('berth-positions-latlng', JSON.stringify(positions));
    } catch (e) {
      console.error('Failed to save positions to storage:', e);
    }
  };

  // 导出路径点配置为 JSON 文件
  const exportWaypoints = (waypoints: BerthWaypointsLatLng, positions: BerthPositionsLatLng) => {
    try {
      const data = {
        waypoints,
        positions,
        exportTime: new Date().toISOString()
      };
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'berth-waypoints-latlng.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export waypoints:', e);
      alert('导出失败，请查看控制台错误信息');
    }
  };

  useEffect(() => {
    if (!mapRef.current) {
      console.warn('[StaticMap] mapRef.current 为空，等待容器准备就绪');
      return;
    }

    // 检查 Leaflet 是否已加载
    // @ts-ignore
    if (window.L && typeof window.L.map === 'function' && !mapInstanceRef.current) {
      console.log('[StaticMap] Leaflet 已存在，直接初始化地图');
      initializeMap();
      return;
    }

    // 如果 Leaflet 未加载，从本地文件加载（优先使用本地文件，避免 CDN 网络问题）
    if (!leafletLoadedRef.current) {
      // 检查是否已经加载了 CSS
      let link = document.querySelector('link[href*="leaflet.css"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'stylesheet';
        // 优先使用本地文件
        link.href = '/libs/leaflet/leaflet.css';
        link.onerror = () => {
          console.warn('[StaticMap] 本地 CSS 加载失败，尝试 CDN');
          // 备用 CDN
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          link.crossOrigin = 'anonymous';
        };
        document.head.appendChild(link);
      }

      // 检查是否已经加载了 JS
      let script = document.querySelector('script[src*="leaflet"]') as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        // 优先使用本地文件
        script.src = '/libs/leaflet/leaflet.js';
        script.async = true;
        
        // 添加超时检测
        const timeoutId = setTimeout(() => {
          if (!leafletLoadedRef.current) {
            console.warn('[StaticMap] 本地文件加载超时，尝试 CDN');
            script.remove();
            loadFallbackCDN();
          }
        }, 5000); // 5秒超时（本地文件应该很快）

        // 轮询检查 window.L 是否可用（某些环境下 onload 可能不触发）
        let checkCount = 0;
        const maxChecks = 30; // 最多检查30次（3秒，本地文件应该很快）
        const checkInterval = setInterval(() => {
          // @ts-ignore
          if (window.L && typeof window.L.map === 'function') {
            clearInterval(checkInterval);
            clearTimeout(timeoutId);
            console.log('[StaticMap] Leaflet 从本地文件通过轮询检测加载成功');
            leafletLoadedRef.current = true;
            setIsLoading(false);
            initializeMap();
          } else {
            checkCount++;
            if (checkCount >= maxChecks) {
              clearInterval(checkInterval);
              clearTimeout(timeoutId);
              console.warn('[StaticMap] 本地文件轮询超时，尝试 CDN');
              if (!leafletLoadedRef.current) {
                script.remove();
                loadFallbackCDN();
              }
            }
          }
        }, 100); // 每100ms检查一次

        script.onload = () => {
          clearTimeout(timeoutId);
          clearInterval(checkInterval);
          // 再次检查，确保 L 已定义
          // @ts-ignore
          if (window.L && typeof window.L.map === 'function') {
            console.log('[StaticMap] Leaflet 从本地文件通过 onload 加载成功');
            leafletLoadedRef.current = true;
            setIsLoading(false);
            initializeMap();
          } else {
            // 如果 onload 触发但 L 未定义，等待一小段时间后重试
            setTimeout(() => {
              // @ts-ignore
              if (window.L && typeof window.L.map === 'function') {
                console.log('[StaticMap] Leaflet 从本地文件延迟加载成功');
                leafletLoadedRef.current = true;
                setIsLoading(false);
                initializeMap();
              } else {
                console.error('[StaticMap] 本地文件加载完成，但 window.L 未定义，尝试 CDN');
                setIsLoading(false);
                loadFallbackCDN();
              }
            }, 500);
          }
        };
        
        script.onerror = () => {
          clearTimeout(timeoutId);
          clearInterval(checkInterval);
          console.warn('[StaticMap] 本地文件加载失败，尝试 CDN');
          script.remove();
          loadFallbackCDN();
        };
        
        document.body.appendChild(script);
      } else {
        // 脚本已存在，检查是否已加载完成
        // @ts-ignore
        if (window.L && typeof window.L.map === 'function') {
          leafletLoadedRef.current = true;
          setIsLoading(false);
          initializeMap();
        } else {
          // 如果脚本已存在但 L 未定义，等待加载完成
          let checkCount = 0;
          const maxChecks = 50;
          const checkInterval = setInterval(() => {
            // @ts-ignore
            if (window.L && typeof window.L.map === 'function') {
              clearInterval(checkInterval);
              leafletLoadedRef.current = true;
              setIsLoading(false);
              initializeMap();
            } else {
              checkCount++;
              if (checkCount >= maxChecks) {
                clearInterval(checkInterval);
                console.error('[StaticMap] 脚本已存在但加载超时');
                setIsLoading(false);
              }
            }
          }, 100);
          
          script.onload = () => {
            clearInterval(checkInterval);
            // @ts-ignore
            if (window.L && typeof window.L.map === 'function') {
              leafletLoadedRef.current = true;
              setIsLoading(false);
              initializeMap();
            } else {
              console.error('[StaticMap] 脚本加载完成，但 window.L 未定义');
              setIsLoading(false);
            }
          };
        }
      }
    }

    // 备用 CDN 加载函数（如果本地文件加载失败）
    function loadFallbackCDN() {
      if (leafletLoadedRef.current) return; // 如果已经加载成功，不再尝试
      
      console.log('[StaticMap] 开始从 CDN 加载 Leaflet');
      const fallbackScript = document.createElement('script');
      fallbackScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      fallbackScript.crossOrigin = 'anonymous';
      fallbackScript.async = true;
      
      // 备用 CDN 的超时检测
      const timeoutId = setTimeout(() => {
        if (!leafletLoadedRef.current) {
          console.error('[StaticMap] CDN 加载超时');
          setIsLoading(false);
          alert('地图库加载失败。\n\n已尝试：\n1. 本地文件（失败）\n2. CDN（超时）\n\n请检查网络连接或联系管理员。');
        }
      }, 10000);
      
      // 轮询检查
      let checkCount = 0;
      const maxChecks = 50;
      const checkInterval = setInterval(() => {
        // @ts-ignore
        if (window.L && typeof window.L.map === 'function') {
          clearInterval(checkInterval);
          clearTimeout(timeoutId);
          console.log('[StaticMap] Leaflet 从 CDN 通过轮询加载成功');
          leafletLoadedRef.current = true;
          setIsLoading(false);
          initializeMap();
        } else {
          checkCount++;
          if (checkCount >= maxChecks) {
            clearInterval(checkInterval);
            clearTimeout(timeoutId);
            console.error('[StaticMap] CDN 轮询超时');
            setIsLoading(false);
            alert('地图库加载失败。\n\n已尝试：\n1. 本地文件（失败）\n2. CDN（超时）\n\n请检查网络连接或联系管理员。');
          }
        }
      }, 100);
      
      fallbackScript.onload = () => {
        clearTimeout(timeoutId);
        clearInterval(checkInterval);
        // @ts-ignore
        if (window.L && typeof window.L.map === 'function') {
          console.log('[StaticMap] Leaflet 从 CDN 通过 onload 加载成功');
          leafletLoadedRef.current = true;
          setIsLoading(false);
          initializeMap();
        } else {
          setTimeout(() => {
            // @ts-ignore
            if (window.L && typeof window.L.map === 'function') {
              console.log('[StaticMap] Leaflet 从 CDN 延迟加载成功');
              leafletLoadedRef.current = true;
              setIsLoading(false);
              initializeMap();
            } else {
              console.error('[StaticMap] CDN 加载完成，但 window.L 未定义');
              setIsLoading(false);
            }
          }, 500);
        }
      };
      
      fallbackScript.onerror = () => {
        clearTimeout(timeoutId);
        clearInterval(checkInterval);
        console.error('[StaticMap] 所有加载方式都失败，地图无法显示');
        setIsLoading(false);
        alert('地图库加载失败。\n\n已尝试：\n1. 本地文件（失败）\n2. CDN（失败）\n\n请检查网络连接或联系管理员。');
      };
      
      document.body.appendChild(fallbackScript);
    }

    // 清理函数
    return () => {
      if (mapInstanceRef.current) {
        try {
          // 清理所有标记和路径线
          markersRef.current.forEach(marker => {
            mapInstanceRef.current.removeLayer(marker);
          });
          polylinesRef.current.forEach(polyline => {
            mapInstanceRef.current.removeLayer(polyline);
          });
          markersRef.current.clear();
          polylinesRef.current.clear();
          
          // 清理锚地区域
          if (anchorageAreaRef.current) {
            mapInstanceRef.current.removeLayer(anchorageAreaRef.current);
            anchorageAreaRef.current = null;
          }
          anchorageMarkersRef.current.forEach(marker => {
            mapInstanceRef.current.removeLayer(marker);
          });
          anchorageMarkersRef.current.clear();
          
          mapInstanceRef.current.remove();
        } catch (e) {
          console.warn('Error removing map:', e);
        }
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 马峙1号锚地区域坐标（度分秒转十进制度数）
  const maziAnchorageArea = {
    // A点：29°55′30.0″N，122°12′42.0″E
    A: { lat: 29 + 55/60 + 30/3600, lng: 122 + 12/60 + 42/3600 },
    // B点：29°55′30.0″N，122°16′30.0″E
    B: { lat: 29 + 55/60 + 30/3600, lng: 122 + 16/60 + 30/3600 },
    // C点：29°54′00.0″N，122°16′30.0″E
    C: { lat: 29 + 54/60, lng: 122 + 16/60 + 30/3600 },
    // D点：29°54′00.0″N，122°12′42.0″E
    D: { lat: 29 + 54/60, lng: 122 + 12/60 + 42/3600 }
  };

  // 锚位详细信息接口
  interface AnchorageInfo {
    lat: number;
    lng: number;
    draftRange: string; // 吃水深度范围
    dwtRange: string; // 载重吨范围
    lengthRange: string; // 容纳船长范围
  }

  // 马峙1号锚地锚位详细信息
  const maziAnchoragePositions: Record<string, AnchorageInfo> = {
    // Y6锚位：29°54′6.00″N，122°12′52.00″E
    Y6: {
      lat: 29 + 54/60 + 6/3600,
      lng: 122 + 12/60 + 52/3600,
      draftRange: '0 - 12.5m',
      dwtRange: '30000 - 190000吨',
      lengthRange: '0 - 1000m'
    },
    // Y7锚位：29°54′6.00″N，122°13′23.00″E
    Y7: {
      lat: 29 + 54/60 + 6/3600,
      lng: 122 + 13/60 + 23/3600,
      draftRange: '0 - 9.5m',
      dwtRange: '0 - 50000吨',
      lengthRange: '0 - 1000m'
    },
    // Y8锚位：29°54′7.00″N，122°13′51.00″E
    Y8: {
      lat: 29 + 54/60 + 7/3600,
      lng: 122 + 13/60 + 51/3600,
      draftRange: '0 - 8m',
      dwtRange: '30000 - 50000吨',
      lengthRange: '0 - 1000m'
    },
    // Y9锚位：29°54′32.00″N，122°12′53.00″E
    Y9: {
      lat: 29 + 54/60 + 32/3600,
      lng: 122 + 12/60 + 53/3600,
      draftRange: '0 - 12.5m',
      dwtRange: '30000 - 150000吨',
      lengthRange: '0 - 1000m'
    },
    // Y10锚位：29°54′33.00″N，122°13′28.00″E
    Y10: {
      lat: 29 + 54/60 + 33/3600,
      lng: 122 + 13/60 + 28/3600,
      draftRange: '0 - 8.5m',
      dwtRange: '20000 - 80000吨',
      lengthRange: '0 - 1000m'
    },
    // M7锚位：29°54′27.00″N，122°14′59.00″E
    M7: {
      lat: 29 + 54/60 + 27/3600,
      lng: 122 + 14/60 + 59/3600,
      draftRange: '0 - 9m',
      dwtRange: '2500 - 20000吨',
      lengthRange: '0 - 150m'
    },
    // 12锚位：29°55′0.00″N，122°13′18.00″E
    '12': {
      lat: 29 + 55/60,
      lng: 122 + 13/60 + 18/3600,
      draftRange: '0 - 8.5m',
      dwtRange: '20000 - 50000吨',
      lengthRange: '0 - 1000m'
    },
    // 13锚位：29°55′21.00″N，122°12′54.00″E
    '13': {
      lat: 29 + 55/60 + 21/3600,
      lng: 122 + 12/60 + 54/3600,
      draftRange: '0 - 8.5m',
      dwtRange: '20000 - 85000吨',
      lengthRange: '0 - 1000m'
    },
    // 14锚位：29°55′22.00″N，122°13′17.00″E
    '14': {
      lat: 29 + 55/60 + 22/3600,
      lng: 122 + 13/60 + 17/3600,
      draftRange: '0 - 7m',
      dwtRange: '0 - 50000吨',
      lengthRange: '0 - 1000m'
    },
    // 15锚位：29°55′22.00″N，122°13′47.00″E
    '15': {
      lat: 29 + 55/60 + 22/3600,
      lng: 122 + 13/60 + 47/3600,
      draftRange: '0 - 8m',
      dwtRange: '0 - 20000吨',
      lengthRange: '0 - 1000m'
    }
  };

  // 在地图上渲染泊位和路径点
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    // @ts-ignore
    const L: any = window.L;
    if (!L) return;

    // 清理旧的标记和路径线
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    polylinesRef.current.forEach(polyline => {
      mapInstanceRef.current.removeLayer(polyline);
    });
    markersRef.current.clear();
    polylinesRef.current.clear();

    // 清理锚地区域和锚位标记
    if (anchorageAreaRef.current) {
      mapInstanceRef.current.removeLayer(anchorageAreaRef.current);
      anchorageAreaRef.current = null;
    }
    anchorageMarkersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    anchorageMarkersRef.current.clear();

    // 绘制马峙1号锚地区域（虚线矩形）
    const areaBounds = [
      [maziAnchorageArea.A.lat, maziAnchorageArea.A.lng],
      [maziAnchorageArea.B.lat, maziAnchorageArea.B.lng],
      [maziAnchorageArea.C.lat, maziAnchorageArea.C.lng],
      [maziAnchorageArea.D.lat, maziAnchorageArea.D.lng],
      [maziAnchorageArea.A.lat, maziAnchorageArea.A.lng] // 闭合多边形
    ];

    const anchoragePolygon = L.polygon(areaBounds, {
      color: '#3b82f6',
      weight: 3,
      opacity: 0.8,
      fillColor: '#3b82f6',
      fillOpacity: 0.1,
      dashArray: '10, 5' // 虚线样式
    }).addTo(mapInstanceRef.current);

    // 添加区域标签
    const centerLat = (maziAnchorageArea.A.lat + maziAnchorageArea.C.lat) / 2;
    const centerLng = (maziAnchorageArea.A.lng + maziAnchorageArea.C.lng) / 2;
    const labelIcon = L.divIcon({
      className: 'anchorage-area-label',
      html: `<div style="
        background-color: rgba(59, 130, 246, 0.9);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-weight: bold;
        font-size: 12px;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">马峙1号锚地</div>`,
      iconSize: [100, 30],
      iconAnchor: [50, 15]
    });
    const labelMarker = L.marker([centerLat, centerLng], { icon: labelIcon })
      .addTo(mapInstanceRef.current);

    anchorageAreaRef.current = anchoragePolygon;
    markersRef.current.set('anchorage-area-label', labelMarker);

    // 获取当前缩放级别
    const currentMapZoom = mapInstanceRef.current.getZoom();
    const shouldShowAnchorageMarkers = currentMapZoom > 12;

    // 绘制锚位标记（始终创建，但根据缩放级别决定是否添加到地图）
    Object.keys(maziAnchoragePositions).forEach(anchorageId => {
      const info = maziAnchoragePositions[anchorageId];
      
      // 创建临时锚位对象用于匹配检查
      const tempAnchorage: Berth = {
        id: anchorageId,
        name: `马峙1号锚地 - ${anchorageId}`,
        type: 'anchorage',
        zone: 'A',
        length: 200, // 默认值
        depth: parseFloat(info.draftRange.split(' - ')[1]?.replace('m', '') || '8'), // 从吃水范围提取最大深度
        isOccupied: false
      };
      const matchingShips = getMatchingShipsForAnchorage(tempAnchorage);
      const maxDraft = tempAnchorage.depth / 1.2;
      
      // 检查是否有船占用此马峙锚位
      const isOccupied = ships.some(s => 
        (s.assignedAnchorageId === anchorageId && s.status === 'anchored') ||
        (s.assignedBerthId === anchorageId && s.status === 'anchored')
      );
      
      // 根据占用状态创建图标
      const icon = L.divIcon({
        className: 'mazi-anchorage-marker',
        html: `<div style="
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: ${isOccupied ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.3)'};
          border: ${isOccupied ? '3px solid #ef4444' : '2px solid #3b82f6'};
          box-shadow: ${isOccupied ? '0 2px 8px rgba(239, 68, 68, 0.8)' : '0 2px 8px rgba(59, 130, 246, 0.5)'};
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${isOccupied ? '#ef4444' : '#3b82f6'};
          font-weight: bold;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        ">${anchorageId}</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });
      
      // 检查是否已存在标记，如果存在则更新图标，否则创建新标记
      const existingMarker = anchorageMarkersRef.current.get(anchorageId);
      let marker;
      if (existingMarker) {
        marker = existingMarker;
        marker.setIcon(icon);
      } else {
        marker = L.marker([info.lat, info.lng], { icon });
      }
      
      // 只在hover时显示tooltip（物理信息）
      marker.bindTooltip(`
        <div style="font-weight: bold; margin-bottom: 4px; font-size: 13px;">
          马峙1号锚地 - ${anchorageId}
        </div>
        <div style="font-size: 11px; line-height: 1.5;">
          <div style="margin-bottom: 2px;">纬度: ${info.lat.toFixed(6)}°N</div>
          <div style="margin-bottom: 2px;">经度: ${info.lng.toFixed(6)}°E</div>
          <div style="margin-bottom: 2px;"><strong>吃水深度：</strong>${info.draftRange}</div>
          <div style="margin-bottom: 2px;"><strong>载重吨：</strong>${info.dwtRange}</div>
          <div style="margin-bottom: 2px;"><strong>容纳船长范围：</strong>${info.lengthRange}</div>
          <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.2);">
            <div style="font-size: 10px; color: #94a3b8;">最大可容纳吃水：${maxDraft.toFixed(1)}m</div>
          </div>
        </div>
      `, {
        permanent: false,
        direction: 'top',
        offset: [0, -10],
        className: 'anchorage-tooltip',
        opacity: 0.95
      });
      
      // 点击锚位时打开编辑面板（使用popupopen事件，避免与popup点击冲突）
      marker.on('popupopen', () => {
        // 延迟执行，确保popup已经打开
        setTimeout(() => {
          // 确保位置信息存在
          if (!berthPositions[anchorageId]) {
            setBerthPositions(prev => {
              const updated = { ...prev, [anchorageId]: { lat: info.lat, lng: info.lng } };
              savePositionsToStorage(updated);
              return updated;
            });
          }
        }, 100);
      });
      
      // 直接点击标记时也打开编辑面板
      marker.on('click', (e: any) => {
        e.originalEvent?.stopPropagation();
        // 确保位置信息存在
        if (!berthPositions[anchorageId]) {
          setBerthPositions(prev => {
            const updated = { ...prev, [anchorageId]: { lat: info.lat, lng: info.lng } };
            savePositionsToStorage(updated);
            return updated;
          });
        }
        setEditingBerthId(anchorageId);
        setAddMode(null);
        // 关闭popup，避免遮挡编辑面板
        marker.closePopup();
      });
      
      // 根据缩放级别决定是否添加到地图
      if (shouldShowAnchorageMarkers) {
        marker.addTo(mapInstanceRef.current);
      }

      // 鼠标悬浮时显示详细信息（使用tooltip）
      marker.bindTooltip(`
        <div style="font-weight: bold; margin-bottom: 4px; font-size: 13px;">
          锚位 ${anchorageId}
        </div>
        <div style="font-size: 11px; line-height: 1.5;">
          吃水: ${info.draftRange}<br/>
          载重: ${info.dwtRange}<br/>
          船长: ${info.lengthRange}
        </div>
      `, {
        permanent: false,
        direction: 'top',
        offset: [0, -10],
        className: 'anchorage-tooltip',
        opacity: 0.95
      });

      // 鼠标悬浮时改变标记样式
      marker.on('mouseover', function() {
        const newIcon = L.divIcon({
          className: 'mazi-anchorage-marker',
          html: `<div style="
            width: 45px;
            height: 45px;
            border-radius: 50%;
            background-color: rgba(59, 130, 246, 0.5);
            border: 3px solid #3b82f6;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #3b82f6;
            font-weight: bold;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s;
          ">${anchorageId}</div>`,
          iconSize: [45, 45],
          iconAnchor: [22.5, 22.5]
        });
        marker.setIcon(newIcon);
      });

      marker.on('mouseout', function() {
        // 恢复为当前占用状态对应的图标
        const isOccupiedNow = ships.some(s => 
          (s.assignedAnchorageId === anchorageId && s.status === 'anchored') ||
          (s.assignedBerthId === anchorageId && s.status === 'anchored')
        );
        const restoreIcon = L.divIcon({
          className: 'mazi-anchorage-marker',
          html: `<div style="
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: ${isOccupiedNow ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.3)'};
            border: ${isOccupiedNow ? '3px solid #ef4444' : '2px solid #3b82f6'};
            box-shadow: ${isOccupiedNow ? '0 2px 8px rgba(239, 68, 68, 0.8)' : '0 2px 8px rgba(59, 130, 246, 0.5)'};
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${isOccupiedNow ? '#ef4444' : '#3b82f6'};
            font-weight: bold;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
          ">${anchorageId}</div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });
        marker.setIcon(restoreIcon);
      });

      anchorageMarkersRef.current.set(anchorageId, marker);
      markersRef.current.set(`mazi-${anchorageId}`, marker);
    });

    // 不再需要根据缩放级别控制标记显示，统一使用圆点

    // 更新berth数据映射
    berthDataRef.current.clear();
    allBerths.forEach(berth => {
      berthDataRef.current.set(berth.id, berth);
    });

    // 不再输出调试日志，减少控制台输出

    // 渲染泊位位置
    allBerths.forEach(berth => {
      // 优先使用berthPositions中的位置，如果是标准泊位且没有位置，使用STANDARD_BERTH_POSITIONS
      let position = berthPositions[berth.id];
      if (!position && berth.type === 'berth' && STANDARD_BERTH_POSITIONS[berth.id]) {
        position = STANDARD_BERTH_POSITIONS[berth.id];
        // 保存到berthPositions中，以便后续使用
        setBerthPositions(prev => ({ ...prev, [berth.id]: position! }));
      }
      
      // 如果是锚位且没有位置，尝试从maziAnchoragePositions获取
      if (!position && berth.type === 'anchorage' && berth.id in maziAnchoragePositions) {
        const maziInfo = maziAnchoragePositions[berth.id];
        position = { lat: maziInfo.lat, lng: maziInfo.lng };
        // 保存到berthPositions中
        setBerthPositions(prev => ({ ...prev, [berth.id]: position! }));
      }
      
      if (!position) {
        console.warn(`[StaticMap] 泊位/锚位 ${berth.id} 没有位置信息，跳过渲染`);
        return;
      }
      
      // 不再输出调试日志

      // 创建泊位标记
      const isAnchorage = berth.type === 'anchorage';
      
      // 如果是马峙锚位，跳过（因为已经在上面单独渲染了蓝色标记）
      if (isAnchorage && berth.id in maziAnchoragePositions) {
        return;
      }
      
      if (isAnchorage) {
        // 锚位：使用圆形框，里面显示自定义名称或默认ID
        const displayName = berthCustomNames[berth.id] || berth.id;
        
        // 这个icon变量已不再使用，保留以避免潜在问题，但样式已更新为灰色

        // 获取可以匹配的船舶
        const matchingShips = getMatchingShipsForAnchorage(berth);
        const maxDraft = berth.depth / 1.2; // 最大可容纳吃水深度
        
        // 检查是否有船占用此锚位
        const isOccupied = berth.isOccupied || ships.some(s => 
          (s.assignedAnchorageId === berth.id && s.status === 'anchored') ||
          (s.assignedBerthId === berth.id && s.status === 'anchored')
        );
        
        // 锚位标记：统一使用小圆点，占用时显示红色
        const finalIcon = L.divIcon({
          className: 'custom-marker-anchorage-small',
          html: `<div style="
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: ${isOccupied ? '#ef4444' : '#666'};
            border: 1px solid white;
            cursor: pointer;
            box-shadow: ${isOccupied ? '0 0 4px rgba(239, 68, 68, 0.8)' : 'none'};
          "></div>`,
          iconSize: [8, 8],
          iconAnchor: [4, 4]
        });
        
        // 检查是否已存在标记，如果存在则更新图标和tooltip，否则创建新标记
        const existingMarker = markersRef.current.get(`berth-${berth.id}`);
        let marker;
        if (existingMarker) {
          marker = existingMarker;
          marker.setIcon(finalIcon);
          // 更新位置（以防位置变化）
          marker.setLatLng([position.lat, position.lng]);
        } else {
          marker = L.marker([position.lat, position.lng], { icon: finalIcon });
        }
        
        // 移除tooltip，改用点击显示popup
        if (marker.getTooltip()) {
          marker.unbindTooltip();
        }
        
        
        // 根据缩放级别决定是否添加到地图（锚位始终显示，但图标大小不同）
        marker.addTo(mapInstanceRef.current);

        // 点击时先显示信息，然后打开编辑面板
        // 使用立即执行函数捕获正确的berth.id，避免闭包问题
        marker.off('click'); // 移除之前可能存在的点击事件
        ((berthId: string) => {
          marker.on('click', (e: any) => {
            e.originalEvent?.stopPropagation();
            // 从allBerths中获取最新的berth数据
            const latestBerth = allBerths.find(b => b.id === berthId);
            if (!latestBerth) {
              console.warn(`[StaticMap] 找不到锚位 ${berthId}`);
              return;
            }
            
            // 先显示popup（如果还没有显示）
            if (!marker.isPopupOpen()) {
              const currentMaxDraft = latestBerth.depth / 1.2;
              const displayName = berthCustomNames[berthId] || berthId;
              marker.bindPopup(`
                <div style="font-weight: bold; margin-bottom: 4px; font-size: 13px;">
                  锚位 ${displayName}
                </div>
                <div style="font-size: 11px; line-height: 1.5;">
                  <div style="margin-bottom: 2px;"><strong>区域：</strong>${latestBerth.zone === 'A' ? '深水区' : latestBerth.zone === 'B' ? '通用区' : '支线区'}</div>
                  <div style="margin-bottom: 2px;"><strong>长度：</strong>${latestBerth.length}m</div>
                  <div style="margin-bottom: 2px;"><strong>水深：</strong>${latestBerth.depth}m</div>
                  <div style="margin-bottom: 2px;"><strong>最大可容纳吃水：</strong>${currentMaxDraft.toFixed(1)}m</div>
                  <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.2);">
                    <div style="font-size: 10px; color: #94a3b8;">匹配规则：水深 ≥ 船舶吃水 × 1.2</div>
                  </div>
                </div>
              `, {
                className: 'berth-popup',
                closeButton: true
              }).openPopup();
            }
            // 延迟打开编辑面板，让用户先看到信息
            setTimeout(() => {
              setEditingBerthId(berthId);
              setAddMode(null); // 退出添加模式
            }, 100);
          });
        })(berth.id); // 立即执行，捕获正确的berth.id

        markersRef.current.set(`berth-${berth.id}`, marker);
      } else {
        // 泊位：统一使用圆点，显示泊位ID标识
        // 获取可以匹配的船舶
        const matchingShips = getMatchingShipsForBerth(berth);
        const maxLength = berth.length / 1.1; // 最大可容纳船长
        const displayName = berthCustomNames[berth.id] || berth.id;
        
        // 检查是否有船占用此泊位：只有当船真正靠泊（docked）时才显示为占用
        const isOccupied = berth.isOccupied || ships.some(s => 
          s.assignedBerthId === berth.id && s.status === 'docked'
        );
        
        // 泊位标记：使用小圆点，显示泊位ID标识，占用时显示橙色
        const finalIcon = L.divIcon({
          className: 'custom-marker-berth-small',
          html: `<div style="
            position: relative;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background-color: ${isOccupied ? '#f97316' : '#22c55e'};
            border: 2px solid white;
            box-shadow: ${isOccupied ? '0 0 4px rgba(249, 115, 22, 0.8)' : '0 0 0 1px rgba(34, 197, 94, 0.3)'};
            cursor: pointer;
          ">
            <div style="
              position: absolute;
              top: -18px;
              left: 50%;
              transform: translateX(-50%);
              background-color: rgba(0, 0, 0, 0.8);
              color: white;
              font-size: 10px;
              font-weight: bold;
              padding: 2px 4px;
              border-radius: 3px;
              white-space: nowrap;
              pointer-events: none;
              z-index: 1000;
            ">${displayName}</div>
          </div>`,
          iconSize: [10, 10],
          iconAnchor: [5, 5]
        });
        
        // 检查是否已存在标记，如果存在则更新图标和tooltip，否则创建新标记
        const existingMarker = markersRef.current.get(`berth-${berth.id}`);
        let marker;
        if (existingMarker) {
          marker = existingMarker;
          // 验证marker是否属于当前berth（检查位置是否匹配）
          const markerPos = marker.getLatLng();
          const posMatch = Math.abs(markerPos.lat - position.lat) < 0.0001 && Math.abs(markerPos.lng - position.lng) < 0.0001;
          if (!posMatch) {
            console.warn(`[StaticMap] 警告：泊位 ${berth.id} 的marker位置不匹配！marker位置=(${markerPos.lat}, ${markerPos.lng}), 期望位置=(${position.lat}, ${position.lng})`);
            // 如果位置不匹配，创建新的marker
            if (mapInstanceRef.current && mapInstanceRef.current.hasLayer(marker)) {
              mapInstanceRef.current.removeLayer(marker);
            }
            marker = L.marker([position.lat, position.lng], { icon: finalIcon });
          } else {
            marker.setIcon(finalIcon);
            // 更新位置（以防位置变化）
            marker.setLatLng([position.lat, position.lng]);
          }
        } else {
          marker = L.marker([position.lat, position.lng], { icon: finalIcon });
        }
        
        // 在marker上存储berth.id，避免闭包问题
        // @ts-ignore
        marker._berthId = berth.id;
        
        // 移除popup，改用悬停显示tooltip
        if (marker.getPopup()) {
          marker.unbindPopup();
        }
        marker.off('click'); // 移除点击事件
        
        // 根据缩放级别决定是否添加到地图（泊位始终显示，但图标大小不同）
        marker.addTo(mapInstanceRef.current);

        // 使用悬停显示tooltip，而不是点击popup
        // 使用立即执行函数捕获正确的berth.id，避免闭包问题
        ((berthId: string) => {
          // 从allBerths中获取最新的berth数据（确保使用标准规格）
          const latestBerth = allBerths.find(b => b.id === berthId);
          if (!latestBerth) {
            return;
          }
          
          const currentMaxLength = latestBerth.length / 1.1;
          const displayName = berthCustomNames[berthId] || berthId;
          
          marker.bindTooltip(`
            <div style="font-weight: bold; margin-bottom: 4px; font-size: 13px; text-align: center;">
              泊位 ${displayName}
            </div>
            <div style="font-size: 11px; line-height: 1.5;">
              <div style="margin-bottom: 2px;"><strong>区域：</strong>${latestBerth.zone === 'A' ? '深水区' : latestBerth.zone === 'B' ? '通用区' : '支线区'}</div>
              <div style="margin-bottom: 2px;"><strong>长度：</strong>${latestBerth.length}m</div>
              <div style="margin-bottom: 2px;"><strong>水深：</strong>${latestBerth.depth}m</div>
              <div style="margin-bottom: 2px;"><strong>最大可容纳船长：</strong>${currentMaxLength.toFixed(0)}m</div>
              <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.2);">
                <div style="font-size: 10px; color: #94a3b8;">匹配规则：泊位长度 ≥ 船舶长度 × 1.1</div>
              </div>
            </div>
          `, {
            permanent: false,
            direction: 'top',
            offset: [0, -10],
            className: 'berth-tooltip',
            opacity: 0.95
          });
        })(berth.id); // 立即执行，捕获正确的berth.id

        markersRef.current.set(`berth-${berth.id}`, marker);
      }
    });

    // 渲染路径点和路径线（仅锚位需要路径点，泊位不需要）
    // 只在编辑面板打开时显示路径点和路径线
    // 和调度地图逻辑一致：起步位置 -> 路径点1 -> 路径点2 -> ... -> 锚位
    Object.keys(berthWaypoints).forEach(berthId => {
      const waypoints = berthWaypoints[berthId];
      if (waypoints.length === 0) return;

      const berthPos = berthPositions[berthId];
      
      // 只在编辑面板打开且当前编辑的是这个锚位时才显示路径点
      if (editingBerthId !== berthId) return;
      
      // 如果没有泊位位置，尝试使用马峙锚位位置或默认位置
      let finalBerthPos = berthPos;
      if (!finalBerthPos) {
        // 检查是否是马峙锚位
        const maziInfo = maziAnchoragePositions[berthId];
        if (maziInfo) {
          finalBerthPos = { lat: maziInfo.lat, lng: maziInfo.lng };
        } else {
          // 如果没有位置信息，使用第一个路径点的位置作为参考，或者使用默认位置
          if (waypoints.length > 0) {
            finalBerthPos = { lat: waypoints[0].lat, lng: waypoints[0].lng };
          } else {
            finalBerthPos = { lat: 29.89563, lng: 122.27685 };
          }
        }
      }
      
      if (!finalBerthPos) return;

      // 只对锚位显示路径点，泊位不需要路径点
      // 检查是否是动态添加的锚位
      const berth = allBerths.find(b => b.id === berthId);
      // 检查是否是马峙锚位
      const isMaziAnchorage = berthId in maziAnchoragePositions;
      
      // 如果是动态添加的泊位，则不需要路径点
      if (berth && berth.type !== 'anchorage') return;
      
      // 如果既不是动态锚位也不是马峙锚位，则不显示路径点
      if (!berth && !isMaziAnchorage) return;

      // 去重：确保每个ID只出现一次
      const uniqueWaypoints = waypoints.filter((wp, index, self) => 
        index === self.findIndex(w => w.id === wp.id)
      );
      
      // 如果去重后数量不同，说明有重复，需要修复
      if (uniqueWaypoints.length !== waypoints.length) {
        console.warn(`[Waypoints] Found duplicate waypoints for ${berthId} in map rendering, fixing...`);
        setBerthWaypoints(prev => {
          const newWaypoints = { ...prev };
          newWaypoints[berthId] = uniqueWaypoints;
          saveWaypointsToStorage(newWaypoints);
          return newWaypoints;
        });
        return; // 跳过本次渲染，等待状态更新后重新渲染
      }

      // 只清理不在当前路径点列表中的旧标记，保留现有的标记（避免拖拽失效）
      const currentWaypointIds = new Set(uniqueWaypoints.map(wp => wp.id));
      markersRef.current.forEach((marker, key) => {
        if (key.startsWith(`waypoint-${berthId}-`)) {
          const waypointId = key.replace(`waypoint-${berthId}-`, '');
          // 如果这个路径点不在当前列表中，才删除
          if (!currentWaypointIds.has(waypointId)) {
            mapInstanceRef.current.removeLayer(marker);
            markersRef.current.delete(key);
          }
        }
      });

      // 创建路径点数组：第一个路径点是船的起步位置，然后依次是中间路径点，最后到达锚位/泊位
      // 路径：起步位置(点1) -> 路径点2 -> 路径点3 -> ... -> 锚位/泊位位置
      const pathPoints = [
        ...uniqueWaypoints.map(wp => {
          // 优先使用标记的当前位置（如果标记存在）
          const markerKey = `waypoint-${berthId}-${wp.id}`;
          const waypointMarker = markersRef.current.get(markerKey);
          if (waypointMarker) {
            const pos = waypointMarker.getLatLng();
            return [pos.lat, pos.lng] as [number, number];
          }
          return [wp.lat, wp.lng] as [number, number];
        }),
        [finalBerthPos.lat, finalBerthPos.lng] as [number, number]
      ];

      // 更新或创建路径线（蓝色虚线，和调度地图一致）
      const oldPolyline = polylinesRef.current.get(`path-${berthId}`);
      if (oldPolyline) {
        // 如果路径线已存在，只更新路径点
        oldPolyline.setLatLngs(pathPoints);
      } else {
        // 如果路径线不存在，创建新的
        const polyline = L.polyline(pathPoints, {
          color: '#38bdf8',
          weight: 3,
          opacity: 0.8,
          dashArray: '6, 4'
        }).addTo(mapInstanceRef.current);
        polylinesRef.current.set(`path-${berthId}`, polyline);
      }

      // 绘制路径点标记（红色圆点，带序号，可拖拽）
      uniqueWaypoints.forEach((wp, index) => {
        const markerKey = `waypoint-${berthId}-${wp.id}`;
        const existingMarker = markersRef.current.get(markerKey);
        
        // 如果标记已存在，只更新位置（避免重新创建导致拖拽失效）
        if (existingMarker) {
          const currentPos = existingMarker.getLatLng();
          // 如果位置有变化，更新位置（但只在位置差异较大时更新，避免拖拽时被重置）
          const latDiff = Math.abs(currentPos.lat - wp.lat);
          const lngDiff = Math.abs(currentPos.lng - wp.lng);
          // 只有当位置差异较大（超过0.0001度，约11米）时才更新，避免拖拽时被重置
          if (latDiff > 0.0001 || lngDiff > 0.0001) {
            existingMarker.setLatLng([wp.lat, wp.lng]);
          }
          // 不更新弹窗内容，避免频繁更新
          return; // 跳过创建，使用现有标记
        }
        
        const waypointIcon = L.divIcon({
          className: 'waypoint-marker',
          html: `<div style="
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background-color: #ef4444;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(239, 68, 68, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
            cursor: move;
            transition: all 0.2s;
          ">${index + 1}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        // 创建标记（不使用 Leaflet 原生 draggable，改用自定义拖拽，类似PortMap）
        const wpMarker = L.marker([wp.lat, wp.lng], { 
          icon: waypointIcon,
          draggable: false, // 禁用 Leaflet 原生拖拽，使用自定义拖拽
          zIndexOffset: 1000
        })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div style="font-weight: bold; margin-bottom: 4px;">
              路径点 ${index + 1}
            </div>
            <div style="font-size: 12px;">
              纬度: ${wp.lat.toFixed(6)}<br/>
              经度: ${wp.lng.toFixed(6)}<br/>
              <span style="color: #3b82f6; font-size: 10px;">可拖拽移动</span>
            </div>
          `);

        // 移除之前可能存在的所有事件监听器
        wpMarker.off();
        
        // 鼠标按下时开始拖拽（类似PortMap的实现）
        wpMarker.on('mousedown', (e: any) => {
          e.originalEvent?.stopPropagation();
          e.originalEvent?.preventDefault();
          // 禁用地图拖拽，防止拖动路径点时地图也被拖动
          if (mapInstanceRef.current && mapInstanceRef.current.dragging) {
            mapInstanceRef.current.dragging.disable();
          }
          // 设置拖拽状态（地图上的拖拽，没有axis属性）
          setDraggingWaypoint({ berthId, waypointId: wp.id });
        });
        
        // 点击时显示弹窗
        wpMarker.on('click', (e: any) => {
          e.originalEvent?.stopPropagation();
        });

        // 鼠标悬停时改变样式（增大尺寸，更容易点击）
        wpMarker.on('mouseover', () => {
          const newIcon = L.divIcon({
            className: 'waypoint-marker',
            html: `<div style="
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background-color: #dc2626;
              border: 3px solid white;
              box-shadow: 0 4px 16px rgba(239, 68, 68, 0.9);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 13px;
              cursor: move;
              transition: all 0.2s;
            ">${index + 1}</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });
          wpMarker.setIcon(newIcon);
        });

        wpMarker.on('mouseout', () => {
          wpMarker.setIcon(waypointIcon);
        });

        markersRef.current.set(`waypoint-${berthId}-${wp.id}`, wpMarker);
      });
    });

    // 暴露编辑函数到全局（用于弹窗按钮）
    // @ts-ignore
    window.editBerth = (berthId: string) => {
      setEditingBerthId(berthId);
    };
    
    // 暴露编辑马峙锚位函数到全局
    // @ts-ignore
    window.editMaziAnchorage = (anchorageId: string) => {
      const info = maziAnchoragePositions[anchorageId];
      if (info) {
        // 确保位置信息存在
        if (!berthPositions[anchorageId]) {
          setBerthPositions(prev => {
            const updated = { ...prev, [anchorageId]: { lat: info.lat, lng: info.lng } };
            savePositionsToStorage(updated);
            return updated;
          });
        }
        setEditingBerthId(anchorageId);
        setAddMode(null);
      }
    };

    // 在锚位标记创建后，设置缩放监听器和初始显示状态
    if (anchorageMarkersRef.current.size > 0 && mapInstanceRef.current) {
      const map = mapInstanceRef.current;
      const currentMapZoom = map.getZoom();
      setCurrentZoom(currentMapZoom);
      
      // 根据当前缩放级别设置锚位标记的显示状态（缩放级别 > 12 时才显示）
      const shouldShow = currentMapZoom > 12;
      anchorageMarkersRef.current.forEach(marker => {
        if (shouldShow) {
          if (!map.hasLayer(marker)) {
            marker.addTo(map);
          }
        } else {
          if (map.hasLayer(marker)) {
            map.removeLayer(marker);
          }
        }
      });
    }
    }, [allBerths, berthPositionsKeys, berthWaypointsKeys, berthWaypointsHash, berthCustomNamesKeys, editingBerthId, ships, processingShipIds]);

  // 监听缩放级别变化，更新泊位标记（现在统一使用圆点，不再需要根据缩放级别改变）
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    // @ts-ignore
    const L: any = window.L;
    if (!L) return;
    
    // 更新泊位标记（统一使用圆点）
    markersRef.current.forEach((marker, key) => {
      if (key.startsWith('berth-')) {
        const berthId = key.replace('berth-', '');
        const berth = allBerths.find(b => b.id === berthId);
        if (berth) {
          const displayName = berthCustomNames[berthId] || berthId;
          if (berth.type === 'anchorage') {
            // 锚位标记：统一使用小圆点
            const newIcon = L.divIcon({
              className: 'custom-marker-anchorage-small',
              html: `<div style="
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background-color: #666;
                border: 1px solid white;
                cursor: pointer;
              "></div>`,
              iconSize: [8, 8],
              iconAnchor: [4, 4]
            });
            marker.setIcon(newIcon);
          } else {
            // 泊位标记：统一使用小圆点，显示泊位ID标识
            const isOccupiedNow = berth.isOccupied || ships.some(s => 
              s.assignedBerthId === berthId && s.status === 'docked'
            );
            const newIcon = L.divIcon({
              className: 'custom-marker-berth-small',
              html: `<div style="
                position: relative;
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background-color: ${isOccupiedNow ? '#f97316' : '#22c55e'};
                border: 2px solid white;
                box-shadow: ${isOccupiedNow ? '0 0 4px rgba(249, 115, 22, 0.8)' : '0 0 0 1px rgba(34, 197, 94, 0.3)'};
                cursor: pointer;
              ">
                <div style="
                  position: absolute;
                  top: -18px;
                  left: 50%;
                  transform: translateX(-50%);
                  background-color: rgba(0, 0, 0, 0.8);
                  color: white;
                  font-size: 10px;
                  font-weight: bold;
                  padding: 2px 4px;
                  border-radius: 3px;
                  white-space: nowrap;
                  pointer-events: none;
                  z-index: 1000;
                ">${displayName}</div>
              </div>`,
              iconSize: [10, 10],
              iconAnchor: [5, 5]
            });
            marker.setIcon(newIcon);
          }
        }
      }
    });
  }, [currentZoom, allBerths, berthCustomNames]);

  // 监听地图缩放事件，控制锚位标记的显示/隐藏
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    
    const handleZoomEnd = () => {
      const zoom = map.getZoom();
      setCurrentZoom(zoom);
      
      // 根据缩放级别显示/隐藏锚位标记（缩放级别 > 11 时才显示）
      const shouldShow = zoom > 11;
      
      anchorageMarkersRef.current.forEach(marker => {
        if (shouldShow) {
          // 如果应该显示但当前未显示，则添加到地图
          if (!map.hasLayer(marker)) {
            marker.addTo(map);
          }
        } else {
          // 如果不应该显示但当前显示，则从地图移除
          if (map.hasLayer(marker)) {
            map.removeLayer(marker);
          }
        }
      });
    };
    
    // 监听缩放事件
    map.on('zoomend', handleZoomEnd);

    return () => {
      if (map) {
        map.off('zoomend', handleZoomEnd);
      }
    };
  }, []);

  // 渲染船舶和轨迹线
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    // @ts-ignore
    const L: any = window.L;
    if (!L) return;

    // 使用稳定的relevantShips，避免重复过滤
    const visibleShips = relevantShips;
    
    // 调试日志
    if (visibleShips.length === 0 && shipMarkersRef.current.size > 0) {
      console.log('[StaticMap] Warning: visibleShips is empty but shipMarkersRef has', shipMarkersRef.current.size, 'markers:', Array.from(shipMarkersRef.current.keys()));
    }
    
    // 清理不再需要的船舶标记和轨迹线（只清理不在visibleShips中的）
    const visibleShipIds = new Set(visibleShips.map(s => s.id));
    
    // 如果visibleShips为空，清理所有船舶标记和轨迹线
    if (visibleShips.length === 0) {
      console.log('[StaticMap] Clearing all ship markers, visibleShips is empty');
      // 清理所有船舶标记
      const allShipIds = Array.from(shipMarkersRef.current.keys());
      console.log('[StaticMap] Ship markers to remove:', allShipIds);
      allShipIds.forEach(shipId => {
        const marker = shipMarkersRef.current.get(shipId);
        if (marker) {
          try {
            // 强制移除标记，使用多种方法确保删除
            if (mapInstanceRef.current) {
              // 方法1: 使用hasLayer检查后移除
              if (mapInstanceRef.current.hasLayer(marker)) {
                mapInstanceRef.current.removeLayer(marker);
              }
              // 方法2: 直接尝试移除（即使hasLayer返回false）
              try {
                mapInstanceRef.current.removeLayer(marker);
              } catch (e) {
                // 忽略错误，可能已经移除了
              }
            }
            // 方法3: 直接调用marker的remove方法
            if (marker.remove && typeof marker.remove === 'function') {
              try {
                marker.remove();
              } catch (e) {
                // 忽略错误
              }
            }
            console.log(`[StaticMap] Removed ship marker: ${shipId}`);
          } catch (e) {
            console.error(`Error removing ship marker ${shipId}:`, e);
          }
        }
      });
      shipMarkersRef.current.clear();
      shipIconCacheRef.current.clear(); // 清理图标缓存
      
      // 清理所有轨迹线
      const allTrajectoryIds = Array.from(shipTrajectoryLinesRef.current.keys());
      allTrajectoryIds.forEach(shipId => {
        const line = shipTrajectoryLinesRef.current.get(shipId);
        if (line) {
          try {
            if (mapInstanceRef.current && mapInstanceRef.current.hasLayer(line)) {
              mapInstanceRef.current.removeLayer(line);
            }
          } catch (e) {
            console.error(`Error removing trajectory line ${shipId}:`, e);
          }
        }
      });
      shipTrajectoryLinesRef.current.clear();
      return; // 提前返回，不执行后续的渲染逻辑
    } else {
      // 清理所有不在visibleShips中的船舶标记，以及所有waiting状态的船舶标记
      const shipIdsToRemove: string[] = [];
      shipMarkersRef.current.forEach((marker, shipId) => {
        // 只清理不在visibleShips中的标记（waiting状态的船现在也要显示）
        if (!visibleShipIds.has(shipId)) {
          try {
            // 强制移除标记，使用多种方法确保删除
            if (mapInstanceRef.current) {
              if (mapInstanceRef.current.hasLayer(marker)) {
                mapInstanceRef.current.removeLayer(marker);
              }
              // 即使hasLayer返回false，也尝试移除
              try {
                mapInstanceRef.current.removeLayer(marker);
              } catch (e) {
                // 忽略错误
              }
            }
            // 直接调用marker的remove方法
            if (marker.remove && typeof marker.remove === 'function') {
              try {
                marker.remove();
              } catch (e) {
                // 忽略错误
              }
            }
            console.log(`[StaticMap] Removed ship marker ${shipId} - not in visibleShips`);
            shipIdsToRemove.push(shipId);
          } catch (e) {
            console.error(`Error removing ship marker ${shipId}:`, e);
            shipIdsToRemove.push(shipId);
          }
        }
      });
      shipIdsToRemove.forEach(shipId => {
        shipMarkersRef.current.delete(shipId);
        shipIconCacheRef.current.delete(shipId); // 清理图标缓存
      });
      
      // 清理所有不在visibleShips中的轨迹线
      const trajectoryIdsToRemove: string[] = [];
      shipTrajectoryLinesRef.current.forEach((line, shipId) => {
        if (!visibleShipIds.has(shipId)) {
          try {
            if (mapInstanceRef.current && mapInstanceRef.current.hasLayer(line)) {
              mapInstanceRef.current.removeLayer(line);
            }
            trajectoryIdsToRemove.push(shipId);
          } catch (e) {
            console.error(`Error removing trajectory line ${shipId}:`, e);
            trajectoryIdsToRemove.push(shipId);
          }
        }
      });
      trajectoryIdsToRemove.forEach(shipId => {
        shipTrajectoryLinesRef.current.delete(shipId);
      });
    }

    // 强制清理：确保所有不在processingShipIds中的标记都被删除
    if (processingShipIds && processingShipIds.length > 0) {
      const processingShipIdsSet = new Set(processingShipIds);
      const forceRemoveShipIds: string[] = [];
      shipMarkersRef.current.forEach((marker, shipId) => {
        if (!processingShipIdsSet.has(shipId)) {
          console.log(`[StaticMap] Force removing ship marker ${shipId} - not in processingShipIds`);
          try {
            if (mapInstanceRef.current) {
              if (mapInstanceRef.current.hasLayer(marker)) {
                mapInstanceRef.current.removeLayer(marker);
              }
              try {
                mapInstanceRef.current.removeLayer(marker);
              } catch (e) {}
            }
            if (marker.remove && typeof marker.remove === 'function') {
              try {
                marker.remove();
              } catch (e) {}
            }
          } catch (e) {
            console.error(`Error force removing ship marker ${shipId}:`, e);
          }
          forceRemoveShipIds.push(shipId);
        }
      });
      forceRemoveShipIds.forEach(shipId => {
        shipMarkersRef.current.delete(shipId);
        shipIconCacheRef.current.delete(shipId); // 清理图标缓存
      });
    }

    // 只渲染在visibleShips中的船舶
    visibleShips.forEach(ship => {
      // 双重检查：确保船舶在processingShipIds中
      if (!processingShipIds || !processingShipIds.includes(ship.id)) {
        console.log(`[StaticMap] Skipping ship ${ship.id} - not in processingShipIds`);
        return;
      }
      
      // 等待状态的船舶显示在对应锚位的第一个路径点位置
      
      const position = getShipPositionLatLng(ship);
      if (!position) {
        console.log(`[StaticMap] Skipping ship ${ship.id} - no position`);
        return;
      }

      // 计算船舶旋转角度（基于轨迹路径方向）
      let rotationDeg = 0;
      if (ship.status === 'navigating' || ship.status === 'docking') {
        // 根据轨迹路径计算方向
        if (ship.assignedBerthId) {
          const berthPos = berthPositions[ship.assignedBerthId] || 
                          (maziAnchoragePositions[ship.assignedBerthId] ? 
                            { lat: maziAnchoragePositions[ship.assignedBerthId].lat, 
                              lng: maziAnchoragePositions[ship.assignedBerthId].lng } : null);
          if (!berthPos) {
            rotationDeg = 0;
          } else {
            // 判断是第一阶段（从起步点到锚位）还是第二阶段（从锚位到泊位）
            const isFromAnchorage = ship.assignedAnchorageId && 
                                    ship.assignedBerthId !== ship.assignedAnchorageId;
            
            let pathPoints: { lat: number; lng: number }[] = [];
            
            if (isFromAnchorage) {
              // 第二阶段：从锚位到泊位（直线路径）
              const anchoragePos = berthPositions[ship.assignedAnchorageId] || 
                                  (maziAnchoragePositions[ship.assignedAnchorageId] ? 
                                    { lat: maziAnchoragePositions[ship.assignedAnchorageId].lat, 
                                      lng: maziAnchoragePositions[ship.assignedAnchorageId].lng } : null);
              if (anchoragePos) {
                pathPoints = [anchoragePos, berthPos];
              }
            } else {
              // 第一阶段：从起步点到锚位（使用锚位的路径点）
              const waypoints = berthWaypoints[ship.assignedBerthId] || [];
              if (waypoints.length > 0) {
                pathPoints = [
                  ...waypoints.map(wp => ({ lat: wp.lat, lng: wp.lng })),
                  berthPos
                ];
              }
            }
            
            // 根据当前位置在路径中的位置计算方向
            if (pathPoints.length > 1) {
              const progress = Math.max(0, Math.min(1, ship.progress ?? 0));
              
              // 计算每段的距离
              const segmentDistances: number[] = [];
              let totalDistance = 0;
              for (let i = 0; i < pathPoints.length - 1; i++) {
                const dLat = pathPoints[i + 1].lat - pathPoints[i].lat;
                const dLng = pathPoints[i + 1].lng - pathPoints[i].lng;
                const dist = Math.sqrt(dLat * dLat + dLng * dLng);
                segmentDistances.push(dist);
                totalDistance += dist;
              }
              
              if (totalDistance > 0) {
                // 找到当前所在的路径段
                const targetDist = progress * totalDistance;
                let accDist = 0;
                let segIndex = 0;
                for (let i = 0; i < segmentDistances.length; i++) {
                  if (accDist + segmentDistances[i] >= targetDist) {
                    segIndex = i;
                    break;
                  }
                  accDist += segmentDistances[i];
                  segIndex = i;
                }
                
                // 计算当前路径段的方向
                const p0 = pathPoints[segIndex];
                const p1 = pathPoints[Math.min(segIndex + 1, pathPoints.length - 1)];
                const dLat = p1.lat - p0.lat;
                const dLng = p1.lng - p0.lng;
                // 计算角度：atan2(经度差, 纬度差)，再顺时针转90度让船头朝前
                rotationDeg = (Math.atan2(dLng, dLat) * 180 / Math.PI);
              }
            } else if (pathPoints.length === 2) {
              // 只有两个点，直接计算方向
              const dLat = pathPoints[1].lat - pathPoints[0].lat;
              const dLng = pathPoints[1].lng - pathPoints[0].lng;
              // 再顺时针转90度让船头朝前
              rotationDeg = (Math.atan2(dLng, dLat) * 180 / Math.PI);
            }
          }
        }
      } else if (ship.anchoredRotation !== undefined) {
        rotationDeg = ship.anchoredRotation;
      }
      
      // 判断是否在移动
      const isMoving = ship.status === 'navigating' || ship.status === 'docking';
      
      // 检查图标是否需要更新（避免频繁更新导致闪烁）
      const cachedIcon = shipIconCacheRef.current.get(ship.id);
      const iconNeedsUpdate = !cachedIcon || 
        cachedIcon.rotation !== rotationDeg || 
        cachedIcon.isMoving !== isMoving;
      
      // 创建船舶图标（使用调度地图中的小黄船图标，和PortMap保持一致）
      const shipIcon = L.divIcon({
        className: 'ship-marker',
        html: `<div style="
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(${rotationDeg - 90}deg);
          transform-origin: center center;
          filter: ${isMoving 
            ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.9)) drop-shadow(0 0 4px rgba(59, 130, 246, 0.6)) saturate(1.2) contrast(1.02)' 
            : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3)) saturate(1.2) contrast(1.02)'};
          cursor: pointer;
        ">
          <img src="/新船型.svg" alt="${ship.name}" style="width: 36px; height: auto; display: block; margin: 0 auto;" draggable="false" />
        </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      // 检查是否已存在标记，如果存在则更新位置，否则创建新标记
      let shipMarker = shipMarkersRef.current.get(ship.id);
      if (shipMarker) {
        // 更新现有标记的位置
        shipMarker.setLatLng([position.lat, position.lng]);
        // 只在图标配置真正变化时才更新图标（避免闪烁）
        if (iconNeedsUpdate) {
          shipMarker.setIcon(shipIcon);
          // 更新缓存
          shipIconCacheRef.current.set(ship.id, { rotation: rotationDeg, isMoving });
        }
      } else {
        // 创建新标记
        shipMarker = L.marker([position.lat, position.lng], { 
          icon: shipIcon,
          zIndexOffset: 2000
        }).addTo(mapInstanceRef.current);

        // 添加船舶信息tooltip（正方形框，居中显示）
        shipMarker.bindTooltip(`
          <div style="font-weight: bold; margin-bottom: 8px; font-size: 13px; text-align: center;">
            ${ship.name}
          </div>
          <div style="font-size: 11px; line-height: 1.6; text-align: center;">
            <div style="margin-bottom: 4px;">状态: ${ship.status === 'waiting' ? '等待' : ship.status === 'navigating' ? '航行中' : ship.status === 'anchored' ? '已锚泊' : ship.status === 'docked' ? '已靠泊' : ship.status}</div>
            <div style="margin-bottom: 4px;">长度: ${ship.length}m</div>
            <div style="margin-bottom: 4px;">吃水: ${ship.draft}m</div>
            ${ship.assignedBerthId ? `<div style="margin-bottom: 4px;">目标: ${ship.assignedBerthId}</div>` : ''}
            ${ship.progress !== undefined ? `<div style="margin-bottom: 4px;">进度: ${Math.round(ship.progress * 100)}%</div>` : ''}
          </div>
        `, {
          permanent: false,
          direction: 'top',
          offset: [0, -10],
          className: 'ship-tooltip',
          opacity: 0.95
        });

        shipMarkersRef.current.set(ship.id, shipMarker);
      }

      // 绘制轨迹线（仅对navigating或docking状态的船舶）
      // 轨迹线只在航行时显示，航行完成后不显示
      if ((ship.status === 'navigating' || ship.status === 'docking') && ship.assignedBerthId) {
        const berthPos = berthPositions[ship.assignedBerthId] || 
                        (maziAnchoragePositions[ship.assignedBerthId] ? 
                          { lat: maziAnchoragePositions[ship.assignedBerthId].lat, 
                            lng: maziAnchoragePositions[ship.assignedBerthId].lng } : null);
        if (!berthPos) return;

        // 判断是第一阶段（从起步点到锚位）还是第二阶段（从锚位到泊位）
        const isFromAnchorage = ship.assignedAnchorageId && 
                                ship.assignedBerthId !== ship.assignedAnchorageId;
        
        let pathPoints: [number, number][] = [];
        
        if (isFromAnchorage) {
          // 第二阶段：从锚位到泊位（直线路径）
          const anchoragePos = berthPositions[ship.assignedAnchorageId] || 
                              (maziAnchoragePositions[ship.assignedAnchorageId] ? 
                                { lat: maziAnchoragePositions[ship.assignedAnchorageId].lat, 
                                  lng: maziAnchoragePositions[ship.assignedAnchorageId].lng } : null);
          if (!anchoragePos) return;
          pathPoints = [[anchoragePos.lat, anchoragePos.lng], [berthPos.lat, berthPos.lng]];
        } else {
          // 第一阶段：从起步点到锚位（使用锚位的路径点）
          const waypoints = berthWaypoints[ship.assignedBerthId] || [];
          if (waypoints.length === 0) return;
          pathPoints = [
            ...waypoints.map(wp => [wp.lat, wp.lng] as [number, number]),
            [berthPos.lat, berthPos.lng]
          ];
        }

        // 根据缩放级别调整轨迹线样式
        const weight = currentZoom > 11 ? 3 : Math.max(1, currentZoom - 8);
        const opacity = currentZoom > 11 ? 0.8 : Math.max(0.3, 0.8 - (11 - currentZoom) * 0.1);

        // 检查是否已存在轨迹线，如果存在则更新，否则创建新线
        let trajectoryLine = shipTrajectoryLinesRef.current.get(ship.id);
        if (trajectoryLine) {
          // 更新现有轨迹线的路径和样式
          trajectoryLine.setLatLngs(pathPoints);
          trajectoryLine.setStyle({
            weight: weight,
            opacity: opacity
          });
        } else {
          // 创建新轨迹线
          trajectoryLine = L.polyline(pathPoints, {
            color: '#38bdf8',
            weight: weight,
            opacity: opacity,
            dashArray: '6, 4'
          }).addTo(mapInstanceRef.current);
          shipTrajectoryLinesRef.current.set(ship.id, trajectoryLine);
        }
      } else {
        // 如果船舶不在航行状态，移除轨迹线（如果存在）
        const existingLine = shipTrajectoryLinesRef.current.get(ship.id);
        if (existingLine && mapInstanceRef.current.hasLayer(existingLine)) {
          mapInstanceRef.current.removeLayer(existingLine);
          shipTrajectoryLinesRef.current.delete(ship.id);
        }
      }
    });
  }, [relevantShipsKey, berthPositionsKeys, berthWaypointsKeys, relevantShips, currentZoom, processingShipIdsKey]);

  // 保存动态泊位到 localStorage
  const saveDynamicBerthsToStorage = (berths: Berth[]) => {
    try {
      localStorage.setItem('dynamic-berths-latlng', JSON.stringify(berths));
      // 触发自定义事件，通知App组件更新berths状态
      window.dispatchEvent(new Event('dynamicBerthsChanged'));
    } catch (e) {
      console.error('Failed to save dynamic berths to storage:', e);
    }
  };

  // 清空localStorage中的错误泊位数据（A02-A06等），只保留标准泊位（A01, A02, B01, B02, C01）和锚位
  useEffect(() => {
    try {
      const stored = localStorage.getItem('dynamic-berths-latlng');
      if (stored) {
        const parsed: Berth[] = JSON.parse(stored);
        // 过滤掉所有错误的泊位（A03-A06等），只保留标准泊位和锚位
        const standardBerthIds = ['A01', 'A02', 'B01', 'B02', 'C01'];
        const filtered = parsed.filter(b => {
          // 保留锚位
          if (b.type === 'anchorage') return true;
          // 只保留标准泊位
          return standardBerthIds.includes(b.id);
        });
        
        // 更新标准泊位的规格
        const updated = filtered.map(berth => {
          const specs = getBerthSpecs(berth.id);
          if (specs && berth.type === 'berth') {
            return { ...berth, length: specs.length, depth: specs.depth };
          }
          return berth;
        });
        
        // 如果过滤后的数据不同，更新localStorage
        if (JSON.stringify(updated) !== stored) {
          saveDynamicBerthsToStorage(updated);
        }
        
        setDynamicBerths(updated);
      }
    } catch (e) {
      console.error('Failed to load dynamic berths from localStorage:', e);
    }
  }, []);

  // 处理地图点击事件（添加路径点或添加锚位/泊位）
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    // @ts-ignore
    const L = window.L;
    if (!L) return;

    // 使用 mousedown 和 mousemove 来检测拖拽，避免与标记拖拽冲突
    let isDragging = false;
    
    const handleMapMouseDown = (e: any) => {
      // 如果点击的是标记（包括路径点标记），不处理
      const target = e.originalEvent?.target;
      if (target?.closest('.leaflet-marker-icon') || target?.closest('.waypoint-marker')) {
        isDragging = false;
        return;
      }
      isDragging = false;
    };

    const handleMapMouseMove = () => {
      isDragging = true;
    };

    const handleMapClick = (e: any) => {
      // 如果刚刚发生了拖拽，不处理点击
      if (isDragging) {
        isDragging = false;
        return;
      }
      
      // 如果点击的是标记（包括路径点标记），不处理地图点击事件
      const target = e.originalEvent?.target;
      if (target?.closest('.leaflet-marker-icon') || target?.closest('.waypoint-marker')) {
        return;
      }

      const { lat, lng } = e.latlng;

      // 如果是添加锚位/泊位模式
      if (addMode) {
        const berthType = addMode;
        const existingIds = allBerths.map(b => b.id);
        let newId = '';
        let counter = 1;
        
        if (berthType === 'anchorage') {
          // 锚位：M01, M02, M03...
          do {
            newId = `M${String(counter).padStart(2, '0')}`;
            counter++;
          } while (existingIds.includes(newId));
        } else {
          // 泊位：根据区域生成，先尝试 A01, B01, C01
          const zones = ['A', 'B', 'C'];
          let found = false;
          for (const zone of zones) {
            do {
              newId = `${zone}${String(counter).padStart(2, '0')}`;
              counter++;
            } while (existingIds.includes(newId));
            if (!existingIds.includes(newId)) {
              found = true;
              break;
            }
          }
          if (!found) {
            newId = `B${String(counter).padStart(2, '0')}`;
          }
        }

        const specs = getBerthSpecs(newId);
        const newBerth: Berth = {
          id: newId,
          name: `${berthType === 'anchorage' ? '锚位' : '泊位'} ${newId}`,
          type: berthType,
          zone: berthType === 'anchorage' ? 'A' : 'B', // 默认区域
          length: specs ? specs.length : (berthType === 'berth' ? 200 : 200), // 如果是标准泊位使用标准规格，否则使用默认值
          depth: specs ? specs.depth : (berthType === 'berth' ? 12.0 : 15), // 如果是标准泊位使用标准规格，否则使用默认值
          isOccupied: false
        };
        
        // 如果是标准泊位，输出日志确认规格
        if (specs && berthType === 'berth') {
          console.log(`[StaticMap] 创建标准泊位 ${newId}: 长度=${specs.length}m, 水深=${specs.depth}m`);
        }

        // 添加到动态泊位列表
        setDynamicBerths(prev => {
          const updated = [...prev, newBerth];
          saveDynamicBerthsToStorage(updated);
          return updated;
        });

        // 设置位置
        setBerthPositions(prev => {
          const updated = { ...prev, [newId]: { lat, lng } };
          savePositionsToStorage(updated);
          return updated;
        });

        // 如果是锚位，打开编辑面板（需要设置路径点）
        // 如果是泊位，不打开编辑面板（不需要路径点，会直接从锚位到达）
        if (berthType === 'anchorage') {
          setEditingBerthId(newId);
        }
        setAddMode(null); // 退出添加模式
        return;
      }

      // 如果是添加路径点模式
      if (clickToAddMode && editingBerthId) {
        const newWaypoint: LatLngWaypoint = {
          id: `wp-${Date.now()}`,
          lat,
          lng
        };

        setBerthWaypoints(prev => {
          const newWaypoints = { ...prev };
          if (!newWaypoints[editingBerthId]) {
            newWaypoints[editingBerthId] = [];
          }
          newWaypoints[editingBerthId] = [...newWaypoints[editingBerthId], newWaypoint];
          saveWaypointsToStorage(newWaypoints);
          return newWaypoints;
        });

        setClickToAddMode(false);
      }
    };

    mapInstanceRef.current.on('mousedown', handleMapMouseDown);
    mapInstanceRef.current.on('mousemove', handleMapMouseMove);
    mapInstanceRef.current.on('click', handleMapClick);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off('mousedown', handleMapMouseDown);
        mapInstanceRef.current.off('mousemove', handleMapMouseMove);
        mapInstanceRef.current.off('click', handleMapClick);
      }
    };
  }, [addMode, clickToAddMode, editingBerthId, allBerths]);

  // 处理面板拖拽和路径点拖拽
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // 处理路径点拖拽（地图上的拖拽，类似PortMap的实现）
      if (draggingWaypoint && mapInstanceRef.current) {
        e.preventDefault();
        e.stopPropagation();
        
        // 将鼠标坐标转换为地图经纬度
        const mapContainer = mapRef.current;
        if (!mapContainer) return;
        
        const rect = mapContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 使用 Leaflet 的 containerPointToLatLng 方法将像素坐标转换为经纬度
        const point = mapInstanceRef.current.mouseEventToContainerPoint(e);
        const latlng = mapInstanceRef.current.containerPointToLatLng(point);
        
        // 更新标记位置（实时更新）
        const markerKey = `waypoint-${draggingWaypoint.berthId}-${draggingWaypoint.waypointId}`;
        const waypointMarker = markersRef.current.get(markerKey);
        if (waypointMarker) {
          waypointMarker.setLatLng(latlng);
          
          // 获取当前泊位的路径点
          const waypoints = berthWaypoints[draggingWaypoint.berthId] || [];
          
          // 实时更新路径线
          const polylineKey = `path-${draggingWaypoint.berthId}`;
          const polyline = polylinesRef.current.get(polylineKey);
          if (polyline) {
            const pathPoints: [number, number][] = [];
            
            waypoints.forEach((w) => {
              const wMarkerKey = `waypoint-${draggingWaypoint.berthId}-${w.id}`;
              const wMarker = markersRef.current.get(wMarkerKey);
              if (wMarker) {
                const pos = wMarker.getLatLng();
                pathPoints.push([pos.lat, pos.lng]);
              } else if (w.id === draggingWaypoint.waypointId) {
                // 如果当前标记就是正在拖拽的，使用新位置
                pathPoints.push([latlng.lat, latlng.lng]);
              } else {
                pathPoints.push([w.lat, w.lng]);
              }
            });
            
            const berthPos = berthPositions[draggingWaypoint.berthId];
            if (berthPos) {
              pathPoints.push([berthPos.lat, berthPos.lng]);
            }
            
            polyline.setLatLngs(pathPoints);
          }
          
          // 实时更新弹窗内容
          waypointMarker.setPopupContent(`
            <div style="font-weight: bold; margin-bottom: 4px;">
              路径点 ${waypoints.findIndex(w => w.id === draggingWaypoint.waypointId) + 1}
            </div>
            <div style="font-size: 12px;">
              纬度: ${latlng.lat.toFixed(6)}<br/>
              经度: ${latlng.lng.toFixed(6)}<br/>
              <span style="color: #3b82f6; font-size: 10px;">可拖拽移动</span>
            </div>
          `);
        }
        
        // 实时更新状态（但使用防抖，避免过于频繁的更新）
        return;
      }
      
      // 处理路径点拖拽（编辑面板中的输入框拖拽）
      if (draggingWaypointInput) {
        e.preventDefault();
        e.stopPropagation();
        
          // 确保起始值已初始化（应该在 onMouseDown 时已经初始化）
          if (draggingStartValueRef.current === null || draggingStartMouseYRef.current === null) {
            // 如果起始值未初始化，说明拖拽状态异常，取消拖拽
            console.warn('拖拽起始值未初始化，取消拖拽');
            setDraggingWaypointInput(null);
            draggingStartValueRef.current = null;
            draggingStartMouseYRef.current = null;
            return;
          }
          
          // 计算累计移动距离
          const totalDeltaY = e.clientY - draggingStartMouseYRef.current;
          
          // 计算移动距离对应的经纬度变化
          // 根据缩放级别调整灵敏度
          const zoom = mapInstanceRef.current?.getZoom() || 11;
          const sensitivity = Math.pow(2, 11 - zoom) * 0.00001; // 缩放级别越高，灵敏度越高
          
          const delta = totalDeltaY * sensitivity; // 向下移动增加值，向上移动减小值
          
          if (draggingWaypointInput.axis === 'lat') {
            updateWaypoint(draggingWaypointInput.berthId, draggingWaypointInput.waypointId, {
              lat: draggingStartValueRef.current + delta
            });
          } else {
            updateWaypoint(draggingWaypointInput.berthId, draggingWaypointInput.waypointId, {
              lng: draggingStartValueRef.current - delta // 经度：向右移动（鼠标向右）增加值
            });
          }
        return;
      }
      
      // 处理编辑面板拖拽
      if (draggingPanel) {
        e.preventDefault();
        e.stopPropagation();
        setPanelPosition(prev => {
          // 向右移动时 right 减小，向左移动时 right 增大
          const newRight = prev.right - e.movementX;
          const newTop = prev.top + e.movementY;
          
          // 简化边界检查：只限制最小值，允许面板自由移动
          return {
            right: Math.max(-200, newRight), // 允许稍微超出右边界
            top: Math.max(-100, newTop) // 允许稍微超出顶部
          };
        });
        return;
      }
      
      // 处理管理面板拖拽
      if (draggingManagementPanel) {
        e.preventDefault();
        setManagementPanelPosition(prev => ({
          x: prev.x + e.movementX,
          y: prev.y + e.movementY
        }));
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      
      // 如果是在地图上拖拽路径点，保存最终位置
      if (draggingWaypoint && mapInstanceRef.current) {
        const markerKey = `waypoint-${draggingWaypoint.berthId}-${draggingWaypoint.waypointId}`;
        const waypointMarker = markersRef.current.get(markerKey);
        if (waypointMarker) {
          const finalLatLng = waypointMarker.getLatLng();
          // 更新状态并保存
          updateWaypoint(draggingWaypoint.berthId, draggingWaypoint.waypointId, {
            lat: finalLatLng.lat,
            lng: finalLatLng.lng
          });
        }
        // 重新启用地图拖拽
        if (mapInstanceRef.current.dragging) {
          mapInstanceRef.current.dragging.enable();
        }
      }
      
      setDraggingPanel(false);
      setDraggingManagementPanel(false);
      setDraggingWaypoint(null);
      setDraggingWaypointInput(null);
      draggingStartValueRef.current = null; // 重置起始值
      draggingStartMouseYRef.current = null; // 重置起始鼠标位置
      
      // 确保地图拖拽被重新启用（防止状态不一致）
      if (mapInstanceRef.current && mapInstanceRef.current.dragging) {
        mapInstanceRef.current.dragging.enable();
      }
    };

    // 只在有拖拽状态时才添加事件监听器
    if (draggingPanel || draggingManagementPanel || draggingWaypoint || draggingWaypointInput) {
      window.addEventListener('mousemove', handleMouseMove, { passive: false });
      window.addEventListener('mouseup', handleMouseUp, { passive: false });
      // 防止文本选择
      document.body.style.userSelect = 'none';
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        // 确保地图拖拽被重新启用（清理时）
        if (mapInstanceRef.current && mapInstanceRef.current.dragging) {
          mapInstanceRef.current.dragging.enable();
        }
      };
    }
    
    // 如果没有拖拽状态，也要确保清理（防止状态不一致）
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      // 确保地图拖拽被重新启用（清理时）
      if (mapInstanceRef.current && mapInstanceRef.current.dragging) {
        mapInstanceRef.current.dragging.enable();
      }
    };
  }, [draggingPanel, draggingManagementPanel, draggingWaypoint, draggingWaypointInput, berthWaypoints, berthPositions]);

  const initializeMap = () => {
    // @ts-ignore
    const L: any = window.L;
    if (!L) {
      console.error('[StaticMap] Leaflet (L) 未定义，无法初始化地图');
      setIsLoading(false);
      return;
    }
    if (typeof L.map !== 'function') {
      console.error('[StaticMap] Leaflet.map 不是函数，Leaflet 可能未完全加载。当前 L 对象:', L);
      setIsLoading(false);
      return;
    }
    if (!mapRef.current) {
      console.error('[StaticMap] mapRef.current 为空，无法初始化地图');
      setIsLoading(false);
      return;
    }
    if (mapInstanceRef.current) {
      console.log('[StaticMap] 地图已初始化，跳过');
      return;
    }

    try {
      // 设置 Leaflet 默认图标路径（使用本地文件）
      // @ts-ignore
      if (L.Icon && L.Icon.Default) {
        // @ts-ignore
        L.Icon.Default.mergeOptions({
          iconUrl: '/libs/leaflet/images/marker-icon.png',
          iconRetinaUrl: '/libs/leaflet/images/marker-icon-2x.png',
          shadowUrl: '/libs/leaflet/images/marker-shadow.png',
        });
      }

      // 创建地图实例
      // 默认中心点：29°53.738 N 122°16.611 E
      // 将度分格式转换为十进制度数：29°53.738' = 29 + 53.738/60 = 29.89563
      // 122°16.611' = 122 + 16.611/60 = 122.27685
      const map = L.map(mapRef.current, {
        center: [29.89563, 122.27685],
        zoom: 11,
        zoomControl: true,
        maxZoom: 19,
        minZoom: 2
      });

      // 添加 WMS 海图瓦片图层（通过 Cloudflare Worker 代理为 HTTPS，避免混合内容）
      const wmsServerUrl = 'https://wms-proxy.1737648397.workers.dev/map/';

      let baseLayer: any = null;
      let wmsLoaded = false;
      const switchToOSM = (reason: string) => {
        if (baseLayer) {
          map.removeLayer(baseLayer);
        }
        console.warn(`[StaticMap] 切换到 OSM 瓦片，原因: ${reason}`);
        baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
          subdomains: ['a', 'b', 'c'],
          errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
        }).addTo(map);
      };

      // 创建 WMS 图层（使用 HTTPS Worker 代理，避免混合内容问题）
      const wmsLayer = L.tileLayer.wms(wmsServerUrl, {
        version: '1.3.0',
        layers: 'ENC',
        format: 'image/png',
        CSBOOL: parseInt('1000000000000010', 2).toString(16),
        CSVALUE: '10,5,20,10,1,2,1,500000,100000,200000,1'
      });

      baseLayer = wmsLayer.addTo(map);

      // 超时未加载则回退
      const wmsLoadTimeout = setTimeout(() => {
        if (!wmsLoaded) {
          console.warn('[StaticMap] WMS 加载超时，回退到 OSM');
          switchToOSM('wms-timeout');
        }
      }, 6000);

      // 加载成功
      wmsLayer.on('load', () => {
        wmsLoaded = true;
        clearTimeout(wmsLoadTimeout);
        console.log('[StaticMap] WMS 海图加载成功');
      });

      // 监听瓦片加载错误，若持续失败则回退
      let errorCount = 0;
      wmsLayer.on('tileerror', (error: any, tile: any) => {
        console.warn('[StaticMap] WMS 瓦片加载失败:', error, tile);
        errorCount += 1;
        if (errorCount >= 3 && !wmsLoaded) {
          switchToOSM('wms-tileerror');
        }
      });

      // 设置地图容器的 z-index，确保弹窗可以显示在上方
      const mapContainer = map.getContainer();
      if (mapContainer) {
        mapContainer.style.zIndex = '1';
        mapContainer.style.position = 'relative';
      }

      mapInstanceRef.current = map;
      setIsLoading(false);
      
      // 设置初始缩放级别为11
      setCurrentZoom(11);

      // 设置缩放监听器
      const handleZoomEnd = () => {
        const zoom = map.getZoom();
        setCurrentZoom(zoom);
        
        // 根据缩放级别显示/隐藏锚位标记（缩放级别 > 12 时才显示）
        const shouldShow = zoom > 12;
        
        anchorageMarkersRef.current.forEach(marker => {
          if (shouldShow) {
            // 如果应该显示但当前未显示，则添加到地图
            if (!map.hasLayer(marker)) {
              marker.addTo(map);
            }
          } else {
            // 如果不应该显示但当前显示，则从地图移除
            if (map.hasLayer(marker)) {
              map.removeLayer(marker);
            }
          }
        });
        
        // 更新泊位标记的图标大小（通过触发重新渲染来实现）
        // 注意：这里无法直接访问组件状态，所以通过设置 currentZoom 来触发重新渲染
        // 实际的图标更新会在渲染 useEffect 中完成
      };
      
      // 监听缩放事件
      map.on('zoomend', handleZoomEnd);

      // 延迟调整尺寸
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 100);
    } catch (error) {
      console.error('Error initializing map:', error);
      setIsLoading(false);
    }
  };

  // 当容器尺寸变化时，调整地图尺寸
  useEffect(() => {
    if (mapInstanceRef.current) {
      const timer = setTimeout(() => {
        try {
          mapInstanceRef.current.invalidateSize();
        } catch (e) {
          console.warn('Error invalidating map size:', e);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  });

  // 更新路径点
  const updateWaypoint = (berthId: string, waypointId: string, updates: Partial<LatLngWaypoint>) => {
    setBerthWaypoints(prev => {
      const newWaypoints = { ...prev };
      if (!newWaypoints[berthId]) {
        newWaypoints[berthId] = [];
      }
      newWaypoints[berthId] = newWaypoints[berthId].map(wp =>
        wp.id === waypointId ? { ...wp, ...updates } : wp
      );
      saveWaypointsToStorage(newWaypoints);
      return newWaypoints;
    });
  };

  // 添加路径点
  const addWaypoint = (berthId: string, afterIndex?: number) => {
    setBerthWaypoints(prev => {
      const newWaypoints = { ...prev };
      if (!newWaypoints[berthId]) {
        newWaypoints[berthId] = [];
      }
      // 创建新数组，不要直接修改原数组
      const waypoints = [...newWaypoints[berthId]];
      const berthPos = berthPositions[berthId];
      
      // 优先使用地图中心位置，这样新添加的点会在视野内
      let newLat: number;
      let newLng: number;
      
      if (mapInstanceRef.current) {
        const center = mapInstanceRef.current.getCenter();
        newLat = center.lat;
        newLng = center.lng;
      } else if (afterIndex !== undefined && afterIndex >= 0 && afterIndex < waypoints.length) {
        // 如果指定了插入位置，使用前后两个点的中点
        const prevPoint = waypoints[afterIndex];
        const nextPoint = waypoints[afterIndex + 1] || berthPos;
        if (nextPoint) {
          newLat = (prevPoint.lat + (nextPoint.lat || 0)) / 2;
          newLng = (prevPoint.lng + (nextPoint.lng || 0)) / 2;
        } else {
          newLat = prevPoint.lat + 0.001;
          newLng = prevPoint.lng + 0.001;
        }
      } else if (waypoints.length > 0) {
        // 如果有现有路径点，在最后一个点附近添加
        const lastWaypoint = waypoints[waypoints.length - 1];
        newLat = lastWaypoint.lat + 0.001;
        newLng = lastWaypoint.lng + 0.001;
      } else if (berthPos) {
        // 如果没有路径点，在泊位位置附近添加
        newLat = berthPos.lat + 0.001;
        newLng = berthPos.lng + 0.001;
      } else {
        // 默认位置
        newLat = 29.89563;
        newLng = 122.27685;
      }
      
      const newWaypoint: LatLngWaypoint = {
        id: `wp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // 添加随机字符串确保唯一性
        lat: newLat,
        lng: newLng
      };

      // 创建新数组插入新路径点
      if (afterIndex !== undefined && afterIndex >= 0 && afterIndex < waypoints.length) {
        newWaypoints[berthId] = [
          ...waypoints.slice(0, afterIndex + 1),
          newWaypoint,
          ...waypoints.slice(afterIndex + 1)
        ];
      } else {
        newWaypoints[berthId] = [...waypoints, newWaypoint];
      }

      saveWaypointsToStorage(newWaypoints);
      
      console.log(`[Waypoints] Added waypoint to ${berthId}:`, newWaypoint);
      console.log(`[Waypoints] Total waypoints for ${berthId}:`, newWaypoints[berthId].length);
      
      // 添加后，将地图视野移动到新添加的点（如果地图已初始化）
      if (mapInstanceRef.current) {
        setTimeout(() => {
          mapInstanceRef.current.setView([newLat, newLng], mapInstanceRef.current.getZoom(), {
            animate: true,
            duration: 0.5
          });
        }, 100);
      }
      
      return newWaypoints;
    });
  };

  // 删除路径点
  const deleteWaypoint = (berthId: string, waypointId: string) => {
    setBerthWaypoints(prev => {
      const newWaypoints = { ...prev };
      if (!newWaypoints[berthId]) return prev;
      newWaypoints[berthId] = newWaypoints[berthId].filter(wp => wp.id !== waypointId);
      saveWaypointsToStorage(newWaypoints);
      return newWaypoints;
    });
  };

  // 设置泊位位置
  const setBerthPosition = (berthId: string, lat: number, lng: number) => {
    setBerthPositions(prev => {
      const newPositions = { ...prev, [berthId]: { lat, lng } };
      savePositionsToStorage(newPositions);
      return newPositions;
    });
  };

  // 重置路径点
  const resetWaypoints = (berthId: string) => {
    setBerthWaypoints(prev => {
      const newWaypoints = { ...prev };
      newWaypoints[berthId] = [];
      saveWaypointsToStorage(newWaypoints);
      return newWaypoints;
    });
  };

  // 删除锚位/泊位
  const deleteBerth = (berthId: string) => {
    if (!confirm(`确定要删除${allBerths.find(b => b.id === berthId)?.type === 'anchorage' ? '锚位' : '泊位'} ${berthId} 吗？`)) {
      return;
    }

    // 从动态泊位列表中删除
    setDynamicBerths(prev => {
      const updated = prev.filter(b => b.id !== berthId);
      saveDynamicBerthsToStorage(updated);
      return updated;
    });

    // 删除位置信息
    setBerthPositions(prev => {
      const updated = { ...prev };
      delete updated[berthId];
      savePositionsToStorage(updated);
      return updated;
    });

    // 删除路径点信息
    setBerthWaypoints(prev => {
      const updated = { ...prev };
      delete updated[berthId];
      saveWaypointsToStorage(updated);
      return updated;
    });

    // 删除自定义名称
    setBerthCustomNames(prev => {
      const updated = { ...prev };
      delete updated[berthId];
      saveCustomNamesToStorage(updated);
      return updated;
    });

    // 如果正在编辑，关闭编辑面板
    if (editingBerthId === berthId) {
      setEditingBerthId(null);
    }
  };

  // 计算船舶位置（基于经纬度路径点）
  const getShipPositionLatLng = (ship: Ship): { lat: number; lng: number } | null => {
    // 1. Waiting - 等待状态的船应该显示在默认起始位置，而不是锚位
    // 只有当船开始航行（navigating）时才移动到锚位路径点
    if (ship.status === 'waiting') {
      // 等待状态的船显示在对应锚位的第一个路径点位置
      // 如果没有分配锚位，不显示（返回null）
      if (!ship.assignedAnchorageId) {
        return null;
      }
      
      const waypoints = berthWaypoints[ship.assignedAnchorageId] || [];
      if (waypoints.length > 0) {
        return { lat: waypoints[0].lat, lng: waypoints[0].lng };
      }
      // 如果没有路径点，使用锚位位置
      const anchoragePos = berthPositions[ship.assignedAnchorageId];
      if (anchoragePos) {
        return anchoragePos;
      }
      // 检查是否是马峙锚位
      const maziInfo = maziAnchoragePositions[ship.assignedAnchorageId];
      if (maziInfo) {
        return { lat: maziInfo.lat, lng: maziInfo.lng };
      }
      // 如果锚位信息都不存在，不显示
      return null;
    }
    
    // 2. Navigating - 船按照路径点依次移动
    if (ship.status === 'navigating' && ship.assignedBerthId) {
      // 确保progress有值，默认为0
      const progress = Math.max(0, Math.min(1, ship.progress ?? 0));
      
      // 如果progress已经是1，说明船已经到达，不应该再显示为navigating状态
      // 这种情况不应该发生，但如果发生了，返回null不显示
      if (progress >= 1) {
        console.warn(`[StaticMap] Ship ${ship.id} is navigating but progress is 1, this should not happen`);
        return null;
      }
      
      const berthPos = berthPositions[ship.assignedBerthId];
      if (!berthPos) {
        // 检查是否是马峙锚位
        const maziInfo = maziAnchoragePositions[ship.assignedBerthId];
        if (maziInfo) {
          return { lat: maziInfo.lat, lng: maziInfo.lng };
        }
        return null;
      }

      // 判断是第一阶段（从起步点到锚位）还是第二阶段（从锚位到泊位）
      const isFromAnchorage = ship.assignedAnchorageId && 
                              ship.assignedBerthId !== ship.assignedAnchorageId;
      
      let pathPoints: { lat: number; lng: number }[] = [];
      
      if (isFromAnchorage) {
        // 第二阶段：从锚位到泊位（直线路径）
        const anchoragePos = berthPositions[ship.assignedAnchorageId] || 
                            (maziAnchoragePositions[ship.assignedAnchorageId] ? 
                              { lat: maziAnchoragePositions[ship.assignedAnchorageId].lat, 
                                lng: maziAnchoragePositions[ship.assignedAnchorageId].lng } : null);
        if (!anchoragePos) return null; // 如果没有锚位位置，不显示
        pathPoints = [anchoragePos, berthPos];
      } else {
        // 第一阶段：从起步点到锚位（使用锚位的路径点）
        const waypoints = berthWaypoints[ship.assignedBerthId] || [];
        if (waypoints.length === 0) {
          return null; // 如果没有路径点，不显示
        }
        // 构建路径：点1 -> 点2 -> ... -> 点N -> 锚位
        pathPoints = [
          ...waypoints.map(wp => ({ lat: wp.lat, lng: wp.lng })),
          berthPos
        ];
      }
      
      // progress=0: 在第一个路径点（起点）
      if (pathPoints.length === 0) {
        return berthPos;
      }
      
      if (pathPoints.length === 1) {
        return pathPoints[0];
      }
      
      // 计算每段的距离（使用经纬度距离）
      const segmentDistances: number[] = [];
      let totalDistance = 0;
      for (let i = 0; i < pathPoints.length - 1; i++) {
        const dLat = pathPoints[i + 1].lat - pathPoints[i].lat;
        const dLng = pathPoints[i + 1].lng - pathPoints[i].lng;
        const dist = Math.sqrt(dLat * dLat + dLng * dLng);
        segmentDistances.push(dist);
        totalDistance += dist;
      }
      
      if (totalDistance === 0) {
        return pathPoints[0];
      }
      
      // 根据progress找到当前段
      const targetDist = progress * totalDistance;
      let accDist = 0;
      let segIndex = 0;
      for (let i = 0; i < segmentDistances.length; i++) {
        if (accDist + segmentDistances[i] >= targetDist) {
          segIndex = i;
          break;
        }
        accDist += segmentDistances[i];
      }
      
      // 计算在当前段中的位置
      const segmentProgress = (targetDist - accDist) / segmentDistances[segIndex];
      const startPoint = pathPoints[segIndex];
      const endPoint = pathPoints[segIndex + 1];
      
      return {
        lat: startPoint.lat + (endPoint.lat - startPoint.lat) * segmentProgress,
        lng: startPoint.lng + (endPoint.lng - startPoint.lng) * segmentProgress
      };
    }
    
    // 3. Anchored - 在锚位位置（不是泊位！）
    if (ship.status === 'anchored') {
      // anchored状态的船应该在锚位，使用assignedAnchorageId
      if (ship.assignedAnchorageId) {
        const pos = berthPositions[ship.assignedAnchorageId];
        if (pos) return pos;
        const maziInfo = maziAnchoragePositions[ship.assignedAnchorageId];
        if (maziInfo) return { lat: maziInfo.lat, lng: maziInfo.lng };
      }
      // 如果没有assignedAnchorageId，不显示
      return null;
    }
    
    // 4. Docked - 在泊位位置
    if (ship.status === 'docked' && ship.assignedBerthId) {
      const pos = berthPositions[ship.assignedBerthId];
      if (pos) return pos;
      // 如果泊位位置不存在，不显示
      return null;
    }
    
    // 5. Docking - 同navigating逻辑
    if (ship.status === 'docking' && ship.assignedBerthId) {
      return getShipPositionLatLng({ ...ship, status: 'navigating' });
    }
    
    return null;
  };

  // 查找当前编辑的泊位/锚位（包括马峙锚位）
  const currentBerth = editingBerthId 
    ? (allBerths.find(b => b.id === editingBerthId) || 
       (maziAnchoragePositions[editingBerthId] ? {
         id: editingBerthId,
         name: `马峙1号锚地 - ${editingBerthId}`,
         type: 'anchorage' as const,
         zone: 'A' as const,
         length: 200,
         depth: 12,
         isOccupied: false
       } : null))
    : null;
  const currentWaypoints = editingBerthId ? berthWaypoints[editingBerthId] || [] : [];
  const currentPosition = editingBerthId ? berthPositions[editingBerthId] : null;
  const currentCustomName = editingBerthId ? (berthCustomNames[editingBerthId] || '') : '';

  // 添加自定义样式
  useEffect(() => {
    const styleId = 'anchorage-tooltip-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .anchorage-tooltip, .berth-tooltip {
        background-color: rgba(30, 58, 138, 0.95) !important;
        border: 2px solid #3b82f6 !important;
        border-radius: 6px !important;
        color: white !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        padding: 10px !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
        width: 200px !important;
        min-width: 200px !important;
        max-width: 200px !important;
        white-space: normal !important;
        text-align: center !important;
      }
      .anchorage-tooltip::before, .berth-tooltip::before {
        border-top-color: #3b82f6 !important;
      }
      .ship-tooltip {
        background-color: rgba(30, 58, 138, 0.95) !important;
        border: 2px solid #3b82f6 !important;
        border-radius: 6px !important;
        color: white !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        padding: 10px !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
        width: 200px !important;
        max-width: 200px !important;
        min-width: 200px !important;
        min-height: 200px !important;
        white-space: normal !important;
        text-align: center !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        align-items: center !important;
      }
      .ship-tooltip::before {
        border-top-color: #3b82f6 !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  // 全屏切换函数
  const toggleFullscreen = () => {
    if (!mapRef.current) return;

    if (!isFullscreen) {
      // 进入全屏
      if (mapRef.current.requestFullscreen) {
        mapRef.current.requestFullscreen();
      } else if ((mapRef.current as any).webkitRequestFullscreen) {
        (mapRef.current as any).webkitRequestFullscreen();
      } else if ((mapRef.current as any).mozRequestFullScreen) {
        (mapRef.current as any).mozRequestFullScreen();
      } else if ((mapRef.current as any).msRequestFullscreen) {
        (mapRef.current as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      // 退出全屏
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
      
      // 全屏状态改变后，调整地图尺寸
      if (mapInstanceRef.current) {
        setTimeout(() => {
          try {
            mapInstanceRef.current.invalidateSize();
          } catch (e) {
            console.warn('Error invalidating map size after fullscreen change:', e);
          }
        }, 100);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  return (
    <div 
      ref={mapRef} 
      className={`w-full h-full relative ${className}`}
      style={{ minHeight: '400px', position: 'relative', zIndex: 1 }}
    >
      {/* 全屏切换按钮 */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-2 right-2 z-[1000] bg-slate-800/90 hover:bg-slate-700/90 border border-slate-600/50 rounded-lg p-2 shadow-lg backdrop-blur-sm transition-all duration-200 flex items-center justify-center"
        title={isFullscreen ? '退出全屏' : '全屏显示'}
        style={{ zIndex: 10000 }}
      >
        {isFullscreen ? (
          <Minimize2 size={18} className="text-slate-200" />
        ) : (
          <Maximize2 size={18} className="text-slate-200" />
        )}
      </button>

      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 z-10">
          <div className="text-slate-300 text-base font-medium mb-2">正在加载地图库...</div>
          <div className="text-slate-500 text-xs">如果长时间无法加载，请检查网络连接</div>
          <div className="mt-4 w-64 h-1 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      )}

      {/* 添加模式提示 */}
      {addMode && (
        <div 
          className="absolute top-20 left-1/2 -translate-x-1/2 bg-blue-600/95 border border-blue-500 rounded-lg shadow-2xl backdrop-blur-md px-4 py-3 pointer-events-auto"
          style={{ zIndex: 10000 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
            <div className="text-white text-sm font-semibold">
              点击地图添加{addMode === 'anchorage' ? '锚位' : '泊位'}
            </div>
            <button
              onClick={() => setAddMode(null)}
              className="ml-2 text-white hover:text-red-300 text-lg font-bold"
              title="取消添加"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* 顶部工具栏（锚位添加、泊位添加、管理按钮） */}
      {!editingBerthId && (
        <div 
          className="absolute top-3 right-3 flex gap-2 bg-slate-800/95 border border-slate-600/80 rounded-lg shadow-2xl backdrop-blur-md p-2"
          style={{ zIndex: 10000 }}
        >
          <button
            onClick={() => {
              setAddMode('anchorage');
              setClickToAddMode(false);
            }}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded text-xs font-semibold transition-colors ${
              addMode === 'anchorage'
                ? 'bg-green-600 hover:bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.5)]'
                : 'bg-green-700 hover:bg-green-600 text-white'
            }`}
            title="点击地图添加锚位"
          >
            <Plus size={14} /> 锚位添加
          </button>
          <button
            onClick={() => {
              setAddMode('berth');
              setClickToAddMode(false);
            }}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded text-xs font-semibold transition-colors ${
              addMode === 'berth'
                ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.5)]'
                : 'bg-orange-700 hover:bg-orange-600 text-white'
            }`}
            title="点击地图添加泊位"
          >
            <Plus size={14} /> 泊位添加
          </button>
          <button
            onClick={() => setShowManagementPanel(!showManagementPanel)}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded text-xs font-semibold transition-colors ${
              showManagementPanel
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}
            title="管理锚位和泊位"
          >
            <Edit2 size={14} /> 管理
          </button>
        </div>
      )}

      {/* 管理面板 */}
      {showManagementPanel && (
        <div
          className="absolute bg-slate-900/98 text-slate-100 text-sm px-4 py-3 rounded-lg border border-slate-600 shadow-2xl pointer-events-auto"
          style={{
            left: `${managementPanelPosition.x}px`,
            top: `${managementPanelPosition.y}px`,
            minWidth: '320px',
            maxWidth: '400px',
            zIndex: 10000
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 拖拽标题栏 */}
          <div 
            className="flex items-center justify-between mb-3 pb-2 border-b border-slate-300 cursor-move select-none bg-slate-200 -mx-4 -mt-3 px-4 pt-3 rounded-t-lg"
            onMouseDown={(e) => {
              e.stopPropagation();
              setDraggingManagementPanel(true);
            }}
          >
            <h3 className="font-bold text-base text-black">锚位/泊位管理</h3>
            <button
              onClick={() => setShowManagementPanel(false)}
              className="text-slate-600 hover:text-black ml-2"
            >
              <X size={18} />
            </button>
          </div>

          {/* 锚位列表（包括马峙锚位和动态添加的） */}
          <div className="mb-4">
            <div className="text-xs font-semibold text-green-400 mb-2 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              锚位列表 ({Object.keys(maziAnchoragePositions).length + dynamicBerths.filter(b => b.type === 'anchorage').length})
            </div>
            <div className="space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar">
              {/* 马峙1号锚地预设锚位 */}
              {Object.keys(maziAnchoragePositions).map(anchorageId => {
                const info = maziAnchoragePositions[anchorageId];
                const position = berthPositions[anchorageId] || { lat: info.lat, lng: info.lng };
                const customName = berthCustomNames[anchorageId] || anchorageId;
                return (
                  <div
                    key={`mazi-${anchorageId}`}
                    className="flex items-center justify-between p-2 bg-slate-800/60 rounded border border-slate-700/50 hover:bg-slate-800/80 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-200 truncate">
                        <span className="text-green-400">[马峙]</span> {customName}
                      </div>
                      <div className="text-xs text-slate-400">
                        位置: {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => {
                          setEditingBerthId(anchorageId);
                          setShowManagementPanel(false);
                        }}
                        className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded transition-colors"
                        title="编辑路径点"
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {/* 动态添加的锚位 */}
              {dynamicBerths
                .filter(b => b.type === 'anchorage')
                .map(berth => {
                  const position = berthPositions[berth.id];
                  const customName = berthCustomNames[berth.id] || berth.id;
                  return (
                    <div
                      key={berth.id}
                      className="flex items-center justify-between p-2 bg-slate-800/60 rounded border border-slate-700/50 hover:bg-slate-800/80 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-200 truncate">{customName}</div>
                        <div className="text-xs text-slate-400">
                          {position ? `位置: ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}` : '未设置位置'}
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => {
                            setEditingBerthId(berth.id);
                            setShowManagementPanel(false);
                          }}
                          className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded transition-colors"
                          title="编辑路径点"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => deleteBerth(berth.id)}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors"
                          title="删除锚位"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              {Object.keys(maziAnchoragePositions).length === 0 && dynamicBerths.filter(b => b.type === 'anchorage').length === 0 && (
                <div className="text-xs text-slate-500 text-center py-2">暂无锚位</div>
              )}
            </div>
          </div>

          {/* 泊位列表（显示所有标准泊位） */}
          <div>
            <div className="text-xs font-semibold text-orange-400 mb-2 flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-orange-500"></div>
              泊位列表 ({allBerths.filter(b => b.type === 'berth').length})
            </div>
            <div className="space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar">
              {allBerths
                .filter(b => b.type === 'berth')
                .map(berth => {
                  const position = berthPositions[berth.id] || STANDARD_BERTH_POSITIONS[berth.id];
                  const customName = berthCustomNames[berth.id] || berth.id;
                  return (
                    <div
                      key={berth.id}
                      className="flex items-center justify-between p-2 bg-slate-800/60 rounded border border-slate-700/50 hover:bg-slate-800/80 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-200 truncate">{customName}</div>
                        <div className="text-xs text-slate-400">
                          {position ? `位置: ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}` : '未设置位置'}
                        </div>
                        <div className="text-xs text-slate-500">
                          长度: {berth.length}m, 水深: {berth.depth}m
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => {
                            setEditingBerthId(berth.id);
                            setShowManagementPanel(false);
                          }}
                          className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded transition-colors"
                          title="编辑位置"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => deleteBerth(berth.id)}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors"
                          title="删除泊位"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              {allBerths.filter(b => b.type === 'berth').length === 0 && (
                <div className="text-xs text-slate-500 text-center py-2">暂无泊位</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 编辑面板 - 使用 Portal 渲染到右侧边栏区域 */}
      {editingBerthId && currentBerth && typeof window !== 'undefined' && (() => {
        const portalContainer = document.getElementById('static-map-edit-panel-portal');
        if (!portalContainer) return null;
        
        return createPortal(
          <div
            className="absolute bg-slate-900/98 text-slate-100 text-xs px-3 py-2 rounded-lg border border-slate-600 shadow-2xl pointer-events-auto"
            style={{
              right: `${panelPosition.right}px`,
              top: `${panelPosition.top}px`,
              minWidth: '280px',
              maxWidth: '380px',
              zIndex: 10001
            }}
            onClick={(e) => e.stopPropagation()}
          >
          {/* 拖拽标题栏 */}
          <div 
            className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-300 cursor-move select-none bg-slate-200 -mx-3 -mt-2 px-3 pt-2 rounded-t-lg"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDraggingPanel(true);
            }}
            style={{ userSelect: 'none' }}
          >
            <h3 className="font-bold text-sm text-black">
              编辑 - {berthCustomNames[editingBerthId || ''] || currentBerth.id} ({currentBerth.type === 'anchorage' ? '锚位' : '泊位'})
            </h3>
            <button
              onClick={() => {
                setEditingBerthId(null);
                setClickToAddMode(false);
              }}
              className="text-slate-600 hover:text-black ml-2"
            >
              <X size={16} />
            </button>
          </div>

          {/* 名称设置 */}
          <div className="mb-2 p-1.5 bg-slate-800/60 rounded-lg border border-slate-700/50">
            <div className="text-xs text-slate-400 mb-1">显示名称</div>
            <div className="flex gap-2">
              <input
                type="text"
                value={currentCustomName}
                onChange={(e) => {
                  const newName = e.target.value;
                  if (editingBerthId) {
                    setBerthCustomNames(prev => {
                      const updated = { ...prev };
                      if (newName.trim()) {
                        updated[editingBerthId] = newName.trim();
                      } else {
                        delete updated[editingBerthId];
                      }
                      saveCustomNamesToStorage(updated);
                      return updated;
                    });
                  }
                }}
                placeholder={`默认: ${currentBerth?.id || ''}`}
                className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-slate-200 text-xs"
              />
              <button
                onClick={() => {
                  if (editingBerthId) {
                    setBerthCustomNames(prev => {
                      const updated = { ...prev };
                      delete updated[editingBerthId];
                      saveCustomNamesToStorage(updated);
                      return updated;
                    });
                  }
                }}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs font-semibold transition-colors"
                title="恢复默认名称"
              >
                重置
              </button>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              留空则使用默认ID: {currentBerth?.id || ''}
            </div>
          </div>

          {/* 泊位位置设置 */}
          {!currentPosition ? (
            <div className="mb-3 p-2 bg-yellow-600/20 border border-yellow-500/50 rounded text-xs text-yellow-300">
              <div className="mb-2">请先设置{currentBerth.type === 'anchorage' ? '锚位' : '泊位'}位置：</div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input
                  type="number"
                  step="0.000001"
                  placeholder="纬度"
                  id={`berth-lat-${editingBerthId}`}
                  className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-slate-200 text-xs"
                />
                <input
                  type="number"
                  step="0.000001"
                  placeholder="经度"
                  id={`berth-lng-${editingBerthId}`}
                  className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-slate-200 text-xs"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const latInput = document.getElementById(`berth-lat-${editingBerthId}`) as HTMLInputElement;
                    const lngInput = document.getElementById(`berth-lng-${editingBerthId}`) as HTMLInputElement;
                    const lat = parseFloat(latInput?.value || '');
                    const lng = parseFloat(lngInput?.value || '');
                    if (!isNaN(lat) && !isNaN(lng)) {
                      setBerthPosition(editingBerthId, lat, lng);
                    } else {
                      alert('请输入有效的经纬度坐标');
                    }
                  }}
                  className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-semibold transition-colors"
                >
                  确认设置
                </button>
                <button
                  onClick={() => {
                    if (mapInstanceRef.current) {
                      const center = mapInstanceRef.current.getCenter();
                      setBerthPosition(editingBerthId, center.lat, center.lng);
                    }
                  }}
                  className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold transition-colors"
                >
                  使用地图中心
                </button>
              </div>
            </div>
          ) : (

            <div className="mb-3 p-2 bg-slate-800/60 rounded-lg border border-slate-700/50">
              <div className="text-xs text-slate-400 mb-1">{currentBerth.type === 'anchorage' ? '锚位' : '泊位'}位置</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">纬度</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={currentPosition.lat.toFixed(6)}
                    onChange={(e) => {
                      const lat = parseFloat(e.target.value);
                      if (!isNaN(lat)) {
                        setBerthPosition(editingBerthId, lat, currentPosition.lng);
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">经度</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={currentPosition.lng.toFixed(6)}
                    onChange={(e) => {
                      const lng = parseFloat(e.target.value);
                      if (!isNaN(lng)) {
                        setBerthPosition(editingBerthId, currentPosition.lat, lng);
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-slate-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 路径说明和路径点管理（仅锚位显示） */}
          {currentBerth.type === 'anchorage' && (
            <>
              {/* 路径说明 */}
              {currentPosition && (
                <div className="mb-2 p-1.5 bg-blue-600/10 border border-blue-500/30 rounded text-xs text-blue-300">
                  <div className="font-semibold mb-0.5">路径说明：</div>
                  <div>路径点1 = 船的起步位置</div>
                  <div>路径点2, 3... = 中间路径点</div>
                  <div>最后到达 = 锚位位置</div>
                </div>
              )}

              {/* 点击添加模式提示 */}
              {clickToAddMode && (
                <div 
                  className="mb-3 p-2 bg-blue-600/20 border border-blue-500/50 rounded text-xs text-blue-300 cursor-pointer hover:bg-blue-600/30 transition-colors"
                  onClick={() => setClickToAddMode(false)}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span>点击地图添加路径点（点击此提示可取消）</span>
                  </div>
                </div>
              )}

              {/* 路径点列表 */}
              <div className="space-y-1.5 max-h-[250px] overflow-y-auto custom-scrollbar">
                {(() => {
                  // 去重：确保每个ID只出现一次
                  const uniqueWaypoints = currentWaypoints.filter((wp, index, self) => 
                    index === self.findIndex(w => w.id === wp.id)
                  );
                  
                  // 如果去重后数量不同，说明有重复，需要修复
                  if (uniqueWaypoints.length !== currentWaypoints.length) {
                    console.warn(`[Waypoints] Found duplicate waypoints for ${editingBerthId}, fixing...`);
                    setBerthWaypoints(prev => {
                      const newWaypoints = { ...prev };
                      newWaypoints[editingBerthId] = uniqueWaypoints;
                      saveWaypointsToStorage(newWaypoints);
                      return newWaypoints;
                    });
                  }
                  
                  return uniqueWaypoints;
                })().map((waypoint, index) => (
                  <div
                    key={`panel-${editingBerthId}-${waypoint.id}-${index}`}
                    className="bg-slate-800/60 rounded-lg p-1.5 border border-slate-700/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-xs text-slate-300">路径点 {index + 1}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            addWaypoint(editingBerthId, index);
                          }}
                          className="p-1 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded transition-colors"
                          title="在此点后添加"
                        >
                          <Plus size={14} />
                        </button>
                        {currentWaypoints.length > 1 && (
                          <button
                            onClick={() => deleteWaypoint(editingBerthId, waypoint.id)}
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors"
                            title="删除此点"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-slate-400 block mb-1">纬度（可拖拽）</label>
                        <input
                          type="number"
                          step="0.000001"
                          value={waypoint.lat.toFixed(6)}
                          onChange={(e) => updateWaypoint(editingBerthId, waypoint.id, { lat: parseFloat(e.target.value) || 0 })}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // 立即初始化起始值，避免在 useEffect 中读取可能过时的值
                            draggingStartValueRef.current = waypoint.lat;
                            draggingStartMouseYRef.current = e.clientY;
                            setDraggingWaypointInput({ berthId: editingBerthId, waypointId: waypoint.id, axis: 'lat' });
                          }}
                          className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-slate-200 cursor-ns-resize"
                          title="按住鼠标左键拖拽可调整纬度"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">经度（可拖拽）</label>
                        <input
                          type="number"
                          step="0.000001"
                          value={waypoint.lng.toFixed(6)}
                          onChange={(e) => updateWaypoint(editingBerthId, waypoint.id, { lng: parseFloat(e.target.value) || 0 })}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // 立即初始化起始值
                            draggingStartValueRef.current = waypoint.lng;
                            draggingStartMouseYRef.current = e.clientY;
                            setDraggingWaypointInput({ berthId: editingBerthId, waypointId: waypoint.id, axis: 'lng' });
                          }}
                          className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-slate-200 cursor-ew-resize"
                          title="按住鼠标左键拖拽可调整经度"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* 泊位提示信息 */}
          {currentBerth.type === 'berth' && currentPosition && (
            <div className="mb-2 p-1.5 bg-orange-600/10 border border-orange-500/30 rounded text-xs text-orange-300">
              <div className="font-semibold mb-0.5">提示：</div>
              <div>泊位不需要设置路径点，船只将从锚位直接到达泊位。</div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-1.5 mt-2 pt-2 border-t border-slate-700 flex-wrap">
            {/* 锚位专用按钮：路径点管理 */}
            {currentBerth.type === 'anchorage' && (
              <>
                <button
                  onClick={() => {
                    if (clickToAddMode) {
                      setClickToAddMode(false);
                    } else {
                      setClickToAddMode(true);
                    }
                  }}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-semibold transition-colors ${
                    clickToAddMode
                      ? 'bg-orange-600 hover:bg-orange-500 text-white'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  <Plus size={12} /> {clickToAddMode ? '取消' : '点击添加'}
                </button>
                <button
                  onClick={() => {
                    const lat = prompt('请输入纬度:');
                    const lng = prompt('请输入经度:');
                    
                    if (lat !== null && lng !== null) {
                      const latNum = parseFloat(lat);
                      const lngNum = parseFloat(lng);
                      if (!isNaN(latNum) && !isNaN(lngNum)) {
                        const newWaypoint: LatLngWaypoint = {
                          id: `wp-${Date.now()}`,
                          lat: latNum,
                          lng: lngNum
                        };
                        setBerthWaypoints(prev => {
                          const newWaypoints = { ...prev };
                          if (!newWaypoints[editingBerthId]) {
                            newWaypoints[editingBerthId] = [];
                          }
                          newWaypoints[editingBerthId] = [...newWaypoints[editingBerthId], newWaypoint];
                          saveWaypointsToStorage(newWaypoints);
                          return newWaypoints;
                        });
                      }
                    }
                  }}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-semibold transition-colors"
                  title="通过输入坐标添加路径点"
                >
                  <Plus size={12} /> 输入添加
                </button>
                <button
                  onClick={() => resetWaypoints(editingBerthId)}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs font-semibold transition-colors"
                >
                  <RotateCw size={12} /> 重置
                </button>
              </>
            )}
            {/* 已隐藏：锚位添加、泊位添加、管理按钮 */}
            {false && (
              <>
                <button
                  onClick={() => {
                    setAddMode('anchorage');
                    setClickToAddMode(false);
                    setEditingBerthId(null);
                  }}
                  className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-semibold transition-colors ${
                    addMode === 'anchorage'
                      ? 'bg-green-600 hover:bg-green-500 text-white'
                      : 'bg-green-700 hover:bg-green-600 text-white'
                  }`}
                  title="点击地图添加锚位"
                >
                  <Plus size={12} /> 锚位
                </button>
                <button
                  onClick={() => {
                    setAddMode('berth');
                    setClickToAddMode(false);
                    setEditingBerthId(null);
                  }}
                  className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-semibold transition-colors ${
                    addMode === 'berth'
                      ? 'bg-orange-600 hover:bg-orange-500 text-white'
                      : 'bg-orange-700 hover:bg-orange-600 text-white'
                  }`}
                  title="点击地图添加泊位"
                >
                  <Plus size={12} /> 泊位
                </button>
                <button
                  onClick={() => {
                    setShowManagementPanel(true);
                    setEditingBerthId(null);
                  }}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs font-semibold transition-colors"
                  title="打开管理面板"
                >
                  <Edit2 size={12} /> 管理
                </button>
              </>
            )}
            <button
              onClick={() => exportWaypoints(berthWaypoints, berthPositions)}
              className="flex items-center justify-center gap-1 px-2 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold transition-colors"
              title="导出当前配置为JSON文件"
            >
              <Download size={12} /> 导出
            </button>
          </div>
        </div>,
        portalContainer
        );
      })()}
    </div>
  );
};

export default StaticMap;
