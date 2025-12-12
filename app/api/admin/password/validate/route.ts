/**
 * Password Validation API
 * Endpoint for validating password complexity
 */

import { NextRequest, NextResponse } from 'next/server'
import { PasswordPolicy } from '@/lib/password-policy'

/**
 * POST /api/admin/password/validate
 * Validate password against complexity requirements
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    const result = PasswordPolicy.validate(password)

    return NextResponse.json({
      valid: result.valid,
      errors: result.errors
    })
  } catch (error: any) {
    console.error('Error validating password:', error)

    return NextResponse.json(
      { error: 'Failed to validate password' },
      { status: 500 }
    )
  }
}

