# PowerShell script to update game HTML files in gamefiles/ to match new color scheme

$gamefilesDir = ".\gamefiles"
$newStyle = @"
    <style>
        :root {
            --bg: #0b0b0d;
            --surface: #141417;
            --surface-alt: #1d1d21;
            --accent: #f5a623;
            --accent-fg: #000;
            --text: #e2e2e6;
            --text-muted: #7a7a82;
            --border: rgba(255, 255, 255, 0.07);
            --radius: 10px;
            --radius-sm: 6px;
        }
        html,body { height:100%; margin:0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: var(--bg); color: var(--text); }
        .toolbar { display:flex; gap:.5rem; padding:.5rem; background: rgba(11, 11, 13, 0.88); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-bottom: 1px solid var(--border); color: var(--text); align-items:center; }
        button { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-muted); padding: 5px 13px; font-size: 13px; transition: color 0.12s, border-color 0.12s, background 0.12s; cursor:pointer; line-height: 1; }
        button:hover { color: var(--text); border-color: rgba(255, 255, 255, 0.18); }
        button:active { transform:translateY(1px); }
        .frame-wrapper { height: calc(100% - 56px); background: var(--bg); display:flex; }
        iframe { border:0; width:100%; height:100%; display:block; }
    </style>
"@

Get-ChildItem -Path $gamefilesDir -Filter "*.html" | ForEach-Object {
    $filePath = $_.FullName
    $content = Get-Content -Path $filePath -Raw

    # Check if it has iframe id="gameFrame"
    if ($content -match '<iframe id="gameFrame"') {
        # Replace the old style block
        # Assuming the style is between <style> and </style>
        $content = $content -replace '(?s)<style>.*?</style>', $newStyle

        # Write back
        Set-Content -Path $filePath -Value $content
        Write-Host "Updated $filePath"
    }
}