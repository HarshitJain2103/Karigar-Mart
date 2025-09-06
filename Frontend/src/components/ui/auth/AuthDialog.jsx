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

export default function AuthDialog({ setOpen }) {
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