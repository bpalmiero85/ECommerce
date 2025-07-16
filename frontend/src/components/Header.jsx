import { Search, ShoppingCart, User } from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'

export function Header() {
  return (
    <header className="w-full px-6 py-4 flex items-center justify-between relative z-10">
      {/* Logo */}
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gradient-to-br from-[var(--neon-green)] to-[var(--neon-purple)] rounded-lg flex items-center justify-center">
          <span className="text-black font-bold text-lg">👻</span>
        </div>
        <span className="text-xl font-bold text-[var(--neon-green)] neon-glow">SPOOKIFY</span>
      </div>

      {/* Navigation */}
      <nav className="hidden md:flex items-center space-x-8">
        <a href="#home" className="text-white hover:text-[var(--neon-green)] transition-colors duration-300">
          Home
        </a>
        <a href="#gallery" className="text-white hover:text-[var(--neon-blue)] transition-colors duration-300">
          Gallery
        </a>
        <a href="#shop" className="text-white hover:text-[var(--neon-purple)] transition-colors duration-300">
          Shop
        </a>
        <a href="#contact" className="text-white hover:text-[var(--neon-pink)] transition-colors duration-300">
          Contact
        </a>
      </nav>

      {/* Right side actions */}
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-white hover:text-[var(--neon-green)] hover:bg-transparent"
        >
          <Search className="w-5 h-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-white hover:text-[var(--neon-blue)] hover:bg-transparent relative"
        >
          <ShoppingCart className="w-5 h-5" />
          <Badge className="absolute -top-2 -right-2 bg-[var(--neon-purple)] text-white border-none min-w-[20px] h-5 rounded-full flex items-center justify-center text-xs">
            0
          </Badge>
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-white hover:text-[var(--neon-pink)] hover:bg-transparent"
        >
          <User className="w-5 h-5" />
        </Button>
      </div>
    </header>
  )
}