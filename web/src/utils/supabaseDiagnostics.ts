/**
 * Supabase Connection Diagnostics
 * Run this in browser console to diagnose Supabase connection issues
 */

export async function diagnoseSupabaseConnection() {
  const diagnostics: {
    step: string;
    status: 'pass' | 'fail' | 'warning';
    message: string;
    details?: any;
  }[] = [];

  console.log('🔍 Starting Supabase Diagnostics...\n');

  // Step 1: Check environment variables
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    diagnostics.push({
      step: 'Environment Variables',
      status: 'fail',
      message: 'VITE_SUPABASE_URL is not set',
    });
  } else if (!supabaseAnonKey) {
    diagnostics.push({
      step: 'Environment Variables',
      status: 'fail',
      message: 'VITE_SUPABASE_ANON_KEY is not set',
    });
  } else {
    diagnostics.push({
      step: 'Environment Variables',
      status: 'pass',
      message: 'Environment variables are set',
      details: {
        url: supabaseUrl,
        keyLength: supabaseAnonKey.length,
      },
    });
  }

  // Step 2: Try to initialize Supabase client
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
      auth: {
        persistSession: false,
      },
    });

    diagnostics.push({
      step: 'Supabase Client Creation',
      status: 'pass',
      message: 'Supabase client created successfully',
    });

    // Step 3: Test basic connection
    try {
      const { data, error } = await supabase.from('users').select('count').limit(0);
      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "no rows returned" which is fine for this test
        diagnostics.push({
          step: 'Database Connection',
          status: 'warning',
          message: `Database connection test: ${error.message}`,
          details: error,
        });
      } else {
        diagnostics.push({
          step: 'Database Connection',
          status: 'pass',
          message: 'Database connection successful',
        });
      }
    } catch (err: any) {
      diagnostics.push({
        step: 'Database Connection',
        status: 'fail',
        message: `Database connection failed: ${err.message}`,
        details: err,
      });
    }

    // Step 4: Check auth configuration
    try {
      const { data: authData, error: authError } = await supabase.auth.getSession();
      if (authError) {
        diagnostics.push({
          step: 'Auth Configuration',
          status: 'warning',
          message: `Auth check: ${authError.message}`,
          details: authError,
        });
      } else {
        diagnostics.push({
          step: 'Auth Configuration',
          status: 'pass',
          message: 'Auth configuration is valid',
          details: {
            hasSession: !!authData.session,
          },
        });
      }
    } catch (err: any) {
      diagnostics.push({
        step: 'Auth Configuration',
        status: 'fail',
        message: `Auth check failed: ${err.message}`,
        details: err,
      });
    }

    // Step 5: Test OAuth provider availability (this will fail if not enabled)
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true, // Don't actually redirect, just test
        },
      });

      if (oauthError) {
        if (oauthError.message?.includes('not enabled') || oauthError.message?.includes('Unsupported provider')) {
          diagnostics.push({
            step: 'Google OAuth Provider',
            status: 'fail',
            message: 'Google OAuth provider is NOT enabled in Supabase dashboard',
            details: {
              error: oauthError.message,
              fix: 'Go to: https://supabase.com/dashboard/project/xppnphkaeczptxuhmpuv/auth/providers and enable Google',
            },
          });
        } else {
          diagnostics.push({
            step: 'Google OAuth Provider',
            status: 'warning',
            message: `OAuth test returned: ${oauthError.message}`,
            details: oauthError,
          });
        }
      } else {
        diagnostics.push({
          step: 'Google OAuth Provider',
          status: 'pass',
          message: 'Google OAuth provider appears to be enabled',
        });
      }
    } catch (err: any) {
      diagnostics.push({
        step: 'Google OAuth Provider',
        status: 'fail',
        message: `OAuth test failed: ${err.message}`,
        details: err,
      });
    }
  } catch (err: any) {
    diagnostics.push({
      step: 'Supabase Client Creation',
      status: 'fail',
      message: `Failed to create Supabase client: ${err.message}`,
      details: err,
    });
  }

  // Print results
  console.log('\n📊 Diagnostic Results:\n');
  diagnostics.forEach((diag) => {
    const icon = diag.status === 'pass' ? '✅' : diag.status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${diag.step}: ${diag.message}`);
    if (diag.details) {
      console.log('   Details:', diag.details);
    }
  });

  // Summary
  const fails = diagnostics.filter((d) => d.status === 'fail').length;
  const warnings = diagnostics.filter((d) => d.status === 'warning').length;
  const passes = diagnostics.filter((d) => d.status === 'pass').length;

  console.log('\n📈 Summary:');
  console.log(`   ✅ Passed: ${passes}`);
  console.log(`   ⚠️  Warnings: ${warnings}`);
  console.log(`   ❌ Failed: ${fails}`);

  if (fails > 0) {
    console.log('\n🔧 Action Required:');
    const failedSteps = diagnostics.filter((d) => d.status === 'fail');
    failedSteps.forEach((step) => {
      console.log(`   - ${step.step}: ${step.message}`);
      if (step.details?.fix) {
        console.log(`     Fix: ${step.details.fix}`);
      }
    });
  }

  return diagnostics;
}

// Make it available globally for easy access
if (typeof window !== 'undefined') {
  (window as any).diagnoseSupabase = diagnoseSupabaseConnection;
}

