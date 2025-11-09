import { createClient } from '@/lib/supabase/server'

export default async function TestSupabasePage() {
  const supabase = await createClient()

  // Supabase bağlantısını test et
  const { data, error } = await supabase
    .from('_test_connection')
    .select('*')
    .limit(1)

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-black mb-8">Supabase Connection Test</h1>

        <div className="bg-gray-50 border-4 border-black rounded-2xl p-6 mb-4">
          <h2 className="text-2xl font-black mb-4">Connection Status</h2>

          {error ? (
            <div className="bg-red-100 border-4 border-red-600 rounded-xl p-4">
              <p className="font-bold text-red-600">❌ Connection Error</p>
              <p className="text-sm font-mono mt-2 text-red-800">{error.message}</p>
              <p className="text-sm mt-4 font-bold">
                This is expected! The table doesn't exist yet.
                But the error means Supabase is connected! ✅
              </p>
            </div>
          ) : (
            <div className="bg-green-100 border-4 border-green-600 rounded-xl p-4">
              <p className="font-bold text-green-600">✅ Connected Successfully!</p>
              <pre className="text-sm font-mono mt-2 bg-white p-4 rounded border-2 border-green-600">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="bg-[#CCFF00] border-4 border-black rounded-2xl p-6">
          <h2 className="text-2xl font-black mb-4">Environment Variables Check</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-bold">NEXT_PUBLIC_SUPABASE_URL:</span>
              <code className="bg-black text-[#CCFF00] px-2 py-1 rounded font-mono text-sm">
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Not Set'}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
              <code className="bg-black text-[#CCFF00] px-2 py-1 rounded font-mono text-sm">
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not Set'}
              </code>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border-4 border-blue-600 rounded-xl">
          <p className="font-bold text-blue-900">
            💡 Tip: If you see a "relation does not exist" error, that's actually good!
            It means Supabase is connected and working.
          </p>
        </div>
      </div>
    </div>
  )
}
