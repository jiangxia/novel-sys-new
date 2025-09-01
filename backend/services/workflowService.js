/**
 * 工作流服务 - 管理多角色协作的创作工作流
 * 实现智能角色切换、上下文传递、进度管理
 */

const fs = require('fs').promises;
const path = require('path');
const roleService = require('./roleService');
const promptParser = require('./promptParser');

class WorkflowService {
  constructor() {
    // 工作流存储路径
    this.workflowsPath = path.join(__dirname, '../data/workflows');
    this.activeWorkflows = new Map();
    
    // 创作阶段定义
    this.creationPhases = {
      'analysis': {
        role: 'director',
        name: '需求分析',
        description: '理解创作需求，制定创作计划',
        nextPhases: ['worldbuilding', 'planning'] // 根据内容决定
      },
      'worldbuilding': {
        role: 'architect', 
        name: '世界观构建',
        description: '设计故事世界的背景设定',
        nextPhases: ['planning']
      },
      'planning': {
        role: 'planner',
        name: '故事规划', 
        description: '制定故事大纲和结构',
        nextPhases: ['writing']
      },
      'writing': {
        role: 'writer',
        name: '内容创作',
        description: '根据大纲进行具体写作',
        nextPhases: ['review']
      },
      'review': {
        role: 'director',
        name: '质量审查',
        description: '检查作品质量，提出改进建议',
        nextPhases: ['worldbuilding', 'planning', 'writing', 'completed']
      }
    };
    
    // 角色协作规则
    this.collaborationRules = {
      'director': {
        canCall: ['architect', 'planner', 'writer'],
        responsibility: '项目统筹、质量控制、方向指导',
        decisionWeight: 1.0
      },
      'architect': {
        canCall: ['planner'], 
        responsibility: '世界观设定、背景设计、规则制定',
        decisionWeight: 0.8
      },
      'planner': {
        canCall: ['writer'],
        responsibility: '故事结构、情节安排、节奏控制', 
        decisionWeight: 0.7
      },
      'writer': {
        canCall: ['director'],
        responsibility: '文字创作、语言表达、细节描写',
        decisionWeight: 0.6
      }
    };

    this.initializeStorage();
  }

  /**
   * 初始化存储目录
   */
  async initializeStorage() {
    try {
      await fs.access(this.workflowsPath);
    } catch {
      await fs.mkdir(this.workflowsPath, { recursive: true });
      console.log('工作流存储目录已创建:', this.workflowsPath);
    }
  }

  /**
   * 启动新的协作工作流
   * @param {string} userId - 用户ID
   * @param {string} projectName - 项目名称
   * @param {string} initialPrompt - 初始需求描述
   * @returns {Promise<Object>} 工作流实例和首次响应
   */
  async startCollaborativeWorkflow(userId, projectName, initialPrompt) {
    const workflowId = this.generateWorkflowId(userId, projectName);
    
    // 创建工作流实例
    const workflow = {
      id: workflowId,
      userId: userId,
      projectName: projectName,
      status: 'active',
      currentPhase: 'analysis',
      currentRole: 'director',
      context: {
        originalPrompt: initialPrompt,
        worldview: null,
        storyline: null,
        chapters: [],
        revisions: []
      },
      history: [],
      progress: {
        completion: 0,
        currentStep: 1,
        totalSteps: 5,
        quality: 0
      },
      timestamps: {
        created: new Date(),
        updated: new Date(),
        lastActivity: new Date()
      }
    };

    // 保存工作流
    await this.saveWorkflow(workflow);
    this.activeWorkflows.set(workflowId, workflow);

    console.log(`[工作流] 启动新项目 [${workflowId}]: ${projectName}`);

    // 执行第一步：需求分析
    const firstResult = await this.executeCurrentPhase(
      workflowId, 
      initialPrompt,
      { isInitial: true }
    );

    return {
      workflowId: workflowId,
      projectName: projectName,
      currentPhase: workflow.currentPhase,
      currentRole: workflow.currentRole,
      result: firstResult,
      progress: workflow.progress
    };
  }

  /**
   * 执行当前阶段的任务
   * @param {string} workflowId - 工作流ID
   * @param {string} message - 用户输入或上一阶段输出
   * @param {Object} options - 执行选项
   * @returns {Promise<Object>} 执行结果和下一步建议
   */
  async executeCurrentPhase(workflowId, message, options = {}) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) {
      throw new Error(`工作流不存在: ${workflowId}`);
    }

    const startTime = Date.now();
    const currentRole = workflow.currentRole;
    const currentPhase = workflow.currentPhase;
    
    console.log(`[工作流] 执行阶段 [${workflowId}] ${currentPhase} -> ${currentRole}`);

    try {
      // 构建阶段特定的上下文
      const phaseContext = this.buildPhaseContext(workflow, options);
      
      // 构建增强的消息（包含上下文）
      const enhancedMessage = this.buildEnhancedMessage(workflow, message);

      // 调用对应角色执行任务
      const roleResult = await roleService.chat(currentRole, enhancedMessage, {
        scenario: 'creation',
        workflowContext: phaseContext,
        projectId: workflowId,
        temperature: this.getPhaseTemperature(currentPhase),
        maxTokens: this.getPhaseMaxTokens(currentPhase)
      });

      // 记录执行历史
      const workflowStep = {
        stepId: this.generateStepId(),
        phase: currentPhase,
        role: currentRole,
        input: message,
        output: roleResult.aiResponse,
        quality: this.evaluateOutputQuality(roleResult.aiResponse, currentPhase),
        duration: Date.now() - startTime,
        timestamp: new Date(),
        nextActions: []
      };

      workflow.history.push(workflowStep);

      // 更新上下文（将输出存储到对应的上下文字段）
      this.updateWorkflowContext(workflow, currentPhase, roleResult.aiResponse);

      // 分析下一步行动
      const nextAction = await this.analyzeNextAction(workflow, workflowStep);
      workflowStep.nextActions = [nextAction];

      // 更新工作流状态
      this.updateWorkflowProgress(workflow, workflowStep);
      
      // 保存工作流
      await this.saveWorkflow(workflow);

      console.log(`[工作流] 阶段完成 [${workflowId}] 质量评分: ${workflowStep.quality}`);

      return {
        success: true,
        step: workflowStep,
        nextAction: nextAction,
        workflowStatus: {
          currentPhase: workflow.currentPhase,
          currentRole: workflow.currentRole,
          progress: workflow.progress,
          canProceed: nextAction.canProceed
        },
        suggestions: this.generatePhaseSuggestions(workflow, workflowStep)
      };

    } catch (error) {
      console.error(`[工作流] 执行失败 [${workflowId}]:`, error);
      
      workflow.status = 'failed';
      await this.saveWorkflow(workflow);
      
      throw new Error(`工作流执行失败: ${error.message}`);
    }
  }

  /**
   * 构建阶段特定的上下文
   */
  buildPhaseContext(workflow, options = {}) {
    const context = {
      projectName: workflow.projectName,
      currentPhase: workflow.currentPhase,
      totalSteps: workflow.history.length,
      previousOutputs: {},
      isInitial: options.isInitial || false
    };

    // 收集前面阶段的输出
    workflow.history.forEach(step => {
      if (!context.previousOutputs[step.phase]) {
        context.previousOutputs[step.phase] = [];
      }
      context.previousOutputs[step.phase].push({
        role: step.role,
        output: step.output,
        quality: step.quality
      });
    });

    // 添加结构化上下文
    if (workflow.context.worldview) {
      context.worldview = workflow.context.worldview;
    }
    if (workflow.context.storyline) {
      context.storyline = workflow.context.storyline;
    }

    return context;
  }

  /**
   * 构建增强消息（包含上下文信息）
   */
  buildEnhancedMessage(workflow, message) {
    let enhancedMessage = message;
    
    // 添加项目上下文
    enhancedMessage += `\n\n【项目信息】\n`;
    enhancedMessage += `项目名称: ${workflow.projectName}\n`;
    enhancedMessage += `当前阶段: ${this.creationPhases[workflow.currentPhase].name}\n`;
    enhancedMessage += `原始需求: ${workflow.context.originalPrompt}\n`;

    // 添加前序工作成果
    if (workflow.history.length > 0) {
      enhancedMessage += `\n【前序工作成果】\n`;
      workflow.history.slice(-2).forEach(step => { // 只包含最近2个步骤
        enhancedMessage += `${step.role}(${step.phase}): ${step.output.substring(0, 200)}...\n`;
      });
    }

    // 添加当前阶段的具体要求
    const phaseInfo = this.creationPhases[workflow.currentPhase];
    enhancedMessage += `\n【当前阶段要求】\n`;
    enhancedMessage += `阶段目标: ${phaseInfo.description}\n`;
    enhancedMessage += `预期交付: 请提供${phaseInfo.name}的具体内容\n`;

    return enhancedMessage;
  }

  /**
   * 更新工作流上下文
   */
  updateWorkflowContext(workflow, phase, output) {
    switch (phase) {
      case 'worldbuilding':
        workflow.context.worldview = {
          content: output,
          timestamp: new Date(),
          quality: this.evaluateOutputQuality(output, phase)
        };
        break;
      case 'planning':
        workflow.context.storyline = {
          content: output,
          timestamp: new Date(),
          quality: this.evaluateOutputQuality(output, phase)
        };
        break;
      case 'writing':
        workflow.context.chapters.push({
          content: output,
          timestamp: new Date(),
          quality: this.evaluateOutputQuality(output, phase),
          wordCount: output.length
        });
        break;
    }
    
    workflow.timestamps.updated = new Date();
    workflow.timestamps.lastActivity = new Date();
  }

  /**
   * 分析下一步行动
   */
  async analyzeNextAction(workflow, currentStep) {
    const currentPhase = workflow.currentPhase;
    const quality = currentStep.quality;
    const phaseInfo = this.creationPhases[currentPhase];

    // 质量阈值检查
    const QUALITY_THRESHOLD = 70;
    
    if (quality < QUALITY_THRESHOLD) {
      return {
        action: 'retry',
        targetPhase: currentPhase,
        targetRole: workflow.currentRole,
        reason: `当前输出质量不达标(${quality}%)，建议重新执行`,
        canProceed: false,
        suggestions: [
          '请提供更详细的需求描述',
          '可以参考其他优秀作品的结构',
          '考虑增加更多创意元素'
        ]
      };
    }

    // 根据阶段决定下一步
    if (currentPhase === 'analysis') {
      // 需求分析完成，判断需要哪个后续步骤
      const needsWorldbuilding = this.analyzeNeedsWorldbuilding(currentStep.output);
      const nextPhase = needsWorldbuilding ? 'worldbuilding' : 'planning';
      
      workflow.currentPhase = nextPhase;
      workflow.currentRole = this.creationPhases[nextPhase].role;
      
      return {
        action: 'proceed',
        targetPhase: nextPhase,
        targetRole: workflow.currentRole,
        reason: needsWorldbuilding ? '需要先构建世界观设定' : '可以直接开始故事规划',
        canProceed: true,
        autoGenerate: true // 自动生成下一阶段的输入
      };
    }

    // 其他阶段按顺序进行
    const nextPhases = phaseInfo.nextPhases;
    if (nextPhases.length === 1) {
      const nextPhase = nextPhases[0];
      
      if (nextPhase === 'completed') {
        workflow.status = 'completed';
        workflow.progress.completion = 100;
        
        return {
          action: 'complete',
          targetPhase: 'completed',
          targetRole: null,
          reason: '项目创作完成',
          canProceed: false
        };
      }

      workflow.currentPhase = nextPhase;
      workflow.currentRole = this.creationPhases[nextPhase].role;
      
      return {
        action: 'proceed',
        targetPhase: nextPhase,
        targetRole: workflow.currentRole,
        reason: `${phaseInfo.name}完成，进入${this.creationPhases[nextPhase].name}阶段`,
        canProceed: true,
        autoGenerate: true
      };
    }

    // 多个选择的情况（主要是review阶段）
    return {
      action: 'choose',
      targetPhase: null,
      targetRole: null,
      reason: '请选择下一步操作',
      canProceed: true,
      choices: nextPhases.map(phase => ({
        phase: phase,
        role: this.creationPhases[phase]?.role || null,
        name: this.creationPhases[phase]?.name || '完成',
        description: this.creationPhases[phase]?.description || '项目完成'
      }))
    };
  }

  /**
   * 更新工作流进度
   */
  updateWorkflowProgress(workflow, step) {
    const phaseWeights = {
      'analysis': 10,
      'worldbuilding': 25,
      'planning': 30,
      'writing': 30,
      'review': 5
    };

    const currentPhaseWeight = phaseWeights[step.phase] || 0;
    const qualityBonus = step.quality > 80 ? 5 : 0;
    
    workflow.progress.completion = Math.min(
      workflow.progress.completion + currentPhaseWeight + qualityBonus,
      100
    );
    
    workflow.progress.currentStep = workflow.history.length;
    workflow.progress.quality = this.calculateAverageQuality(workflow);
  }

  /**
   * 计算平均质量分数
   */
  calculateAverageQuality(workflow) {
    if (workflow.history.length === 0) return 0;
    
    const totalQuality = workflow.history.reduce((sum, step) => sum + step.quality, 0);
    return Math.round(totalQuality / workflow.history.length);
  }

  /**
   * 分析是否需要世界观构建
   */
  analyzeNeedsWorldbuilding(analysisOutput) {
    const worldbuildingKeywords = [
      '科幻', '奇幻', '魔法', '异世界', '未来', '古代', '历史',
      '世界观', '设定', '背景', '架空', '虚构世界'
    ];
    
    return worldbuildingKeywords.some(keyword => 
      analysisOutput.includes(keyword)
    );
  }

  /**
   * 评估输出质量
   */
  evaluateOutputQuality(output, phase) {
    let quality = 50; // 基础分
    
    // 长度评分
    const wordCount = output.length;
    if (wordCount > 500) quality += 20;
    else if (wordCount > 200) quality += 10;
    
    // 结构评分
    const paragraphs = output.split('\n').filter(p => p.trim().length > 0).length;
    if (paragraphs >= 3) quality += 15;
    
    // 阶段特定评分
    switch (phase) {
      case 'analysis':
        if (output.includes('目标') || output.includes('需求')) quality += 10;
        break;
      case 'worldbuilding':
        if (output.includes('世界') || output.includes('设定')) quality += 10;
        break;
      case 'planning':
        if (output.includes('大纲') || output.includes('结构')) quality += 10;
        break;
      case 'writing':
        if (output.includes('章节') || output.includes('内容')) quality += 10;
        break;
    }
    
    return Math.min(quality, 100);
  }

  /**
   * 获取阶段温度参数
   */
  getPhaseTemperature(phase) {
    const temperatures = {
      'analysis': 0.3,     // 分析需要理性
      'worldbuilding': 0.8, // 世界观需要创意
      'planning': 0.6,     // 规划需要平衡
      'writing': 0.9,      // 写作需要创造力
      'review': 0.4        // 审查需要客观
    };
    
    return temperatures[phase] || 0.7;
  }

  /**
   * 获取阶段最大Token数
   */
  getPhaseMaxTokens(phase) {
    const maxTokens = {
      'analysis': 1024,
      'worldbuilding': 2048,
      'planning': 2048,
      'writing': 3072,
      'review': 1024
    };
    
    return maxTokens[phase] || 2048;
  }

  /**
   * 生成阶段建议
   */
  generatePhaseSuggestions(workflow, step) {
    const suggestions = [];
    const phase = step.phase;
    const quality = step.quality;

    if (quality < 80) {
      suggestions.push(`当前${this.creationPhases[phase].name}质量为${quality}%，可以考虑优化`);
    }

    // 阶段特定建议
    switch (phase) {
      case 'analysis':
        suggestions.push('可以补充更详细的创作目标和读者定位');
        break;
      case 'worldbuilding':
        suggestions.push('考虑添加更多独特的世界观元素');
        break;
      case 'planning':
        suggestions.push('确保故事结构完整，有清晰的起承转合');
        break;
      case 'writing':
        suggestions.push('注意保持文风一致性和人物性格连贯性');
        break;
    }

    return suggestions;
  }

  /**
   * 保存工作流到文件
   */
  async saveWorkflow(workflow) {
    const filePath = path.join(this.workflowsPath, `${workflow.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(workflow, null, 2));
  }

  /**
   * 从文件加载工作流
   */
  async loadWorkflow(workflowId) {
    const filePath = path.join(this.workflowsPath, `${workflowId}.json`);
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      const workflow = JSON.parse(data);
      this.activeWorkflows.set(workflowId, workflow);
      return workflow;
    } catch (error) {
      throw new Error(`工作流加载失败: ${workflowId}`);
    }
  }

  /**
   * 获取工作流信息
   */
  async getWorkflowInfo(workflowId) {
    let workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) {
      workflow = await this.loadWorkflow(workflowId);
    }
    
    return {
      id: workflow.id,
      projectName: workflow.projectName,
      status: workflow.status,
      currentPhase: workflow.currentPhase,
      currentRole: workflow.currentRole,
      progress: workflow.progress,
      timestamps: workflow.timestamps,
      stepsCount: workflow.history.length,
      lastOutput: workflow.history[workflow.history.length - 1]?.output?.substring(0, 200) || ''
    };
  }

  /**
   * 生成工作流ID
   */
  generateWorkflowId(userId, projectName) {
    const timestamp = Date.now();
    const cleanName = projectName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '').substring(0, 20);
    return `${userId}_${cleanName}_${timestamp}`;
  }

  /**
   * 生成步骤ID
   */
  generateStepId() {
    return `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取用户的所有工作流
   */
  async getUserWorkflows(userId) {
    const files = await fs.readdir(this.workflowsPath);
    const userWorkflows = [];

    for (const file of files) {
      if (file.startsWith(userId) && file.endsWith('.json')) {
        try {
          const workflowId = file.replace('.json', '');
          const info = await this.getWorkflowInfo(workflowId);
          userWorkflows.push(info);
        } catch (error) {
          console.warn(`无法加载工作流: ${file}`, error.message);
        }
      }
    }

    return userWorkflows.sort((a, b) => 
      new Date(b.timestamps.updated) - new Date(a.timestamps.updated)
    );
  }
}

module.exports = new WorkflowService();