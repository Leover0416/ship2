export enum ShipType {
  CONTAINER = '集装箱船',
  BULK = '散货船',
  TANKER = '油轮',
}

export enum AgentType {
  SHIP = 'SHIP_AGENT',
  RESOURCE = 'RESOURCE_AGENT',
  SCHEDULER = 'SCHEDULER_AGENT',
  OPTIMIZER = 'OPTIMIZER_AGENT',
  COORDINATOR = 'COORDINATOR_AGENT',
}

export enum SimulationPhase {
  IDLE = '待机',
  PERCEPTION = '智能感知 & ETA修正',
  MATCHING = '物理约束匹配',
  OPTIMIZATION = '协同优化 & 博弈',
  EXECUTION = '执行 & 动态监控',
}

export interface ConstraintCheck {
  length: boolean;
  draftTide: boolean;
  channel: boolean;
  special: boolean;
}

export interface Ship {
  id: string;
  name: string;
  type: ShipType;
  length: number; // meters
  width: number;  // meters
  draft: number; // meters
  priority: number; // 1-10
  status: 'waiting' | 'anchored' | 'navigating' | 'docking' | 'docked' | 'departing';
  color: string;
  progress?: number; // 0-1, for animation along a path
  anchoredRotation?: number; // 到达锚位时的角度（度）
  
  // Phase 1: Perception Data
  etaOriginal: string;
  etaCorrected?: string;
  earliestOperationTime?: string; // EOT
  isDelayed?: boolean;

  // AIS / 航行信息（可选）
  headingDeg?: number;           // 船首向（度）
  courseOverGroundDeg?: number;  // 航向 COG（度）
  callSign?: string;             // 呼号
  imo?: string;                  // IMO 编号
  speedKnots?: number;           // 航速（节）
  navStatusText?: string;        // 航行状态文本（如：靠泊、在航）
  latitudeText?: string;         // 纬度文本，如 29-56.795N
  longitudeText?: string;        // 经度文本，如 121-42.778E
  destination?: string;          // 目的地
  etaFullText?: string;          // 完整 ETA 文本
  lastUpdateTime?: string;       // 数据更新时间

  // Phase 1b: 船舶能耗 - 航速关联属性数据
  vspSavings?: number; // 按船舶能耗 - 航速关联属性计算的节油量（吨）
  recommendedSpeed?: number; // knots
  virtualArrivalMode?: boolean;

  // Phase 2: Matching Data
  constraints?: ConstraintCheck;
  candidateBerths?: string[];
  candidateAnchorages?: string[]; // 候选锚位列表

  // Phase 3 & 4: Execution Data
  assignedBerthId?: string;
  assignedAnchorageId?: string; // 第一阶段分配的锚位ID
  optimizationLog?: string[];
  
  // Bottom Viz
  gantt?: {
    startTime: number; // 0-24 scale
    duration: number;
    channelSlot: 'Deep' | 'Feeder';
  }
}

export interface Berth {
  id: string;
  name: string;
  type?: 'berth' | 'anchorage'; // 区分泊位和锚位
  zone: 'A' | 'B' | 'C'; // A: Deep, B: General, C: Feeder
  length: number;
  depth: number;
  isOccupied: boolean;
  currentShipId?: string;
}

export interface AgentMessage {
  id: string;
  from: AgentType;
  to: AgentType | 'ALL';
  content: string;
  timestamp: string;
  type: 'info' | 'warning' | 'success' | 'negotiation';
}

export interface TidePoint {
  time: string;
  height: number;
}
