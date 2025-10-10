import clsx from 'clsx'

export default function Container({ children, className = '', size = 'default' }) {
  const sizeClasses = {
    default: 'max-w-7xl',
    full: 'max-w-full',
    narrow: 'max-w-4xl',
  }

  return (
    <div className={clsx(
      'mx-auto px-4 sm:px-6 lg:px-8',
      sizeClasses[size],
      className
    )}>
      {children}
    </div>
  )
}