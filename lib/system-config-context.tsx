'use client'

import { createContext, useContext } from 'react'
import type { SystemConfig } from '@/lib/db/system-config'

const SystemConfigContext = createContext<SystemConfig | null>(null)

interface SystemConfigProviderProps {
  config: SystemConfig | null
  children: React.ReactNode
}

export function SystemConfigProvider({ config, children }: SystemConfigProviderProps) {
  return (
    <SystemConfigContext.Provider value={config}>
      {children}
    </SystemConfigContext.Provider>
  )
}

export function useSystemConfig() {
  const context = useContext(SystemConfigContext)
  if (!context) {
    throw new Error('useSystemConfig must be used within a SystemConfigProvider')
  }
  return context
}

export function useOptionalSystemConfig() {
  return useContext(SystemConfigContext)
}



