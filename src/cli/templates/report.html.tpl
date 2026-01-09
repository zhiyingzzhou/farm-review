<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&family=Share+Tech+Mono&display=swap" rel="stylesheet">
  <style>
    :root {
      --background: 240 20% 4%;
      --foreground: 0 0% 88%;
      --card: 250 30% 8%;
      --card-foreground: 0 0% 88%;
      --muted: 250 20% 15%;
      --muted-foreground: 220 10% 50%;
      --primary: 152 100% 50%;
      --secondary: 300 100% 50%;
      --tertiary: 192 100% 50%;
      --destructive: 350 80% 55%;
      --border: 250 20% 20%;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      background: hsl(var(--background));
      color: hsl(var(--foreground));
      line-height: 1.75;
      padding: 2rem 1.25rem;
    }

    .container {
      max-width: 960px;
      margin: 0 auto;
    }

    h1, h2, h3, h4 {
      margin-top: 1.75rem;
      margin-bottom: 1rem;
      font-family: 'Orbitron', 'Share Tech Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      letter-spacing: 0.04em;
    }

    h1 {
      margin-top: 0;
      font-size: 1.8rem;
      font-weight: 800;
      color: hsl(var(--foreground));
      border-bottom: 1px solid hsl(var(--border));
      padding-bottom: 0.75rem;
    }

    h2 {
      font-size: 1.25rem;
      color: hsl(var(--secondary));
      border-bottom: 1px solid hsl(var(--border));
      padding-bottom: 0.5rem;
    }

    h3 {
      font-size: 1.05rem;
      color: hsl(var(--tertiary));
    }

    h4 {
      font-size: 0.95rem;
      color: hsl(var(--foreground));
      opacity: 0.9;
    }

    p {
      margin-bottom: 1rem;
    }

    blockquote {
      background: hsl(var(--card));
      border: 1px solid hsl(var(--border));
      border-left: 3px solid hsl(var(--primary));
      padding: 1rem;
      margin: 1rem 0;
      color: hsl(var(--muted-foreground));
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
      background: hsl(var(--card));
      border: 1px solid hsl(var(--border));
    }

    th, td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid hsl(var(--border));
      vertical-align: top;
    }

    th {
      background: hsl(var(--muted));
      font-weight: 700;
      color: hsl(var(--foreground));
    }

    code {
      font-family: inherit;
      background: hsl(var(--card));
      border: 1px solid hsl(var(--border));
      padding: 0.15rem 0.35rem;
      border-radius: 4px;
      font-size: 0.92em;
    }

    pre {
      background: hsl(var(--card));
      border: 1px solid hsl(var(--border));
      padding: 1rem;
      overflow-x: auto;
      margin: 1rem 0;
    }

    pre code {
      background: none;
      border: none;
      padding: 0;
    }

    ul, ol {
      margin-left: 1.5rem;
      margin-bottom: 1rem;
    }

    li {
      margin-bottom: 0.5rem;
    }

    a {
      color: hsl(var(--tertiary));
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    hr {
      border: none;
      border-top: 1px solid hsl(var(--border));
      margin: 2rem 0;
    }
  </style>
</head>
<body>
  <div class="container">
    {{content}}
  </div>
</body>
</html>

