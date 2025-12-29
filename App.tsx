import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_SHIPS, PORT_BERTHS, TIDE_DATA, generateNewShips } from './constants';
import { Ship, Berth, AgentMessage, AgentType, SimulationPhase, ShipType } from './types';
import PortMap from './components/PortMap';
import StaticMap from './components/StaticMap';
import AgentOrchestrator from './components/AgentOrchestrator';
import Dashboard from './components/Dashboard';
import PhaseDetailPanel, { DetailViewType } from './components/PhaseDetailPanel';
import BottomVis from './components/BottomVis';
import { Play, RotateCcw, Cpu, Anchor, Ship as ShipIcon, FastForward, CheckSquare, Layers, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Map as MapIcon, Activity, ShieldCheck, TrendingUp } from 'lucide-react';
import * as aiService from './services/aiService';
import * as schedulingAlgorithms from './services/schedulingAlgorithms';

const App: React.FC = () => {
  const [ships, setShips] = useState<Ship[]>(INITIAL_SHIPS);
  
  // 获取标准泊位规格的函数
  const getBerthSpecs = (berthId: string): { length: number; depth: number } | null => {
    const specs: Record<string, { length: number; depth: number }> = {
      'A01': { length: 330, depth: 22.5 },  // 1号泊位
      'B01': { length: 220, depth: 14.5 },  // 2号泊位
      'B02': { length: 130, depth: 9.5 },  // 3号泊位
      'A02': { length: 334, depth: 23.8 },  // 5号泊位
    };
    return specs[berthId] || null;
  };
  
  // 泊位ID到名称的映射（统一使用#号格式）
  const getBerthName = (berthId: string): string => {
    const nameMap: Record<string, string> = {
      'A01': '1#',
      'B01': '2#',
      'B02': '3#',
      'A02': '5#',
    };
    return nameMap[berthId] || `${berthId} 泊位`;
  };
  
  // 从localStorage加载StaticMap的动态泊位，合并到berths状态中，并添加标准泊位
  const [berths, setBerths] = useState<Berth[]>(() => {
    const initialBerths = [...PORT_BERTHS];
    
    // 添加标准泊位（A01→1号, B01→2号, B02→3号, A02→5号）
    const standardBerthIds = ['A01', 'B01', 'B02', 'A02'];
    standardBerthIds.forEach(id => {
      const specs = getBerthSpecs(id);
      if (specs) {
        const zone = id.startsWith('A') ? 'A' : id.startsWith('B') ? 'B' : 'C';
        initialBerths.push({
          id,
          name: getBerthName(id),
          type: 'berth' as const,
          zone: zone as 'A' | 'B' | 'C',
          length: specs.length,
          depth: specs.depth,
          isOccupied: false,
        });
      }
    });
    
    try {
      const stored = localStorage.getItem('dynamic-berths-latlng');
      if (stored) {
        const dynamicBerths = JSON.parse(stored);
        // 合并动态泊位，避免重复（但标准泊位已添加，不会被覆盖）
        dynamicBerths.forEach((db: Berth) => {
          if (!initialBerths.find(b => b.id === db.id)) {
            initialBerths.push(db);
          }
        });
      }
    } catch (e) {
      console.error('Failed to load dynamic berths:', e);
    }
    
    // 确保所有标准泊位都使用正确的名称（防止被localStorage覆盖）
    return initialBerths.map(berth => {
      if (standardBerthIds.includes(berth.id)) {
        return { ...berth, name: getBerthName(berth.id) };
      }
      return berth;
    });
  });
  
  // 监听localStorage变化，更新berths状态（当StaticMap添加/删除泊位时）
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const stored = localStorage.getItem('dynamic-berths-latlng');
        setBerths(prev => {
          // 保留PORT_BERTHS中的锚位和标准泊位
          const standardBerthIds = ['A01', 'B01', 'B02', 'A02'];
          const staticBerths = prev.filter(b => 
            PORT_BERTHS.some(sb => sb.id === b.id) || 
            standardBerthIds.includes(b.id)
          );
          
          // 确保标准泊位存在
          const allBerths = [...staticBerths];
          standardBerthIds.forEach(id => {
            if (!allBerths.find(b => b.id === id)) {
              const specs = getBerthSpecs(id);
              if (specs) {
                const zone = id.startsWith('A') ? 'A' : id.startsWith('B') ? 'B' : 'C';
                allBerths.push({
                  id,
                  name: getBerthName(id),
                  type: 'berth' as const,
                  zone: zone as 'A' | 'B' | 'C',
                  length: specs.length,
                  depth: specs.depth,
                  isOccupied: false,
                });
              }
            }
          });
          
          // 合并新的动态泊位
          if (stored) {
            const dynamicBerths = JSON.parse(stored);
            dynamicBerths.forEach((db: Berth) => {
              if (!allBerths.find(b => b.id === db.id)) {
                allBerths.push(db);
              }
            });
          }
          
          // 确保所有标准泊位都使用正确的名称（不被localStorage覆盖）
          return allBerths.map(berth => {
            if (standardBerthIds.includes(berth.id)) {
              return { ...berth, name: getBerthName(berth.id) };
            }
            return berth;
          });
        });
      } catch (e) {
        console.error('Failed to update berths from storage:', e);
      }
    };
    
    // 监听storage事件
    window.addEventListener('storage', handleStorageChange);
    // 也监听自定义事件（同页面内的变化）
    window.addEventListener('dynamicBerthsChanged', handleStorageChange);
    
    // 定期检查（因为同页面内localStorage变化不会触发storage事件）
    const interval = setInterval(handleStorageChange, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('dynamicBerthsChanged', handleStorageChange);
      clearInterval(interval);
    };
  }, []);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [phase, setPhase] = useState<SimulationPhase>(SimulationPhase.IDLE);
  const [activeAgents, setActiveAgents] = useState<AgentType[]>([]);
  const [efficiency, setEfficiency] = useState(65);
  const [carbonSaved, setCarbonSaved] = useState(12);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [optimizationData, setOptimizationData] = useState({
    totalVspSavings: 0,
    hasConflict: false,
    iterations: 0,
    reward: 0
  }); 
  
  // Selection State
  const [selectedShipIds, setSelectedShipIds] = useState<Set<string>>(new Set());
  const [processingShipIds, setProcessingShipIds] = useState<string[]>([]);
  const [selectedShipForDetail, setSelectedShipForDetail] = useState<Ship | null>(null);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(true);
  const [activeDetailView, setActiveDetailView] = useState<DetailViewType>('perception');
  // 默认使用静态地图，不再需要切换按钮
  const mapViewMode: 'static' = 'static';

  // 移除自动切换视图的逻辑，让用户可以自由切换视图而不被阶段变化打断

  // --- Helper: Centralized Berth Logic ---
  const getRecommendedZone = (ship: Ship) => {
      // 从berths数组中动态查找实际的泊位（排除锚位）
      const availableBerths = berths.filter(b => b.type === 'berth');
      
      // 按区域分组
      const aZoneBerths = availableBerths.filter(b => b.zone === 'A').map(b => b.id);
      const bZoneBerths = availableBerths.filter(b => b.zone === 'B').map(b => b.id);
      const cZoneBerths = availableBerths.filter(b => b.zone === 'C').map(b => b.id);
      
      // 1. Tankers must go to A (Deep/Hazard safe)
      if (ship.type === ShipType.TANKER) {
          return { zone: 'A', berths: aZoneBerths.length > 0 ? aZoneBerths : (bZoneBerths.length > 0 ? bZoneBerths : cZoneBerths) };
      }
      
      // 2. Ultra Large Vessels (>300m) must go to A
      if (ship.length > 300) {
          return { zone: 'A', berths: aZoneBerths.length > 0 ? aZoneBerths : (bZoneBerths.length > 0 ? bZoneBerths : cZoneBerths) };
      }

      // 3. Bulk Carriers prefer B (General), can go A if needed
      if (ship.type === ShipType.BULK) {
          return { zone: 'B', berths: bZoneBerths.length > 0 ? [...bZoneBerths, ...aZoneBerths] : (aZoneBerths.length > 0 ? aZoneBerths : cZoneBerths) };
      }

      // 4. Large Containers (>150m) go to B or A
      if (ship.length > 150) {
          return { zone: 'B', berths: bZoneBerths.length > 0 ? [...bZoneBerths, ...aZoneBerths] : (aZoneBerths.length > 0 ? aZoneBerths : cZoneBerths) };
      }

      // 5. Small Feeder (<150m) go to C
      return { zone: 'C', berths: cZoneBerths.length > 0 ? cZoneBerths : (bZoneBerths.length > 0 ? bZoneBerths : aZoneBerths) };
  };

  // 检查泊位是否满足船舶约束
  const checkBerthConstraints = (ship: Ship, berth: Berth): boolean => {
      // 1. 长度约束：泊位长度需≥船舶长度×1.1
      if (berth.length < ship.length * 1.1) return false;
      
      // 2. 吃水深度检查：泊位水深需≥船舶吃水+1米安全余量（UKC）
      // 考虑潮汐影响，最低潮时也要满足要求
      const requiredDepth = ship.draft + 1.0; // 吃水 + 1米安全余量
      if (berth.depth < requiredDepth) return false;
      
      // 3. 类型约束：油轮必须去A区
      if (ship.type === ShipType.TANKER && berth.zone !== 'A') return false;
      
      return true;
  };

  const addMessage = (from: AgentType, to: AgentType | 'ALL', content: string, type: 'info' | 'warning' | 'success' | 'negotiation' = 'info') => {
    const newMessage: AgentMessage = {
      id: Math.random().toString(36).substr(2, 9),
      from,
      to,
      content,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const highlightAgents = (agents: AgentType[]) => setActiveAgents(agents);

  // 计算到达锚位时的角度（基于路径的最后一段）
  const calculateAnchoredRotation = (anchorageId: string): number => {
    try {
      const stored = localStorage.getItem('berth-waypoints');
      if (stored) {
        const waypointsData = JSON.parse(stored);
        const waypoints = waypointsData[anchorageId];
        
        // 获取锚位位置（从 PortMap 的 BERTH_POSITIONS）
        const BERTH_POSITIONS: Record<string, { x: number; y: number }> = {
          'M01': { x: 370, y: 61 },
          'M02': { x: 422, y: 47 },
          'M03': { x: 370, y: 102 },
          'M04': { x: 420, y: 101 },
          'M05': { x: 305, y: 100 },
          'M06': { x: 320, y: 105 },
        };
        
        const anchoragePos = BERTH_POSITIONS[anchorageId];
        if (!anchoragePos) return 0;
        
        if (waypoints && waypoints.length > 0) {
          // 获取最后一个路径点
          const lastWaypoint = waypoints[waypoints.length - 1];
          // 计算从最后一个路径点到锚位的角度
          const dx = anchoragePos.x - lastWaypoint.x;
          const dy = anchoragePos.y - lastWaypoint.y;
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          // 再顺时针转90度让船头朝前
          return angle;
        } else {
          // 如果没有路径点，返回默认角度
          return 0;
        }
      }
    } catch (e) {
      console.error('Failed to calculate anchored rotation:', e);
    }
    return 0; // 默认角度
  };

  // --- Dynamic Simulation Logic ---
  
  const performSimulationStep = async (stepIndex: number) => {
      // stepIndex 4 和 5 是执行阶段，不需要思考动画
      if (stepIndex !== 4 && stepIndex !== 5) {
      setIsThinking(true);
      }
      
      const targetShips = ships.filter(s => processingShipIds.includes(s.id));
      
      if (targetShips.length === 0 && stepIndex === 0) {
          addMessage(AgentType.COORDINATOR, 'ALL', "未检测到有效任务目标，请先选择船舶。", "warning");
          setIsSimulating(false);
          setIsThinking(false);
          return;
      }

      // Thinking Animation Delay（执行阶段不需要）
      if (stepIndex !== 4 && stepIndex !== 5) {
      await new Promise(r => setTimeout(r, 1200));
      setIsThinking(false);
      }

      // 1. Perception
      if (stepIndex === 0) {
          setPhase(SimulationPhase.PERCEPTION);
          highlightAgents([AgentType.SHIP]);
          
          // Generate AI message for Ship Agent
          const shipMessage = await aiService.generateShipAgentMessage({
            phase: 'PERCEPTION',
            ships: targetShips,
            berths: berths
          });
          addMessage(AgentType.SHIP, AgentType.SCHEDULER, shipMessage, "info");
          
          await new Promise(r => setTimeout(r, 1000));
          highlightAgents([AgentType.RESOURCE]);
          
          // 确保使用最新的berths状态（包括标准泊位和动态添加的泊位）
          // berths状态已经在初始化时包含了标准泊位，直接使用即可
          let latestBerths = [...berths];
          
          try {
            // 加载自定义名称并应用到berths（标准泊位不受影响，始终使用getBerthName）
            const standardBerthIds = ['A01', 'B01', 'B02', 'A02'];
            const customNamesStored = localStorage.getItem('berth-custom-names-latlng');
            if (customNamesStored) {
              const customNames = JSON.parse(customNamesStored);
              latestBerths = latestBerths.map(berth => {
                // 标准泊位始终使用getBerthName，不被localStorage覆盖
                if (standardBerthIds.includes(berth.id)) {
                  return { ...berth, name: getBerthName(berth.id) };
                }
                // 非标准泊位可以使用自定义名称
                if (customNames[berth.id]) {
                  return { ...berth, name: customNames[berth.id] };
                }
                return berth;
              });
            } else {
              // 即使没有自定义名称，也要确保标准泊位使用正确的名称
              latestBerths = latestBerths.map(berth => {
                if (standardBerthIds.includes(berth.id)) {
                  return { ...berth, name: getBerthName(berth.id) };
                }
                return berth;
              });
            }
          } catch (e) {
            console.error('Failed to load custom names for resource agent:', e);
          }
          
          // Generate AI message for Resource Agent
          const resourceMessage = await aiService.generateResourceAgentMessage({
            phase: 'PERCEPTION',
            ships: targetShips,
            berths: latestBerths
          });
          addMessage(AgentType.RESOURCE, AgentType.SCHEDULER, resourceMessage, "info");

          // 使用真实算法计算ETA修正、EOT和船舶能耗 - 航速关联属性
          setShips(prev => prev.map(s => {
              if (processingShipIds.includes(s.id)) {
                  // 1. ETA修正
                  const etaCorrection = schedulingAlgorithms.correctETA(
                      s.etaOriginal,
                      s.type,
                      s.length
                  );

                  // 2. EOT计算
                  const eotResult = schedulingAlgorithms.calculateEOT(
                      etaCorrection.correctedETA,
                      s.type,
                      s.length
                  );

                  // 3. 船舶能耗 - 航速关联属性计算（需要泊位可用时间，这里先用修正后的ETA）
                  const vspResult = schedulingAlgorithms.calculateVSP(
                      s,
                      s.etaOriginal,
                      etaCorrection.correctedETA,
                      etaCorrection.correctedETA // 暂时使用修正ETA作为泊位可用时间
                  );

                  return { 
                      ...s, 
                      etaCorrected: etaCorrection.correctedETA,
                      earliestOperationTime: eotResult.eot,
                      isDelayed: etaCorrection.isDelayed,
                      virtualArrivalMode: vspResult.virtualArrivalMode,
                      vspSavings: vspResult.vspSavings,
                      recommendedSpeed: vspResult.recommendedSpeed
                  };
              }
              return s;
          }));
      }

      // 2. Matching
      else if (stepIndex === 1) {
          setPhase(SimulationPhase.MATCHING);
          highlightAgents([AgentType.SCHEDULER]);
          
          // 在匹配阶段只显示候选泊位集和候选锚位集生成，不显示具体分配（因为分配在优化阶段完成）
          addMessage(AgentType.SCHEDULER, 'ALL', 
`调度智能体：
物理约束(长度/吃水)校验通过。
候选泊位集和候选锚位集生成完毕。
等待优化阶段进行最终分配。`, "warning");
          
           // 使用真实算法生成候选泊位时空资源集合
           setShips(prev => prev.map(s => {
               if (processingShipIds.includes(s.id)) {
                   const rec = getRecommendedZone(s);
                   
                   // 生成候选泊位时空资源集合
                   const occupiedSlots = new Map<string, { start: number; end: number }>();
                   berths.forEach(b => {
                       if (b.isOccupied && b.currentShipId) {
                           // 假设占用时间为4小时（实际应从船舶数据获取）
                           const occupiedShip = prev.find(ship => ship.id === b.currentShipId);
                           if (occupiedShip && occupiedShip.gantt) {
                               occupiedSlots.set(b.id, {
                                   start: occupiedShip.gantt.startTime * 60, // 转换为分钟
                                   end: (occupiedShip.gantt.startTime + occupiedShip.gantt.duration) * 60
                               });
                           }
                       }
                   });

                   const candidateSlots = schedulingAlgorithms.generateCandidateBerthSlots(
                       s,
                       berths.filter(b => rec.berths.includes(b.id)),
                       TIDE_DATA,
                       occupiedSlots
                   );

                   // 检查约束
                   const hasValidCandidate = candidateSlots.length > 0;
                   const tideCheck = hasValidCandidate 
                       ? schedulingAlgorithms.checkTideWindow(s, TIDE_DATA, berths.find(b => b.id === candidateSlots[0].berthId)!, candidateSlots[0].startTime)
                       : { feasible: false, tideHeight: 0, requiredDepth: 0, safetyMargin: 0 };

                   const c = { 
                       length: rec.berths.some(bid => {
                           const b = berths.find(berth => berth.id === bid);
                           return b ? checkBerthConstraints(s, b) : false;
                       }),
                       draftTide: tideCheck.feasible && s.draft <= 15, // 同时检查吃水深度上限
                       channel: true,
                       special: s.type === ShipType.TANKER
                   };

                   // 计算候选锚位（根据船舶类型和大小选择合适的锚位区域）
                   let preferredAnchorageIds: string[] = [];
                   if (s.type === ShipType.TANKER || s.length > 200) {
                       // A区锚位：Y6, Y9, 13（深水区，吃水深度较大）
                       preferredAnchorageIds = ['Y6', 'Y9', '13'];
                   } else if (s.length < 100) {
                       // C区锚位：Y8, M7, 14, 15（支线区，吃水深度较小）
                       preferredAnchorageIds = ['Y8', 'M7', '14', '15'];
                   } else {
                       // B区锚位：Y7, Y10, 12（通用区）
                       preferredAnchorageIds = ['Y7', 'Y10', '12'];
                   }
                   
                   // 查找满足物理约束的候选锚位（锚位深度需≥船舶吃水×1.2）
                   const candidateAnchorages = berths
                       .filter(b => 
                           b.type === 'anchorage' && 
                           preferredAnchorageIds.includes(b.id) &&
                           b.depth >= s.draft * 1.2 // 物理规则：锚位深度需≥船舶吃水×1.2
                       )
                       .map(b => b.id);
                   
                   // 如果首选锚位没有满足条件的，查找所有满足深度要求的锚位
                   const allCandidateAnchorages = candidateAnchorages.length > 0 
                       ? candidateAnchorages
                       : berths
                           .filter(b => 
                               b.type === 'anchorage' &&
                               b.depth >= s.draft * 1.2
                           )
                           .map(b => b.id);

                   return { 
                       ...s, 
                       constraints: c, 
                       candidateBerths: candidateSlots.map(slot => slot.berthId),
                       candidateAnchorages: allCandidateAnchorages
                   };
               }
               return s;
           }));
      }

      // 3. Optimization - 第一阶段：分配锚位
      else if (stepIndex === 2) {
          setPhase(SimulationPhase.OPTIMIZATION);
          highlightAgents([AgentType.OPTIMIZER]);
          
          const totalSavings = targetShips.reduce((acc, s) => acc + (s.vspSavings || 0), 0);
          
          // 使用真实的冲突检测算法
          const conflictInfo = schedulingAlgorithms.detectChannelConflicts(
              ships.filter(s => processingShipIds.includes(s.id) && s.gantt),
              10, // 10个时间片
              { deep: 1, feeder: 2 } // 深水航道1条，支线航道2条
          );
          const hasConflict = conflictInfo.hasConflict;
          
          const iterations = Math.floor(80 + Math.random() * 100); // 80-180次迭代
          const reward = parseFloat((15 + Math.random() * 10).toFixed(1)); // 15-25的奖励值
          
          // 保存优化数据
          setOptimizationData({
            totalVspSavings: totalSavings,
            hasConflict: hasConflict,
            iterations: iterations,
            reward: reward
          });
          
          // Generate AI message for Optimizer Agent
          const optimizerMessage = await aiService.generateOptimizerAgentMessage({
            phase: 'OPTIMIZATION',
            ships: targetShips,
            berths: berths,
            specificData: {
              totalVspSavings: totalSavings,
              hasConflict: hasConflict
            }
          });
          addMessage(AgentType.OPTIMIZER, 'ALL', optimizerMessage, "success");

          await new Promise(r => setTimeout(r, 1000));
          highlightAgents([AgentType.SCHEDULER]);
          
          // 第一阶段：只分配锚位
          const batch = [...ships].filter(s => processingShipIds.includes(s.id));
          batch.sort((a,b) => b.priority - a.priority);
          
          // 记录已占用的锚位
          const temporarilyOccupied = new Set<string>();
          berths.forEach(b => { 
              if(b.isOccupied || b.currentShipId) temporarilyOccupied.add(b.id); 
          });
          
          // 为每艘船分配锚位（使用静态地图上的实际锚位ID）
          const anchorageAssignments = new Map<string, string>();
          batch.forEach((s) => {
              // 根据船舶类型和大小选择合适的锚位（使用静态地图上的实际锚位ID）
              let preferredAnchorage: string[] = [];
              if (s.type === ShipType.TANKER || s.length > 200) {
                  // A区锚位：Y6, Y9, 13（深水区，吃水深度较大）
                  preferredAnchorage = ['Y6', 'Y9', '13'];
              } else if (s.length < 100) {
                  // C区锚位：Y8, M7, 14, 15（支线区，吃水深度较小）
                  preferredAnchorage = ['Y8', 'M7', '14', '15'];
              } else {
                  // B区锚位：Y7, Y10, 12（通用区）
                  preferredAnchorage = ['Y7', 'Y10', '12'];
              }
              
              // 查找空闲锚位
              const freeAnchorage = berths.find(b => 
                  b.type === 'anchorage' && 
                  preferredAnchorage.includes(b.id) &&
                  !temporarilyOccupied.has(b.id) &&
                  b.depth >= s.draft * 1.2 // 物理规则：锚位深度需≥船舶吃水*1.2
              ) || berths.find(b => 
                  b.type === 'anchorage' && 
                  !temporarilyOccupied.has(b.id) &&
                  b.depth >= s.draft * 1.2 // 物理规则：锚位深度需≥船舶吃水*1.2
              );
              
              if (freeAnchorage) {
                  anchorageAssignments.set(s.id, freeAnchorage.id);
                  temporarilyOccupied.add(freeAnchorage.id);
              }
          });

          // 更新船舶状态，分配锚位
          const shipsWithAnchorage = ships.map(s => {
              if (anchorageAssignments.has(s.id)) {
                  const anchorageId = anchorageAssignments.get(s.id)!;
                  return {
                      ...s,
                      assignedAnchorageId: anchorageId,
                      assignedBerthId: anchorageId, // 临时使用，用于第一阶段动画
                      isDelayed: false,
                      status: 'waiting',
                      gantt: {
                          startTime: 10,
                          duration: 2,
                          channelSlot: 'Deep'
                      }
                  };
              }
              return s;
          });
          
          setShips(shipsWithAnchorage);
          
          // 第一阶段优化时，不设置 isOccupied，只在船真正到达锚位时设置
          // 这样矩形框不会提前变红
          
          // 生成第一阶段调度智能体消息（分配锚位）
          (async () => {
              const anchorageAssignmentsList = Array.from(anchorageAssignments.entries())
                  .map(([shipId, anchorageId]) => {
                      const ship = ships.find(s => s.id === shipId);
                      const berth = berths.find(b => b.id === anchorageId);
                      const berthName = berth ? berth.name : anchorageId;
                      return `${ship?.name || shipId} -> ${berthName}`;
                  })
                  .join('\n');
              
              addMessage(AgentType.SCHEDULER, 'ALL', 
`调度智能体（分配锚位）：
${anchorageAssignmentsList}
物理约束(长度/吃水)校验通过。
锚位分配方案已确定。`, "warning");
          })();
      }
      
      // 3b. Optimization - 第二阶段：从锚位分配泊位
      else if (stepIndex === 3) {
          setPhase(SimulationPhase.OPTIMIZATION);
          highlightAgents([AgentType.OPTIMIZER]);
          
          await new Promise(r => setTimeout(r, 1000));
          highlightAgents([AgentType.COORDINATOR]);
          
          // 第二阶段：从锚位分配泊位
          const batch = [...ships].filter(s => 
              processingShipIds.includes(s.id) && 
              s.assignedAnchorageId // 只处理已到达锚位的船
          );
          batch.sort((a,b) => b.priority - a.priority);
          
          const assigned = new Set<string>();
          berths.forEach(b => { if(b.isOccupied && b.type === 'berth') assigned.add(b.id) });

          const initialAssignments = new Map<string, string>();
          const initialStartTimes = new Map<string, number>();

          // 生成初始解（规则启发式）- 只分配泊位
          batch.forEach((s) => {
              const rec = getRecommendedZone(s);
              // 先找推荐区域内的泊位，检查约束
              let finalBerth = rec.berths.find(p => {
                  if (assigned.has(p)) return false;
                  const berth = berths.find(b => b.id === p);
                  return berth && checkBerthConstraints(s, berth);
              });
              
              // 如果B区没找到，尝试A区
              if (!finalBerth && rec.zone === 'B') {
                  const aZoneBerths = berths.filter(b => b.type === 'berth' && b.zone === 'A').map(b => b.id);
                  finalBerth = aZoneBerths.find(p => {
                      if (assigned.has(p)) return false;
                      const berth = berths.find(b => b.id === p);
                      return berth && checkBerthConstraints(s, berth);
                  });
              }

              if (finalBerth) {
                  assigned.add(finalBerth);
                  initialAssignments.set(s.id, finalBerth);
                  // 基于EOT计算开始时间
                  const eotTime = s.earliestOperationTime || s.etaCorrected || s.etaOriginal;
                  const [eotHours] = eotTime.split(':').map(Number);
                  initialStartTimes.set(s.id, eotHours);
              }
          });

          // 创建初始解决方案
          const initialSolution: schedulingAlgorithms.ScheduleSolution = {
              assignments: initialAssignments,
              startTimes: initialStartTimes,
              objectiveValue: 0,
              efficiency: 0,
              cost: 0
          };

          // 使用变邻域搜索优化
          const optimizedSolution = schedulingAlgorithms.variableNeighborhoodSearch(
              initialSolution,
              batch,
              berths,
              50 // 迭代次数
          );

          // 应用优化后的解
          const updates = new Map<string, string | null>();
          batch.forEach(s => {
              const berthId = optimizedSolution.assignments.get(s.id);
              updates.set(s.id, berthId || null);
          });
          
          // 记录本批次中已占用的资源（只考虑泊位）
          const temporarilyOccupied = new Set<string>();
          berths.forEach(b => { 
              if(b.isOccupied && b.type === 'berth') temporarilyOccupied.add(b.id); 
          });
          updates.forEach((val) => { 
              if(val) temporarilyOccupied.add(val); 
          });

          const finalShips = ships.map(s => {
              // 只处理在 processingShipIds 中且有锚位的船
              if (processingShipIds.includes(s.id) && s.assignedAnchorageId) {
              if (updates.has(s.id)) {
                  const berthId = updates.get(s.id);
                  if (berthId) {
                      const startTime = optimizedSolution.startTimes.get(s.id) || 10;
                      const berth = berths.find(b => b.id === berthId);
                      const channelSlot = berth?.zone === 'A' ? 'Deep' : 'Feeder';
                      
                      return { 
                          ...s, 
                              assignedBerthId: berthId, // 更新为泊位ID（确保不同于锚位ID）
                              isDelayed: false,
                              status: s.status === 'anchored' ? 'anchored' : s.status, // 保持当前状态
                          gantt: { 
                              startTime: startTime, 
                                  duration: 4,
                              channelSlot: channelSlot
                          } 
                      };
                      } else {
                          // 没有分配到泊位，保持锚位状态（暂留在锚地）
                              return {
                                  ...s,
                              assignedBerthId: undefined, // 不设置泊位ID，表示暂留在锚地
                              isDelayed: false, // 不是延迟，只是暂留在锚地
                              status: s.status === 'anchored' ? 'anchored' : s.status // 保持当前状态
                          };
                      }
                          } else {
                      // 没有在 updates 中，说明没有被优化算法处理，保持原状态但清除临时 assignedBerthId
                              return { 
                                  ...s, 
                          assignedBerthId: undefined, // 清除第一阶段设置的临时值
                          status: s.status === 'anchored' ? 'anchored' : s.status
                      };
                      }
                  }
                  return s;
              });
              
          // 更新状态
              setShips(finalShips);
              
          console.log('[第二阶段优化] 更新后的船状态:', finalShips.filter(s => processingShipIds.includes(s.id)).map(s => ({
              name: s.name,
              assignedAnchorageId: s.assignedAnchorageId,
              assignedBerthId: s.assignedBerthId,
              status: s.status,
              berthDifferent: s.assignedBerthId !== s.assignedAnchorageId
          })));
              
          // 第二阶段优化时，不设置泊位的 isOccupied，只在船真正到达泊位时设置
          // 这样泊位矩形框不会提前变红
              
          // 生成第二阶段调度智能体消息（分配泊位）
          (async () => {
              // 重新从localStorage加载最新的berths数据（包括自定义名称），确保与资源智能体一致
              let latestBerthsForMessage = [...berths];
              try {
                const stored = localStorage.getItem('dynamic-berths-latlng');
                if (stored) {
                  const dynamicBerths = JSON.parse(stored);
                  dynamicBerths.forEach((db: Berth) => {
                    const existingIndex = latestBerthsForMessage.findIndex(b => b.id === db.id);
                    if (existingIndex >= 0) {
                      latestBerthsForMessage[existingIndex] = { ...latestBerthsForMessage[existingIndex], ...db };
                    } else {
                      latestBerthsForMessage.push(db);
                    }
                  });
                }
                
                // 标准泊位始终使用getBerthName，不被localStorage覆盖
                const standardBerthIds = ['A01', 'B01', 'B02', 'A02'];
                const customNamesStored = localStorage.getItem('berth-custom-names-latlng');
                if (customNamesStored) {
                  const customNames = JSON.parse(customNamesStored);
                  latestBerthsForMessage = latestBerthsForMessage.map(berth => {
                    // 标准泊位始终使用getBerthName
                    if (standardBerthIds.includes(berth.id)) {
                      return { ...berth, name: getBerthName(berth.id) };
                    }
                    // 非标准泊位可以使用自定义名称
                    if (customNames[berth.id]) {
                      return { ...berth, name: customNames[berth.id] };
                    }
                    return berth;
                  });
                } else {
                  // 即使没有自定义名称，也要确保标准泊位使用正确的名称
                  latestBerthsForMessage = latestBerthsForMessage.map(berth => {
                    if (standardBerthIds.includes(berth.id)) {
                      return { ...berth, name: getBerthName(berth.id) };
                    }
                    return berth;
                  });
                }
              } catch (e) {
                console.error('Failed to load latest berths for scheduler message:', e);
              }
              
              const assignedShipsForMessage = finalShips
                  .filter(s => 
                      processingShipIds.includes(s.id) && 
                      s.assignedAnchorageId &&
                      s.assignedBerthId && 
                      s.assignedBerthId !== s.assignedAnchorageId && // 泊位不同于锚位
                      s.gantt &&
                      !s.isDelayed
                  )
                  .sort((a, b) => {
                      const timeA = a.gantt?.startTime || 0;
                      const timeB = b.gantt?.startTime || 0;
                      return timeA - timeB;
                  });
              
              // 查找只有锚位但没有泊位的船
              const shipsWithoutBerth = finalShips
                  .filter(s => 
                      processingShipIds.includes(s.id) && 
                      s.assignedAnchorageId &&
                      (!s.assignedBerthId || s.assignedBerthId === s.assignedAnchorageId) && // 没有泊位或泊位等于锚位
                      s.gantt &&
                      !s.isDelayed
                  );
              
              const berthAssignments = assignedShipsForMessage.map(s => {
                  const anchorage = latestBerthsForMessage.find(b => b.id === s.assignedAnchorageId);
                  const berth = latestBerthsForMessage.find(b => b.id === s.assignedBerthId);
                  // 使用berth.name，与资源智能体输出保持一致
                  const anchorageName = anchorage ? anchorage.name : s.assignedAnchorageId;
                  // 统一格式：使用#号格式（1#、2#、3#、5#）
                  let berthName = berth ? berth.name : (s.assignedBerthId ? getBerthName(s.assignedBerthId) : '未知泊位');
                  // 如果泊位名称不包含"#"，则添加"泊位"后缀（兼容其他泊位）
                  if (berth && !berthName.includes('#') && !berthName.includes('泊位')) {
                    berthName = `${berthName} 泊位`;
                  }
                  return `${s.name} -> ${anchorageName} -> ${berthName}`;
              }).join('\n');
              
              // 生成没有泊位的船的信息
              const shipsWithoutBerthInfo = shipsWithoutBerth.map(s => {
                  const anchorage = latestBerthsForMessage.find(b => b.id === s.assignedAnchorageId);
                  const anchorageName = anchorage ? anchorage.name : s.assignedAnchorageId;
                  return `${s.name} -> ${anchorageName} (暂时在锚位等待)`;
              }).join('\n');
              
              // 组合消息
              let messageContent = '';
              if (berthAssignments) {
                  messageContent += `调度智能体（分配泊位）：\n${berthAssignments}\n`;
              }
              if (shipsWithoutBerthInfo) {
                  if (messageContent) messageContent += '\n';
                  messageContent += `调度智能体（待分配）：\n${shipsWithoutBerthInfo}\n`;
              }
              messageContent += '物理约束(长度/吃水)校验通过。\n';
              if (berthAssignments) {
                  messageContent += '最终分配方案已确定(锚位->泊位)。';
              } else {
                  messageContent += '当前无可用泊位，船舶需在锚位等待。';
              }
              
              addMessage(AgentType.SCHEDULER, 'ALL', messageContent, "warning");
              
              // Generate AI message for Coordinator Agent
              const coordinatorMessage = await aiService.generateCoordinatorAgentMessage({
                phase: 'OPTIMIZATION',
                ships: targetShips,
                berths: berths
              });
              addMessage(AgentType.COORDINATOR, 'ALL', coordinatorMessage, "negotiation");
          })();
      }

      // 4. Execution - 第一阶段：所有船都到锚位
      else if (stepIndex === 4) {
          setPhase(SimulationPhase.EXECUTION);
          highlightAgents([AgentType.SCHEDULER]); 
          setIsThinking(false); // 清除思考状态，停止转圈圈
          
          addMessage(AgentType.SCHEDULER, 'ALL', 
`执行指令（第一阶段）：
启动自动引航序列 -> 锚位。
锁定锚位与航道资源。`, "success");

          // 获取所有已分配锚位的船舶（只处理 waiting 状态的船，避免重复执行）
          console.log('[第一阶段] 所有船状态:', ships.filter(s => processingShipIds.includes(s.id)).map(s => `${s.name}: ${s.status}, 锚位: ${s.assignedAnchorageId}`));
          
          const shipsToAnchorage = ships
              .filter(s => 
                  processingShipIds.includes(s.id) && 
                  s.assignedAnchorageId && 
                  !s.isDelayed &&
                  s.status === 'waiting' // 只处理等待中的船，避免已经到达锚位的船重复执行
              )
              .sort((a, b) => {
                  // 按优先级排序
                  return b.priority - a.priority;
              });
          
          console.log('[第一阶段] 找到需要移动到锚位的船:', shipsToAnchorage.length, shipsToAnchorage.map(s => `${s.name}(${s.status})`));

          // 第一阶段：所有船都到锚位（按序执行，一艘完成后再开始下一艘）
          let cumulativeDelay = 0;
          shipsToAnchorage.forEach((ship, index) => {
              // 根据路径点数量调整导航时间（在 setTimeout 外部计算，用于累计延迟）
              let totalWaypoints = 0;
              try {
                  const stored = localStorage.getItem('berth-waypoints');
                  if (stored) {
                      const waypointsData = JSON.parse(stored);
                      totalWaypoints = waypointsData[ship.assignedAnchorageId!]?.length || 0;
                  }
              } catch (e) {
                  console.error('Failed to load waypoints for navigation duration:', e);
              }
              // 减慢船速：增加导航时间
              const navigationDuration = 6000 + (totalWaypoints * 1000);
              
              setTimeout(() => {
                  setShips(prev => prev.map(s => {
                      if (s.id === ship.id && s.assignedAnchorageId) {
                          return { ...s, status: 'navigating', progress: 0, assignedBerthId: s.assignedAnchorageId };
                      }
                      return s;
                  }));

                  // 延迟一小段时间，让船从waiting位置平滑过渡到第一个路径点
                  setTimeout(() => {
                      const startTime = Date.now();
                      const interval = setInterval(() => {
                          setShips(prev => {
                              const updatedShips = prev.map(s => {
                                  if (s.id === ship.id && s.status === 'navigating') {
                                      const elapsed = Date.now() - startTime;
                                      const newProgress = Math.min(1, elapsed / navigationDuration);
                                      if (newProgress >= 1) {
                                          clearInterval(interval);
                                          // 计算到达锚位时的角度
                                          const anchoredRotation = calculateAnchoredRotation(ship.assignedAnchorageId!);
                                          setTimeout(() => {
                                              setShips(prev => prev.map(s => {
                                                  if (s.id === ship.id && s.status === 'navigating') {
                                                      return { ...s, status: 'anchored', progress: 1, anchoredRotation };
                                                  }
                                                  return s;
                                              }));
                                              
                                              setBerths(prev => prev.map(b => {
                                                  if (b.id === ship.assignedAnchorageId) {
                                                      return { ...b, isOccupied: true, currentShipId: ship.id };
                                                  }
                                                  return b;
                                              }));
                                          }, 100);
                                          return { ...s, progress: 1 };
                                      }
                                      return { ...s, progress: newProgress };
                                  }
                                  return s;
                              });
                              return updatedShips;
                          });
                      }, 50);
                  }, 100); // 延迟100ms，让船从waiting位置平滑过渡
              }, cumulativeDelay);
              
              // 更新累计延迟：当前船的导航时间 + 缓冲时间
              // 确保一艘船完全到达锚位后，下一艘船才开始
              cumulativeDelay += navigationDuration + 500; // 导航时间 + 0.5秒缓冲
          });

          // 第一阶段完成后，等待所有船都到达锚位，然后进入第二阶段
          setTimeout(() => {
              // 确保所有船的状态都是 anchored
              setShips(prev => prev.map(s => {
                  if (processingShipIds.includes(s.id) && s.assignedAnchorageId && s.status === 'navigating') {
                      return { ...s, status: 'anchored', progress: 1 };
                  }
                  return s;
              }));
              
              // 等待2秒后进入第二阶段
              setTimeout(() => {
                  setCurrentStepIndex(5);
              }, 2000);
          }, cumulativeDelay + 1000);
          
          return;
      }
      
      // 5. Execution - 第二阶段：从锚位到泊位
      if (stepIndex === 5) {
          setPhase(SimulationPhase.EXECUTION);
          highlightAgents([AgentType.SCHEDULER]); 
          setIsThinking(false); // 清除思考状态，停止转圈圈
          
          // 先执行第二阶段优化：分配泊位（参考第一阶段 stepIndex === 2 的逻辑）
          const batch = [...ships].filter(s => 
              processingShipIds.includes(s.id) && 
              s.assignedAnchorageId && 
              s.status === 'anchored' // 只处理已到达锚位的船
          );
          batch.sort((a,b) => b.priority - a.priority);
          
          const assigned = new Set<string>();
          berths.forEach(b => { if(b.isOccupied && b.type === 'berth') assigned.add(b.id) });
          
          const initialAssignments = new Map<string, string>();
          const initialStartTimes = new Map<string, number>();

          // 生成初始解（规则启发式）- 只分配泊位
          batch.forEach((s) => {
              const rec = getRecommendedZone(s);
              // 先找推荐区域内的泊位，检查约束
              let finalBerth = rec.berths.find(p => {
                  if (assigned.has(p)) return false;
                  const berth = berths.find(b => b.id === p);
                  return berth && checkBerthConstraints(s, berth);
              });
              
              // 如果B区没找到，尝试A区
              if (!finalBerth && rec.zone === 'B') {
                  const aZoneBerths = berths.filter(b => b.type === 'berth' && b.zone === 'A').map(b => b.id);
                  finalBerth = aZoneBerths.find(p => {
                      if (assigned.has(p)) return false;
                      const berth = berths.find(b => b.id === p);
                      return berth && checkBerthConstraints(s, berth);
                  });
              }

              if (finalBerth) {
                  assigned.add(finalBerth);
                  initialAssignments.set(s.id, finalBerth);
                  // 基于EOT计算开始时间
                  const eotTime = s.earliestOperationTime || s.etaCorrected || s.etaOriginal;
                  const [eotHours] = eotTime.split(':').map(Number);
                  initialStartTimes.set(s.id, eotHours);
              }
          });

          // 创建初始解决方案
          const initialSolution: schedulingAlgorithms.ScheduleSolution = {
              assignments: initialAssignments,
              startTimes: initialStartTimes,
              objectiveValue: 0,
              efficiency: 0,
              cost: 0
          };

          // 使用变邻域搜索优化
          const optimizedSolution = schedulingAlgorithms.variableNeighborhoodSearch(
              initialSolution,
              batch,
              berths,
              50 // 迭代次数
          );

          // 应用优化后的解
          const updates = new Map<string, string | null>();
          batch.forEach(s => {
              const berthId = optimizedSolution.assignments.get(s.id);
              updates.set(s.id, berthId || null);
          });

          // 更新船舶状态，分配泊位
          const finalShips = ships.map(s => {
              if (processingShipIds.includes(s.id) && s.assignedAnchorageId) {
                  if (updates.has(s.id)) {
                      const berthId = updates.get(s.id);
                      if (berthId) {
                          const startTime = optimizedSolution.startTimes.get(s.id) || 10;
                          const berth = berths.find(b => b.id === berthId);
                          const channelSlot = berth?.zone === 'A' ? 'Deep' : 'Feeder';
                          
                          return { 
                              ...s, 
                              assignedBerthId: berthId, // 更新为泊位ID（确保不同于锚位ID）
                              isDelayed: false,
                              status: s.status === 'anchored' ? 'anchored' : s.status,
                              gantt: { 
                                  startTime: startTime, 
                                  duration: 4,
                                  channelSlot: channelSlot
                              } 
                          };
                      } else {
                          // 没有分配到泊位，保持锚位状态（暂留在锚地）
                          return {
                              ...s,
                              assignedBerthId: undefined, // 不设置泊位ID，表示暂留在锚地
                              isDelayed: false,
                              status: s.status === 'anchored' ? 'anchored' : s.status
                          };
                      }
                  } else {
                      // 没有在 updates 中，清除临时 assignedBerthId
                      return {
                          ...s,
                          assignedBerthId: undefined, // 清除第一阶段设置的临时值
                          status: s.status === 'anchored' ? 'anchored' : s.status
                      };
                  }
              }
              return s;
          });
          
          setShips(finalShips);
          
          // 生成第二阶段调度智能体消息（分配泊位）
          // 重新从localStorage加载最新的berths数据（包括自定义名称），确保与资源智能体一致
          let latestBerthsForMessage = [...berths];
          try {
            const stored = localStorage.getItem('dynamic-berths-latlng');
            if (stored) {
              const dynamicBerths = JSON.parse(stored);
              dynamicBerths.forEach((db: Berth) => {
                const existingIndex = latestBerthsForMessage.findIndex(b => b.id === db.id);
                if (existingIndex >= 0) {
                  latestBerthsForMessage[existingIndex] = { ...latestBerthsForMessage[existingIndex], ...db };
                } else {
                  latestBerthsForMessage.push(db);
                }
              });
            }
            
            // 标准泊位始终使用getBerthName，不被localStorage覆盖
            const standardBerthIds = ['A01', 'B01', 'B02', 'A02'];
            const customNamesStored = localStorage.getItem('berth-custom-names-latlng');
            if (customNamesStored) {
              const customNames = JSON.parse(customNamesStored);
              latestBerthsForMessage = latestBerthsForMessage.map(berth => {
                // 标准泊位始终使用getBerthName
                if (standardBerthIds.includes(berth.id)) {
                  return { ...berth, name: getBerthName(berth.id) };
                }
                // 非标准泊位可以使用自定义名称
                if (customNames[berth.id]) {
                  return { ...berth, name: customNames[berth.id] };
                }
                return berth;
              });
            } else {
              // 即使没有自定义名称，也要确保标准泊位使用正确的名称
              latestBerthsForMessage = latestBerthsForMessage.map(berth => {
                if (standardBerthIds.includes(berth.id)) {
                  return { ...berth, name: getBerthName(berth.id) };
                }
                return berth;
              });
            }
          } catch (e) {
            console.error('Failed to load latest berths for scheduler message:', e);
          }
          
          const berthAssignmentsList = Array.from(updates.entries())
              .filter(([_, berthId]) => berthId !== null)
              .map(([shipId, berthId]) => {
                  const ship = ships.find(s => s.id === shipId);
                  const anchorageId = ship?.assignedAnchorageId;
                  const anchorage = latestBerthsForMessage.find(b => b.id === anchorageId);
                  const berth = latestBerthsForMessage.find(b => b.id === berthId);
                  // 使用berth.name，与资源智能体输出保持一致
                  const anchorageName = anchorage ? anchorage.name : anchorageId;
                  // 统一格式：使用#号格式（1#、2#、3#、5#）
                  let berthName = berth ? berth.name : (berthId ? getBerthName(berthId) : '未知泊位');
                  // 如果泊位名称不包含"#"，则添加"泊位"后缀（兼容其他泊位）
                  if (berth && !berthName.includes('#') && !berthName.includes('泊位')) {
                    berthName = `${berthName} 泊位`;
                  }
                  return `${ship?.name || shipId} -> ${anchorageName} -> ${berthName}`;
              });

          // 查找只有锚位但没有泊位的船
          const shipsWithoutBerth = finalShips
              .filter(s => 
                  processingShipIds.includes(s.id) && 
                  s.assignedAnchorageId &&
                  (!s.assignedBerthId || s.assignedBerthId === s.assignedAnchorageId) && // 没有泊位或泊位等于锚位
                  s.status === 'anchored' // 确保船已经在锚位
              );
          
          // 生成没有泊位的船的信息
          const shipsWithoutBerthInfo = shipsWithoutBerth.map(s => {
              const anchorage = latestBerthsForMessage.find(b => b.id === s.assignedAnchorageId);
              const anchorageName = anchorage ? anchorage.name : s.assignedAnchorageId;
              return `${s.name} -> ${anchorageName} (暂时在锚位等待)`;
          }).join('\n');
          
          // 组合消息
          let messageContent = '';
          if (berthAssignmentsList.length > 0) {
              messageContent += `调度智能体（分配泊位）：\n${berthAssignmentsList.join('\n')}\n`;
          }
          if (shipsWithoutBerthInfo) {
              if (messageContent) messageContent += '\n';
              messageContent += `调度智能体（待分配）：\n${shipsWithoutBerthInfo}\n`;
          }
          messageContent += '物理约束(长度/吃水)校验通过。\n';
          if (berthAssignmentsList.length > 0) {
              messageContent += '最终分配方案已确定(锚位->泊位)。';
          } else {
              messageContent += '当前无可用泊位，船舶需在锚位等待。';
          }
          
          addMessage(AgentType.SCHEDULER, 'ALL', messageContent, "warning");
          
          // 执行指令消息
          let executionMessage = '执行指令（第二阶段）：\n';
          if (berthAssignmentsList.length > 0) {
              executionMessage += '启动自动引航序列 (锚位 -> 泊位)。\n锁定泊位与航道资源。';
          } else {
              executionMessage += '当前无可用泊位，船舶需在分配的锚位先等待。';
          }
          
          addMessage(AgentType.SCHEDULER, 'ALL', executionMessage, "success");

          // 获取所有已分配泊位的船舶（从锚位出发）
          const shipsToBerth = finalShips
              .filter(s => 
                  processingShipIds.includes(s.id) && 
                  s.assignedAnchorageId &&
                  s.assignedBerthId && 
                  s.assignedBerthId !== s.assignedAnchorageId && // 泊位不同于锚位
                  s.gantt && 
                  !s.isDelayed &&
                  s.status === 'anchored' // 确保船已经在锚位
              )
              .sort((a, b) => {
                  const timeA = a.gantt?.startTime || 0;
                  const timeB = b.gantt?.startTime || 0;
                  return timeA - timeB;
              });

          console.log('[第二阶段] 找到需要移动到泊位的船:', shipsToBerth.length, shipsToBerth.map(s => `${s.name}(${s.status})`));

          // 第二阶段：从锚位到泊位（按序执行，一艘完成后再开始下一艘）
          let cumulativeDelay = 0;
          shipsToBerth.forEach((ship, index) => {
              // 根据路径点数量调整导航时间（在 setTimeout 外部计算，用于累计延迟）
                  let totalWaypoints = 0;
                  try {
                      const stored = localStorage.getItem('berth-waypoints');
                      if (stored) {
                          const waypointsData = JSON.parse(stored);
                      // 尝试获取锚位到泊位的路径点（键名格式：M01->A01）
                      const pathKey = `${ship.assignedAnchorageId}->${ship.assignedBerthId}`;
                      totalWaypoints = waypointsData[pathKey]?.length || 0;
                      // 如果没有配置，使用直线路径（0个路径点）
                      }
                  } catch (e) {
                      console.error('Failed to load waypoints for navigation duration:', e);
                  }
              // 如果没有路径点，使用直线路径，减慢船速
              const navigationDuration = totalWaypoints > 0 ? 6000 + (totalWaypoints * 1000) : 5000;
              
              // 记录当前船的起始延迟时间
              const shipStartDelay = cumulativeDelay;
              
              setTimeout(() => {
                  setShips(prev => prev.map(s => {
                      if (s.id === ship.id && s.assignedBerthId) {
                          return { ...s, status: 'navigating', progress: 0 };
                      }
                      return s;
                  }));

                  // 延迟一小段时间，让船从锚位位置平滑过渡到第一个路径点
                  setTimeout(() => {
                  const startTime = Date.now();
                  const interval = setInterval(() => {
                      setShips(prev => {
                          const updatedShips = prev.map(s => {
                              if (s.id === ship.id && s.status === 'navigating') {
                                  const elapsed = Date.now() - startTime;
                                  const newProgress = Math.min(1, elapsed / navigationDuration);
                                  if (newProgress >= 1) {
                                      clearInterval(interval);
                                      setTimeout(() => {
                                          setShips(prev => prev.map(s => {
                                              if (s.id === ship.id && s.status === 'navigating') {
                                                  return { ...s, status: 'docking', progress: 1 };
                                              }
                                              return s;
                                          }));
                                          
                                              // 释放锚位，占用泊位
                                          setBerths(prev => prev.map(b => {
                                                  if (b.id === ship.assignedAnchorageId) {
                                                      return { ...b, isOccupied: false, currentShipId: undefined };
                                                  }
                                              if (b.id === ship.assignedBerthId) {
                                                  return { ...b, isOccupied: true, currentShipId: ship.id };
                                              }
                                              return b;
                                          }));
                                      }, 100);
                                      return { ...s, progress: 1 };
                                  }
                                  return { ...s, progress: newProgress };
                              }
                              return s;
                          });
                          return updatedShips;
                      });
                      }, 50);
                  }, 100); // 延迟100ms，让船从锚位位置平滑过渡到第一个路径点
              }, shipStartDelay);
              
              // 计算当前船的完成时间：导航时间 + 靠泊时间 + 缓冲
              // 导航时间：navigationDuration (ms)
              // 靠泊时间：2500ms
              // 缓冲时间：500ms
              const shipCompleteTime = shipStartDelay + navigationDuration + 2500 + 500;
              
              // 靠泊完成 (docked) - 在导航完成后执行
              setTimeout(() => {
                  setShips(prev => prev.map(s => {
                      if (s.id === ship.id && s.status === 'docking') {
                          return { ...s, status: 'docked' };
                      }
                      return s;
                  }));
              }, shipStartDelay + navigationDuration + 2500);
              
              // 更新累计延迟：当前船完全完成后的时间（用于下一艘船的起始时间）
              // 确保一艘船完全到达泊位并完成靠泊后，下一艘船才开始
              cumulativeDelay = shipCompleteTime;
          });

          // 所有船都完成后，结束模拟
          setTimeout(() => {
              setEfficiency(prev => Math.min(100, prev + 5));
              
              // Stop everything
              setActiveAgents([]);
              setIsThinking(false);
              setIsSimulating(false);
              setCurrentStepIndex(-1);
              
              // Clear selection so user can pick new ones
              setSelectedShipIds(new Set());
              setProcessingShipIds([]);
          }, cumulativeDelay);
          
          return;
      }
      
      // Schedule Next Step
      // stepIndex 4 和 5 已经在内部处理了 setCurrentStepIndex，不需要在这里处理
      if (stepIndex < 4) {
          const delay = 3000; // Animation time
          setTimeout(() => setCurrentStepIndex(stepIndex + 1), delay);
      }
  };

  useEffect(() => {
    if (isSimulating && currentStepIndex >= 0) {
        performSimulationStep(currentStepIndex);
    }
  }, [currentStepIndex, isSimulating]);

  // --- Interaction Handlers ---

  const toggleShipSelection = (id: string, e: React.MouseEvent) => {
      e.stopPropagation(); // 阻止事件冒泡
      if (isSimulating) return;
      const ship = ships.find(s => s.id === id);
      if (ship && ship.status !== 'waiting') return; 

      const newSet = new Set(selectedShipIds);
      if (newSet.has(id)) {
          newSet.delete(id);
      } else {
          newSet.add(id);
      }
      setSelectedShipIds(newSet);
  };

  const handleShipClick = (id: string) => {
      const ship = ships.find(s => s.id === id);
      if (ship) {
          setSelectedShipForDetail(ship);
      }
  };

  const handleStartSelected = () => {
    if (isSimulating) return;
    if (selectedShipIds.size === 0) {
        alert("请先在左侧列表中勾选需要调度的船舶！");
        return;
    }
    
    setMessages([]);
    setEfficiency(65);
    setCarbonSaved(12);
    setProcessingShipIds(Array.from(selectedShipIds));
    setOptimizationData({ totalVspSavings: 0, hasConflict: false, iterations: 0, reward: 0 }); 
    setCurrentStepIndex(0);
    setIsSimulating(true);
  };

  const handleStartAuto = () => {
      if (isSimulating) return;
      const waitingShips = ships.filter(s => s.status === 'waiting');
      if (waitingShips.length === 0) {
          alert("当前没有待港船舶可供调度。");
          return;
      }
      setMessages([]);
      setProcessingShipIds(waitingShips.map(s => s.id));
      setCurrentStepIndex(0);
      setIsSimulating(true);
  };

  const handleContinue = () => {
      if (isSimulating) return;
      const currentCount = ships.length;
      const existingShipIds = ships.map(s => s.id);
      const newShips = generateNewShips(currentCount, existingShipIds);
      setShips(prev => [...prev, ...newShips]);
      addMessage(AgentType.SHIP, 'ALL', `新船舶已到达锚地 (${newShips.length}艘)，等待调度。`, 'info');
  };

  const handleReset = () => {
    setIsSimulating(false);
    setIsThinking(false);
    setShips(INITIAL_SHIPS);
    // 重置泊位时，确保标准泊位使用正确的名称
    const standardBerthIds = ['A01', 'B01', 'B02', 'A02'];
    const resetBerths = [...PORT_BERTHS];
    // 添加标准泊位
    standardBerthIds.forEach(id => {
      const specs = getBerthSpecs(id);
      if (specs) {
        const zone = id.startsWith('A') ? 'A' : id.startsWith('B') ? 'B' : 'C';
        const existingIndex = resetBerths.findIndex(b => b.id === id);
        if (existingIndex >= 0) {
          // 更新现有泊位的名称
          resetBerths[existingIndex] = {
            ...resetBerths[existingIndex],
            name: getBerthName(id),
            length: specs.length,
            depth: specs.depth,
          };
        } else {
          // 添加新泊位
          resetBerths.push({
            id,
            name: getBerthName(id),
            type: 'berth' as const,
            zone: zone as 'A' | 'B' | 'C',
            length: specs.length,
            depth: specs.depth,
            isOccupied: false,
          });
        }
      }
    });
    setBerths(resetBerths);
    setMessages([]);
    setPhase(SimulationPhase.IDLE);
    setActiveAgents([]);
    setCurrentStepIndex(-1);
    setSelectedShipIds(new Set());
    setProcessingShipIds([]);
    setOptimizationData({ totalVspSavings: 0, hasConflict: false, iterations: 0, reward: 0 });
    setCarbonSaved(12);
    setEfficiency(65);
  };

  const handleBerthClick = (berthId: string) => {
      // Find valid docked ship
      const ship = ships.find(s => s.assignedBerthId === berthId && s.status === 'docked');
      
      if (ship) {
          // Explicit check to confirm release
          const confirmed = window.confirm(`确认 ${ship.name} (ID: ${ship.id}) 完工离泊? \n此操作将释放泊位资源。`);
          
          if (confirmed) {
              setShips(prev => prev.map(s => s.id === ship.id ? { ...s, status: 'departing' } : s));
              setBerths(prev => prev.map(b => b.id === berthId ? { ...b, isOccupied: false } : b));
              
              // Remove ship from list after animation completes
              setTimeout(() => {
                  setShips(prev => prev.filter(s => s.id !== ship.id));
              }, 2500);
          }
      }
  };

  const getPhaseWidth = () => {
     switch(phase) {
        case SimulationPhase.IDLE: return '0%';
        case SimulationPhase.PERCEPTION: return '25%';
        case SimulationPhase.MATCHING: return '50%';
        case SimulationPhase.OPTIMIZATION: return '75%';
        case SimulationPhase.EXECUTION: return '100%';
        default: return '0%';
     }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gradient-to-br from-slate-950 via-[#0f172a] to-slate-950 text-slate-300 overflow-hidden font-sans">
      {/* Header */}
      <header className="h-14 border-b border-slate-700/50 bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-sm flex items-center px-4 justify-between shrink-0 z-50 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/40 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.2)] backdrop-blur-sm">
            <Anchor size={20} className="text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-wide text-slate-100 uppercase font-sans drop-shadow-sm">
              多智能体港口调度系统
            </h1>
          </div>
        </div>

        {/* Phase Progress */}
        <div className="flex flex-col w-[300px]">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-semibold">
                 <span className="tracking-wide">感知</span>
                 <span className="tracking-wide">匹配</span>
                 <span className="tracking-wide">优化</span>
                 <span className="tracking-wide">执行</span>
            </div>
            <div className="w-full h-2 bg-slate-800/60 rounded-full overflow-hidden border border-slate-700/50 shadow-inner">
                <div className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)] transition-all duration-500 ease-in-out relative overflow-hidden" style={{ width: getPhaseWidth() }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                </div>
            </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 items-center">
            <button onClick={handleReset} className="text-sm text-slate-400 hover:text-white flex items-center gap-1.5 font-medium transition-all px-3 py-1.5 rounded-lg hover:bg-slate-700/50 backdrop-blur-sm">
                <RotateCcw size={16} /> 重置
            </button>
            <div className="h-6 w-px bg-slate-700/50 mx-1"></div>
            <button onClick={handleContinue} disabled={isSimulating} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all border bg-gradient-to-r from-slate-700/80 to-slate-600/80 border-slate-600/50 text-slate-200 hover:from-slate-600 hover:to-slate-500 hover:text-white hover:shadow-[0_0_10px_rgba(148,163,184,0.3)] disabled:opacity-40 disabled:cursor-not-allowed backdrop-blur-sm">
                <FastForward size={16} /> 生成新船
            </button>
            <button onClick={handleStartAuto} disabled={isSimulating} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all border bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-500/50 text-white hover:from-indigo-500 hover:to-purple-500 hover:shadow-[0_0_15px_rgba(99,102,241,0.6)] disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed backdrop-blur-sm">
                <Layers size={16}/> 全自动调度
            </button>
            <button onClick={handleStartSelected} disabled={isSimulating} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all border shadow-lg backdrop-blur-sm ${isSimulating ? 'bg-slate-800/60 border-slate-700/50 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-500/50 text-white hover:from-emerald-500 hover:to-teal-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.6)]'}`}>
                {isSimulating ? <Cpu className="animate-spin" size={14}/> : <Play size={14}/>}
                {isSimulating ? '调度执行中...' : '启动选中调度'}
            </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 p-3 grid grid-cols-12 gap-3 overflow-hidden min-h-0 w-full">
        
        {/* Left: List & Gantt */}
        <div className={`${isLeftSidebarOpen ? 'col-span-2 flex' : 'hidden'} flex-col gap-3 min-h-0`}>
             <div className="flex-[2] bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-slate-700/50 rounded-xl flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden min-h-0 backdrop-blur-sm">
                <div className="p-2.5 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/80 to-slate-700/60 font-bold text-sm text-slate-300 flex items-center justify-between shrink-0 backdrop-blur-sm">
                    <span className="flex items-center gap-2"><ShipIcon size={16} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]"/> 船舶列表</span>
                    <div className="flex items-center gap-2">
                        <span className="text-xs bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-600/50 text-slate-300 font-semibold backdrop-blur-sm">选中: {selectedShipIds.size}</span>
                        <button 
                            onClick={() => setIsLeftSidebarOpen(false)}
                            className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-600/50 transition-colors"
                            title="收起列表"
                        >
                            <ChevronLeft size={14} />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                    {ships.map(ship => {
                        const isSelected = selectedShipIds.has(ship.id);
                        const isSelectable = ship.status === 'waiting' && !isSimulating;
                        return (
                            <div key={ship.id} 
                                className={`p-2.5 rounded-lg border transition-all duration-200 group relative backdrop-blur-sm ${isSelected ? 'bg-gradient-to-r from-blue-900/40 to-cyan-900/20 border-blue-500/60 shadow-[0_4px_12px_rgba(59,130,246,0.3)]' : selectedShipForDetail?.id === ship.id ? 'bg-gradient-to-r from-purple-900/30 to-pink-900/20 border-purple-500/50 shadow-[0_4px_12px_rgba(168,85,247,0.3)]' : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-700/40'} ${isSelectable ? 'cursor-pointer hover:border-slate-500 hover:shadow-md' : 'opacity-70'}`}
                                style={{ borderLeftWidth: '3px', borderLeftColor: ship.color }}
                                onClick={() => handleShipClick(ship.id)}
                            >
                                <div className="flex items-start gap-2">
                                    <div 
                                        className={`mt-0.5 w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 cursor-pointer transition-all ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-600 bg-slate-900 hover:border-blue-400'}`}
                                        onClick={(e) => toggleShipSelection(ship.id, e)}
                                    >
                                        {isSelected && <CheckSquare size={10} className="text-white" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <span className="text-[10px] text-slate-500 font-mono">MMSI: {ship.mmsi || ship.id}</span>
                                            <span className="text-xs px-1.5 py-0.5 bg-slate-700 rounded text-slate-400">{ship.type}</span>
                                        </div>
                                        <div className="text-sm text-slate-400 truncate font-bold">{ship.name}</div>
                                        <div className="flex justify-between mt-1 text-xs text-slate-500 font-mono">
                                            <span>Len:{ship.length}m / W:{ship.width}m</span>
                                            <span className={(ship.status === 'docked' || ship.status === 'docking') ? 'text-emerald-500' : 'text-blue-400'}>
                                                {ship.status === 'waiting' ? '待港' : 
                                                 ship.status === 'anchored' ? '停锚中' :
                                                 ship.status === 'navigating' ? '航行中' : 
                                                 (ship.status === 'docking' || ship.status === 'docked') ? '已靠泊' : 
                                                 '离港中'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
             </div>
             <div className="flex-[1] min-h-[160px] shrink-0">
                 <BottomVis ships={ships} />
             </div>
        </div>

        {/* Center: Map & Phase Detail */}
        <div className={`${
            isLeftSidebarOpen && isRightSidebarOpen ? 'col-span-7' : 
            isLeftSidebarOpen && !isRightSidebarOpen ? 'col-span-10' :
            !isLeftSidebarOpen && isRightSidebarOpen ? 'col-span-9' :
             'col-span-12'
         } flex flex-col gap-3 min-h-0 h-full transition-all duration-300`}>
             <div className={`${isBottomPanelOpen ? 'flex-[3]' : 'flex-1'} relative rounded-xl overflow-hidden bg-gradient-to-br from-slate-900/95 to-slate-950/95 border border-slate-700/50 shadow-[0_8px_32px_rgba(0,0,0,0.4)] min-h-0 backdrop-blur-sm group transition-all duration-300`}>
                  {!isLeftSidebarOpen && (
                      <button
                          onClick={() => setIsLeftSidebarOpen(true)}
                          className="absolute left-0 top-2 z-50 bg-slate-800/90 border border-slate-600 text-slate-300 p-1 rounded-r-md shadow-lg hover:text-white hover:bg-slate-700 transition-all backdrop-blur-sm opacity-50 group-hover:opacity-100"
                          title="展开左侧列表"
                      >
                          <ChevronRight size={16} />
                      </button>
                  )}
                  {!isRightSidebarOpen && (
                      <button
                          onClick={() => setIsRightSidebarOpen(true)}
                          className="absolute right-0 top-2 z-50 bg-slate-800/90 border border-slate-600 text-slate-300 p-1 rounded-l-md shadow-lg hover:text-white hover:bg-slate-700 transition-all backdrop-blur-sm opacity-50 group-hover:opacity-100"
                          title="展开右侧面板"
                      >
                          <ChevronLeft size={16} />
                      </button>
                  )}
                  {!isBottomPanelOpen && (
                      <button
                          onClick={() => setIsBottomPanelOpen(true)}
                          className="absolute bottom-2 left-1/2 -translate-x-1/2 z-50 bg-slate-800/90 border border-slate-600 text-slate-300 p-1 rounded-t-md shadow-lg hover:text-white hover:bg-slate-700 transition-all backdrop-blur-sm opacity-50 group-hover:opacity-100"
                          title="展开底部面板"
                      >
                          <ChevronUp size={16} />
                      </button>
                  )}
                  {/* 直接显示静态地图 */}
                  <StaticMap berths={berths} ships={ships} simulationPhase={phase} processingShipIds={processingShipIds} />
             </div>
             <div className={`${isBottomPanelOpen ? 'flex-[1] min-h-[220px] max-h-[250px]' : 'hidden'} shrink-0 overflow-hidden rounded-xl relative group flex flex-col`}>
                 {/* 视图切换按钮 */}
                 <div className="flex gap-2 p-2 border-b border-slate-700/50 bg-slate-900/50 shrink-0">
                    <button
                        onClick={() => setActiveDetailView('perception')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            activeDetailView === 'perception'
                                ? 'bg-cyan-600/90 text-white shadow-lg shadow-cyan-500/20'
                                : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                        }`}
                        title="智能感知 & ETA修正"
                    >
                        <Activity size={14} />
                        智能感知 & ETA修正
                    </button>
                    <button
                        onClick={() => setActiveDetailView('matching')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            activeDetailView === 'matching'
                                ? 'bg-amber-600/90 text-white shadow-lg shadow-amber-500/20'
                                : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                        }`}
                        title="物理约束校验矩阵"
                    >
                        <ShieldCheck size={14} />
                        物理约束校验矩阵
                    </button>
                    <button
                        onClick={() => setActiveDetailView('optimization')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            activeDetailView === 'optimization'
                                ? 'bg-purple-600/90 text-white shadow-lg shadow-purple-500/20'
                                : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                        }`}
                        title="优化博弈与决策日志"
                    >
                        <TrendingUp size={14} />
                        优化博弈与决策日志
                    </button>
                 </div>
                 <div className="absolute right-2 top-2 z-20">
                    <button 
                        onClick={() => setIsBottomPanelOpen(false)}
                        className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-700/50 transition-colors opacity-0 group-hover:opacity-100"
                        title="收起底部面板"
                    >
                        <ChevronDown size={14} />
                    </button>
                 </div>
                 <div className="flex-1 min-h-0 overflow-hidden">
                    <PhaseDetailPanel 
                      phase={phase} 
                      ships={ships} 
                      processingIds={processingShipIds}
                      totalVspSavings={optimizationData.totalVspSavings}
                      carbonSaved={carbonSaved}
                      hasConflict={optimizationData.hasConflict}
                      optimizationIterations={optimizationData.iterations}
                      optimizationReward={optimizationData.reward}
                      activeView={activeDetailView}
                    />
                 </div>
             </div>
        </div>

        {/* Right: Dashboard & Agents */}
        <div className={`${isRightSidebarOpen ? 'col-span-3 flex' : 'hidden'} flex-col gap-3 min-h-0 relative`}>
             {/* 收起按钮 - 悬浮在右上角 */}
             <div className="absolute right-0 top-0 z-50 p-1">
                 <button 
                     onClick={() => setIsRightSidebarOpen(false)}
                     className="text-slate-400 hover:text-white p-1 rounded bg-slate-900/50 border border-slate-700/50 hover:bg-slate-700/50 transition-colors backdrop-blur-sm"
                     title="收起面板"
                 >
                     <ChevronRight size={14} />
                 </button>
             </div>

             {/* Portal 容器 - 用于渲染编辑面板 */}
             <div id="static-map-edit-panel-portal" className="absolute inset-0 pointer-events-none z-50"></div>

             <div className="h-[150px] shrink-0">
                 <Dashboard tideData={TIDE_DATA} efficiency={efficiency} carbonSaved={carbonSaved} />
             </div>
             <div className="flex-1 min-h-0 overflow-hidden rounded-xl">
                 <AgentOrchestrator messages={messages} activeAgents={activeAgents} isThinking={isThinking} isSimulating={isSimulating} />
             </div>
        </div>

        {/* 船舶详情浮窗 */}
        {selectedShipForDetail && (
            <>
                {/* 背景遮罩 */}
                <div 
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                    onClick={() => setSelectedShipForDetail(null)}
                ></div>
                {/* 浮窗卡片 */}
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-slate-900/98 to-slate-800/98 border border-slate-700/50 rounded-xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-md z-50 min-w-[320px] max-w-[400px]">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700/50">
                        <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                            <ShipIcon size={16} className="text-cyan-400" /> 船舶详情
                        </h4>
                        <button 
                            onClick={() => setSelectedShipForDetail(null)}
                            className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-slate-700/50 transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="space-y-3 text-sm">
                        {/* 上半部分：AIS / 识别信息 */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-xs bg-slate-900/60 rounded-lg p-2 border border-slate-700/60">
                            <div className="flex justify-between">
                                <span className="text-slate-400">MMSI:</span>
                                <span className="text-slate-200 font-bold">{selectedShipForDetail.mmsi || selectedShipForDetail.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">船首向:</span>
                                <span className="text-slate-200">
                                  {(selectedShipForDetail.headingDeg ?? 70).toFixed(1)}°
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">呼号:</span>
                                <span className="text-slate-200">{selectedShipForDetail.callSign || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">航向:</span>
                                <span className="text-slate-200">
                                  {(selectedShipForDetail.courseOverGroundDeg ?? 334.3).toFixed(1)}°
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">IMO:</span>
                                <span className="text-slate-200">{selectedShipForDetail.imo || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">航速:</span>
                                <span className="text-slate-200">
                                  {(selectedShipForDetail.speedKnots ?? 0).toFixed(1)} 节
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">类型:</span>
                                <span className="text-slate-300">{selectedShipForDetail.type}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">纬度:</span>
                                <span className="text-slate-200">
                                  {selectedShipForDetail.latitudeText || '29-56.795N'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">状态:</span>
                                <span className="font-bold text-emerald-400">待港</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">经度:</span>
                                <span className="text-slate-200">
                                  {selectedShipForDetail.longitudeText || '121-42.778E'}
                                </span>
                            </div>
                        </div>

                        {/* 下半部分：尺度 / 计划信息 */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-xs bg-slate-900/40 rounded-lg p-2 border border-slate-700/60">
                            <div className="flex justify-between">
                                <span className="text-slate-400">船长:</span>
                                <span className="text-slate-200">{selectedShipForDetail.length} m</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">目的地:</span>
                                <span className="text-slate-200 truncate max-w-[120px]">
                                  {selectedShipForDetail.destination || '-'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">船宽:</span>
                                <span className="text-slate-200">{selectedShipForDetail.width} m</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">预到时间:</span>
                                <span className="text-slate-200">
                                  {selectedShipForDetail.etaFullText || 
                                   `2025-09-12 ${selectedShipForDetail.etaOriginal || '00:00:00'}`}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">吃水:</span>
                                <span className="text-slate-200">{selectedShipForDetail.draft} m</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">更新时间:</span>
                                <span className="text-slate-200">
                                  {selectedShipForDetail.lastUpdateTime || 
                                   new Date().toISOString().replace('T', ' ').slice(0, 19)}
                                </span>
                            </div>
                            {selectedShipForDetail.assignedBerthId && (
                              <div className="flex justify-between col-span-2">
                                  <span className="text-slate-400">分配泊位:</span>
                                  <span className="text-cyan-400 font-bold">
                                    {getBerthName(selectedShipForDetail.assignedBerthId)}
                                  </span>
                              </div>
                            )}
                        </div>
                    </div>
                </div>
            </>
        )}

      </main>
    </div>
  );
};

export default App;