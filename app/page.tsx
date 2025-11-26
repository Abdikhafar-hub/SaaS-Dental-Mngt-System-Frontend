"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Shield, Users, Eye, EyeOff, X, Mail, Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import api from "@/lib/axiosConfig"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [resetStep, setResetStep] = useState(1) // 1: email, 2: new password
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async () => {
    if (username && password) {
      try {
        // Authenticate with Express backend (unified login)
        const response = await api.post('/auth/login', {
          email: username,
          password,
        })
        
        const { success, token, user, userType } = response.data
        
        console.log('Login response:', { success, token: !!token, user, userType })
        
        if (!success || !token || !user) {
          toast({
            title: "Login Failed",
            description: "Invalid response from server",
            variant: "destructive",
          })
          return
        }
        
        // Store token and user data
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        localStorage.setItem('userType', userType || user.type || 'user')
        
        // Store clinic context (for regular users)
        if (user.currentClinic) {
          localStorage.setItem('clinicId', user.currentClinic.id)
          localStorage.setItem('clinicName', user.currentClinic.name)
          localStorage.setItem('clinicSlug', user.currentClinic.slug || '')
        }
        
        // Store all clinics for clinic switching (for regular users)
        if (user.clinics && user.clinics.length > 0) {
          localStorage.setItem('userClinics', JSON.stringify(user.clinics))
        }
        
        // Determine user role and redirect
        const roleNames: { [key: string]: string } = {
          super_admin: "Super Administrator",
          admin: "Administrator",
          dentist: "Dentist",
          receptionist: "Receptionist"
        }
        
        const roleColors: { [key: string]: string } = {
          super_admin: "from-red-600 to-orange-600",
          admin: "from-purple-600 to-pink-600",
          dentist: "from-blue-600 to-cyan-600", 
          receptionist: "from-green-600 to-emerald-600"
        }
        
        // Get role from user type or current clinic role
        const finalUserType = userType || user.type
        let userRole = finalUserType
        if (finalUserType === 'user' && user.currentClinic) {
          userRole = user.currentClinic.role
        }
        
        console.log('User type:', finalUserType, 'User role:', userRole)
        
        toast({
          title: `Welcome back, ${user.fullName || username}!`,
          description: `Successfully logged in as ${roleNames[userRole] || userRole}`,
          variant: "default",
          className: `bg-gradient-to-r ${roleColors[userRole] || 'from-gray-600 to-gray-700'} text-white border-0`,
        })
        
        // Redirect based on user type and role
        if (finalUserType === 'super_admin' || user.type === 'super_admin') {
          console.log('Redirecting to super admin dashboard')
          // Use window.location for a hard redirect to ensure it works
          setTimeout(() => {
            window.location.href = '/super-admin/dashboard'
          }, 500)
        } else if (user.currentClinic) {
          const clinicRole = user.currentClinic.role
          console.log('Redirecting to clinic dashboard with role:', clinicRole)
          setTimeout(() => {
            switch (clinicRole) {
              case 'admin':
                window.location.href = '/admin/dashboard'
                break
              case 'dentist':
                window.location.href = '/dentist/dashboard'
                break
              case 'receptionist':
                window.location.href = '/receptionist/dashboard'
                break
              default:
                toast({
                  title: "Unknown Role",
                  description: `Unknown role: ${clinicRole}`,
                  variant: "destructive",
                })
            }
          }, 500)
        } else {
          toast({
            title: "Login Error",
            description: "Unable to determine user role",
            variant: "destructive",
          })
        }
      } catch (error: any) {
        console.error('Login error:', error)
        const errorMessage = error.response?.data?.error || error.message || "An unexpected error occurred during login. Please try again."
        toast({
          title: "Login Failed",
          description: errorMessage,
          variant: "destructive",
        })
      }
    }
  }

  const handleForgotPassword = async () => {
    setShowForgotPasswordModal(true)
    setResetStep(1)
    setResetEmail("")
    setNewPassword("")
    setConfirmPassword("")
  }

  const handleResetPassword = async () => {
    if (resetStep === 1) {
      // Request password reset from Express backend
      if (resetEmail) {
        try {
          await api.post('/auth/forgot-password', {
            email: resetEmail,
          })
          toast({
            title: "Password Reset Link Sent!",
            description: "Please check your email for the password reset link.",
            variant: "default",
            className: "bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0",
          })
          setResetStep(2)
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || error.message || "Failed to send reset link"
          toast({
            title: "Failed to send reset link",
            description: errorMessage,
            variant: "destructive",
          })
        }
      }
    } else if (resetStep === 2) {
      // Reset password with token (if token is in URL) or just show confirmation
      if (newPassword && confirmPassword && newPassword === confirmPassword) {
        try {
          // If there's a reset token in the URL, use it
          const urlParams = new URLSearchParams(window.location.search)
          const resetToken = urlParams.get('token')
          
          if (resetToken) {
            await api.post('/auth/reset-password', {
              token: resetToken,
              password: newPassword,
            })
            toast({
              title: "Password Reset Successful!",
              description: "Your password has been reset. Please login with your new password.",
              variant: "default",
              className: "bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0",
            })
            setShowForgotPasswordModal(false)
            setResetStep(1)
            setResetEmail("")
            setNewPassword("")
            setConfirmPassword("")
          } else {
            // Just show confirmation if no token
            toast({
              title: "Password Reset Link Sent!",
              description: "Please check your email for the password reset link.",
              variant: "default",
              className: "bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0",
            })
            setShowForgotPasswordModal(false)
            setResetStep(1)
            setResetEmail("")
            setNewPassword("")
            setConfirmPassword("")
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || error.message || "Failed to reset password"
          toast({
            title: "Failed to reset password",
            description: errorMessage,
            variant: "destructive",
          })
        }
      } else if (newPassword !== confirmPassword) {
        toast({
          title: "Passwords Do Not Match",
          description: "Please make sure both passwords are identical.",
          variant: "destructive",
        })
      }
    }
  }

  const closeModal = () => {
    setShowForgotPasswordModal(false)
    setResetStep(1)
    setResetEmail("")
    setNewPassword("")
    setConfirmPassword("")
  }


  return (
    <div className="h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cg fill=&quot;none&quot; fillRule=&quot;evenodd&quot;%3E%3Cg fill=&quot;%239C92AC&quot; fillOpacity=&quot;0.1&quot;%3E%3Ccircle cx=&quot;30&quot; cy=&quot;30&quot; r=&quot;2&quot;/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-emerald-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding */}
          <div className="hidden lg:block text-white space-y-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-2xl shadow-2xl">
                  <Image 
                    src="https://res.cloudinary.com/ddkkfumkl/image/upload/v1750490845/20230208_dental-removebg-preview_uapb8o.png"
                    alt="Coco Dental Logo"
                    width={48}
                    height={48}
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Coco Dental Clinic
                  </h1>
                  <p className="text-xl text-gray-300 font-light">Management System</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-semibold text-gray-100">Modern Dental Practice Management</h2>
              <p className="text-lg text-gray-300 leading-relaxed">
                Streamline your dental practice with our comprehensive management system. From patient records to
                appointment scheduling, we've got you covered.
              </p>

              <div className="grid grid-cols-1 gap-3 mt-6">
                <div className="flex items-center space-x-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-lg">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-gray-200">AI-Powered Diagnosis</span>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-gray-200">Secure Patient Data</span>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-2 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-gray-200">Multi-Role Access</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex justify-center lg:justify-end">
            <Card className="w-full max-w-md bg-white/95 backdrop-blur-xl border-0 shadow-2xl">
              <CardHeader className="text-center pb-6">
                <div className="flex justify-center mb-4">
                  <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-4 rounded-2xl shadow-lg animate-pulse">
                    <Image 
                      src="https://res.cloudinary.com/ddkkfumkl/image/upload/v1750490845/20230208_dental-removebg-preview_uapb8o.png"
                      alt="Coco Dental Logo"
                      width={40}
                      height={40}
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                </div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Welcome Back
                </CardTitle>
                <CardDescription className="text-gray-600 text-lg">Sign in to access your dashboard</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-gray-700 font-medium">
                    Username
                  </Label>
                  <Input
                    id="username"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-12 px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>


                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
                  >
                    Forgot Password?
                  </button>
                </div>

                <Button
                  onClick={handleLogin}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                  disabled={!username || !password}
                >
                  {!username || !password ? "Please enter username and password" : "Sign In"}
                </Button>

                
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Branding */}
      <div className="lg:hidden absolute top-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg">
            <Image 
              src="https://res.cloudinary.com/ddkkfumkl/image/upload/v1750490845/20230208_dental-removebg-preview_uapb8o.png"
              alt="Coco Dental Logo"
              width={32}
              height={32}
              className="w-8 h-8 object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Coco Dental
            </h1>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                  <Lock className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {resetStep === 1 ? "Reset Password" : "Create New Password"}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeModal}
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {resetStep === 1 ? (
                <>
                  <div className="text-center space-y-2">
                    <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-4 rounded-xl">
                      <Mail className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-gray-600">Enter your email address to receive a password reset link</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reset-email" className="text-gray-700 font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="Enter your email address"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl"
                    />
                  </div>

                  <Button
                    onClick={handleResetPassword}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    disabled={!resetEmail}
                  >
                    Send Reset Link
                  </Button>
                </>
              ) : (
                <>
                  <div className="text-center space-y-2">
                    <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-4 rounded-xl">
                      <Lock className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-gray-600">Create a new password for your account</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-gray-700 font-medium">
                      New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl pr-12"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-12 px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-gray-700 font-medium">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 rounded-xl pr-12"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-12 px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setResetStep(1)}
                      className="flex-1 h-12 border-2 border-gray-200 hover:border-gray-300 rounded-xl"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleResetPassword}
                      className="flex-1 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                      disabled={!newPassword || !confirmPassword}
                    >
                      Reset Password
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      <Toaster />
    </div>
  )
}
