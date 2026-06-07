export type ResumeCardItem = {
  id: string;
  name: string;
  title: string;
  summary: string;
  updatedAt: string;
  skills: string[];
  targetRole?: string;
};

export type ResumeDetailRecord = {
  id: string;
  name: string;
  title: string;
  contactLine: string;
  summary: string;
  skills: string[];
  targetRole: string;
  rawText: string;
  experiences: Array<{
    company: string;
    role: string;
    period: string;
    highlights: string[];
  }>;
  projects: Array<{
    name: string;
    role: string;
    period: string;
    highlights: string[];
  }>;
  education: Array<{
    school: string;
    degree: string;
    period: string;
  }>;
};

export const resumeCards: ResumeCardItem[] = [
  {
    id: "resume-01",
    name: "张潇童",
    title: "AI 产品与前端协同简历",
    summary:
      "突出 AI 面试、简历优化与前端交付之间的完整链路，适合投递 AI 产品协同与前端体验方向岗位。",
    updatedAt: "2026-06-02 10:30",
    skills: ["React", "TypeScript", "AI 应用", "交互设计"],
    targetRole: "AI 产品 / 前端协同",
  },
  {
    id: "resume-02",
    name: "张潇童",
    title: "智能面试产品简历",
    summary:
      "强调语音交互、面试训练与复盘报告能力，更适合智能面试、教育科技和 AI 训练平台岗位。",
    updatedAt: "2026-05-28 18:10",
    skills: ["LLM", "语音交互", "Node.js", "产品设计"],
    targetRole: "智能面试产品",
  },
];

export const excellentResumeCards: ResumeCardItem[] = [
  {
    id: "template-01",
    name: "结果导向型简历模板",
    title: "产品经理 / 策略分析",
    summary:
      "适合强化项目结果、指标提升与业务理解，便于快速对齐校招与实习岗位。",
    updatedAt: "精选模板",
    skills: ["结果表达", "业务拆解", "指标复盘"],
  },
  {
    id: "template-02",
    name: "AI 应用前端模板",
    title: "AI 前端 / 全栈应用",
    summary:
      "适合展示从用户场景到工程交付的完整闭环，强调 AI 能力如何真正落地。",
    updatedAt: "精选模板",
    skills: ["React", "AI Workflow", "产品闭环", "工程交付"],
  },
];

export const resumeDetails: ResumeDetailRecord[] = [
  {
    id: "resume-01",
    name: "张潇童",
    title: "AI 产品与前端协同",
    contactLine: "zhangxt@example.com | 138-0000-0000 | 杭州",
    summary:
      "关注 AI 产品从交互到交付的完整链路，擅长围绕用户任务重组信息结构，并把抽象的 AI 能力转化为可理解、可操作、可复盘的产品体验。",
    skills: ["React", "TypeScript", "Tailwind", "AI 应用", "产品设计"],
    targetRole: "AI 产品 / 前端协同",
    rawText:
      "负责 AI 面试与简历联动平台的交互重组，梳理上传、JD 对齐、优化反馈与面试训练的产品链路。主导简历工作台信息架构调整，将零散卡片改为任务主舞台，并协同完成前端交付与体验打磨。",
    experiences: [
      {
        company: "HireSpark",
        role: "前端与产品协同",
        period: "2025.11 - 至今",
        highlights: [
          "负责智能面试、简历优化、成长复盘三条链路的页面重组与交互梳理。",
          "以 AI-Meeting 的界面骨架为基础，将多工具页面收束为更清晰的产品工作台。",
        ],
      },
      {
        company: "教育 AI 应用项目",
        role: "产品 / 交互设计",
        period: "2024.06 - 2025.10",
        highlights: [
          "主导从登录、内容工作台到训练报告的多阶段用户路径设计。",
          "持续迭代页面层级与文案表达，降低信息堆叠感，提升任务完成效率。",
        ],
      },
    ],
    projects: [
      {
        name: "AI 面试与简历联动平台",
        role: "交互设计 / 前端实现",
        period: "2026.01 - 2026.06",
        highlights: [
          "设计简历上传、JD 输入、AI 优化、模拟面试、报告复盘的跨模块协同体验。",
          "以用户任务优先为原则，将旧的多卡片拼接界面改造为内容主舞台。",
        ],
      },
    ],
    education: [
      {
        school: "某某大学",
        degree: "设计学 / 计算机交叉方向",
        period: "2020 - 2024",
      },
    ],
  },
  {
    id: "resume-02",
    name: "张潇童",
    title: "智能面试产品版",
    contactLine: "zhangxt@example.com | 138-0000-0000 | 杭州",
    summary:
      "聚焦智能面试、语音交互与报告复盘路径，擅长把训练场景拆解成可执行流程与反馈系统。",
    skills: ["LLM", "语音交互", "Node.js", "产品设计"],
    targetRole: "智能面试产品",
    rawText:
      "负责智能面试训练产品的流程设计与页面落地，围绕语音输入、题目推进、结果反馈和复盘报告持续迭代。擅长将模型输出整理成清晰、可复盘的用户反馈结构。",
    experiences: [
      {
        company: "HireSpark",
        role: "智能面试产品协同",
        period: "2025.11 - 至今",
        highlights: [
          "参与语音交互、追问逻辑与面试报告体验的设计重组。",
          "围绕面试流程搭建更清晰的任务引导与反馈层级。",
        ],
      },
    ],
    projects: [
      {
        name: "AI 模拟面试训练平台",
        role: "产品设计 / 交互实现",
        period: "2025.12 - 2026.06",
        highlights: [
          "设计题目推进、答题反馈、追问补充与结束复盘的完整交互路径。",
          "让语音输入、AI 点评与报告生成在同一条训练链路中闭环。",
        ],
      },
    ],
    education: [
      {
        school: "某某大学",
        degree: "设计学 / 计算机交叉方向",
        period: "2020 - 2024",
      },
    ],
  },
];

export const defaultResumeId = resumeDetails[0]?.id ?? "";

export const optimizeWorkspaceDraft = {
  resumeText:
    "AI 产品与前端协同方向候选人，负责 AI 面试与简历联动平台的交互重组与页面交付。主导梳理简历上传、JD 对齐、优化反馈与训练复盘的完整链路，将原有拼接式界面改造为更清晰的工作台结构。擅长把抽象的 AI 能力转化为可理解、可操作、可复盘的真实体验。",
  jdLink: "https://jobs.example.com/ai-product-frontend",
  jdText:
    "目标岗位需要候选人理解 AI 产品闭环，能够独立完成 React / TypeScript 前端交付，并把 LLM 能力转化为清晰的用户流程、可解释的反馈结构与稳定的页面体验。需要具备跨产品、设计、研发协同能力，能够围绕业务目标优化用户路径与信息表达。",
  focusTags: ["结果表达", "AI 产品闭环", "JD 关键词对齐"],
  quickChecklist: ["上传原始简历", "补充目标 JD", "确认优化方向"],
};

export const optimizationOverview = {
  score: 84,
  matchSummary:
    "当前版本已经覆盖岗位所需的前端交付与 AI 产品协同能力，但结果表达和 JD 关键词映射仍有继续压缩与强化空间。",
  history: [
    { label: "初始解析", score: 71 },
    { label: "第一轮改写", score: 78 },
    { label: "当前版本", score: 84 },
  ],
};

export const optimizationInsightGroups = [
  {
    title: "优势亮点",
    items: [
      "产品链路视角完整，能把上传、优化、面试训练串成一个统一体验。",
      "具备 React / TypeScript 交付能力，不只停留在方案层面。",
      "页面重组和信息表达意识明确，符合岗位对体验落地的要求。",
    ],
  },
  {
    title: "岗位缺口",
    items: [
      "部分经历仍偏职责描述，缺少改版后的结果指标或效率收益。",
      "AI 能力的拆解过程提到较少，Prompt、反馈机制、报告输出尚未集中表达。",
      "JD 中强调的跨团队推进能力可以进一步前置。",
    ],
  },
  {
    title: "改写建议",
    items: [
      "把“负责页面重组”改写为“重构简历工作台信息架构，缩短用户从上传到优化的操作路径”。",
      "为 AI 相关经历补充“如何设计反馈闭环”和“输出了什么结果”两类句式。",
      "在开头摘要中直接点出目标岗位、核心能力与最强项目样本。",
    ],
  },
];

export const optimizedResumePreview = [
  "主导 AI 面试与简历联动平台工作台重构，串联上传、JD 对齐、优化反馈与训练复盘链路。",
  "围绕目标岗位重写简历表达，强化 AI 产品闭环、前端交付与跨团队协同能力。",
  "通过优化信息架构与内容层级，提升关键能力曝光效率，缩短招聘方识别时间。",
];

export const uploadGuidance = [
  "支持上传 PDF、DOCX、Markdown 和纯文本简历，并接入真实解析链路。",
  "如果已有正文，也可以在下一步直接粘贴到优化工作台继续编辑。",
  "建议优先选择最接近目标岗位的一版简历继续优化。",
];
