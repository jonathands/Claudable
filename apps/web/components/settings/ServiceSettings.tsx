/**
 * Service Settings Component
 * Manage service integrations
 */
import React, { useState, useEffect } from 'react';
import GitHubRepoModal from '@/components/GitHubRepoModal';
import VercelProjectModal from '@/components/VercelProjectModal';
import SupabaseModal from '@/components/SupabaseModal';
import { AlertTriangle } from 'lucide-react';
import { ServiceLogo } from '@/components/icons/ServiceLogos';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';

interface ServiceConnection {
  id: string;
  provider: string;
  status: string;
  service_data: any;
  created_at: string;
  updated_at?: string;
  last_sync_at?: string;
}

interface Service {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  status: string;
  description: string;
  connection?: ServiceConnection;
}

interface ServiceSettingsProps {
  projectId: string;
  onOpenGlobalSettings?: () => void;
}

export function ServiceSettings({ projectId, onOpenGlobalSettings }: ServiceSettingsProps) {
  const [tokenStatus, setTokenStatus] = useState<{
    github: boolean | null;
    supabase: boolean | null;
    vercel: boolean | null;
  }>({
    github: null,
    supabase: null,
    vercel: null
  });
  const [services, setServices] = useState<Service[]>([
    {
      id: 'github',
      name: 'GitHub',
      icon: 'github',
      connected: false,
      status: 'disconnected',
      description: 'Connect to GitHub for version control and collaboration'
    },
    {
      id: 'vercel',
      name: 'Vercel',
      icon: 'vercel',
      connected: false,
      status: 'disconnected',
      description: 'Deploy your project to Vercel for production hosting'
    },
    {
      id: 'supabase',
      name: 'Supabase',
      icon: 'supabase',
      connected: false,
      status: 'disconnected',
      description: 'Connect to Supabase for backend services and database'
    }
  ]);
  
  const [gitHubModalOpen, setGitHubModalOpen] = useState(false);
  const [vercelModalOpen, setVercelModalOpen] = useState(false);
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getProviderIcon = (provider: string) => {
    if (provider === 'github' || provider === 'supabase' || provider === 'vercel') {
      return <ServiceLogo service={provider as 'github' | 'supabase' | 'vercel'} width={16} height={16} />;
    }
    return null;
  };

  // Load service connections from API
  const loadServiceConnections = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/projects/${projectId}/services`);
      if (!response.ok) return;
      
      const connections: ServiceConnection[] = await response.json();
      
      // Update services with connection status
      setServices(prev => prev.map(service => {
        const connection = connections.find(conn => conn.provider === service.id);
        return {
          ...service,
          connected: !!connection,
          status: connection?.status || 'disconnected',
          connection
        };
      }));
    } catch (error) {
      console.error('Failed to load service connections:', error);
    }
  };

  // Check if tokens exist for all services
  const checkTokens = async () => {
    try {
      const [githubRes, supabaseRes, vercelRes] = await Promise.all([
        fetch(`${API_BASE}/api/tokens/github`),
        fetch(`${API_BASE}/api/tokens/supabase`),
        fetch(`${API_BASE}/api/tokens/vercel`)
      ]);
      
      setTokenStatus({
        github: githubRes.ok,
        supabase: supabaseRes.ok,
        vercel: vercelRes.ok
      });
    } catch (error) {
      console.error('Failed to check tokens:', error);
      setTokenStatus({
        github: false,
        supabase: false,
        vercel: false
      });
    }
  };

  // Load connections and check tokens on mount
  useEffect(() => {
    loadServiceConnections();
    checkTokens();
  }, [projectId]);

  const handleConnect = async (serviceId: string) => {
    if (serviceId === 'github') {
      setGitHubModalOpen(true);
      return;
    }
    
    if (serviceId === 'vercel') {
      setVercelModalOpen(true);
      return;
    }
    
    if (serviceId === 'supabase') {
      setSupabaseModalOpen(true);
      return;
    }
    
    // For other services, show placeholder
    alert(`${serviceId} integration not implemented yet.`);
  };

  const handleGitHubModalSuccess = () => {
    loadServiceConnections(); // Reload connections after GitHub connection
    // Notify other components that services have been updated
    window.dispatchEvent(new CustomEvent('services-updated'));
  };

  const handleVercelModalSuccess = () => {
    loadServiceConnections(); // Reload connections after Vercel connection
    // Notify other components that services have been updated
    window.dispatchEvent(new CustomEvent('services-updated'));
  };

  const handleSupabaseModalSuccess = () => {
    loadServiceConnections(); // Reload connections after Supabase connection
    // Notify other components that services have been updated
    window.dispatchEvent(new CustomEvent('services-updated'));
  };

  const handleDisconnect = async (serviceId: string) => {
    if (!confirm(`Disconnect from ${serviceId}?`)) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/projects/${projectId}/services/${serviceId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        loadServiceConnections(); // Reload connections
      } else {
        alert(`Failed to disconnect from ${serviceId}`);
      }
    } catch (error) {
      console.error(`Error disconnecting from ${serviceId}:`, error);
      alert(`Failed to disconnect from ${serviceId}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
          Service Integrations
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Connect GitHub, Supabase and Vercel with a consistent, polished experience.</p>

        <div className="space-y-4">
          {services.map(service => (
            <div
              key={service.id}
              className="relative group overflow-hidden rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-gray-900/60 backdrop-blur supports-[backdrop-filter]:bg-white/60 transition-all duration-200 hover:shadow-lg"
            >
              <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-white/10 to-transparent" />
              <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl ring-1 ring-inset ring-gray-200 dark:ring-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 flex items-center justify-center">
                    {getProviderIcon(service.icon)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-1 min-w-0">
                      <h4 className="text-[15px] font-semibold tracking-tight text-gray-900 dark:text-white">
                        {service.name}
                      </h4>
                      {service.connected && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Connected
                        </span>
                      )}
                      {!service.connected && tokenStatus[service.id as keyof typeof tokenStatus] === false && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 whitespace-nowrap">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Token needed
                        </span>
                      )}
                    </div>

                    <div className="text-sm leading-6 text-gray-600 dark:text-gray-400 min-w-0">
                      {!service.connected ? (
                        <p className="truncate whitespace-nowrap sm:whitespace-normal sm:overflow-visible sm:max-w-[60ch]">
                          {service.description}
                        </p>
                      ) : (
                        <div className="text-gray-700 dark:text-gray-300">
                          {service.id === 'github' && service.connection?.service_data?.repo_url ? (
                            <div className="flex items-center gap-2">
                              <span className="shrink-0">Repository:</span>
                              <a 
                                href={service.connection.service_data.repo_url}
                                target="_blank" rel="noopener noreferrer"
                                className="truncate font-mono text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {service.connection.service_data.repo_name || service.connection.service_data.repo_url}
                              </a>
                            </div>
                          ) : service.id === 'vercel' && service.connection?.service_data?.project_url ? (
                            <div className="flex items-center gap-2">
                              <span className="shrink-0">Project:</span>
                              <a 
                                href={service.connection.service_data.project_url}
                                target="_blank" rel="noopener noreferrer"
                                className="truncate font-mono text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {service.connection.service_data.project_name || service.connection.service_data.project_url}
                              </a>
                            </div>
                          ) : service.id === 'supabase' && service.connection?.service_data?.project_url ? (
                            <div className="flex items-center gap-2">
                              <span className="shrink-0">Project:</span>
                              <a 
                                href={service.connection.service_data.project_url}
                                target="_blank" rel="noopener noreferrer"
                                className="truncate font-mono text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {service.connection.service_data.project_name || service.connection.service_data.project_id}
                              </a>
                            </div>
                          ) : (
                            <span>Connected and ready to use</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:flex-shrink-0 w-full sm:w-auto sm:justify-end">
                    {service.connected ? (
                      <button
                        onClick={() => handleDisconnect(service.id)}
                        className="px-4 py-2 text-sm rounded-xl text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-transparent hover:border-red-200 dark:hover:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition whitespace-nowrap w-full sm:w-auto"
                        disabled={isLoading}
                      >
                        Disconnect
                      </button>
                    ) : tokenStatus[service.id as keyof typeof tokenStatus] === false ? (
                      <button
                        onClick={() => { if (onOpenGlobalSettings) onOpenGlobalSettings(); }}
                        className="px-4 py-2.5 text-sm rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition flex items-center justify-center gap-2 whitespace-nowrap w-full sm:w-auto"
                        disabled={isLoading}
                      >
                        <AlertTriangle className="w-4 h-4" />
                        Setup Token
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(service.id)}
                        className="px-4 py-2.5 text-sm rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition disabled:opacity-50 whitespace-nowrap w-full sm:w-auto"
                        disabled={isLoading || tokenStatus[service.id as keyof typeof tokenStatus] === null}
                      >
                        {tokenStatus[service.id as keyof typeof tokenStatus] === null ? 'Checking...' : 'Connect'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GitHub Repository Modal */}
      {gitHubModalOpen && (
        <GitHubRepoModal
          isOpen={gitHubModalOpen}
          onClose={() => setGitHubModalOpen(false)}
          projectId={projectId}
          projectName={projectId} // Use projectId as fallback project name
          onSuccess={handleGitHubModalSuccess}
        />
      )}

      {/* Vercel Project Modal */}
      {vercelModalOpen && (
        <VercelProjectModal
          isOpen={vercelModalOpen}
          onClose={() => setVercelModalOpen(false)}
          projectId={projectId}
          projectName={projectId} // Use projectId as fallback project name
          onSuccess={handleVercelModalSuccess}
        />
      )}

      {/* Supabase Project Modal */}
      {supabaseModalOpen && (
        <SupabaseModal
          isOpen={supabaseModalOpen}
          onClose={() => setSupabaseModalOpen(false)}
          projectId={projectId}
          projectName={projectId} // Use projectId as fallback project name
          onSuccess={handleSupabaseModalSuccess}
        />
      )}
    </div>
  );
}
