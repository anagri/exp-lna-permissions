import { Link } from 'react-router-dom'

export default function About() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">About</h1>
        <p className="text-lg mb-6">
          This project explores browser permissions for local network access.
        </p>
        <nav className="space-x-4">
          <Link to="/" className="text-blue-600 hover:underline">
            Home
          </Link>
        </nav>
      </div>
    </div>
  )
}
