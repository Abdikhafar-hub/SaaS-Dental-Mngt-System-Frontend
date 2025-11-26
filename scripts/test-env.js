#!/usr/bin/env node

/* eslint-disable no-undef */

// Test script to verify environment variables are properly configured
console.log('🔍 Testing Environment Variables...\n')

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'INFOBIP_BASE_URL',
  'INFOBIP_API_KEY',
  'INFOBIP_FROM_NUMBER'
]

let allGood = true

requiredVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(`✅ ${varName}: Set`)
  } else {
    console.log(`❌ ${varName}: Missing`)
    allGood = false
  }
})

console.log('\n' + '='.repeat(50))

if (allGood) {
  console.log('🎉 All environment variables are properly configured!')
  console.log('Your application should work correctly in production.')
} else {
  console.log('⚠️  Some environment variables are missing!')
  console.log('Please configure them in your deployment platform.')
  console.log('\nRefer to DEPLOYMENT_GUIDE.md for instructions.')
  process.exit(1)
}

console.log('\n📋 Next steps:')
console.log('1. Deploy your application')
console.log('2. Test the login functionality')
console.log('3. Check browser console for any errors') 