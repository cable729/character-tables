const GITHUB_REPO_URL = 'https://github.com/cable729/character-tables'

export function GitHubContent() {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-slate-600">
      <p>
        Source code, issues, and contributor documentation live on{' '}
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-blue-600 hover:underline"
        >
          GitHub
        </a>
        .
      </p>
      <p>
        The repository README covers development setup, schema docs, and Sage
        integration. Report bugs or request features there.
      </p>
    </div>
  )
}
