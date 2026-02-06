#!/usr/bin/env node

/**
 * Pre-deployment checklist script
 * Jalankan sebelum deploy ke Cloudflare Pages
 */

import { readFileSync } from 'fs';
import dotenv from 'dotenv';

console.log('🔍 EduAdmin - Pre-Deployment Checklist\n');

// Load environment variables
dotenv.config({ path: '.env.local' });

const checks = [
  {
    name: 'Supabase URL configured',
    check: () => {
      const url = process.env.VITE_SUPABASE_URL;
      return url && url !== '' && !url.includes('your-project-id') && url.startsWith('https://');
    },
    message: 'Set a valid VITE_SUPABASE_URL in .env.local'
  },
  {
    name: 'Supabase Anon Key configured',
    check: () => {
      const key = process.env.VITE_SUPABASE_ANON_KEY;
      return key && key !== '' && !key.includes('your-supabase-anon-key') && key.length > 50;
    },
    message: 'Set a valid VITE_SUPABASE_ANON_KEY in .env.local'
  },
  {
    name: 'Gemini API Key configured',
    check: () => {
      const key = process.env.GEMINI_API_KEY;
      if (!key || key.includes('your_gemini')) {
        return 'warning'; // Signifies a warning but doesn't fail the build
      }
      return true;
    },
    message: 'Notice: GEMINI_API_KEY is currently using placeholder. AI features may not work.'
  },
  {
    name: 'Production Login Fallback Disabled',
    check: () => {
      // This is a code check, ensure login code uses the VITE_ALLOW_FALLBACK_AUTH or helper isFallbackAuthAllowed
      try {
        const loginContent = readFileSync('components/Login.tsx', 'utf8');
        return loginContent.includes('isFallbackAuthAllowed') || loginContent.includes('VITE_ALLOW_FALLBACK_AUTH');
      } catch {
        return false;
      }
    },
    message: 'Ensure Login.tsx checks VITE_ALLOW_FALLBACK_AUTH or uses isFallbackAuthAllowed to prevent legacy fallback in production'
  },
  {
    name: 'Logger Utility Used',
    check: () => {
      try {
        const appContent = readFileSync('App.tsx', 'utf8');
        return appContent.includes('logger');
      } catch {
        return false;
      }
    },
    message: 'Ensure logger utility is being used for production-safe logging'
  },
  {
    name: 'Build script exists',
    check: () => {
      try {
        const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
        return pkg.scripts && pkg.scripts.build;
      } catch {
        return false;
      }
    },
    message: 'Add build script to package.json'
  }
];

let allPassed = true;
let hasWarnings = false;

checks.forEach(({ name, check, message }) => {
  const result = check();
  const passed = result === true;
  const warning = result === 'warning';

  const status = passed ? '✅' : (warning ? '⚠️' : '❌');

  console.log(`${status} ${name}`);

  if (!passed && !warning) {
    console.log(`   💡 ${message}`);
    allPassed = false;
  } else if (warning) {
    console.log(`   💡 ${message}`);
    hasWarnings = true;
  }
});

console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('🎉 All checks passed! Ready for deployment.');
  console.log('\n📋 Deployment Steps:');
  console.log('1. Push code to GitHub');
  console.log('2. Connect to Cloudflare Pages');
  console.log('3. Set environment variables in Cloudflare');
  console.log('4. Deploy!');
} else {
  console.log('⚠️  Some checks failed. Please fix before deploying.');
  process.exit(1);
}