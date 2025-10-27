/**
 * Create Admin Account via Better Auth API
 * This uses Better Auth's own signup method to ensure compatibility
 */

async function createAdminAccount() {
  console.log('🔧 Creating Admin Account via Better Auth API...\n')

  const email = 'falonya@gmail.com'
  const password = 'Admin123!'
  const name = 'Admin User'

  try {
    // Make a signup request to Better Auth
    const response = await fetch('http://localhost:3000/api/auth/sign-up/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      console.log('✅ Account created successfully!')
      console.log('\n' + '='.repeat(60))
      console.log('✨ Admin Account Created!')
      console.log('='.repeat(60))
      console.log(`\n📧 Email: ${email}`)
      console.log(`🔑 Password: ${password}`)
      console.log(`\n🎯 Sign in at: http://localhost:3000/sign-in`)
      console.log(`🎯 Then go to: http://localhost:3000/admin`)
      console.log('\n✅ Done!\n')
    } else {
      console.error('❌ Error creating account:', data)
      
      if (data.error?.message?.includes('already exists')) {
        console.log('\n💡 Account already exists! Try signing in directly.')
        console.log('Or delete the account first and try again.')
      }
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    console.log('\n💡 Make sure the dev server is running on http://localhost:3000')
    process.exit(1)
  }
}

createAdminAccount()

