import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin, logAdminAction } from '@/lib/admin-permissions'
import { fetchKeyVaultMonitor } from '@/lib/services/key-vault'
import { logger } from '@/lib/logger'

/**
 * GET /api/admin/utilities/key-vault
 * Returns Azure Key Vault secret health snapshot for admin dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const check = await verifyAdmin(request)
    if (!check.authorized) {
      return NextResponse.json(
        { error: check.error || 'Unauthorized' },
        { status: check.user ? 403 : 401 }
      )
    }

    const monitor = await fetchKeyVaultMonitor()

    await logAdminAction(
      {
        action: 'admin.utilities.key-vault.monitor',
        resource: 'utilities',
        details: {
          status: monitor.status.raw,
          environment: monitor.environmentLabel,
          secretCount: monitor.secrets.length,
        },
      },
      monitor.status.isOperational ? 'success' : 'failure',
      undefined,
      request
    )

    return NextResponse.json(monitor, { status: 200 })
  } catch (error: any) {
    logger.error('Failed to load Key Vault monitor', { error: error.message })
    await logAdminAction(
      {
        action: 'admin.utilities.key-vault.monitor',
        resource: 'utilities',
      },
      'failure',
      error?.message,
      request
    )

    return NextResponse.json(
      {
        error: 'Failed to load Azure Key Vault status',
        message: error?.message || 'Unexpected error',
      },
      { status: 500 }
    )
  }
}


