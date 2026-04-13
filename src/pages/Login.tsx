import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Lock,
  Layers,
  Mail,
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  signInWithGoogle, 
  sendOtp, 
  verifyOtp, 
  updatePassword, 
  signInWithPassword 
} from '@/services/authService';
import { toast } from 'sonner';

type AuthStep = 'initial' | 'otp' | 'set-password' | 'password';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [step, setStep] = React.useState<AuthStep>('initial');
  const [email, setEmail] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await sendOtp(email);
      if (error) throw error;
      toast.success('OTP sent to your email');
      setStep('otp');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await verifyOtp(email, otp);
      if (error) throw error;
      toast.success('Email verified');
      setStep('set-password');
    } catch (error: any) {
      toast.error(error.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { error } = await updatePassword(password);
      if (error) throw error;
      toast.success('Password set successfully');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signInWithPassword(email, password);
      if (error) throw error;
      toast.success('Logged in successfully');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[400px] space-y-8">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg">
            <Layers className="h-7 w-7 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-500 text-sm">Professional Management System</p>
          </div>
        </div>

        <Card className="border shadow-xl rounded-2xl overflow-hidden bg-white">
          <CardHeader className="space-y-1 pt-8 text-center border-b bg-slate-50/50">
            <CardTitle className="text-xl font-bold tracking-tight">
              {step === 'initial' && 'Sign In'}
              {step === 'otp' && 'Verify Identity'}
              {step === 'set-password' && 'Set Password'}
              {step === 'password' && 'Enter Password'}
            </CardTitle>
            <CardDescription className="text-sm text-slate-500">
              {step === 'initial' && 'Access your administrative terminal'}
              {step === 'otp' && `Enter the code sent to ${email}`}
              {step === 'set-password' && 'Create a permanent password for your account'}
              {step === 'password' && 'Enter your administrative password'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-8">
            {step === 'initial' && (
              <div className="space-y-4">
                <Button 
                  className="w-full h-12 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all duration-200 font-medium group"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  <div className="flex items-center justify-center gap-3">
                    <img src="https://www.google.com/favicon.ico" className="h-4 w-4" alt="Google" />
                    <span>Continue with Google</span>
                  </div>
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-400">Or Admin Login</span>
                  </div>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-medium text-slate-500 uppercase">Admin Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="admin@example.com" 
                        className="pl-10 h-11"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" variant="outline" className="w-full h-11" disabled={loading}>
                    Request Access Code
                  </Button>
                  <button 
                    type="button"
                    onClick={() => setStep('password')}
                    className="text-xs text-slate-400 hover:text-slate-900 w-full text-center"
                  >
                    Already have a password? Login here
                  </button>
                </form>
              </div>
            )}

            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-xs font-medium text-slate-500 uppercase">Verification Code</Label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      id="otp" 
                      placeholder="Enter OTP" 
                      className="pl-10 h-11 tracking-[0.5em] text-center font-bold"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-11 bg-slate-900" disabled={loading}>
                  Verify & Continue
                </Button>
              </form>
            )}

            {step === 'set-password' && (
              <form onSubmit={handleSetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input 
                    id="new-password" 
                    type="password" 
                    className="h-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input 
                    id="confirm-password" 
                    type="password" 
                    className="h-11"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-11 bg-slate-900" disabled={loading}>
                  Set Password & Login
                </Button>
              </form>
            )}

            {step === 'password' && (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input 
                    id="login-email" 
                    type="email" 
                    className="h-11"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      id="login-password" 
                      type="password" 
                      className="pl-10 h-11"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-11 bg-slate-900" disabled={loading}>
                  Login
                </Button>
                <button 
                  type="button"
                  onClick={() => setStep('initial')}
                  className="text-xs text-slate-400 hover:text-slate-900 w-full text-center"
                >
                  Back to initial login
                </button>
              </form>
            )}
          </CardContent>
          <CardFooter className="pb-8 flex flex-col space-y-4">
            <div className="flex items-center gap-2 text-xs text-slate-400 justify-center w-full">
              <Lock className="h-3 w-3" />
              Secure encrypted session
            </div>
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-slate-400">
          Authorized personnel only. All activities are monitored.
        </p>
      </div>
    </div>
  );
}
