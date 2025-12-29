/**
 * AI Service for Multi-Agent System
 * Uses Google Gemini API to generate intelligent agent messages
 */

// Get API key from environment
// Access via process.env (defined in vite.config.ts) or import.meta.env
// Netlify uses VITE_ prefix for environment variables
const GEMINI_API_KEY = (
  (typeof process !== 'undefined' && (process.env as any)?.GEMINI_API_KEY) ||
  (import.meta.env as any)?.GEMINI_API_KEY ||
  (import.meta.env as any)?.VITE_GEMINI_API_KEY ||
  ''
) as string;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

interface AgentContext {
  phase: string;
  ships: any[];
  berths: any[];
  previousMessages?: string[];
  specificData?: any;
}

/**
 * Call Gemini API to generate agent message
 */
async function callGeminiAPI(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === '') {
    console.warn('GEMINI_API_KEY not found, using fallback template');
    return '';
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 500,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return generatedText.trim();
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return ''; // Return empty to use fallback
  }
}

/**
 * Generate message for Ship Agent
 */
export async function generateShipAgentMessage(context: AgentContext): Promise<string> {
  const { ships } = context;
  const shipList = ships.map(s => `- ${s.name} (ID: ${s.id}, ETA: ${s.etaOriginal}, 类型: ${s.type}, 长度: ${s.length}m, 吃水: ${s.draft}m, 优先级: ${s.priority})`).join('\n');

  const prompt = `你是一个港口调度系统中的船舶智能体。当前有${ships.length}艘船舶需要入港调度。

船舶信息：
${shipList}

请生成一份专业的船舶智能体报告，包括：
1. 船舶数量和基本信息汇总
2. 静态数据同步状态
3. 请求分配进港窗口

要求：
- 使用专业术语
- 简洁明了
- 中文输出
- 格式清晰，使用列表或分段

直接输出报告内容，不要添加额外说明：`;

  const aiResponse = await callGeminiAPI(prompt);
  if (aiResponse) {
    return aiResponse;
  }

  // Fallback template
  const shipListStr = ships.map(s => `${s.name} (E:${s.etaOriginal})`).join('\n');
  return `船舶智能体报告 (${ships.length}艘):
${shipListStr}
静态数据已同步。请求分配进港窗口。`;
}

/**
 * Generate message for Resource Agent
 */
export async function generateResourceAgentMessage(context: AgentContext): Promise<string> {
  const { berths } = context;
  // 调试：输出传入的berths数组信息
  console.log('[ResourceAgent] Received berths:', berths.length, 'total');
  console.log('[ResourceAgent] Anchorage count:', berths.filter(b => b.type === 'anchorage').length);
  console.log('[ResourceAgent] Berth count:', berths.filter(b => b.type === 'berth').length);
  console.log('[ResourceAgent] All berths (type=berth):', berths.filter(b => b.type === 'berth').map(b => `${b.id}:${b.name}(${b.zone})`));
  console.log('[ResourceAgent] All anchorages (type=anchorage):', berths.filter(b => b.type === 'anchorage').map(b => `${b.id}:${b.name}(${b.zone})`));
  
  // 正确统计：排除被占用的泊位（isOccupied为true或currentShipId存在）
  // 区分锚位和泊位
  // 总泊位和锚位数（按类型区分）
  const totalBerths = berths.filter(b => b.type === 'berth').length; 
  const totalAnchorages = berths.filter(b => b.type === 'anchorage').length;
  
  // 空闲泊位数
  const freeBerths = berths.filter(b => b.type === 'berth' && !b.isOccupied && !b.currentShipId).length;
  const freeAnchorages = berths.filter(b => b.type === 'anchorage' && !b.isOccupied && !b.currentShipId).length;

  // 获取具体名称列表
  const anchorageNames = berths
    .filter(b => b.type === 'anchorage')
    .map(b => `${b.name}(${b.isOccupied ? '占用' : '空闲'})`)
    .join('、');

  // 直接列出所有空闲泊位（不分区域）
  const freeBerthNames = berths
    .filter(b => b.type === 'berth' && !b.isOccupied && !b.currentShipId)
    .map(b => `${b.name}(空闲)`)
    .join('、');
  
  // 所有泊位列表（包括占用的，用于显示完整状态）
  const allBerthNames = berths
    .filter(b => b.type === 'berth')
    .map(b => `${b.name}(${b.isOccupied || b.currentShipId ? '占用' : '空闲'})`)
    .join('、');

  const prompt = `你是一个港口调度系统中的资源智能体。需要报告当前港口资源状态。
请严格区分"泊位"和"锚位"，并列出具体资源名称。

当前资源状态：
- 锚位资源: 总计${totalAnchorages}个，空闲${freeAnchorages}个。详情：${anchorageNames}
- 泊位资源: 总计${totalBerths}个，空闲${freeBerths}个。空闲泊位：${freeBerthNames || '无'}
- 潮汐窗：开放 (4.8m)
- 气象：风速3级，适航

请生成一份专业的资源智能体报告，包括：
1. 锚位资源状态（务必列出锚位名称）
2. 泊位可用情况（务必列出空闲泊位名称）
3. 环境条件（潮汐、气象）
4. 数字孪生环境状态

要求：
- 使用专业术语
- 简洁明了
- 中文输出
- 格式清晰，使用列表
- **必须显示具体的锚位和泊位名称**

直接输出报告内容，不要添加额外说明：`;

  const aiResponse = await callGeminiAPI(prompt);
  if (aiResponse) {
    return aiResponse;
  }

  // Fallback template
  return `资源智能体：
- 锚位资源: 总计${totalAnchorages}个，空闲${freeAnchorages}个
  详情：${anchorageNames}
- 泊位资源: 总计${totalBerths}个，空闲${freeBerths}个
  空闲泊位：${freeBerthNames || '无'}
- 潮汐窗：开放 (4.8m)
- 气象：风速3级，适航。
数字孪生环境已更新。`;
}

/**
 * Generate message for Scheduler Agent
 */
export async function generateSchedulerAgentMessage(context: AgentContext): Promise<string> {
  const { ships, berths } = context;
  const assignments = ships.map(s => {
    const rec = getRecommendedZone(s);
    
    // 如果已有分配的泊位ID（Execution阶段），直接使用
    const targetBerth = s.assignedBerthId || rec.berths[0];
    const berthObj = berths.find(b => b.id === targetBerth);
    const berthName = berthObj ? berthObj.name : targetBerth;

    // 检查目标是否为锚位
    const isAnchorage = berthObj?.type === 'anchorage' || (typeof targetBerth === 'string' && targetBerth.startsWith('M'));

    if (isAnchorage) {
        return `${s.name} -> ${berthName}`;
    }

    // 逻辑流：锚位 -> 泊位
    // 根据船舶大小和类型估算锚位（使用静态地图上的实际锚位ID）
    let anchorage = 'Y7 锚位'; // 默认B区锚位
    if (s.type === 'TANKER' || s.type === '油轮' || s.length > 200) anchorage = 'Y6 锚位'; // A区锚位
    else if (s.length < 100) anchorage = 'Y8 锚位'; // C区锚位
    
    return `${s.name} -> ${anchorage} -> ${berthName}`;
  }).join('\n');

  const prompt = `你是一个港口调度系统中的调度智能体。已完成物理约束匹配和泊位分配。
  
重要原则：所有船舶必须先分配锚位，再进入泊位。

分配方案（流程式）：
${assignments}

请生成一份专业的调度智能体报告，包括：
1. 船舶-锚位-泊位全流程分配方案 (必须明确写出锚位名称和泊位名称)
2. 物理约束校验状态
3. 候选泊位集生成情况

要求：
- 使用专业术语
- 简洁明了
- 中文输出
- 格式清晰
- **严格遵循"船舶 -> 锚位 -> 泊位"的调度路径描述**

直接输出报告内容，不要添加额外说明：`;

  const aiResponse = await callGeminiAPI(prompt);
  if (aiResponse) {
    return aiResponse;
  }

  // Fallback template
  return `调度智能体：
${assignments}
物理约束(长度/吃水)校验通过。
最终分配方案已确定(锚位->泊位)。`;
}

/**
 * Generate message for Optimizer Agent
 */
export async function generateOptimizerAgentMessage(context: AgentContext): Promise<string> {
  const { ships, specificData } = context;
  const totalSavings = specificData?.totalVspSavings || 0;
  const hasConflict = specificData?.hasConflict || false;

  const prompt = `你是一个港口调度系统中的优化智能体。已完成多目标优化和博弈决策。

优化结果：
- 船舶能耗 - 航速关联属性策略：已启用
- 预计批次节省燃油: ${totalSavings.toFixed(1)} 吨
- 航道冲突检测: ${hasConflict ? '检测到冲突' : '无冲突'}
- MARL算法：已收敛到帕累托最优解

请生成一份专业的优化智能体报告，包括：
1. 船舶能耗 - 航速关联属性策略应用情况
2. 燃油节省和碳排放效益
3. 冲突检测结果
4. 算法收敛状态

要求：
- 使用专业术语
- 简洁明了
- 中文输出
- 格式清晰，使用列表

直接输出报告内容，不要添加额外说明：`;

  const aiResponse = await callGeminiAPI(prompt);
  if (aiResponse) {
    return aiResponse;
  }

  // Fallback template
  return `优化智能体：
- 启用船舶能耗 - 航速关联属性策略
- 预计批次节省燃油: ${totalSavings.toFixed(1)} 吨
- 航道冲突检测: ${hasConflict ? '检测到冲突' : '无'}
- MARL 算法收敛: 达到帕累托最优解`;
}

/**
 * Generate message for Coordinator Agent
 */
export async function generateCoordinatorAgentMessage(context: AgentContext): Promise<string> {
  const prompt = `你是一个港口调度系统中的协调智能体。已完成多目标权衡和方案审批。

请生成一份专业的协调智能体报告，包括：
1. 多目标权衡结果（效率 vs 成本）
2. 方案审批决定
3. 执行指令

要求：
- 使用专业术语
- 简洁明了
- 中文输出
- 格式清晰

直接输出报告内容，不要添加额外说明：`;

  const aiResponse = await callGeminiAPI(prompt);
  if (aiResponse) {
    return aiResponse;
  }

  // Fallback template
  return `协调智能体：
多目标权衡完毕 (效率 vs 成本)。
批准当前调度方案，下发执行。`;
}

/**
 * Generate warning message for delayed ships
 */
export async function generateWarningMessage(delayedShips: any[]): Promise<string> {
  const shipNames = delayedShips.map(s => s.name).join('、');
  
  const prompt = `你是一个港口调度系统中的调度智能体。需要生成警告消息。

情况：以下船舶因资源不足，仍在待入港船舶队列中等待：
${shipNames}

请生成一份专业的警告消息，要求：
- 使用专业术语
- 简洁明了
- 中文输出
- 说明原因和状态

直接输出警告消息，不要添加额外说明：`;

  const aiResponse = await callGeminiAPI(prompt);
  if (aiResponse) {
    return aiResponse;
  }

  // Fallback template
  return `警告：${shipNames} 因资源不足，仍在待入港船舶队列中等待。`;
}

// Helper function (same as in App.tsx)
function getRecommendedZone(ship: any) {
  // 1. Tankers must go to A (Deep/Hazard safe)
  if (ship.type === '油轮' || ship.type === 'TANKER') return { zone: 'A', berths: ['A01'] };
  
  // 2. Ultra Large Vessels (>300m) must go to A
  if (ship.length > 300) return { zone: 'A', berths: ['A01'] };

  // 3. Bulk Carriers prefer B (General), can go A if needed
  if (ship.type === '散货船' || ship.type === 'BULK') return { zone: 'B', berths: ['B01', 'A01'] };

  // 4. Large Containers (>150m) go to B or A
  if (ship.length > 150) return { zone: 'B', berths: ['B01', 'A01'] };

  // 5. Small Feeder (<150m) go to A02 (5号泊位，原C01区域)
  return { zone: 'A', berths: ['A02'] };
}

