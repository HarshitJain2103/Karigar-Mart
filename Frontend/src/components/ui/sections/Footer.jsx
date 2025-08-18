// src/components/sections/Footer.jsx

import React from 'react'

// CHANGE: Component name now starts with a capital 'F'
function Footer() {
  return (
    // The JSX you copied here is perfect!
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          <div>
            <h4 className="mb-3 font-semibold">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {["Home", "Categories", "Artisans", "Stories", "Contact"].map((i) => (
                <li key={i}><a href="#" className="hover:underline">{i}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-semibold">Follow Us</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {["Instagram", "YouTube", "X (Twitter)", "Facebook"].map((i) => (
                <li key={i}><a href="#" className="hover:underline">{i}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-semibold">Payments</h4>
            <p className="text-sm text-muted-foreground">UPI • RuPay • Visa • MasterCard • NetBanking • COD</p>
          </div>
          <div>
            <h4 className="mb-3 font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {["Terms of Service", "Privacy Policy", "Returns & Refunds"].map((i) => (
                <li key={i}><a href="#" className="hover:underline">{i}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Karigar Mart. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

// CHANGE: Export the capitalized component name
export default Footer