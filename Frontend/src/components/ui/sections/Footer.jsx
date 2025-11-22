import React from 'react'

function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="text-center sm:text-left">
            <h4 className="mb-3 font-semibold">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/home" className="hover:underline">Home</a></li>
              <li><a href="/shop" className="hover:underline">Shop</a></li>
              <li><a href="/artisans" className="hover:underline">Artisans</a></li>
              <li><a href="/stories" className="hover:underline">Stories</a></li>
              <li><a href="/contact" className="hover:underline">Contact</a></li>
            </ul>
          </div>
          <div className="text-center sm:text-left">
            <h4 className="mb-3 font-semibold">Follow Us</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {["Instagram", "YouTube", "X (Twitter)", "Facebook"].map((i) => (
                <li key={i}><a href="#" className="hover:underline">{i}</a></li>
              ))}
            </ul>
          </div>
          <div className="text-center sm:text-left">
            <h4 className="mb-3 font-semibold">Payments</h4>
            <p className="text-sm text-muted-foreground">UPI • RuPay • Visa • MasterCard • NetBanking • COD</p>
          </div>
          <div className="text-center sm:text-left">
            <h4 className="mb-3 font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {["Terms of Service", "Privacy Policy", "Returns & Refunds"].map((i) => (
                <li key={i}><a href="#" className="hover:underline">{i}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Karigar Mart. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

export default Footer;