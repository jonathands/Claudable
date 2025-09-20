"use client";
import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { MotionDiv } from '@/lib/motion';
import { useTheme } from '@/components/ThemeProvider';
import ServiceConnectionModal from '@/components/ServiceConnectionModal';
import { Settings, X, Moon, Sun, Check, Copy, Info, Zap, Lightbulb } from 'lucide-react';
import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';
import { ServiceLogo } from '@/components/icons/ServiceLogos';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';

interface GlobalSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'general' | 'ai-agents' | 'services' | 'about';
}

interface CLIOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  models: { id: string; name: string; }[];
  color: string;
  brandColor: string;
  downloadUrl: string;
  installCommand: string;
  enabled?: boolean;
}

const CLI_OPTIONS: CLIOption[] = [
  {
    id: 'claude',
    name: 'Claude Code',
    icon: '',
    description: 'Anthropic Claude with advanced reasoning',
    color: 'from-orange-500 to-red-600',
    brandColor: '#DE7356',
    downloadUrl: 'https://docs.anthropic.com/en/docs/claude-code/overview',
    installCommand: 'npm install -g @anthropic-ai/claude-code',
    enabled: true,
    models: [
      { id: 'claude-sonnet-4', name: 'Claude Sonnet 4' },
      { id: 'claude-opus-4.1', name: 'Claude Opus 4.1' },
    ]
  },
  {
    id: 'cursor',
    name: 'Cursor Agent',
    icon: '',
    description: 'AI-powered code editor with frontier models',
    color: 'from-gray-500 to-gray-600',
    brandColor: '#6B7280',
    downloadUrl: 'https://cursor.com/cli',
    installCommand: '# See official guide: https://cursor.com/cli',
    enabled: true,
    models: [
      { id: 'gpt-5', name: 'GPT-5' },
      { id: 'claude-sonnet-4', name: 'Claude Sonnet 4' },
    ]
  },
  {
    id: 'qwen',
    name: 'Qwen Coder',
    icon: '/qwen.png',
    description: 'Alibaba Qwen Coder',
    color: 'from-purple-500 to-pink-500',
    brandColor: '#A855F7',
    downloadUrl: 'https://github.com/QwenLM/qwen-code',
    installCommand: 'npm install -g @qwen-code/qwen-code@latest',
    enabled: true,
    models: [
      { id: 'qwen3-coder-plus', name: 'Qwen3 Coder Plus' }
    ]
  },
  {
    id: 'gemini',
    name: 'Gemini CLI',
    icon: '/gemini.png',
    description: 'Gemini 2.5 CLI',
    color: 'from-blue-400 to-purple-600',
    brandColor: '#4285F4',
    downloadUrl: 'https://github.com/google-gemini/gemini-cli',
    installCommand: 'npm install -g @google/gemini-cli',
    enabled: true,
    models: [
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    ]
  },
  {
    id: 'codex',
    name: 'Codex CLI',
    icon: '/oai.png',
    description: 'OpenAI Codex with GPT-5 integration',
    color: 'from-gray-900 to-black',
    brandColor: '#000000',
    downloadUrl: 'https://developers.openai.com/codex/cli/',
    installCommand: 'npm install -g @openai/codex',
    enabled: true,
    models: [
      { id: 'gpt-5', name: 'GPT-5' }
    ]
  }
];

interface CLIStatus {
  [key: string]: {
    installed: boolean;
    checking: boolean;
    version?: string;
    error?: string;
  };
}

// Global settings are provided by context

interface ServiceToken {
  id: string;
  provider: string;
  token: string;
  name?: string;
  created_at: string;
  last_used?: string;
}

export default function GlobalSettings({ isOpen, onClose, initialTab = 'general' }: GlobalSettingsProps) {
  const { theme, toggle: toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'general' | 'ai-agents' | 'services' | 'about'>(initialTab);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'github' | 'supabase' | 'vercel' | null>(null);
  const [tokens, setTokens] = useState<{ [key: string]: ServiceToken | null }>({
    github: null,
    supabase: null,
    vercel: null
  });
  const [cliStatus, setCLIStatus] = useState<CLIStatus>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const { settings: globalSettings, setSettings: setGlobalSettings, refresh: refreshGlobalSettings } = useGlobalSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [selectedCLI, setSelectedCLI] = useState<CLIOption | null>(null);

  // Show toast function
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Load all service tokens and CLI data
  useEffect(() => {
    if (isOpen) {
      loadAllTokens();
      loadGlobalSettings();
      checkCLIStatus();
    }
  }, [isOpen]);

  const loadAllTokens = async () => {
    const providers = ['github', 'supabase', 'vercel'];
    const newTokens: { [key: string]: ServiceToken | null } = {};
    
    for (const provider of providers) {
      try {
        const response = await fetch(`${API_BASE}/api/tokens/${provider}`);
        if (response.ok) {
          newTokens[provider] = await response.json();
        } else {
          newTokens[provider] = null;
        }
      } catch {
        newTokens[provider] = null;
      }
    }
    
    setTokens(newTokens);
  };

  const handleServiceClick = (provider: 'github' | 'supabase' | 'vercel') => {
    setSelectedProvider(provider);
    setServiceModalOpen(true);
  };

  const handleServiceModalClose = () => {
    setServiceModalOpen(false);
    setSelectedProvider(null);
    loadAllTokens(); // Reload tokens after modal closes
  };

  const loadGlobalSettings = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/settings/global`);
      if (response.ok) {
        const settings = await response.json();
        setGlobalSettings(settings);
      }
    } catch (error) {
      console.error('Failed to load global settings:', error);
    }
  };

  const checkCLIStatus = async () => {
    // Set all CLIs to checking state
    const checkingStatus: CLIStatus = {};
    CLI_OPTIONS.forEach(cli => {
      checkingStatus[cli.id] = { installed: false, checking: true };
    });
    setCLIStatus(checkingStatus);
    
    try {
      const response = await fetch(`${API_BASE}/api/settings/cli-status`);
      if (response.ok) {
        const cliStatuses = await response.json();
        setCLIStatus(cliStatuses);
      } else {
        console.error('Failed to check CLI status:', response.statusText);
        // Set fallback status on API failure
        const fallbackStatus: CLIStatus = {};
        CLI_OPTIONS.forEach(cli => {
          fallbackStatus[cli.id] = {
            installed: false,
            checking: false,
            error: 'Unable to check installation status'
          };
        });
        setCLIStatus(fallbackStatus);
      }
    } catch (error) {
      console.error('Error checking CLI status:', error);
      // Set error status on network error
      const errorStatus: CLIStatus = {};
      CLI_OPTIONS.forEach(cli => {
        errorStatus[cli.id] = {
          installed: false,
          checking: false,
          error: 'Network error'
        };
      });
      setCLIStatus(errorStatus);
    }
  };

  const saveGlobalSettings = async () => {
    setIsLoading(true);
    setSaveMessage(null);
    
    try {
      const response = await fetch(`${API_BASE}/api/settings/global`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(globalSettings)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      
      setSaveMessage({ 
        type: 'success', 
        text: 'Settings saved successfully!' 
      });
      // make sure context stays in sync
      try {
        await refreshGlobalSettings();
      } catch {}
      
      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
      
    } catch (error) {
      console.error('Failed to save global settings:', error);
      setSaveMessage({ 
        type: 'error', 
        text: 'Failed to save settings. Please try again.' 
      });
      
      // Clear error message after 5 seconds
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };


  const setDefaultCLI = (cliId: string) => {
    const cliInstalled = cliStatus[cliId]?.installed;
    if (!cliInstalled) return;
    
    setGlobalSettings(prev => ({
      ...prev,
      default_cli: cliId
    }));
  };

  const setDefaultModel = (cliId: string, modelId: string) => {
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

  const getProviderIcon = (provider: string) => {
    if (provider === 'github' || provider === 'supabase' || provider === 'vercel') {
      return <ServiceLogo service={provider as 'github' | 'supabase' | 'vercel'} width={20} height={20} />;
    }
    return null;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        />
        
        <MotionDiv 
          className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl h-[700px] border border-gray-200 dark:border-gray-700 flex flex-col"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="p-5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-gray-600 dark:text-gray-400">
                  <Settings className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Global Settings</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Configure your Claudable preferences</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex px-5">
              {[
                { id: 'general' as const, label: 'General' },
                { id: 'ai-agents' as const, label: 'AI Agents' },
                { id: 'services' as const, label: 'Services' },
                { id: 'about' as const, label: 'About' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-[#DE7356] text-gray-900 dark:text-white'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Appearance</h3>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Toggle between light and dark theme</p>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className="relative inline-flex h-7 w-14 items-center rounded-full bg-gray-200 dark:bg-gray-600 transition-colors focus:outline-none"
                      role="switch"
                      aria-checked={theme === 'dark'}
                    >
                      <span className="sr-only">Toggle theme</span>
                      <span
                        className={`${
                          theme === 'dark' ? 'translate-x-8' : 'translate-x-1'
                        } inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform flex items-center justify-center`}
                      >
                        {theme === 'dark' ? (
                          <Moon className="w-3 h-3 text-indigo-500" />
                        ) : (
                          <Sun className="w-3 h-3 text-amber-500" />
                        )}
                      </span>
                    </button>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Preferences</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Auto-save projects</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Automatically save changes to projects</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-white dark:bg-gray-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#DE7356]"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Show file extensions</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Display file extensions in code explorer</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-white dark:bg-gray-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#DE7356]"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai-agents' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">CLI Agents</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Manage your AI coding assistants
                      </p>
                    </div>
                    {/* Inline Default CLI Selector */}
                    <div className="flex items-center gap-2 ml-6 pl-6 border-l border-gray-200 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Default:</span>
                      <select
                        value={globalSettings.default_cli}
                        onChange={(e) => setDefaultCLI(e.target.value)}
                        className="pl-3 pr-8 py-1.5 text-xs font-medium border border-gray-200/50 dark:border-white/5 rounded-full bg-transparent hover:bg-gray-50 dark:hover:bg-white/5 hover:border-gray-300/50 dark:hover:border-white/10 text-gray-700 dark:text-white/80 focus:outline-none focus:ring-0 transition-colors cursor-pointer [&>option]:bg-white [&>option]:dark:bg-gray-800 [&>option]:text-gray-900 [&>option]:dark:text-white"
                      >
                        {CLI_OPTIONS.filter(cli => cliStatus[cli.id]?.installed && cli.enabled !== false).map(cli => (
                          <option key={cli.id} value={cli.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                            {cli.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {saveMessage && (
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${
                        saveMessage.type === 'success' 
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                      }`}>
                        {saveMessage.type === 'success' ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                        {saveMessage.text}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={checkCLIStatus}
                        className="px-3 py-1.5 text-xs font-medium border border-gray-200/50 dark:border-white/5 rounded-full bg-transparent hover:bg-gray-50 dark:hover:bg-white/5 hover:border-gray-300/50 dark:hover:border-white/10 text-gray-700 dark:text-white/80 transition-colors"
                      >
                        Refresh Status
                      </button>
                      <button
                        onClick={saveGlobalSettings}
                        disabled={isLoading}
                        className="px-3 py-1.5 text-xs font-medium bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-full transition-colors disabled:opacity-50"
                      >
                        {isLoading ? 'Saving...' : 'Save Settings'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* CLI Agents Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {CLI_OPTIONS.filter(cli => cli.enabled !== false).map((cli) => {
                    const status = cliStatus[cli.id];
                    const settings = globalSettings.cli_settings[cli.id] || {};
                    const isChecking = status?.checking || false;
                    const isInstalled = status?.installed || false;
                    const isDefault = globalSettings.default_cli === cli.id;

                    return (
                      <div 
                        key={cli.id} 
                        onClick={() => isInstalled && setDefaultCLI(cli.id)}
                        className={`border rounded-xl pl-4 pr-8 py-4 transition-all ${
                          !isInstalled 
                            ? 'border-gray-200/50 dark:border-white/5 cursor-not-allowed bg-gray-50/50 dark:bg-white/[0.02]' 
                            : isDefault 
                              ? 'cursor-pointer' 
                              : 'border-gray-200/50 dark:border-white/5 hover:border-gray-300/50 dark:hover:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer'
                        }`}
                        style={isDefault && isInstalled ? {
                          borderColor: cli.brandColor,
                          backgroundColor: `${cli.brandColor}08`
                        } : {}}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`flex-shrink-0 ${!isInstalled ? 'opacity-40' : ''}`}>
                            {cli.id === 'claude' && (
                              <img src="/claude.png" alt="Claude" className="w-8 h-8" />
                            )}
                            {cli.id === 'cursor' && (
                              <img src="/cursor.png" alt="Cursor" className="w-8 h-8" />
                            )}
                            {cli.id === 'codex' && (
                              <img src="/oai.png" alt="Codex" className="w-8 h-8" />
                            )}
                            {cli.id === 'qwen' && (
                              <img src="/qwen.png" alt="Qwen" className="w-8 h-8" />
                            )}
                            {cli.id === 'gemini' && (
                              <img src="/gemini.png" alt="Gemini" className="w-8 h-8" />
                            )}
                          </div>
                          <div className={`flex-1 min-w-0 ${!isInstalled ? 'opacity-40' : ''}`}>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900 dark:text-white text-sm">{cli.name}</h4>
                              {isDefault && isInstalled && (
                                <span className="text-xs font-medium" style={{ color: cli.brandColor }}>
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                              {cli.description}
                            </p>
                          </div>
                        </div>

                        {/* Model Selection or Not Installed */}
                        {isInstalled ? (
                          <div onClick={(e) => e.stopPropagation()}>
                            <select
                              value={settings.model || ''}
                              onChange={(e) => setDefaultModel(cli.id, e.target.value)}
                              className="w-full px-3 py-1.5 border border-gray-200/50 dark:border-white/5 rounded-full bg-transparent hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-white/80 text-xs font-medium transition-colors focus:outline-none focus:ring-0 [&>option]:bg-white [&>option]:dark:bg-gray-800 [&>option]:text-gray-900 [&>option]:dark:text-white"
                            >
                              <option value="" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Select model</option>
                              {cli.models.map(model => (
                                <option key={model.id} value={model.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                                  {model.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                setSelectedCLI(cli);
                                setInstallModalOpen(true);
                              }}
                              className="w-full px-3 py-1.5 border-2 border-gray-900 dark:border-white rounded-full bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 text-xs font-semibold transition-all transform hover:scale-105"
                            >
                              View Guide
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                </div>
              </div>
            )}

            {activeTab === 'services' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Service Tokens</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Configure your API tokens for external services. These tokens are stored encrypted and used across all projects.
                  </p>
                  
                  <div className="space-y-4">
                    {Object.entries(tokens).map(([provider, token]) => (
                      <div key={provider} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <div className="text-gray-700 dark:text-gray-300">
                            {getProviderIcon(provider)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white capitalize">{provider}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {token ? (
                                <>
                                  Token configured • Added {new Date(token.created_at).toLocaleDateString()}
                                </>
                              ) : (
                                'Token not configured'
                              )}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {token && (
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                          )}
                          <button
                            onClick={() => handleServiceClick(provider as 'github' | 'supabase' | 'vercel')}
                            className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg transition-all"
                          >
                            {token ? 'Update Token' : 'Add Token'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Info className="h-5 w-5 text-[#DE7356]" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          Token Configuration
                        </h3>
                        <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                          <p>
                            Tokens configured here will be available for all projects. To connect a project to specific repositories 
                            and services, use the Project Settings in each individual project.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#DE7356]/20 to-[#DE7356]/5 blur-xl rounded-2xl" />
                    <img 
                      src="/Claudable_Icon.png" 
                      alt="Claudable Icon" 
                      className="relative z-10 w-full h-full object-contain rounded-2xl shadow-lg"
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Claudable</h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-2 font-medium">Version 1.0.0</p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                  <div className="text-center">
                    <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto">
                      Claudable is an AI-powered development platform that integrates with GitHub, Supabase, and Vercel 
                      to streamline your web development workflow.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 rounded-xl border border-gray-200/50 dark:border-white/5 bg-transparent">
                      <div className="flex items-center justify-center mb-2">
                        <Zap className="w-5 h-5 text-[#DE7356]" />
                      </div>
                      <p className="text-xs font-medium text-gray-700 dark:text-white/80">Fast Deploy</p>
                    </div>
                    <div className="p-3 rounded-xl border border-gray-200/50 dark:border-white/5 bg-transparent">
                      <div className="flex items-center justify-center mb-2">
                        <Lightbulb className="w-5 h-5 text-[#DE7356]" />
                      </div>
                      <p className="text-xs font-medium text-gray-700 dark:text-white/80">AI Powered</p>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="flex justify-center gap-6">
                    <a 
                      href="https://github.com/opactorai/Claudable" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#DE7356] hover:text-[#c95940] transition-colors"
                    >
                      GitHub
                    </a>
                    <a 
                      href="https://discord.gg/NJNbafHNQC" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#DE7356] hover:text-[#c95940] transition-colors"
                    >
                      Discord
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </MotionDiv>
      </div>
      
      {/* Service Connection Modal */}
      {selectedProvider && (
        <ServiceConnectionModal
          isOpen={serviceModalOpen}
          onClose={handleServiceModalClose}
          provider={selectedProvider}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-[80] px-4 py-3 rounded-lg shadow-2xl transition-all transform animate-slide-in-up ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success' && (
              <Check className="w-5 h-5" />
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Install Guide Modal */}
      {installModalOpen && selectedCLI && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" key={`modal-${selectedCLI.id}`}>
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => {
              setInstallModalOpen(false);
              setSelectedCLI(null);
            }}
          />
          
          <div 
            className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 transform"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedCLI.id === 'claude' && (
                    <img src="/claude.png" alt="Claude" className="w-8 h-8" />
                  )}
                  {selectedCLI.id === 'cursor' && (
                    <img src="/cursor.png" alt="Cursor" className="w-8 h-8" />
                  )}
                  {selectedCLI.id === 'codex' && (
                    <img src="/oai.png" alt="Codex" className="w-8 h-8" />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Install {selectedCLI.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Follow these steps to get started
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setInstallModalOpen(false);
                    setSelectedCLI(null);
                  }}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Step 1: Install */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full text-white text-xs" style={{ backgroundColor: selectedCLI.brandColor }}>
                    1
                  </span>
                  Install CLI
                </div>
                <div className="ml-8 flex items-center gap-2 bg-gray-100 dark:bg-gray-900 rounded-lg px-3 py-2">
                  <code className="text-sm text-gray-800 dark:text-gray-200 flex-1">
                    {selectedCLI.installCommand}
                  </code>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigator.clipboard.writeText(selectedCLI.installCommand);
                      showToast('Command copied to clipboard', 'success');
                    }}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    title="Copy command"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Step 2: Authenticate */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full text-white text-xs" style={{ backgroundColor: selectedCLI.brandColor }}>
                    2
                  </span>
                  {selectedCLI.id === 'gemini' && 'Authenticate (OAuth or API Key)'}
                  {selectedCLI.id === 'qwen' && 'Authenticate (Qwen OAuth or API Key)'}
                  {selectedCLI.id === 'codex' && 'Start Codex and sign in'}
                  {selectedCLI.id === 'claude' && 'Start Claude and sign in'}
                  {selectedCLI.id === 'cursor' && 'Start Cursor CLI and sign in'}
                </div>
                <div className="ml-8 flex items-center gap-2 bg-gray-100 dark:bg-gray-900 rounded-lg px-3 py-2">
                  <code className="text-sm text-gray-800 dark:text-gray-200 flex-1">
                    {selectedCLI.id === 'claude' ? 'claude' :
                     selectedCLI.id === 'cursor' ? 'cursor-agent' :
                     selectedCLI.id === 'codex' ? 'codex' :
                     selectedCLI.id === 'qwen' ? 'qwen' :
                     selectedCLI.id === 'gemini' ? 'gemini' : ''}
                  </code>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const authCmd = selectedCLI.id === 'claude' ? 'claude' :
                                      selectedCLI.id === 'cursor' ? 'cursor-agent' :
                                      selectedCLI.id === 'codex' ? 'codex' :
                                      selectedCLI.id === 'qwen' ? 'qwen' :
                                      selectedCLI.id === 'gemini' ? 'gemini' : '';
                      if (authCmd) navigator.clipboard.writeText(authCmd);
                      showToast('Command copied to clipboard', 'success');
                    }}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    title="Copy command"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Step 3: Test */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full text-white text-xs" style={{ backgroundColor: selectedCLI.brandColor }}>
                    3
                  </span>
                  Test your installation
                </div>
                <div className="ml-8 flex items-center gap-2 bg-gray-100 dark:bg-gray-900 rounded-lg px-3 py-2">
                  <code className="text-sm text-gray-800 dark:text-gray-200 flex-1">
                    {selectedCLI.id === 'claude' ? 'claude --version' :
                     selectedCLI.id === 'cursor' ? 'cursor-agent --version' :
                     selectedCLI.id === 'codex' ? 'codex --version' :
                     selectedCLI.id === 'qwen' ? 'qwen --version' :
                     selectedCLI.id === 'gemini' ? 'gemini --version' : ''}
                  </code>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const versionCmd = selectedCLI.id === 'claude' ? 'claude --version' :
                                        selectedCLI.id === 'cursor' ? 'cursor-agent --version' :
                                        selectedCLI.id === 'codex' ? 'codex --version' :
                                        selectedCLI.id === 'qwen' ? 'qwen --version' :
                                        selectedCLI.id === 'gemini' ? 'gemini --version' : '';
                      if (versionCmd) navigator.clipboard.writeText(versionCmd);
                      showToast('Command copied to clipboard', 'success');
                    }}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    title="Copy command"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Minimal guide only; removed extra info */}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex justify-between">
              <button
                onClick={() => checkCLIStatus()}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Refresh Status
              </button>
              <button
                onClick={() => {
                  setInstallModalOpen(false);
                  setSelectedCLI(null);
                }}
                className="px-4 py-2 text-sm bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
