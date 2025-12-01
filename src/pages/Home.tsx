import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">LNA Permissions Explorer</h1>
        <p className="text-lg mb-6">
          Exploring how Local Network Access (LNA) permissions work across different browsers.
        </p>
        <nav className="space-x-4">
          <Link to="/about" className="text-blue-600 hover:underline">
            About
          </Link>
        </nav>
      </div>
    </div>
  )
}
