import { Ship, ShipType, Berth, TidePoint } from './types';

// Palette: Professional Maritime Tech
export const SHIP_COLORS = {
    [ShipType.CONTAINER]: '#3b82f6', // Blue 500
    [ShipType.BULK]: '#f59e0b',      // Amber 500
    [ShipType.TANKER]: '#ef4444',    // Red 500
};

export const INITIAL_SHIPS: Ship[] = [
  // 宁波镇海港区典型来船：20-100m，吃水 3.5-9m
  {
    id: 'S001',
    name: '浙甬集装 1',
    type: ShipType.CONTAINER,
    length: 95,     // m
    width: 16,      // m
    draft: 8.5,     // m
    etaOriginal: '10:00',
    priority: 10,
    status: 'waiting',
    color: SHIP_COLORS[ShipType.CONTAINER],
    candidateBerths: [],
  },
  {
    id: 'S002',
    name: '甬港集装 3',
    type: ShipType.CONTAINER,
    length: 72,
    width: 14,
    draft: 7.2,
    etaOriginal: '10:15',
    priority: 8,
    status: 'waiting',
    color: SHIP_COLORS[ShipType.CONTAINER],
    candidateBerths: [],
  },
  {
    id: 'S003',
    name: '镇海散货 5',
    type: ShipType.BULK,
    length: 88,
    width: 15,
    draft: 8.0,
    etaOriginal: '09:30',
    priority: 6,
    status: 'waiting',
    color: SHIP_COLORS[ShipType.BULK],
    candidateBerths: [],
  },
  {
    id: 'S004',
    name: '镇海化工 2',
    type: ShipType.TANKER,
    length: 100,
    width: 17,
    draft: 9.0,
    etaOriginal: '11:00',
    priority: 9,
    status: 'waiting',
    color: SHIP_COLORS[ShipType.TANKER],
    candidateBerths: [],
  },
  {
    id: 'S005',
    name: '浙甬拖轮 6',
    type: ShipType.BULK,
    length: 23,
    width: 9,
    draft: 3.8,
    etaOriginal: '10:45',
    priority: 4,
    status: 'waiting',
    color: '#6366f1', // 小船用单独颜色
    candidateBerths: [],
  },
  {
    id: 'S006',
    name: '宁波杂货 8',
    type: ShipType.CONTAINER,
    length: 54,
    width: 11,
    draft: 5.5,
    etaOriginal: '11:15',
    priority: 5,
    status: 'waiting',
    color: '#06b6d4', // Cyan
    candidateBerths: [],
  },
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
// 每次只生成1艘新船
export const generateNewShips = (startIndex: number): Ship[] => {
  const types = [ShipType.CONTAINER, ShipType.BULK, ShipType.TANKER];
  const names = ['浙甬集装', '镇海散货', '镇海化工', '宁波杂货', '浙甬拖轮'];
    const newShips: Ship[] = [];
    
    // 只生成1艘船
    const type = types[Math.floor(Math.random() * types.length)];
    const idNum = startIndex + 1;
    const id = `S00${idNum}`;
    const name = `${names[Math.floor(Math.random() * names.length)]} ${idNum}`;
    
  let length = 60;
  let width = 12;
  let draft = 5.5;
  
  // 根据类型设置更合理的尺度（20-100m，吃水 3.5-9m）
  if (type === ShipType.TANKER) {
    length = 80 + Math.random() * 20;          // 80-100m 小型化工/成品油船
    width = 14 + Math.random() * 3;            // 14-17m
    draft = 7.5 + Math.random() * 1.5;         // 7.5-9.0m
  } else if (type === ShipType.BULK) {
    length = 60 + Math.random() * 25;          // 60-85m 散货/多用途
    width = 10 + Math.random() * 3;            // 10-13m
    draft = 5.0 + Math.random() * 3.0;         // 5.0-8.0m
  } else if (type === ShipType.CONTAINER) {
    length = 40 + Math.random() * 40;          // 40-80m 支线集装箱
    width = 9 + Math.random() * 3;             // 9-12m
    draft = 3.5 + Math.random() * 3.5;         // 3.5-7.0m
  }
    
    // 计算ETA时间（基于当前时间，避免重复）
    const currentHour = new Date().getHours();
    const etaHour = (currentHour + 1) % 24; // 1小时后到达
    
    newShips.push({
        id,
        name,
        type,
        length: Math.floor(length),
      width: parseFloat(width.toFixed(1)),
        draft: parseFloat(draft.toFixed(1)),
        etaOriginal: `${String(etaHour).padStart(2, '0')}:00`,
        priority: Math.floor(Math.random() * 5) + 5,
        status: 'waiting',
        color: SHIP_COLORS[type],
        candidateBerths: []
    });
    
    return newShips;
};