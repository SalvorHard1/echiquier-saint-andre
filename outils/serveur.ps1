# Petit serveur web local pour tester l'application (aucune installation nécessaire).
# Accessible uniquement depuis cet ordinateur (localhost).
$ErrorActionPreference = 'Stop'
$racine = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot)).TrimEnd('\') + '\'

$types = @{
  '.html' = 'text/html; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.mjs'  = 'text/javascript; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.ico'  = 'image/x-icon'
  '.wasm' = 'application/wasm'
  '.webmanifest' = 'application/manifest+json'
  '.txt'  = 'text/plain; charset=utf-8'
  '.md'   = 'text/plain; charset=utf-8'
}

$serveur = $null
foreach ($p in 8080..8099) {
  try {
    $l = New-Object System.Net.HttpListener
    $l.Prefixes.Add("http://localhost:$p/")
    $l.Start()
    $serveur = $l
    $port = $p
    break
  } catch { }
}
if (-not $serveur) {
  Write-Host "Impossible de démarrer le serveur (ports 8080 à 8099 occupés)." -ForegroundColor Red
  exit 1
}

$url = "http://localhost:$port/"
Write-Host ""
Write-Host "  L'Échiquier de Saint-André - serveur de test" -ForegroundColor Cyan
Write-Host "  Adresse : $url" -ForegroundColor Green
Write-Host "  Pour arrêter : ferme cette fenêtre."
Write-Host ""
if (-not $env:SANS_NAVIGATEUR) { Start-Process $url }

try {
  while ($serveur.IsListening) {
    $ctx = $serveur.GetContext()
    $rep = $ctx.Response
    try {
      $chemin = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
      if ($chemin -eq '' -or $chemin.EndsWith('/')) { $chemin += 'index.html' }
      $fichier = [IO.Path]::GetFullPath([IO.Path]::Combine($racine, $chemin))
      if ($fichier.StartsWith($racine, [StringComparison]::OrdinalIgnoreCase) -and [IO.File]::Exists($fichier)) {
        $octets = [IO.File]::ReadAllBytes($fichier)
        $ext = [IO.Path]::GetExtension($fichier).ToLowerInvariant()
        $rep.ContentType = if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' }
        $rep.Headers.Add('Cache-Control', 'no-store')
        $rep.ContentLength64 = $octets.Length
        $rep.OutputStream.Write($octets, 0, $octets.Length)
        Write-Host "  200  /$chemin" -ForegroundColor DarkGray
      } else {
        $rep.StatusCode = 404
        $octets = [Text.Encoding]::UTF8.GetBytes('404 - fichier introuvable')
        $rep.OutputStream.Write($octets, 0, $octets.Length)
        Write-Host "  404  /$chemin" -ForegroundColor Yellow
      }
    } catch {
      Write-Host "  Erreur : $($_.Exception.Message)" -ForegroundColor Red
    } finally {
      $rep.Close()
    }
  }
} finally {
  $serveur.Stop()
}
