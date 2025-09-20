"use client";
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ServiceConnectionModal from '@/components/ServiceConnectionModal';
import EnvironmentVariablesTab from '@/components/EnvironmentVariablesTab';
import GlobalSettings from '@/components/GlobalSettings';
import { X, AlertTriangle, Check, CheckCircle, Server } from 'lucide-react';
import { ServiceLogo } from '@/components/icons/ServiceLogos';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';

interface CLIOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  models: { id: string; name: string; description: string; }[];
  color: string;
  features: string[];
  checkCommand: string;
  downloadUrl: string;
  installCommand: string;
}

const CLI_OPTIONS: CLIOption[] = [
  {
    id: 'claude',
    name: 'Claude Code',
    icon: '🤖',
    description: 'Anthropic Claude with advanced reasoning',
    color: 'from-orange-500 to-red-600',
    checkCommand: 'claude --version',
    downloadUrl: 'https://github.com/anthropics/claude-code',
    installCommand: 'npm install -g @anthropic-ai/claude-code',
    models: [
      { id: 'claude-opus-4.1', name: 'Claude Opus 4.1', description: 'Most intelligent model for complex coding tasks' },
      { id: 'claude-sonnet-4', name: 'Claude Sonnet 4', description: 'Superior coding with 1M context window' },
    ],
    features: ['Advanced reasoning', 'Code generation', '1M context window']
  },
  {
    id: 'cursor',
    name: 'Cursor Agent',
    icon: '🎯',
    description: 'AI-powered code editor with frontier models',
    color: 'from-[#DE7356] to-[#c95940]',
    checkCommand: 'cursor-agent --version',
    downloadUrl: 'https://cursor.com',
    installCommand: 'Download from cursor.com',
    models: [
      { id: 'gpt-5', name: 'GPT-5', description: 'Best coding model with expert-level intelligence' },
      { id: 'claude-sonnet-4', name: 'Claude Sonnet 4', description: 'State-of-the-art coding capabilities' },
      { id: 'claude-opus-4.1', name: 'Claude Opus 4.1', description: 'Most powerful model for complex tasks' },
    ],
    features: ['IDE integration', 'Frontier models', 'Real-time coding']
  },
  {
    id: 'qwen',
    name: 'Qwen Code',
    icon: '🐉',
    description: 'Alibaba Qwen with agentic coding',
    color: 'from-red-500 to-pink-600',
    checkCommand: 'qwen --version',
    downloadUrl: 'https://github.com/QwenLM/qwen-code',
    installCommand: 'npm install -g @qwen-code/qwen-code',
    models: [
      { id: 'qwen3-coder-plus', name: 'Qwen3 Coder Plus', description: 'Agentic coding model (ACP)' },
    ],
    features: ['Agentic coding', '1M context window', 'Apache 2.0 license']
  },
  {
    id: 'gemini',
    name: 'Gemini CLI',
    icon: '💎',
    description: 'Google Gemini with thinking capabilities',
    color: 'from-[#DE7356] to-[#e88a6f]',
    checkCommand: 'gemini -v',
    downloadUrl: 'https://github.com/google-gemini/gemini-cli',
    installCommand: 'npm install -g @google/generative-ai-cli',
    models: [
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'State-of-the-art thinking model with adaptive reasoning' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Fast and versatile multimodal model' },
    ],
    features: ['Adaptive thinking', 'Web search', '1M context window']
  },
  {
    id: 'codex',
    name: 'Codex CLI',
    icon: '🔮',
    description: 'OpenAI Codex with GPT-5 integration',
    color: 'from-green-500 to-teal-600',
    checkCommand: 'codex --version',
    downloadUrl: 'https://github.com/openai/codex',
    installCommand: 'npm install -g openai-codex-cli',
    models: [
      { id: 'gpt-5', name: 'GPT-5', description: 'Smartest coding model with built-in thinking' },
      { id: 'gpt-4.1', name: 'GPT-4.1', description: 'Major improvements in coding and long-context' },
      { id: 'o3-mini', name: 'OpenAI o3-mini', description: 'Cost-efficient reasoning model for coding, math, and science' },
    ],
    features: ['Built-in thinking', '1M context tokens', 'Open-source CLI']
  }
];

interface ProjectSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
  initialTab?: 'general' | 'ai-assistant' | 'services' | 'deployment' | 'danger';
}

interface ProjectInfo {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  status: string;
  fallback_enabled?: boolean;
}

interface ProjectCLIInfo {
  current_preference: string;
  current_model?: string;
  fallback_enabled: boolean;
}

interface ServiceConnection {
  id: string;
  provider: string;
  account_id?: string;
  status: string;
  created_at: string;
  last_used_at?: string;
  service_data?: any;
}

interface GlobalSettings {
  default_cli: string;
  fallback_enabled: boolean;
  cli_settings: {
    [key: string]: {
      model: string;
      enabled: boolean;
    };
  };
}

interface CLIStatus {
  [key: string]: {
    installed: boolean;
    checking: boolean;
    version?: string;
  };
}

export default function ProjectSettings({ isOpen, onClose, projectId, projectName, initialTab = 'general' }: ProjectSettingsProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'ai-assistant' | 'services' | 'deployment' | 'danger'>(initialTab);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'github' | 'supabase' | 'vercel' | null>(null);
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
  const [projectCLIInfo, setProjectCLIInfo] = useState<ProjectCLIInfo | null>(null);
  const [serviceConnections, setServiceConnections] = useState<ServiceConnection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  
  // AI Assistant settings
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    default_cli: 'claude',
    fallback_enabled: true,
    cli_settings: {
      claude: { model: 'claude-sonnet-4-20250514', enabled: true },
      cursor: { model: 'cursor-smart', enabled: true },
      qwen: { model: 'qwen3-coder-plus', enabled: true },
      gemini: { model: 'gemini-2.5-pro', enabled: true },
      codex: { model: 'gpt-4-turbo', enabled: true },
    }
  });
  const [cliStatus, setCLIStatus] = useState<CLIStatus>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Performance optimization: cached service connection states
  const supabaseConnection = useMemo(() => 
    serviceConnections.find(conn => conn.provider === 'supabase'), 
    [serviceConnections]
  );
  const vercelConnection = useMemo(() => 
    serviceConnections.find(conn => conn.provider === 'vercel'), 
    [serviceConnections]
  );

  // Load project information and service connections
  useEffect(() => {
    if (isOpen && projectId) {
      const loadData = async () => {
        try {
          await Promise.all([
            loadProjectInfo(),
            loadProjectCLIInfo(),
            loadServiceConnections(),
            loadGlobalSettings()
          ]);
          // Check CLI status separately as it's less critical
          checkCLIStatus();
        } catch (error) {
          console.error('Error loading project data:', error);
        }
      };
      loadData();
    }
  }, [isOpen, projectId]);

  // Update active tab when initialTab changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const loadProjectInfo = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setProjectInfo(data);
      }
    } catch (error) {
      console.error('Failed to load project info:', error);
    }
  };

  const loadProjectCLIInfo = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/chat/${projectId}/cli/available`);
      if (response.ok) {
        const data = await response.json();
        setProjectCLIInfo({
          current_preference: data.current_preference,
          current_model: data.current_model,
          fallback_enabled: data.fallback_enabled
        });
      }
    } catch (error) {
      console.error('Failed to load project CLI info:', error);
    }
  };

  const loadServiceConnections = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/projects/${projectId}/services`);
      if (response.ok) {
        const data = await response.json();
        setServiceConnections(data);
      }
    } catch (error) {
      console.error('Failed to load service connections:', error);
    }
  };

  const loadGlobalSettings = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/settings/global`);
      if (response.ok) {
        const data = await response.json();
        setGlobalSettings(data);
      } else {
        console.error('Failed to load global settings:', response.statusText);
        // Set default values on API failure
        setGlobalSettings({
          default_cli: 'claude',
          fallback_enabled: true,
          cli_settings: {
            claude: { model: 'claude-opus-4.1', enabled: true },
            cursor: { model: 'gpt-5', enabled: false },
            qwen: { model: 'qwen3-coder-480b-a35b', enabled: false },
            gemini: { model: 'gemini-2.5-pro', enabled: false },
            codex: { model: 'gpt-5', enabled: false }
          }
        });
      }
    } catch (error) {
      console.error('Failed to load global settings:', error);
      // Set default values on network error
      setGlobalSettings({
        default_cli: 'claude',
        fallback_enabled: true,
        cli_settings: {
          claude: { model: 'claude-opus-4.1', enabled: true },
          cursor: { model: 'gpt-5', enabled: false },
          qwen: { model: 'qwen3-coder-480b', enabled: false },
          gemini: { model: 'gemini-2.5-pro', enabled: false },
          codex: { model: 'gpt-5', enabled: false }
        }
      });
    }
  };

  const checkCLIStatus = async () => {
    // Set all CLI to checking state
    const checkingStatus: CLIStatus = {};
    CLI_OPTIONS.forEach(cli => {
      checkingStatus[cli.id] = { installed: false, checking: true };
    });
    setCLIStatus(checkingStatus);
    
    try {
      // Backend API call with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${API_BASE}/api/settings/cli-status`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const cliStatuses = await response.json();
        setCLIStatus(cliStatuses);
      } else {
        console.error('Failed to check CLI status:', response.statusText);
        // API failure fallback
        const fallbackStatus: CLIStatus = {} as CLIStatus;
        CLI_OPTIONS.forEach(cli => {
          fallbackStatus[cli.id] = {
            installed: false,
            checking: false
          } as any;
        });
        setCLIStatus(fallbackStatus);
      }
    } catch (error: any) {
      if ((error as any).name === 'AbortError') {
        console.error('CLI status check timed out');
      } else {
        console.error('Error checking CLI status:', error);
      }
      // Network error fallback
      const errorStatus: CLIStatus = {} as CLIStatus;
      CLI_OPTIONS.forEach(cli => {
        errorStatus[cli.id] = {
          installed: false,
          checking: false
        } as any;
      });
      setCLIStatus(errorStatus);
    }
  };

  const saveGlobalSettings = async () => {
    setSaveStatus('saving');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${API_BASE}/api/settings/global`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(globalSettings),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        } else {
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('idle'), 3000);
        }
      } else {
        console.error('Failed to save global settings:', response.statusText);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (error: any) {
      if ((error as any).name === 'AbortError') {
        console.error('Save operation timed out');
      } else {
        console.error('Failed to save global settings:', error);
      }
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const updateCLIModel = (cliId: string, modelId: string) => {
    setGlobalSettings(prev => ({
      ...prev,
      cli_settings: {
        ...prev.cli_settings,
        [cliId]: {
          ...prev.cli_settings[cliId],
          model: modelId
        }
      }
    }));
  };

  const toggleCLIEnabled = (cliId: string) => {
    const cliInstalled = cliStatus[cliId]?.installed;
    if (!cliInstalled) return; // Don't allow enabling if not installed
    
    setGlobalSettings(prev => ({
      ...prev,
      cli_settings: {
        ...prev.cli_settings,
        [cliId]: {
          ...prev.cli_settings[cliId],
          enabled: !prev.cli_settings[cliId]?.enabled
        }
      }
    }));
  };

  const handleServiceClick = (provider: 'github' | 'supabase' | 'vercel') => {
    setSelectedProvider(provider);
    setServiceModalOpen(true);
  };

  const handleServiceModalClose = () => {
    setServiceModalOpen(false);
    setSelectedProvider(null);
    loadServiceConnections(); // Reload connections after modal closes
  };

  const handleGitHubConnect = () => {
    console.log('Connecting to github...');
    alert('Open GitHub modal from Service Settings to connect.');
  };

  const handleGitHubModalSuccess = () => {
    loadServiceConnections();
  };

  const handleSupabaseConnect = async () => {
    const projectName = prompt(`Enter Supabase project name (default: ${projectInfo?.name || projectId}):`) || projectInfo?.name || projectId;
    
    if (!projectName) {
      alert('Project name is required');
      return;
    }

    const confirmed = confirm(`Connect to Supabase project "${projectName}"?`);
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/projects/${projectId}/supabase/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_name: projectName })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Successfully connected to Supabase project: ${result.project_url}`);
        loadServiceConnections();
      } else {
        const error = await response.text();
        alert(`Failed to connect to Supabase: ${error}`);
      }
    } catch (error) {
      console.error('Supabase connection error:', error);
      alert('Failed to connect to Supabase. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVercelConnect = async () => {
    // Use project name as default
    const defaultProjectName = projectInfo?.name || projectId;
    const confirmed = confirm(`Deploy "${defaultProjectName}" to Vercel?`);
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/projects/${projectId}/vercel/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          project_name: defaultProjectName,
          framework: 'nextjs'
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Successfully deployed to Vercel!\nProject URL: ${result.project_url}\nDeployment URL: ${result.deployment_url || result.project_url}`);
        loadServiceConnections();
      } else {
        const errorText = await response.text();
        let errorMessage = 'Failed to deploy to Vercel';
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        alert(`Failed to deploy to Vercel: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Vercel deployment error:', error);
      alert('Failed to deploy to Vercel. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${projectName || projectId}"? This action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/projects/${projectId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        alert('Project deleted successfully');
        window.location.href = '/'; // Redirect to home page
      } else {
        alert('Failed to delete project');
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project');
    } finally {
      setIsLoading(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    if (provider === 'github' || provider === 'supabase' || provider === 'vercel') {
      return <ServiceLogo service={provider as 'github' | 'supabase' | 'vercel'} width={16} height={16} />;
    }
    return null;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            data-testid="project-settings"
          >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#DE7356]/10 dark:bg-[#DE7356]/20 text-[#DE7356] dark:text-[#DE7356] rounded-lg flex items-center justify-center">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{projectName || 'Project Settings'}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {projectName || projectId}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex px-6">
              {[
                { id: 'general' as const, label: 'General', icon: '📋' },
                { id: 'ai-assistant' as const, label: 'AI Assistant', icon: '🤖' },
                { id: 'services' as const, label: 'Services', icon: '🔗' },
                { id: 'deployment' as const, label: 'Environment Variables', icon: '🔧' },
                { id: 'danger' as const, label: 'Danger Zone', icon: '⚠️' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-[#DE7356] text-[#DE7356] dark:text-[#DE7356]'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8 max-h-[70vh] overflow-y-auto">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Project Information</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Project ID</p>
                        <p className="font-mono text-sm text-gray-900 dark:text-white">{projectId}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</p>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-900 dark:text-white">Active</span>
                        </div>
                      </div>
                    </div>
                    
                    {projectInfo && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Created</p>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {new Date(projectInfo.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Updated</p>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {new Date(projectInfo.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Development Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Auto-preview</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Automatically start preview when opening project</p>
                      </div>
                      <input type="checkbox" className="rounded" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Hot reload</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Enable hot reloading for code changes</p>
                      </div>
                      <input type="checkbox" className="rounded" defaultChecked />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai-assistant' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Current AI Assistant (Read-only)</h3>
                  <div className="mb-6">
                    {projectCLIInfo ? (
                      <div className="p-4 rounded-xl border-2 border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 flex items-center justify-center">
                              <span className="text-xl">
                                {CLI_OPTIONS.find(cli => cli.id === projectCLIInfo.current_preference)?.icon || '🤖'}
                              </span>
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {CLI_OPTIONS.find(cli => cli.id === projectCLIInfo.current_preference)?.name || 'Unknown CLI'}
                            </h3>
                            <div className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded-full text-xs text-gray-600 dark:text-gray-300">
                              Active
                            </div>
                          </div>
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3" stroke="white" />
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center justify-between">
                            <span>CLI Agent cannot be changed after project creation</span>
                            <span className="text-green-500 font-medium">Selected</span>
                          </div>
                          {projectCLIInfo.current_model && (
                            <div className="mt-1">
                              Current Model: <span className="font-medium">{projectCLIInfo.current_model}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                        <div className="animate-pulse flex items-center gap-3">
                          <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
                          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {/* Project Fallback Setting */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Enable Fallback for This Project</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Automatically try other AIs when this project's preferred CLI is unavailable
                      </p>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-colors ${
                      projectInfo?.fallback_enabled ? 'bg-gray-900 dark:bg-white' : 'bg-gray-300 dark:bg-gray-600'
                    }`}>
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        projectInfo?.fallback_enabled ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    This setting was configured when the project was created and cannot be changed.
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="text-blue-500 dark:text-blue-400 mt-0.5">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        CLI Configuration is Project-Specific
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Each project uses the CLI Agent selected during creation. To configure multiple CLI Agents or change global settings, use Global Settings from the main page.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'services' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Project Service Connections</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Connect this project to specific GitHub repositories, Supabase projects, and Vercel deployments.
                  </p>
                  
                  <div className="space-y-4">

                    {/* Supabase Connection */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="text-gray-600 dark:text-gray-400">
                            {getProviderIcon('supabase')}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Supabase Project</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {serviceConnections.find(conn => conn.provider === 'supabase') ? (
                                <>Connected: <a 
                                  href={serviceConnections.find(conn => conn.provider === 'supabase')?.service_data?.project_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="font-mono text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 underline cursor-pointer"
                                >
                                  {serviceConnections.find(conn => conn.provider === 'supabase')?.service_data?.project_url || serviceConnections.find(conn => conn.provider === 'supabase')?.service_data?.project_name || 'project'}
                                </a></>
                              ) : (
                                'Connect to a Supabase project'
                              )}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {serviceConnections.find(conn => conn.provider === 'supabase') && (
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                          )}
                          <button
                            onClick={() => handleSupabaseConnect()}
                            className="px-3 py-1.5 text-sm bg-[#DE7356] hover:bg-[#c95940] text-white rounded-md transition-colors"
                            disabled={isLoading}
                          >
                            {serviceConnections.find(conn => conn.provider === 'supabase') ? 'Reconnect' : 'Connect Project'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Vercel Connection */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="text-gray-600 dark:text-gray-400">
                            {getProviderIcon('vercel')}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Vercel Deployment</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {serviceConnections.find(conn => conn.provider === 'vercel') ? (
                                <>Connected: <a 
                                  href={serviceConnections.find(conn => conn.provider === 'vercel')?.service_data?.deployment_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="font-mono text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 underline cursor-pointer"
                                >
                                  {serviceConnections.find(conn => conn.provider === 'vercel')?.service_data?.deployment_url || serviceConnections.find(conn => conn.provider === 'vercel')?.service_data?.project_name || 'project'}
                                </a></>
                              ) : (
                                'Deploy to Vercel'
                              )}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {serviceConnections.find(conn => conn.provider === 'vercel') && (
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                          )}
                          <button
                            onClick={() => handleVercelConnect()}
                            className="px-3 py-1.5 text-sm bg-[#DE7356] hover:bg-[#c95940] text-white rounded-md transition-colors"
                            disabled={isLoading}
                          >
                            {serviceConnections.find(conn => conn.provider === 'vercel') ? 'Redeploy' : 'Deploy Project'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-amber-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                          Prerequisites Required
                        </h3>
                        <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                          <p>
                            Make sure you have configured your API tokens in Global Settings before connecting services to this project.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'deployment' && (
              <EnvironmentVariablesTab projectId={projectId} />
            )}

            {activeTab === 'danger' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-4">Danger Zone</h3>
                  <div className="border border-red-200 dark:border-red-800 rounded-lg p-6 bg-red-50 dark:bg-red-900/10">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-red-900 dark:text-red-200 mb-2">Delete Project</h4>
                        <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                          Once you delete a project, there is no going back. This will permanently delete the project, 
                          its files, and remove all service connections.
                        </p>
                        <button
                          onClick={handleDeleteProject}
                          disabled={isLoading}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-md text-sm font-medium transition-colors"
                        >
                          {isLoading ? 'Deleting...' : 'Delete Project'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          </motion.div>
        </div>
      </div>
      
      {/* Service Connection Modal */}
      {selectedProvider && (
        <ServiceConnectionModal
          isOpen={serviceModalOpen}
          onClose={handleServiceModalClose}
          provider={selectedProvider}
          projectId={projectId}
        />
      )}

    </AnimatePresence>
  );
}
