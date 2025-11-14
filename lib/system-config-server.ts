import { cache } from 'react'
import {
  getSystemConfig as getSystemConfigFromDb,
  type SystemConfig,
} from '@/lib/db/system-config'

export const getSystemConfigCached = cache((): SystemConfig => {
  const config = getSystemConfigFromDb()
  if (!config) {
    return {
      modId: 1,
      titles: 0,
      insurance: 0,
      shipping: 0,
      discount: 0,
      related: 0,
      featuredcart: 0,
      featwording: '',
      productshipping: 0,
      callLongWait: 0,
      chatActive: 0,
      phoneNumActive: 0,
      txtChatEnabled: 0,
      updated_at: Date.now(),
    }
  }

  return config
})



