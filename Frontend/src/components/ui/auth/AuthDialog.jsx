import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useAuthStore from '@/stores/authStore';
import { useToast } from "@/hooks/use-toast";

// Helper component for the Google G logo SVG
function GoogleIcon(props) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <path
        fill="#FFC107"
        d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
      />
      <path
        fill="#FF3D00"
        d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.519-3.486-11.188-8.166l-6.571,4.819C9.656,39.663,16.318,44,24,44z"
      />
      <path
        fill="#1976D2"
        d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.089,5.571l6.19,5.238C42.022,35.619,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"
      />
    </svg>
  );
}

export default function AuthDialog({ setOpen }) {
  const { toast } = useToast();
  const [error, setError] = useState(null);
  const login = useAuthStore((state) => state.login);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupFirstName, setSignupFirstName] = useState('');
  const [signupLastName, setSignupLastName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');

      login(data); 
      toast({ 
        title: "Login Successful!",
        description: `Welcome back, ${data.user.firstName}.`,
      });
      setOpen(false); 
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: signupFirstName,
          lastName: signupLastName,
          email: signupEmail,
          password: signupPassword
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Signup failed');

      login(data); 
      toast({ 
        title: "Account Created!",
        description: `Welcome to Karigar Mart, ${data.user.firstName}.`,
      });
      setOpen(false); 
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Welcome to Karigar Mart</DialogTitle>
        <DialogDescription>
          Access your account or create a new one to start your journey.
        </DialogDescription>
      </DialogHeader>
      <Tabs defaultValue="login" className="w-full" onValueChange={() => setError(null)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Log In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        
        <TabsContent value="login">
          <Card>
            <CardHeader><CardTitle>Log In</CardTitle></CardHeader>
            <CardContent>
              <a href="http://localhost:8000/api/auth/google">
                <Button variant="outline" className="w-full">
                  <GoogleIcon className="mr-2 h-4 w-4" />
                  Sign in with Google
                </Button>
              </a>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              <form onSubmit={handleLogin}>
                <div className="grid gap-4 py-4">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="login-email">Email</Label>
                    <Input type="email" id="login-email" placeholder="name@example.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                  </div>
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="login-password">Password</Label>
                    <Input type="password" id="login-password" placeholder="Your password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full">Log In</Button>
                </DialogFooter>
                {error && <p className="mt-4 text-center text-sm text-red-500">{error}</p>}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signup">
          <Card>
            <CardHeader><CardTitle>Sign Up</CardTitle></CardHeader>
            <CardContent>
              <a href="http://localhost:8000/api/auth/google">
                <Button variant="outline" className="w-full">
                  <GoogleIcon className="mr-2 h-4 w-4" />
                  Sign up with Google
                </Button>
              </a>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or create an account with</span>
                </div>
              </div>
              <form onSubmit={handleSignup}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="signup-firstname">First Name</Label>
                      <Input id="signup-firstname" placeholder="John" value={signupFirstName} onChange={(e) => setSignupFirstName(e.target.value)} required />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="signup-lastname">Last Name</Label>
                      <Input id="signup-lastname" placeholder="Doe" value={signupLastName} onChange={(e) => setSignupLastName(e.target.value)} required />
                    </div>
                  </div>
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input type="email" id="signup-email" placeholder="name@example.com" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required />
                  </div>
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input type="password" id="signup-password" placeholder="Create a password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full">Create Account</Button>
                </DialogFooter>
                  {error && <p className="mt-4 text-center text-sm text-red-500">{error}</p>}
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DialogContent>
  );
}