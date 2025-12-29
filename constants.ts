import { Ship, ShipType, Berth, TidePoint } from './types';

// Palette: Professional Maritime Tech
export const SHIP_COLORS = {
    [ShipType.CONTAINER]: '#3b82f6', // Blue 500
    [ShipType.BULK]: '#f59e0b',      // Amber 500
    [ShipType.TANKER]: '#ef4444',    // Red 500
};

// 油品码头船舶数据池（13艘船）
const TANKER_SHIP_POOL: Ship[] = [
  {
    id: '412752880',
    name: '浙甬油11',
    type: ShipType.TANKER,
    length: 118,
    width: 17,
    draft: 4.5,
    etaOriginal: '10:00',
    priority: 10,
    status: 'waiting',
    color: SHIP_COLORS[ShipType.TANKER],
    candidateBerths: [],
    callSign: 'H',
    mmsi: '412752880',
    navStatusText: '靠泊',
  },
  {
    id: '413446010',
    name: '舟供油68',
    type: ShipType.TANKER,
    length: 53,
    width: 9,
    draft: 3.4,
    etaOriginal: '10:15',
    priority: 8,
    status: 'waiting',
    color: SHIP_COLORS[ShipType.TANKER],
    candidateBerths: [],
    callSign: 'L',
    mmsi: '413446010',
    navStatusText: '锚泊',
  },
  {
    id: '413437350',
    name: '祥鸿17',
    type: ShipType.TANKER,
    length: 55,
    width: 9,
    draft: 3.5,
    etaOriginal: '09:30',
    priority: 6,
    status: 'waiting',
    color: SHIP_COLORS[ShipType.TANKER],
    candidateBerths: [],
    callSign: '8',
    mmsi: '413437350',
    navStatusText: '在航(主机推动)',
  },
  {
    id: '413615420',
    name: 'HAI ZHI XIN',
    type: ShipType.TANKER,
    length: 93,
    width: 16,
    draft: 4.6,
    etaOriginal: '11:00',
    priority: 9,
    status: 'waiting',
    color: SHIP_COLORS[ShipType.TANKER],
    candidateBerths: [],
    callSign: 'BPZA9',
    mmsi: '413615420',
    navStatusText: '在航(主机推动)',
  },
  {
    id: '414403030',
    name: '宏达海88',
    type: ShipType.TANKER,
    length: 78,
    width: 15,
    draft: 3.8,
    etaOriginal: '10:45',
    priority: 7,
    status: 'waiting',
    color: SHIP_COLORS[ShipType.TANKER],
    candidateBerths: [],
    callSign: 'BRXL',
    mmsi: '414403030',
    navStatusText: '靠泊',
  },
  {
    id: '412402620',
    name: '龙宇3',
    type: ShipType.TANKER,
    length: 49,
    width: 10,
    draft: 0.3,
    etaOriginal: '11:15',
    priority: 5,
    status: 'waiting',
    color: SHIP_COLORS[ShipType.TANKER],
    candidateBerths: [],
    mmsi: '412402620',
    navStatusText: '在航(主机推动)',
  },
  {
    id: '413548350',
    name: '东方朝阳',
    type: ShipType.TANKER,
    length: 88,
    width: 16,
    draft: 5.3,
    etaOriginal: '09:00',
    priority: 8,
    status: 'waiting',
    color: SHIP_COLORS[ShipType.TANKER],
    candidateBerths: [],
    callSign: 'C',
    mmsi: '413548350',
    navStatusText: '锚泊',
  },
  {
    id: '413450860',
    name: '嘉信2号',
    type: ShipType.TANKER,
    length: 92,
    width: 15,
    draft: 4.5,
    etaOriginal: '10:30',
    priority: 7,
    status: 'waiting',
    color: SHIP_COLORS[ShipType.TANKER],
    candidateBerths: [],
    callSign: 'BPBW2',
    mmsi: '413450860',
    navStatusText: '锚泊',
  },
  {
    id: '412764580',
    name: '润宇66',
    type: ShipType.TANKER,
    length: 48,
    width: 8,
    draft: 6.8,
    etaOriginal: '11:30',
    priority: 6,
    status: 'waiting',
    color: SHIP_COLORS[ShipType.TANKER],
    candidateBerths: [],
    callSign: 'H0R 0',
    mmsi: '412764580',
    navStatusText: '靠船帆提供动力',
  },
  {
    id: '413528940',
    name: '永旺达6',
    type: ShipType.TANKER,
    length: 94,
    width: 15,
    draft: 5.0,
    etaOriginal: '09:15',
    priority: 9,
    status: 'waiting',
    color: SHIP_COLORS[ShipType.TANKER],
    candidateBerths: [],
    callSign: 'SSD',
    mmsi: '413528940',
    navStatusText: '锚泊',
  },
  {
    id: '413540630',
    name: '瑞丰7',
    type: ShipType.TANKER,
    length: 93,
    width: 15,
    draft: 4.8,
    etaOriginal: '10:20',
    priority: 8,
    status: 'waiting',
    color: SHIP_COLORS[ShipType.TANKER],
    candidateBerths: [],
    callSign: 'BPHU9',
    mmsi: '413540630',
    navStatusText: '锚泊',
  },
  {
    id: '414402420',
    name: '祥鸿59',
    type: ShipType.TANKER,
    length: 119,
    width: 17,
    draft: 6.5,
    etaOriginal: '08:45',
    priority: 10,
    status: 'waiting',
    color: SHIP_COLORS[ShipType.TANKER],
    candidateBerths: [],
    mmsi: '414402420',
    navStatusText: '锚泊',
  },
  {
    id: '413450140',
    name: '傍海16',
    type: ShipType.TANKER,
    length: 97,
    width: 14,
    draft: 3.6,
    etaOriginal: '11:45',
    priority: 7,
    status: 'waiting',
    color: SHIP_COLORS[ShipType.TANKER],
    candidateBerths: [],
    callSign: 'BPMN3',
    mmsi: '413450140',
    navStatusText: '锚泊',
  },
];

// 初始6艘船（从船舶池中选择）
export const INITIAL_SHIPS: Ship[] = [
  TANKER_SHIP_POOL[0],  // 浙甬油11
  TANKER_SHIP_POOL[1],  // 舟供油68
  TANKER_SHIP_POOL[2],  // 祥鸿17
  TANKER_SHIP_POOL[3],  // HAI ZHI XIN
  TANKER_SHIP_POOL[4],  // 宏达海88
  TANKER_SHIP_POOL[5],  // 龙宇3
];

// 静态地图上的实际锚位和泊位（使用经纬度坐标）
export const PORT_BERTHS: Berth[] = [
  // 马峙1号锚地锚位（深水区A区）- 吃水深度较大
  { id: 'Y6', name: 'Y6 锚位', type: 'anchorage', zone: 'A', length: 200, depth: 12.5, isOccupied: false },
  { id: 'Y9', name: 'Y9 锚位', type: 'anchorage', zone: 'A', length: 200, depth: 12.5, isOccupied: false },
  { id: '13', name: '13 锚位', type: 'anchorage', zone: 'A', length: 200, depth: 8.5, isOccupied: false },
  
  // 通用区B区锚位
  { id: 'Y7', name: 'Y7 锚位', type: 'anchorage', zone: 'B', length: 200, depth: 9.5, isOccupied: false },
  { id: 'Y10', name: 'Y10 锚位', type: 'anchorage', zone: 'B', length: 200, depth: 8.5, isOccupied: false },
  { id: '12', name: '12 锚位', type: 'anchorage', zone: 'B', length: 200, depth: 8.5, isOccupied: false },
  
  // 支线区C区锚位（吃水深度较小）
  { id: 'Y8', name: 'Y8 锚位', type: 'anchorage', zone: 'C', length: 200, depth: 8.0, isOccupied: false },
  { id: 'M7', name: 'M7 锚位', type: 'anchorage', zone: 'C', length: 150, depth: 9.0, isOccupied: false },
  { id: '14', name: '14 锚位', type: 'anchorage', zone: 'C', length: 200, depth: 7.0, isOccupied: false },
  { id: '15', name: '15 锚位', type: 'anchorage', zone: 'C', length: 200, depth: 8.0, isOccupied: false },
  
  // 泊位（需要在静态地图上动态添加，这里先保留占位符，实际使用时会在StaticMap中动态创建）
  // 注意：这些泊位需要在StaticMap中通过"泊位添加"功能手动添加，或通过代码动态创建
  // 暂时保留旧的ID作为占位符，实际调度时会使用StaticMap中的实际泊位
];

export const TIDE_DATA: TidePoint[] = [
  { time: '06:00', height: 2.1 },
  { time: '08:00', height: 3.5 },
  { time: '10:00', height: 4.8 }, // High tide
  { time: '12:00', height: 4.2 },
  { time: '14:00', height: 2.5 },
  { time: '16:00', height: 1.2 },
  { time: '18:00', height: 0.8 },
  { time: '20:00', height: 2.0 },
];

// Helper to generate random ships for "Continue Scheduling"
// 每次只生成1艘新船，从油品码头船舶池中随机选择
export const generateNewShips = (startIndex: number, existingShipIds: string[] = []): Ship[] => {
  const newShips: Ship[] = [];
  
  // 从船舶池中随机选择一艘未使用的船
  const availableShips = TANKER_SHIP_POOL.filter(ship => !existingShipIds.includes(ship.id));
  
  if (availableShips.length === 0) {
    // 如果所有船都已使用，随机选择一艘（保持原有MMSI作为ID）
    const randomShip = TANKER_SHIP_POOL[Math.floor(Math.random() * TANKER_SHIP_POOL.length)];
    
    // 计算ETA时间（基于当前时间，避免重复）
    const currentHour = new Date().getHours();
    const etaHour = (currentHour + 1) % 24; // 1小时后到达
    
    newShips.push({
      ...randomShip,
      etaOriginal: `${String(etaHour).padStart(2, '0')}:00`,
      status: 'waiting',
    });
  } else {
    // 从可用船舶中随机选择（保持原有MMSI作为ID）
    const selectedShip = availableShips[Math.floor(Math.random() * availableShips.length)];
    
    // 计算ETA时间（基于当前时间，避免重复）
    const currentHour = new Date().getHours();
    const etaHour = (currentHour + 1) % 24; // 1小时后到达
    
    newShips.push({
      ...selectedShip,
      etaOriginal: `${String(etaHour).padStart(2, '0')}:00`,
      status: 'waiting',
    });
  }
  
  return newShips;
};