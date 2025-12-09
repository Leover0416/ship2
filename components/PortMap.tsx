import React, { useState, useRef, useEffect } from 'react';
import { Berth, Ship } from '../types';
import { X, Plus, Trash2, RotateCw, Download } from 'lucide-react';
import defaultWaypointsData from './berth-waypoints.json';

interface PortMapProps {
  ships: Ship[];
  berths: Berth[];
  simulationPhase: string;
  onBerthClick?: (berthId: string) => void;
  processingShipIds?: string[]; // 正在处理中的船只ID列表
}

// 路径点数据结构
interface Waypoint {
  id: string;
  x: number;
  y: number;
  headingDeg?: number; // 船头转向角度（度）
}

// 每个泊位的路径点配置
type BerthWaypoints = Record<string, Waypoint[]>;

// Layout Constants
const MAP_CONFIG = {
  // 镇海锚地（绿色区域左上角"镇海锚地"文字附近）
  // ANCHORAGE_X/Y 为锚地中心
  ANCHORAGE_X: 600,
  ANCHORAGE_Y: 450,
  // 锚地配置（用于等候船只排布的矩形范围）
  ANCHORAGE_WIDTH: 260,
  ANCHORAGE_HEIGHT: 80,
  // 间距调小，让船只更紧凑
  ANCHORAGE_SHIP_SPACING_X: 24,  // 减小横向间距，让船更集中
  ANCHORAGE_SHIP_SPACING_Y: 18,  // 减小纵向间距，让船更集中
};

// 默认路径点配置（每个泊位的初始路径）
// 注意：第一个路径点就是船的起步位置，不使用锚地位置
  const getDefaultWaypoints = (berthId: string): Waypoint[] => {
    // 优先从导入的JSON文件中获取
    const importedData = defaultWaypointsData as Record<string, Waypoint[]>;
    if (importedData && importedData[berthId]) {
      return importedData[berthId];
    }

    const berthPos = BERTH_POSITIONS[berthId];
    if (!berthPos) return [];
    
    // 默认路径：从合理起始位置到泊位
    // 第一个路径点（点1）就是船的起步位置
    // M05, M03, M04 (原C01, B01, B02) 特殊处理：展示自动计算航向的效果
    if (berthId === 'M05' || berthId === 'M03' || berthId === 'M04') {
      return [
        { id: 'wp-1', x: 600, y: 400 }, // 起始位置（点1）
        { id: 'wp-2', x: 450, y: 200 }, // 中间点
        // 不设置 headingDeg，让其自动沿航线方向
      ];
    }

    return [
      { id: 'wp-1', x: 550, y: 400 }, // 起始位置（点1）
      { id: 'wp-2', x: 300, y: 250 },
      { id: 'wp-3', x: berthPos.x - 50, y: berthPos.y + 30 },
    ];
  };

// 从 localStorage 加载路径点配置（同步版本，用于初始化）
const loadWaypointsFromStorage = (): BerthWaypoints => {
  try {
    const stored = localStorage.getItem('berth-waypoints');
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log('[Waypoints] Loaded from localStorage:', Object.keys(parsed).map(id => `${id}:${parsed[id]?.length || 0} points`).join(', '));
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load waypoints from localStorage:', e);
  }
  return {};
};

  // 保存路径点配置到 localStorage
  const saveWaypointsToStorage = (waypoints: BerthWaypoints) => {
    try {
      localStorage.setItem('berth-waypoints', JSON.stringify(waypoints));
      console.log('[Waypoints] Saved to storage:', Object.keys(waypoints).map(id => `${id}:${waypoints[id]?.length || 0} points`).join(', '));
    } catch (e) {
      console.error('Failed to save waypoints to storage:', e);
    }
  };

  // 导出路径点配置为 JSON 文件
  const exportWaypoints = (waypoints: BerthWaypoints) => {
    try {
      const data = JSON.stringify(waypoints, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'berth-waypoints.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export waypoints:', e);
      alert('导出失败，请查看控制台错误信息');
    }
  };

    // 泊位在地图背景上的实际位置（根据T型区域05/07/08等位置设置）
const BERTH_POSITIONS: Record<string, { x: number; y: number }> = {
  // 新增泊位
  'A01': { x: 474, y: 62 },
  'B01': { x: 410, y: 13},
  'C01': { x: 563, y: 72 },
  'C02': { x: 432, y: 36 },
  
  // 原有泊位改为锚位
  'M01': { x: 370, y: 61 },  // 原 A01
  'M02': { x: 422, y: 62 },  // 原 A02
  'M03': { x: 370, y: 102 }, // 原 B01
  'M04': { x: 420, y: 101 }, // 原 B02
  'M05': { x: 305, y: 70 }, // 原 C01
  'M06': { x: 320, y: 105 }, // 原 C02
};

// 每个泊位停靠后船的箭头朝向（度）
// 0度=朝上, 90度=朝右, 180度=朝下, 270度=朝左
const BERTH_DOCKED_ROTATION: Record<string, number> = {
  'A01': 0,
  'B01': 0,
  'C01': 0,
  'C02': 0,
  
  'M01': 0,   // 原 A01 朝右 -> 0? 原代码注释说是朝右但值为0，ship.svg默认朝上，0度是朝上。
              // 原代码：'A01': 0, // 朝右。 Wait, if 0 is Up, then 90 is Right. 
              // The comment says "0度=朝上". But "A01: 0 // 朝右". This is contradictory or the comment is wrong.
              // Let's trust the value.
  'M02': 0,
  'M03': 0,
  'M04': 77,
  'M05': 72,
  'M06': 72,
};

// 地图原始尺寸
const MAP_ORIGINAL_WIDTH = 800;
const MAP_ORIGINAL_HEIGHT = 500;

const PortMap: React.FC<PortMapProps> = ({ ships, berths, simulationPhase, onBerthClick, processingShipIds = [] }) => {
  // 当前选中的泊位，用于显示信息弹窗
  const [selectedBerth, setSelectedBerth] = useState<Berth | null>(null);
  // 当前悬停的泊位/锚位
  const [hoveredBerthId, setHoveredBerthId] = useState<string | null>(null);
  // 当前鼠标悬停的船 ID
  const [hoveredShipId, setHoveredShipId] = useState<string | null>(null);
  // 缩放比例和容器尺寸
  const [scale, setScale] = useState(1);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 路径点编辑状态
  const [berthWaypoints, setBerthWaypoints] = useState<BerthWaypoints>(() => {
    // 初始状态：先使用默认数据或空对象
    const initialData = (defaultWaypointsData as BerthWaypoints) || {};
    return initialData;
  });

  // 从 public/waypoints/berth-waypoints.json 或 localStorage 加载路径点
  useEffect(() => {
    const loadWaypoints = async () => {
      try {
        // 优先从 public/waypoints/berth-waypoints.json 加载
        const response = await fetch('/waypoints/berth-waypoints.json');
        if (response.ok) {
          const data = await response.json();
          console.log('[Waypoints] Loaded from public/waypoints/berth-waypoints.json:', Object.keys(data).map(id => `${id}:${data[id]?.length || 0} points`).join(', '));
          // 同步到 localStorage 以便后续编辑
          localStorage.setItem('berth-waypoints', JSON.stringify(data));
          setBerthWaypoints(data);
          return;
        }
      } catch (e) {
        console.warn('[Waypoints] Failed to load from public/waypoints/berth-waypoints.json, trying localStorage:', e);
      }
      
      // 如果 public 文件不存在，从 localStorage 加载
      try {
        const stored = localStorage.getItem('berth-waypoints');
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log('[Waypoints] Loaded from localStorage:', Object.keys(parsed).map(id => `${id}:${parsed[id]?.length || 0} points`).join(', '));
          setBerthWaypoints(parsed);
          return;
        }
      } catch (e) {
        console.error('Failed to load waypoints from localStorage:', e);
      }
      
      // 如果都没有，使用默认数据并初始化缺失的泊位
      const allBerthIds = ['A01', 'B01', 'C01', 'C02', 'M01', 'M02', 'M03', 'M04', 'M05', 'M06'];
      const currentData = { ...berthWaypoints };
      let needsSave = false;
      allBerthIds.forEach(id => {
        if (!currentData.hasOwnProperty(id)) {
          currentData[id] = getDefaultWaypoints(id);
          needsSave = true;
        }
      });
      if (needsSave) {
        saveWaypointsToStorage(currentData);
        setBerthWaypoints(currentData);
      }
      console.log('[Waypoints] Initialized with default data:', Object.keys(currentData).map(id => `${id}:${currentData[id]?.length || 0} points`).join(', '));
    };
    
    loadWaypoints();
  }, []); // 只在组件挂载时执行一次
  const [editingBerthId, setEditingBerthId] = useState<string | null>(null);
  const [draggingWaypoint, setDraggingWaypoint] = useState<{ berthId: string; waypointId: string } | null>(null);
  const [editingWaypoint, setEditingWaypoint] = useState<{ berthId: string; waypointId: string } | null>(null);
  
  // 编辑面板拖拽状态
  const [panelPosition, setPanelPosition] = useState<{ x: number; y: number } | null>(null);
  const [draggingPanel, setDraggingPanel] = useState(false);
  const [clickToAddMode, setClickToAddMode] = useState(false);
  
  // 初始化面板位置（居中）
  useEffect(() => {
    if (editingBerthId && panelPosition === null && containerSize.width > 0) {
      setPanelPosition({ 
        x: (containerSize.width - 320) / 2, // 假设面板最小宽度320px
        y: 20 
      });
    }
    if (!editingBerthId) {
      setPanelPosition(null);
    }
  }, [editingBerthId, containerSize.width]);

  // 计算缩放比例，保持宽高比不变形
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // 计算缩放比例，使用较小值以保持宽高比，避免变形
        const scaleX = containerWidth / MAP_ORIGINAL_WIDTH;
        const scaleY = containerHeight / MAP_ORIGINAL_HEIGHT;
        const newScale = Math.min(scaleX, scaleY); // 取较小值以保持比例，不变形
        
        setScale(Math.max(0.1, Math.min(newScale, 3))); // 限制缩放范围在0.1到3之间
        setContainerSize({ width: containerWidth, height: containerHeight });
      }
    };

    // 初始计算
    updateScale();
    
    // 使用ResizeObserver监听容器尺寸变化
    const resizeObserver = new ResizeObserver(updateScale);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    window.addEventListener('resize', updateScale);
    return () => {
      window.removeEventListener('resize', updateScale);
      resizeObserver.disconnect();
    };
  }, []);
  
  const getBerthCenterPosition = (berthId: string) => {
    // 直接从地图背景上的泊位位置获取
    const position = BERTH_POSITIONS[berthId];
    if (!position) return null;
    return position;
  };

  // 获取泊位的路径点
  const getBerthWaypoints = (berthId: string): Waypoint[] => {
    // 优先从 localStorage 加载（确保使用最新保存的数据）
    let waypoints: Waypoint[] | undefined;
    try {
      const stored = localStorage.getItem('berth-waypoints');
      if (stored) {
        const parsed = JSON.parse(stored);
        waypoints = parsed[berthId];
        // 如果从 localStorage 加载到了，同步到 state
        if (waypoints && waypoints.length > 0) {
          // 只有当 state 中的数据不同时才更新，避免不必要的渲染
          if (!berthWaypoints[berthId] || 
              berthWaypoints[berthId].length !== waypoints.length ||
              JSON.stringify(berthWaypoints[berthId]) !== JSON.stringify(waypoints)) {
            console.log(`[Waypoints] Syncing ${waypoints.length} points for ${berthId} from localStorage to state`);
            setBerthWaypoints(prev => ({ ...prev, [berthId]: waypoints }));
          }
        }
      }
    } catch (e) {
      console.error('Failed to load waypoints from localStorage:', e);
    }
    
    // 如果 localStorage 中没有，尝试从 state 获取
    if (!waypoints || waypoints.length === 0) {
      waypoints = berthWaypoints[berthId];
    }
    
    // 如果还是没有，使用默认值
    if (!waypoints || waypoints.length === 0) {
      console.warn(`[Waypoints] No waypoints found for ${berthId}, using defaults`);
      waypoints = getDefaultWaypoints(berthId);
    }
    
    // 调试信息 - 显示来源和详细信息
    const source = (() => {
      try {
        const stored = localStorage.getItem('berth-waypoints');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed[berthId] && parsed[berthId].length > 0) {
            return 'localStorage';
          }
        }
      } catch (e) {}
      return berthWaypoints[berthId] && berthWaypoints[berthId].length > 0 ? 'state' : 'default';
    })();
    
    // 只在开发环境或首次加载时输出日志，避免重复输出
    if (process.env.NODE_ENV === 'development' && !(window as any).__waypointsLogged?.[berthId]) {
    console.log(`[Waypoints] ${berthId}:`, waypoints.length, 'points from', source);
    console.log(`[Waypoints] ${berthId} details:`, waypoints.map((wp, i) => `P${i+1}(${Math.round(wp.x)},${Math.round(wp.y)})`).join(' -> '));
      if (!(window as any).__waypointsLogged) {
        (window as any).__waypointsLogged = {};
      }
      (window as any).__waypointsLogged[berthId] = true;
    }
    
    return waypoints;
  };

  // 更新路径点
  const updateWaypoint = (berthId: string, waypointId: string, updates: Partial<Waypoint>) => {
    setBerthWaypoints(prev => {
      const newWaypoints = { ...prev };
      if (!newWaypoints[berthId]) {
        newWaypoints[berthId] = getDefaultWaypoints(berthId);
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
        newWaypoints[berthId] = getDefaultWaypoints(berthId);
      }
      const waypoints = newWaypoints[berthId];
      const newId = `wp-${Date.now()}`;
      // 如果已有路径点，新点在最后一个点附近；如果没有路径点，使用合理默认位置
      const lastWaypoint = waypoints.length > 0 ? waypoints[waypoints.length - 1] : null;
      const newWaypoint: Waypoint = {
        id: newId,
        x: lastWaypoint ? lastWaypoint.x + 50 : 550, // 默认起始位置
        y: lastWaypoint ? lastWaypoint.y + 50 : 400, // 默认起始位置
        // headingDeg: undefined, // 默认为空，自动计算方向
      };
      
      if (afterIndex !== undefined && afterIndex >= 0 && afterIndex < waypoints.length) {
        waypoints.splice(afterIndex + 1, 0, newWaypoint);
      } else {
        waypoints.push(newWaypoint);
      }
      saveWaypointsToStorage(newWaypoints);
      return newWaypoints;
    });
  };

  // 删除路径点
  const deleteWaypoint = (berthId: string, waypointId: string) => {
    setBerthWaypoints(prev => {
      const newWaypoints = { ...prev };
      if (!newWaypoints[berthId]) return prev;
      newWaypoints[berthId] = newWaypoints[berthId].filter(wp => wp.id !== waypointId);
      if (newWaypoints[berthId].length === 0) {
        // 如果删除所有点，恢复默认
        newWaypoints[berthId] = getDefaultWaypoints(berthId);
      }
      saveWaypointsToStorage(newWaypoints);
      return newWaypoints;
    });
  };

  // 重置路径点
  const resetWaypoints = (berthId: string) => {
    setBerthWaypoints(prev => {
      const newWaypoints = { ...prev };
      newWaypoints[berthId] = getDefaultWaypoints(berthId);
      saveWaypointsToStorage(newWaypoints);
      return newWaypoints;
    });
  };

  // 处理鼠标移动（拖拽路径点或编辑面板）
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingPanel) {
        // 拖拽编辑面板
        setPanelPosition(prev => ({
          x: prev.x + e.movementX,
          y: prev.y + e.movementY,
        }));
        return;
      }
      
      if (!draggingWaypoint || !containerRef.current) return;
      
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      
      // 计算缩放后的坐标
      const mapDisplayWidth = MAP_ORIGINAL_WIDTH * scale;
      const mapDisplayHeight = MAP_ORIGINAL_HEIGHT * scale;
      const mapLeft = (container.clientWidth - mapDisplayWidth) / 2;
      const mapTop = (container.clientHeight - mapDisplayHeight) / 2;
      
      // 将鼠标坐标转换为地图坐标
      const x = ((e.clientX - rect.left - mapLeft) / scale);
      const y = ((e.clientY - rect.top - mapTop) / scale);
      
      // 限制在地图范围内
      const clampedX = Math.max(0, Math.min(MAP_ORIGINAL_WIDTH, x));
      const clampedY = Math.max(0, Math.min(MAP_ORIGINAL_HEIGHT, y));
      
      updateWaypoint(draggingWaypoint.berthId, draggingWaypoint.waypointId, {
        x: clampedX,
        y: clampedY,
      });
    };

    const handleMouseUp = () => {
      setDraggingWaypoint(null);
      setDraggingPanel(false);
    };

    if (draggingWaypoint || draggingPanel) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingWaypoint, draggingPanel, scale]);

  // 处理地图点击添加路径点
  const handleMapClickForAdd = (e: React.MouseEvent) => {
    if (!clickToAddMode || !editingBerthId || !containerRef.current) {
      // 如果不是点击添加模式，只关闭选中状态
      setSelectedBerth(null);
      return;
    }
    
    e.stopPropagation();
    e.preventDefault();
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    // 计算缩放后的坐标
    const mapDisplayWidth = MAP_ORIGINAL_WIDTH * scale;
    const mapDisplayHeight = MAP_ORIGINAL_HEIGHT * scale;
    const mapLeft = (container.clientWidth - mapDisplayWidth) / 2;
    const mapTop = (container.clientHeight - mapDisplayHeight) / 2;
    
    // 将鼠标坐标转换为地图坐标
    const x = ((e.clientX - rect.left - mapLeft) / scale);
    const y = ((e.clientY - rect.top - mapTop) / scale);
    
    // 限制在地图范围内
    const clampedX = Math.max(0, Math.min(MAP_ORIGINAL_WIDTH, x));
    const clampedY = Math.max(0, Math.min(MAP_ORIGINAL_HEIGHT, y));
    
    // 添加新路径点
    const newId = `wp-${Date.now()}`;
    const newWaypoint: Waypoint = {
      id: newId,
      x: clampedX,
      y: clampedY,
      // headingDeg: undefined, // 默认为空，自动计算方向
    };
    
    setBerthWaypoints(prev => {
      const newWaypoints = { ...prev };
      // 如果这个泊位还没有路径点，初始化为空数组（不要用默认值覆盖）
      if (!newWaypoints[editingBerthId]) {
        newWaypoints[editingBerthId] = [];
      }
      // 添加新路径点
      newWaypoints[editingBerthId] = [...newWaypoints[editingBerthId], newWaypoint];
      // 保存到 localStorage
      saveWaypointsToStorage(newWaypoints);
      console.log(`[Waypoints] Added waypoint to ${editingBerthId}, now has ${newWaypoints[editingBerthId].length} points`);
      return newWaypoints;
    });
    
    // 关闭点击添加模式
    setClickToAddMode(false);
  };

const getShipPosition = (ship: Ship, index: number, waitingShips: Ship[]) => {
    // 1. Waiting - 确保所有船只都在锚地虚线框内（考虑船只尺寸和旋转）
    if (ship.status === 'waiting') {
    // 计算在waiting船只中的索引（后续默认摆放用）
    const waitingIndex = waitingShips.findIndex(s => s.id === ship.id);
    if (waitingIndex === -1) return { x: -9999, y: -9999 };

    // 如果有锚位分配，优先使用该锚位路径点的第一个点作为起始摆放位置
    if (ship.assignedAnchorageId) {
      const anchorageWaypoints = getBerthWaypoints(ship.assignedAnchorageId);
      if (anchorageWaypoints.length > 0) {
        return { x: anchorageWaypoints[0].x, y: anchorageWaypoints[0].y };
      }
    } else {
      // 如果尚未分配锚位，按顺序映射到锚位列表的第一个路径点，避免并排网格
      const defaultAnchorageOrder = ['M01', 'M02', 'M03', 'M04', 'M05', 'M06'];
      const fallbackAnchorageId = defaultAnchorageOrder[waitingIndex % defaultAnchorageOrder.length];
      const fallbackWaypoints = getBerthWaypoints(fallbackAnchorageId);
      if (fallbackWaypoints.length > 0) {
        return { x: fallbackWaypoints[0].x, y: fallbackWaypoints[0].y };
      }
    }
      
      // 锚地虚线框的实际边界（与渲染的虚线框完全一致）
      const anchorageLeft = MAP_CONFIG.ANCHORAGE_X - 40;
      const anchorageTop = MAP_CONFIG.ANCHORAGE_Y - MAP_CONFIG.ANCHORAGE_HEIGHT / 2;
      const anchorageRight = anchorageLeft + MAP_CONFIG.ANCHORAGE_WIDTH;
      const anchorageBottom = anchorageTop + MAP_CONFIG.ANCHORAGE_HEIGHT;
      
      // 船只尺寸（考虑旋转后可能的最大占用空间）
      const shipMaxSize = 20; // 减小尺寸，让船更集中
      const margin = shipMaxSize / 2 + 4; // 边距 = 船只半径 + 4px安全距离（减小边距）
      
      // 计算每行可以放多少艘船（根据锚地宽度，留出足够边距）
      const availableWidth = Math.max(10, MAP_CONFIG.ANCHORAGE_WIDTH - margin * 2);
      const shipsPerRow = Math.max(1, Math.floor(availableWidth / MAP_CONFIG.ANCHORAGE_SHIP_SPACING_X));
      const row = Math.floor(waitingIndex / shipsPerRow);
      const col = waitingIndex % shipsPerRow;
      
      // 居中排列，确保在虚线框内
      const totalInRow = Math.min(shipsPerRow, waitingShips.length - row * shipsPerRow);
      const rowWidth = Math.max(0, (totalInRow - 1) * MAP_CONFIG.ANCHORAGE_SHIP_SPACING_X);
      const startX = anchorageLeft + margin + (availableWidth - rowWidth) / 2;
      
      // 计算y坐标，确保在虚线框内
      const availableHeight = Math.max(10, MAP_CONFIG.ANCHORAGE_HEIGHT - margin * 2);
      const startY = anchorageTop + margin + (row * MAP_CONFIG.ANCHORAGE_SHIP_SPACING_Y);
      
      // 计算最终位置，确保不超出边界
      const x = Math.max(anchorageLeft + margin, Math.min(anchorageRight - margin, startX + (col * MAP_CONFIG.ANCHORAGE_SHIP_SPACING_X)));
      const y = Math.max(anchorageTop + margin, Math.min(anchorageBottom - margin, startY));
      
      return { x, y };
    }
    
    // 2. Navigating - 船按照红色路径点依次移动
    if (ship.status === 'navigating' && ship.assignedBerthId) {
      const berthPos = getBerthCenterPosition(ship.assignedBerthId);
      if (!berthPos) return { x: -9999, y: -9999 };

      // 判断是第一阶段（从起步点到锚位）还是第二阶段（从锚位到泊位）
      const isFromAnchorage = ship.assignedAnchorageId && 
                              ship.assignedBerthId !== ship.assignedAnchorageId;
      
      let pathPoints: { x: number; y: number }[] = [];
      
      if (isFromAnchorage) {
        // 第二阶段：从锚位到泊位
        const anchoragePos = getBerthCenterPosition(ship.assignedAnchorageId!);
        if (!anchoragePos) return { x: -9999, y: -9999 };
        
        // 尝试从 localStorage 获取锚位到泊位的路径点（键名格式：M01->A01）
        let waypoints: Waypoint[] = [];
        try {
          const stored = localStorage.getItem('berth-waypoints');
          if (stored) {
            const waypointsData = JSON.parse(stored);
            const pathKey = `${ship.assignedAnchorageId}->${ship.assignedBerthId}`;
            waypoints = waypointsData[pathKey] || [];
          }
        } catch (e) {
          console.error('Failed to load waypoints from localStorage:', e);
        }
        
        // 如果没有配置路径点，使用直线路径（从锚位直接到泊位）
        if (waypoints.length === 0) {
          pathPoints = [anchoragePos, berthPos];
        } else {
          // 使用配置的路径点：锚位 -> 路径点1 -> 路径点2 -> ... -> 泊位
          pathPoints = [
            anchoragePos,
            ...waypoints.map(wp => ({ x: wp.x, y: wp.y })),
            berthPos
          ];
        }
      } else {
        // 第一阶段：从起步点到锚位（使用锚位的路径点）
      const waypoints = getBerthWaypoints(ship.assignedBerthId);
      if (waypoints.length === 0) {
        return berthPos;
      }
      
        // 构建路径：点1 -> 点2 -> ... -> 点N -> 锚位
        pathPoints = [
        ...waypoints.map(wp => ({ x: wp.x, y: wp.y })),
        berthPos
      ];
      }
      
      // 确保progress有值，默认为0
      const progress = Math.max(0, Math.min(1, ship.progress ?? 0));
      
      // progress=1: 在终点
      if (progress >= 1) {
        return berthPos;
      }
      
      // progress=0: 在第一个路径点（起点），但需要平滑过渡
      // 如果路径点为空，返回终点位置
      if (pathPoints.length === 0) {
        return berthPos;
      }
      
      // 如果只有一个点，直接返回
      if (pathPoints.length === 1) {
        return pathPoints[0];
      }
      
      // 计算每段的距离
      const segmentDistances: number[] = [];
      let totalDistance = 0;
      for (let i = 0; i < pathPoints.length - 1; i++) {
        const dx = pathPoints[i + 1].x - pathPoints[i].x;
        const dy = pathPoints[i + 1].y - pathPoints[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
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
        segIndex = i;
      }
      
      // 在当前段内插值
      const segStartDist = accDist;
      const segDist = segmentDistances[segIndex];
      const segProgress = segDist > 0 ? Math.max(0, Math.min(1, (targetDist - segStartDist) / segDist)) : 0;
      
      const p0 = pathPoints[segIndex];
      const p1 = pathPoints[segIndex + 1];
      
      const result = {
        x: p0.x + (p1.x - p0.x) * segProgress,
        y: p0.y + (p1.y - p0.y) * segProgress
      };
      
      return result;
    }

    // 3. Anchored - 船停在锚位
    if (ship.status === 'anchored' && ship.assignedAnchorageId) {
      const anchoragePos = getBerthCenterPosition(ship.assignedAnchorageId);
      if (anchoragePos) {
        // 锚位位置，船显示在锚位标记点附近
        const isCZone = ship.assignedAnchorageId.startsWith('C') || 
                        ship.assignedAnchorageId.startsWith('M05') || 
                        ship.assignedAnchorageId.startsWith('M06') || 
                        ship.assignedAnchorageId === 'M03' || 
                        ship.assignedAnchorageId === 'M04';
        const shipY = anchoragePos.y + (isCZone ? -22 : 20);
        return { x: anchoragePos.x, y: shipY };
      }
    }

    // 4. Docking (Moves from Waypoint to Berth)
    if (ship.status === 'docking' && ship.assignedBerthId) {
       const berthPos = getBerthCenterPosition(ship.assignedBerthId);
       if (berthPos) return { x: berthPos.x, y: berthPos.y };
    }
    
    // 5. Departing
    if (ship.status === 'departing') {
        return { x: -200, y: 100 };
    }

    return { x: -9999, y: -9999 };
  };

  // 获取泊位停靠时的角度（优先使用最后一个路径点的角度，否则使用默认配置）
  const getDockedRotation = (berthId: string) => {
    const waypoints = getBerthWaypoints(berthId);
    const berthPos = BERTH_POSITIONS[berthId];
    
    if (waypoints && waypoints.length > 0) {
      const lastWaypoint = waypoints[waypoints.length - 1];
      if (lastWaypoint.headingDeg !== undefined) {
        return lastWaypoint.headingDeg;
      } else if (berthPos) {
         // 如果未设置角度，则自动计算：从最后一个路径点指向泊位的方向
         const dx = berthPos.x - lastWaypoint.x;
         const dy = berthPos.y - lastWaypoint.y;
         return (Math.atan2(dy, dx) * 180 / Math.PI) + 90; // +90 适配 ship.svg 默认朝上
      }
    }
    return BERTH_DOCKED_ROTATION[berthId] || 90;
  };

  /**
   * 船舶图标：使用用户提供的船.svg，并根据船长和旋转角度缩放/旋转
   * 注意：ship.svg 默认尖头朝上，这里所有 rotationDeg 都是围绕"尖头朝上"为 0 度来计算
   */
  const renderShipIcon = (ship: Ship, rotationDeg: number, isMoving: boolean = false) => {
    // 统一所有船的大小，比现在小一点
    const width = 24; // 统一大小，所有船都是18px宽

    // 移动时：船的边缘发光（使用 drop-shadow，只作用于船的形状边缘，不是矩形边缘）
    // 静止时：普通阴影
    const filterStyle = isMoving 
      ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.9)) drop-shadow(0 0 4px rgba(59, 130, 246, 0.6)) saturate(1.2) contrast(1.02)'
      : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3)) saturate(1.2) contrast(1.02)';

    return (
      <img
        src="/船.svg"
        alt={ship.name}
        className="select-none"
        style={{
          width: `${width}px`,
          height: 'auto',
          // 先平移再旋转，让锚点接近船中心
          transform: `translateY(1px) rotate(${rotationDeg}deg)`,
          // 使用 drop-shadow 实现边缘发光，只作用于船的形状，不是整个矩形
          filter: filterStyle,
        }}
        draggable={false}
      />
    );
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden rounded-lg shadow-inner select-none font-sans" 
      style={{ 
        position: 'relative',
        background: 'transparent'
      }}
    >
      {/* 玻璃质感蒙版层 - 填充黑边区域，使用四个方向的遮罩 */}
      {(() => {
        if (containerSize.width === 0 || containerSize.height === 0) return null;
        
        const mapDisplayWidth = MAP_ORIGINAL_WIDTH * scale;
        const mapDisplayHeight = MAP_ORIGINAL_HEIGHT * scale;
        const mapLeft = (containerSize.width - mapDisplayWidth) / 2;
        const mapTop = (containerSize.height - mapDisplayHeight) / 2;
        const mapRight = mapLeft + mapDisplayWidth;
        const mapBottom = mapTop + mapDisplayHeight;
        
        return (
          <div className="absolute inset-0 z-[1] pointer-events-none">
            {/* 上边黑边 */}
            {mapTop > 0 && (
              <div 
                className="absolute left-0 right-0"
                style={{
                  top: 0,
                  height: `${mapTop}px`,
                  background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.92), rgba(59, 130, 246, 0.3))',
                  backdropFilter: 'blur(50px) saturate(180%) brightness(1.2)',
                  WebkitBackdropFilter: 'blur(50px) saturate(180%) brightness(1.2)',
                }}
              />
            )}
            
            {/* 下边黑边 */}
            {mapBottom < containerSize.height && (
              <div 
                className="absolute left-0 right-0"
                style={{
                  bottom: 0,
                  height: `${containerSize.height - mapBottom}px`,
                  background: 'linear-gradient(to top, rgba(15, 23, 42, 0.92), rgba(6, 182, 212, 0.3))',
                  backdropFilter: 'blur(50px) saturate(180%) brightness(1.2)',
                  WebkitBackdropFilter: 'blur(50px) saturate(180%) brightness(1.2)',
                }}
              />
            )}
            
            {/* 左边黑边 */}
            {mapLeft > 0 && (
              <div 
                className="absolute top-0 bottom-0"
                style={{
                  left: 0,
                  width: `${mapLeft}px`,
                  background: 'linear-gradient(to right, rgba(15, 23, 42, 0.92), rgba(59, 130, 246, 0.25))',
                  backdropFilter: 'blur(50px) saturate(180%) brightness(1.2)',
                  WebkitBackdropFilter: 'blur(50px) saturate(180%) brightness(1.2)',
                }}
              />
            )}
            
            {/* 右边黑边 */}
            {mapRight < containerSize.width && (
              <div 
                className="absolute top-0 bottom-0"
                style={{
                  right: 0,
                  width: `${containerSize.width - mapRight}px`,
                  background: 'linear-gradient(to left, rgba(15, 23, 42, 0.92), rgba(6, 182, 212, 0.25))',
                  backdropFilter: 'blur(50px) saturate(180%) brightness(1.2)',
                  WebkitBackdropFilter: 'blur(50px) saturate(180%) brightness(1.2)',
                }}
              />
            )}
          </div>
        );
      })()}

      {/* 缩放容器 - 保持800x500的坐标系，通过transform scale适应容器，保持宽高比不变形 */}
      <div 
        className="absolute z-[2]"
        style={{
          width: `${MAP_ORIGINAL_WIDTH}px`,
          height: `${MAP_ORIGINAL_HEIGHT}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          left: '50%',
          top: '50%',
          marginLeft: `-${MAP_ORIGINAL_WIDTH / 2}px`,
          marginTop: `-${MAP_ORIGINAL_HEIGHT / 2}px`,
        }}
        onClick={handleMapClickForAdd}
      >
        {/* 1. 地图背景 - 填满800x500坐标系 */}
        <div className="absolute z-0" style={{ width: '800px', height: '500px', left: 0, top: 0 }}>
          <img 
            src="/地图背景.png" 
            alt="地图背景"
            style={{ width: '800px', height: '500px', objectFit: 'cover', display: 'block' }}
          />
        </div>


      {/* 3. 风速特效 - 流动的线条和粒子 */}
      <div className="absolute inset-0 z-[1] pointer-events-none opacity-40">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="windGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="30%" stopColor="rgba(255,255,255,0.4)" />
              <stop offset="70%" stopColor="rgba(255,255,255,0.4)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
            <filter id="windBlur">
              <feGaussianBlur in="SourceGraphic" stdDeviation="0.5"/>
            </filter>
          </defs>
          
          {/* 多条风速线 - 不同高度和速度 */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <g key={`wind-group-${i}`}>
              <line
                x1="0"
                y1={15 + i * 12}
                x2="100"
                y2={12 + i * 12}
                stroke="url(#windGradient)"
                strokeWidth="0.3"
                className="animate-wind-flow"
                filter="url(#windBlur)"
                style={{ 
                  animationDelay: `${i * 0.4}s`,
                  animationDuration: `${6 + i * 1.5}s`
                }}
              />
              {/* 添加小粒子 */}
              {[0, 1, 2].map((j) => (
                <circle
                  key={`particle-${i}-${j}`}
                  cx={30 + j * 20}
                  cy={13.5 + i * 12}
                  r="0.2"
                  fill="rgba(255,255,255,0.6)"
                  className="animate-wind-flow"
                  style={{ 
                    animationDelay: `${i * 0.4 + j * 0.2}s`,
                    animationDuration: `${6 + i * 1.5}s`
                  }}
                />
              ))}
            </g>
          ))}
        </svg>
      </div>
      

      {/* 3. Trajectory Lines - 每艘船从锚地实际位置到泊位的整条曲线路径 */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
         {(() => {
          // 只为正在移动的船（navigating 或 docking 状态）画轨迹线
          // 这样轨迹线会一艘船一艘船地出现，而不是一次性全部画出来
          const movingShips = ships.filter(s => 
            (s.status === 'navigating' || s.status === 'docking') && 
            s.assignedBerthId &&
            processingShipIds && processingShipIds.includes(s.id)
          );
          
          return movingShips.map((ship) => {
            if (ship.assignedBerthId) {
              // 第二阶段（锚位->泊位）不显示蓝色虚线，只在第一阶段（起步->锚位）显示
              const isFromAnchorage = ship.assignedAnchorageId && ship.assignedBerthId !== ship.assignedAnchorageId;
              if (isFromAnchorage) return null;

              // 获取泊位位置（终点）
              const berthPos = getBerthCenterPosition(ship.assignedBerthId);
              if (!berthPos) return null;

              // 使用可编辑的路径点构建路径（与 getShipPosition 中的逻辑保持一致）
              // 路径直接从第一个路径点开始，依次经过所有路径点，最后到达泊位
              const waypoints = getBerthWaypoints(ship.assignedBerthId);
              const waypointPositions = waypoints.map(wp => ({ x: wp.x, y: wp.y }));
              const pathPoints = [...waypointPositions, berthPos];

              // 绘制直线路径（按照红色路径点的连线）
              let pathData = `M ${pathPoints[0].x} ${pathPoints[0].y}`;
              for (let i = 1; i < pathPoints.length; i++) {
                pathData += ` L ${pathPoints[i].x} ${pathPoints[i].y}`;
              }
              
              // 绘制轨迹线（直线连接，与船的移动路径完全一致）
               return (
                 <path 
                   key={`path-${ship.id}`}
                   d={pathData}
                   fill="none"
                   stroke="#38bdf8"
                   strokeWidth="2"
                   strokeDasharray="6,4"
                   className="opacity-80"
                 />
               );
             }
             return null;
           });
         })()}
      </svg>

      {/* 3.5. Waypoints - 路径点（红点）渲染和编辑 */}
      {editingBerthId && (() => {
        const waypoints = getBerthWaypoints(editingBerthId);
        // 去重：确保每个ID只出现一次
        const uniqueWaypoints = waypoints.filter((wp, index, self) => 
          index === self.findIndex(w => w.id === wp.id)
        );
        
        // 如果去重后数量不同，说明有重复，需要修复
        if (uniqueWaypoints.length !== waypoints.length) {
          console.warn(`[Waypoints] Found duplicate waypoints for ${editingBerthId}, fixing...`);
          setBerthWaypoints(prev => {
            const newWaypoints = { ...prev };
            newWaypoints[editingBerthId] = uniqueWaypoints;
            saveWaypointsToStorage(newWaypoints);
            return newWaypoints;
          });
        }
        
        return uniqueWaypoints.map((waypoint, index) => (
          <div
            key={`${editingBerthId}-${waypoint.id}-${index}`}
            className="absolute z-25 group"
            style={{
              left: `${waypoint.x}px`,
              top: `${waypoint.y}px`,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'auto',
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setDraggingWaypoint({ berthId: editingBerthId, waypointId: waypoint.id });
            }}
            onClick={(e) => {
              e.stopPropagation();
              setEditingWaypoint({ berthId: editingBerthId, waypointId: waypoint.id });
            }}
          >
            {/* 路径点（红点） */}
            <div
              className={`w-4 h-4 rounded-full border-2 cursor-move transition-all ${
                draggingWaypoint?.berthId === editingBerthId && draggingWaypoint?.waypointId === waypoint.id
                  ? 'bg-red-600 border-red-400 scale-125 shadow-lg shadow-red-500/50'
                  : 'bg-red-500 border-red-700 hover:bg-red-600 hover:scale-110 hover:shadow-lg'
              }`}
            >
              {/* 路径点标签 */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded border border-slate-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                点 {index + 1}
              </div>
            </div>
          </div>
        ));
      })()}

      {/* 路径点之间的连线 */}
      {editingBerthId && (() => {
        const waypoints = getBerthWaypoints(editingBerthId);
        if (waypoints.length < 1) return null;
        
        const berthPos = getBerthCenterPosition(editingBerthId);
        if (!berthPos) return null;
        
        // 路径直接从第一个路径点开始，依次经过所有路径点，最后到达泊位
        const allPoints = [...waypoints.map(wp => ({ x: wp.x, y: wp.y })), berthPos];
        
        return (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" style={{ pointerEvents: 'none' }}>
            {allPoints.map((point, index) => {
              if (index === allPoints.length - 1) return null;
              const nextPoint = allPoints[index + 1];
              return (
                <line
                  key={`line-${index}`}
                  x1={point.x}
                  y1={point.y}
                  x2={nextPoint.x}
                  y2={nextPoint.y}
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                  opacity="0.6"
                />
              );
            })}
          </svg>
        );
      })()}

      {/* 4. Berths - 直接在地图背景上定位 */}
      {berths.map((berth) => {
        const position = BERTH_POSITIONS[berth.id];
        if (!position) return null;
        
        // C 区（支线）泊位：绿色点在下方，文字/矩形在点下方；其他泊位：文字在上方，点在下方
        // M03/M04 (原B01/B02) 也设置为和 M05 (原C01) 一样
        const isCZone = berth.id.startsWith('C') || berth.id.startsWith('M05') || berth.id.startsWith('M06') || berth.id === 'M03' || berth.id === 'M04';
        
        // 检查是否有船到达锚地或泊位
        const hasShipArrivedAtAnchorage = berth.type === 'anchorage' && ships.some(s => 
          s.assignedBerthId === berth.id && s.status === 'anchored'
        );
        const hasShipArrivedAtBerth = berth.type === 'berth' && ships.some(s => 
          s.assignedBerthId === berth.id && (s.status === 'docked' || s.status === 'anchored')
        );
        
        // 确定颜色：锚地到达后深绿色，泊位到达后橘黄色
        const getPointColor = () => {
          if (berth.isOccupied) return 'bg-red-500 border-red-700';
          if (hasShipArrivedAtAnchorage) return 'bg-green-800 border-green-900'; // 深绿色
          if (hasShipArrivedAtBerth) return 'bg-orange-500 border-orange-600'; // 橘黄色
          return berth.type === 'berth' ? 'bg-amber-400 border-amber-600' : 'bg-green-500 border-green-700';
        };
        
        const getLabelColor = () => {
          if (berth.isOccupied) return 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200 italic';
          if (hasShipArrivedAtAnchorage) return 'bg-green-800 text-green-100 border-green-700 hover:bg-green-900'; // 深绿色
          if (hasShipArrivedAtBerth) return 'bg-orange-500 text-white border-orange-600 hover:bg-orange-600'; // 橘黄色
          return berth.type === 'berth' ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200' : 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200';
        };
        
        return (
          <div
            key={berth.id}
            className="absolute z-20 group transition-all duration-300"
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`,
              transform: 'translate(-50%, -50%)'
            }}
            onMouseEnter={() => setHoveredBerthId(berth.id)}
            onMouseLeave={() => setHoveredBerthId(null)}
          >
            {/* 泊位标记 */}
            <div className="flex flex-col items-center">
              {isCZone ? (
                // C 区：绿色点在下方，文字/矩形在点下方
                <>
                  {/* 定位点 - 在上方 */}
                  <div className={`w-2 h-2 rounded-full border transition-colors ${getPointColor()} shadow-md`}>
                  </div>
                  {/* 泊位ID文字标签 - 在下方，可点击 */}
                  <div 
                    className={`mt-0.5 text-[10px] font-bold px-1 py-0.5 rounded border shadow-sm cursor-pointer transition-all hover:scale-110 hover:shadow-md ${getLabelColor()} ${editingBerthId === berth.id ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (editingBerthId === berth.id) {
                        setEditingBerthId(null);
                        setSelectedBerth(null);
                      } else {
                        setEditingBerthId(berth.id);
                        setSelectedBerth(null);
                      }
                    }}
                    title="点击编辑路径"
                  >
                    {berth.id}
                  </div>
                </>
              ) : (
                // 其他区：文字在上方，点在下方
                <>
                  {/* 泊位ID文字标签 - 在上方，可点击 */}
                  <div 
                    className={`mb-0.5 text-[10px] font-bold px-1 py-0.5 rounded border shadow-sm cursor-pointer transition-all hover:scale-110 hover:shadow-md ${getLabelColor()} ${editingBerthId === berth.id ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (editingBerthId === berth.id) {
                        setEditingBerthId(null);
                        setSelectedBerth(null);
                      } else {
                        setEditingBerthId(berth.id);
                        setSelectedBerth(null);
                      }
                    }}
                    title="点击编辑路径"
                  >
                    {berth.id}
                  </div>
                  {/* 定位点 - 在下方 */}
                  <div className={`w-2 h-2 rounded-full border transition-colors ${getPointColor()} shadow-md`}>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}

      {/* 泊位信息小弹窗（点击或悬停都显示） */}
      {(() => {
        const berthToShow = hoveredBerthId
          ? berths.find(b => b.id === hoveredBerthId)
          : selectedBerth;
        if (!berthToShow) return null;
        const pos = BERTH_POSITIONS[berthToShow.id];
        if (!pos) return null;

        return (
          <div
            className="absolute z-30 bg-slate-900/95 text-slate-100 text-xs px-3 py-2 rounded-md border border-slate-600 shadow-xl pointer-events-auto"
            style={{
              left: `${pos.x}px`,
              top: `${pos.y - 40}px`,
              transform: 'translate(-50%, -100%)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-bold mb-1 flex items-center justify-between">
              <span>
                {berthToShow.type === 'anchorage' ? '锚位' : '泊位'} {berthToShow.id}{' '}
                <span className="text-[10px] text-slate-400">
                  ({berthToShow.zone === 'A' ? '深水区' : berthToShow.zone === 'B' ? '通用区' : '支线区'})
                </span>
              </span>
              {!hoveredBerthId && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingBerthId(editingBerthId === berthToShow.id ? null : berthToShow.id);
                    setSelectedBerth(null);
                  }}
                  className="ml-2 text-red-400 hover:text-red-300 text-[10px] px-1.5 py-0.5 rounded border border-red-500/50 hover:bg-red-500/20 transition-colors"
                >
                  {editingBerthId === berthToShow.id ? '完成编辑' : '编辑路径'}
                </button>
              )}
            </div>
            <div className="space-y-0.5 font-mono">
              <div>长度: {berthToShow.length} m</div>
              <div>水深: {berthToShow.depth} m</div>
              <div>状态: {berthToShow.isOccupied ? '已占用' : '空闲'}</div>
              {berthToShow.type === 'anchorage' && (
                <div className="text-amber-200">规则：锚位水深 ≥ 船舶吃水 × 1.2</div>
              )}
            </div>
          </div>
        );
      })()}

      {/* 路径点编辑面板 */}
      {editingBerthId && panelPosition && (
        <div
          className="absolute z-40 bg-slate-900/98 text-slate-100 text-sm px-4 py-3 rounded-lg border border-slate-600 shadow-2xl pointer-events-auto"
          style={{
            left: `${panelPosition.x}px`,
            top: `${panelPosition.y}px`,
            minWidth: '320px',
            maxWidth: '500px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 拖拽标题栏 */}
          <div 
            className="flex items-center justify-between mb-3 pb-2 border-b border-slate-300 cursor-move select-none bg-slate-200 -mx-4 -mt-3 px-4 pt-3 rounded-t-lg"
            onMouseDown={(e) => {
              e.stopPropagation();
              setDraggingPanel(true);
            }}
          >
            <h3 className="font-bold text-base text-black">编辑路径点 - {editingBerthId}</h3>
            <button
              onClick={() => {
                setEditingBerthId(null);
                setEditingWaypoint(null);
                setClickToAddMode(false);
                setPanelPosition(null); // 重置位置
              }}
              className="text-slate-600 hover:text-black ml-2"
            >
              <X size={18} />
            </button>
          </div>
          
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
          
          <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
            {(() => {
              const waypoints = getBerthWaypoints(editingBerthId);
              // 去重：确保每个ID只出现一次
              const uniqueWaypoints = waypoints.filter((wp, index, self) => 
                index === self.findIndex(w => w.id === wp.id)
              );
              
              // 如果去重后数量不同，说明有重复，需要修复
              if (uniqueWaypoints.length !== waypoints.length) {
                console.warn(`[Waypoints] Found duplicate waypoints in panel for ${editingBerthId}, fixing...`);
                setBerthWaypoints(prev => {
                  const newWaypoints = { ...prev };
                  newWaypoints[editingBerthId] = uniqueWaypoints;
                  saveWaypointsToStorage(newWaypoints);
                  return newWaypoints;
                });
              }
              
              return uniqueWaypoints.map((waypoint, index) => (
                <div
                  key={`panel-${editingBerthId}-${waypoint.id}-${index}`}
                  className="bg-slate-800/60 rounded-lg p-2 border border-slate-700/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-xs text-slate-300">路径点 {index + 1}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => addWaypoint(editingBerthId, index)}
                        className="p-1 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded transition-colors"
                        title="在此点后添加"
                      >
                        <Plus size={14} />
                      </button>
                      {uniqueWaypoints.length > 1 && (
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
                      <label className="text-slate-400 block mb-1">X坐标</label>
                      <input
                        type="number"
                        value={Math.round(waypoint.x)}
                        onChange={(e) => updateWaypoint(editingBerthId, waypoint.id, { x: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Y坐标</label>
                      <input
                        type="number"
                        value={Math.round(waypoint.y)}
                        onChange={(e) => updateWaypoint(editingBerthId, waypoint.id, { y: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-slate-200"
                      />
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
          
          <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700">
            <button
              onClick={() => {
                if (clickToAddMode) {
                  setClickToAddMode(false);
                } else {
                  setClickToAddMode(true);
                }
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded text-xs font-semibold transition-colors ${
                clickToAddMode
                  ? 'bg-orange-600 hover:bg-orange-500 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              <Plus size={14} /> {clickToAddMode ? '取消点击添加' : '点击地图添加'}
            </button>
            <button
              onClick={() => {
                const x = prompt('请输入 X 坐标:');
                const y = prompt('请输入 Y 坐标:');
                
                if (x !== null && y !== null) {
                  const newId = `wp-${Date.now()}`;
                  const newWaypoint: Waypoint = {
                    id: newId,
                    x: Number(x),
                    y: Number(y),
                  };
                  
                  setBerthWaypoints(prev => {
                    const newWaypoints = { ...prev };
                    if (!newWaypoints[editingBerthId]) {
                      newWaypoints[editingBerthId] = getDefaultWaypoints(editingBerthId);
                    }
                    newWaypoints[editingBerthId] = [...newWaypoints[editingBerthId], newWaypoint];
                    saveWaypointsToStorage(newWaypoints);
                    return newWaypoints;
                  });
                }
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-semibold transition-colors"
              title="通过输入坐标添加路径点"
            >
              <Plus size={14} /> 输入添加
            </button>
            <button
              onClick={() => resetWaypoints(editingBerthId)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs font-semibold transition-colors"
            >
              <RotateCw size={14} /> 重置
            </button>
            <button
              onClick={() => exportWaypoints(berthWaypoints)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold transition-colors"
              title="导出当前配置为JSON文件，发送给开发人员可固化到代码中"
            >
              <Download size={14} /> 导出
            </button>
          </div>
        </div>
      )}

      {/* 5. Ships Render */}
      {(() => {
        // 只显示正在处理中的waiting船只，或者已经进入流程的船只
        const visibleShips = ships.filter(s => 
          s.status !== 'waiting' || // 非waiting状态的都显示
          (s.status === 'waiting' && processingShipIds && processingShipIds.includes(s.id)) // waiting状态但正在处理中的才显示
        );
        const waitingShips = visibleShips.filter(s => s.status === 'waiting');
        
        return visibleShips.map((ship, idx) => {
          const pos = getShipPosition(ship, idx, waitingShips);
        
        // Anchored Ship Logic (船停在锚位)
        if (ship.status === 'anchored' && ship.assignedAnchorageId) {
            const anchoragePosition = BERTH_POSITIONS[ship.assignedAnchorageId];
            if (anchoragePosition) {
                // C 区（支线）锚位及M03/M04：船在绿色标记点上方；其他锚位：船在标记点下方
                const isCZone = ship.assignedAnchorageId.startsWith('C') || 
                               ship.assignedAnchorageId.startsWith('M05') || 
                               ship.assignedAnchorageId.startsWith('M06') || 
                               ship.assignedAnchorageId === 'M03' || 
                               ship.assignedAnchorageId === 'M04';
                const shipY = anchoragePosition.y + (isCZone ? -22 : 20);
                
                // 获取停靠角度（使用到达锚位时的角度）
                const rotation = ship.anchoredRotation ?? 0; // 使用保存的角度，如果没有则默认朝上
                
                return (
                    <div
                      key={ship.id}
                      className="absolute z-30 transition-all duration-[2000ms] ease-out ship-container"
                      style={{
                        left: `${anchoragePosition.x}px`,
                        top: `${shipY}px`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <div
                        className="relative cursor-pointer flex flex-col items-center p-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          onBerthClick && onBerthClick(ship.assignedAnchorageId!);
                        }}
                        onMouseEnter={() => setHoveredShipId(ship.id)}
                        onMouseLeave={() => setHoveredShipId(null)}
                      >
                        {/* 船只标签：只在当前悬停的船上显示 */}
                        {hoveredShipId === ship.id && (
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-bold px-2 py-1 rounded-sm border whitespace-nowrap z-40 shadow-lg bg-black/90 text-white border-slate-600 transition-opacity duration-200 pointer-events-none">
                            <div>{ship.id}</div>
                            <div className="text-[10px] font-normal mt-0.5">{ship.name}</div>
                          </div>
                        )}
                        {/* 锚位船显示 */}
                        {renderShipIcon(ship, rotation)}
                      </div>
                    </div>
                )
            }
        }
        
        // Docked Ship Logic (直接定位到地图背景上的泊位位置，根据泊位类型决定在标记点上方/下方)
        if (ship.status === 'docked' && ship.assignedBerthId) {
            const berthPosition = BERTH_POSITIONS[ship.assignedBerthId];
            if (berthPosition) {
                // C 区（支线）泊位及M03/M04：船在绿色标记点上方；其他泊位：船在标记点下方
                const isCZone = ship.assignedBerthId.startsWith('C') || ship.assignedBerthId.startsWith('M05') || ship.assignedBerthId.startsWith('M06') || ship.assignedBerthId === 'M03' || ship.assignedBerthId === 'M04';
                const shipY = berthPosition.y + (isCZone ? -22 : 20); // C01/C02/B01/B02再远2px
                
                // 获取停靠角度
                const rotation = getDockedRotation(ship.assignedBerthId);
                
                return (
                    <div
                      key={ship.id}
                      className="absolute z-30 transition-all duration-[2000ms] ease-out ship-container"
                      style={{
                        left: `${berthPosition.x}px`,
                        top: `${shipY}px`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <div
                        className="relative cursor-pointer flex flex-col items-center p-2"
                        onClick={(e) => {
                          e.stopPropagation(); // 阻止事件冒泡
                          onBerthClick && onBerthClick(ship.assignedBerthId!);
                        }}
                        onMouseEnter={() => setHoveredShipId(ship.id)}
                        onMouseLeave={() => setHoveredShipId(null)}
                      >
                        {/* 船只标签：只在当前悬停的船上显示 */}
                        {hoveredShipId === ship.id && (
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-bold px-2 py-1 rounded-sm border whitespace-nowrap z-40 shadow-lg bg-black/90 text-white border-slate-600 transition-opacity duration-200 pointer-events-none">
                            <div>{ship.id}</div>
                            <div className="text-[10px] font-normal mt-0.5">{ship.name}</div>
                        </div>
                        )}
                        {/* 到达泊位后根据泊位配置设置箭头朝向 */}
                        {renderShipIcon(ship, rotation)}
                      </div>
                    </div>
                )
            }
        }

        const isMoving = ship.status === 'navigating' || ship.status === 'docking';
        
        // 计算船只旋转角度（数值，单位：度）
        let rotationDeg = 0;
        if (ship.status === 'waiting') { 
           // 锚地时：默认角度为0，不旋转
           rotationDeg = 0;
        } else if (ship.status === 'anchored') {
          // 锚位停靠：使用到达锚位时的角度
          rotationDeg = ship.anchoredRotation ?? 0;
        } else if (ship.status === 'docked') {
          // 安全兜底：到泊位后根据泊位配置设置箭头朝向，不过 docked 情况上面已经单独处理
          rotationDeg = ship.assignedBerthId ? getDockedRotation(ship.assignedBerthId) : 90;
        } else if (ship.status === 'navigating' && ship.assignedBerthId && ship.progress !== undefined) {
          // 判断是第一阶段（从起步点到锚位）还是第二阶段（从锚位到泊位）
          const isFromAnchorage = ship.assignedAnchorageId && 
                                  ship.assignedBerthId !== ship.assignedAnchorageId;
          
          const berthPos = getBerthCenterPosition(ship.assignedBerthId);
          if (!berthPos) {
            rotationDeg = 180;
          } else {
            let pathPoints: { x: number; y: number }[] = [];
            
            if (isFromAnchorage) {
              // 第二阶段：从锚位到泊位
              const anchoragePos = getBerthCenterPosition(ship.assignedAnchorageId!);
              if (!anchoragePos) {
                rotationDeg = 180;
              } else {
                // 尝试从 localStorage 获取锚位到泊位的路径点（键名格式：M01->A01）
                let waypoints: Waypoint[] = [];
                try {
                  const stored = localStorage.getItem('berth-waypoints');
                  if (stored) {
                    const waypointsData = JSON.parse(stored);
                    const pathKey = `${ship.assignedAnchorageId}->${ship.assignedBerthId}`;
                    waypoints = waypointsData[pathKey] || [];
                  }
                } catch (e) {
                  console.error('Failed to load waypoints from localStorage:', e);
                }
                
                // 如果没有配置路径点，使用直线路径（从锚位直接到泊位）
                if (waypoints.length === 0) {
                  pathPoints = [anchoragePos, berthPos];
                } else {
                  // 使用配置的路径点：锚位 -> 路径点1 -> 路径点2 -> ... -> 泊位
                  pathPoints = [
                    anchoragePos,
                    ...waypoints.map(wp => ({ x: wp.x, y: wp.y })),
                    berthPos
                  ];
                }
              }
            } else {
              // 第一阶段：从起步点到锚位（使用锚位的路径点）
              const waypoints = getBerthWaypoints(ship.assignedBerthId);
              if (waypoints.length === 0) {
                rotationDeg = 0;
              } else {
                // 构建路径：点1 -> 点2 -> ... -> 点N -> 锚位
                pathPoints = [
                  ...waypoints.map(wp => ({ x: wp.x, y: wp.y })),
                  berthPos
                ];
              }
            }
            
            // 根据路径点计算旋转角度
            if (pathPoints.length > 1) {
                const clampedProgress = Math.max(0, Math.min(1, ship.progress));
                
                // 计算每段的实际距离（用于按距离分配 progress）
                const segmentDistances: number[] = [];
                let totalDistance = 0;
                for (let i = 0; i < pathPoints.length - 1; i++) {
                  const dx = pathPoints[i + 1].x - pathPoints[i].x;
                  const dy = pathPoints[i + 1].y - pathPoints[i].y;
                  const distance = Math.sqrt(dx * dx + dy * dy);
                  segmentDistances.push(distance);
                  totalDistance += distance;
                }
                
                // 根据progress计算目标距离
                const targetDistance = clampedProgress * totalDistance;
                
                // 找到当前所在的段
                let accumulatedDistance = 0;
                let currentSegmentIndex = 0;
                for (let i = 0; i < segmentDistances.length; i++) {
                  if (accumulatedDistance + segmentDistances[i] >= targetDistance) {
                    currentSegmentIndex = i;
                    break;
                  }
                  accumulatedDistance += segmentDistances[i];
                  if (i === segmentDistances.length - 1) {
                    currentSegmentIndex = i;
                  }
                }
                
              // 根据当前路径段的方向计算旋转角度
                const p0 = pathPoints[currentSegmentIndex];
                const p1 = pathPoints[Math.min(currentSegmentIndex + 1, pathPoints.length - 1)];
                const dx = p1.x - p0.x;
                const dy = p1.y - p0.y;
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                rotationDeg = angle + 90; // ship.svg 默认尖头朝上，需要+90度让船头朝向移动方向
            } else {
              rotationDeg = 0; // 默认朝上
            }
          }
        } else if (ship.status === 'docking') {
          // 从主航道转向泊位前：逆时针旋转到水平向右，再驶向泊位
          // 这里简化为整个 docking 阶段统一朝右（90 度）
          rotationDeg = 90;
        } else if (isMoving && ship.status === 'docking' && ship.assignedBerthId) {
          console.log('DOCKING分支被执行');
          // docking 状态：根据当前位置和泊位位置计算方向
          const berthPos = getBerthCenterPosition(ship.assignedBerthId);
          if (berthPos) {
            const currentPos = pos;
            const dx = berthPos.x - currentPos.x;
            const dy = berthPos.y - currentPos.y;
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            console.log(angle)
            rotationDeg = angle;
            console.log(rotationDeg)
            // if (rotationDeg < -135 || rotationDeg > 135) {
            //   rotationDeg = rotationDeg + 180;
            // }
          } else {
            rotationDeg = 90; // 默认朝右
          }
        }
        
        // 如果船刚开始导航（progress=0或undefined），不使用transition，立即出现在第一个路径点
        // 或者如果船从waiting变为navigating，也不使用transition
        const isStartingNavigation = ship.status === 'navigating' && (ship.progress === 0 || ship.progress === undefined || ship.progress < 0.01);
        
        return (
          <div
            key={ship.id}
            className={`absolute z-30 ${isStartingNavigation ? '' : 'transition-all duration-[50ms] ease-linear'}`}
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              transform: 'translate(-50%, -50%)',
            }}
          >
              <div 
                className="relative flex flex-col items-center p-2"
                onMouseEnter={() => setHoveredShipId(ship.id)}
                onMouseLeave={() => setHoveredShipId(null)}
              >
              {/* 船只标签：只在当前悬停的船上显示 */}
              {hoveredShipId === ship.id && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-bold px-2 py-1 rounded-sm border whitespace-nowrap z-40 shadow-lg bg-black/90 text-white border-slate-600 transition-opacity duration-200 pointer-events-none">
                  <div>{ship.id}</div>
                  <div className="text-[10px] font-normal mt-0.5">{ship.name}</div>
              </div>
              )}
              <div className="relative">
                {renderShipIcon(ship, rotationDeg, isMoving)}
              </div>
            </div>
          </div>
        );
        });
      })()}
      </div>
      {/* 缩放容器结束 */}
    </div>
  );
};

export default PortMap;