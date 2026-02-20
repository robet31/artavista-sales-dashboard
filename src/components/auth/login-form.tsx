'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Loader2, Lock, User, Facebook, Twitter, Instagram, Mail, CheckCircle } from 'lucide-react'

export function LoginForm() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    if (isLogin) {
      try {
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false
        })

        if (result?.error) {
          setError("Email atau password salah.")
        } else {
          setTimeout(async () => {
            // Get session to check role
            const sessionRes = await fetch('/api/auth/session')
            const session = await sessionRes.json()
            const userRole = session?.user?.role || session?.user?.position
            
            // Redirect based on role
            // MANAGER, GM, ADMIN_PUSAT -> Dashboard (/)
            // ASMAN, ASISTEN_MANAGER, STAFF -> Upload (/upload)
            const managerRoles = ['MANAGER', 'GM', 'ADMIN_PUSAT']
            if (managerRoles.includes(userRole)) {
              router.push('/')
            } else {
              router.push('/upload')
            }
            router.refresh()
          }, 100)
        }
      } catch (err) {
        setError('Terjadi kesalahan koneksi')
      } finally {
        setIsLoading(false)
      }
    } else {
      try {
        const registerData = { 
          name, 
          email, 
          password, 
          position: 'STAFF'
        }
        
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(registerData)
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Registrasi gagal')
        } else {
          setSuccess('Registrasi berhasil! Mengalihkan ke dashboard...')
          setName('')
          
          const loginResult = await signIn('credentials', {
            email,
            password,
            redirect: false
          })
          
          if (loginResult?.error) {
            setSuccess('')
            setEmail('')
            setPassword('')
            setError("Registrasi berhasil! Silakan login dengan akun baru.")
            setIsLogin(true)
          } else {
            setTimeout(() => {
              router.push('/upload')
              router.refresh()
            }, 100)
          }
        }
      } catch (err) {
        console.error('Daftar error:', err)
        setError('Terjadi kesalahan. Silakan coba lagi.')
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 font-sans">
      <div className="flex w-full max-w-[940px] min-h-[600px] bg-white rounded-[30px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] overflow-hidden m-4">
        
        <div className="hidden md:flex flex-col w-[45%] relative">
          <img 
            src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=2070&auto=format&fit=crop" 
            alt="Sunest Systems" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/70 to-blue-800/70" />
          
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-white p-10 text-center">
            <div className="flex flex-col items-center">
               <img 
                 src="/sunest-logo.png" 
                 alt="Sunest Systems" 
                 className="w-24 h-24 mb-4 object-contain bg-white/10 rounded-2xl p-2"
               />
               <h2 className="text-2xl font-black tracking-[0.2em] uppercase leading-none">Sunest Systems</h2>
               <p className="text-[10px] font-medium tracking-[0.4em] opacity-90 mt-2">— DELIVERY MONITORING—</p>
            </div>
            
            
          </div>
        </div>

        <div className="w-full md:w-[55%] relative flex flex-col p-8 md:p-12 justify-center bg-white">
          
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full opacity-80" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-gradient-to-tr from-blue-300 to-blue-400 rounded-full opacity-80" />

          <div className="relative z-10">
            <div className="flex gap-6 mb-4 text-xs font-black uppercase tracking-widest">
              <button 
                type="button"
                onClick={() => { setIsLogin(true); setError(''); setSuccess(''); setName(''); }}
                className={`pb-1 cursor-pointer transition-colors ${isLogin ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}
              >
                Masuk
              </button>
              <button 
                type="button"
                onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}
                className={`pb-1 cursor-pointer transition-colors ${!isLogin ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}
              >
                Daftar
              </button>
            </div>

            <h1 className="text-3xl font-black text-blue-600 mb-4 tracking-tight">
              {isLogin ? 'Masuk' : 'Daftar'}
            </h1>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="min-h-[40px]">
                {error && (
                  <div className="flex items-center justify-center gap-2 py-2 text-xs font-semibold text-red-500 bg-red-50 rounded-lg">
                    <AlertCircle size={14} />
                    {error}
                  </div>
                )}
                {success && (
                  <div className="flex items-center justify-center gap-2 py-2 text-xs font-semibold text-green-600 bg-green-50 rounded-lg">
                    <CheckCircle size={14} />
                    {success}
                  </div>
                )}
              </div>

              {!isLogin && (
                <>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 z-10">
                      <User size={18} />
                    </div>
                    <Input
                      type="text"
                      placeholder="nama lengkap"
                      required={!isLogin}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-12 h-12 bg-[#F3F4F6] border-none rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500/20 placeholder:text-gray-400 text-gray-700 font-medium text-sm"
                    />
                  </div>

                  <p className="text-xs text-gray-500 text-center py-2">
                    Pendaftaran hanya untuk Staff. Manager dan Asisten Manager ditambahkan melalui dashboard.
                  </p>
                </>
              )}

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 z-10">
                  <Mail size={18} />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-12 bg-[#F3F4F6] border-none rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500/20 placeholder:text-gray-400 text-gray-700 font-medium text-sm"
                />
              </div>

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 z-10">
                  <Lock size={18} />
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 h-12 bg-[#F3F4F6] border-none rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500/20 placeholder:text-gray-400 text-gray-700 font-medium text-sm"
                />
              </div>

              <div className="pt-2 flex flex-col items-center">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-blue-400 to-blue-600 hover:brightness-110 text-white font-semibold rounded-full shadow-[0_10px_25px_rgba(59,130,246,0.3)] transition-all active:scale-95 uppercase tracking-wider"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Masuk' : 'Daftar')}
                </Button>
                
                {isLogin && (
                  <button type="button" className="mt-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest hover:text-blue-500 transition-colors">
                    Lupa password?
                  </button>
                )}
              </div>
            </form>

            <div className="mt-6 text-center">
               <button 
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
                className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] hover:text-gray-600 transition-colors"
               >
                  {isLogin ? 'Buat Akun Anda' : 'Sudah punya akun?'} <span className="ml-1">→</span>
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
