import { Menu } from '@headlessui/react'
import { ChevronDownIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: '', href: '#' },
    { name: '', href: '#' },
    { name: '', href: '#' },
    { name: '', href: '#' },
  ]

  return (
    <header className="bg-amber-100 py-4 px-8 border-b-4 border-black">
      <div className="flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <img 
            alt="BonkFun logo" 
            className="w-12 h-12" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDFqT9e91Uq6JkGz7608j-vS-L_qj2iYn3fK3l4N1kO_H5wYl1bA2J6hX8sB7xJ4n-xZ5_y7c5bH9oJ_X6tG0jC8uR8aH9rD4kS5uA6tH_e-k-pW9oT_q-h-h2-g-z-pQ0eI-f-c-o-m"
          />
          <span className="text-3xl font-fredoka text-orange-500">BONKFun</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 font-fredoka text-lg">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="text-gray-700 hover:text-orange-500 transition-colors"
            >
              {item.name}
            </a>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          <button className="btn-cartoon flex items-center">
            <span className="material-icons text-orange-600">account_balance_wallet</span>
            <span className="ml-2">连接钱包</span>
          </button>
          
          {/* Language Selector */}
          <Menu as="div" className="relative">
            <Menu.Button className="btn-cartoon flex items-center">
              <span className="material-icons">language</span>
              <ChevronDownIcon className="w-4 h-4 ml-1" />
            </Menu.Button>
            <Menu.Items className="absolute right-0 mt-2 w-48 bg-white border-2 border-black rounded-lg shadow-cartoon-sm z-50">
              <Menu.Item>
                {({ active }) => (
                  <a href="#" className={`block px-4 py-2 text-sm font-fredoka ${active ? 'bg-yellow-100' : ''}`}>
                    简体中文
                  </a>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <a href="#" className={`block px-4 py-2 text-sm font-fredoka ${active ? 'bg-yellow-100' : ''}`}>
                    English
                  </a>
                )}
              </Menu.Item>
            </Menu.Items>
          </Menu>

          <button className="btn-cartoon">
            <span className="material-icons">light_mode</span>
          </button>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn-cartoon"
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pt-4 border-t-2 border-black">
          <nav className="flex flex-col space-y-2">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-orange-500 font-fredoka text-lg py-2"
              >
                {item.name}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex flex-col space-y-2">
            <button className="btn-cartoon flex items-center justify-center">
              <span className="material-icons text-orange-600">account_balance_wallet</span>
              <span className="ml-2">cc</span>
            </button>
          </div>
        </div>
      )}
    </header>
  )
}